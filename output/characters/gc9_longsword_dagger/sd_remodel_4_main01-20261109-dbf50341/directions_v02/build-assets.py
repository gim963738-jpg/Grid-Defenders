from pathlib import Path
import json,hashlib
from PIL import Image
O=Path(__file__).resolve().parent
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def read(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def save(p,v):Path(p).write_text(json.dumps(v,ensure_ascii=False,indent=2),encoding='utf-8')
returns=read(O/'generation-returned.json')
source={x['file']:x['source'] for x in returns}
refinement=read(O/'profile-refinement-returned.json')
source[refinement['file']]=refinement['source']
for n in range(1,5):source[f'variant-{n}-front.png']=str(O.parent/f'variant-{n}-final.png')
source.update({'original-front.png':str(O.parent/'original.png'),'original-right-045.png':str(O.parent.parent/'pixel_8views_v01/images/02_front_right_045.png'),'original-right-090.png':str(O.parent.parent/'pixel_8views_v01/images/03_right_090.png')})
# Horizontal body extents and support-center x are manually inspected estimates; held weapons excluded.
# Body top and sole y are alpha>=32 measurements inside anatomy ROIs, not whole-image weapon bounds.
manual={
 'original-front.png':(330,916,635,366), 'original-right-045.png':(340,914,638,380), 'original-right-090.png':(382,745,580,365),
 'variant-1-front.png':(390,833,620,474),'variant-1-right-045.png':(420,805,623,464),'variant-1-right-090.png':(422,780,619,429),
 'variant-2-front.png':(410,840,634,461),'variant-2-right-045.png':(419,824,636,448),'variant-2-right-090.png':(414,784,630,442),
 'variant-3-front.png':(344,894,628,438),'variant-3-right-045.png':(385,860,636,407),'variant-3-right-090.png':(420,766,625,414),
 'variant-4-front.png':(390,835,620,460),'variant-4-right-045.png':(425,808,628,450),'variant-4-right-090.png':(414,752,621,437)}
views=[('front','front',0),('right45','right-045',45),('right90','right-090',90)]
assets={};flat=[]
for n in range(5):
    key='original' if n==0 else f'variant{n}';stem='original' if n==0 else f'variant-{n}'
    assets[key]={}
    for direction,suffix,angle in views:
        file=f'{stem}-{suffix}.png';p=O/file;im=Image.open(p);a=im.getchannel('A');w,h=im.size
        head_roi=[300,0,600,510]
        feet_roi=[420,1100,420,145] if angle!=90 else [420,1100,310,145]
        def alphabox(roi):
            x,y,rw,rh=roi;b=a.crop((x,y,x+rw,y+rh)).point(lambda v:255 if v>=32 else 0).getbbox()
            return [b[0]+x,b[1]+y,b[2]+x,b[3]+y]
        hb=alphabox(head_roi);fb=alphabox(feet_roi);top=hb[1];sole=fb[3]-1;bodyheight=sole-top+1
        left,right,footx,chin=manual[file]
        entry=dict(variant=n,direction=direction,file=file,sha256=sha(p),width=w,height=h,bodyHeight=bodyheight,footX=footx,footY=sole,source=source[file],sourceSha256=sha(source[file]),sourceBytesMatch=sha(p)==sha(source[file]),bytes=p.stat().st_size,mode=im.mode,alphaMinMax=list(a.getextrema()),alpha32Bounds=list(a.point(lambda v:255 if v>=32 else 0).getbbox()),bodyBounds=dict(x=left,y=top,width=right-left,height=bodyheight),footAnchor=dict(x=footx,y=sole,normalizedX=footx/w,normalizedY=sole/h),measurement=dict(method='Visual anatomical ROI selection; alpha>=32 hair-top and sole y measurement; manual body-only horizontal silhouette extents and support-center footX estimate; held swords excluded',headROI=head_roi,feetROI=feet_roi,headAlphaBounds=hb,feetAlphaBounds=fb,bodyXEstimated=True,footXEstimated=True,footYAlphaMeasured=True,bodyYAlphaMeasured=True,estimated=True,footYUncertaintyPx=3,footXUncertaintyPx=20,bodyXUncertaintyPx=20,occludedFarFoot=(angle==90),chinYEstimated=chin,hairInclusiveHeadUnits=round(bodyheight/(chin-top+1),3)),viewAngle=angle,facing='front' if angle==0 else 'screen-right')
        assets[key][direction]=entry;flat.append(entry)
for entry in flat:
    front=assets['original' if entry['variant']==0 else f"variant{entry['variant']}"]['front']
    entry['relativeToOwnFront']=dict(bodyHeightRatio=round(entry['bodyHeight']/front['bodyHeight'],5),footYDeltaPx=entry['footY']-front['footY'],hairTopDeltaPx=entry['bodyBounds']['y']-front['bodyBounds']['y'],hairInclusiveHeadUnitsDelta=round(entry['measurement']['hairInclusiveHeadUnits']-front['measurement']['hairInclusiveHeadUnits'],3))
manifest=dict(schemaVersion=2,task='MAIN01-20261109-DBF50341',iteration=2,role='characters',coordinateSystem='native image pixels, origin top-left; bodyBounds width/height; hair-inclusive bodyHeight=footY-hairTop+1; footX support-center estimate',compareArtContract='compareArt is a flat CompareArt[]; variant0=original; direction front|right45|right90; file relative to this manifest',sourceImagesResampled=False,assets=assets,compareArt=flat)
save(O/'asset-manifest.json',manifest)
html='''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>금발 전사 · 3방향 비교</title><style>*{box-sizing:border-box}body{margin:0;background:#ebeae6;color:#272b34;font:16px 'Malgun Gothic',sans-serif}main{padding:14px}h1{font-size:24px;margin:0 0 6px}p{margin:0 0 10px;color:#59616c}nav{display:flex;gap:8px;margin:10px 0}nav button,nav a{border:1px solid #bbc1ca;background:white;border-radius:6px;padding:8px 12px;color:#26344b;text-decoration:none;font:inherit}.viewport{width:100%;overflow:hidden}.board{width:2132px;display:grid;grid-template-columns:repeat(5,420px);gap:8px;transform-origin:top left}article{border:1px solid #ccd0d4;border-radius:8px;background:#f7f6f2;overflow:hidden}header{height:50px;padding:10px 14px;font-size:20px;font-weight:bold}.stage{width:418px;height:490px;position:relative;display:block;padding:0;border:0;background:transparent;overflow:hidden;cursor:zoom-in}.stage img{position:absolute;max-width:none}.stage i{position:absolute;left:8px;right:8px;top:440px;border-top:1px dashed #a4aab0;pointer-events:none}footer{height:35px;text-align:center;font-size:14px;color:#697280}body.dark{background:#1c2330;color:#e8edf6}body.dark article{background:#2b3545;border-color:#4d5969}body.dark p,body.dark footer{color:#c5cfdf}dialog{border:0;border-radius:10px;background:#eeeae3;max-width:96vw;max-height:95vh;padding:12px}dialog img{display:block;max-width:90vw;max-height:80vh;object-fit:contain}dialog button{float:right;padding:8px 14px}body.capture nav,body.capture .note{display:none}.mobile-labels{display:none}@media(max-width:600px){h1{font-size:19px}p{font-size:12px}.mobile-labels{display:grid;grid-template-columns:repeat(5,1fr);text-align:center;font-size:14px;font-weight:bold}}</style><main><h1>금발 전사 · 기존 + 4안 · 정면 / 오른쪽45° / 오른쪽90°</h1><p>위: 정면 · 가운데: 오른쪽 앞 사선45° · 아래: 오른쪽 완전 정측면90° · 이미지를 누르면 원본 확대</p><nav><button onclick="document.body.classList.toggle('dark')">밝게 / 어둡게</button><a href="comparison-directions.png" target="_blank">비교 PNG</a><a href="asset-manifest.json" target="_blank">측정 manifest</a></nav><div class="mobile-labels"><span>기존</span><span>1</span><span>2</span><span>3</span><span>4</span></div><div class="viewport"><div class="board">'''
for direction,suffix,angle in views:
    for n in range(5):
        key='original' if n==0 else f'variant{n}';x=assets[key][direction]
        scale=380/x['bodyHeight'];left=209-x['footX']*scale;top=440-x['footY']*scale
        label=('기존' if n==0 else f'{n}안')+' · '+('정면0°' if angle==0 else f'오른쪽{angle}°')
        html+=f'''<article><header>{label}</header><button class="stage" onclick="show('{x['file']}','{label}')" aria-label="{label} 확대"><img src="{x['file']}" alt="{label}" style="width:{x['width']*scale:.6f}px;left:{left:.6f}px;top:{top:.6f}px"><i></i></button><footer>본체 {x['bodyHeight']}px · 발 y{x['footY']} · 정면 대비 {(x['relativeToOwnFront']['bodyHeightRatio']-1)*100:+.1f}%</footer></article>'''
html+='''</div></div><p class="note">비교 화면에서만 본체 높이·발선을 등비 등록했습니다. 모든 개별 PNG는 원본 바이트입니다. 자세·가림·작화 세부의 차이는 검수 기록을 참고하세요. 사용자 미적 합격·게임 통합 대기.</p></main><dialog><button onclick="document.querySelector('dialog').close()">닫기</button><p id="caption"></p><img id="large"></dialog><script>const board=document.querySelector('.board'),vp=document.querySelector('.viewport');function fit(){let s=vp.clientWidth/2132;board.style.transform=`scale(${s})`;vp.style.height=(1743*s)+'px'}function show(file,name){document.querySelector('#large').src=file;document.querySelector('#caption').textContent=name;document.querySelector('dialog').showModal()}new ResizeObserver(fit).observe(vp);fit();window.addEventListener('load',fit)</script></html>'''
(O/'index.html').write_text(html,encoding='utf-8')
print(json.dumps([{k:x[k] for k in ['file','bodyHeight','footX','footY','relativeToOwnFront']} for x in flat],ensure_ascii=False,indent=2))
