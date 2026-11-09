from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,re,ast,hashlib,math
out=Path(__file__).resolve().parent
s=(out/'flow.js').read_text(encoding='utf-8-sig')
names=ast.literal_eval(re.search(r'const names=(\[.*?\]);',s).group(1))[1:]
titles=ast.literal_eval(re.search(r'const titles=(\[.*?\]);',s).group(1))[1:]
def write(n,obj): (out/n).write_text(obj if isinstance(obj,str) else json.dumps(obj,ensure_ascii=False,indent=2),encoding='utf-8')
data=[dict(n=i+1,file=f+'.png',title=t,group='필수 연결 9장' if i<9 else '동작 검수 보조',desc='800×360 논리화면 · 2400×1080 PNG') for i,(f,t) in enumerate(zip(names,titles))]
finals=[]
(out/'qa-800').mkdir(exist_ok=True)
for d in data:
 path=out/d['file'];im=Image.open(path);assert im.size==(2400,1080)
 im.resize((800,360),Image.Resampling.LANCZOS).save(out/'qa-800'/d['file'])
 finals.append(dict(path=str(path),size=im.size,sha256=hashlib.sha256(path.read_bytes()).hexdigest()))
font=lambda n:ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',n)
for subset,name in [(data[:9],'전체9-비교판.png'),(data[9:],'보조상태-비교판.png')]:
 sheet=Image.new('RGB',(2400,392*math.ceil(len(subset)/3)),'#10252f');dr=ImageDraw.Draw(sheet)
 for j,d in enumerate(subset):
  x=(j%3)*800;y=(j//3)*392
  dr.text((x+12,y+4),f"{d['n']:02d}  {d['title']}",font=font(20),fill='#e8efe6')
  sheet.paste(Image.open(out/d['file']).resize((800,360),Image.Resampling.LANCZOS),(x,y+32))
 sheet.save(out/name)
# Native-size crop evidence: all use the same logical cell size 56 and PNG scale 3.
sheet=Image.new('RGB',(1800,1000),'#10252f');dr=ImageDraw.Draw(sheet)
dr.text((30,20),'동일 셀 56px · 1칸 재료와 L자 3칸 조합장비',font=font(34),fill='#e9f2e5')
gale=Image.open(out/'06-equipment.png').crop((36,702,378,1044))
pouch=Image.open(out/'07-equipped.png').crop((732,702,900,870))
sheet.paste(gale,(70,160));sheet.paste(pouch,(520,160))
dr.text((70,530),'질풍의 검: L자 점유3 / 그림영역114×114 논리px',font=font(22),fill='#cbdcd4')
dr.text((520,365),'주머니: 점유1 / 56×56 논리px',font=font(22),fill='#cbdcd4')
dr.text((70,590),'질풍검 원본1254² · 콘텐츠 bbox1099×1095 → 94.65×94.31 논리px',font=font(24),fill='#cbdcd4')
dr.text((70,640),'주머니 crop285×300 · 콘텐츠234×257 → 39.00×42.83 논리px',font=font(24),fill='#cbdcd4')
dr.text((70,710),'두 인벤 모두 셀56 / 간격2 / 안쪽여백3 · 조합장비를 1칸 그림으로 축소하지 않음',font=font(24),fill='#e1ebce')
dr.text((70,770),'추출은 최종 화면 검수용 표시 영역이며, 기존 원본·아틀라스는 변경하지 않음',font=font(22),fill='#bbd3cd')
sheet.save(out/'아이템-동일셀-검수.png')
html='''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>D3 차수5 · 플레이 흐름</title><style>*{box-sizing:border-box}body{margin:0;background:#10242f;color:#edf3ec;font:15px 'Malgun Gothic',sans-serif}main{max-width:1500px;margin:auto;padding:24px}h1{font-size:26px;margin:0 0 8px}p{line-height:1.65;color:#c1d4d3}a{color:#d5ecc7}nav{display:flex;gap:12px;flex-wrap:wrap;margin:16px 0 24px}.cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.tile{padding:0;border:1px solid #99b5ae88;border-radius:16px;overflow:hidden;color:#edf3ec;background:#1a343c;cursor:pointer;text-align:left}.tile img{width:100%;display:block}.tile h2{font-size:17px;margin:12px}.tile p{font-size:13px;margin:0 12px 12px}.viewer{position:fixed;inset:0;background:#08141af5;z-index:9;display:none;overflow:auto;padding:12px}.viewer.open{display:block}.toolbar{position:sticky;top:0;display:flex;align-items:center;gap:8px;padding:8px;background:#18343bef;border-radius:12px;margin-bottom:8px}.toolbar h2{font-size:17px;flex:1;margin:0}button.control,.toolbar a{min-width:48px;min-height:48px;border:1px solid #b8d2c9;border-radius:12px;background:#26494c;color:#eef5ec;font:700 14px 'Malgun Gothic',sans-serif;padding:12px;text-decoration:none}.viewer .large{display:block;width:min(100%,1600px);height:auto;margin:0 auto}.viewer.native .large{width:800px;max-width:none}.section-title{font-size:22px;margin-top:32px}.guide{background:#19383d;padding:14px 18px;border-radius:14px}.guide b{color:#e4f3cb}@media(max-width:850px){.cards{grid-template-columns:1fr}.toolbar{flex-wrap:wrap}}</style><body><main><h1>D3 · 준비에서 전투까지</h1><p>차수5 신규 화면 · 이전 통합/maintenance는 불합격 분석 자료 · 제작·자체검수 완료, 사용자 합격 전 정적 UI 제안</p><nav><a href="전체9-비교판.png">연결9장 비교판</a><a href="보조상태-비교판.png">보조 동작 비교판</a><a href="아이템-동일셀-검수.png">실제 셀·크기 검수</a><a href="결과보고.md">결과보고</a></nav><div class="guide"><b>본 흐름 01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09</b><p>병력 선택 → 실제 칸 배치 → 영웅 탐색·배치 → 기존 병력 이동 → 준비 → 별도 장비 → 착용 → 자동 4회 → 배치·이월 장비를 유지한 정비 복귀.<br>장비 확인: 06 → 15·16(주머니 보관 구매) → 12(3칸 착용 확인) → 07(완료). 13·14 직접 구매 장착과 17·18 창고 복귀는 별도 조작 비교 분기.</p></div><h2 class="section-title">필수 연결 9장</h2><div class="cards" id="core"></div><h2 class="section-title">선택·이동·구매 검수 보조</h2><div class="cards" id="extra"></div></main><div class="viewer" id="viewer"><div class="toolbar"><button class="control" id="prev">← 이전</button><button class="control" id="next">다음 →</button><h2 id="vtitle"></h2><button class="control" id="native">800px 실제 배율</button><a id="original" target="_blank">원본 PNG</a><button class="control" id="close">닫기 ×</button></div><img class="large" id="large" alt="화면 전체"></div><script>const data=DATA;let index=0;const $=id=>document.getElementById(id);function show(i){index=(i+data.length)%data.length;const d=data[index];$('large').src=d.file;$('original').href=d.file;$('vtitle').textContent=String(d.n).padStart(2,'0')+' '+d.title;$('viewer').classList.add('open')}data.forEach((d,i)=>{const b=document.createElement('button');b.className='tile';b.innerHTML='<img src="'+d.file+'" alt="'+d.title+'"><h2>'+String(d.n).padStart(2,'0')+' '+d.title+'</h2><p>'+d.desc+'</p>';b.onclick=()=>show(i);$(i<9?'core':'extra').append(b)});$('prev').onclick=()=>show(index-1);$('next').onclick=()=>show(index+1);$('close').onclick=()=>$('viewer').classList.remove('open');$('native').onclick=()=>$('viewer').classList.toggle('native');document.onkeydown=e=>{if(!$('viewer').classList.contains('open'))return;if(e.key==='Escape')$('close').click();if(e.key==='ArrowRight')show(index+1);if(e.key==='ArrowLeft')show(index-1)};</script></body></html>'''
write('gallery.html',html.replace('DATA',json.dumps(data,ensure_ascii=False)))
write('화면목록.json',data)
receipt=json.loads((out/'layout-receipt.json').read_text(encoding='utf-8-sig'));layout=json.loads(receipt['result']['result']);assert layout['pass'],layout['checks']
baseline=json.loads((out/'보존기준해시.json').read_text(encoding='utf-8'))
excluded=[];changed=[];preserved=0
for path,before in baseline.items():
 f=Path(path);after=hashlib.sha256(f.read_bytes()).hexdigest() if f.exists() else None
 if after!=before:
  entry=dict(path=path,before=before,after=after)
  (excluded if f.name.startswith('devImageCompare') else changed).append(entry)
 else:preserved+=1
assert not changed,changed
gale={(0,0),(0,1),(1,1)};pouch={(4,0)};hero=set();assert not gale&pouch
def fits(cells,cols,rows,occupied):return all(0<=x<cols and 0<=y<rows and (x,y)not in occupied for x,y in cells)
assert fits(gale,5,4,hero) and not fits({(x+4,y+3)for x,y in gale},5,4,hero)
assert fits(gale,5,2,pouch)
qa=dict(layoutPass=layout['pass'],checks=layout['checks'],finals=finals,preservedFiles=preserved,parallelExcludedChanges=excluded,changedOriginals=changed,cell=56,warehouseProposal=[5,2],inventory=[5,4],galeCells=sorted(gale),pouchCells=sorted(pouch),invalidOneCellRejected=True,economy={'initialSample':900,'soldiers':175,'materials':130,'pouch':100,'battleStart':495,'rewardSample':120,'return':615},gameIntegrated=False,userAcceptance=False)
write('최종검증.json',qa)
print('PNG',len(finals),'preserved',preserved,'parallel excluded',len(excluded),'layout pass',layout['pass'])
