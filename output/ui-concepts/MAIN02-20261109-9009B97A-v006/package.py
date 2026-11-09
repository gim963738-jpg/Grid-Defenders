from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,ast,re,hashlib
out=Path(__file__).resolve().parent
s=(out/'screens.js').read_text(encoding='utf-8-sig');names=ast.literal_eval(re.search(r'const names=(\[.*?\]);',s).group(1))[1:];titles=ast.literal_eval(re.search(r'const titles=(\[.*?\]);',s).group(1))[1:]
def write(n,x):(out/n).write_text(x if isinstance(x,str) else json.dumps(x,ensure_ascii=False,indent=2),encoding='utf-8')
data=[dict(n=i+1,file=f+'.png',title=t,desc='필수 화면' if i<6 else '영웅 탐색 보조 1장')for i,(f,t)in enumerate(zip(names,titles))]
finals=[];(out/'qa-800').mkdir(exist_ok=True)
for d in data:
 f=out/d['file'];im=Image.open(f);assert im.size==(2400,1080)
 im.resize((800,360),Image.Resampling.LANCZOS).save(out/'qa-800'/d['file']);finals.append(dict(path=str(f),size=im.size,sha256=hashlib.sha256(f.read_bytes()).hexdigest()))
sheet=Image.new('RGB',(2400,784),'#10252f');dr=ImageDraw.Draw(sheet);font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',20)
for j,d in enumerate(data[:6]):
 x=(j%3)*800;y=(j//3)*392;dr.text((x+12,y+4),f"{d['n']:02d}  {d['title']}",font=font,fill='#e3ede2');sheet.paste(Image.open(out/'qa-800'/d['file']),(x,y+32))
sheet.save(out/'전체6-비교판.png')
# Keep the gallery frame only; replace every prior title, link and image entry.
previous=(out.parent/'MAIN02-20261109-9009B97A-v005/gallery.html').read_text(encoding='utf-8')
start=previous.index('<body>');end=previous.index('<div class="viewer"',start)
body='''<body><main><h1>D3 · 장비 3열과 전장</h1><p>차수6 · 상점 → 영웅 → 창고 / 필수6장 + 영웅후보 보조1장<br>제작·자체검수 완료, 사용자 최종 판정 전</p><nav><a href="전체6-비교판.png">전체6 비교판</a><a href="결과보고.md">결과보고</a><a href="concepts.html">독립 시안</a></nav><h2 class="section-title">필수 화면 6장</h2><div class="cards" id="core"></div><h2 class="section-title">영웅 후보 · 보조</h2><div class="cards" id="extra"></div></main>'''
html=previous[:start]+body+previous[end:]
html=re.sub(r'const data=\[.*?\];let index=',lambda _: 'const data='+json.dumps(data,ensure_ascii=False)+';let index=',html,flags=re.S).replace("$(i<9?'core':'extra')","$(i<6?'core':'extra')").replace('D3 차수5 · 플레이 흐름','D3 차수6 · 장비와 전장')
write('gallery.html',html);write('화면목록.json',data)
layout=read=lambda n:json.loads((out/n).read_text(encoding='utf-8-sig'))
qa=read('button-map.json');assert qa['pass']
before=read('보존기준해시.json');changed=[];excluded=[];preserved=0
for file,sha in before.items():
 f=Path(file);now=hashlib.sha256(f.read_bytes()).hexdigest() if f.exists()else None
 if now==sha:preserved+=1
 else:(excluded if f.name.startswith('devImageCompare')else changed).append(dict(path=file,before=sha,after=now))
assert not changed,changed
gale={(0,0),(0,1),(1,1)};rune={(2,1),(3,1)};pouch={(4,0)};iron={(3,2),(4,2)}
assert len(gale|rune|pouch)==6 and len(gale|iron)==5 and not gale&iron
assert not gale&rune and not gale&pouch
def fits(shape,x,y,cols,rows,occupied):return all(0<=x+dx<cols and 0<=y+dy<rows and (x+dx,y+dy) not in occupied for dx,dy in shape)
assert fits(gale,0,0,5,2,rune|pouch) and not fits(gale,4,1,5,2,rune|pouch)
assert fits({(0,0),(1,0)},3,2,5,4,gale)
write('최종검증.json',dict(layoutPass=True,checks=qa['checks'],finals=finals,core=6,support=1,preservedFiles=preserved,changedOriginals=changed,parallelExcluded=excluded,cell=54,pitch=56,hero=[5,4],storageProposal=[5,2],sameGridTop=120,warehouseUsedAfter=6,heroUsedAfter=2,oneCellGaleRejected=True,gameIntegrated=False,userAcceptance=False))
print('6 core + 1 support; native800 generated; originals preserved',preserved)
