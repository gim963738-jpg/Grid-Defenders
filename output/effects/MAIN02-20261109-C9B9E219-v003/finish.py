from pathlib import Path
from PIL import Image
import json,hashlib,numpy as np
P=Path(__file__).resolve().parent
def j(n):return json.loads((P/n).read_text('utf-8-sig'))
def write(n,t):(P/n).write_text(t,'utf-8')
def js(n,d):write(n,json.dumps(d,ensure_ascii=False,indent=2))
def link(n):return f'[{n}]({(P/n).as_posix()})'
S=j('effect.json');A=j('frame-audit.json')
for d in j('읽기확인.json')['documents']:assert hashlib.sha256(Path(d['path']).read_bytes()).hexdigest()==d['sha256']
preserved=[]
for name in ['MAIN02-20261109-C970BE7A','MAIN02-20261109-C970BE7A-v002','MAIN02-20261109-78E189DC','MAIN02-20261109-78E189DC-v002','MAIN02-20261109-78E189DC-v003','MAIN02-20261109-C9B9E219','MAIN02-20261109-C9B9E219-v002']:
 root=P.parent/name;mf=json.loads((root/'manifest.json').read_text('utf-8'))
 for f in mf:assert hashlib.sha256((root/f['path']).read_bytes()).hexdigest()==f['sha256'],str(root/f['path'])
 preserved.append(dict(path=str(root),files=len(mf),unchanged=True))
js('preservation-audit.json',preserved)
for name in ['rays','sparks']:
 for i in range(72):
  a=np.array(Image.open(P/f'frames/{name}/frame-{i:03}.png'));assert np.all(a[:,:,:3][a[:,:,3]>16]==255)
