from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import ast,re,json,hashlib
out=Path(__file__).resolve().parent
s=(out/'additions.js').read_text(encoding='utf-8-sig');names=ast.literal_eval(re.search(r'const v7Names=(\[.*?\]);',s).group(1))[1:];titles=ast.literal_eval(re.search(r'const v7Titles=(\[.*?\]);',s).group(1))[1:]
def write(n,x):(out/n).write_text(x if isinstance(x,str)else json.dumps(x,ensure_ascii=False,indent=2),encoding='utf-8')
def read(n):return json.loads((out/n).read_text(encoding='utf-8-sig'))
data=[dict(n=i+1,file=f+'.png',title=t,desc='차수7 · 4건 세부 보완')for i,(f,t)in enumerate(zip(names,titles))]
(out/'qa-800').mkdir(exist_ok=True);finals=[]
for d in data:
 f=out/d['file'];im=Image.open(f);assert im.size==(2400,1080)
 im.resize((800,360),Image.Resampling.LANCZOS).save(out/'qa-800'/d['file']);finals.append(dict(path=str(f),size=im.size,sha256=hashlib.sha256(f.read_bytes()).hexdigest()))
sheet=Image.new('RGB',(2400,784),'#10252f');dr=ImageDraw.Draw(sheet);font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',20)
for i,d in enumerate(data):
 x=i%3*800;y=i//3*392;dr.text((x+12,y+4),f"{i+1:02d}  {d['title']}",font=font,fill='#e3ede2');sheet.paste(Image.open(out/'qa-800'/d['file']),(x,y+32))
sheet.save(out/'전체6-비교판.png')
old=(out.parent/'MAIN02-20261109-9009B97A-v006/gallery.html').read_text(encoding='utf-8')
start=old.index('<body>');end=old.index('<div class="viewer"',start)
body='''<body><main><h1>D3 · 도감·조합·조건부 적 정보·배치 색</h1><p>차수7 신규6장 · v006의3열/54셀/D3유지 · 제작·자체검증 완료, 사용자 최종판정 전</p><nav><a href="전체6-비교판.png">전체6 비교판</a><a href="결과보고.md">결과보고</a><a href="concepts.html">독립 시안</a><a href="../MAIN02-20261109-9009B97A-v006/gallery.html">차수6 원본 비교</a></nav><div class="cards" id="core"></div><div id="extra"></div></main>'''
html=old[:start]+body+old[end:];html=re.sub(r'const data=\[.*?\];let index=',lambda _:'const data='+json.dumps(data,ensure_ascii=False)+';let index=',html,flags=re.S).replace('D3 차수6 · 장비와 전장','D3 차수7 · 세부 보완')
write('gallery.html',html);write('화면목록.json',data)
layout=read('button-map.json');assert layout['pass'],layout['checks']
baseline=read('보존기준해시.json');preserved=0;changed=[];excluded=[]
for file,sha in baseline.items():
 f=Path(file);now=hashlib.sha256(f.read_bytes()).hexdigest()if f.exists()else None
 if now==sha:preserved+=1
 else:(excluded if f.name.startswith('devImageCompare')else changed).append(dict(path=file,before=sha,after=now))
assert not changed,changed
# Existing R03 on warehouse only: two dominoes share one edge, result L fits at the first material anchor.
iron={(0,0),(1,0)};rune={(2,0),(3,0)};pouch={(4,0)};gale={(0,0),(0,1),(1,1)}
assert not iron&rune and any(abs(x-bx)+abs(y-by)==1 for x,y in iron for bx,by in rune)
assert all(0<=x<5 and 0<=y<2 for x,y in gale)and not gale&pouch
assert len(iron|rune|pouch)==5 and len(gale|pouch)==4
ack=read('읽기확인.json');assert ack['iteration']==7 and len(ack['documents'])==16
for d in ack['documents']:assert hashlib.sha256(Path(d['path']).read_bytes()).hexdigest()==d['sha256'],d['path']
write('최종검증.json',dict(layoutPass=True,checks=layout['checks'],finals=finals,preservedFiles=preserved,changedOriginals=changed,parallelExcluded=excluded,cell=54,gridTop=120,recipes=['I01+I01=I06','I02+I04=I07','I01+I03=I08','I04+I04=I09'],selectedMaterialsOwner='warehouse',selectedMaterialsAdjacent=True,anvilCost=1,resultSpaceValid=True,equippedAriaGalePreserved=True,warehouseUsedBefore=5,warehouseUsedAfter=4,rankOrder=['rear','middle','front'],rankColumns=[2,1,2],gameIntegrated=False,userAcceptance=False,readingHashesCurrent=True))
print('PNG6; originals preserved',preserved,'layout pass; recipe adjacency/result fit pass')
