from pathlib import Path
import importlib.util,json

R=Path('C:/Users/user/Desktop/Grid Defenders');S=R/'작업관리';H=Path(__file__).resolve().parent;Q=H/'qa';Q.mkdir(exist_ok=True)
if (Q/'연결.json').exists():raise SystemExit('독립 검증이 이미 준비됐습니다. 중복 등록하지 않습니다.')
parent=json.loads((H/'연결.json').read_text(encoding='utf-8'));O=Path(parent['output']);W=Path('C:/Users/user/orca/workspaces/Grid Defenders/스킬-이펙트')
proof=(H/'사용자확인.md').read_text(encoding='utf-8')
pre='기존 사용자 진행으로 승인된 공방 기능의 독립 기술 검증이다. 제작팀과 다른 qa가 고정된 changed-files.json/수신파일검증.json의 실제 SHA를 확인한다. 제작 원본·원화·공유규정은 수정하지 않는다. 기존5182 및 격리 headless/독립 저장문맥만 사용하여 사용자 화면/작품저장소를 건드리지 않는다. QA 역할 방법·규정과 원작업 지시/현사용법을 새 ACK/start로 읽는다. 작업별2.6허가 없음/생성API0/Git0. 기존 수백검사를 의미없이 반복하지 않고 핵심 수동변환·동기시간·독립복구·원본보존/모바일에 집중한다.'
spec=importlib.util.spec_from_file_location('board',S/'도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(S)
t=b.new('main01','qa','캐릭터 프레임 보정·이펙트 공방 독립 기술 검증',proof);tid=t['id'];F=b.folder(tid)
out=Path('C:/Users/user/orca/workspaces/Grid Defenders/테스터/output')/('character-effect-workshop_'+tid.lower()+'_v001')
prompt=f'''# {tid} / 차수1 / qa — 공방 독립 검증
원작업 {parent['task']} 차수1 / main01. 이번은 기존 승인 구현의 기술 검증이며 사용자 미적 합격을 대신하지 않습니다.
사용자 실제 승인 {H/'사용자확인.md'} 의 '진행'과 원작업 지시를 읽습니다. 현재 자동첨부 필독 본문→문서별 실제 적용/현재SHA ACK→start 후 검사합니다. 과거 qa ACK 재사용 금지.

대상 {W/'게임'} / 반환 {O/'검증보고.md'} / 사용법 {W/'게임/src/effect-workshop/ACTOR-README.md'}.
실제 변경 대상 {O/'changed-files.json'} 과 main01 SHA검증 {H/'수신파일검증.json'} 을 대조해 검사 버전을 고정합니다(일부JSON BOM은utf-8-sig로읽기). 원작업 전문지시는 {parent['plan']['prompt']} 입니다. 구현은 기존 공방 캐릭터 합성 탭에 이미 연결됐고 http://127.0.0.1:5182/effect-workshop.html#actor 가 HTTP200입니다. 새 서버/사용자탭·패널 조작 없이 기존5182와 격리 headless/새 브라우저 문맥을 사용하세요. 사용자 브라우저의 기존 localStorage/IndexedDB·작품을 삭제/변경하지 마세요.

제작팀은 신규64개·402회귀·build와 독립문맥 복구를 보고했습니다. 이것을 그대로 옮겨 승인하지 말고 아래 위험에 집중해 실물 재현합니다. 이미 통과한 광범위 회귀 전체를 이유 없이 반복하지 않아도 됩니다.
1. 실제 금발 demo의 1프레임만 원본px X/Y/등비 수정→이웃불변/범위적용 상대·절대/undo·redo/드래그 한 번 취소. 재생→멈춤→프레임 이동·동작변경에서 상태가 올바른지.
2. direct-sheet의 비균등 frameRects/origin/sourceAnchor/몸키·발점과 보정 변환을 손으로 계산한 기대 좌표와 대조. 확대·72CSSpx·실제 전장에서 같은 등록/점 좌표가 나오는지. 체공/죽음을 프레임별bbox로 정규화하지 않는지.
3. 기존 공방 효과/무료 PNG를 캐릭터와 함께 사용. 시작 전/지속종료/다른FPS·배속·정지/탐색,root/수동점/전장고정과 앞뒤 레이어,프레임별점/효과키가 실제 화면·픽셀에서 맞는지. 미지정 점 안내와 정확한 키 보존. 탭을 반복 전환했을 때 숨은 재생/이벤트 누적이 없는지.
4. 실제 에셋 포함 JSON 내보내기 버튼→완전히 독립된 브라우저 문맥 파일입력 복구→같은 원본SHA·모션·보정·점·효과가 되돌아오는지. 잘못된SHA/NaN/좌표/배열/큰입력이 기존 문서를 훼손하지 않는지. 객체URL에 의존하지 않는지.
5. 밝은/어두운/실제전장과320/390CSSpx에서 조작·가로넘침·실제노출터치영역 확인. source-hashes.json 및 대상 PNG 해시 전후, source 변경표 전후 동일. 필요한 집중 모델/브라우저 검사를 실행하되 이미지 미술 합격/실기기 검증/게임 적용으로 과장하지 않습니다.

자기 {out} 에만 검사코드·5종기록·재현증거/화면·버전해시·PASS/FAIL·제약·수정 권고를 씁니다. 제작 원본/게임/src를 수정하거나 이번 QA로 새 미술/모델/API/Git 작업을 하지 않습니다. 발견하면 재현·기대/실제·영향/심각도와 파일/행을 보고하여 담당 effects에 돌립니다. 검사할 수 없는 항목은 이유를 적습니다. 불필요한 프로필 삭제/사용자 승인 요청 없이 안전한 별도 문맥을 닫아 종료합니다.
공식 새 Task/Dispatch worker_done으로 main01 run_47ce1a81d7b1에 원작업·검증작업·차수와 보고 경로/실제 outcome을 반환하세요. 핵심 결함 발견 시 status 또는 question으로 먼저 알려도 됩니다.
'''
(F/'요청확인.md').write_text(proof,encoding='utf-8');(F/'전문프롬프트.md').write_text(prompt,encoding='utf-8')
docs={'1_대화기록.md':proof,'2_사전확인.md':pre,'3_작업일지.md':'제작반환/실제HTTP·14변경해시·화면확인 후 qa 독립 집중검증 준비.','4_정의문서.md':'현재 공방의 프레임 격리보정/원본px·CSS변환·공통시간/효과부착·앞뒤/에셋포함독립복구/모바일·원본보존 검증.','5_버전관리.md':'원작업 MAIN01-20261111-47B7186F 차수1 연결. 현재 해시 고정 검사,제작원본수정/Git/생성API0.'}
for name,text in docs.items():
 body='# '+tid+' / 차수1\n\n'+text+'\n';(F/name).write_text(body,encoding='utf-8');(Q/name).write_text(body,encoding='utf-8')
extras=[H/'사용자확인.md',H/'사전확인.md',H/'수신파일검증.json',Path(parent['plan']['prompt']),O/'검증보고.md',O/'changed-files.json',W/'게임/src/effect-workshop/ACTOR-README.md',S/'단일메인운영규정.md',S/'기준/characters/SD_72CSSpx_표시기준.md',R/'문서/00_개발규칙/스킬구현규약.md',R/'문서/00_개발규칙/모바일UI규격.md',S/'이미지2.6사용규칙.md',S/'저장운영규정.md']
assert all(p.is_file() for p in extras)
b.set_readings(tid,'main01',[str(p) for p in extras]);b.confirm(tid,'main01','진행',H/'사용자확인.md');plan=b.prepare(tid,'main01')
c={'task':tid,'parentTask':parent['task'],'iteration':1,'output':str(out),'folder':str(F),'plan':plan,'state':'prepared_not_sent','targetDispatch':'ctx_a49ce278bf26'}
(Q/'연결.json').write_text(json.dumps(c,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({'task':tid,'state':c['state'],'prompt':plan['prompt']},ensure_ascii=False))
