from pathlib import Path
import requests,json
root=Path(__file__).resolve().parent;out=[]
for key,filename in [('counterside','steam-appdetails.json'),('reverse1999','steam-appdetails-us.json'),('dfo','steam-appdetails-us.json')]:
    raw=json.loads((root/'references'/key/filename).read_bytes());d=next(iter(raw.values())).get('data',{})
    shots=d.get('screenshots',[]);print(key,len(shots))
    for s in shots:
        if s['id']<4:continue
        p=root/'references'/key/('extra-store-shot-'+str(s['id'])+'.jpg')
        r=requests.get(s['path_full'],timeout=45);r.raise_for_status();p.write_bytes(r.content)
        out.append(dict(game=key,file=str(p.relative_to(root)),url=s['path_full'],source='official Steam publisher store screenshot'))
(root/'download-extra-steam.json').write_text(json.dumps(out,indent=2),'utf-8')
