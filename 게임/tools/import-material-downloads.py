"""Import the user's ordinary browser downloads without reading login credentials."""
from pathlib import Path
import importlib.util, json, hashlib, shutil, re, sys
import requests

sys.stdout.reconfigure(encoding='utf-8')
spec=importlib.util.spec_from_file_location('collector',Path(__file__).with_name('collect-effect-materials.py'))
c=importlib.util.module_from_spec(spec);spec.loader.exec_module(c)
root=c.ROOT
report=json.loads((root/'acquisition.json').read_text(encoding='utf-8'))
packs={p['id']:p for p in report['packs']}
downloads=Path.home()/'Downloads'
items=json.loads((root/'sources'/'craftpix-packs.json').read_text(encoding='utf-8'))
for item in items:
    slug=item['id'].removeprefix('craftpix-')
    matches=list(downloads.glob('craftpix-net-*-'+slug+'.zip'))
    if not matches:continue
    src=max(matches,key=lambda p:p.stat().st_mtime)
    target=root/'archives'/src.name
    if not target.exists():shutil.copy2(src,target)
    archive={'path':target.relative_to(root).as_posix(),'bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()}
    c.unpack(item['id'],archive)
    packs[item['id']]={'id':item['id'],'name':slug.replace('-',' ').title(),'author':'CraftPix.net','url':item['url'],
       'license':'CraftPix Free License','licenseUrl':'https://craftpix.net/file-licenses/','creditRequired':False,'status':'downloaded','files':[archive],
       'restriction':'Private editor and commercial game use; do not redistribute source art as an asset library or an export tool.'}
    print(item['id'],archive['bytes'],flush=True)
src=downloads/'kenney_smoke-particles.zip'
if src.exists():
    target=root/'archives'/src.name
    if not target.exists():shutil.copy2(src,target)
    archive={'path':target.relative_to(root).as_posix(),'bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()}
    c.unpack('kenney-smoke',archive)
    packs['kenney-smoke']={'id':'kenney-smoke','name':'Smoke Particles','author':'Kenney','url':'https://kenney.nl/assets/smoke-particles','license':'CC0','creditRequired':False,'status':'downloaded','files':[archive]}
if all(it['id'] in packs for it in items):packs.pop('craftpix',None)
report['packs']=list(packs.values())
(root/'acquisition.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
url='https://craftpix.net/file-licenses/'
r=requests.get(url,timeout=30);r.raise_for_status()
(root/'licenses'/'craftpix-file-licenses.html').write_text(r.text,encoding='utf-8')
(root/'licenses'/'craftpix-file-licenses.txt').write_text('Source: '+url+'\n'+c.text(r.text),encoding='utf-8')
print('Downloaded packs:',sum(p['status']=='downloaded' for p in report['packs']))
