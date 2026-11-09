from pathlib import Path
from PIL import Image,ImageDraw
import json,hashlib,math
P=Path(__file__).resolve().parent;OLD=P.parent/'MAIN02-20261109-C9B9E219'
def j(n):return json.loads((P/n).read_text('utf-8-sig'))
def write(n,s):(P/n).write_text(s,'utf-8')
def js(n,d):write(n,json.dumps(d,ensure_ascii=False,indent=2))
def link(n):return f'[{n}]({(P/n).as_posix()})'
s=j('effect.json');audit=j('frame-audit.json')
for d in j('읽기확인.json')['documents']:assert hashlib.sha256(Path(d['path']).read_bytes()).hexdigest()==d['sha256'],d['path']
preserved=[]
for name in ['MAIN02-20261109-C970BE7A','MAIN02-20261109-C970BE7A-v002','MAIN02-20261109-78E189DC','MAIN02-20261109-78E189DC-v002','MAIN02-20261109-78E189DC-v003','MAIN02-20261109-C9B9E219']:
 root=P.parent/name;manifest=json.loads((root/'manifest.json').read_text('utf-8'))
 for f in manifest:assert hashlib.sha256((root/f['path']).read_bytes()).hexdigest()==f['sha256'],str(root/f['path'])
 preserved.append(dict(folder=str(root),files=len(manifest),unchanged=True))
js('preservation-audit.json',preserved)
def comp(root,group,i,bg):
 im=Image.open(root/f'frames/{group}/frame-{i:03}.png').convert('RGBA')
 b=Image.open(P/'battlefield-display.png').convert('RGBA')if bg=='battle'else Image.new('RGBA',im.size,'#dadfe3'if bg=='grey'else'#101a25')
 b.alpha_composite(im);return b.convert('RGB')
for bg in ['grey','dark','battle']:
 # Identical canvas dimensions, anchor, scale, background, and sample time.
 im=Image.new('RGB',(992*2,600),'#eeeeee');d=ImageDraw.Draw(im)
 for k,root in enumerate([OLD,P]):im.paste(comp(root,'slash',18,bg),(k*992,0))
 d.text((12,579),'V001 / 205-degree arc / 992x572 / same scale / t=0.300s',fill='black');d.text((1004,579),'V002 / 90-degree arc / 992x572 / same scale / t=0.300s',fill='black');im.save(P/f'before-after-slash-{bg}.png')
 im=Image.new('RGB',(496*4,310*2),'#eeeeee');d=ImageDraw.Draw(im)
 for row,root in enumerate([OLD,P]):
  for col,i in enumerate([18,22,28,42]):
   im.paste(comp(root,'combined',i,bg).resize((496,286)),(col*496,row*310));d.text((col*496+8,row*310+291),f'V00{row+1} / frame{i+1} / {i/60:.3f}s',fill='black')
 im.save(P/f'before-after-stages-{bg}.png')
 im=Image.new('RGB',(992*2,600),'#eee');d=ImageDraw.Draw(im)
 for k,root in enumerate([OLD,P]):
  im.paste(comp(root,'ground',24,bg),(k*992,0));d.text((k*992+12,579),f'V00{k+1} ground / same scale / t=0.400s',fill='black')
 im.save(P/f'before-after-ground-{bg}.png')
