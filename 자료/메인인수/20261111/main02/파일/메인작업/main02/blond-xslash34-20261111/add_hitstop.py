from pathlib import Path
import re,json,datetime,base64,hashlib

root=Path(__file__).resolve().parent
html=(root/'connected3456.html').read_text(encoding='utf-8')
dummy_source=Path(r'C:\Users\user\orca\workspaces\Grid Defenders\UI-전투화면\게임\src\devRangeDummy.ts')
text=dummy_source.read_text(encoding='utf-8')
svg=re.search(r'<svg viewBox="0 0 48 64".*?</svg>',text,re.S)[0]
svg=svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="64" ',1)
dummy_url='data:image/svg+xml;base64,'+base64.b64encode(svg.encode()).decode()
html=html.replace('금발 전사 · 신규 3/4 측면 06 연결','허수아비 · 03~06 타격감 비교')
html=html.replace('03 → 04 → 05 → 신규 06 · 내장 버전','허수아비 · 히트스탑 비교')
controls='''<div class="controls"><label>히트스탑 <select id="hitstop"><option value="0">없음</option><option value="40">40ms</option><option value="80" selected>80ms</option><option value="120">120ms</option><option value="160">160ms</option></select></label><label><input type="checkbox" id="recoil" checked>허수아비 반동</label><span style="color:#a9bacb">타격: 03-6 / 04-5 / 05-6 / 06-5</span></div>'''
html=html.replace('<div class="pair">',controls+'<div class="pair">',1)
start=html.index('const steps=[];let introMs=0;')
end=html.index('let elapsed=0,last=0',start)
timeline='''
const hitFrames={2:5,3:4,4:5,5:4};let steps=[],hits=[],introMs=0,loopMs=0;
function buildTimeline(stopMs){steps=[];hits=[];introMs=0;for(let action=2;action<6;action++){const m=DATA['A_builtin/'+IDS[action]],count=action===4?7:12;for(let frame=0;frame<count;frame++){const base=m.durationsMs[frame],isHit=hitFrames[action]===frame,stop=isHit?stopMs:0;const step={action,frame,start:introMs,base,duration:base+stop,stop};steps.push(step);if(isHit)hits.push({action,frame,contact:introMs+base,release:introMs+base+stop,stop});introMs+=step.duration;}}loopMs=introMs;}
buildTimeline(80);
function at(time){const p=((time%loopMs)+loopMs)%loopMs,s=steps.find(s=>p<s.start+s.duration)||steps[steps.length-1];return {...s,segment:s.action-2,tail:false,phase:p-s.start,impact:s.stop>0&&p-s.start>=s.base};}
function impactAt(time){const p=((time%loopMs)+loopMs)%loopMs;let event=null,age=Infinity;for(const hit of hits){const dt=((p-hit.contact)%loopMs+loopMs)%loopMs;if(dt<age){age=dt;event=hit;}}return {event,age,hold:age<event.stop,reactionAge:Math.max(0,age-event.stop)};}
const checks=[];function check(v,n){checks.push({name:n,pass:!!v});if(!v)throw Error(n);}
check(steps.length===43,'43 original frames retained');check(hits.length===4,'four impact events per cycle');check(hits.map(h=>(h.action+1)+'-'+(h.frame+1)).join('/')==='3-6/4-5/5-6/6-5','exact user impact frames');check(steps.filter(s=>s.action===4).length===7,'05 first seven only');check(loopMs===4060,'3740 base plus four80ms');check(hits.every(h=>at(h.contact+.001).impact&&at(h.release-.001).frame===h.frame),'each hit frame held80ms');check(at(loopMs).action===2,'loop returns03');
window.sequenceDebug={at,impactAt,hitFrames,checks,buildTimeline,get steps(){return steps},get hits(){return hits},get introMs(){return introMs},get loopMs(){return loopMs}};
const dummySprite=new Image();dummySprite.src='__DUMMY__';
function dummyPose(time){const impact=impactAt(time),enabled=document.getElementById('recoil').checked;if(!enabled)return {angle:0,shift:0,hit:false};if(impact.hold)return {angle:.065,shift:3,hit:true};const t=impact.reactionAge;if(t>300)return {angle:0,shift:0,hit:false};const decay=Math.exp(-t/85);return {angle:.15*Math.cos(t/34)*decay,shift:7*Math.cos(t/30)*decay,hit:t<65};}
function drawDummy(ctx,state){if(!dummySprite.complete||!dummySprite.naturalWidth)return;const pose=dummyPose(elapsed);ctx.save();ctx.translate(316+pose.shift,347);ctx.rotate(pose.angle);ctx.drawImage(dummySprite,-72,-192,144,192);ctx.restore();if(state.impact){ctx.save();ctx.fillStyle='#e0a660';ctx.font='bold 13px system-ui';ctx.fillText('HIT STOP',312,128);ctx.restore();}}
'''.replace('__DUMMY__',dummy_url)
html=html[:start]+timeline+html[end:]
needle="ctx.stroke();ctx.drawImage(images[route+'/'+IDS[s.action]]"
assert needle in html
html=html.replace(needle,"ctx.stroke();drawDummy(ctx,s);ctx.drawImage(images[route+'/'+IDS[s.action]]")
html=html.replace("(s.action===4?7:12);byId('seek')","(s.action===4?7:12)+(s.impact?' · HIT STOP':'');byId('seek')")
html=html.replace("byId('seek').max=loopMs-1;", "byId('hitstop').onchange=()=>{buildTimeline(Number(byId('hitstop').value));elapsed=0;byId('seek').max=loopMs-1;paint();};byId('recoil').onchange=paint;byId('seek').max=loopMs-1;")
html=html.replace('전환용 새 포즈·보간은 추가하지 않았습니다.','지정 타격 프레임이 끝나는 순간 80ms 정지 후 반동합니다. 히트스탑 길이는 위에서 바꿀 수 있습니다. 실제 피해 판정은 연결하지 않았습니다.')
(root/'hitstop3456.html').write_text(html,encoding='utf-8')
record={'time':datetime.datetime.now(datetime.timezone.utc).isoformat(),'userApproval':'너가바로 진행해봐 진행','executor':'main02','targetFrames':{'03':6,'04':5,'05':6,'06':5},'defaultHitstopMs':80,'reaction':'frozen initial displacement then damped recoil300ms','dummy':{'source':str(dummy_source),'sourceSha256':hashlib.sha256(dummy_source.read_bytes()).hexdigest(),'kind':'existing game SVG reused','root':[316,347],'size':[144,192]},'cycleFrames':43,'baseCycleMs':3740,'hitstopCycleMs':4060,'sourceArtChanged':False,'gameSourceChanged':False,'generationCalls':0,'damageLogic':'not implemented; preview only'}
(root/'hitstop-record.json').write_text(json.dumps(record,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(record,ensure_ascii=False))
