from pathlib import Path
import json,hashlib,shutil
from PIL import Image
O=Path(__file__).resolve().parents[1]
R=Path('C:/Users/user/orca/workspaces/Grid Defenders/캐릭터디자인2')
def digest(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def record(p):
 p=Path(p); x={'path':str(p),'bytes':p.stat().st_size,'sha256':digest(p)}
 with Image.open(p) as im: x.update(width=im.width,height=im.height,mode=im.mode)
 return x
g=json.loads((O/'generation-record.json').read_text(encoding='utf-8-sig'))
refs=[]
for i,(p,role) in enumerate(zip(g['calls'][0]['referenced_image_paths'],g['calls'][0]['reference_roles'])):
 p=Path(p); q=O/'references'/f'input{i+1}_{p.name}';shutil.copy2(p,q);refs.append({**record(p),'role':role,'local':str(q.relative_to(O))})
observed=[]
for c in ['c03','c04','c05','c06']:
 for v in ['front','threequarter']:
  p=R/f'output/character-redesign-6x2/images/{c}_{v}.png';q=O/'references'/p.name
  if not q.exists():shutil.copy2(p,q)
  observed.append({**record(p),'role':'8-image whole-style benchmark observed','local':str(q.relative_to(O))})
for label,rel in [('old_v06','illustration_3views_v06/front.png'),('failed_v11','gc9_rebuild_v11/front_v11.png')]:
 p=R/'output/characters/gc9_balor'/rel;q=O/'references'/f'{label}.png';shutil.copy2(p,q);observed.append({**record(p),'role':'design observation and comparison ONLY; not generation input/style master','local':str(q.relative_to(O))})
im=Image.open(O/'front.png');w,h=im.size
m={**record(O/'front.png'),'source_copy_matches':digest(O/'front.png')==digest(g['calls'][0]['generated_source'])}
if 'A' in im.getbands():
 a=im.getchannel('A');hist=a.histogram();m['alpha']={'zero':hist[0],'partial':sum(hist[1:255]),'opaque':hist[255],'extrema':a.getextrema()}
 m['bounds_by_alpha']={str(t):a.point(lambda v:255 if v>=t else 0).getbbox() for t in [1,32,128,254]}
 b=m['bounds_by_alpha']['32'];x0,y0,x1,y1=b;m['margins_alpha32']={'top':y0/h,'left':x0/w,'right':(w-x1)/w,'bottom':(h-y1)/h}
 m['safe_area_pass']=y0/h>=.2 and x0/w>=.15 and (w-x1)/w>=.15 and (h-y1)/h>=.06
 m['outer_edge_alpha_max']=max(max(a.crop((0,0,w,1)).getdata()),max(a.crop((0,h-1,w,h)).getdata()),max(a.crop((0,0,1,h)).getdata()),max(a.crop((w-1,0,w,h)).getdata()))
else:m['alpha_missing']=True;m['safe_area_pass']=False
m['manual_shield_estimate']={'crown_y':302,'sole_y':1431,'shield_top_y':542,'shield_bottom_y':1271,'ratio':(1271-542)/(1431-302),'basis':'visible image coordinates; manual approximate; target ~0.667'}
(O/'evidence/measurements.json').write_text(json.dumps(m,ensure_ascii=False,indent=2),encoding='utf-8')
manifest={'task':g['task'],'iteration':1,'actual_png_count':1,'output':m,'generation_inputs':refs,'observed_comparison_sources':observed,'user_aesthetic_approval':None,'postprocessing':False}
(O/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
g['calls'][0]['reference_records']=refs;g['calls'][0]['output_record']=m
(O/'generation-record.json').write_text(json.dumps(g,ensure_ascii=False,indent=2),encoding='utf-8')
cards=''.join(f'<figure><a href="{r["local"]}"><img src="{r["local"]}"></a><figcaption>{Path(r["local"]).stem} · {r["role"]}</figcaption></figure>' for r in observed)
html='''<!doctype html><meta charset="utf-8"><title>Balor GC9 retry · MAIN03-20261109-21F94B82</title><style>body{font:15px system-ui;margin:20px;color:#222}button{padding:8px;margin:4px} .new{width:100%;max-width:640px;background:white;border:1px solid #bbb}.new img{width:100%;display:block}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}figure{margin:0}figure img{width:100%;background:#eee}figcaption{font-size:12px}.crop{width:500px;height:450px;overflow:hidden;position:relative;background:white;border:1px solid #aaa}.crop img{position:absolute;width:2048px;max-width:none}</style><h1>발로르 정면 재제작 후보 1장</h1><p>MAIN03-20261109-21F94B82 / 차수1 / splash · 사용자 화풍 합격 미정 · 기술검수는 검수결과.md 참조</p><p><a href="front.png">실제 PNG</a> · <a href="manifest.json">manifest</a> · <a href="generation-record.json">실행기록</a> · <a href="evidence/measurements.json">알파·여백 계측</a> · <a href="검수결과.md">검수</a></p><button onclick="document.querySelectorAll('.new,.crop').forEach(e=>e.style.background='#fff')">흰 배경</button><button onclick="document.querySelectorAll('.new,.crop').forEach(e=>e.style.background='#888')">중간 회색</button><div class="new"><img src="front.png"></div><h2>원본 200% 확대</h2><button onclick="crop(510,392)">얼굴</button><button onclick="crop(275,858)">오른손 그립</button><button onclick="crop(686,832)">방패</button><button onclick="crop(256,1140)">망토</button><div class="crop"><img id="detail" src="front.png"></div><h2>GC9 전체8장 / 기존 발로르 비교</h2><p>기존 발로르는 디자인·차이 확인용이며 생성입력/작화마스터가 아님. C4 전체/얼굴, C3 금속 우선.</p><div class="grid">'''+cards+'''</div><script>function crop(x,y){let i=document.getElementById('detail');i.style.left=(250-x*2)+'px';i.style.top=(225-y*2)+'px'}crop(510,392)</script>'''
(O/'index.html').write_text(html,encoding='utf-8')
print(json.dumps(m,ensure_ascii=False,indent=2))
