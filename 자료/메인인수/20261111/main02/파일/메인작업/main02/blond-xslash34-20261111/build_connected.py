from pathlib import Path
import json,re,base64,datetime

root=Path(__file__).resolve().parent
source=root.parent/'blond-connected-20261111'/'loop3456.html'
html=source.read_text(encoding='utf-8')
match=re.search(r'const DATA=(.*?),IDS=(.*?);\n',html)
old=json.loads(match[1]);ids=json.loads(match[2])
data={k:v for k,v in old.items() if k.startswith('A_builtin/')}
for ident in ids[2:6]:
    data['A_new06/'+ident]=dict(old['A_builtin/'+ident])
m=json.loads((root/'animation.json').read_text(encoding='utf-8'))
data['A_new06/'+ids[5]]={**{k:m[k] for k in ['frameRects','frameOffsets','sourceAnchor','displayScale','durationsMs']},'ratio':1,'image':'data:image/png;base64,'+base64.b64encode((root/'sheet.png').read_bytes()).decode()}
html=html[:match.start()]+f'const DATA={json.dumps(data,separators=(",",":"))},IDS={json.dumps(ids)};\n'+html[match.end():]
html=html.replace("['B_image26','b']","['A_new06','b']")
html=html.replace('<div class="title">내장 GPT</div>','<div class="title">내장 · 기존 06 연결</div>')
html=html.replace('<div class="title">Image 2.6</div>','<div class="title">내장 · 신규 3/4 측면 06 연결</div>')
html=html.replace('금발 전사 03·04·05·06 반복','금발 전사 · 신규 3/4 측면 06 연결')
html=html.replace('금발 전사 · 03 → 04 → 05 → 06 반복','03 → 04 → 05 → 신규 06 · 내장 버전')
html=html.replace('06 X자 베기 전체 → 처음부터 반복','06 X자 베기 전체 → 반복 · 양쪽 모두 내장, 오른쪽은 신규 3/4 측면')
html=html.replace('03 → 04 → 05의 1~7프레임 → 06 전체를 계속 반복합니다.','양쪽 모두 내장 03 → 04 → 05의 1~7프레임 → 06 전체입니다. 오른쪽만 신규 3/4 측면 06으로 교체했습니다.')
html=html.replace('four actions per model','four actions per chain')
(root/'connected3456.html').write_text(html,encoding='utf-8')
record={'time':datetime.datetime.now(datetime.timezone.utc).isoformat(),'user':'3,4,5,6연결해서 보여줘','executor':'main02','left':'builtin03/04/05[1..7]/original06[1..12]','right':'builtin03/04/05[1..7]/new-three-quarter06[1..12]','framesPerCycle':43,'cycleMs':3740,'loop':'whole chain','image26Sources':0,'generationCalls':0,'originalsChanged':False,'sameClock':True}
(root/'connected-record.json').write_text(json.dumps(record,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(record,ensure_ascii=False))