names=['slash','flash','ground','debris','dust'];idxs=[18,18,24,28,28]
im=Image.new('RGB',(496*5,310),'#eee');d=ImageDraw.Draw(im)
for k,(name,idx) in enumerate(zip(names,idxs)):im.paste(comp(P,name,idx,'grey').resize((496,286)),(k*496,0));d.text((k*496+8,291),f'{name} frame{idx+1}',fill='black')
im.save(P/'layers-inspection.png')
before=json.loads((OLD/'effect.json').read_text('utf-8'))
oldspan=before['slash']['endAngle']-before['slash']['startAngle'];newspan=s['slash']['endAngle']-s['slash']['startAngle'];assert newspan==90
geometry=dict(beforeArcDegrees=oldspan,afterArcDegrees=newspan,beforeRadii=[before['slash']['radiusX'],before['slash']['radiusY']],afterRadii=[s['slash']['radiusX'],s['slash']['radiusY']],beforeThickness=before['slash']['thickness'],afterThickness=s['slash']['thickness'],sameContentCellPivot=True,singleImpact=True,groundStyle='flat shallow abrasion + expanding ink cracks; no dark cavity/no bevel; flat stone silhouettes and painted dust',comparison='same 992x572 cell / same ground anchor / same background / same time; no auto-crop rescaling')
js('revision-audit.json',geometry)
write('1_대화기록.md','''# 차수2 / MAIN02-20261109-C9B9E219 / effects
ユーザー原文: “지금이 원기준 1/2라면 1/4 느낌으로 내려치는 면이 확실하게 보이게끔 재수정하고 땅이 파지는 느낌을 봤는데 3D느낌이 강해서 베는건 3D느낌 이펙트는 2.5D 2D느낌으로 묘사하는게 좋겠는데”. main02 이해확인후 최신 “진행”. 기존 호평은 백색검격의 질감이며 이번1타 합격이 아니다. 반원호와 깊은 지면명암을 수정하고 이전원본보존.
'''.replace('ユーザー原文','사용자 원문'))
write('3_작업일지.md','''# 실제작업
현재차수 필독15개와 최신피드백/직전보고/공방·재료함 읽기→start통과→사전확인→차수1출력원본을신규v002사본으로사용→205도호를90도로재설계/날끝역산접점유지/넓은광량면→지면·파편·먼지함수실제재작성→432RGBA원본과6시트/4배경GIF·MP4/독립뷰어출력→전후비교·전체밝은프레임·알파·재생검증.
기존 지면의 어두운 내부면/연속베벨테두리/석편면음영을 없애고 납작한마모자국/선균열확장/단순석편/그려진먼지로변경했다. API/영상AI 호출없음.
''')
write('4_정의문서.md','''# 현재 정의
차수2 독립캐릭터없는1타.90도타원호(-45→45)/반경320×250/폭110px/순백코어·안쪽감쇠·짧은블룸·테이퍼. 납작한마모자국/확장선균열·가벼운석편포물선·그려진먼지.72프레임60FPS/1.2초는제안.
content960×540/padding16/cell992×572/sourceRect(16,16,960,540). groundpivot콘텐츠(480,425)/셀(496,441)고정, 곡선중심은끝점에서별도역산. 접촉0.30초=논리18프레임완료/샘플19, 게임피해이벤트아님. 시각범위와피해판정별도.피해/사거리/영구지형/캐릭터/게임연결미정·미실시.
''')
write('5_버전관리.md','''# 보존
신규v002폴더만작성. 이전6개작품의manifest모든파일해시를대조했다. 기존게임/src·공방재료함·규정·타팀미수정. 사용자저장요청없어커밋푸시예약백업없음. manifest는제작무결성근거이며백업실행아님.
''')
write('제작프롬프트.md','''# 실제 로컬제작 의도 / 차수2
사용자확인된수정: C자에가까운205도반환호를90도사분원으로덜어내고 단순축소하지않는다. 타원반경320×250, 각도-45→45로 내려방향을강조하며 폭110px의밝은외측코어/안쪽감쇠/블룸/테이퍼로넓은칼날면을보인다. 끝점을고정지면anchor에역산해0.30초접촉1회. 이후짧은흰섬광/납작한흙쓸림과선균열확장/단순석편의가벼운포물선/그려진먼지퍼짐·감쇠. 구덩이암부/베벨/3D재질렌더/실사먼지/전면번쩍임/캐릭터금지.
외주에보낸문장이아닌실제코드원본제작의도다. Canvas2D/Python/Pillow/FFmpeg/Orca브라우저 사용. 이미지모델0회/영상AI·Grok0회/외주0회/유료모델전환0회, API사용량없음. 기존코드원본수정과투명시트출력이므로이미지모델/영상모델호출하지않았다.
''')
write('기준보완제안.md','''# 작품별 보완 / 미확정제안
원호수정은반지름축소와구분한다. 차수1실제205도→차수2실제90도를같은셀/같은anchor/같은배경/같은시각에비교한다. 검격의볼륨빛과지면의그림식표현을독립검수하며단일“3D/2D”라벨로모두통일하지않는다. 사용자최종합격을대신하지않고활성규정은변경하지않았다.
''')
table='\n'.join(f"|{n}|{s['layers'][n]['start']:.3f}|{s['layers'][n]['end']:.3f}|{audit[n]['firstVisible']}~{audit[n]['lastVisible']}|" for n in names)
write('결과보고.md',f'''{link('combined-sheet.png')} · {link('impact-dark.gif')} · {link('impact-battle.mp4')} · {link('preview.html')}

# MAIN02-20261109-C9B9E219 / 차수2 / effects / main02

**반원/C자 검격을90도 사분원 내려베기로 실제수정하고 지면을2D~2.5D 게임표현으로 다시 그렸다.** 기존값의 실제호는205도였고 이번은-45→45도다. 반지름을반감하지않고300×190→320×250으로설계하며돌아오는호를덜었다. 넓은면을위해폭76→110px, 순백코어/내부투명감쇠/입체광량/짧은블룸/양끝테이퍼유지. 캐릭터없는정확1타/접촉1회다. 속도1×1.2초/두께/파괴규모는 **제안 초기값, 최종 사용자 미정**이다.

## 산출

- 통합실제RGBA {link('combined-sheet.png')}:8열9행72프레임,셀992×572. frames/combined/frame-000.png~071.png 원본.5분리 {link('slash-sheet.png')} / {link('flash-sheet.png')} / {link('ground-sheet.png')} / {link('debris-sheet.png')} / {link('dust-sheet.png')}; 각frames/해당레이어에72PNG. 총432개RGBA원본. 검격/섬광은순백, 균열/석편암부는의도된그림으로보존한다.
- 어두운 {link('impact-dark.gif')} / {link('impact-dark.mp4')}; 밝은회색 {link('impact-grey.gif')} / {link('impact-grey.mp4')}; 초록 {link('impact-green.gif')} / {link('impact-green.mp4')}; 기존전장 {link('impact-battle.gif')} / {link('impact-battle.mp4')}. 배경합성파일은알파없다. 실제시트의렌더출력으로영상AI생성이아니다.
- {link('preview.html')}:서버없이실제PNG시트재생, 재생정지/재시작/반복/0.25·0.5·1·2·5배속/스크럽/이전다음/배경4종/전체와5레이어선택. HTTP http://127.0.0.1:5202/preview.html. 같은폴더의시트/전장PNG를함께둔다.
- 수정원본 {link('effect.json')} / {link('renderer.js')} / {link('build.py')}. reference-v001-renderer.js는차수1읽기참조사본. 원본추출(16,16,960,540)/콘텐츠960×540/패딩16/전체셀992×572/고정지면pivot(480,425)→셀(496,441). 표시배율은균일하며피해판정/사거리와무관하다.
- 동일셀·동일배경·동일시각차수1/2 비교 {link('before-after-slash-grey.png')} / {link('before-after-slash-dark.png')} / {link('before-after-slash-battle.png')}; 지면 {link('before-after-ground-grey.png')} / {link('before-after-ground-dark.png')}; 접촉·분출·감쇠 {link('before-after-stages-grey.png')} / {link('before-after-stages-dark.png')} / {link('before-after-stages-battle.png')}. 자동crop/확대맞춤없이호변화를보인다.
- 전체밝은연락판 {link('contact-grey.jpg')} / {link('contact-green.jpg')}, 어두운/전장 contact-dark.jpg/contact-battle.jpg. 대표단계 stages-grey.png/stages-green.png/stages-dark.png/stages-battle.png. {link('layers-inspection.png')}는실제분리레이어확인판이다.

## 실제 변경·타임라인

차수1의어두운내부구멍과밝은연속베벨테두리, 다면석편음영을제거했다. 얕은납작한쓸림자국/얇은긁힘,접점에서바깥으로확장되는가지균열, 단순석편실루엣과약한선하이라이트, 납작한그림먼지덩어리가중심이다. 먼지는바닥방향으로퍼지고속도/농도가감쇠하며, 석편은중력1550px/s²의가벼운포물선을그려착지·소멸한다. 검격의볼륨빛과지면의평면표현을분리했다.

|레이어|설정시작s|설정종료s|실제가시프레임(1부터)|
|---|---|---|---|
{table}

날끝은0.30초에공통지면anchor(496,441)에일치한다. 논리18프레임완료/샘플19번에서섬광1회, 지면/석편20번부터, 먼지21번부터. 접촉전지면반응없음. 검격은26번까지소멸하고전체는52번까지,0.867초부터빈프레임으로정리되어1.2초반복한다. 영구지형파괴false제안. 실제피해·지형충돌로직은없다.

JSON slash의start/sweep/duration/radiusX/Y/startAngle/endAngle/thickness/rotation, 공통pivotSource와레이어별offset/angle/scale/opacity, 섬광size/duration, 지면width/duration, 파편count/seed/gravity/speed/duration, 먼지count/seed/spread/duration을조절한다. 접촉시각은start+sweep, 지면반응시작은접촉+delay에서재계산한다. 곡선중심은끝점으로부터역산해groundanchor와분리했다.

별도JSON사본수정→`python build.py --spec <사본.json>`→serve.py에서뷰어열기→`demo.exportFrames()`→`python export.py`→`python qa.py`. 옵션없이build하면기본제안으로돌아간다. 클립프레임수72/60FPS/1.2초를넘는편집은출력기/뷰어프레임설정도함께변경해야한다. 형태/offset수정후접점·안전여백을재검증한다.

## 도구·근거·검증

차수2필독15개본문/최신사용자피드백/차수1보고/공방·재료함을읽고새start통과했다. 이전차수확인서를재사용하지않았다. 기존Canvas2D원본을별도사본에서수정했다. 도구Canvas2D/Python/Pillow/FFmpeg/Orca브라우저, 이미지모델0회/영상AI·Grok0회/유료외주0회/모델전환0회. 실제의도 {link('제작프롬프트.md')}. 외주완성시트자동분해없음.

- {link('revision-audit.json')}:205→90도/반경반감아님/같은셀·피벗전후비교. 실제지면·파편·먼지그리기함수를재작성했으며수치만바꾼출력이아니다.
- {link('frame-audit.json')}:432프레임가장자리알파0/최소64px여백(기준16이상),첫끝투명/전체시트셀원본픽셀일치.검격/섬광RGB순백·검은매트없음. 밝은회색·초록전체프레임과어두운/전장대표를직접열어면/방향/균열·석편/빠른소멸을확인했다.
- {link('selection-contact-audit.json')}:날끝/anchor일치,배경4·레이어6선택/프레임이동통과. {link('playback-audit.json')}:0.25·0.5·1·2·5배속/정지/재시작/반복·비반복종료. {link('parameter-audit.json')}:실제렌더두께/섬광크기조정이반영되고복원됨.
- {link('standalone-audit.json')}:서버없는file재생/전장PNG로딩. mobile-320.json/mobile-390.json 및화면캡처에서가로넘침0/조작48px이상,큰창실측은mobile-1100.json. 브라우저최종콘솔오류0.실기기/APK검사아님.
- {link('media-audit.json')}:4종MP4 992×572/72프레임60FPS/1.2초전체디코드오류0,4종GIF1.2초·무한반복. GIF는50FPS표본,원본PNG/MP4는60FPS. GIF/MP4를알파출력이라고하지않는다.
- {link('preservation-audit.json')}:차수1포함이전6작품모든manifest파일해시불변.신규v002만작성,게임/src·공방/재료함·규정/타팀미수정.사용자저장요청없어커밋푸시예약백업미실시.

**한계/남은판정:** 사분원은타원원근과넓은광량면의현재제안이며수치90도가스타일합격을뜻하지않는다. 흰색은매우밝은배경에서대비가낮고납작한먼지는작은화면에서옅게읽힌다. 기존전장forest-clearing 배경위비파괴합성으로게임스킬적용/실제유닛겹침검사가아니다. 캐릭터/검본체/적/게임피해/지형로직/사거리/게임통합없음. 최종속도·규모·두께·시각합격과독립테스터판정은사용자/메인후속검토대기다. 기준보완제안은미확정이며활성규정변경없음.
''')
files=[]
for f in sorted(P.rglob('*')):
 if f.is_file()and f.name!='manifest.json'and '__pycache__'not in f.parts:files.append(dict(path=f.relative_to(P).as_posix(),bytes=f.stat().st_size,sha256=hashlib.sha256(f.read_bytes()).hexdigest()))
js('manifest.json',files)
print(f'{len(files)} files manifested; {sum(x["files"]for x in preserved)} previous files unchanged; revision report complete')
