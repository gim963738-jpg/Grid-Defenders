from pathlib import Path
from PIL import Image
import json,hashlib
D=Path(__file__).resolve().parent
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def write(n,t):(D/n).write_text(t,encoding='utf-8')
def dump(n,o):write(n,json.dumps(o,ensure_ascii=False,indent=2))
source=Path('C:/Users/user/.codex/generated_images/01a1bf68-4705-71f0-9449-07a1041b38d9/exec-ca2fec8d-bff0-4607-bdf2-6818837d6fa5.png')
master=D.parent/'combat_ready_right045_v01/combat-ready-right045.png'
assert sha(source)==sha(D/'combat-ready-illustration-proportions.png')
assert sha(master)==sha(D/'sd-pose-original.png')
assets=[]
for f,footX in [('sd-pose-original.png',560),('combat-ready-illustration-proportions.png',480)]:
 im=Image.open(D/f);alpha=im.getchannel('A');b=alpha.point(lambda a:255 if a>=32 else 0).getbbox()
 assert b[0]>0 and b[1]>0 and b[2]<im.width and b[3]<im.height
 assets.append(dict(file=f,width=im.width,height=im.height,alpha=alpha.getextrema(),bounds=b,bodyHeight=b[3]-b[1],hairTop=b[1],footY=b[3]-1,footX=footX,footXEstimated=True,sha256=sha(D/f)))
dump('asset-metadata.json',dict(assets=assets,measurement='alpha>=32, visually verified top is hair and bottom is boot, not blade; support-center X manual estimate +/-35px; pose rather than standing anatomy',displayOnlyUniformRegistration=True,individualPngResampled=False))
cards=''
for a,label in zip(assets,['기존 · SD 신체 비율','신규 · SD 그림체 + 일러스트 신체 비율']):
 s=500/a['bodyHeight'];left=400-a['footX']*s;top=560-a['footY']*s
 cards+=f'<figure><figcaption>{label}</figcaption><div class="stage"><img src="{a["file"]}" alt="{label}" style="width:{a["width"]*s}px;left:{left}px;top:{top}px"></div></figure>'
