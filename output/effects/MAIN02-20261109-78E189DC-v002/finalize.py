from pathlib import Path
from PIL import Image
import json,hashlib
P=Path(__file__).resolve().parent
def write(n,s):(P/n).write_text(s,encoding='utf-8')
def j(n):return json.loads((P/n).read_text(encoding='utf-8-sig'))
for d in j('읽기확인.json')['documents']:assert hashlib.sha256(Path(d['path']).read_bytes()).hexdigest()==d['sha256']
older=[]
for folder in ['MAIN02-20261109-C970BE7A','MAIN02-20261109-C970BE7A-v002','MAIN02-20261109-78E189DC']:
 root=P.parent/folder;m=json.loads((root/'manifest.json').read_text(encoding='utf-8'))
 for f in m:assert hashlib.sha256((root/f['path']).read_bytes()).hexdigest()==f['sha256'],str(root/f['path'])
 older.append(dict(folder=str(root),unchanged=True,files=len(m)))
write('preservation-audit.json',json.dumps(older,ensure_ascii=False,indent=2))
extras=[(Path(r'C:/Users/user/Desktop/Grid Defenders/작업관리/저장운영규정.md'),'커밋/푸시/예약백업을하지않고제작파일과최소착수검증기록만작성; main01의1회저장중복안함'),(Path(r'C:/Users/user/orca/workspaces/Grid Defenders/캐릭터디자인2/output/characters/gc9_longsword_dagger/제작기준.md'),'금발/목도리/갑옷/장비좌우정체성유지, 새영웅확정없음'),(Path(r'C:/Users/user/orca/workspaces/Grid Defenders/스프라이트-시트작업/output/characters/gc9_longsword_dagger/walk_right_30f_v01/제작기준.md'),'오른쪽원본과장검/단검/비대칭장화참조; 걷기30프레임규격은새공격에강제하지않음'),(Path(r'C:/Users/user/.codex/skills/.system/imagegen/SKILL.md'),'내장생성/참조실제첨부/네이티브알파/원본보존; 영상경유는명시사용자지시로대체')]
write('additional-readings.json',json.dumps([dict(path=str(p),sha256=hashlib.sha256(p.read_bytes()).hexdigest(),applies=a) for p,a in extras],ensure_ascii=False,indent=2))
generated=['exec-c5e7d7fc-bb91-45cf-ab23-9d109ace394e.png','exec-8e7fad25-8135-4c59-82d4-827820707282.png','exec-1610a197-02ce-4c12-88a5-af5f61933a55.png']
generation=[]
for i,name in enumerate(['downcut','upcut','diagonal']):
 p=P/f'source-{name}.png';im=Image.open(p)
 generation.append(dict(action=i+1,route='built-in image_gen',model='not exposed in tool response',calls=1,returnedOriginal=str(Path(r'C:/Users/user/.codex/generated_images/01a1bf7d-b7e0-71a0-906d-cd676cfc66f7')/generated[i]),projectCopy=p.name,sha256=hashlib.sha256(p.read_bytes()).hexdigest(),size=list(im.size),mode=im.mode,alphaExtrema=im.getchannel('A').getextrema(),prompt=f'prompt-{name}.txt',references=['right-master.png']+([] if i==0 else ['downcut-end-reference.png' if i==1 else 'upcut-end-reference.png']),referenceRoles=['identity']+([] if i==0 else ['previous action end pose']),apiSwitches=0,videoCalls=0,usageBilling='not exposed; no estimate claimed'))
write('generation-record.json',json.dumps(generation,ensure_ascii=False,indent=2))
spec=j('motion.json');audit=j('frame-audit.json')
frames=[x for x in audit['frames'] if 'frame'in x]
assert len(frames)==24 and audit['uniqueFrameHashes']==24 and min(x['margin']for x in frames)>=16
assert all(x['sourceToOutputScale']==1 and x['outputPivot']==[256,592] for x in spec['frames'])
atlas=Image.open(P/'combo-sheet.png').convert('RGBA')
for f in spec['frames']:
 x,y,w,h=f['atlasRect'];assert atlas.crop((x,y,x+w,y+h)).tobytes()==Image.open(P/f['file']).convert('RGBA').tobytes()
