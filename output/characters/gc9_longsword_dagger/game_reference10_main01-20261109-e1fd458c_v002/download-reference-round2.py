from pathlib import Path
import requests,json,concurrent.futures
root=Path(__file__).resolve().parent
items=[
('azur_lane','play-shot11.png','https://play-lh.googleusercontent.com/wDgR-bN_Ny27H11Jozyc7P9oUk-LRl2R1-6MPUF-V4qJBPCuGdJVbANOYHR8ryBZh2MhxbVXCF2AY9IBiuAJuQ=s0'),
('azur_lane','play-shot13.png','https://play-lh.googleusercontent.com/zShGFLbgy1LaMbNI1lBFeAKKFWLG-W5t4h-UaWNv6q0iKGdfozdm62HkMI5uKi6SAyj18aoeCPS8kQIWiZhnGA=s0'),
('azur_lane','play-shot14.png','https://play-lh.googleusercontent.com/prw9YiXgCDVLvtaBhgDcFdbSb2SzbUUTUGnERbN8PxlZGurSCclEUmwfRiTkOh3WgHPcT3FMjSv3u2f5ac71ABs=s0'),
('reverse1999','play-shot14.png','https://play-lh.googleusercontent.com/M5NLlIaJDxoakopWH6c-A6WUNYdMCCzoTgEIlh9nLYnNLRvPeI6LZnqgDpypYKs-RHFY5duoZIC7GYL_RYmjWA=s0'),
('reverse1999','play-shot15.png','https://play-lh.googleusercontent.com/QbzFXvkSJv88T3xqjlTsQ5lIH4R7oXT-7euXLB81f00811-EHZqFUHsZauKF6xzuxuEo7Du9v_erJFwTwf8Lhg=s0'),
('reverse1999','play-shot16.png','https://play-lh.googleusercontent.com/h3YakQuj1C__xIcVpbxH9aBxQMmcQjzYa814Z7KXJw4lgeRlwMO-_SbqUyj_VAa_4YW-_u_o7CZksVTfysUHy34=s0')]
def one(item):
    key,name,url=item;p=root/'references'/key/name;p.parent.mkdir(exist_ok=True,parents=True)
    try:
        r=requests.get(url,timeout=45);r.raise_for_status();p.write_bytes(r.content);return dict(game=key,file=str(p.relative_to(root)),url=url,bytes=len(r.content))
    except Exception as e:return dict(game=key,error=str(e))
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:data=list(pool.map(one,items))
for aid,key in [(495910,'dfo'),(3092660,'reverse1999')]:
    u=f'https://store.steampowered.com/api/appdetails?appids={aid}&cc=us&l=english'
    rr=requests.get(u,timeout=45);(root/'references'/key/'steam-appdetails-us.json').write_bytes(rr.content)
    b=rr.json()[str(aid)]
    if b.get('success'):
        for s in b['data'].get('screenshots',[])[:4]:
            p=root/'references'/key/('us-store-shot-'+str(s['id'])+'.jpg')
            q=requests.get(s['path_full'],timeout=45);q.raise_for_status();p.write_bytes(q.content)
            data.append(dict(game=key,file=str(p.relative_to(root)),url=s['path_full'],sourcePage=f'https://store.steampowered.com/app/{aid}/'))
    else:data.append(dict(game=key,error='US appdetails unavailable'))
(root/'download-round2-records.json').write_text(json.dumps(data,indent=2),'utf-8');print(json.dumps(data))
