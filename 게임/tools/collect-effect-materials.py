"""Download public, free effect packs; never purchase or log in. Originals stay local."""
from pathlib import Path
from html import unescape
import concurrent.futures, hashlib, json, re, sys, time, zipfile
from urllib.parse import urljoin, urlparse, unquote
import requests

ROOT = Path(__file__).resolve().parents[2] / '.local' / 'effect-materials'
for folder in ['archives', 'sources', 'originals', 'licenses']:
    (ROOT / folder).mkdir(parents=True, exist_ok=True)

def text(html):
    html = re.sub(r'<(script|style)\b.*?</\1>', '', html, flags=re.S|re.I)
    return unescape(re.sub('<[^>]+>', ' ', html))

def get(url):
    r = requests.get(url, timeout=35)
    r.raise_for_status()
    r.encoding = 'utf-8'
    return r

def download(url, target):
    target.parent.mkdir(parents=True, exist_ok=True)
    if not target.exists():
        partial = target.with_suffix(target.suffix + '.part')
        with requests.get(url, stream=True, timeout=50) as r:
            r.raise_for_status()
            with partial.open('wb') as f:
                for chunk in r.iter_content(1024 * 1024): f.write(chunk)
        partial.replace(target)
    return {'path':target.relative_to(ROOT).as_posix(),'bytes':target.stat().st_size,
            'sha256':hashlib.sha256(target.read_bytes()).hexdigest()}

def unpack(pack, archive):
    dest = ROOT / 'originals' / pack
    dest.mkdir(exist_ok=True)
    path = ROOT / archive['path']
    if zipfile.is_zipfile(path):
        with zipfile.ZipFile(path) as z:
            if sum(i.file_size for i in z.infolist()) > 2_000_000_000: raise ValueError('Archive exceeds extraction budget')
            for info in z.infolist():
                target = dest / info.filename
                if not target.resolve().is_relative_to(dest.resolve()): raise ValueError('Unsafe archive member')
                if info.is_dir(): continue
                target.parent.mkdir(parents=True, exist_ok=True)
                if not target.exists(): target.write_bytes(z.read(info))
    else:
        target = dest / path.name
        if not target.exists(): target.write_bytes(path.read_bytes())

def record_oga(url, key=None):
    key = key or 'oga-' + url.rstrip('/').split('/')[-1]
    try:
        html = get(url).text
        (ROOT/'sources'/f'{key}.html').write_text(html,encoding='utf-8')
        title_match = re.search(r'<title[^>]*>(.*?)</title>',html,re.S|re.I)
        title = text(title_match.group(1)).split(' | OpenGameArt.org')[0].strip() if title_match else key
        block = html.split('field-name-field-art-licenses',1)[1].split('field-name-collect',1)[0]
        license_name = 'CC0' if 'publicdomain/zero/' in block else ('CC BY 3.0' if '/licenses/by/3.0' in block else 'unverified')
        author_match = re.search(r"class=['\"]username['\"][^>]*>\s*<a[^>]*>(.*?)</a>",html,re.S)
        author = text(author_match.group(1)).strip() if author_match else 'See source page'
        result = dict(id=key,name=title,author=author,url=url,license=license_name,creditRequired=license_name!='CC0',files=[],status='downloaded')
        if license_name=='unverified': return {**result,'status':'license-review-needed'}
        # Only files explicitly attached by the author, excluding previews and comment attachments.
        block = html.split('field-name-field-art-files',1)[1].split('<ul class="links',1)[0]
        links = re.findall(r'<a[^>]+href="([^"]+)"[^>]+download="([^"]+)"',block)
        for link, name in links:
            if not re.fullmatch(r'[^/\\]+',unquote(name)): raise ValueError('Unsafe filename')
            archive = download(urljoin(url,unescape(link)), ROOT/'archives'/key/unquote(name))
            result['files'].append(archive);unpack(key,archive)
        (ROOT/'licenses'/f'{key}.txt').write_text(f'{title}\nAuthor: {author}\nSource: {url}\nLicense: {license_name}\n\n'+text(html),encoding='utf-8')
        if not result['files']: result['status']='no-attachments'
        print(json.dumps({'pack':key,'status':result['status'],'files':len(result['files'])}),flush=True)
        return result
    except Exception as e:
        print(json.dumps({'pack':key,'error':str(e)}),flush=True)
        return dict(id=key,url=url,status='failed',error=str(e))

