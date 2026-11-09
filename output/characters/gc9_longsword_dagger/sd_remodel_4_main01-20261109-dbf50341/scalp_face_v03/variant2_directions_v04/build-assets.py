from pathlib import Path
from PIL import Image
import hashlib,json
D=Path(__file__).resolve().parent
def sha(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def dump(n,o): (D/n).write_text(json.dumps(o,ensure_ascii=False,indent=2),encoding='utf-8')
native='C:/Users/user/.codex/generated_images/01a1bf68-4705-71f0-9449-07a1041b38d9/'
sources=[D.parent/'variant-2-front.png',Path(native+'exec-052767cf-d360-4739-ab0b-dab1a93bce10.png'),Path(native+'exec-1b0413fc-b78d-4b51-b532-26e2ccbe36b3.png')]
files=['variant-2-front.png','variant-2-right-045.png','variant-2-right-090.png']
dirs=['front','right45','right90']; angles=['정면','오른쪽 앞45°','오른쪽 정90°']
# ROIs exclude sword tips; hidden crown/chin are anatomical estimates, never hair-whorl measurements.
specs=[dict(head=(280,0,570,500),feet=(390,1200,390,175),footX=578,crown=160,chin=487,face=(473,300,230,187)),dict(head=(300,0,490,470),feet=(395,1200,390,170),footX=585,crown=150,chin=455,face=(535,285,162,170)),dict(head=(230,0,560,500),feet=(450,1280,280,170),footX=580,crown=140,chin=480,face=(530,280,170,200))]
assets=[]
def bounds_roi(mask,r):
 x,y,w,h=r;b=mask.crop((x,y,x+w,y+h)).getbbox();return [b[0]+x,b[1]+y,b[2]+x,b[3]+y]
for file,direction,source,s in zip(files,dirs,sources,specs):
 im=Image.open(D/file);alpha=im.getchannel('A');mask=alpha.point(lambda x:255 if x>=32 else 0)
 hb=bounds_roi(mask,s['head']);fb=bounds_roi(mask,s['feet']);top=hb[1];sole=fb[3]-1
 # Authoritative front measurement retained exactly, with identical pixel ROI result checked.
 if direction=='front': assert top==25 and sole==1355
 a=dict(variant=6,direction=direction,file=file,width=im.width,height=im.height,bodyHeight=sole-top+1,footX=s['footX'],footY=sole,label='신규2안',sha256=sha(D/file),source=str(source),sourceSha256=sha(source),sourceBytesMatch=sha(D/file)==sha(source),mode=im.mode,alphaMinMax=alpha.getextrema(),bounds=mask.getbbox(),hairTop=top,scalpCrown=dict(y=s['crown'],estimated=True,uncertaintyPx=40,method='Plausible cranial oval from forehead/temple and ear, hidden by layered hair; not hair spike/whorl'),chin=dict(y=s['chin'],estimated=True,uncertaintyPx=10),faceBounds=dict(x=s['face'][0],y=s['face'][1],width=s['face'][2],height=s['face'][3],estimated=True,uncertaintyPx=15,meaning='Projected facial envelope, fringe/eye included; not segmented skin area; widths not comparable across yaw'),measurement=dict(alphaThreshold=32,headROI=s['head'],feetROI=s['feet'],headAlphaBounds=hb,feetAlphaBounds=fb,bodyHeightMethod='hairTop from head ROI through sole from feet ROI inclusive, excludes sword tips',footXMethod='Manual estimate of support center between visible sole contacts; cannot infer hidden contact exactly',footXUncertaintyPx=30,footYUncertaintyPx=3,bodyHeightUncertaintyPx=4))
 a['estimatedHeadToBodyRatio']=(s['chin']-s['crown']+1)/a['bodyHeight']
 a['hairTopToChinOverBodyHeight']=(s['chin']-top+1)/a['bodyHeight']
 assets.append(a)
assert all(a['sourceBytesMatch'] for a in assets)
dump('asset-manifest.json',dict(task='MAIN01-20261109-DBF50341',iteration=4,role='characters',masterSha256=assets[0]['sha256'],variantIdMeaning='6 = scalp_face_v03 신규2안 in developer compareArt; not legacy variant2',compareArt=assets,individualPngResampled=False,coordinateSystem='native pixels, top-left, bounds right/bottom exclusive; bodyHeight hairTop through sole inclusive',uncertaintyNote='Scalp hidden and estimated; no exact equal head-unit or new common proportion claim'))
for a in assets: print(a['direction'],a['width'],a['height'],'hairTop',a['hairTop'],'foot',a['footX'],a['footY'],'body',a['bodyHeight'],'headRatios',round(a['estimatedHeadToBodyRatio'],3),round(a['hairTopToChinOverBodyHeight'],3))

def picture(a,height,stageH,anchorY):
 scale=height/a['bodyHeight'];left=240-a['footX']*scale;top=anchorY-a['footY']*scale
 return f'<img src="{a["file"]}" alt="{angles[dirs.index(a["direction"])]}" data-display-height="{height}" style="width:{a["width"]*scale:.5f}px;left:{left:.5f}px;top:{top:.5f}px" loading="eager">'
cards=''.join(f'<article><h3>{angle}</h3><button class="stage" data-file="{a["file"]}" data-label="{angle}">{picture(a,500,600,560)}</button></article>' for a,angle in zip(assets,angles))
small=''
for height in [57,72]:
 small+=f'<h2>작은 표시 · 전체 키 {height} CSS px</h2><div class="smallrow">'
 for a,angle in zip(assets,angles):
  scale=height/a['bodyHeight'];w=a['width']*scale;h=a['height']*scale
  small+=f'<div><span>{angle}</span><button class="tiny" data-file="{a["file"]}" data-label="{angle}"><img src="{a["file"]}" alt="{angle}" data-display-height="{height}" style="width:{w:.5f}px;left:calc(50% - {a["footX"]*scale:.5f}px);top:{95-a["footY"]*scale:.5f}px"></button></div>'
 small+='</div>'
html='''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>신규2안 · 정면/오른쪽45/90</title><style>
*{box-sizing:border-box}body{font-family:Arial,'Malgun Gothic',sans-serif;margin:0;padding:16px;background:#efeeea;color:#243348}h1{font-size:24px;margin:0 0 6px}h2{font-size:17px;margin:18px 0 8px}h3{font-size:17px;margin:12px}.note{font-size:13px;color:#6b7b8b;line-height:1.5}nav{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}nav a,nav button{padding:9px;background:white;border:1px solid #b9c3ce;border-radius:5px;color:#234b75;font:inherit;text-decoration:none}.viewport{overflow:hidden;width:100%;position:relative}.board{width:1456px;display:grid;grid-template-columns:repeat(3,480px);gap:8px;transform-origin:top left}article{background:#faf9f6;border:1px solid #cfd5dc;border-radius:6px;overflow:hidden}.stage{width:480px;height:600px;position:relative;display:block;border:0;background:transparent;overflow:hidden;padding:0;cursor:zoom-in}.stage:after{content:'';position:absolute;left:8px;right:8px;top:560px;border-top:1px dashed #bfc7d0;pointer-events:none}img{position:absolute;height:auto;max-width:none;image-rendering:pixelated}.games{max-width:1000px;margin:auto}.smallrow{display:grid;grid-template-columns:repeat(3,1fr);border:1px solid #cfd5dc;border-radius:6px;background:#faf9f6;text-align:center;padding:8px}.smallrow span{font-size:13px}.tiny{position:relative;display:block;width:100%;height:110px;border:0;background:none;padding:0;overflow:visible;cursor:zoom-in}dialog{max-width:94vw;max-height:94vh;border:1px solid #a9b9c9;border-radius:7px;background:#efeeea;color:#243348}dialog::backdrop{background:#0008}dialog img{position:static;max-width:88vw;max-height:78vh;object-fit:contain;width:auto;height:auto}#caption{font-size:14px}#close{float:right}.dark{background:#1d2532;color:#e2e8f0}.dark article,.dark .smallrow,.dark dialog{background:#2a3444;color:#e2e8f0}.capture nav{display:none}.mobile-labels{display:none}@media(max-width:600px){body{padding:12px}h1{font-size:20px}.mobile-labels{display:grid;grid-template-columns:repeat(3,1fr);font-size:12px;text-align:center}.smallrow span{font-size:11px}}
</style><body><h1>신규2안 · 정면 / 오른쪽45° / 오른쪽90°</h1><div class="note">선택 정면의 두상·얼굴·장비를 회전 · 생성 원본 바이트 유지 · 같은 전체 표시 키와 발선</div><nav><button id="theme">밝게 / 어둡게</button><a href="comparison.png">비교 PNG</a><a href="asset-manifest.json">측정 메타</a><a href="검수.md">검수 기록</a></nav><h2>세 방향 전신 비교</h2><div class="mobile-labels"><span>정면</span><span>오른쪽 앞45°</span><span>오른쪽 정90°</span></div><div class="viewport"><div class="board">'''+cards+'''</div></div><div class="games">'''+small+'''<div class="note">57/72CSSpx는 갤러리 표시 관찰이며 게임 통합·실기기 검증이 아닙니다.</div></div><p class="note">개별 PNG는 생성 실제 크기를 유지합니다. 숨은 정수리는 추정이며 정확히 동일한 등신을 주장하지 않습니다. 90°의 먼쪽 왼손 단검은 자연 가림입니다.</p><dialog><button id="close">닫기</button><p id="caption"></p><img id="large" alt="원본 확대"></dialog><script>
function fit(){let v=document.querySelector('.viewport'),b=v.querySelector('.board'),s=Math.min(1,v.clientWidth/1456);b.style.transform=`scale(${s})`;v.style.height=`${b.offsetHeight*s}px`};window.addEventListener('resize',fit);fit();document.querySelector('#theme').onclick=()=>document.body.classList.toggle('dark');for(let b of document.querySelectorAll('.stage,.tiny'))b.onclick=()=>{document.querySelector('#large').src=b.dataset.file;document.querySelector('#caption').textContent=b.dataset.label;document.querySelector('dialog').showModal()};document.querySelector('#close').onclick=()=>document.querySelector('dialog').close();</script></body></html>'''
(D/'index.html').write_text(html,encoding='utf-8')

