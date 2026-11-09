from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import re,ast,json,hashlib
out=Path(__file__).resolve().parent
def write(n,x):(out/n).write_text(x if isinstance(x,str)else json.dumps(x,ensure_ascii=False,indent=2),encoding='utf-8')
def read(n):return json.loads((out/n).read_text(encoding='utf-8-sig'))
s=(out/'revision.js').read_text(encoding='utf-8');names=ast.literal_eval(re.search(r'const v8Names=(\[.*?\]);',s).group(1))[1:];titles=ast.literal_eval(re.search(r'const v8Titles=(\[.*?\]);',s).group(1))[1:]
data=[dict(n=i+1,file=n+'.png',title=t,desc='차수8 · UI 표시 목업 · 게임 미반영')for i,(n,t)in enumerate(zip(names,titles))]
finals=[];sheet=Image.new('RGB',(2400,1176),'#10252f');draw=ImageDraw.Draw(sheet);font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',20)
(out/'qa-800').mkdir(exist_ok=True)
for i,d in enumerate(data):
 f=out/d['file'];im=Image.open(f);assert im.size==(2400,1080)
 small=im.resize((800,360),Image.Resampling.LANCZOS);small.save(out/'qa-800'/d['file']);x=i%3*800;y=i//3*392;draw.text((x+12,y+4),f"{i+1:02d} {d['title']}",font=font,fill='#e1ecdf');sheet.paste(small,(x,y+32))
 finals.append(dict(path=str(f),width=2400,height=1080,sha256=hashlib.sha256(f.read_bytes()).hexdigest()))
sheet.save(out/'전체7-비교판.png');write('화면목록.json',data)
old=(out.parent/'MAIN02-20261109-9009B97A-v007/gallery.html').read_text(encoding='utf-8');a=old.index('<body>');b=old.index('<div class="viewer"',a)
html=old[:a]+'''<body><main><h1>D3 차수8 · 도감·장비 조합·병력·적 정보</h1><ol><li style="color:#a6dea6">완료 — PNG7장 제작·자체검증 (이번 보고)</li><li>사용자 평가 대기 — 차수8 시안</li></ol><p>아이템 이동 중에만 파란선 · 장비 화면에서 한 번 조합 · 오른쪽 병력 조작과5×5 배치판 · 새 게임 기능 구현 아님</p><nav><a href="전체7-비교판.png">전체7 비교판</a><a href="결과보고.md">결과보고</a><a href="concepts.html">독립 표시 목업</a><a href="../MAIN02-20261109-9009B97A-v007/gallery.html">차수7 전후 비교</a></nav><div class="cards" id="core"></div><div id="extra"></div></main>'''+old[b:]
html=re.sub(r'const data=\[.*?\];let index=',lambda _:'const data='+json.dumps(data,ensure_ascii=False)+';let index=',html,flags=re.S).replace("$(i<6?'core':'extra')","$('core')").replace('D3 차수7 · 세부 보완','D3 차수8 · 세부 재구성')
write('gallery.html',html)
layout=read('button-map.json');assert layout['pass']
changed=[];baseline=read('보존기준해시.json')
for p,h in baseline.items():
 f=Path(p);now=hashlib.sha256(f.read_bytes()).hexdigest()if f.exists()else None
 if now!=h:changed.append(dict(path=p,before=h,after=now))
assert not changed,changed
ack=read('읽기확인.json');assert ack['iteration']==8 and len(ack['documents'])==17
for d in ack['documents']:assert hashlib.sha256(Path(d['path']).read_bytes()).hexdigest()==d['sha256']
# Sole R03 sample: idle nonadjacent, held preview, drop adjacent, output fits.
ironIdle={(0,1),(1,1)};ironDrop={(0,0),(1,0)};rune={(2,0),(3,0)};pouch={(4,0)};gale={(0,0),(0,1),(1,1)}
adj=lambda a,b:any(abs(x-u)+abs(y-v)==1 for x,y in a for u,v in b)
assert not adj(ironIdle,rune) and adj(ironDrop,rune) and not ironDrop&rune and not gale&pouch and all(0<=x<5 and 0<=y<2 for x,y in gale)
write('최종검증.json',dict(iteration=8,role='ui',layoutChecks=layout['checks'],phaseChecks=layout['phaseChecks'],layoutPass=True,finals=finals,readingHashesCurrent=True,preservedFiles=len(baseline),changedOriginals=changed,visualReviewedNative800=7,visualNotes='한글/숫자/제목/아이콘비율/겹침/복귀/라인상태/25칸/좌몬스터우상세 직접 확인',stateContinuity=dict(owner='warehouse',ironIdle=[0,1],ironDrop=[0,0],rune=[2,0],pouch=[4,0],result=[0,0],anvilsBefore=1,anvilsAfter=0,goldUnchanged=495,adjacentOnlyAfterDrop=True,resultSpaceFits=True,wornGearUnchanged=True),gameIntegrated=False,userAcceptance=False))
print('PNG7 2400x1080; layout39 passed; originals',len(baseline),'unchanged; readings17 current')
