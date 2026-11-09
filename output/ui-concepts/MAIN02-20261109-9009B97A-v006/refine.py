from pathlib import Path
import urllib.request,json
out=Path(__file__).resolve().parent
f=out/'screens.js';s=f.read_text(encoding='utf-8')
old="<button class=\"advance '+(n===1?'primary':'')+'\" data-go=\"'+(n<4?4:6)+'\">'+(n<4?'배치로':'전투 시작')+'</button>"
new="'+(n<4?'<button class=\"advance '+(n===1?'primary':'')+'\" data-go=\"4\">배치로</button>':'<span class=\"prep-count\">병력 6 / 20</span>')+'"
assert old in s
s=s.replace(old,new).replace('✓ 창고 보관 완료</span> · 공격 125 → 105','✓ 보관 완료</span> · 공격 105')
f.write_text(s,encoding='utf-8')
with (out/'layout.css').open('a',encoding='utf-8') as o:o.write('\n.prep-count{width:88px;height:48px;display:flex;align-items:center;justify-content:center;font-size:12px;color:#c0d1c9;flex-shrink:0}.item-context p{white-space:nowrap}.item-context .destinations{position:absolute;top:54px;left:0;right:0;margin-top:0}.destinations button{flex:0 0 135px;white-space:nowrap}\n')
try:
 data=json.load(urllib.request.urlopen('https://store.steampowered.com/api/appdetails?appids=669330&filters=screenshots',timeout=20))['669330']['data']['screenshots']
 refs=json.loads((out/'참고조회.json').read_text(encoding='utf-8'))
 for i in [3,5]:
  url=data[i]['path_full'];f=out/'references'/('mecha-ui-'+str(i)+'.jpg');urllib.request.urlretrieve(url,f);refs.append(dict(title='Mechabellum screenshot '+str(i),url='https://store.steampowered.com/app/669330/Mechabellum/',image=url,file=str(f),viewedDate='2026-11-09'))
 (out/'참고조회.json').write_text(json.dumps(refs,ensure_ascii=False,indent=2),encoding='utf-8')
except Exception as e:print('Additional Mechabellum reference fetch:',e)
print('Context action alignment and one primary action refined')
