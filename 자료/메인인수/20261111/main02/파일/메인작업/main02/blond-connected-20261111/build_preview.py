import base64, hashlib, io, json, os
from pathlib import Path
from PIL import Image

OUT = Path(__file__).resolve().parent
SRC = Path(r'C:\Users\user\orca\workspaces\Grid Defenders\스프라이트-시트작업\output\characters\blond_motions_MAIN02-20261111-8D69415B_v002')
IDS = ['01_run_right90','02_combat_idle_34','03_longsword_thrust_34','04_dagger_thrust_34','05_dual_thrust_right90','06_dual_rip_x_right90']
ROUTES = ['A_builtin','B_image26']
assets, compact, evidence = {}, {}, []
for route in ROUTES:
    for ident in IDS:
        folder = SRC / route / ident
        m = json.loads((folder/'animation.json').read_text(encoding='utf-8-sig'))
        raw = (folder/'sheet.png').read_bytes()
        sha = hashlib.sha256(raw).hexdigest()
        assert sha == m['sourceSha256']
        key = route+'/'+ident
        common = {k:m[k] for k in ['frameRects','frameOffsets','sourceAnchor','displayScale','durationsMs']}
        assets[key] = dict(common, ratio=1, image='data:image/png;base64,'+base64.b64encode(raw).decode())
        im = Image.open(io.BytesIO(raw)).convert('RGBA')
        buf = io.BytesIO()
        small = im.resize((576, 384), Image.Resampling.LANCZOS)
        matte = Image.new('RGBA', small.size, '#e9edf0')
        matte.alpha_composite(small)
        matte.convert('RGB').save(buf, format='WEBP', quality=72, method=1)
        compact[key] = dict(common, ratio=[576/im.width,384/im.height],image='data:image/webp;base64,'+base64.b64encode(buf.getvalue()).decode())
        evidence.append({'route':route,'action':ident,'source':str(folder/'sheet.png'),'sha256':sha})
        assert len(m['frameRects'])==12
for ident in IDS:
    assert assets['A_builtin/'+ident]['durationsMs']==assets['B_image26/'+ident]['durationsMs']

