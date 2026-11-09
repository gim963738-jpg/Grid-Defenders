"""Measure untouched generated PNGs and build explicitly requested review artifacts."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import hashlib, json
ROOT=Path(__file__).resolve().parent
NAMES={'green-warrior':'녹색 전사','blue-golem':'푸른 골렘','undead-warrior':'언데드 전사'}
VIEWS={'front_000':('정면',0),'left_270':('좌측 정측면',270),'right_090':('우측 정측면',90)}
MANUAL={
 'green-warrior/front_000.png':([274,108,990,1211],[615,1208],[438,110,817,469]),
 'green-warrior/left_270.png':([442,122,800,1196],[590,1193],[458,124,774,441]),
 'green-warrior/right_090.png':([396,110,798,1206],[640,1204],[461,112,775,435]),
 'blue-golem/front_000.png':([125,130,1128,1163],[620,1160],[554,332,687,465]),
 'blue-golem/left_270.png':([433,134,900,1164],[545,1162],[444,353,535,470]),
 'blue-golem/right_090.png':([346,132,820,1167],[640,1164],[714,354,794,460]),
 'undead-warrior/front_000.png':([362,166,884,1207],[608,1204],[485,166,735,505]),
 'undead-warrior/left_270.png':([455,178,792,1205],[614,1203],[456,178,788,515]),
 'undead-warrior/right_090.png':([419,205,794,1205],[620,1203],[420,205,793,532]),
}
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def run():
    records=json.loads((ROOT/'generation-records.json').read_text('utf-8'))
    items=[]
    for species in NAMES:
        for stem,(label,angle) in VIEWS.items():
            path=ROOT/species/(stem+'.png')
            if not path.exists(): continue
            im=Image.open(path); a=im.getchannel('A'); hist=a.histogram()
            box=a.point(lambda x:255 if x>=16 else 0).getbbox()
            solid=a.point(lambda x:255 if x>=240 else 0).getbbox()
            rec=next(r for r in records if r['output']==f'{species}/{stem}.png')
            items.append(dict(file=f'{species}/{stem}.png',species=species,direction=label,angle=angle,width=im.width,height=im.height,mode=im.mode,sha256=sha(path),sourceSha256=sha(Path(rec['generatedPath'])),bytePreserved=sha(path)==sha(Path(rec['generatedPath'])),alpha={'zero':hist[0],'opaque':hist[255],'partial':sum(hist[1:255]),'visibleBoundsAlpha16':box,'solidBoundsAlpha240':solid,'edgeClear':bool(box and box[0]>0 and box[1]>0 and box[2]<im.width and box[3]<im.height)},bodyBounds=None,footAnchor=None,measurement='alpha thresholds computed; body/foot manual observations added separately'))
    for v in items:
        body,foot,head=MANUAL[v['file']]
        v.update(bodyBounds=body,bodyHeight=body[3]-body[1],footAnchor=foot,headBounds=head,measurement='Full image visual manual bounding boxes, approximate ±8px; body excludes arrows/hilt/airborne chips/top flame; golem body includes functional lower energy contact. Foot y uses visible solid boot/energy contact baseline near alpha>=240. Head box includes hair/headgear for humanoids, rock face only for golem; profile width changes by projection.')
    for rec in records:
        rec['attachmentHashes']=[{'order':i+1,'path':p,'sha256':sha(Path(p))} for i,p in enumerate(rec['attachments'])]
    (ROOT/'generation-records.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),'utf-8')
    summary={s:{'bodyHeightRange':[min(v['bodyHeight'] for v in items if v['species']==s),max(v['bodyHeight'] for v in items if v['species']==s)],'footLineSpread':max(v['footAnchor'][1] for v in items if v['species']==s)-min(v['footAnchor'][1] for v in items if v['species']==s)} for s in NAMES if any(v['species']==s for v in items)}
    (ROOT/'manifest.json').write_text(json.dumps({'task':'MAIN01-20261109-7AE73F23','iteration':1,'count':len(items),'coordinateSystem':'origin top-left, bounds [left,top,rightExclusive,bottomExclusive], alpha16 excludes faint fringe; body excludes projecting gear and halo','relativeHeightPolicy':'same canvas display scale; no canonical inter-species height approved','summary':summary,'images':items},ensure_ascii=False,indent=2),'utf-8')
    font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',18)
    for theme,color,fg in [('light',(238,239,235,255),'#152016'),('dark',(29,35,44,255),'#eeeeee')]:
        sheet=Image.new('RGBA',(1260,1380),color); d=ImageDraw.Draw(sheet)
        for i,v in enumerate(items):
            x=(i%3)*420;y=(i//3)*460
            d.text((x+12,y+8),f"{NAMES[v['species']]} · {v['direction']} {v['angle']}°",font=font,fill=fg)
            im=Image.open(ROOT/v['file']).convert('RGBA'); im.thumbnail((420,420),Image.Resampling.NEAREST)
            sheet.alpha_composite(im,(x+(420-im.width)//2,y+36+(420-im.height)//2))
        sheet.convert('RGB').save(ROOT/f'comparison-{theme}.png')
    cards=''.join(f'<figure><figcaption>{NAMES[v["species"]]} · {v["direction"]} {v["angle"]}°</figcaption><a href="{v["file"]}" target="_blank"><img src="{v["file"]}" alt="{NAMES[v["species"]]} {v["direction"]}"></a><a href="{v["file"]}" target="_blank">원본 PNG 열기</a></figure>' for v in items)
    html='''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>몬스터 3종 × 3방향</title><style>
    :root{font-family:system-ui,sans-serif;color:#182018;background:#eef0eb}body{margin:24px}button,a{font-size:16px}button{padding:12px;margin:5px}main{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}figure{margin:0;padding:12px;background:var(--tile,#e5e7e2)}img{width:100%;display:block;image-rendering:pixelated}body.dark{background:#151b22;color:#eee;--tile:#242c38}a{color:inherit}body.original main{display:block}body.original img{width:auto;max-width:none}body.original figure{overflow:auto}p{max-width:1000px}</style>
    <h1>몬스터 3종 · 정면 / 좌측면 / 우측면</h1><p>MAIN01-20261109-7AE73F23 · 차수1 · 사용자 미적 합격 대기. 행은 녹색 전사·푸른 골렘·언데드 전사, 열은 0°·270°·90°.</p>
    <button onclick="document.body.classList.remove('dark')">밝은 배경</button><button onclick="document.body.classList.add('dark')">어두운 배경</button><button onclick="document.body.classList.toggle('original')">원본 100% 크기 전환</button>
    <p>전시 기준: 원본 전체 캔버스를 동일 배율로 표시합니다. 투명 여백을 잘라 키를 맞추지 않았습니다. 개체별 본체 높이/발선은 manifest.json에 별도 기록하며 종간 상대키·게임 표시크기는 확정하지 않았습니다. 원본 확대는 생성픽셀 1:1 표시이며 재인코딩하지 않았습니다.</p><p><a href="comparison-light.png">밝은 3×3 PNG</a> · <a href="comparison-dark.png">어두운 3×3 PNG</a> · <a href="manifest.json">manifest</a> · <a href="검수.md">검수</a></p><main>'''+cards+'</main></html>'
    (ROOT/'index.html').write_text(html,'utf-8')
    print(json.dumps(items,ensure_ascii=False,indent=2))
if __name__=='__main__': run()
