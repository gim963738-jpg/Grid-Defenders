from pathlib import Path
from PIL import Image, ImageDraw
import base64, json, hashlib, datetime, re
import numpy as np

OUT=Path(__file__).resolve().parent
OLD=Path(r'C:\Users\user\orca\workspaces\Grid Defenders\스프라이트-시트작업\output\characters\blond_motions_MAIN02-20261111-8D69415B_v002\A_builtin\06_dual_rip_x_right90')
im=Image.open(OUT/'sheet.png').convert('RGBA');a=np.array(im.getchannel('A'))
xs=[0,384,768,1152,1536];ys=[0,341,683,1024]
rects=[[xs[c],ys[r],xs[c+1]-xs[c],ys[r+1]-ys[r]] for r in range(3) for c in range(4)]
first=a[:341,:384]>=128
yy,xx=np.where(first);bottom=int(yy.max());top=int(yy.min())
footy,footx=np.where(first & (np.indices(first.shape)[0]>=bottom-6))
rootx=float((footx.min()+footx.max())/2)
m=json.loads((OLD/'animation.json').read_text(encoding='utf-8-sig'))
meta={'id':'06_dual_rip_x_right34','source':'sheet.png','sourceSize':list(im.size),'frameCount':12,'frameRects':rects,'frameOffsets':[[32,32]]*12,'sourceAnchor':[rootx+32,bottom+32],'displayScale':200/(bottom-top+1),'anchor':[224,347],'durationsMs':m['durationsMs'],'view':'right front three-quarter','generationRoute':'builtin image_gen','sourceSha256':hashlib.sha256((OUT/'sheet.png').read_bytes()).hexdigest(),'loopDefault':False,'bodyReferenceMethod':'first pose alpha>=128 hair-to-foot height; one fixed transform all frames','damageGeometry':'not defined; independent'}
edge_counts=[]
for x,y,w,h in rects:
    q=a[y:y+h,x:x+w]
    edge_counts.append(int((q[0,:]>=16).sum()+(q[-1,:]>=16).sum()+(q[:,0]>=16).sum()+(q[:,-1]>=16).sum()))
