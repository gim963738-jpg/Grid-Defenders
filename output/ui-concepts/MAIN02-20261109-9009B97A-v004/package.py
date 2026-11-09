from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,hashlib,re
out=Path(__file__).resolve().parent;maint=out.parent/'MAIN02-20261109-9009B97A-maintenance';root=out.parents[2]
font=lambda n:ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',n)
bold=lambda n:ImageFont.truetype('C:/Windows/Fonts/malgunbd.ttf',n)
def write(base,n,s): (base/n).write_text(s,encoding='utf-8')
def receipt(base,n):
 d=json.loads((base/n).read_text(encoding='utf-8-sig'));assert d['ok'],d
 return json.loads(d['result']['result'])
names=['01-soldier-five','02-hero-page1','03-hero-page2','04-shop-integrated','05-shop-buy','06-shop-transfer','07-next-boss'];labels=['병사5칸','영웅 첫 목록·스킬 동시','영웅 다음 목록·8명 탐색','통합 상점 기본','상점에서 직접 구매','영웅 장비와 창고 이동','다음 보스 정보']
mnames=['01-battle','02-initial-preparation','03-maintenance-4x2','04-maintenance-5x2','05-maintenance-transfer'];mlabels=['전투·4회 구간','초기 배치 준비','정비 A · 창고4×2','정비 B · 창고5×2','정비 · 영웅에서 창고 이동']
def contact(base,ns,ls,file):
 rows=(len(ns)+1)//2;im=Image.new('RGB',(2460,rows*610+20),'#10232d');dr=ImageDraw.Draw(im)
 for i,f in enumerate(ns):
  x=20+(i%2)*1220;y=20+(i//2)*610;a=Image.open(base/(f+'.png'));assert a.size==(2400,1080)
  dr.text((x,y),f'{i+1:02d}  {ls[i]}',font=bold(28),fill='#e7eedd');im.paste(a.resize((1200,540),Image.Resampling.LANCZOS),(x,y+48))
 im.save(base/file)
contact(out,names,labels,'전체7-비교판.png');contact(maint,mnames,mlabels,'추가4-비교판.png')
im=Image.new('RGB',(2400,3420),'#10232d');dr=ImageDraw.Draw(im)
for i,(f,t) in enumerate(zip(names[3:6],labels[3:6])):dr.text((20,i*1140+5),t,font=bold(30),fill='#e0ecda');im.paste(Image.open(out/(f+'.png')),(0,i*1140+60))
im.save(out/'통합상점-확대비교.png')
art=json.loads((out/'아트측정.json').read_text(encoding='utf-8'))
metrics=[]
for cell in [48,56]:
 for i in [0,2,4,5]:
  a=art[i];b=a['alphaContentBBox'];cw,ch=b[2]-b[0],b[3]-b[1]
  if i==5:sw,sh=a['sourceCanvas'];pw=ph=cell*2+2;rotate=False
  elif i==4:sw,sh=a['crop'][2:];pw=ph=cell;rotate=False
  else:sh,sw=a['crop'][2:];cw,ch=ch,cw;pw,ph=cell*2+2,cell;rotate=True
  scale=min((pw-6)/sw,(ph-6)/sh)
  metrics.append(dict(id=a['id'],cell=cell,occupiedCells=3 if i==5 else 1 if i==4 else 2,footprintBox=[pw,ph],sourceCanvas=a['sourceCanvas'],sourceContentBBox=b,rotation90=rotate,sourceDisplayScale=round(scale,5),displayContentLogical=[round(cw*scale,2),round(ch*scale,2)],displayContentFinalPNG=[round(cw*scale*3,2),round(ch*scale*3,2)]))
write(out,'실제표시배율.json',json.dumps(metrics,ensure_ascii=False,indent=2));write(maint,'실제표시배율.json',json.dumps(metrics,ensure_ascii=False,indent=2))
comp=Image.new('RGB',(2400,1500),'#10232d');dr=ImageDraw.Draw(comp);dr.text((30,20),'같은 원본 · 실제 다칸 점유와 표시 크기',font=bold(36),fill='#edf3e2')
for col,(base,fil,cell) in enumerate([(out,'04-shop-integrated',48),(maint,'03-maintenance-4x2',56)]):
 x=30+col*1180;dr.text((x,80),('통합 상점 · 48px 셀' if col==0 else '정비 분리 · 56px 셀'),font=bold(30),fill='#cbe0ca');screen=Image.open(base/(fil+'.png'))
 boxes=[(12,200,98,48),(112,200,98,48),(12,250,98,98)] if col==0 else [(128,234,114,56),(128,292,114,56),(12,234,114,114)]
 for row,(i,box) in enumerate(zip([0,2,5],boxes)):
  y=145+row*350;a=next(a for a in metrics if a['cell']==cell and a['id']==art[i]['id']);dr.text((x,y),['철검 · 1단계 재료 / 2칸','가속 룬 · 1단계 재료 / 2칸','질풍의 검 · 조합 장비 / L자3칸'][row],font=bold(25),fill='#e9edde')
  xx,yy,w,h=box;crop=screen.crop((xx*3,yy*3,(xx+w)*3,(yy+h)*3));comp.paste(crop,(x,y+42));dr.text((x+370,y+64),f"콘텐츠 {a['displayContentLogical'][0]} × {a['displayContentLogical'][1]} 논리px",font=font(24),fill='#c4d9cd');dr.text((x+370,y+108),f"원본 배율 {a['sourceDisplayScale']:.5f} / 최종PNG ×3",font=font(23),fill='#b1cabc')
 dr.text((x,1250),'상품 철검 그림: '+('원본대비0.13737, 콘텐츠21.71×63.74px' if col==0 else '원본대비0.16970, 콘텐츠26.81×78.74px'),font=font(22),fill='#c5d9ca')
dr.text((30,1340),'원본: 철검 crop190×495, 룬267×460 / 질풍의 검1254×1254 · alpha>32 콘텐츠 bbox 측정',font=font(24),fill='#cbdcc9');dr.text((30,1385),'이미지는 최종 PNG에서 같은3배 척도로 잘라 배치 · 모든 장비를 한 칸 그림으로 줄이지 않음',font=font(24),fill='#b9d1c0');comp.save(out/'아이템-실제크기비교.png');comp.save(maint/'아이템-실제크기비교.png')
# Reuse a small, verified local gallery frame, then give each collection its own data and links.
template=(out.parent/'MAIN02-20261109-9009B97A-v003/gallery.html').read_text(encoding='utf-8')
for base,ns,ls,title,contactfile in [(out,names,labels,'D3 · 선택과 통합 상점','전체7-비교판.png'),(maint,mnames,mlabels,'D3 · 전투와 정비 · 작은 창고 비교','추가4-비교판.png')]:
 s=template;s=s.replace('선택한 D3, 안쪽 구성까지',title).replace('차수3','차수4').replace('4장 비교판','전체 비교판').replace('비교판-펼침4.png',contactfile)
 a=s.index('<p>상단');b=s.index('</p>',a)+4;s=s[:a]+'<p>선택한 D3를 유지한 정적 비교 시안입니다. 이미지를 눌러 개별2400×1080 PNG를 확대할 수 있습니다. 창고·진행·이동 구성은 사용자 검토용 제안이며 게임에 통합하지 않았습니다.</p>'+s[b:]
 s=s.replace('상단정보판-전후.png','아이템-실제크기비교.png').replace('상단 전후 확대','아이템 실제크기 비교').replace('00-D3-base-after.png',(ns[0]+'.png')).replace('조정 기본 화면','첫 화면')
 a=s.index('const data=');b=s.index('grid.innerHTML=',a);s=s[:a]+'const data='+json.dumps([[f,t,'실제 기능 자료를 바탕으로 한 UI 제안'] for f,t in zip(ns,ls)],ensure_ascii=False)+';\n'+s[b:];s=s.replace('(i+4)%4',f'(i+{len(ns)})%{len(ns)}')
 write(base,'gallery.html',s)
# Validate layout and original preservation; named main01 comparison files remain outside this task.
qa=receipt(out,'layout-receipt.json');mqa=receipt(maint,'layout-receipt.json');assert qa['pass'] and mqa['pass']
baseline=json.loads((out/'보존기준해시.json').read_text(encoding='utf-8'));changed=[p for p,h in baseline.items() if not Path(p).exists() or hashlib.sha256(Path(p).read_bytes()).hexdigest()!=h];excl=[p for p in changed if Path(p).name.startswith('devImageCompare')];other=[p for p in changed if p not in excl];assert not other,other
for base,q,ns in [(out,qa,names),(maint,mqa,mnames)]:
 write(base,'버튼위치.json',json.dumps(q,ensure_ascii=False,indent=2));write(base,'최종검증.json',json.dumps(dict(layoutPass=q['pass'],finals=[dict(path=str(base/(f+'.png')),size=Image.open(base/(f+'.png')).size,sha256=hashlib.sha256((base/(f+'.png')).read_bytes()).hexdigest()) for f in ns],preservedFiles=len(baseline)-len(excl),excludedParallelChanges=excl,changedOriginals=other,gameIntegrated=False,userVisualAcceptance=False),ensure_ascii=False,indent=2))
print('contact sheets, galleries, scale metrics complete; preservation',len(baseline)-len(excl),'excluded',len(excl))

