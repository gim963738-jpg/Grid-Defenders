from pathlib import Path
import datetime, hashlib, importlib.util, json, shutil, subprocess

ROOT = Path(__file__).resolve().parents[3]
S = ROOT/'작업관리'
HERE = Path(__file__).resolve().parent
EXE = 'C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe'
W = Path('C:/Users/user/orca/workspaces/Grid Defenders/캐릭터디자인2')
BASE = W/'output/characters/gc9_longsword_dagger'
IDLE = BASE/'idle6_style1_style4_main01-20261109-e1fd458c_v003'
OLD = BASE/'game_reference10_main01-20261109-e1fd458c_v002'
BALOR = Path('C:/Users/user/orca/workspaces/Grid Defenders/스플래시-아트/output/balor-gc9-retry-20261109-v02/front.png')
receipt = HERE/'실제발송영수증.json'
if receipt.exists() or (HERE/'연결.json').exists():
    raise SystemExit('Existing attempt: inspect receipts; no blind rerun.')

spec = importlib.util.spec_from_file_location('board', S/'도구/작업대장.py')
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); b = m.Board(S)
if 'characters' in b.leases():
    raise SystemExit('Character role already leased; coordinate before dispatch.')

proof = HERE/'사용자확인.md'
proof.write_text('''# 실제 요청·정정·진행 승인
사용자: “우선 느낌을 보는게 우선순위였기때문에 그림체 느낌은 1번이 우리게임 결에 맞는것같고 우선 원본 모델 4번모델은 보관해놔 예비 모델로 보관해놓고 그림체 이미지 변경하면서 칼손잡이가 바뀌는 그런 디테일한부분에서 실수가 일어났거든 이거 피드백해주고 1번 그림체로 발로르 작업개시”.
사용자 추가 정정: “원본모델 이야기 빠졌다”.
메인 이해 확인: 기존 원본 모델 별도 보존,4번 모델도 예비 보존,1번 그림체로 발로르 제작. 발로르 기존 승인 디자인을 유지하고 칼 손잡이·가드·문양 같은 고유 디테일의 임의 변경을 막는 피드백과 검수 기준을 명시. 절차 확인 후 팀장에게 하달.
사용자 실제 승인: “진행”.
제작 첫 단계는 정면 기본 대기 마스터1장이다. 방향 확장·애니메이션·게임 적용·전 캐릭터 일괄 교체·GitHub 저장은 이 단계에서 실행하지 않는다. 1번의 그림체를 선택한 것이 금발전사의 얼굴·장비를 발로르에 복제하라는 뜻은 아니다.
''', encoding='utf-8')

pre = HERE/'사전확인.md'
pre.write_text('''# 발송 전 사전확인
main01 작업연결과 자체 작업방법, 공통 규정A/메인/팀장 운영, 파일담당표/사용법/조직/도메인/보고/진행규칙을 본문 확인했다. 출력 잘림이 있었던 사용법·조직은 별도 재열람했다. 캐릭터 분야/작업방법과 기존 발로르3종 지시·승인일러스트 판정을 읽었다. 실제 승인 발로르v02와 1번 정면 PNG를 view_image로 확인했다.
기존 발로르 SD3종은 사용자 반려·대기 이력이며 새 마스터가 아니다. 해당 main03 작업·sprites 원본·상태를 변경하지 않고, characters의 새로운 작업번호로 정면1장 제작한다. 현재 characters lease 없음, 기존 담당 ctx_eb4e8799e6f3 succeeded/settled/retained 확인. 원본·4번은 별도 보존 사본/해시로 구분. 지시에는 사용자 피드백/디테일 고정/새 ACK/start/실질5종 기록/원본 대조 검수 포함. 게임/공통화풍규정/기존 원본/화면/커밋푸시 제외.
''', encoding='utf-8')

# Preserve the distinct original models and spare #4 without moving or overwriting sources.
sources = [
 ('original-sd', BASE/'combat_ready_right045_illustration_proportions_v02/sd-pose-original.png'),
 ('original-illustration-proportion', BASE/'combat_ready_right045_illustration_proportions_v02/combat-ready-illustration-proportions.png'),
 ('style1-game-reference', OLD/'01_arknights/character.png'),
 ('spare-style4-game-reference', OLD/'04_another_eden/character.png'),
 ('balor-approved-identity', BALOR)]
