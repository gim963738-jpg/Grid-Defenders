from pathlib import Path
from PIL import Image
import hashlib,json
D=Path(__file__).resolve().parent
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def write(n,t):(D/n).write_text(t,encoding='utf-8')
def dump(n,o):write(n,json.dumps(o,ensure_ascii=False,indent=2))
specs=json.loads((D/'generation-specs.json').read_text(encoding='utf-8'))
src=Path('C:/Users/user/.codex/generated_images/01a1bf68-4705-71f0-9449-07a1041b38d9')
sources=[src/'exec-ea224687-b446-42de-8c92-ae944265f706.png',src/'exec-36d9e4bc-7516-4cff-beb7-b49d640546f1.png']
assets=[];calls=[];cards=''
for i,(s,p,fx) in enumerate(zip(specs,sources,[550,480])):
 f=s['file'];im=Image.open(D/f);a=im.getchannel('A');b=a.point(lambda x:255 if x>=32 else 0).getbbox()
 assert sha(D/f)==sha(p) and a.getextrema()[0]==0 and a.getextrema()[1]>=240
 assert b[0]>0 and b[1]>0 and b[2]<im.width and b[3]<im.height
 body=b[3]-b[1];scale=500/body;left=400-fx*scale;top=560-(b[3]-1)*scale
 label=['A · SD 신체 비율 · 도트','B · 일러스트 신체 비율 · 도트'][i]
 cards+=f'<figure><figcaption>{label}</figcaption><div class="stage"><img src="{f}" alt="{label}" style="width:{im.width*scale}px;left:{left}px;top:{top}px"></div></figure>'
 assets.append(dict(file=f,width=im.width,height=im.height,mode=im.mode,alpha=a.getextrema(),alpha32Bounds=b,bodyHeight=body,footX=fx,footXEstimated=True,footY=b[3]-1,sha256=sha(D/f)))
 calls.append(dict(prompt=s['prompt'],inputs=[dict(path=x,sha256=sha(x)) for x in s['referenced_image_paths']],transparent_background=True,returnedSource=str(p),sha256=sha(p),file=f,nativeSize=im.size))
