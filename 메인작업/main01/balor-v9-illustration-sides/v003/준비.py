from pathlib import Path
import json,hashlib,importlib.util
R=Path('C:/Users/user/Desktop/Grid Defenders');S=R/'작업관리';H=Path(__file__).resolve().parent;old=json.loads((H.parent/'연결.json').read_text(encoding='utf-8'));tid=old['task'];V=Path(old['output']);W=V.parents[3]
if (H/'연결.json').exists():raise SystemExit('Already prepared; inspect before repeating.')
assert W.name=='캐릭터디자인2';V2=Path(json.loads((H.parent/'v002/연결.json').read_text(encoding='utf-8'))['output'])
catalog=json.loads((S/'브랜치목록.json').read_text(encoding='utf-8'));org=json.loads((S/'조직.json').read_text(encoding='utf-8'));assert Path(catalog['branches']['characters']['path'])==W and org['nodes']['characters']['teamOwner']=='characters'
source_names=['inputs/front-v9.png','built-in/right-035.png','built-in/right-090.png','image26/right-035.png','image26/right-090.png']
source_rows=[{'path':str(V/n),'sha256':hashlib.sha256((V/n).read_bytes()).hexdigest()} for n in source_names]
(H/'입력목록.json').write_text(json.dumps(source_rows,ensure_ascii=False,indent=2),encoding='utf-8')
spec=importlib.util.spec_from_file_location('board',S/'도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(S);t=b.load(tid,'main01')
assert t['iteration']==2 and t['status']=='awaiting_user'
b.record(tid,'main01','revise',H/'사용자확인.md','35랑90수정; 내장기준그림체변경,비정상손목과그에따른검각도; 포즈변경반려')
t=b.load(tid,'main01');assert t['iteration']==3 and t['status']=='draft';F=b.folder(tid);O=V.parent/('v9_builtin35_90_fix_'+tid.lower()+'_v003')
request=(H/'사용자확인.md').read_text(encoding='utf-8')
prompt=f'''# {tid} / 수정차수3 / main01 → characters

## 사용자승인과이번결과
{request}
완성대상은 내장35도1장과내장90도1장, 총2장이다.35도를누락하지말고같은결과페이지첫화면에두방향모두보여준다. 사용자허락은실제‘진행’이며이전차수2의90한장/수직검수정범위는더이상사용하지않는다.

## 최상위수정우선순위
1. 각내장원본의그림체(선굵기/얼굴선/채색의색면·명암/갑주광택/헤어질감)와기본입상포즈를보존한다.
2. 원래팔동선과그립위치근방에서손목·장갑손가락·엄지감싸기를자연스럽게교정한다.2.6의자연손목/그립을해부학참고로만사용한다. 잘못된원손목자체를고정하라는뜻이아니다. 손목/손의필요한국소회전은허용하되어깨/상완/팔꿈치/전완의큰위치나팔동선·다리·발기본자세를바꾸지않는다.
3. 그자연스러운손과맞물리는검전체를연결한다. 날–가드–손잡이–폼멜이하나의직선강체이고그립부분에서꺾이지않아야한다. 손목을비정상각도로꺾어서검직선수치만맞추지않는다.
4. 원래사선으로내려든느낌을유지하며신체의해당35/90평면과맞는검각도로작게조정한다. 검을수직으로세워들거나주먹을새방향으로틀어팔포즈를바꾸는v002해법은반려됐다. 무기의직선축만으로성공판정금지.
5. 이전에승인한몸통/시선의2.6참고는위그림체·포즈보존을우선하여미세하게반영한다. 전신을마르게압축/늘리거나얼굴/머리크기·다리길이를바꾸지않는다. 방패를실제로들고있는측면의방패뒷면/손잡이/스트랩/왼손연결과층견장디테일은유지한다.

## 생성입력역할과정확경로
그림체와포즈 EDIT TARGET 각각:
-35도: {V/'built-in/right-035.png'}
-90도: {V/'built-in/right-090.png'}
각방향독립적인국소편집을한다. 두각도를반전/한각도변형으로대체하지않는다. 35를45로바꾸지않고90은정측면을유지한다.
읽기전용2.6해부학참고 원본:
-35: {V/'image26/right-035.png'}
-90: {V/'image26/right-090.png'}
특히다음기존네이티브크롭을사용하면참조역할을좁힐수있다(새이미지생성아님):
-35그립/몸통/시선: {V/'evidence/image2635-grip.png'}, {V/'evidence/image2635-torso.png'}, {V/'evidence/image2635-face.png'}
-90그립/몸통/시선: {V/'evidence/image2690-grip.png'}, {V/'evidence/image2690-torso.png'}, {V/'evidence/image2690-face.png'}
각호출에서타깃내장1장에같은각도의필요한2.6참고크롭만실제로첨부하고프롬프트에'해부학/형태만,색·선·재질·캐릭터얼굴·화풍이전금지'를분명히구분한다. API측도검축미달이있으므로그검의꺾임은복사하지않는다. 시선참고는눈방향일뿐얼굴그림체/헤어를복사하지않는다. 기존각도별원본과참고는모두view_image로직접확인하고이미지를실제입력한다. 파일명/텍스트만으로이미지첨부를대체하지않는다.
장비정체성필요시읽기전용 v9정면:{V/'inputs/front-v9.png'} (검의길이/은날개가드·붉은보석·청색그립·은폼멜과오른손검/왼손방패확인). 새로운정면/색마감재생성은금지.
반려v002: {V2/'final/builtin-right-090.png'} 는문제대조용이력일뿐편집타깃/화풍/손포즈기준에첨부하지않는다.

## 실제작업법과검수게이트
imagegen 스킬본문을읽고내장 image_gen으로기존이미지편집만사용.1각도당먼저손목/손/검연결의작은수정을지시하고원본과확대·전체를비교한다. 꼭필요하지않은얼굴/갑주/배경변경조건을한꺼번에중첩해전체재작화를유도하지않는다. 같은범위내국소보완은각도당최대2회추가,전체내장최대6회에서두최종을제출. 결과마다원그림체·포즈·자연손목·검축4항목을독립적으로확인한다. 매번참조역할과불변조건을유지한다. 과거'검축통과/최종succeeded'문구를복제해사용자반려된손을자연스럽다고판정하지않는다.
2.6/API/유료모델/키env열람/자동fallback0. 사용자규칙에따라이번은내장편집만이며이미있는2.6PNG를읽는것은새2.6호출이아니다. 유료adapter/설정을열거나호출하지않는다. 기존연결파일은유지한다.
그림자체를Python/SVG로대체그리기·비균일워프·그립만코드스큐금지. 코드사용은메타/비교크롭/명암합성/갤러리/검증자료에만. 생성원본native해상도/바이트/알파를보존. 원본프레임·기본키·발선을생성단계에서지키되다르면측정해공개하고재인코딩으로맞춘척하지않는다.

## 납품·원본보존·화면
새수정출력: {O}
final/builtin-right-035.png 와 final/builtin-right-090.png, 원내장2장/기존2.6참고/승인정면의바이트동일사본, 후보/프롬프트·실제첨부역할·호출기록·manifest(native/alpha/sha/body/foot/추정오차), 보고.md/검수.md/제작기준.md/5종기록/차수3ACK-start.
새index.html의첫비교는위행'내장수정'0(기존v9)/35수정/90수정,아래행'기존2.6참고'0(동일v9)/35원본/90원본로6칸을같은본체높이·발선으로표시. 정면은새생성이아니다. 내장행35/90를둘다같이수정전/후토글하거나같은페이지의하단전후비교를추가하여기존6칸원본과두수정결과를한페이지에서바로볼수있게한다.35는별도링크에만두지않는다. 밝음/어두움/원본확대/원본크기,큰얼굴·헤어·몸통·견장·방패·손목/그립·검전체비교제공.
기존v001/v002전체와사용자비교갤러리를덮어쓰지않는다. 모든변경은새O와현재차수기록범위만. 카탈로그/게임/공통규정/타팀·타메인/서버·포트/사용자창/탭·패널/Git커밋푸시/예약백업변경금지.3차결과는사용자합격전SD·리깅으로넘기지않는다.

## 새필독/착수/반환
자동첨부된필독목록본문+본차수사용자피드백을새로읽고문서별적용과우선순위충돌을새ACK에기록한뒤characters start통과.2차ACK재사용금지. 새피드백이과거2차의'팔을바꾸며수직검/부자연스런그립도기술통과'보다우선하고1차내장/2.6양산범위도지금금지범위에맞게제한됨을기록한다.
반환전직접원본/수정둘다열어1)내장선/색면/재질/얼굴유지 2)큰팔동선·기본자세유지 3)전완-손목-손가락의자연스러운그립 4)검의단일강체축/자연각도/신체관통없음 5)방패/견장보존 6)몸통/시선의제한된반영을각각증거와잔여차이로보고한다. 검중심선수치만제시해미적/해부문제를숨기지않는다. 부족하면outcome failed로두실제최종과미달을정직하게반환하며새범위/유료로복구하지않는다. 보존해시와호출횟수/API0을확인하고이미지생성성공/기술검수/사용자합격을구분한다.
공식새Task/Dispatch의worker_done으로main01 run_47ce1a81d7b1에원작업번호/차수3/실물2장/출력절대경로/보고·검수·비교경로/호출이력/한계를반환한다. 사용자판정대기.
'''
(F/'요청확인.md').write_text(request,encoding='utf-8');(F/'전문프롬프트.md').write_text(prompt,encoding='utf-8');(F/'2_사전확인.md').write_text((H/'사전확인.md').read_text(encoding='utf-8'),encoding='utf-8')
extras=[H/'사용자확인.md',H/'사전확인.md',S/'이미지2.6사용규칙.md',S/'진행승인규칙.md',S/'저장운영규정.md',V/'제작기준.md',V/'검수.md',V2/'검수.md',W/'문서/02_세부기획/02_영웅/한손무기그립기준.md']
for p in extras:assert p.is_file(),p
b.set_readings(tid,'main01',[str(p) for p in extras]);b.confirm(tid,'main01','진행',H/'사용자확인.md');plan=b.prepare(tid,'main01')
l={'task':tid,'iteration':3,'folder':str(F),'output':str(O),'originalOutput':str(V),'rejectedOutput':str(V2),'plan':plan,'state':'prepared_not_sent','targetDispatch':'ctx_762d1ed11a84','generationRoute':'built_in_only','image26CallsAllowed':0}
(H/'연결.json').write_text(json.dumps(l,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({'task':tid,'iteration':3,'prompt':plan['prompt'],'output':str(O),'state':l['state']},ensure_ascii=False))
