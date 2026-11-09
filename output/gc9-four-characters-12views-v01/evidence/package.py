from pathlib import Path
from PIL import Image,ImageChops
import json,hashlib,shutil,zipfile,datetime,re,html
root=Path(__file__).resolve().parents[1]
def read(p): return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def write(p,v): Path(p).write_text(json.dumps(v,ensure_ascii=False,indent=2),encoding='utf-8')
def sha(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
record=read(root/'generation-record.json')
virtual={}
for r in record['records']:
 r['references_at_execution']=[]
 for i,p in enumerate(r['references']):
  actual=virtual.get(Path(p).name,p) if '/images/' in p and str(root).replace('\\','/') in p else p
  role=('native_candidate_edit_target' if ('framing' in r['id'] or 'baseline' in r['id'] or 'scale' in r['id']) and i==0 else 'front_identity_scale_master' if i==0 and 'right_' in r['id'] else 'character_design_only' if i==0 or ('right_' in r['id'] and i==1 and '/Downloads/' in p) else 'GC9_whole_drawing_style_only')
  r['references_at_execution'].append({'requested_path':p,'preserved_bytes_source':actual,'sha256':sha(actual),'role':role})
 r['generated_file_mtime_utc']=datetime.datetime.fromtimestamp(Path(r['source']).stat().st_mtime,datetime.timezone.utc).isoformat()
 r['output_sha256']=sha(r['output']);r['output_bytes']=Path(r['output']).stat().st_size
 assert r['output_sha256']==sha(r['source'])
 logical=re.match(r'^(c0[1-4]_(?:front|right_threequarter|right_profile))',r['id']).group(1)+'.png'
 if r['id']!='c02_front' and not r.get('rejection'): virtual[logical]=r['source']
write(root/'generation-record.json',record)
refsdir=root/'references';refsdir.mkdir(exist_ok=True)
designs=[Path('C:/Users/user/Downloads/@EEleng__.jfif'),Path('C:/Users/user/Downloads/Aesthetic Anime Drawing Ideas_ 45 Sketch Prompts.jfif'),Path('C:/Users/user/Downloads/다운로드 (28).jfif'),Path('C:/Users/user/Downloads/다운로드 (29).jfif')]
inputs=[]
for i,p in enumerate(designs,1):
 d=refsdir/('design_c%02d.jfif'%i);shutil.copyfile(p,d)
 inputs.append({'id':'c%02d'%i,'path':str(p),'copy':str(d.relative_to(root)),'sha256':sha(p),'bytes':p.stat().st_size,'role':'character_design_only_not_style_master'})
style_root=Path('C:/Users/user/orca/workspaces/Grid Defenders/캐릭터디자인2')
bench=read(style_root/'자료/캐릭터그림체/GC9/완성작화기준8장.json')
style=[]
for b in bench['entries']:
 p=style_root/b['path'];assert sha(p)==b['sha256']
 d=refsdir/('gc9_'+b['id']+'.png');shutil.copyfile(p,d)
 style.append({'id':b['id'],'path':str(p),'copy':str(d.relative_to(root)),'sha256':sha(p),'role':b['role'],'priority':b['priority']})
images=[]
for p in sorted((root/'images').glob('*.png')):
 im=Image.open(p);assert im.format=='PNG';rgb=im.convert('RGB');w,h=im.size
 channels=rgb.split();lo=ImageChops.darker(ImageChops.darker(channels[0],channels[1]),channels[2]);hi=ImageChops.lighter(ImageChops.lighter(channels[0],channels[1]),channels[2])
 dark=lo.point(lambda v:255 if v<180 else 0);chroma=ImageChops.subtract(hi,lo).point(lambda v:255 if v>45 else 0)
 box=ImageChops.lighter(dark,chroma).getbbox()
 margins={'top':box[1]/h,'left':box[0]/w,'right':1-box[2]/w,'bottom':1-box[3]/h}
 selected=[r for r in record['records'] if r['selected'] and Path(r['output']).name==p.name];assert len(selected)==1
 images.append({'file':str(p.relative_to(root)),'width':w,'height':h,'mode':im.mode,'bytes':p.stat().st_size,'sha256':sha(p),'generation_id':selected[0]['id'],'native_bytes_preserved':sha(p)==sha(selected[0]['source']),'contrast_bounds':box,'margins_estimate':margins,'safe_area_numeric_pass':margins['top']>=.2 and margins['left']>=.15 and margins['right']>=.15 and margins['bottom']>=.06})
assert len(images)==12 and len({x['sha256'] for x in images})==12
geometry={'method':'Read-only contrast bounding box: minimum RGB<180 OR max-min>45, light background; faint edges require visual check. No raster transformations or writes.','images':images}
write(root/'evidence/geometry-check.json',geometry)
spread={}
for c in range(1,5):
 group=[x for x in images if Path(x['file']).name.startswith('c%02d_'%c)]
 bottoms=[x['contrast_bounds'][3] for x in group]
 heights=[x['contrast_bounds'][3]-x['contrast_bounds'][1] for x in group]
 spread['c%02d'%c]={'sole_baseline_proxy_range_px':[min(bottoms),max(bottoms)],'baseline_spread_px':max(bottoms)-min(bottoms),'whole_subject_height_proxy_range_px':[min(heights),max(heights)],'note':'Whole-subject bound includes horns/bird/hair and is not anatomical height. Common scale and baseline NOT fully matched.'}
write(root/'evidence/set-consistency.json',spread)
manifest={'task':record['task'],'iteration':1,'role':'splash','generated_deliverable_count':12,'total_native_calls':len(record['records']),'artifact_generation_complete':True,'all_requirements_complete':False,'technical_review':'needs_revision_common_scale_and_baseline','user_visual_approval':'pending_not_claimed','inputs':inputs,'gc9_references':style,'images':images,'set_consistency':spread,'inferences':['C04 unseen lower body minimally completed as black straight trousers and plain black low shoes.','C04 rear collar reads hood-like in side views; unseen rear construction is unverified, no user approval claimed.'],'native_postprocessing':False}
zip_path=root/'gc9-four-characters-12views-v01-png.zip'
with zipfile.ZipFile(zip_path,'w',compression=zipfile.ZIP_DEFLATED) as z:
 for p in sorted((root/'images').glob('*.png')):z.write(p,str(p.relative_to(root)))
with zipfile.ZipFile(zip_path) as z:
 assert len(z.namelist())==12
 for p in images:assert hashlib.sha256(z.read(p['file'].replace('\\','/'))).hexdigest()==p['sha256']
manifest['zip']={'file':zip_path.name,'bytes':zip_path.stat().st_size,'sha256':sha(zip_path),'entries':12,'roundtrip_hash_match':True}
write(root/'manifest.json',manifest)
rows=[]
for c in range(1,5):
 for view,label in [('front','정면'),('right_threequarter','화면 오른쪽 45°'),('right_profile','화면 오른쪽 90°')]:
  f='c%02d_%s.png'%(c,view); rec=next(x for x in images if Path(x['file']).name==f)
  old=root/'evidence'/(f[:-4]+'-before-framing.png')
  oldlink=('<a href="evidence/'+old.name+'">보완 전 후보</a>') if old.exists() else ''
  rows.append('<article><h2>C%02d · %s</h2><a href="images/%s"><img src="images/%s" alt="C%02d %s"></a><p><a href="images/%s">원본 PNG</a> · %s</p><small>%s bytes · 1024×1536 · 여백 수치 %s</small></article>'%(c,label,f,f,c,label,f,oldlink,format(rec['bytes'],','),'충족' if rec['safe_area_numeric_pass'] else '미달'))
page='''<!doctype html><html lang="ko"><meta charset="utf-8"><title>GC9 · 4캐릭터 × 3방향 · 12장 후보</title><style>
*{box-sizing:border-box}body{margin:0;padding:28px;background:#f2f1ec;color:#21252b;font:15px system-ui}h1{font-size:25px}header{max-width:1300px;margin:auto}nav{display:flex;gap:20px;flex-wrap:wrap;margin:20px 0}.notice{background:#ffe9bd;padding:15px;border-left:4px solid #b36a00}.grid{max-width:1500px;margin:24px auto;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}article{background:white;border:1px solid #ddd8ce;border-radius:10px;overflow:hidden;padding:12px}h2{font-size:17px}img{width:100%;display:block}a{color:#194d88}small{overflow-wrap:anywhere}p{line-height:1.6}@media(max-width:700px){body{padding:12px}.grid{gap:6px}article{padding:6px}h2{font-size:12px}small{font-size:10px}}</style>
<header><h1>GC9 · C01–C04 × 3방향</h1><p>MAIN03-20261109-9D2018F2 / 차수1 / splash · 개별 생성 PNG12장 · 사용자 시각 합격 대기</p>
<p class="notice">실제 이미지12장 생성·보존 완료. 공통 배율·발 기준선은 아직 미달이며 전체 기술 합격으로 처리하지 않았습니다. 원본 파일을 후처리로 축소·분해·재조립하지 않았습니다.</p>
<nav><a href="gc9-four-characters-12views-v01-png.zip">12 PNG ZIP</a><a href="inspect.html">얼굴·손 2배 확대 검수</a><a href="manifest.json">해시·해상도</a><a href="generation-record.json">실행 프롬프트24건</a><a href="검수결과.md">검수 결과</a><a href="보고.md">보고</a></nav></header><main class="grid">'''+''.join(rows)+'</main></html>'
(root/'index.html').write_text(page,encoding='utf-8')
centers=[[(512,560),(550,530),(575,475)],[(510,610),(560,570),(565,550)],[(505,475),(540,475),(540,440)],[(515,465),(535,470),(550,435)]]
hands=[[(410,970),(465,880),(545,940)],[(335,970),(420,920),(515,950)],[(480,565),(545,560),(560,545)],[(420,880),(455,835),(555,865)]]
tiles=[]
for c in range(4):
 for v,view in enumerate(['front','right_threequarter','right_profile']):
  f='images/c%02d_%s.png'%(c+1,view);fx,fy=centers[c][v];hx,hy=hands[c][v]
  tiles.append('<article><h2>C%02d %s</h2><div class="crop"><img src="%s" style="--fx:%dpx;--fy:%dpx;--hx:%dpx;--hy:%dpx"></div><a href="%s">원본</a></article>'%(c+1,view,f,180-2*fx,180-2*fy,180-2*hx,180-2*hy,f))
inspect='''<!doctype html><html lang="ko"><meta charset="utf-8"><title>GC9 원본 2배 검수</title><style>body{background:#eeeae1;font:14px system-ui;margin:20px}main{display:grid;grid-template-columns:repeat(3,360px);gap:12px}article{background:#fff;padding:8px}h2{font-size:14px}.crop{width:360px;height:360px;overflow:hidden;position:relative;background:#f4f3ee}.crop img{position:absolute;width:2048px;max-width:none;left:var(--fx);top:var(--fy)}body.hands img{left:var(--hx);top:var(--hy)}button{padding:10px;margin:10px}</style><h1>원본 PNG 2배 확대 · CSS 표시만 사용</h1><p>얼굴·손·의상 연결 검수. 포켓 속 손과 측면에 가려진 손가락은 관찰 불가로 남깁니다.</p><button onclick="document.body.classList.remove('hands')">얼굴</button><button onclick="document.body.classList.add('hands')">손·의상</button><a href="index.html">전체 프레임</a><main>'''+''.join(tiles)+'</main></html>'
(root/'inspect.html').write_text(inspect,encoding='utf-8')
print(json.dumps({'images':len(images),'calls':len(record['records']),'margins_pass':sum(x['safe_area_numeric_pass'] for x in images),'consistency':spread,'zip':manifest['zip']},ensure_ascii=False,indent=2))

