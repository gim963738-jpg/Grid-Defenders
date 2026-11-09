from pathlib import Path
import json, hashlib, shutil
from PIL import Image

OUT=Path(__file__).resolve().parent
ROOT=OUT.parents[3]
ORIGINAL=OUT.parent/'pixel_8views_v01/images/01_front_000.png'
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
shutil.copyfile(ORIGINAL, OUT/'original.png')
records=json.loads((OUT/'generation-refined-returned.json').read_text(encoding='utf-8-sig'))
items=[]
# Native image landmarks, manually reviewed: y hair top/chin/shoulder/crotch/knee/sole.
landmarks=[[17,366,408,828,943,1231],[125,474,511,876,969,1180],[110,461,491,864,961,1169],[92,438,451,869,950,1195],[126,460,487,880,965,1186]]
names=['기존','1','2','3','4']
subtitles=['기존 SD 원본','원형 계승','민첩한 쌍수 전사','단단한 전위 전사','개성 강조 모험 전사']
for i in range(5):
    p=OUT/('original.png' if i==0 else f'variant-{i}-final.png')
    im=Image.open(p).convert('RGBA'); a=im.getchannel('A'); box=a.point(lambda v:255 if v>=32 else 0).getbbox()
    top,chin,shoulder,crotch,knee,sole=landmarks[i]
    height=sole-top+1
    # Display only: body height 680 CSS px, baseline y=760. Never resave/resize individual PNGs.
    scale=680/height
    item=dict(id=i,label=names[i],subtitle=subtitles[i],file=p.name,width=im.width,height=im.height,sha256=sha(p),bytes=p.stat().st_size,mode=Image.open(p).mode,alphaMinMax=a.getextrema(),alphaZero=sum(v==0 for v in a.getdata()),alpha32Bounds=box,landmarks=dict(hairTop=top,chin=chin,shoulder=shoulder,crotch=crotch,knee=knee,sole=sole),bodyHeight=height,hairInclusiveHeads=round(height/(chin-top+1),2),display=dict(scale=scale,width=im.width*scale,top=760-sole*scale,bodyHeight=680,baseline=760))
    if i:
        item['generatedSource']=records[i-1]['source']; item['sourceSha256']=sha(Path(records[i-1]['source'])); item['byteIdentical']=item['sha256']==item['sourceSha256']
    else: item['originalSource']=str(ORIGINAL); item['byteIdentical']=sha(ORIGINAL)==item['sha256']
    items.append(item)
(OUT/'image-metadata.json').write_text(json.dumps(items,ensure_ascii=False,indent=2),encoding='utf-8')
cards=''
for x in items:
    d=x['display']; cards+=f'''<article><header><b>{x['label']}</b><span>{x['subtitle']}</span></header><button class="stage" aria-label="{x['subtitle']} 원본 크게 보기" onclick="show('{x['file']}','{x['label']} · {x['subtitle']}')"><img src="{x['file']}" alt="{x['subtitle']}" style="width:{d['width']:.5f}px;top:{d['top']:.5f}px"><i></i></button></article>'''
html='''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>금발 전사 · SD 리모델링 4안</title><style>
*{box-sizing:border-box}body{margin:0;background:#e9e8e4;color:#25272b;font:16px 'Malgun Gothic',sans-serif}main{padding:20px 24px}h1{margin:0 0 7px;font-size:26px}p{margin:0 0 12px;color:#555b65}.controls{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}button,a{font:inherit} .controls button,.controls a{border:1px solid #c5c7cb;border-radius:7px;background:#fff;padding:8px 12px;color:#303744;text-decoration:none;cursor:pointer}.viewport{width:100%;overflow:hidden}.board{display:grid;grid-template-columns:repeat(5,480px);gap:8px;width:2432px;transform-origin:top left}article{background:#f5f4f0;border:1px solid #caccce;border-radius:10px;overflow:hidden}header{height:76px;padding:12px 16px;display:flex;gap:14px;align-items:center}header b{font-size:30px}header span{font-size:21px}.stage{display:block;position:relative;width:478px;height:810px;padding:0;border:0;background:transparent;overflow:hidden;cursor:zoom-in}.stage img{position:absolute;left:50%;transform:translateX(-50%);max-width:none}.stage i{position:absolute;left:10px;right:10px;top:760px;border-top:1px dashed #969c9e;z-index:2;pointer-events:none}body.dark{background:#1c222c;color:#eee}body.dark article{background:#2a3342;border-color:#4c5666}body.dark p{color:#ccd2de}dialog{border:0;border-radius:10px;padding:12px;max-width:95vw;max-height:95vh;background:#ecebe6}dialog::backdrop{background:#000c}dialog img{display:block;max-width:90vw;max-height:80vh;object-fit:contain}dialog button{float:right;padding:8px 18px;cursor:pointer}dialog p{padding:5px 8px}.note{font-size:13px;margin-top:10px}body.capture main{padding:12px}body.capture h1{font-size:23px}body.capture .controls,body.capture .note{display:none} @media(max-width:600px){main{padding:12px}h1{font-size:20px}p{font-size:13px}}
</style><main><h1>금발 전사 · SD 리모델링 4안</h1><p>기존 원본 + 신규 4안 · 같은 본체 높이와 발선 · 클릭하면 원본 확대</p><div class="controls"><button onclick="document.body.classList.toggle('dark')">밝게 / 어둡게</button><a href="comparison.png" target="_blank">비교 PNG</a><a href="분석.md" target="_blank">분석</a><a href="검수.md" target="_blank">검수</a></div><div class="viewport"><div class="board">'''+cards+'''</div></div><p class="note">등비 배율은 비교 화면에만 적용했습니다. 개별 PNG는 생성 원본 바이트를 보존합니다. 장비 외곽과 머리끝~발바닥 본체 높이는 구분합니다. 사용자 선택·합격 대기.</p></main><dialog><button onclick="document.querySelector('dialog').close()">닫기</button><p id="caption"></p><img id="large"></dialog><script>
const board=document.querySelector('.board'),vp=document.querySelector('.viewport');function fit(){let s=vp.clientWidth/2432;board.style.transform=`scale(${s})`;vp.style.height=(888*s)+'px'}function show(file,name){document.querySelector('#large').src=file;document.querySelector('#caption').textContent=name;document.querySelector('dialog').showModal()}if(location.search.includes('capture'))document.body.classList.add('capture');if(location.search.includes('dark'))document.body.classList.add('dark');new ResizeObserver(fit).observe(vp);fit();window.addEventListener('load',fit);
</script></html>'''
html=html.replace('repeat(5,480px)','repeat(5,600px)').replace('width:2432px','width:3032px').replace('width:478px','width:598px').replace('vp.clientWidth/2432','vp.clientWidth/3032')
html=html.replace('</style>', '.mobile-labels{display:none}@media(max-width:600px){.mobile-labels{display:grid;grid-template-columns:repeat(5,1fr);text-align:center;font-weight:bold;font-size:15px;margin:8px 0 2px}} </style>')
html=html.replace('<div class="viewport">','<div class="mobile-labels"><span>기존</span><span>1</span><span>2</span><span>3</span><span>4</span></div><div class="viewport">')
(OUT/'index.html').write_text(html,encoding='utf-8')
print(json.dumps(items,ensure_ascii=False,indent=2))
