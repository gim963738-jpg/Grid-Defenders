from pathlib import Path
from PIL import Image,ImageChops
import hashlib,json,shutil,zipfile,datetime
root=Path(__file__).resolve().parents[1]
def read(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def write(p,v):Path(p).write_text(json.dumps(v,ensure_ascii=False,indent=2),encoding='utf-8')
g=read(root/'generation-record.json')
for r in g['records']:
 r['references_at_execution']=[]
 for i,p in enumerate(r['references']):
  role=('edit_target_local_face_direction_only' if i==0 else 'front_identity_reference' if i==1 else 'GC9_whole_style_only') if r['id'].endswith('_face') else ('edit_target_composition_only' if i==0 and 'framing' in r['id'] else 'front_identity_and_scale_reference' if i==0 and 'right_' in r['id'] else 'character_design_only' if i==0 or ('right_' in r['id'] and i==1) else 'GC9_whole_style_only')
  r['references_at_execution'].append({'path':p,'sha256':sha(p),'role':role})
 im=Image.open(r['output'])
 r['width'],r['height']=im.size;r['bytes']=Path(r['output']).stat().st_size;r['sha256']=sha(r['output'])
 r['native_bytes_preserved']=r['sha256']==sha(r['source']);assert r['native_bytes_preserved']
 r['generated_source_file_mtime_utc']=datetime.datetime.fromtimestamp(Path(r['source']).stat().st_mtime,datetime.timezone.utc).isoformat()
write(root/'generation-record.json',g)
designs=['C:/Users/user/Downloads/A Collection of Official MapleStory(2) Artwork.jfif','C:/Users/user/Downloads/🎀.jfif']
inputs=[]
for i,s in enumerate(designs,1):
 p=Path(s);dest=root/'references'/('n%02d_design.jfif'%i);shutil.copyfile(p,dest)
 inputs.append({'id':'n%02d'%i,'gender':'male' if i==1 else 'female','path':s,'copy':dest.relative_to(root).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p),'role':'design_only_not_style'})
style_root=Path('C:/Users/user/orca/workspaces/Grid Defenders/캐릭터디자인2')
bm=read(style_root/'자료/캐릭터그림체/GC9/완성작화기준8장.json')
styles=[]
for b in bm['entries']:
 p=style_root/b['path'];assert sha(p)==b['sha256'];dest=root/'references'/('gc9_'+b['id']+'.png');shutil.copyfile(p,dest)
 styles.append({'id':b['id'],'path':str(p),'copy':dest.relative_to(root).as_posix(),'sha256':sha(p),'role':'whole_style_benchmark'})
imgs=[]
for p in sorted((root/'images').glob('*.png')):
 im=Image.open(p);assert im.format=='PNG';w,h=im.size
 ch=im.convert('RGB').split();lo=ImageChops.darker(ImageChops.darker(ch[0],ch[1]),ch[2]);hi=ImageChops.lighter(ImageChops.lighter(ch[0],ch[1]),ch[2])
 mask=ImageChops.lighter(lo.point(lambda v:255 if v<180 else 0),ImageChops.subtract(hi,lo).point(lambda v:255 if v>45 else 0))
 box=mask.getbbox();m={'top':box[1]/h,'left':box[0]/w,'right':1-box[2]/w,'bottom':1-box[3]/h}
 r=next(x for x in g['records'] if x['selected'] and Path(x['output']).name==p.name)
 imgs.append({'file':p.relative_to(root).as_posix(),'width':w,'height':h,'mode':im.mode,'bytes':p.stat().st_size,'sha256':sha(p),'native_bytes_preserved':sha(p)==sha(r['source']),'generation_id':r['id'],'contrast_bounds':box,'margins_estimate':m,'margin_numeric_pass':m['top']>=.2 and m['left']>=.15 and m['right']>=.15 and m['bottom']>=.06})
assert len(imgs)==6 and len(set(x['sha256'] for x in imgs))==6
sets={}
for c in ['n01','n02']:
 a=[x for x in imgs if Path(x['file']).name.startswith(c)]
 soles=[x['contrast_bounds'][3] for x in a];tops=[x['contrast_bounds'][1] for x in a];heights=[x['contrast_bounds'][3]-x['contrast_bounds'][1] for x in a]
 sets[c]={'sole_baseline_proxy_px':soles,'baseline_spread_px':max(soles)-min(soles),'top_proxy_px':tops,'whole_subject_height_proxy_px':heights,'height_spread_px':max(heights)-min(heights),'note':'Contrast bounds include balloon, hair and props; not anatomical measurement. Small native-generation deviations remain, no postprocessing.'}
geom={'method':'read-only RGB contrast bounding box min<180 OR chroma>45 on bright background; faint outline requires visual check','images':imgs,'sets':sets}
write(root/'evidence/geometry-check.json',geom)
zpath=root/'gc9-new-two-six-views-v01-png.zip'
with zipfile.ZipFile(zpath,'w',compression=zipfile.ZIP_DEFLATED) as z:
 for p in sorted((root/'images').glob('*.png')):z.write(p,p.relative_to(root).as_posix())
with zipfile.ZipFile(zpath) as z:
 assert len(z.namelist())==6
 for a in imgs:assert hashlib.sha256(z.read(a['file'])).hexdigest()==a['sha256']
