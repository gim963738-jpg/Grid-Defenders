from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,hashlib,re
out=Path(__file__).resolve().parent
themes=[('snow','설산성채','서릿빛 성채의 방어선'),('desert','사막유적','모래 아래 잠든 유적'),('coast','해안항구','푸른 항구의 전초기지')]
names=[f'{i*3+d:02d}-{t[0]}-D{d}' for i,t in enumerate(themes) for d in range(1,4)]
font=lambda n:ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',n)
bold=lambda n:ImageFont.truetype('C:/Windows/Fonts/malgunbd.ttf',n)
def sheet(rows,file):
 im=Image.new('RGB',(2520,105+len(rows)*435),(15,29,38)); dr=ImageDraw.Draw(im)
 for col,title in enumerate(['D1  무광 금속','D2  주조 프레임','D3  차콜 글라스']):dr.text((20+col*835,25),title,font=bold(32),fill='#e9e2cf')
 for row,idx in enumerate(rows):
  dr.text((20,103+row*435),themes[idx][1]+'  ·  같은 배경 / 공통 버튼 비교',font=font(24),fill='#becdd2')
  for col in range(3):
   n=idx*3+col; tile=Image.open(out/(names[n]+'.png')).convert('RGB').resize((800,360),Image.Resampling.LANCZOS);im.paste(tile,(20+col*835,145+row*435));dr.text((26+col*835,505+row*435),f'{n+1:02d}   {themes[idx][1]} × D{col+1}',font=font(18),fill='#d5dcda')
 im.save(out/file)
sheet([0,1,2],'비교판-전체9.png')
for i,t in enumerate(themes):sheet([i],f'비교판-{t[1]}.png')
old=out.parent/'MAIN02-20261109-9009B97A'
s=(old/'gallery.html').read_text(encoding='utf-8')
s=s.replace('전쟁터 / 모험 숲 / 마계','설산 / 사막 / 해안 × 공통 버튼').replace('같은 전투, 세 가지 세계','새로운 전장 × 공통 버튼 세 가지')
start=s.index('<p>05');end=s.index('</p>',start)+4
s=s[:start]+'<p>선호한 회화적 재질·소품 방식·판타지 분위기를 이어받은 새 배경 3종입니다. 각 행의 같은 배경에 D1 무광 금속 · D2 주조 프레임 · D3 차콜 글라스를 동일하게 적용했습니다. 버튼 위치와 전투 상태가 같아 디자인 차이를 비교할 수 있습니다. 각 이미지를 눌러 확대하거나 개별 2400×1080 PNG를 열어 보세요.</p>'+s[end:]
s=s.replace('비교판-전쟁터','비교판-설산성채').replace('비교판-햇빛숲','비교판-사막유적').replace('비교판-마계','비교판-해안항구').replace('전쟁터 비교','설산성채 비교').replace('햇빛 숲 비교','사막유적 비교').replace('마계 비교','해안항구 비교')
s=s.replace('<a href="결과보고.md"','<a href="buttons-comparison.png" target="_blank">버튼 확대 비교</a><a href="결과보고.md"')
s=s.replace('data-filter="0">전쟁터','data-filter="0">설산성채').replace('data-filter="1">햇빛 숲','data-filter="1">사막유적').replace('data-filter="2">마계','data-filter="2">해안항구').replace('차수1','차수2')
a=s.index('const data=');b=s.index('grid.innerHTML=',a)
data=[[names[i],themes[i//3][1],themes[i//3][2]+' · D'+str(i%3+1)] for i in range(9)]
s=s[:a]+'const data='+json.dumps(data,ensure_ascii=False)+';\n'+s[b:]
s=s.replace('${i%3+1}안','D${i%3+1}').replace('backgrounds/${file}.png','backgrounds/${[\'snow\',\'desert\',\'coast\'][Math.floor(i/3)]}.png')
(out/'gallery.html').write_text(s,encoding='utf-8')
inventory=[]
for n in names:
 p=out/(n+'.png');im=Image.open(p);assert im.size==(2400,1080),(n,im.size)
 inventory.append(dict(file=str(p),size=im.size,sha256=hashlib.sha256(p.read_bytes()).hexdigest()))
baseline=json.loads((out/'보존기준해시.json').read_text(encoding='utf-8'))
changed=[p for p,h in baseline.items() if not Path(p).exists() or hashlib.sha256(Path(p).read_bytes()).hexdigest()!=h]
qa=dict(finals=inventory,backgrounds={t[0]:dict(size=Image.open(out/'backgrounds'/(t[0]+'.png')).size,sha256=hashlib.sha256((out/'backgrounds'/(t[0]+'.png')).read_bytes()).hexdigest()) for t in themes},preservedFiles=len(baseline),changedOriginals=changed)
assert not changed,changed
(out/'파일검증.json').write_text(json.dumps(qa,ensure_ascii=False,indent=2),encoding='utf-8')
print('9 PNG sizes checked, originals preserved:',len(baseline),'contact sheets and gallery created')