sources += [(('spare-style4-' if '-4-' in p.name else 'selected-style1-')+p.stem, p) for p in sorted(IDLE.glob('variant-*.png'))]
rows=[]
for label, source in sources:
    if not source.is_file(): raise SystemExit('Missing source '+str(source))
    dest = HERE/'보존모델'/label/source.name
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.read_bytes()!=source.read_bytes(): raise SystemExit('Different preserved copy '+str(dest))
    if not dest.exists(): shutil.copy2(source,dest)
    digest=hashlib.sha256(source.read_bytes()).hexdigest()
    assert digest==hashlib.sha256(dest.read_bytes()).hexdigest()
    rows.append({'role':label,'source':str(source),'preserved':str(dest),'sha256':digest})
(HERE/'보존목록.json').write_text(json.dumps({'at':datetime.datetime.now().astimezone().isoformat(),'files':rows,'sourceFilesUnchanged':True,'committed':False,'pushed':False},ensure_ascii=False,indent=2),encoding='utf-8')

feedback=HERE/'디테일피드백.md'
feedback.write_text('''# 사용자 피드백: 화풍 변경 시 디자인 정체성 보존
사용자가 직접 지적한 오류: 그림체를 바꾸면서 칼 손잡이 같은 디테일까지 달라졌다. 화풍/선/색면/SD 비율 변경 허용을 장비 재디자인 허용으로 해석하지 않는다.
현재 1번은 그림체 방향 선택이며, 변화한 손잡이·가드·문양까지 승인된 것이 아니다. 4번은 예비, 기존 원본은 별도 보존. 금발전사를 이번에 무단 재생성하지 않는다.
발로르 적용: 승인된 원본의 폼멜/그립 색과 감김/가드 외곽/보석·검신/방패 외곽과 문장/가슴 사자/갑주 분할/망토 핀을 시각 목록으로 먼저 고정한다. 원본의 잘 안 보이는 부분은 미확인으로 표시하고 새 장식으로 채우지 않는다. 작은 SD 표현에서는 선 수를 줄일 수 있으나 고유 구조·문양·색 배치 변경은 오류다. 원본/생성본의 무기·방패·가슴 확대 대조를 제출한다. 내부 검사 미달이면 후보를 보존하고 승인 범위 안에서 수정한다.
''',encoding='utf-8')

# Main's own current reading evidence is distinct from the worker's later ACK/start.
link=json.loads((ROOT/'작업연결.json').read_text(encoding='utf-8-sig'))
applies={
 'AGENTS.md':'승인된 제작만 해당 분야에 위임하고 화면/게임을 임의 편집하지 않음. 정지 원화이므로 전투효과/모바일 구현은 제외.',
 '작업진행방법.md':'메인 자체 필독·사전확인 근거를 남기고 담당의 이번 작업 ACK/start를 별도 확인.',
 '규정A.md':'사용자 정정과 진행 원문·원본/예비 구분을 전문지시에 연결, 실질5종 기록 제출.',
 '메인운영규정.md':'같은 캐릭터 담당의 공식 Dispatch를 재사용하고 영수증 기록, 중복 편집 금지.',
 '팀장운영규정.md':'캐릭터 팀장이 결과/검수를 취합, 필요한 하위 업무에도 필독 전달, 사용자 최종 합격 유지.',
 '파일담당표.md':'새 캐릭터 output만 허용, 게임/UI/타팀 원본은 읽기전용.',
 '사용법.md':'new/set-readings/confirm/prepare/실제 sent/새 read-pack/start/returned를 구분.',
 '조직.json':'characters 팀장에게 외형 작업 위임, 기존 전문 부서를 임의 재편하지 않음.',
 'README.md':'세계관/캐릭터 자료 분류와 제작 담당 조직을 구분.',
 '트리.json':'세계관/캐릭터 소속으로 분류하고 원본 경로 유지.',
 '메인보고형식.md':'상태 목록과 마지막 실제 다음 행동, 송신과 수신·착수 구분.',
 '진행승인규칙.md':'이번 사용자 실제 진행을 해당 범위로만 기록, 과거 반려 작업 재개 승인으로 확대하지 않음.'}
ack={'role':'main01','kind':'main-self-read-before-dispatch','at':datetime.datetime.now().astimezone().isoformat(),'documents':[]}
for path in link['requiredReadings']:
    p=Path(path); ack['documents'].append({'path':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'applies':applies[p.name]})
(HERE/'메인필독확인.json').write_text(json.dumps(ack,ensure_ascii=False,indent=2),encoding='utf-8')