TEMPLATE = r'''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>금발 전사 연결 재생</title>
<style>
*{box-sizing:border-box}body{margin:0;padding:16px;font:14px system-ui,sans-serif;color:var(--foreground,#eaf0f6);background:var(--background,#121923)}h2{font-size:19px;margin:0 0 8px}.sub{color:var(--muted-foreground,#9faec0);margin:0 0 12px;line-height:1.6}.pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}.card{border:1px solid var(--border,#374657);border-radius:12px;overflow:hidden;background:var(--card,#1d2733)}.title{padding:10px 14px;font-weight:700}.stage{background:#e9edf0}canvas{display:block;width:100%;height:auto}.controls{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:12px 0}button,select{min-height:48px;padding:8px 14px;border:1px solid var(--border,#445668);border-radius:9px;background:var(--secondary,#283747);color:var(--foreground,#edf3f9);font:inherit;cursor:pointer}button:hover{background:var(--accent,#3b586a);color:var(--accent-foreground,#fff)}.timeline{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}.timeline button{min-height:42px;padding:5px 10px}.timeline .on{outline:2px solid #99d6b6}.status{padding:10px 0;font-weight:700;min-height:40px}input[type=range]{width:100%;height:30px}.note{font-size:12px;line-height:1.6;color:var(--muted-foreground,#a8b4c4)}
</style>
<h2>금발 전사 · 연결 재생</h2><p class="sub">01 → 02 → 03 → 04 → 05의 1~7프레임 → 06 전체 → 02 대기 반복</p>
<div class="pair"><div class="card"><div class="title">내장 GPT</div><div class="stage"><canvas id="a" width="448" height="406"></canvas></div></div><div class="card"><div class="title">Image 2.6</div><div class="stage"><canvas id="b" width="448" height="406"></canvas></div></div></div>
<div class="controls"><button id="play">일시정지</button><button id="restart">처음부터 다시</button><label>속도 <select id="speed"><option value="0.25">0.25×</option><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="1.5">1.5×</option></select></label><label>배경 <select id="bg"><option value="light">밝게</option><option value="dark">어둡게</option></select></label></div>
<div class="timeline" id="segments"></div><div class="status" id="status">이미지 불러오는 중…</div><input id="seek" type="range" min="0" step="1" aria-label="연결 모션 위치"><p class="note">05는 7프레임까지만 재생합니다. 마지막 02만 반복합니다. 원본 자세와 기존 재생 시간은 유지했고, 전환용 새 포즈·보간은 추가하지 않았습니다.</p>
<script>
const DATA=__DATA__,IDS=__IDS__;
const names=['01 달리기','02 전투 대기','03 장검 찌르기','04 단검 찌르기','05 쌍검 찌르기 · 1~7','06 X자 베기','02 대기 반복'];
const steps=[];let introMs=0;
for(let action=0;action<6;action++){const meta=DATA['A_builtin/'+IDS[action]], count=action===4?7:12;for(let frame=0;frame<count;frame++){steps.push({action,frame,start:introMs,duration:meta.durationsMs[frame]});introMs+=meta.durationsMs[frame];}}
const idle=DATA['A_builtin/'+IDS[1]].durationsMs,loopMs=idle.reduce((a,b)=>a+b,0);
function at(time){if(time<introMs){const s=steps.find(s=>time<s.start+s.duration)||steps[steps.length-1];return {...s,segment:s.action,tail:false};}let p=(time-introMs)%loopMs;for(let f=0;f<12;f++){if(p<idle[f])return {action:1,frame:f,segment:6,tail:true};p-=idle[f];}return {action:1,frame:0,segment:6,tail:true};}
const checks=[];function check(v,n){checks.push({name:n,pass:!!v});if(!v)throw Error(n);}
check(steps.length===67,'intro frame count 67');check(steps.filter(s=>s.action===4).length===7,'05 exactly seven frames');check(at(steps.find(s=>s.action===5).start-0.001).frame===6,'05 ends at frame7');check(at(steps.find(s=>s.action===5).start).action===5,'05 directly to06');check(at(introMs).action===1&&at(introMs).tail,'06 directly to idle02');check(at(introMs+loopMs*9).tail&&at(introMs+loopMs*9).frame===0,'only final idle loops');check(Object.keys(DATA).length===12,'six actions times two routes');
window.sequenceDebug={at,steps,introMs,loopMs,checks};
let elapsed=0,last=0,playing=true,ready=false;
const images={};const byId=id=>document.getElementById(id);
const segmentButtons=names.map((name,i)=>{const b=document.createElement('button');b.textContent=name;b.onclick=()=>{elapsed=i===6?introMs:steps.find(s=>s.action===i).start;paint();};byId('segments').appendChild(b);return b;});
function paint(){if(!ready)return;const s=at(elapsed);for(const [route,id] of [['A_builtin','a'],['B_image26','b']]){const c=byId(id),ctx=c.getContext('2d'),m=DATA[route+'/'+IDS[s.action]],r=m.frameRects[s.frame],o=m.frameOffsets[s.frame],scale=m.displayScale,rat=Array.isArray(m.ratio)?m.ratio:[m.ratio,m.ratio];ctx.fillStyle=byId('bg').value==='dark'?'#17202a':'#e9edf0';ctx.fillRect(0,0,448,406);ctx.strokeStyle=byId('bg').value==='dark'?'#344252':'#c8d1d8';ctx.beginPath();ctx.moveTo(64,348);ctx.lineTo(384,348);ctx.stroke();ctx.drawImage(images[route+'/'+IDS[s.action]],r[0]*rat[0],r[1]*rat[1],r[2]*rat[0],r[3]*rat[1],224+(o[0]-m.sourceAnchor[0])*scale,347+(o[1]-m.sourceAnchor[1])*scale,r[2]*scale,r[3]*scale);}
byId('status').textContent=names[s.segment]+'　｜ 프레임 '+(s.frame+1)+' / '+(s.action===4?7:12);byId('seek').value=s.tail?introMs+(elapsed-introMs)%loopMs:elapsed;segmentButtons.forEach((b,i)=>b.classList.toggle('on',i===s.segment));}
byId('seek').max=introMs+loopMs-1;byId('seek').oninput=e=>{elapsed=Number(e.target.value);paint();};byId('bg').onchange=paint;
byId('play').onclick=()=>{playing=!playing;byId('play').textContent=playing?'일시정지':'재생';};byId('restart').onclick=()=>{elapsed=0;playing=true;last=performance.now();byId('play').textContent='일시정지';paint();};
Promise.all(Object.entries(DATA).map(([key,value])=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{images[key]=im;resolve();};im.onerror=()=>reject(Error('image load '+key));im.src=value.image;}))).then(()=>{ready=true;document.body.dataset.ready='true';document.body.dataset.tests=checks.every(c=>c.pass)?'pass':'fail';last=performance.now();paint();}).catch(e=>{byId('status').textContent='불러오기 실패: '+e.message;document.body.dataset.tests='fail';});
function tick(now){if(ready&&playing)elapsed+=Math.max(0,now-last)*Number(byId('speed').value);last=now;paint();requestAnimationFrame(tick);}requestAnimationFrame(tick);
</script></html>'''

def render(data):
    return TEMPLATE.replace('__DATA__',json.dumps(data,separators=(',',':'))).replace('__IDS__',json.dumps(IDS))

(OUT/'index.html').write_text(render(assets),encoding='utf-8')
inline = render(compact).replace('<option value="dark">어둡게</option>','')
scratch = Path(os.environ['ORCA_CHAT_SCRATCH_DIR'])
assert len(inline.encode())<512*1024, len(inline.encode())
(scratch/'blond-connected-20261111-v1.html').write_text(inline,encoding='utf-8')
steps=[]
for n,ident in enumerate(IDS):
    m=assets['A_builtin/'+ident]
    for f in range(7 if n==4 else 12): steps.append({'action':ident,'frame':f+1,'durationMs':m['durationsMs'][f]})
result={'sourceTask':'MAIN02-20261111-8D69415B','directUserInstruction':'아니 여기서 그냥 바로 작업해서 보여줘','executor':'main02','sequence':['01','02','03','04','05[1..7]','06','02[loop]'],'introFrames':len(steps),'introMs':sum(s['durationMs'] for s in steps),'tailLoopMs':sum(assets['A_builtin/'+IDS[1]]['durationsMs']),'steps':steps,'sources':evidence,'inlineBytes':len(inline.encode()),'sourceMutation':False,'newGenerationCalls':0}
assert len(steps)==67
(OUT/'sequence.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({k:result[k] for k in ['introFrames','introMs','tailLoopMs','inlineBytes']},ensure_ascii=False))
