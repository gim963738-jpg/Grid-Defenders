from pathlib import Path
import json, hashlib, shutil
from PIL import Image, ImageOps
P=Path(__file__).resolve().parent
ImageOps.fit(Image.open(P/'battlefield-source.png').convert('RGB'),(992,572),method=Image.Resampling.LANCZOS).save(P/'battlefield-display.png')
def write(name,data): (P/name).write_text(data,encoding='utf-8')
hits=[]
for i,(start,angle,offset,length) in enumerate(zip([.16,.43,.69,.96,1.23,1.55],[25,28,23,27,24,26],[-8,5,-5,9,-2,0],[.82,.79,.84,.80,.83,.86])):
    hits.append(dict(number=i+1,start=start,emphasis=round(start+.10,4),fadeStart=round(start+.12,4),end=round(start+(.30 if i==5 else .24),4),angle=angle,offset=offset,length=length))
timeline=dict(task='MAIN02-20261109-C970BE7A',iteration=1,role='effects',fps=60,frames=150,duration=2.5,speed='1x proposed initial value; user decides final speed',hits=hits,sourceRect=dict(x=0,y=0,width=960,height=540),padding=16,frameSize=[992,572],pivotSource=[480,270],pivotPadded=[496,286],displayBounds='whole padded frame; uniform scale; target center fixed',alpha=True,alphaFormat='straight RGBA PNG sequence',damage=None,range=None,hero=None,combatIntegration=False)
write('timeline.json',json.dumps(timeline,ensure_ascii=False,indent=2))
engine=(P/'drawingModel.js').read_text(encoding='utf-8-sig')+'\n'+(P/'drawingRender.js').read_text(encoding='utf-8-sig')
import re
engine=re.sub(r'^import .*?;\s*','',engine,flags=re.M)
engine=re.sub(r'\bexport ', '',engine)
engine=re.sub(r'//# sourceMappingURL=.*','',engine)
js=r'''
const spec=SPEC;
const view=document.querySelector('canvas'), ctx=view.getContext('2d');
const fx=document.createElement('canvas');fx.width=992;fx.height=572;
const scratch=document.createElement('canvas');scratch.width=scratch.height=960;
const sc=scratch.getContext('2d'), fc=fx.getContext('2d');
const battle=new Image();battle.src='battlefield-display.png';
let t=0,playing=true,loop=true,speed=1,last=performance.now(),background='battle';
function point(h,u,v=0){const a=h.angle*Math.PI/180,x=(u-.5)*h.length,y=v;return [.5+x*Math.cos(a)-y*Math.sin(a),.5+h.offset/960+x*Math.sin(a)+y*Math.cos(a)]}
function stroke(h,kind){let points;
 if(kind==='core')points=[point(h,0),point(h,1)];
 else {points=[point(h,0),point(h,1)];for(let j=30;j>=0;j--){let u=j/30;points.push(point(h,u,.042*Math.pow(Math.sin(Math.PI*u),1.5)))} }
 return {id:'hit'+h.number+'-'+kind,role:'effect',purpose:kind==='core'?'path':'appearance',step:1,duration:.10,delay:0,linger:h.end-h.start-.10,points,color:kind==='core'?'#BAF3FF':'#4C93DA',width:kind==='core'?.0022:.00035,style:kind==='core'?'trail':'field',fold:false,followActor:false,note:'same diagonal reference; no damage',fadeAlong:{from:point(h,0),to:point(h,1),start:.45,end:1,softness:.24}};
}
const plans=spec.hits.map(h=>({hit:h,wind:stroke(h,'wind'),core:stroke(h,'core')}));
function effect(time){fc.clearRect(0,0,992,572);for(const p of plans){const age=time-p.hit.start;if(age<=0||time>=p.hit.end)continue;
 for(const kind of ['wind','core']){sc.clearRect(0,0,960,960);sc.save();if(kind==='wind'){const a=point(p.hit,0),b=point(p.hit,Math.min(1,age/.10));sc.beginPath();sc.rect(0,0,Math.max(0,b[0]*960),960);sc.clip()}
 renderDrawing(sc,{version:1,enabled:true,showBase:false,prompt:'reference diagonal slash',strokes:[p[kind]]},age,960);sc.restore();
 fc.save();fc.globalAlpha=kind==='wind'?.80:1;fc.filter=kind==='wind'?'blur(3px)':'none';fc.drawImage(scratch,0,210,960,540,16,16,960,540);fc.restore();
 }}return fx;}
function render(time=t){const f=effect(time);ctx.clearRect(0,0,992,572);ctx.fillStyle=background==='dark'?'#101E30':background==='green'?'#A5C9A0':'#DADFE3';ctx.fillRect(0,0,992,572);if(background==='battle'&&battle.complete&&battle.naturalWidth)ctx.drawImage(battle,0,0,992,572);ctx.drawImage(f,0,0);document.querySelector('#scrub').value=time;let n=spec.hits.filter(h=>time>=h.emphasis).length;document.querySelector('#status').textContent=`${n} / 6타 · ${time.toFixed(3)}s · 프레임 ${Math.min(150,Math.floor(time*60)+1)} / 150`;}
function tick(now){let dt=(now-last)/1000;last=now;if(playing){t+=dt*speed;if(t>=2.5){if(loop)t%=2.5;else{t=2.5;playing=false}}}render();requestAnimationFrame(tick)}
document.querySelector('#play').onclick=()=>{playing=!playing;document.querySelector('#play').textContent=playing?'일시정지':'재생'};
document.querySelector('#restart').onclick=()=>{t=0;last=performance.now();render()};
document.querySelector('#loop').onchange=e=>loop=e.target.checked;
document.querySelector('#speed').onchange=e=>speed=+e.target.value;
document.querySelector('#bg').onchange=e=>{background=e.target.value;render()};
document.querySelector('#scrub').oninput=e=>{t=+e.target.value;playing=false;document.querySelector('#play').textContent='재생';render()};
document.querySelector('#prev').onclick=()=>{playing=false;t=Math.max(0,t-1/60);render()};document.querySelector('#next').onclick=()=>{playing=false;t=Math.min(2.5,t+1/60);render()};
window.demo={spec,plans,effect,render,state:()=>({t,playing,loop,speed,background}),seek:x=>{playing=false;t=x;render()},exportFrames:async()=>{playing=false;for(let i=0;i<150;i++){const data=effect(i/60).toDataURL('image/png').split(',')[1];const r=await fetch('/save/frame-'+String(i).padStart(3,'0')+'.png',{method:'POST',body:data});if(!r.ok)throw Error('save failed '+i)}return '150 RGBA frames exported'}};
requestAnimationFrame(tick);
'''.replace('SPEC',json.dumps(timeline))
html='''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>청백 사선 · 6연격</title><link rel="stylesheet" href="mobile-ui.css"><style>
*{box-sizing:border-box}body{margin:0;background:#0b1420;color:#e7f5ff;font:14px system-ui,sans-serif}main{max-width:1100px;margin:auto;padding:20px 12px}h1{font-size:22px;margin:0 0 8px}p{color:#acc2d5;margin:8px 0 16px;line-height:1.6}canvas{display:block;width:100%;height:auto;border:1px solid #355067;border-radius:8px}.controls{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}button,select,label{min-height:48px;min-width:48px;padding:10px 12px;background:#20374b;border:1px solid #48677f;border-radius:6px;color:white;font:14px system-ui}label{display:flex;align-items:center;gap:8px}input[type=checkbox]{width:22px;height:22px}input[type=range]{width:100%;height:48px}#status{font-variant-numeric:tabular-nums;font-size:14px}a{color:#9fe1ff}.files{display:flex;gap:16px;flex-wrap:wrap}.hint{font-size:12px}
</style><main><h1>청백 사선 · 6연격</h1><p>가늘게 가르고, 푸른 바람만 짧게 남는 여섯 번의 검격.</p><canvas width="992" height="572" aria-label="6연격 재생 화면"></canvas><div class="controls"><button id="play">일시정지</button><button id="restart">처음부터</button><label><input id="loop" type="checkbox" checked>반복</label><select id="speed" aria-label="재생 속도"><option value=".25">0.25×</option><option value=".5">0.5×</option><option value="1" selected>1× · 제안 초기값</option><option value="2">2×</option></select><select id="bg" aria-label="배경"><option value="battle">전장 배경 합성</option><option value="grey">밝은 회색</option><option value="green">밝은 초록</option><option value="dark">어두운 배경</option></select></div><input id="scrub" aria-label="시간 탐색" type="range" min="0" max="2.5" step=".0166666667" value="0"><div class="controls"><button id="prev">이전 프레임</button><button id="next">다음 프레임</button><span id="status"></span></div><p class="hint">속도와 최종外관은 사용자 결정입니다. 전장 이미지를 사용한 독립 합성이며 실제 게임 스킬 적용이나 피해 판정은 포함하지 않습니다.</p><div class="files"><a href="six-slash-battle.mp4">전장 MP4</a><a href="six-slash-grey.mp4">밝은 MP4</a><a href="six-slash-dark.mp4">어두운 MP4</a><a href="six-slash-battle.gif">반복 GIF</a><a href="contact-grey.jpg">전체 프레임</a></div></main><script>ENGINE\nJS</script></html>'''.replace('JS',js).replace('ENGINE',engine)
html=html.replace('최종外관','최종 외관').replace("function render(time=t){", "function render(time=t){document.querySelector('#play').textContent=playing?'일시정지':'재생';")
write('preview.html',html)
write('editable-plans.json',json.dumps(dict(timeline=timeline,renderer='drawingRender.js copied from existing workshop; frame adapter inline in preview.html'),ensure_ascii=False,indent=2))
write('사전확인.md','''# MAIN02-20261109-C970BE7A / 차수1 / effects
사용자 확인 원문: 저검격이 6연격으로 만든 연출을 나한테 보여줄수있도록 전문 프롬프트 작성해서 작업 바로 진행해
첨부를 직접 열람: 긴 약26도 사선 날, 청백색 가는 중심, 아래로 넓어지는 푸른 반투명 잔광. 건물·캐릭터·보라색 표현은 제외.
기존 공방 WEB-155/156/162 및 재료함 WEB-169 조사 완료. 기존 drawingRender/drawingModel의 컴파일 사본을 사용하여 스크립트와 뷰어만 신규 output에 작성. 기존 라이브러리와 게임 파일은 수정하지 않음.
정확히6회 각기 다른 각도/간격/길이의 사선 출현-진행-소멸. 제안 초기값 2.5초, 실제 연속타격 구간0.16~1.85초. 속도는 사용자 확정 아님.
알파 전체프레임 여백, 밝은 회색/초록 연락판, 실제 전장 원본 이미지 위 합성, 320/390px와 큰 화면, 재생·정지·재시작·배속을 검사. 독립 합성으로 게임 통합/피해 검사를 대신하지 않음.
''')
write('전문제작프롬프트.md','''# 청백 사선 6연격 제작 프롬프트
입력 참조의 왼쪽 위→오른쪽 아래 긴 사선 참격만 재현한다. 가는 고휘도 청백색 날과, 날 뒤 아래쪽으로 넓게 옅어지는 푸른 칼바람을 보존한다. 검격은 6개의 독립 출현·가르는 진행·빠른 소멸을 짧은 간격으로 잇고 각각 각도23~28도와 위치를 조금 바꾼다. 정확히 여섯 번의 콤보이며 한 검격 단순6회 복제 루프로 만들지 않는다. 모든 기준점은 대상 중심에 고정하고 마지막 타격은 길이와 잔광 지속만 절제해 강조한다. 굵은 레이저·불투명 삼각판·원형충격파·X자·화염·번개·보라폭발·배경·캐릭터를 추가하지 않는다. 투명 원본과 밝은 회색/초록·어두운·전장 합성 재생을 제출한다. 속도는 조절 가능하고1배는 제안 초기값이다.
실행 경로: 기존 공방 Canvas drawing 렌더러 사본, 로컬 합성/FFmpeg 출력. 이미지·영상 생성 외주 호출0, 유료 모델 전환0, 사용량0. 절차적 재현이며 참조에서 픽셀을 추출한 것이 아님.
''')
sources=[Path('게임/src/effect-workshop/drawingModel.ts'),Path('게임/src/effect-workshop/drawingRender.ts'),Path('게임/public/assets/battlefields/forest-clearing-v1.png')]
write('sources.json',json.dumps([dict(path=str(p.resolve()),sha256=hashlib.sha256(p.read_bytes()).hexdigest()) for p in sources],indent=2))
print('built',P)