rest1=frames[0]['box'];rest24=frames[-1]['box'];height1=rest1[3]-rest1[1];height24=rest24[3]-rest24[1]
write('sheet-audit.json',json.dumps(dict(frameCount=24,uniqueFrames=24,allFramesMatchAtlas=True,pixelScale=1,minMargin=min(x['margin']for x in frames),pivot=[256,592],restWholeArtHeightFirst=height1,restWholeArtHeightLast=height24,restHeightDifferencePct=round(abs(height1-height24)/height1*100,2),motionStyleFinalApproved=False,effectsIncluded=False),indent=2))
link=lambda n:f'[{n}]({(P/n).as_posix()})'
table='\n'.join(f"|{f['frame']}|{f['action']}|{f['phase']}|{f['durationMs']}|{f['startMs']}–{f['endMs']}|"for f in spec['frames'])
write('결과보고.md',f'''{link('preview.html')} · {link('combo-grey.gif')} · {link('combo-sheet.png')}

# MAIN02-20261109-78E189DC / 차수2 / effects / main02

이펙트 없는 오른쪽 검사 모션 시트를 실제 제작했다. **내려치기8포즈→올려치기8포즈→오른쪽아래 사선내려치기와회복8포즈**, 총24포즈다. 몸·팔·허리·무릎이 달라지는 이미지 생성물이며 정지 캐릭터를 회전/복제한 것이 아니다. 낮은끝자세→올림→높은끝자세→사선내림→중립을 연결했다. 사용자의 동작 합격과 최종속도는 **미정**이다.

## 실제 산출물

- 원본시트: {link('source-downcut.png')} / {link('source-upcut.png')} / {link('source-diagonal.png')}, 각각1448×1086 RGBA, 생성파일을 픽셀변경 없이 복사해 보존했다.
- 게임용통합 {link('combo-sheet.png')}:3840×2560,6열4행,640×640셀24개, **실제알파 있음**. 동작별 {link('downcut-sheet.png')} / {link('upcut-sheet.png')} / {link('diagonal-sheet.png')}:각4열2행. {link('motion.json')}에 순서/추출영역/소유마스크/발pivot/스케일/단계/임시시간 기록. frames/frame-01.png~24.png 제공.
- **시트에서 셀을 읽어 만든 재생**: {link('combo-grey.gif')} / {link('combo-green.gif')} / {link('combo-dark.gif')}, 각640×640·24프레임·총2050ms·무한반복. GIF는 배경합성으로 알파가 없으며 투명 원본은 PNG다. 영상AI 생성이 아니다.
- {link('preview.html')}:시트 임베드로 서버없이열림, 재생/정지·처음부터·반복·0.25/0.5/1/2배속·프레임스크럽·이전/다음·배경3종. HTTP 확인 http://127.0.0.1:5199/preview.html.1배2.05초는 제안 초기값이다.
- 모든포즈 {link('contact-grey.jpg')} / {link('contact-green.jpg')} / {link('contact-dark.jpg')}; 각타대표 {link('pose-hit1-grey.png')} / {link('pose-hit2-grey.png')} / {link('pose-hit3-grey.png')}. 대표와전체시트는 동작검토용이며 미적합격표시가 아니다.

## 이번 사용자 지시와 스킬 예외

확인 원문 **“진행 ㄱ”**. 최신순서인 **선캐릭터모션시트→사용자가이펙트종류선택→그모션에맞춘이펙트후속제작** 중 첫단계만 수행했다. 검과단검은 물리장비로 포함하되 발광/검격/잔광/불꽃/타격광은 그리지 않았고 합성하지 않았다. 원래 무기의 작은 청색장식은 정체성의 비발광 인레이로 유지했다.

generate2dsprite의 캐릭터 영상경유 기본문구를 이번 명시사용자지시가 대체한다. **imagegen 내장도구로 참조이미지를 실제첨부해 연속프레임시트를3회 생성**했다. Grok/영상API 호출0, 영상RATE_LIMIT 재시도0, 미승인 서비스/유료모델전환0. model명/사용토큰/과금은 도구가 노출하지않아 추정하지 않았다. {link('generation-record.json')} 및 prompt-downcut/upcut/diagonal.txt에 경로·입력역할·프롬프트·출력크기·해시 보존. 원본모델을가정해 gpt-image 특정버전으로 기록하지 않았다.

이전차수1 RATE_LIMIT 실패보고는 그대로 미완료이며 이번성공으로 소급변경하지 않는다. 새영웅 정체성·피해·사거리·쿨타임·전투판정·실제3회피해·게임통합은 지정하지 않았다. MP4는필수아니므로 이번에는 제작하지 않았다.

## 캐릭터/원본과 처리

참조 {link('right-master.png')}는 이전사본을 그대로읽었고 출처는 스프라이트-시트작업/output/characters/gc9_longsword_dagger/walk_right_30f_v01/references/03_right_090.png다. 금발/갈색눈/청색목도리·은갑옷·갈색복장/비대칭장화, 가까운오른손장검·먼왼손단검, 오른쪽측면을 참조했다. 새게임영웅선정이 아니다. 이후타격은 직전시트 마지막포즈를 두번째실제이미지참조로 첨부했다.

원본은4×2 배치로생성됐으나 여백이정확한등분을따르지않고 일부인접포즈의 사각bbox가 겹친다. 등분셀로 무기를자르지않도록8개캐릭터의연결영역을측정하고 남은미세부품도 최근접소유에보존했다. sourceRect와 동작별ownership PNG의값1~8을 함께쓰면 추출범위를재현할수있다. 단순최대연결부품만남기는삭제는하지않았다. 생성시트원본은 그대로이며 별도추출은 이번 명시스프라이트납품범위다.

네이티브알파의 배경잡티만 정리했다:alpha≤4를0으로,alpha5~31 중alpha≥32 영역에서2px이상떨어진미세픽셀을0으로 했다. alpha≥32를가진 본체/피부/무기암부는 보존했다. 처리후남은가시픽셀수는 각액션8출력의합과일치한다. RGB재색칠/키색제거/무기재생성은 하지않았다. 소유영역마스크만적용하고 **회전/미러/포즈보간/개별bbox기준축소없음**, 전체1:1원본픽셀스케일에서 주석한발중심좌표로평행이동했다.

공통셀640×640, 발pivot(256,592), 모든프레임같은스케일1, 최소투명여백16px(실측최소{min(f['margin']for f in frames)}px). 원본3번의올린검끝은원본상단7px까지가까웠지만 실제끝은캔버스안에있었으며, 없는그림을패딩으로복원했다고보고하지않는다. 표시크기는셀전체에균일비율로적용하며 피해/충돌범위는 별도미정이다. 실제SkillFrameArt 게임연결은 수행하지않았다.

## 동작과 시간

|프레임|타|단계|임시지속ms|시작–끝ms|
|---|---|---|---|---|
{table}

타격완료는 시각명세상7/16/22프레임의끝으로기록했으며 실제피해발생기가아니다. 보간없는24개 키포즈 샘플이므로0.25배속에서는 프레임단위변화가보인다.

## 검증과 한계

- sheet/frame-audit:24개서로다른RGBA포즈, 모든프레임과통합시트셀의픽셀일치,24셀모두투명외곽/16px안전여백/경계접촉0, 공통pivot/원본스케일1 확인. bright회색/초록/어두운전체포즈와원본3장, 대표포즈를직접열어 전신/무기/손/발/얼굴방향·이펙트없음을검토했다.
- GIF3개실제디코드24프레임·2050ms·무한반복 확인. 뷰어0.25/0.5/1/2배속·정지안정성·재시작·비반복종료·반복재시작·이전/다음·1~24스크럽·배경3종 통과. file프로토콜에서내장3840×2560시트가디코딩되고서버없이작동했다. browser-console 오류0.
- 320/390 CSSpx에서가로넘침0·조작48px이상. 실제큰창검사는Orca가1100요청대신1641px창을사용한측정값을그대로남겼다. 브라우저DPR1검사이며 실기기/APK/게임통합검사는아니다.
- **한계:** 이미지생성포즈간 가드장식/칼날세부·손가락/얼굴윤곽의작은그림변동이있고 시작/끝중립 전체가시높이는{height1}/{height24}px로약{abs(height1-height24)/height1*100:.1f}%차이가있다. 발pivot은고정했으나 캐릭터픽셀전체가동일비율의완벽한원화라고주장하지않는다. 내려치기와사선내려치기는모두위→아래로연결되지만 세번째는더큰몸쏠림과오른쪽아래마무리로구분된다. 사용자동작합격/최종속도는아직미정이며 GIF가움직인다는이유만으로동작품질합격을대신하지않았다.
- 이전6연격두버전 및 이번차수1실패기록의 모든manifest파일해시가불변임을검사했다. 게임/src·공방/재료함·타팀원본·규정 미수정. 추가전달된 저장운영규정v1.0을본문읽어적용했으며 커밋/푸시/예약백업/중복1회저장없음, 제작파일과최소검증기록만작성했다.

필독14개현재해시와 추가캐릭터제작기준/저장규칙/이미지스킬 적용은 읽기확인.json 및additional-readings.json에연결했다. 사용자합격·효과선택·효과맞춤합성은후속이며지금선행하지않았다.
''')
write('1_대화기록.md','사용자: 영상이아닌스프라이트시트 / 선캐릭터모션후효과선택맞춤. 확인:진행 ㄱ. 이번차수2는이미지기반캐릭터모션만. 추가메인지시 msg_c57a89098523: 저장운영규정적용/중복저장금지/제작계속.\n')
write('3_작업일지.md','필독14본문/캐릭터기준재독→차수2 start→사용자명시영상경유예외→내장imagegen참조첨부3회/각8포즈→원본보존→알파미세잡티정리/8소유영역측정→수동발pivot 평행등록/24포즈1:1→통합시트→시트셀재독GIF/뷰어→밝은전체프레임/배속/모바일/file검사→한계/결과보고. 영상AI·효과합성 없음.\n')
write('4_정의문서.md','원본3장각1448×1086, 통합3840×2560/640셀6열4행24포즈, pivot256,592/원본스케일1. 모션명세motion.json. 1배2050ms임시. 후속효과종류선택/합성미실시, 게임피해미정.\n')
write('5_버전관리.md','차수2 로컬신규제작파일만. 이전6연격/차수1실패/원본보존. 사용자저장요청없는커밋/푸시/예약백업없음; 현재1회저장main01담당중복안함. manifest.json은산출물해시검증기록이다.\n')
manifest=[]
for f in sorted(P.rglob('*')):
 if f.is_file() and f.name!='manifest.json':manifest.append(dict(path=str(f.relative_to(P)),bytes=f.stat().st_size,sha256=hashlib.sha256(f.read_bytes()).hexdigest()))
write('manifest.json',json.dumps(manifest,ensure_ascii=False,indent=2))
print('FINAL24POSES VERIFIED',len(manifest),'files')
