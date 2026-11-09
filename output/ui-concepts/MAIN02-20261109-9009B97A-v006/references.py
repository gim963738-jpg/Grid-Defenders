from pathlib import Path
import urllib.request,json
out=Path(__file__).resolve().parent;folder=out/'references';folder.mkdir(exist_ok=True)
refs=[]
for app,name in [(669330,'Mechabellum'),(2427700,'Backpack Battles')]:
 try:
  data=json.load(urllib.request.urlopen('https://store.steampowered.com/api/appdetails?appids='+str(app)+'&filters=screenshots',timeout=25))
  url=data[str(app)]['data']['screenshots'][0]['path_full'];file=folder/(str(app)+'.jpg')
  urllib.request.urlretrieve(url,file)
  refs.append(dict(title=name,url='https://store.steampowered.com/app/'+str(app)+'/',image=url,file=str(file),viewedDate='2026-11-09'))
 except Exception as e:refs.append(dict(title=name,error=str(e)))
url='https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/clans/35576831/532b235f03900a17b624925c087099da1d65993e.png'
try:
 f=folder/'last-spell-phases.png';urllib.request.urlretrieve(url,f);refs.append(dict(title='The Last Spell · 2021 phase diagram',url='https://lastspell.com/new-features-1/',image=url,file=str(f),viewedDate='2026-11-09'))
except Exception as e:refs.append(dict(title='The Last Spell',error=str(e)))
(out/'참고조회.json').write_text(json.dumps(refs,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(refs,ensure_ascii=False))
