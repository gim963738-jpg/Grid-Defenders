from pathlib import Path
import json,hashlib,shutil
from PIL import Image

root=Path(__file__).resolve().parent
specs=json.loads((root/'generation-specs.json').read_text('utf-8-sig'))
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
assets=[]
for s in specs:
    p=root/s['file']
    if not p.exists(): continue
    im=Image.open(p).convert('RGBA')
    alpha=im.getchannel('A')
    box=alpha.point(lambda a:255 if a>=32 else 0).getbbox()
    record=json.loads((p.parent/('model-'+s['model']+'-generation.json')).read_text('utf-8-sig'))
    generated=Path(record['generatedSource'])
    assert sha(p)==sha(generated),str(p)+' output bytes changed'
    meta=dict(file=s['file'],id=s['id'],label=s['name'],model=s['model'],width=im.width,height=im.height,alphaRange=alpha.getextrema(),bounds=box,bodyHeight=box[3]-box[1],footY=box[3]-1,footX=(box[0]+box[2])/2,footXIsSupportCenter=False,measurement='alpha>=32 silhouette; hair/sole vertical extremes reviewed visually; approximate painted-edge uncertainty 2-10px; footX is silhouette horizontal center for gallery only, not game support anchor',sha256=sha(p),source=s['referenced_image_paths'][0],inputSha256=sha(Path(s['referenced_image_paths'][0])),generatedSource=str(generated),nativeBytesEqual=True)
    assets.append(meta)
    (p.parent/('model-'+s['model']+'-metadata.json')).write_text(json.dumps(meta,ensure_ascii=False,indent=2),'utf-8')
references=[]
for m in ['a','b']:
    source=Path(next(s['referenced_image_paths'][0] for s in specs if s['model']==m))
    dest=root/('original-model-'+m+'.png')
    if not dest.exists(): shutil.copyfile(source,dest)
    assert sha(source)==sha(dest)
    im=Image.open(dest).convert('RGBA');a=im.getchannel('A');box=a.point(lambda x:255 if x>=32 else 0).getbbox()
    references.append(dict(file=dest.name,id='original',label='원형',model=m,width=im.width,height=im.height,bounds=box,bodyHeight=box[3]-box[1],footY=box[3]-1,sha256=sha(dest),source=str(source)))