assert not any(edge_counts),edge_counts
(OUT/'animation.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2),encoding='utf-8')

def render(sheet,meta,i):
    x,y,w,h=meta['frameRects'][i];ox,oy=meta['frameOffsets'][i];ax,ay=meta['sourceAnchor'];s=meta['displayScale']
    frame=Image.new('RGBA',(448,406));cut=sheet.crop((x,y,x+w,y+h));cut=cut.resize((round(w*s),round(h*s)),Image.Resampling.LANCZOS)
    frame.alpha_composite(cut,(round(224+(ox-ax)*s),round(347+(oy-ay)*s)))
    return frame

newframes=[render(im,meta,i) for i in range(12)]
newframes[0].save(OUT/'preview.apng',save_all=True,append_images=newframes[1:],duration=meta['durationsMs'],loop=0,disposal=0,blend=0)
oldim=Image.open(OLD/'sheet.png').convert('RGBA')
for mode,color in [('light','#e8edf1'),('dark','#192331')]:
    contact=Image.new('RGB',(4*300,3*278),color);draw=ImageDraw.Draw(contact)
    for i,frame in enumerate(newframes):
        small=frame.resize((300,272),Image.Resampling.LANCZOS);contact.paste(small,(i%4*300,i//4*278),small)
        draw.text((i%4*300+8,i//4*278+8),str(i+1),fill='white' if mode=='dark' else 'black')
    contact.save(OUT/f'frames-{mode}.jpg',quality=92)

data={}
for name,p,md in [('old',OLD/'sheet.png',m),('new',OUT/'sheet.png',meta)]:
    data[name]={'image':'data:image/png;base64,'+base64.b64encode(p.read_bytes()).decode(),**{k:md[k] for k in ['frameRects','frameOffsets','sourceAnchor','displayScale','durationsMs']}}

html='''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>06 X자 베기 — 90도·3/4 비교</title><style>
*{box-sizing:border-box}body{background:#121923;color:#e9f0f6;font:14px system-ui;margin:0 auto;padding:16px;max-width:1400px}h2{font-size:20px;margin:0 0 8px}p{color:#b2c0d0;line-height:1.6}.pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}.card{min-width:0;border:1px solid #3d5267;border-radius:12px;overflow:hidden}.title{padding:12px;background:#22303f;font-weight:700}.stage{height:380px;overflow:auto;display:flex;background:#e8edf1}canvas{flex-shrink:0;margin:auto;display:block}.controls{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:12px 0}button,select{min-height:48px;border-radius:8px;border:1px solid #4b647a;background:#24384b;color:#fff;font:inherit;padding:8px 14px;cursor:pointer}input{accent-color:#9ed2b8}#zoom{width:130px}#seek{width:100%}#status{padding:10px 0}.note{font-size:12px}@media(max-width:600px){.pair{gap:8px}.stage{height:300px}body{padding:10px}}
</style><h2>06 X자 베기 · 내장 GPT</h2><p>왼쪽: 기존 90도 시안　/　오른쪽: 새 오른쪽 앞 3/4 측면</p><div class="controls"><button id="fit">화면에 맞추기</button><button id="minus">−</button><input id="zoom" type="range" min="50" max="250" value="100" step="10" aria-label="보기 크기"><button id="plus">＋</button><output id="zoomtext">100%</output><button id="full">전체 화면</button></div>
<div class="pair"><div class="card"><div class="title">기존 내장 · 90도 시안</div><div class="stage"><canvas id="old" width="448" height="406"></canvas></div></div><div class="card"><div class="title">신규 내장 · 3/4 측면</div><div class="stage"><canvas id="new" width="448" height="406"></canvas></div></div></div><div class="controls"><button id="play">일시정지</button><button id="restart">처음부터</button><button id="prev">이전 프레임</button><button id="next">다음 프레임</button><label>속도 <select id="speed"><option value="0.25">0.25×</option><option value="0.5" selected>0.5×</option><option value="1">1×</option></select></label><label><input id="loop" type="checkbox" checked>반복</label><label>배경 <select id="bg"><option value="light">밝게</option><option value="dark">어둡게</option></select></label></div><div id="status">불러오는 중</div><input id="seek" type="range" min="0" max="11" value="0" step="1" aria-label="프레임"><p class="note">12자세 · 새 시점만 제작했습니다. 기존 연결 순서는 보존했습니다. 프레임별 세부 형태 변화는 남아 있으며 사용자 시각 판정 전 시안입니다.</p>
<script>
const DATA=__DATA__,images={},dur=DATA.new.durationsMs,total=dur.reduce((a,b)=>a+b,0),$=id=>document.getElementById(id);let time=0,last=0,playing=true,ready=false,viewZoom=1;
function current(){let t=Math.min(time,total-.001);for(let i=0;i<12;i++){if(t<dur[i])return i;t-=dur[i];}return 11;}
function frameStart(n){return dur.slice(0,n).reduce((a,b)=>a+b,0);}
function paint(){if(!ready)return;const i=current(),bg=$('bg').value==='dark'?'#192331':'#e8edf1';for(const key of ['old','new']){const c=$(key),ctx=c.getContext('2d'),m=DATA[key],r=m.frameRects[i],o=m.frameOffsets[i],s=m.displayScale;ctx.fillStyle=bg;ctx.fillRect(0,0,448,406);ctx.drawImage(images[key],...r,224+(o[0]-m.sourceAnchor[0])*s,347+(o[1]-m.sourceAnchor[1])*s,r[2]*s,r[3]*s);c.parentElement.style.background=bg;}$('seek').value=i;$('status').textContent='프레임 '+(i+1)+' / 12 · 같은 속도로 동기 재생';}
function fit(){document.querySelectorAll('.stage').forEach(st=>{const c=st.querySelector('canvas'),f=Math.min(st.clientWidth/448,st.clientHeight/406)*viewZoom;c.style.width=448*f+'px';c.style.height=406*f+'px';});$('zoomtext').textContent=Math.round(viewZoom*100)+'%';$('zoom').value=Math.round(viewZoom*100);}
$('zoom').oninput=e=>{viewZoom=Number(e.target.value)/100;fit();};$('fit').onclick=()=>{viewZoom=1;fit();};$('plus').onclick=()=>{viewZoom=Math.min(2.5,viewZoom+.1);fit();};$('minus').onclick=()=>{viewZoom=Math.max(.5,viewZoom-.1);fit();};$('full').onclick=()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();window.addEventListener('resize',fit);new ResizeObserver(fit).observe(document.querySelector('.pair'));fit();
$('play').onclick=()=>{playing=!playing;$('play').textContent=playing?'일시정지':'재생';};$('restart').onclick=()=>{time=0;playing=true;$('play').textContent='일시정지';paint();};$('seek').oninput=e=>{time=frameStart(Number(e.target.value));playing=false;$('play').textContent='재생';paint();};for(const [id,step] of [['prev',-1],['next',1]])$(id).onclick=()=>{time=frameStart((current()+step+12)%12);playing=false;$('play').textContent='재생';paint();};$('bg').onchange=paint;
Promise.all(Object.entries(DATA).map(([key,m])=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{images[key]=im;resolve();};im.onerror=reject;im.src=m.image;}))).then(()=>{ready=true;document.body.dataset.ready='true';last=performance.now();paint();});
function tick(now){if(ready&&playing){time+=Math.max(0,now-last)*Number($('speed').value);if(time>=total){if($('loop').checked)time%=total;else{time=total-.001;playing=false;$('play').textContent='재생';}}}last=now;paint();requestAnimationFrame(tick);}requestAnimationFrame(tick);window.previewDebug={total,dur,current,frameStart};
</script></html>'''.replace('__DATA__',json.dumps(data,separators=(',',':')))
(OUT/'index.html').write_text(html,encoding='utf-8')
audit={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'executor':'main02','sourceSize':im.size,'alphaRange':[int(a.min()),int(a.max())],'transparentPixels':int((a==0).sum()),'frameEdgeAlpha16Counts':edge_counts,'frames':12,'originalPreserved':True,'generation':'builtin image_gen','calls':1,'image26Calls':0,'grokCalls':0,'videoCalls':0,'bodyHeightFirstPose':bottom-top+1,'sourceAnchor':meta['sourceAnchor'],'displayScale':meta['displayScale'],'defaultPreviewSpeed':.5}
test=Image.open(OUT/'preview.apng');assert test.n_frames==12
audit['apngFrames']=test.n_frames
(OUT/'verification.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(audit,ensure_ascii=False))