assert j('shape-audit.json')['slash72FramesUnchanged']
assert all(v['sheetCellPixelEquality'] for k,v in A.items()if k!='contract')
table='\n'.join(f"|{n}|{S['layers'][n]['start']:.3f}|{S['layers'][n]['end']:.3f}|{A[n]['firstVisible']}~{A[n]['lastVisible']}|"for n in S['layers'])
write('1_대화기록.md','''# MAIN02-20261109-C9B9E219 / 차수3 / effects / main02
사용자 “나는 이펙트를 원해”, 로컬영상참조후 “우선 한번 구현해봐”. 기존작은균열돌중심을강한압축빛·불규칙부채분출·입자·형태해체중심으로수정. 사분원백색검격유지,색황금색은사용자선택아님. 단독타격과검격합성제출,속도/규모/합격미정.
''')
write('3_작업일지.md','''# 실제작업
차수3필독15본문/기존공방재료함/직전보고/로컬영상193프레임디코드와연락판직접열람→현재start통과→사전확인→기존검격보존사본/새압축빛·12비대칭분출면·27짧은입자·기부찢김/팁조각분리구현→648RGBA프레임/9시트→단독·합성4배경GIF/MP4→전체밝은프레임/참조전개옆비교/차수2전후/알파와재생검증.
첫출력의압축빛유지가짧고후광하단이직선으로끊겨섬광0.15초/후광전체감쇠영역으로수정했다. 각진별모양으로읽히던중심윤곽은낮은불규칙곡면덩어리로고쳤다. 이후전체출력재생성·검증. 이미지/영상API호출없음.
''')
write('4_정의문서.md','''# 현재정의
독립캐릭터없는흰검격+지면타격1회.검격72프레임은차수2와픽셀완전동일. 접촉0.30초/논리18프레임완료·샘플19. 압축빛→위/옆12불균등면분출→입자27개→기부와팁분리→0.717초이내정리.낮은지면접촉/아래눌린형태,지면과돌먼지는보조.72프레임60FPS/1.2초제안.
콘텐츠960×540/패딩16/셀992×572/추출(16,16,960,540).지면anchor콘텐츠(480,425)/셀(496,441)고정.검격곡선중심별도역산/피해와표시분리.피해·사거리·영구지형·캐릭터맞춤·실게임연결없음.
''')
write('5_버전관리.md','''# 버전관리
신규v003만작성.이전7작품모든manifest파일해시대조.기존게임/src·공방재료함·규정·타팀미수정.사용자저장요청없어커밋푸시예약백업없음. manifest는제작무결성근거다.
''')
write('참조관찰.md','''# 로컬영상 직접관찰
Videos/Captures/*20-48-49.mp4를직접열어193프레임디코드했다. 1920×1040/약36.997FPS화면녹화. 메인contact.jpg와detail.jpg를직접열었으며, 세부0/3/6번은접점의압축된강한빛과큰뾰족면,9/12번은중심광량감쇠와남은비대칭분출,15/18/21번은어두워지며조각처럼남는흐름이보였다. 참조녹화가이미빛나는상태에서시작하므로정확한최초발생프레임/용도를단정하지않았다.
길이/굵기다른큰면과작은입자가낮은중심에서위·옆으로퍼진다. 원형방사선보다눌린아래쪽/비대칭상방부채,중심빛의빠른감쇠와나중에남는얇은조각이핵심이다. 황금색/화면UI/자막은복제대상이아니다. 현재맥락은바닥내려찍기이며참조만보고캐릭터명중용으로변경하지않았다.
reference-progression-comparison.jpg 상단은관찰용원영상크롭,하단은새로렌더한흰색단독FX다. 원영상크롭은납품효과픽셀로사용하지않았고시트에는UI·자막·배경이없다. 비교판의원영상과새FX는서로해상도·표시배율이다르며실루엣전개관찰용이지정밀좌표매칭주장이아니다.
''')
write('제작프롬프트.md','''# 실제제작의도
기존90도사분원검격72프레임/백색광량면그대로보존.0.30초지면접촉에압축된낮은빛덩어리발생.짧은지연후각도·길이·폭·지연이모두다른12쐐기광량면이위/양옆부채로날카롭게뻗고작은27개빛입자가분리.분출면의기부가바깥으로뜯기고끝작은조각이더멀리떨어져나가며가늘어져빠르게정리.아래는눌리고전체원형방사/고정별opacity만감쇠/단순흰원판확대금지.균열과돌먼지는보조,황금색선택아니므로흰색/무채색.캐릭터·검본체·적·실사연기·3D베벨구덩이·게임통합없음.
이미지방식도검토했으나기존조정가능Canvas원본에서불규칙윤곽·성장·기부절단·팁분리의프레임형태를직접제어하는방식을선택했다. 이는렌더수치미세조정이아니라새타격형태함수/레이어추가제작이다. 도구Canvas2D/Python/Pillow/OpenCV/FFmpeg/Orca브라우저.이미지모델0회/영상AI·Grok0회/유료외주0회/미승인모델전환0회/API사용량없음.이문서는실제코드제작의도이고외주모델에보낸프롬프트라고주장하지않는다.
''')
write('기준보완제안.md','''# 미확정제안
타격참조는색뿐아니라압축빛/분출실루엣/해체잔여의단계로검수한다.순수opacity변경으로잔광을대체하지말고분출면의기부위치·끝조각·폭이실제로변하는프레임을비교한다.지면반응과타격FX를같다고간주하지않고단독타격재생도제출한다.현재작품에적용한제안이며활성공통규정변경/사용자합격은아니다.
''')
write('결과보고.md',f'''{link('fx-only-dark.gif')} · {link('fx-only-dark.mp4')} · {link('impact-battle.mp4')} · {link('impact-sheet.png')} · {link('combined-sheet.png')} · {link('preview.html')}

# MAIN02-20261109-C9B9E219 / 차수3 / effects / main02

**기존작은균열·돌중심에서 압축된흰빛→날카로운비대칭부채분출→짧은입자·형태해체→빠른소멸의타격FX중심으로 실제재설계했다.** 기존사분원검격은72프레임픽셀완전동일하게보존했다. 캐릭터없이정확1충격,기본흰색이며영상황금색은선택으로처리하지않았다.단독타격과검격합성둘다실제재생파일로제출한다.1×1.2초/규모·광량은제안초기값,최종미적합격과속도는사용자미정이다.

## 실제 파일

- 타격FX단독RGBA {link('impact-sheet.png')} / 검격합성RGBA {link('combined-sheet.png')}:각8열9행72프레임/셀992×572. frames/impact·combined에각frame-000.png~071.png. 단독타격시트는검격이제외되고보조지면을포함한다.
- 분리7레이어 {link('slash-sheet.png')} / {link('flash-sheet.png')} / {link('rays-sheet.png')} / {link('sparks-sheet.png')} / {link('ground-sheet.png')} / {link('debris-sheet.png')} / {link('dust-sheet.png')}. 같은셀과groundpivot을유지하며각frames/해당이름에72PNG. 통합·단독·분리총648PNG실제RGBA알파원본이다.
- 단독4배경: {link('fx-only-grey.gif')} / {link('fx-only-grey.mp4')}, {link('fx-only-green.gif')} / {link('fx-only-green.mp4')}, {link('fx-only-dark.gif')} / {link('fx-only-dark.mp4')}, {link('fx-only-battle.gif')} / {link('fx-only-battle.mp4')}.
- 합성4배경: {link('impact-grey.gif')} / {link('impact-grey.mp4')}, {link('impact-green.gif')} / {link('impact-green.mp4')}, {link('impact-dark.gif')} / {link('impact-dark.mp4')}, {link('impact-battle.gif')} / {link('impact-battle.mp4')}. GIF/MP4는배경합성으로알파없음,시트렌더출력이지영상AI생성이아니다.
- {link('preview.html')}:서버없이실제PNG시트재생,재생정지/재시작/반복/0.25·0.5·1·2·5배속/스크럽/이전다음/배경4종/전체·타격단독·분리7레이어선택. HTTP http://127.0.0.1:5203/preview.html. 뷰어UI는캔버스아래로시야를가리지않는다.
- 원본 {link('effect.json')} / {link('renderer.js')} / {link('build.py')}. 전체밝은연락판 {link('contact-grey.jpg')} / {link('contact-green.jpg')}, 어두운/전장contact-dark.jpg/contact-battle.jpg. 타격8단계 {link('fx-stages-dark.png')} / {link('fx-stages-grey.png')} / {link('fx-stages-green.png')} / {link('fx-stages-battle.png')}.
- 차수2와동일셀·배경·시각비교 {link('before-after-grey.png')} / {link('before-after-dark.png')} / {link('before-after-green.png')} / {link('before-after-battle.png')}. 참조실제프레임옆전개비교 {link('reference-progression-comparison.jpg')} / 관찰 {link('참조관찰.md')} / 원영상해시·디코드근거 {link('reference-audit.json')}.

## 형태 전개와 조정

접촉0.30초의낮은빛덩어리와납작한후광이먼저보인다.0.317초부터길이151~299px/폭·지연이다른12분출면이-174~-8도범위에서위·옆으로뻗는다. 약0.422초부터각면의기부가바깥으로뜯기고끝에별도작은조각이떨어져나가며폭이좁아진다.27개의짧은빛입자는조금늦게분리되어흩어진다.원형동심원/전체방사선/고정별모양의opacity감쇠만이아니다.균열·돌·먼지는짧게보조하고주인공은빛의덩어리와불균등면이다.

|층|설정시작s|설정종료s|가시프레임(1부터)|
|---|---|---|---|
{table}

날끝과공통groundanchor는콘텐츠(480,425)/셀(496,441)에고정.접촉은논리18프레임완료시각0.30초=샘플19이며실제게임피해이벤트아님. 접촉전impact모든픽셀0/검격만진행한다. 전체타격은43번까지보이고0.717초부터완전히정리,1.2초까지휴지후반복한다.

JSON의rayDesign은각행[각도°,길이px,반폭px,지연s]이며12개면을각각조정한다. layers.rays의size/growthTau/tearStart/tearDuration/detachDistance, sparks의count/seed/duration, flash의size/duration, 공통pivotSource와각층offset/angle/scale/opacity,검격및보조지면기존값을분리했다. phases는단계설명이며실제시간은각층start/duration과분출지연에서계산한다. 접촉은slash.start+sweep,반응은contact+delay다.

별도JSON수정→`python build.py --spec <사본.json>`→serve.py에서뷰어열기→`demo.exportFrames()`→`python export.py`→`python extra.py`→`python qa.py`. build.py옵션없으면기본제안으로돌아간다.현재72프레임60FPS/1.2초고정출력이며길이전체변경은출력기/뷰어설정도함께수정한다.형태/위치변경후안전여백과접점검사다시실행한다.

## 참조·도구·검증

새차수15개필독본문/피드백/차수2보고와공방·재료함을재열람하고새start통과. 로컬영상193프레임직접디코드/메인contact.jpg·detail.jpg직접열람후강한중심빛·불규칙뾰족면·빠른감쇠를관찰했다. 영상용도를단정하거나황금색확정/자막·배경복제를하지않았다. 비교판상단원영상은분석증거이며시트납품FX로추출하지않았다. 사용자 “우선 한번 구현해봐” 범위의독립작품이다.

기존Canvas2D사본에서타격함수/실루엣전개를새로제작했다. 코드수치미세조정만으로처리하지않았으며이미지기반원화도검토했으나프레임별해체/독립조정이가능한기존원본방식을사용했다. 도구Canvas2D/Python/Pillow/OpenCV/FFmpeg/Orca브라우저, 이미지모델0/영상AI·Grok0/외주유료모델0/모델전환0/API사용량없음. 상세 {link('제작프롬프트.md')}.

- {link('frame-audit.json')}:9종648프레임셀가장자리alpha0/최소67px여백(기준16이상),첫끝투명/시트셀원본픽셀일치/접촉전타격반응0. 검격·섬광·분출면·빛입자는alpha>16 RGB순백,검은매트없음.지면암부는의도된그림으로보존했다.
- {link('shape-audit.json')}:검격72프레임차수2와완전동일/분출21·23·25·28·31·35·39프레임의마스크형태가다름. 실제시각확인은밝은전체프레임과단독단계/참조옆비교를직접열어검토했고숫자검사가미적합격을뜻하지않는다.
- {link('playback-audit.json')} / {link('selection-contact-audit.json')}:0.25~5배속/정지/재시작/반복·비반복종료/배경4종/전체·단독·분리선택/날끝groundanchor일치/프레임이동. {link('standalone-audit.json')}:file재생과배경PNG로딩.320/390px가로넘침0·48px조작,큰창실측/mobile캡처포함.실기기/APK검사아님.
- {link('media-audit.json')}:합성4+단독4 MP4전부992×572/72프레임60FPS/1.2초전체디코드오류0,8GIF1.2초/무한반복. GIF50FPS표본과PNG/MP4 60FPS는구분한다.최종브라우저콘솔오류0.
- {link('preservation-audit.json')}:이전7작품모든manifest파일해시불변.신규v003만작성/게임src·공방재료함·규정·타팀원본보존.사용자저장요청없어커밋푸시예약백업없음.현재필독해시도재확인.

**한계/남은판정:** 참조의붓질같은부드러운광량흐름보다현재분출면이더또렷하고기하학적이다. 이는참조를그대로재현한추출물이아닌흰색타격형태의첫구현제안이다. 매우밝은배경에서는흰색대비가낮으며미적합격·광량·규모·최종속도는사용자미정. 전장은기존forest-clearing 배경위비파괴합성으로실제게임내유닛겹침/스킬통합/피해·사거리/지형파괴검사가아니다. 캐릭터맞춤과독립테스터판정은미실시. 기준보완제안은미확정이며활성규정은수정하지않았다.
''')
files=[]
for p in sorted(P.rglob('*')):
 if p.is_file()and p.name!='manifest.json'and '__pycache__'not in p.parts:files.append(dict(path=p.relative_to(P).as_posix(),bytes=p.stat().st_size,sha256=hashlib.sha256(p.read_bytes()).hexdigest()))
js('manifest.json',files)
print(f'{len(files)} manifested; {sum(x["files"]for x in preserved)} previous files unchanged; V003 report complete')
