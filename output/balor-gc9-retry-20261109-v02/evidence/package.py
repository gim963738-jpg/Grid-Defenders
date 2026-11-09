from pathlib import Path
from PIL import Image
import hashlib,json,shutil
O=Path(__file__).resolve().parents[1]
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def record(p):
 p=Path(p)
 with Image.open(p) as i:return {'path':str(p),'bytes':p.stat().st_size,'sha256':sha(p),'width':i.width,'height':i.height,'mode':i.mode}
def measure(p):
 r=record(p);i=Image.open(p);w,h=i.size
 if 'A' not in i.getbands():r['alpha_missing']=True;return r
 a=i.getchannel('A');hist=a.histogram();r['alpha']={'zero':hist[0],'partial':sum(hist[1:255]),'opaque':hist[255],'extrema':a.getextrema()}
 r['bounds_by_alpha']={str(t):a.point(lambda x:255 if x>=t else 0).getbbox() for t in [1,32,128,254]}
 b=r['bounds_by_alpha']['32'];x0,y0,x1,y1=b;r['margins_alpha32']={'top':y0/h,'left':x0/w,'right':(w-x1)/w,'bottom':(h-y1)/h};r['safe_area_pass']=y0/h>=.2 and x0/w>=.15 and (w-x1)/w>=.15 and (h-y1)/h>=.06
 r['outer_edge_alpha_max']=max(a.crop((0,0,w,1)).getextrema()[1],a.crop((0,h-1,w,h)).getextrema()[1],a.crop((0,0,1,h)).getextrema()[1],a.crop((w-1,0,w,h)).getextrema()[1]);return r
g=json.loads((O/'generation-record.json').read_text(encoding='utf-8'))
refs=[]
for n,(p,role) in enumerate(zip(g['calls'][0]['referenced_image_paths'],g['calls'][0]['reference_roles'])):
 p=Path(p);q=O/'references'/f'input{n+1}_{p.name}';shutil.copy2(p,q);refs.append({**record(p),'role':role,'local':str(q.relative_to(O))})
before=measure(O/'references/before-v01.png');after=measure(O/'front.png');after['source_copy_matches']=sha(O/'front.png')==sha(g['calls'][0]['generated_source'])
m={'task':g['task'],'iteration':2,'actual_generated_pngs':1,'before':before,'after':after,'inputs':refs,'postprocessing':False,'user_approval':None,'technical_acceptance':False}
(O/'manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2),encoding='utf-8');(O/'evidence/measurements.json').write_text(json.dumps({'before':before,'after':after},ensure_ascii=False,indent=2),encoding='utf-8')
g['calls'][0]['reference_records']=refs;g['calls'][0]['output_record']=after;(O/'generation-record.json').write_text(json.dumps(g,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'before':before,'after':after},ensure_ascii=False,indent=2))