t=b.new('main01','characters','1번 그림체 발로르 정면 마스터·장비 디테일 보존',proof.read_text(encoding='utf-8'))
folder=b.folder(t['id']); out=W/'output/characters/gc9_balor'/('style1_front_'+t['id'].lower()+'_v001')
prompt=f'''# {t['id']} 차수1 / main01 → characters 팀장
실제 사용자 진행 승인: {proof}. 먼저 이 요청/정정/승인을 본문으로 읽는다. 1번 그림체로 발로르 작업을 개시한다. 이번 첫 납품은 **정면0도 기본입상 대기 마스터1장**이며, 정면 생성·내부 검수·비교 제출까지 수행한다. 불필요한 재승인 대기로 멈추지 않는다. 측면/애니메이션/게임 적용/전캐릭터 일괄변경은 이번 첫 납품에 포함하지 않는다.

## 보존 및 최신 사용자 판정
{HERE/'보존목록.json'}의 기존 원본 모델과4번 예비 모델은 서로 별개로 보존했다. 원본·예비·선택1번을 혼동하지 않는다. 기존10안/6장/승인SD신규2안과 타팀 발로르 작업은 이동/삭제/덮어쓰기하지 않는다. 기존 main03 발로르 SD3종은 반려·대기이며 화풍 마스터로 사용하지 않는다. 새로운 작업번호로 캐릭터 팀장 공간에서 작업하고 main03에 현재 작업 중인 것으로 임의 표시하지 않는다.

## 입력 역할: 혼합 금지
IDENTITY: 승인 발로르 {BALOR}. 실제 view_image로 열고 사용자 일단합격 기록 {S/'작업/MAIN03-20261109-21F94B82/사용자합격-v002.md'} 및 원본SHA를 대조한다.
STYLE: {IDLE/'variant-1-front.png'} 및 {OLD/'01_arknights/character.png'}. 실제 둘을 보고 1번의 명확한 외곽/각진 큰 색면/매트 셀채색/얼굴 가독성/큰 머리와 압축된 SD비율을 발로르에 적용한다. 금발·금발전사 얼굴·이중무기·청스카프·비대칭 부츠를 발로르에게 복제하지 않는다. 발로르 원화의 긴 인체를 그대로 줄인 축소판도 아니다. 이전 공통 신규2안ID6를 이번1번 스타일의 비율 대신 강제하지 않는다. 이번 사용자 선택이 우선이며 공통규정 전체를 임의 교체하지 않는다.

## 유지할 발로르 디자인
투구 없는 짧은 갈색머리/청회눈/다부진 남성기사, 청은갑옷, 층진 노출 견갑, 가슴의 측면 사자 전신 문장, 어깨 원형핀2개와 연결끈 없음, 청색 용문양 망토와 흰 안감. 오른손검/왼손 은색 카이트실드, 검은 날개/십자 방패 문장. 기본입상·양발지지·차분한 평상시 표정, 무기 자연스럽게 내려든 자세. 오른손검/왼방패의 인체좌우 유지.
**검의 파란 감긴 그립·끝 폼멜·은색 날개형 가드·중앙 붉은 마름모 보석, 검신 외곽을 원본과 대조한다.** SD로 단순화할 수 있지만 손잡이를 다른 손잡이로 바꾸는 재디자인은 금지. 방패외곽/중앙십자와 검은 날개/가슴사자/망토핀·장식도 동일하게 대조한다. 원본 시각목록을 먼저 문서로 만들고 미확인·가림은 추정확정하지 않는다. 방패를 이유없이 줄여 새 장식 노출을 만들지 않는다.
필독 사용자 오류 피드백 {feedback}. 칼 손잡이 변경은 화풍 차이가 아닌 정체성 보존 오류로 취급하고 제작기준/검수에 반영한다. 기존 금발전사의 오류를 이번 범위에서 무단 재생성하지 않는다.

## 실제 공정과 검수
자동 발송지시 read-pack으로 자기 AGENTS/작업방법/공통·분야/추가필독을 본문 열람 → 작업별 적용요약/해시 ACK → 이번 차수 characters start 통과 → 생성. 이전 ACK 재사용/목록만 복사 금지. 이미지 생성은 imagegen/generate2dsprite 스킬을 읽고 내장 생성도구로 실제 참조 첨부. 사용자 지정 기본 gpt-6.1-sol/medium 유지. 임의 유료 API/모델전환 없음. 필요한 하위 담당에는 원작업/차수/필독/자기방법/편집범위를 전달하고 읽기 확인을 취합한다.
원본 PNG 바이트를 보존하는 새 투명 전신 front.png, 밝고 어두운 전체 비교, 원본 디자인과 1번 참조/신규작품 비교, 얼굴/그립/가드/문장 확대 대조, 57/72CSSpx 표시를 제작해 직접 열어 확인한다. 실제 발선/bodyHeight/footX/Y·원본해상도·알파·SHA·입력역할/생성프롬프트를 기록한다. 손가락/손잡이 연결, 무기수, 좌우, 고유형태·문장·색, 원본과 다른 디테일을 체크리스트로 일대일 판정한다. 미달은 후보와 원인을 보존하고 승인 범위 안에서 내부 보완한다. 밝은 배경에서도 저알파 외곽/잘림/여백을 확인한다. 작은 표시를 실게임 검증이라고 하지 않는다.
새 출력 {out} 및 이번 작업기록만 편집. 기존 작품/공통규정/게임/UI/다른 메인 작업은 변경하지 않는다. 원본시트 분해/리샘플링/비균일변형/자동알파정리를 하지 않는다. 정지1장 요청이며 영상·이펙트 없음. 화면/탭/패널/모델설정 조작, 자동저장/커밋/푸시 금지.
index.html/front.png/comparison.png/identity-detail-comparison.png/asset-manifest.json/generation-records.json/제작기준.md/검수.md/report.md를 제출한다. 원작업5종 기록은 안내문 템플릿 그대로 남기지 말고 실제 변경·검증·미실행·정의·로컬/원격 상태를 채운다. report는 제작/검수/사용자합격/게임통합을 분리하고 남은 한계 명시. 완료 시 worker_done으로 main01에 실제 경로와 ACK/검수 증거를 회신한다. 추가 미적 승인 대기를 내부 정면 생성 전 새로 만들지 않는다.
'''
for name,text in [('요청확인.md',proof.read_text(encoding='utf-8')),('전문프롬프트.md',prompt),('2_사전확인.md',pre.read_text(encoding='utf-8')),('1_대화기록.md',proof.read_text(encoding='utf-8')),('3_작업일지.md','진행 승인 수신 후 규정/원본/충돌 확인. 보존모델 사본과SHA 대조, 메인 자체 필독 확인 작성. 발송은 실제 영수증 기록으로 구분. 담당은 이후 생성/검수 내역을 추가한다.\n'),('4_정의문서.md','확정: 기존 원본과4번 예비별도보존,1번화풍,발로르 승인디자인 유지,장비 디테일 변경 오류. 이번 첫 납품: 정면마스터1장. 측면/게임통합/공통규정교체 제외.\n'),('5_버전관리.md','characters 기존 미커밋/원본 유지. 신규 작업 output만 추가. 원본/4번 보존 경로와SHA는 보존목록.json. 로컬 파일 작성이며 커밋·푸시 없음.\n')]:
    (folder/name).write_text(text,encoding='utf-8')
