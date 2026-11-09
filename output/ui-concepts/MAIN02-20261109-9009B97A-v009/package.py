from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import ast,re,json,hashlib
out=Path(__file__).resolve().parent
def read(n):return json.loads((out/n).read_text(encoding='utf-8-sig'))
def write(n,d):(out/n).write_text(d if isinstance(d,str)else json.dumps(d,ensure_ascii=False,indent=2),encoding='utf-8')
s=(out/'information.js').read_text(encoding='utf-8');names=ast.literal_eval(re.search(r'const v9Names=(\[.*?\]);',s).group(1))[1:];titles=ast.literal_eval(re.search(r'const v9Titles=(\[.*?\]);',s).group(1))[1:]
data=[dict(n=i+1,file=n+'.png',title=t,desc='차수9 신규 · 정지 정비 UI')for i,(n,t)in enumerate(zip(names,titles))]
refs=[dict(n='참조',file='../MAIN02-20261109-9009B97A-v008/'+f,title=t,desc='기존 v008 원본 · 이번 신규 제작에 미포함')for f,t in [('02-equipment-idle.png','장비 기본 · 3열54셀/직접조합'),('01-codex-large.png','도감 · 큰 이미지 뒤 점유 블록'),('07-enemy-list.png','중보스 직전 적 정보 · 좌목록 우상세')]]
(out/'qa-800').mkdir(exist_ok=True);sheet=Image.new('RGB',(2400,784),'#10252f');draw=ImageDraw.Draw(sheet);font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',20);finals=[]
for i,d in enumerate(data):
 f=out/d['file'];im=Image.open(f);assert im.size==(2400,1080)
 native=im.resize((800,360),Image.Resampling.LANCZOS);native.save(out/'qa-800'/d['file']);x=i%3*800;y=i//3*392;draw.text((x+12,y+4),f"{i+1:02d} {d['title']}",font=font,fill='#e1ecdf');sheet.paste(native,(x,y+32));finals.append(dict(path=str(f),width=2400,height=1080,sha256=hashlib.sha256(f.read_bytes()).hexdigest()))
sheet.save(out/'전체6-비교판.png');write('화면목록.json',data);write('기존흐름참조.json',refs)
old=(out.parent/'MAIN02-20261109-9009B97A-v008/gallery.html').read_text(encoding='utf-8');a=old.index('<body>');b=old.index('<div class="viewer"',a)
html=old[:a]+'''<body><main><h1>D3 차수9 · 정지 정비의 정보와 설명</h1><ol><li style="color:#a6dea6">완료 — 신규6장 제작·자체검증 (이번 보고)</li><li>사용자 평가 대기 — 정보 위계·크기·배치</li></ol><p>상시 핵심 정보 + 탭하여 긴 설명 한 카드 · 병사1 / 영웅4 슬롯 · 전체 능력치 + 스킬 · 요청한 아이템 비교</p><nav><a href="전체6-비교판.png">신규6 전체 비교판</a><a href="결과보고.md">결과보고</a><a href="concepts.html">선택·열람 목업</a><a href="../MAIN02-20261109-9009B97A-v008/gallery.html">기존 v008 전체 흐름</a></nav><div class="cards" id="core"></div><h2 class="section-title">기존 전체 흐름의 참조 화면</h2><p>아래3장은 v008 읽기 전용 원본이며 신규6장으로 세지 않습니다. 적 정보는 중보스 구간 직전 정비에만 접근합니다.</p><div class="cards" id="refs"></div></main>'''+old[b:]
html=re.sub(r'const data=\[.*?\];let index=',lambda _:'const data='+json.dumps(data+refs,ensure_ascii=False)+';let index=',html,flags=re.S).replace("$('core').append(b)","$(i<6?'core':'refs').append(b)").replace('D3 차수8 · 세부 재구성','D3 차수9 · 정지 정비 정보')
write('gallery.html',html)
qa=read('button-map.json');assert qa['pass'];baseline=read('보존기준해시.json')
for p,h in baseline.items():assert hashlib.sha256(Path(p).read_bytes()).hexdigest()==h,p
ack=read('읽기확인.json');assert ack['iteration']==9 and len(ack['documents'])==18
for d in ack['documents']:assert hashlib.sha256(Path(d['path']).read_bytes()).hexdigest()==d['sha256']
write('최종검증.json',dict(iteration=9,role='ui',finals=finals,layoutPass=True,layoutChecks=qa['checks'],linePhases=qa['phases'],mockActions=qa['actions9'],preservedFiles=len(baseline),changedOriginals=[],readingHashesCurrent=True,readings=18,newScreens=6,referenceScreens=3,gameIntegrated=False,userAccepted=False,visualReviewNative800=6))
print('6PNG packed; layout',len(qa['checks']),'PASS; originals',len(baseline),'unchanged; reading18 current')
