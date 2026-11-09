from pathlib import Path
from PIL import Image
import json,hashlib,datetime
D=Path(__file__).resolve().parent
src=Path('C:/Users/user/.codex/generated_images/01a1bf68-4705-71f0-9449-07a1041b38d9')
master=D.parent/'pixel_front_line_cleanup_v01/front-cleanup.png'
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def write(n,t):(D/n).write_text(t,encoding='utf-8')
def dump(n,o):write(n,json.dumps(o,ensure_ascii=False,indent=2))
assert sha(D/'front-master.png')==sha(master)
assert sha(D/'combat-ready-right045.png')==sha(src/'exec-ea928785-4b4d-45dd-ac4d-2d6f3116f542.png')
im=Image.open(D/'combat-ready-right045.png');a=im.getchannel('A');b=a.point(lambda v:255 if v>=32 else 0).getbbox()
assert im.size==(1536,1024) and a.getextrema()[0]==0 and a.getextrema()[1]>=240
assert b[0]>0 and b[1]>0 and b[2]<im.width and b[3]<im.height
outside=[(300,100),(400,40),(800,150),(950,400),(100,900),(500,950),(1400,500)]
assert all(a.getpixel(p)==0 for p in outside)
calls=[]
for spec,file,name,decision in [('generation-spec.json','candidates/combat-first.png','exec-ea928785-4b4d-45dd-ac4d-2d6f3116f542.png','Selected: original pixel finish and readiness pose retained; apparent halo is RGB under zero alpha'),('generation-alpha-cleanup-spec.json','candidates/combat-alpha-edit.png','exec-6c99e106-1b6e-46ed-84c8-551c6c087799.png','History: targeted halo cleanup attempted; smoother contours than first output')]:
 assert sha(src/name)==sha(D/file)
 s=json.loads((D/spec).read_text(encoding='utf-8'))
 calls.append(dict(spec=spec,prompt=s['prompt'],inputs=[dict(path=p,sha256=sha(p)) for p in s['referenced_image_paths']],settings={'transparent_background':True,'image_model':'builtin tool-managed; separate from text model'},source=str(src/name),sha256=sha(src/name),retained=file,decision=decision))
dump('generation-records.json',dict(userRequest='선정리 끝나면 오른쪽에 적이있다 생각하고 3/4 측면 기준 전투태세 취하는 모션 이미지로 그려볼래?',taskMode='New direct user request after settled supervised work; no old Task/Dispatch reused',tool='builtin image_gen.imagegen',calls=calls,finalFile='combat-ready-right045.png',selectedCall=1,originalBytesPreserved=True,resampled=False))
write('1_대화기록.md','''# 요청

선정리완료후사용자는오른쪽에적이있다고생각한3/4측면전투태세모션이미지를요청했다. 직전v01복구/선정리본을디자인마스터로하여전투준비키포즈1장으로제작했다. 캐릭터복구대상/현재모션요청이일반정면대기자세보다우선한다. 적이나배경/타격효과/애니메이션/추가방향/게임교체로확대하지않는다.
''')
write('3_작업일지.md','''# 제작과 검수

imagegen스킬본문과캐릭터작업방법/직전선정리기준·검수/한손그립기준을다시읽고마스터및그립보조를실제view_image로열었다. 사전확인/입력별역할·프롬프트를기록하고내장생성1회로전투태세를제작했다. 미리보기광륜을보고알파정리호출1회추가했으나픽셀을직접조사하니외부RGB색은알파0이라실제배경에표시되지않았다. 두출력을보존하고더원래픽셀표현에가까운첫결과를선택했다. 별도headless Edge에서실제알파를밝고어두운배경으로동시합성한전체프레임을확인하고캡처를view_image로열었다. 사용자의현재앱창/탭/패널은조작하지않았다.
''')
write('4_정의문서.md','''# 전투준비 키포즈 정의/검수

화면오른쪽앞3/4에서두눈/앞흉갑일부가보이고머리·골반·발도적방향을향한다. 양무릎을굽히고양발을딛는전투준비자세,오른손장검은앞쪽오른위로내밀고왼손짧은단검은몸가까이세워방어한다. 정면원본과달리공격이아닌준비자세에맞게장비각도를바꿨다. 원래v01의청년금발/갈색눈·은갑옷·청목도리/짧은후드·청허리천·갈색벨트/바지·오른초승달견갑/판금정강이·왼청천장화가유지된다. 판금오른발은화면왼쪽뒤,왼청장화가앞쪽을지지하는결과로생성됐으며인체좌우를바꾼것은아니다.

팔2/손2/장검1/단검1,손잡이와손목·가드·날의연결,장검청사선/날개가드/고리보호대를확인했다. 두무기는겹쳐하나로합쳐지지않고모발/팔/장화/검끝이캔버스안에들어온다. 작은장갑의5손가락모든관절은픽셀/가림으로독립판독에한계가있다. 동작에따른갑옷면/후드주름/헤어세부미세차이가있고정확히같은원본픽셀이나수학적으로동일한두상비율을주장하지않는다. 사용자미적판정대기이며움직이는애니메이션/실제게임검증은미수행이다.

실제알파합성의밝고어두운전체화면에서큰불투명배경/광륜이없다. 원본PNG의알파0영역RGB에는미리보기용색정보가있을수있지만실제투명표시에나타나지않는다. 낮은알파의극미세외곽을모두0으로검증했다고주장하지않는다.
''')
write('5_버전관리.md','''# 원본/범위 보존

새 combat_ready_right045_v01 폴더에만선정리정면바이트사본/생성원본/후보/프롬프트/기록/뷰어를보관했다. 선 정리원본과기존v01/후속시안/기준/카탈로그/게임/public은변경하지않았다. 최종은1536×1024RGBA생성원본바이트이며리샘플링/수학적변형/재인코딩하지않았다. Git커밋/푸시/예약백업없음. .qa-browser-profile은로컬검수프로필로업로드제외한다.
''')
dump('검수.json',dict(checkedAt=datetime.datetime.now().astimezone().isoformat(),nativeSize=im.size,mode=im.mode,alphaMinMax=a.getextrema(),alpha32Bounds=b,sourceBytesMatch=True,masterSha256=sha(master),finalSha256=sha(D/'combat-ready-right045.png'),outsideSamples=[dict(x=p[0],y=p[1],alpha=a.getpixel(p)) for p in outside],viewImageAndLightDarkCompositeInspected=True,arms=2,hands=2,longsword=1,dagger=1,enemyDrawn=False,animationGenerated=False,gameIntegrated=False,userAestheticApproved=False))
write('report.md','# 오른쪽3/4 전투준비시안\n\n'+str(D/'combat-ready-right045.png')+'\n\n'+str(D/'comparison.png')+'\n\n'+str(D/'index.html')+'\n\n선정리본을기준으로오른쪽의가상적을경계하는전투준비키포즈1장을내장imagegen으로제작했다. 두무기/인체좌우/손그립/전신잘림/실제알파/밝고어두운배경을확인했다. 생성원본1536×1024바이트보존,정면원본SHA보존. 사용자미적선택대기이며애니메이션/게임통합/공통기준변경/커밋푸시는수행하지않았다.\n')
print('PASS: selected1536x1024 RGBA source bytes, master hash, alpha0 outside samples, alpha32 silhouette inside; pose/visual records saved.')
