from pathlib import Path
from urllib.parse import urljoin
import requests,re,json
root=Path(__file__).resolve().parent
pages={'priconne':'https://priconne-redive.jp/about/','guardian_tales':'https://guardiantales.com/','odin_sphere':'https://atlus.com/atlus-titles/odinsphere/?ItemID=49','odin_sega':'https://asia.sega.com/osl/system/','reverse_site':'https://re.bluepoch.com/','dfo_site':'https://www.dfoneople.com/gameinfo/overview'}
result=[]
for key,url in pages.items():
    folder=root/'references'/key;folder.mkdir(parents=True,exist_ok=True)
    try:
        rr=requests.get(url,timeout=35);rr.raise_for_status();(folder/'source-page.html').write_bytes(rr.content)
        assets=[urljoin(url,v) for v in re.findall(r'(?:src|data-src|poster)=["\x27]([^"\x27]+)',rr.text)]
        assets+=re.findall(r'[^\s"\'<>]+\.(?:mp4|webm|gif|jpg|png)',rr.text)
        result.append(dict(game=key,url=url,assets=list(dict.fromkeys(assets))))
    except Exception as e:result.append(dict(game=key,error=str(e)))
(root/'official-page-assets.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),'utf-8')
for x in result:print(x['game'],x.get('error') or '\n'.join(x['assets'][:65]))