readings=[proof,pre,feedback,HERE/'보존목록.json',S/'진행승인규칙.md',S/'저장운영규정.md',S/'작업/MAIN03-20261109-21F94B82/사용자합격-v002.md',W/'문서/02_세부기획/02_영웅/한손무기그립기준.md',IDLE/'report.md',IDLE/'검수.md']
b.set_readings(t['id'],'main01',[str(p) for p in readings]); b.confirm(t['id'],'main01','진행',proof); plan=b.prepare(t['id'],'main01')
(HERE/'연결.json').write_text(json.dumps({'task':t['id'],'iteration':1,'folder':str(folder),'output':str(out),'plan':plan},ensure_ascii=False,indent=2),encoding='utf-8')
r=subprocess.run([EXE,'orchestration','send','--to','dispatch:ctx_eb4e8799e6f3','--subject','진행 승인: 발로르 1번 그림체 정면 마스터·원본/4번 보존·장비 디테일 피드백','--type','dispatch','--body',Path(plan['prompt']).read_text(encoding='utf-8'),'--json'],capture_output=True,text=True,encoding='utf-8')
receipt.write_text(r.stdout,encoding='utf-8'); print(r.stdout,flush=True)
if r.returncode or not json.loads(r.stdout).get('ok'): raise SystemExit('Inspect delivery receipt; no blind retry.')
b.record(t['id'],'main01','sent',receipt)
print(json.dumps({'task':t['id'],'preservedFiles':len(rows),'sourceBalorSha':hashlib.sha256(BALOR.read_bytes()).hexdigest(),'sent':True,'workerStartNotYetVerified':True},ensure_ascii=False),flush=True)