html='''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>같은 자세 · 신체 비율 비교</title><style>*{box-sizing:border-box}body{margin:0;padding:16px;background:#edeae4;color:#243344;font:16px/1.5 Arial,'Malgun Gothic',sans-serif}h1{font-size:24px;margin:0 0 6px}p{margin:6px 0}nav{margin:12px 0}a,button{color:inherit;font:inherit}.viewport{width:100%;overflow:hidden}.board{width:1616px;display:grid;grid-template-columns:repeat(2,800px);gap:16px;transform-origin:top left}figure{margin:0;background:#fffdf8;border:1px solid #bac2cc;border-radius:7px;overflow:hidden}figcaption{font-weight:bold;padding:12px}.stage{position:relative;width:800px;height:610px;overflow:hidden}.stage img{position:absolute;max-width:none;height:auto;image-rendering:pixelated}.stage:after{content:'';position:absolute;top:560px;left:10px;right:10px;border-top:1px dashed #bac2cc;pointer-events:none}.dark{background:#202937;color:#edf1f7}.dark figure{background:#303b4d}small{color:#76859a}</style><body><h1>동일 전투 준비 자세 · 신체 비율 비교</h1><p>SD식 얼굴·선·명암은 유지하고 머리의 상대적 크기를 줄여 몸통·팔·다리를 일러스트 비율로 조정했습니다.</p><nav><button id="theme">밝게 / 어둡게</button> · <a href="combat-ready-illustration-proportions.png">신규 PNG</a> · <a href="report.md">검수 기록</a></nav><div class="viewport"><div class="board">'''+cards+'''</div></div><p><small>전체 표시 키와 발선을 CSS에서만 맞췄습니다. 두 개별 PNG는 생성 실제 크기와 바이트를 유지합니다.</small></p><script>function fit(){let v=document.querySelector('.viewport'),b=document.querySelector('.board'),s=Math.min(1,v.clientWidth/1616);b.style.transform=`scale(${s})`;v.style.height=`${b.offsetHeight*s}px`};window.addEventListener('resize',fit);fit();document.querySelector('#theme').onclick=()=>document.body.classList.toggle('dark');</script></body></html>'''
write('index.html',html)
spec=json.loads((D/'generation-spec.json').read_text(encoding='utf-8'))
dump('generation-records.json',dict(taskMode='New direct user request; old settled Task/Dispatch/ACK not reused',userRequest='그림체는 sd인데 몸의 비율은 일러스트인 느낌으로 똑같은 자세 뽑아볼래?',tool='builtin image_gen.imagegen',calls=1,prompt=spec['prompt'],input=dict(path=str(master),sha256=sha(master)),settings={'transparent_background':True},returned=dict(path=str(source),sha256=sha(source),width=1217,height=1292),selectedOutput=str(D/'combat-ready-illustration-proportions.png'),originalBytesPreserved=True,resampled=False))
write('1_대화기록.md','# 사용자 요청\n\n“그림체는 sd인데 몸의 비율은 일러스트인 느낌으로 똑같은 자세 뽑아볼래?” 그림체와해부학비율을분리해직전전투태세를이어가는비교시안1장으로제작했다. 새비율을공통기준으로확정하거나다른그림을재제작하지않는다.\n')
write('3_작업일지.md','# 작업일지\n\n직전전투태세와검수·캐릭터작업방법을읽고원본을view_image로열었다. 사전확인/프롬프트를작성해내장image_gen1회로몸통/팔다리가긴일러스트신체비율을생성했다. 원본과신규PNG바이트를보존하고두이미지본체표시높이·발선을CSS등비등록해비교한다. 실제크기/알파/잘림/정체성과손·장비인체좌우를확인한다.\n')
write('4_정의문서.md','''# 신규 시안 정의/검수

SD식간결한눈·코·입/청년갈색눈·금발·선과면명암을유지하고머리의상대크기를줄이며몸통·상완/전완·허벅지/종아리를늘린일러스트형신체다. 생성유도용6.5머리단위는사용자확정값이나실측등신이아니다. 굽힌전투자세라서선자세의등신과직접등치하지않는다.

오른쪽앞3/4의경계시선/두눈·앞흉갑일부,무릎을굽힌양발지지,오른손장검의오른위전방방어·왼손단검의몸가까이보조방어를유지한다. 팔다리길이변경으로관절/손발좌표와고관절·팔굽힘의미세각도는완전히동일하지않다. 오른초승달/판금정강이·왼청천장화·짧은후드·청허리천·갈색벨트/바지와장검청사선/날개가드/고리보호대·짧은각진단검을보존한다. 팔2/손2/장검1/단검1과손잡이·손목·날연결을확인한다. 헤어/갑옷면/허리천세부는새비율에맞게재구성되어완전한픽셀동일본이아니다. 얇은유색반투명외곽은남을수있다.

원본전체와무기끝이캔버스내부에있고실제알파를가진다. 동일전신표시높이/발선의밝고어두운비교를별도headless에서검수한다. 게임/실기기검증·애니메이션·사용자미적합격은이번시안의완료와구분한다.
''')
write('5_버전관리.md','# 원본과 저장범위\n\n기존전투태세원본과sd-pose-original.png사본SHA일치,신규1217×1292RGBA와반환원본SHA일치. 수학적신체늘림/리샘플링/재인코딩없음. 새폴더만작성하고기존이미지/공통규정/카탈로그/게임/public/사용자창은미변경. 커밋/푸시/예약백업없음. .qa-browser-profile은업로드제외.\n')
write('report.md','# SD 그림체 + 일러스트 신체 비율\n\n'+str(D/'combat-ready-illustration-proportions.png')+'\n\n'+str(D/'index.html')+'\n\n직전전투준비자세의SD그림체를유지하고상대머리크기와몸통/사지비율을일러스트형으로조정했다. 내장imagegen1회,실제반환1217×1292RGBA바이트보존. 같은공격준비관계/인체좌우를유지하지만신체길이변경으로좌표/관절각도·세부디자인에는미세차이가남는다. 게임/공통기준미변경,사용자미적판정대기.\n')
print('PASS: source/master byte hashes and actual alpha canvas bounds; comparison and records built.')