def itch(publisher,slug,key,archive_name,license_name):
    base=f'https://{publisher}.itch.io/{slug}'
    target=ROOT/'archives'/archive_name
    if not target.exists():
        session=requests.Session(); page=session.get(base+'/purchase',timeout=25)
        page.raise_for_status()
        token=re.search(r'<meta name="csrf_token" value="([^"]+)"',page.text).group(1)
        r=session.post(base+'/download_url',data={'csrf_token':token},timeout=25);r.raise_for_status()
        ticket=r.json()['url'];page=session.get(ticket,timeout=25);page.raise_for_status()
        upload=re.search(r'data-upload_id="(\d+)"',page.text).group(1)
        # The zero-price page only exposes free files. Never submit the payment form.
        r=session.post(base+'/file/'+upload,data={'csrf_token':token},headers={'Referer':ticket},timeout=25)
        r.raise_for_status(); archive=download(r.json()['url'],target)
    else:
        archive={'path':target.relative_to(ROOT).as_posix(),'bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()}
    unpack(key,archive)
    html=get(base).text
    (ROOT/'licenses'/f'{key}-page.txt').write_text(f'Source: {base}\n'+text(html),encoding='utf-8')
    return dict(id=key,name='Super Pixel Effects Gigapack Free' if key=='untied' else 'Free VFX Asset Pack',
        author='Will Tice / unTied Games' if key=='untied' else 'CodeManu',url=base,license=license_name,
        creditRequired=True,status='downloaded',files=[archive])

def main():
    records=[]
    for args in [('untiedgames','super-pixel-effects-gigapack','untied','untied-free.zip','unTied Games Attribution'),
                 ('codemanu','vfx-free-pack','codemanu','codemanu.zip','CC BY 4.0 (conservative; page also states public domain)')]:
        records.append(itch(*args))
    collection='https://opengameart.org/content/special-effects-cc0'
    html=get(collection).text
    (ROOT/'sources'/'oga-collection.html').write_text(html,encoding='utf-8')
    block=html.split('Collected Art:',1)[1].split('Download Credits',1)[0]
    urls=list(dict.fromkeys(urljoin(collection,u) for u in re.findall(r'href="([^"]+)"',block) if '/content/' in u))
    # Kenney's own OGA upload is the public alternative to an unavailable landing page.
    urls.append('https://opengameart.org/content/particle-pack-80-sprites')
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        records.extend(pool.map(record_oga,urls))
    for key,url in [('kenney-smoke','https://kenney.nl/media/pages/assets/smoke-particles/23249a0d35-1677695171/kenney_smoke-particles.zip')]:
        try:
            archive=download(url,ROOT/'archives'/f'{key}.zip');unpack(key,archive)
            records.append(dict(id=key,name='Smoke Particles',author='Kenney',url='https://kenney.nl/assets/smoke-particles',license='CC0',creditRequired=False,status='downloaded',files=[archive]))
        except Exception as e:records.append(dict(id=key,url=url,status='failed',error=str(e)))
    records.append(dict(id='craftpix',name='CraftPix free effects',url='https://craftpix.net/freebies/free-pixel-magic-sprite-effects-pack/',status='login-required',reason='Official free download page requires the user to sign in. No credentials or access controls bypassed.'))
    report={'date':time.strftime('%Y-%m-%d'),'scope':'Previously recommended free packs and OGA Special Effects collection','packs':records}
    (ROOT/'acquisition.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'packs':len(records),'downloaded':sum(p['status']=='downloaded' for p in records),'bytes':sum(f['bytes'] for p in records for f in p.get('files',[]))}),flush=True)

if __name__=='__main__':
    sys.stdout.reconfigure(encoding='utf-8');main()
