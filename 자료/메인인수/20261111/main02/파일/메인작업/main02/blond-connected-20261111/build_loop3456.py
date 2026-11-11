from pathlib import Path
import json,re,datetime

root=Path(__file__).resolve().parent
html=(root/'index.html').read_text(encoding='utf-8')
data_match=re.search(r'const DATA=(.*?),IDS=(.*?);\n',html)
data=json.loads(data_match[1]);ids=json.loads(data_match[2])
data={key:value for key,value in data.items() if key.split('/')[1] in ids[2:6]}
html=html[:data_match.start()]+f'const DATA={json.dumps(data,separators=(",",":"))},IDS={json.dumps(ids)};\n'+html[data_match.end():]
html=html.replace('금발 전사 연결 재생','금발 전사 03·04·05·06 반복').replace('금발 전사 · 연결 재생','금발 전사 · 03 → 04 → 05 → 06 반복')
html=html.replace('01 → 02 → 03 → 04 → 05의 1~7프레임 → 06 전체 → 02 대기 반복','03 장검 찌르기 → 04 단검 찌르기 → 05 쌍검 찌르기(1~7프레임) → 06 X자 베기 전체 → 처음부터 반복')
html=re.sub(r"const names=\[.*?\];","const names=['03 장검 찌르기','04 단검 찌르기','05 쌍검 찌르기 · 1~7','06 X자 베기'];",html)
html=html.replace('for(let action=0;action<6;action++)','for(let action=2;action<6;action++)')
start=html.index("const idle=DATA[")
end=html.index('let elapsed=0,last=0',start)
html=html[:start]+'''const loopMs=introMs;
function at(time){const p=((time%loopMs)+loopMs)%loopMs;const s=steps.find(s=>p<s.start+s.duration)||steps[steps.length-1];return {...s,segment:s.action-2,tail:false};}
const checks=[];function check(v,n){checks.push({name:n,pass:!!v});if(!v)throw Error(n);}
check(steps.length===43,'43 frames per cycle');check(steps.filter(s=>s.action===4).length===7,'05 contains only frames1..7');check(at(0).action===2,'starts with03');check(at(loopMs).action===2&&at(loopMs).frame===0,'wraps directly to03');check(at(loopMs-.001).action===5&&at(loopMs-.001).frame===11,'06 frame12 is last');check(at(loopMs*100).action===2,'100 loops remain3456');check(Object.keys(DATA).length===8,'four actions per model');
window.sequenceDebug={at,steps,introMs,loopMs,checks};
''' + html[end:]
html=html.replace("elapsed=i===6?introMs:steps.find(s=>s.action===i).start","elapsed=steps.find(s=>s.action===i+2).start")
html=html.replace("byId('seek').value=s.tail?introMs+(elapsed-introMs)%loopMs:elapsed","byId('seek').value=elapsed%loopMs")
html=html.replace("byId('seek').max=introMs+loopMs-1","byId('seek').max=loopMs-1")
html=html.replace('05는 7프레임까지만 재생합니다. 마지막 02만 반복합니다.','03 → 04 → 05의 1~7프레임 → 06 전체를 계속 반복합니다.')
(root/'loop3456.html').write_text(html,encoding='utf-8')
durations=[data['A_builtin/'+ident]['durationsMs'][:7 if i==4 else 12] for i,ident in enumerate(ids) if i in [2,3,4,5]]
record={'user':'6빠졌다 3456까지','time':datetime.datetime.now(datetime.timezone.utc).isoformat(),'executor':'main02','sequence':['03[1..12]','04[1..12]','05[1..7]','06[1..12]'],'loop':'whole sequence','cycleMs':sum(map(sum,durations)),'cycleFrames':43,'variantsSeparate':True,'originalArtChanged':False,'imageGenerationCalls':0,'resizeControlsPreserved':True}
(root/'loop3456-record.json').write_text(json.dumps(record,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(record,ensure_ascii=False))
