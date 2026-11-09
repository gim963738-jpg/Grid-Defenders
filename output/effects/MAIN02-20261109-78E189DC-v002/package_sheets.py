from pathlib import Path
from PIL import Image,ImageDraw
import cv2,numpy as np,json,hashlib,base64,zipfile
P=Path(__file__).resolve().parent
ROOT=(256,592);SIZE=640
roots={
 'downcut':[(158,519),(507,518),(875,519),(1230,519),(150,1046),(500,1046),(855,1046),(1214,1046)],
 'upcut':[(157,477),(520,477),(876,476),(1230,476),(163,1049),(520,1050),(884,1049),(1240,1050)],
 'diagonal':[(151,518),(473,517),(800,517),(1145,517),(145,1033),(489,1033),(865,1034),(1225,1034)]}
durations=[150,100,110,60,60,60,80,90,60,100,60,60,60,60,80,100,70,110,60,60,60,90,110,200]
phases=[['neutral','raise','overhead anticipation','swing high','swing middle','swing low','downcut complete','low connection'],['low connection','low anticipation','upward acceleration','upward middle','upward high','raise above face','high extension','upcut complete'],['high connection','diagonal anticipation','swing upper-right','swing middle','swing lower-right','diagonal complete','recovery','neutral']]
frames=[];records=[];audit=[]
(P/'frames').mkdir(exist_ok=True)
atlas=Image.new('RGBA',(SIZE*6,SIZE*4))
for ai,source in enumerate(roots):
 raw=Image.open(P/f'source-{source}.png').convert('RGBA');a=np.array(raw);alpha=a[...,3].copy()
 alpha[alpha<=4]=0
 solid=cv2.dilate((alpha>=32).astype('uint8'),np.ones((5,5),np.uint8));alpha[(alpha<32)&(solid==0)]=0
 _,labels,stats,centers=cv2.connectedComponentsWithStats((alpha>16).astype('uint8'),8)
 big=[i for i in range(1,len(stats)) if stats[i,4]>10000];assert len(big)==8
 big.sort(key=lambda i:(int(centers[i,1]>raw.height/2),centers[i,0]))
 mask=np.ones(alpha.shape,np.uint8)
 for i in big:mask[labels==i]=0
 _,nearest=cv2.distanceTransformWithLabels(mask,cv2.DIST_L2,5,labelType=cv2.DIST_LABEL_CCOMP)
 ownership=np.zeros(alpha.shape,np.uint8)
 actionAtlas=Image.new('RGBA',(SIZE*4,SIZE*2))
 actionRows=[]
 for pi,component in enumerate(big):
  by,bx=np.argwhere(labels==component)[0];owner=nearest[by,bx]
  aa=np.where(nearest==owner,alpha,0).astype('uint8')
  ownership[aa>0]=pi+1
  rgba=np.dstack((a[...,:3],aa));rgba[aa==0,:3]=0
  im=Image.fromarray(rgba);bbox=im.getbbox();assert bbox
  crop=im.crop(bbox);root=roots[source][pi];offset=(ROOT[0]+bbox[0]-root[0],ROOT[1]+bbox[1]-root[1])
  assert min(offset)>=16 and offset[0]+crop.width<=SIZE-16 and offset[1]+crop.height<=SIZE-16,(source,pi,bbox,offset)
  out=Image.new('RGBA',(SIZE,SIZE));out.paste(crop,offset)
  index=len(frames);name=f'frame-{index+1:02d}.png';out.save(P/'frames'/name);frames.append(out)
  atlas.paste(out,(index%6*SIZE,index//6*SIZE));actionAtlas.paste(out,(pi%4*SIZE,pi//4*SIZE))
  ob=out.getbbox();y,x=np.where(np.array(out)[...,3]>16)
  rec=dict(frame=index+1,action=ai+1,pose=pi+1,phase=phases[ai][pi],source=f'source-{source}.png',sourceRect=list(bbox),sourceFootPivot=list(root),outputPivot=list(ROOT),sourceToOutputScale=1,offset=list(offset),atlasRect=[index%6*SIZE,index//6*SIZE,SIZE,SIZE],durationMs=durations[index],file='frames/'+name,alpha=True)
  rec['ownershipMask']=f'{source}-ownership.png';rec['ownershipValue']=pi+1
  records.append(rec);actionRows.append(rec)
  audit.append(dict(frame=index+1,box=ob,margin=min(ob[0],ob[1],SIZE-ob[2],SIZE-ob[3]),alphaZero=int(np.sum(np.array(out)[...,3]==0)),alphaPartial=int(np.sum((np.array(out)[...,3]>0)&(np.array(out)[...,3]<255))),sha256=hashlib.sha256(out.tobytes()).hexdigest()))
 actionAtlas.save(P/f'{source}-sheet.png')
 Image.fromarray(ownership).save(P/f'{source}-ownership.png')
 assert sum(np.count_nonzero(np.array(frames[ai*8+k])[...,3]) for k in range(8))==np.count_nonzero(alpha)
 audit.append(dict(source=source,nativeSize=list(raw.size),nativeAlpha=True,hygieneRemoved=int(np.count_nonzero((a[...,3]>0)&(alpha==0))),method='alpha<=4 cleared; alpha5..31 retained only within2px of alpha>=32; all remaining artwork assigned to nearest of8 connected character owners, no largest-part deletion'))
atlas.save(P/'combo-sheet.png')
loaded=Image.open(P/'combo-sheet.png').convert('RGBA')
fromSheet=[loaded.crop((i%6*SIZE,i//6*SIZE,(i%6+1)*SIZE,(i//6+1)*SIZE)) for i in range(24)]
assert all(a.tobytes()==b.tobytes() for a,b in zip(frames,fromSheet))
frames=fromSheet
assert len({r['sha256'] for r in audit if 'sha256'in r})==24
clock=0
for r in records:r['startMs']=clock;clock+=r['durationMs'];r['endMs']=clock
spec=dict(task='MAIN02-20261109-78E189DC',iteration=2,role='effects',format='gd.character-motion-sheet@1',art_source='host_image',route='built-in image_gen',model='not exposed by tool',effectsIncluded=False,facing='right',frames=records,frameCount=24,sheet='combo-sheet.png',columns=6,rows=4,cellSize=[640,640],sourceScale=1,pivot=list(ROOT),durationMs=clock,alpha=True,speed='1x provisional; user decides',damage=None,hero=None,combatIntegration=False,actions=[dict(id=i+1,name=n,frames=[i*8+1,i*8+8],completeFrame=[7,16,22][i])for i,n in enumerate(['downcut','upcut','diagonal-downcut'])])
(P/'motion.json').write_text(json.dumps(spec,ensure_ascii=False,indent=2),encoding='utf-8')
(P/'frame-audit.json').write_text(json.dumps(dict(frameCount=24,uniqueFrameHashes=24,outputEdgeContact=0,paddingMin=16,pivot=ROOT,pivotMethod='manual boot stance midpoint with source coordinates; translation only; not per-frame bbox scaling',needsUserMotionApproval=True,frames=audit),ensure_ascii=False,indent=2),encoding='utf-8')
colors={'grey':'#DADFE3','green':'#A5C9A0','dark':'#101E30'}
for name,color in colors.items():
 contact=Image.new('RGB',(320*6,344*4),'#F0F2F4');d=ImageDraw.Draw(contact);composites=[]
 for i,frame in enumerate(frames):
  bg=Image.new('RGBA',(SIZE,SIZE),color);bg.alpha_composite(frame);rgb=bg.convert('RGB');composites.append(rgb)
  contact.paste(rgb.resize((320,320),Image.Resampling.LANCZOS),(i%6*320,i//6*344));d.text((i%6*320+8,i//6*344+322),f'{i+1:02d} A{records[i]["action"]} {records[i]["phase"]}',fill='black')
 contact.save(P/f'contact-{name}.jpg',quality=94)
 composites[0].save(P/f'combo-{name}.gif',save_all=True,append_images=composites[1:],duration=durations,loop=0,disposal=2,optimize=False)
 for action,idx in enumerate([4,12,20]):composites[idx].save(P/f'pose-hit{action+1}-{name}.png')
write=lambda n,s:(P/n).write_text(s,encoding='utf-8')
pngdata=base64.b64encode((P/'combo-sheet.png').read_bytes()).decode()
html='''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>검사 3연격 · 모션 시트</title><style>
*{box-sizing:border-box}body{margin:0;background:#101923;color:#e5eff9;font:14px system-ui}main{max-width:850px;margin:auto;padding:16px 12px}h1{font-size:22px;margin:0 0 8px}p{line-height:1.6;color:#b8c8d8}canvas{display:block;width:min(100%,640px);height:auto;margin:auto;border-radius:8px}.controls{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}button,select,label{min-height:48px;min-width:48px;padding:10px 12px;background:#263d50;color:white;border:1px solid #55748e;border-radius:6px;font:14px system-ui}label{display:flex;gap:8px;align-items:center}input[type=checkbox]{width:22px;height:22px}input[type=range]{width:100%;height:48px}#status{font-variant-numeric:tabular-nums}a{color:#b4e4ff}.links{display:flex;flex-wrap:wrap;gap:16px}
</style><main><h1>오른쪽 검사 · 3연격 모션</h1><p>내려치기 → 올려치기 → 사선 내려치기. 이펙트를 제외한 24포즈 시트 재생입니다.</p><canvas width="640" height="640" aria-label="캐릭터 모션 재생"></canvas><div class="controls"><button id="play">일시정지</button><button id="restart">처음부터</button><label><input id="loop" type="checkbox" checked>반복</label><select id="speed" aria-label="속도"><option value=".25">0.25×</option><option value=".5">0.5×</option><option value="1" selected>1× · 제안 초기값</option><option value="2">2×</option></select><select id="bg" aria-label="배경"><option value="grey">밝은 회색</option><option value="green">밝은 초록</option><option value="dark">어두운 배경</option></select></div><input id="scrub" aria-label="프레임 탐색" type="range" min="1" max="24" step="1" value="1"><div class="controls"><button id="prev">이전 프레임</button><button id="next">다음 프레임</button><span id="status"></span></div><p>이미지로 생성한 포즈 시트를 읽어 재생합니다. 영상 AI 생성·이펙트 합성·게임 적용은 포함하지 않습니다. 속도와 동작의 최종 합격은 사용자 판단입니다.</p><div class="links"><a href="combo-sheet.png">통합 투명 시트</a><a href="combo-grey.gif">시트 재생 GIF</a><a href="contact-grey.jpg">전체 포즈</a><a href="motion.json">모션 명세</a></div></main><script>
const spec=SPEC,colors={grey:'#DADFE3',green:'#A5C9A0',dark:'#101E30'};
const atlas=new Image();atlas.src='data:image/png;base64,DATA';const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d');
let t=0,playing=true,loop=true,speed=1,last=performance.now(),background='grey';
function index(){if(t>=spec.durationMs)return 23;return Math.min(23,Math.max(0,spec.frames.findIndex(f=>t<f.endMs)))}
function render(){let i=t>=spec.durationMs?23:index(),f=spec.frames[i];ctx.fillStyle=colors[background];ctx.fillRect(0,0,640,640);if(atlas.complete&&atlas.naturalWidth)ctx.drawImage(atlas,...f.atlasRect,0,0,640,640);document.querySelector('#scrub').value=i+1;document.querySelector('#play').textContent=playing?'일시정지':'재생';document.querySelector('#status').textContent=`${i+1} / 24 · ${['내려치기','올려치기','사선 내려치기'][f.action-1]} · ${(t/1000).toFixed(2)}s`;}
function tick(now){let dt=now-last;last=now;if(playing){t+=dt*speed;if(t>=spec.durationMs){if(loop)t%=spec.durationMs;else{t=spec.durationMs;playing=false}}}render();requestAnimationFrame(tick)}
document.querySelector('#play').onclick=()=>playing=!playing;document.querySelector('#restart').onclick=()=>{t=0;last=performance.now();render()};document.querySelector('#loop').onchange=e=>loop=e.target.checked;document.querySelector('#speed').onchange=e=>speed=+e.target.value;document.querySelector('#bg').onchange=e=>{background=e.target.value;render()};
function seekFrame(i){playing=false;t=spec.frames[Math.max(0,Math.min(23,i-1))].startMs;render()}
document.querySelector('#scrub').oninput=e=>seekFrame(+e.target.value);document.querySelector('#prev').onclick=()=>seekFrame(index());document.querySelector('#next').onclick=()=>seekFrame(index()+2);
window.demo={spec,state:()=>({t,playing,loop,speed,background,index:index()+1}),seekFrame,seek:ms=>{playing=false;t=ms;render()}};
requestAnimationFrame(tick);
</script></html>'''.replace('SPEC',json.dumps(spec,ensure_ascii=False)).replace('DATA',pngdata)
write('preview.html',html)
print('24 native-alpha poses packaged; durationMs',clock,'minMargin',min(r['margin'] for r in audit if 'margin'in r))
