from pathlib import Path
import json,requests,concurrent.futures
root=Path(__file__).resolve().parent
apps={'another_eden':1252600,'reverse1999':3092660,'counterside':1976440,'epic_seven':5019180,'dfo':495910}
def fetch(item):
    key,aid=item
    folder=root/'references'/key;folder.mkdir(parents=True,exist_ok=True)
    url=f'https://store.steampowered.com/api/appdetails?appids={aid}&l=english'
    response=requests.get(url,timeout=45);response.raise_for_status();(folder/'steam-appdetails.json').write_bytes(response.content)
    blob=response.json()[str(aid)]
    if not blob.get('success'): return dict(game=key,error='appdetails not available')
    d=blob['data'];files=[]
    for shot in d.get('screenshots',[])[:5]:
        u=shot['path_full'];p=folder/('store-shot-'+str(shot['id'])+'.jpg')
        rr=requests.get(u,timeout=45);rr.raise_for_status();p.write_bytes(rr.content);files.append(dict(file=str(p.relative_to(root)),imageUrl=u,sourcePage=f'https://store.steampowered.com/app/{aid}/',screenshotId=shot['id']))
    return dict(game=key,name=d['name'],appId=aid,source=url,description=d.get('detailed_description'),files=files)
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool: data=list(pool.map(fetch,apps.items()))
(root/'reference-candidates-steam.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),'utf-8')
print(json.dumps([dict(game=x['game'],files=len(x.get('files',[])),error=x.get('error')) for x in data]))
