from pathlib import Path
import json,hashlib,importlib.util
R=Path('C:/Users/user/Desktop/Grid Defenders');S=R/'작업관리';H=Path(__file__).resolve().parent;old=json.loads((H.parent/'연결.json').read_text(encoding='utf-8'));tid=old['task'];V=Path(old['output']);W=V.parents[3]
if (H/'연결.json').exists():raise SystemExit('Already prepared; inspect before repeating.')
assert W.name=='캐릭터디자인2',W
inputs={'edit':('built-in/right-090.png','cae423f6d3338257d25ac73efda067e2d0d6a3ff5e6518aa1e0209c7c60f7e9f'),'torsoGaze':('image26/right-090.png','4433610d0ac2978d909940690d0c4daaea6ae14a1fe311161d8bfe8d4886515a'),'identity':('inputs/front-v9.png','ad96de56563ef391944deac57480e9120e4f1570c60c3c60568baa322c7331e3')}
for name,sha in inputs.values():assert hashlib.sha256((V/name).read_bytes()).hexdigest()==sha,name
spec=importlib.util.spec_from_file_location('board',S/'도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(S)
t=b.load(tid,'main01');assert t['status']=='awaiting_user' and t['iteration']==1
b.record(tid,'main01','revise',H/'사용자확인.md','무기손잡이가 손을 거치면서 꺾인모습은 매우 불합격수준; 내장만 고쳐와; 몸통은2.6을참고하고무기를신체각도에맞춤')
t=b.load(tid,'main01');assert t['iteration']==2 and t['status']=='draft';F=b.folder(tid)
O=V.parent/('v9_builtin90_fix_'+tid.lower()+'_v002')
request=(H/'사용자확인.md').read_text(encoding='utf-8')
prompt=f'''# {tid} / 차수2 / main01 → characters

## 最新 승인과단계
{request}
산출물은 내장으로 수정한90도 최종1장+전후비교다. 나머지35/정면/2.6을새로제작하지않는다. SD/파츠/리깅/모션/실게임적용은여전히미승인후속이다.

## 실제입력이미지 역할(생성전모두직접열람)
Image1 EDIT TARGET(구도·방패뒷면·견장·머리/팔다리/망토의보존기준): {V/'built-in/right-090.png'}
Image2 REFERENCE ONLY(상체몸통의슬림한부피/표면흐름·눈시선방향만): {V/'image26/right-090.png'}
Image3 IDENTITY/EQUIPMENT(장비디자인·검날/은가드/붉은보석/청색그립/은폼멜형태만): {V/'inputs/front-v9.png'}
모두1024×1536RGBA 기존원본이다.1차의유일정면입력규칙은이번수정의3역할입력에대해최신승인으로대체한다. 실패한1차검축은동일성검수대상이지복사할특성이아니다.1차소스와갤러리:{V}

## 고정사항·허용변경
주베이스는Image1이다. 사용자가좋다고한90도의방패를실제로들고있는모습(뒷면/손잡이/팔걸이/전완연결/직립각),3겹견장의세부판금과돌림/앞뒤겹침/흉갑·의상문양/은청색마감/인물정체성을보존한다. Image2의방패앞면이나단순화된견장으로교체하지않는다. 신체각도는오른쪽정측면90을유지하고머리/어깨/골반/발을정면·45도로돌리지않는다.
허용1 상체몸통:Image2의슬림하고매끄러운흉곽~허리실루엣과입체흐름을참고하여필요한부피만정돈한다. 얼굴/머리/전체키/견장폭/팔다리길이를일괄축소하거나몸전체를마르게늘이지않는다. 과거부은얼굴+삐쩍마른몸실패를반복하지않는다.
허용2 시선:Image2처럼캐릭터의우측진행방향을본다. 얼굴기본형/헤어/표정은Image1보존하고불필요하게고개/카메라각을바꾸지않는다.
허용3 검과그립:검날–가드–손잡이–폼멜은동일한한개의직선강체다. 손을지나며날/손잡이가다른방향으로꺾여선안된다. 칼전체의위치·투영각을캐릭터의90도신체평면과자연스러운대기자세에맞춰먼저잡고손목·장갑·그립을연결한다. '무기를신체각도에맞추기'를우선하고손잡이만따로틀거나어색한팔꺾기로봉합하지않는다. 검방향의임의정확각수치/수직평행은새로강제하지않되몸/방패를뚫거나바닥을관통하지않도록한다. 검길이/디자인/보석/날개가드/그립/폼멜의정체성은보존한다. 오른손검/왼손방패를인체좌우기준으로유지한다. 손가락/엄지감싸기와장갑-소매접합이자연스러워야한다.
다른부위/배경/다리/부츠/망토무늬/화풍을전체재디자인하지않는다. 원본과같은프레임·기본표시키·발선을가능하면유지하고투명배경요청. PNG원본은반환native바이트로보존한다. 프레이밍차이가나도늘림/재인코딩해서같다고속이지않는다.

## 제작경로·금지
imagegen 스킬을본문으로읽고 built-in image_gen 편집만사용. target와두참조를 view_image로열고실제입력으로첨부하며역할을프롬프트에명시한다. 독립새캐릭터생성이아닌기존내장90의범위제한편집이다. 내장모델상세미보고를GPT2.6호출로추정하지않는다.
2.6 API호출/키env열람/외주모델전환/CLI paid fallback 전면금지. 기존2.6 PNG를읽는것만가능하다. 과거2.6허가/설정/크레딧은차수2호출근거가아니다. 내장편집후확대검수하고동일허용범위의국소문제만필요시보완하되작업범위/다른시점을확대하지않는다. 최대내장3회내에서수정1최종을제출하고남은미달은보고. 무기를Python/SVG로대체그리거나코드워프/스큐로칼축을속이지않는다. 코드사용은비교크롭/명암합성/측정/갤러리/QA만.

## 허용산출물·보존
새출력:{O}
편집타깃과참고3개를references/에바이트동일복사하고수정final/builtin-right-090.png 및generation원본/프롬프트/실제호출이력/사용참조SHA를보존. 기존v001전체원본과과거API산출물은덮어쓰거나삭제하지않는다.
새index.html/비교PNG에내장90수정전·2.6 90참고·내장90수정후를같은본체높이/발선으로나란히표시하고전후검/그립·몸통·견장·방패·시선확대를제공한다. 기존0/35/90 두경로6칸도보존된원본으로접근가능하게하고정면두칸은같은원본임을명시. 생성은1장수정이고비교6칸+새수정1칸이라는구분을한다. 밝음/어두움과원본확대/크기전환유지. 외부CDN/추가서버/포트없이상대경로로main01이기존HTTP새dev-previews로연결할수있게제출.
새manifest(native/alpha/sha/body/foot메타와추정오차),검수.md/보고.md/제작기준.md/실제내장회수/원본보존확인,현재차수읽기확인/start와5종기록. 이전v001의보고/판정/실패/유료횟수는읽기전용이력으로보존하고이번회수와합산해숨기지않는다. game/src/캐릭터카탈로그/공통규정/타팀/키/사용자화면/Git변경금지。

## 착수와완료판정
수정차수2의자동첨부필독목록본문을모두읽어경로/sha/applies와최신피드백적용을새ACK에기록후characters start통과.1차ACK재사용금지. 하위도같은원작업/범위/필독과자기방법을읽게한다. 현재참조에는2.6의기존이미지가있지만새호출은0이라는경계를특별확인한다.
생성물을실제로열어원본전후전체(밝음/어두움)와얼굴/몸통/방패/견장/검·손확대를검수. 검중심선은blade를연장해guard/그립/폼멜까지연속강체인지실루엣+그립구조로검증한다. 수동선/측정점만바꿔서합격시키지말고직접눈으로꺾임/장비관통/접합을확인하며계측한계도공개한다. Image1방패/견장장점유지및Image2몸통참고가반영됐는지항목별증거를제시한다.
실제수정/기술검증/사용자합격/게임통합은별개. 핵심검축미달이면outcome failed로실제파일과잔여문제를반환한다. 사용자판정은대기. 공식새Task/Dispatch worker_done으로main01 run_47ce1a81d7b1에작업번호/차수2/출력절대경로/보고/검수/새생성회수/2.6호출0을회신한다.
'''
(F/'요청확인.md').write_text(request,encoding='utf-8');(F/'전문프롬프트.md').write_text(prompt,encoding='utf-8');(F/'2_사전확인.md').write_text((H/'사전확인.md').read_text(encoding='utf-8'),encoding='utf-8')
extras=[H/'사용자확인.md',H/'사전확인.md',S/'이미지2.6사용규칙.md',S/'진행승인규칙.md',S/'저장운영규정.md',V/'제작기준.md',V/'검수.md',W/'문서/02_세부기획/02_영웅/한손무기그립기준.md']
for p in extras:assert p.is_file(),p
b.set_readings(tid,'main01',[str(p) for p in extras]);b.confirm(tid,'main01','이 내용으로 진행',H/'사용자확인.md');plan=b.prepare(tid,'main01')
l={'task':tid,'iteration':2,'folder':str(F),'output':str(O),'previousOutput':str(V),'plan':plan,'state':'prepared_not_sent','targetDispatch':'ctx_2a9347e9ed51','generationRoute':'built_in_only','image26CallsAllowed':0}
(H/'연결.json').write_text(json.dumps(l,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'task':tid,'iteration':2,'output':str(O),'prompt':plan['prompt'],'state':l['state']},ensure_ascii=False))