dump('generation-records.json',dict(userRequest='두모델 다 도트느낌으로 바꿔볼래?',tool='builtin image_gen.imagegen',calls=calls,mathematicalPixelation=False,sourcePngResampled=False,sourceBytesPreserved=True,taskMode='direct user follow-up; no settled Task/Dispatch reused'))
dump('asset-metadata.json',dict(assets=assets,measurement='alpha>=32 bounds: visually hair top and boot sole are vertical extremes, sword does not define height; footX manually estimated +/-35px',uniformCssDisplayBodyHeight=500))
html='''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>두 신체 비율 · 도트 표현</title><style>*{box-sizing:border-box}body{margin:0;padding:16px;background:#edeae4;color:#243344;font:16px/1.5 Arial,'Malgun Gothic',sans-serif}h1{font-size:24px;margin:0 0 6px}p{margin:6px 0}nav{margin:12px 0}a,button{color:inherit;font:inherit}button{background:transparent;border:1px solid #91a0b0;border-radius:4px;padding:5px 10px}.viewport{width:100%;overflow:hidden}.board{width:1616px;display:grid;grid-template-columns:repeat(2,800px);gap:16px;transform-origin:top left}figure{margin:0;background:#fffdf8;border:1px solid #bac2cc;border-radius:7px;overflow:hidden}figcaption{font-weight:bold;padding:12px}.stage{position:relative;width:800px;height:610px;overflow:hidden}.stage img{position:absolute;max-width:none;height:auto;image-rendering:pixelated}.stage:after{content:'';position:absolute;top:560px;left:10px;right:10px;border-top:1px dashed #bac2cc;pointer-events:none}.dark{background:#202937;color:#edf1f7}.dark figure{background:#303b4d}small{color:#76859a}</style><body><h1>두 모델 · 도트 표현 비교</h1><p>신체 비율과 오른쪽3/4 전투태세를 각각 유지하며, 픽셀 덩어리·색 단계·계단형 윤곽으로 새로 제작했습니다.</p><nav><button id="theme">밝게 / 어둡게</button> · <a href="model-a-sd-dot.png">A PNG</a> · <a href="model-b-illustration-body-dot.png">B PNG</a> · <a href="report.md">검수 기록</a></nav><div class="viewport"><div class="board">'''+cards+'''</div></div><p><small>전신 표시 높이/발선은 CSS에서만 맞췄으며 개별 PNG 원본은 리샘플링하지 않았습니다. 실제128px 네이티브 도트 파일/정규화 팔레트 납품과는 구분되는 생성 시안입니다.</small></p><script>function fit(){let v=document.querySelector('.viewport'),b=document.querySelector('.board'),s=Math.min(1,v.clientWidth/1616);b.style.transform=`scale(${s})`;v.style.height=`${b.offsetHeight*s}px`};window.addEventListener('resize',fit);fit();document.querySelector('#theme').onclick=()=>document.body.classList.toggle('dark');</script></body></html>'''
write('index.html',html)
write('1_대화기록.md','# 요청\n\n사용자 “두모델 다 도트느낌으로 바꿔볼래?” 직전SD비율/일러스트비율2모델을각각다른비율그대로도트표현으로변환한정지시안2장을제작한다.\n')
write('3_작업일지.md','# 작업일지\n\n직전두원본과검수기록을읽고실제view_image로열었다. 사전확인/입력역할/프롬프트를남기고내장imagegen각1회총2회로도트시안을새로생성했다. 생성원본바이트를보존하고각PNG실제해상도/알파/잘림/장비를검사한다. 동일표시높이의밝고어두운배경비교에서확인한다. 수학적픽셀화/리샘플링은미수행이다.\n')
write('4_정의문서.md','''# 도트 시안 정의와 검수

A는큰머리·짧은몸통/사지의SD체형,B는상대머리가작고몸통/사지가긴일러스트체형을유지한다. 두이미지모두눈에보이는픽셀덩어리/계단형윤곽·단계형금발/은금속/청천/갈색가죽명암으로변경했다. 오른쪽앞3/4전투태세·장검전방/단검몸앞방어·오른초승달/판금다리·왼청장화를유지한다. 팔2/손2/장검1/단검1,손잡이·손목·가드·날연결,전신/무기끝캔버스내부를확인한다.

도트로단순화되어초승달/금속보호대·가드날개·장검청사선의개수/세부분할이원본과정확히같지는않다. 특히B의먼눈은앞머리/사선투영으로더가려지고시선각도가다소측면쪽으로읽힌다. 손가락의모든관절은도트와가림때문에독립판독할수없다. 두안의도트밀도/픽셀격자와색수는기계적으로동일한규격으로정규화하지않았다. 약128px높이의표현을생성목표로요청했으나실제PNG해상도는메타데이터에기록한원본크기다. 수작업128px네이티브스프라이트/고정팔레트/애니메이션납품완료나사용자미적합격으로주장하지않는다.
''')
write('5_버전관리.md','# 보존 범위\n\n각생성PNG는내장도구반환바이트/SHA와일치하고실제알파/크기를그대로보존했다. 기존두모델과공통규정/카탈로그/게임/public/사용자창은변경하지않았다. 새폴더외에제품파일변경없음. 커밋/푸시/예약백업없음. .qa-browser-profile은로컬검수프로필로업로드제외.\n')
write('report.md','# 두 모델 도트 시안\n\n'+str(D/'model-a-sd-dot.png')+'\n\n'+str(D/'model-b-illustration-body-dot.png')+'\n\n'+str(D/'index.html')+'\n\n내장imagegen총2회로각비율을유지한도트시안2장을제작했다. 실제PNG원본바이트/알파보존,장비·신체좌우·잘림을검수하고밝고어두운비교로확인한다. 도트단순화에따른미세장비차이/B의먼눈가림/픽셀밀도·팔레트비정규화한계는4_정의문서.md에기록했다. 게임/공통기준/기존이미지미변경,사용자선택대기.\n')
print(json.dumps(assets))