manifest=dict(task='MAIN01-20261109-E1FD458C',iteration=1,assets=assets,references=references,originalBytesPreserved=True,gameIntegration=False)
(root/'asset-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),'utf-8')
records=[json.loads((root/a['id']/('model-'+a['model']+'-generation.json')).read_text('utf-8-sig')) for a in assets]
(root/'generation-records.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),'utf-8')
html='''<!doctype html><html lang="ko"><meta charset="utf-8"><title>20가지 표현 × 두 모델</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#f3f0e9;color:#192333;font:14px "Malgun Gothic",sans-serif}body.dark{background:#202733;color:#eee}header{padding:16px 22px;border-bottom:1px solid #8884;position:relative}h1{font-size:22px;margin:0 0 8px}p{margin:5px 0}button,a{font:inherit;color:inherit;margin-right:10px}button{padding:7px 12px}#grid{display:grid;gap:12px;padding:16px;grid-template-columns:repeat(5,minmax(0,1fr))}.card{border:1px solid #8886;border-radius:9px;overflow:hidden;background:#ffffff40}.dark .card{background:#0002}.label{height:40px;padding:10px;font-weight:700}.pair{display:grid;grid-template-columns:1fr 1fr}.model{position:relative;overflow:hidden;border-right:1px solid #8882}.stage{position:relative;overflow:visible;margin:0 8px;border-bottom:1px dashed #8885}.stage img{position:absolute;max-width:none;transform:none}.modeltag{height:25px;text-align:center;font-size:12px}.nolabel .label{color:transparent}.nolabel .modeltag{visibility:hidden}.links{padding:7px;font-size:12px}body.capture .links{display:none}body.capture header{height:90px}body.capture #grid{padding:10px;gap:10px}#viewer{border:0;padding:15px;max-width:95vw;background:#f4f1ea;color:#202733}#viewer img{max-height:85vh;max-width:90vw}.dark #viewer{background:#202733;color:white}.orig{border-color:#b79b46}.note{color:#777;font-size:12px}
@media(max-width:900px){body:not(.capture) #grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
</style>
<header><h1>20가지 2D 표현 · A SD / B 일러스트 신체 비율</h1><p>원형 비율·오른쪽 앞사선 전투준비 자세를 유지한 표현 탐색. 같은 표시 높이·발선의 CSS 등비 비교.</p><nav><button id="theme">밝게 / 어둡게</button><button id="labels">스타일명 숨김 / 표시</button><button id="small">작은 표시 72px</button><a href="?">전체</a><a href="?group=1">01–05</a><a href="?group=2">06–10</a><a href="?group=3">11–15</a><a href="?group=4">16–20</a><a href="?original=1">두 원형과 비교</a><a href="검수.md">검수</a></nav></header><main id="grid"></main><dialog id="viewer"><button onclick="this.parentElement.close()">닫기</button><div></div></dialog>
<script>
const data=__DATA__,params=new URLSearchParams(location.search),grid=document.querySelector('#grid');let small=false;
let list=data.assets;if(params.has('pilot'))list=list.filter(a=>['03_flat_vector','06_watercolor','08_brush_ink','14_paper_cut'].includes(a.id));if(params.has('group')){let n=+params.get('group');list=list.filter(a=>+a.id.slice(0,2)>(n-1)*5&&+a.id.slice(0,2)<=n*5)}
if(params.has('original'))list=[...data.references,...list];
const ids=[...new Set(list.map(a=>a.id))];
for(const id of ids){const aa=list.filter(a=>a.id===id),c=document.createElement('section');c.className='card '+(id==='original'?'orig':'');c.innerHTML='<div class="label">'+(id==='original'?'원형':id.slice(0,2)+' '+aa[0].label)+'</div><div class="pair"></div>';for(const a of aa){let m=document.createElement('div');m.className='model';m.innerHTML='<div class="stage"><img alt="'+a.id+' model '+a.model+'" src="'+a.file+'"></div><div class="modeltag">'+(a.model==='a'?'A · SD':'B · 일러스트 비율')+'</div><div class="links"><a href="'+a.file+'" target="_blank">생성 PNG 원본</a></div>';m.querySelector('img').onclick=()=>{const v=document.querySelector('#viewer');v.querySelector('div').innerHTML='<img src="'+a.file+'">';v.showModal()};m.dataset.asset=JSON.stringify(a);c.querySelector('.pair').append(m)}grid.append(c)}
function layout(){const cap=params.has('capture'),group=params.has('group')||params.has('pilot');if(cap)document.body.classList.add('capture');const models=[...document.querySelectorAll('.model')],desired=small?72:cap?(group?330:210):240;const maxRatio=Math.max(...models.map(m=>{const a=JSON.parse(m.dataset.asset);return (a.bounds[2]-a.bounds[0]+20)/a.bodyHeight}));const target=Math.min(desired,Math.min(...models.map(m=>m.clientWidth-16))/maxRatio);for(const m of models){const a=JSON.parse(m.dataset.asset),s=m.querySelector('.stage'),img=s.querySelector('img');let w=m.clientWidth-16,scale=target/a.bodyHeight;let shown=a.bodyHeight*scale,base=small?90:cap?(group?370:235):275;s.style.height=(base+12)+'px';img.style.width=(a.width*scale)+'px';img.style.height=(a.height*scale)+'px';img.style.left=((w-a.width*scale)/2)+'px';img.style.top=(base-a.footY*scale)+'px';m.dataset.displayBodyHeight=shown}}
document.querySelector('#theme').onclick=()=>document.body.classList.toggle('dark');document.querySelector('#labels').onclick=()=>document.body.classList.toggle('nolabel');document.querySelector('#small').onclick=()=>{small=!small;layout()};window.setSmall=v=>{small=v;layout()};addEventListener('resize',layout);Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))).then(layout);layout();
</script></html>'''
(root/'index.html').write_text(html.replace('__DATA__',json.dumps(manifest,ensure_ascii=False)),'utf-8')
print(json.dumps(dict(assets=len(assets),styles=len(set(a['id'] for a in assets)),references=len(references))))