prior=root.parent/'gc9-four-characters-12views-v01'
old=read(prior/'manifest.json')
assert all(sha(prior/x['file'])==x['sha256'] for x in old['images'])
ack=read(root/'evidence/읽기확인.json');assert len(ack['documents'])==17
assert all(sha(x['path'])==x['sha256'] for x in ack['documents'])
manifest={'task':g['task'],'iteration':1,'role':'splash','deliverable_count':6,'native_generation_calls':len(g['records']),'production':'six_independent_candidates_created','user_visual_approval':'pending_not_claimed','inputs':inputs,'GC9_benchmarks':styles,'images':imgs,'sets':sets,'inferences':['N01 two-pronged silver claw and cyan-inlay arm guard reconstructed from SD source, hidden back robe minimally completed.','N02 small pink prop interpreted as candy/lollipop; round jellyfish companion interpreted as side pouch with strap, tiny white/pink ear decoration as charm; these constructions are inferred from low-resolution pixels.','N02 dark leg sides interpreted as dark violet side stripe on pale tights; modest pink tunic has white hem/cuffs; rear garment and balloon-cord hand attachment minimally completed.'],'omitted_by_instruction':['N01 large cyan combat flames and body-surrounding magic trails suppressed; actual arm-guard cyan inlay retained.'],'postprocessing_of_original_images':False,'prior_12_images_unchanged':True,'reading_document_hashes_current':17,'zip':{'file':zpath.name,'bytes':zpath.stat().st_size,'sha256':sha(zpath),'entries':6,'roundtrip_hash_match':True}}
write(root/'manifest.json',manifest)
write(root/'evidence/integrity-report.json',{'PNG_count':6,'unique_SHA256_count':6,'native_bytes_match':6,'zip_roundtrip_match':6,'current_reading_document_hashes':17,'reference_benchmark_hashes':8,'prior12_unchanged':True,'margin_contrast_pass':sum(x['margin_numeric_pass'] for x in imgs),'sets':sets,'user_approval':False})
cards=[]
for c in ['n01','n02']:
 for v,label in [('front','정면'),('right_threequarter','화면 오른쪽45°'),('right_profile','화면 오른쪽90°')]:
  key=c+'_'+v;f='images/'+key+'.png';a=next(x for x in imgs if x['file']==f)
  cards.append('<article><h2>'+c.upper()+' · '+label+'</h2><button class="art" onclick="openImage(\''+f+'\')"><img src="'+f+'" alt="'+key+'"></button><p><a href="'+f+'" download>PNG 다운로드</a> · <button onclick="openImage(\''+f+'\')">원본 확대</button></p><small>'+format(a['bytes'],',')+' bytes · '+str(a['width'])+'×'+str(a['height'])+' · 안전여백 '+('측정충족' if a['margin_numeric_pass'] else '편차기록')+'</small></article>')
page='''<!doctype html><html lang="ko"><meta charset="utf-8"><title>GC9 신규2명 · 3방향6장</title><style>*{box-sizing:border-box}body{margin:0;padding:24px;background:#f4f2ec;color:#20242a;font:15px system-ui}header{max-width:1400px;margin:auto}h1{font-size:27px}h2{font-size:17px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;max-width:1400px;margin:24px auto}article{background:#fff;border:1px solid #dcd7ce;border-radius:10px;padding:12px}img{width:100%;display:block}.art{padding:0;border:0;width:100%;cursor:zoom-in;background:none}a{color:#1c5485}nav{display:flex;gap:20px;flex-wrap:wrap;margin:20px 0}.refs{display:flex;gap:20px}.refs img{width:150px;max-height:180px;object-fit:contain}.note{background:#fff2cf;padding:12px}dialog{max-width:96vw;max-height:96vh;overflow:auto;padding:12px}dialog img{width:1024px;max-width:none}dialog nav{position:sticky;top:0;background:#fff;padding:10px;margin:0}button{cursor:pointer}small{overflow-wrap:anywhere}@media(max-width:650px){body{padding:10px}.grid{gap:5px}article{padding:6px}h2{font-size:12px}}</style><header><h1>GC9 신규 남녀2명 × 3방향</h1><p>MAIN03-20261109-5F7D5052 / 차수1 / splash · 실제 개별PNG6장 · 사용자 시각합격 대기</p><p class="note">중립 표정·양발 기립·팔 내림과 원본 디자인을 반영한 후보입니다. 원본 바이트를 보존했으며 자동 축소·분해·재조립은 하지 않았습니다. 풍선·작은 소품의 모호한 연결은 추정으로 기록했습니다.</p><nav><a href="gc9-new-two-six-views-v01-png.zip">6장 원본 ZIP</a><a href="manifest.json">해시·해상도</a><a href="generation-record.json">실행 프롬프트·참조</a><a href="검수결과.md">검수 결과</a><a href="보고.md">보고서</a><a href="inspect.html">얼굴·옷·손 확대 검수</a></nav><div class="refs"><a href="references/n01_design.jfif"><img src="references/n01_design.jfif">N01 남성 디자인 원본</a><a href="references/n02_design.jfif"><img src="references/n02_design.jfif">N02 여성 디자인 원본</a></div></header><main class="grid">'''+''.join(cards)+'''</main><dialog id="viewer"><nav><button onclick="viewer.close()">닫기</button><button onclick="large.style.width='1024px'">100%</button><button onclick="large.style.width='2048px'">200%</button><a id="original">원본 열기</a></nav><img id="large"></dialog><script>function openImage(p){large.src=p;original.href=p;large.style.width='1024px';viewer.showModal()}</script></html>'''
(root/'index.html').write_text(page,encoding='utf-8')
print(json.dumps({'images':len(imgs),'calls':len(g['records']),'margins_pass':sum(x['margin_numeric_pass'] for x in imgs),'sets':sets,'zip':manifest['zip']},ensure_ascii=False,indent=2))

