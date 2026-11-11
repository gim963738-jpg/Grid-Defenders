from pathlib import Path
import hashlib,importlib.util,json,shutil
H=Path(__file__).resolve().parent;R=H.parents[2];S=R/'작업관리';policy=S/'단일메인운영규정.md'
if (H/'운영통합결과.json').exists():raise SystemExit('Already migrated; inspect before repeating.')
for role in ['main02','main03']:
 assert (H/(role+'-인수인계.md')).is_file()
 assert json.loads((H/(role+'-인수검증.json')).read_text(encoding='utf-8'))['shaVerified']
assert not json.loads((S/'상태/브랜치잠금.json').read_text(encoding='utf-8'))
before=H/'운영변경전';changed=[]
def backup(p):
 name=('root/'+str(p.relative_to(R))) if p.is_relative_to(R) else ('external/'+str(p).replace(':','').replace('\\','/'))
 q=before/name;q.parent.mkdir(parents=True,exist_ok=True)
 if p.exists() and not q.exists():shutil.copy2(p,q)
def write(p,text):
 backup(p);p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text,encoding='utf-8');changed.append(str(p))
def put(p,j):write(p,json.dumps(j,ensure_ascii=False,indent=2)+'\n')
def add_reading(j):
 readings=j.setdefault('requiredReadings',[])
 if str(policy) not in readings:readings.append(str(policy))
spec=importlib.util.spec_from_file_location('board',S/'도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(S)
for t in b.listing():assert t['status'] not in {'in_progress','prepared','delivery_receipt_recorded'},t['id']
registry=json.loads((S/'메인목록.json').read_text(encoding='utf-8'))
retired=registry.setdefault('retiredMains',{})
for role in ['main02','main03']:
 item=registry['mains'].pop(role);item.update(active=False,status='retired',successor='main01',retirementEvidence=str(H/'사용자지시.md'),archivePath=str(R/'자료/메인인수/20261111'/role/'파일'));retired[role]=item
registry['mains']['main01'].update(active=True,status='active');add_reading(registry['mains']['main01']);registry.update(activeMainIds=['main01'],operatingMode='single-main',policy=str(policy));put(S/'메인목록.json',registry)
org=json.loads((S/'조직.json').read_text(encoding='utf-8'));old=org.setdefault('retiredNodes',{})
for role in ['main02','main03']:
 item=org['nodes'].pop(role);item.update(active=False,status='retired',successor='main01');old[role]=item
org.update(version='2.1.0',activeMainIds=['main01'],operatingMode='single-main',retirementEvidence=str(H/'사용자지시.md'));put(S/'조직.json',org)
branches=json.loads((S/'브랜치목록.json').read_text(encoding='utf-8'));branches.update(coordinator='main01',operatingMode='single-main')
active_paths=[R]
for role,item in branches['branches'].items():
 add_reading(item);active_paths.append(Path(item['path']))
put(S/'브랜치목록.json',branches)
banner='<!-- GRID-SINGLE-MAIN-20261111 -->\n# 단일 메인 운영 (사용자 요청, 2026-11-11)\n활성 총괄은 main01 한 곳이다. main02·main03는 자료 인수 후 폐지한다. 과거 다중 메인 설명보다 공유 원본 `C:/Users/user/Desktop/Grid Defenders/작업관리/단일메인운영규정.md`가 우선하며 매 작업에 본문을 읽는다. 기존 분야 팀장·원본·사용자 승인/반려는 유지하고 다음 작업의 요청/회신은 main01로 연결한다. 사용자 진행 및 작업별2.6 허가, 필독/착수, 저장 요청 전 Git 금지 기준을 유지한다.\n<!-- /GRID-SINGLE-MAIN-20261111 -->\n\n'
for workspace in active_paths:
 agents=workspace/'AGENTS.md'
 if agents.is_file():
  text=agents.read_text(encoding='utf-8-sig')
  if '<!-- GRID-SINGLE-MAIN-20261111 -->' not in text:write(agents,banner+text)
 link=workspace/'작업연결.json'
 if link.is_file():
  j=json.loads(link.read_text(encoding='utf-8-sig'));add_reading(j);j.update(coordinatorRole='main01',operatingMode='single-main');put(link,j)
govern='> 현재 운영: [단일 메인 운영](단일메인운영규정.md). 2026-11-11부터 main01 한 곳만 활성 메인이며 main02·03는 인수 후 폐지한다. 아래 과거 다중 메인 설명과 충돌하면 이 기준을 우선한다.\n\n'
for name in ['규정A.md','메인운영규정.md','팀장운영규정.md','메인보고형식.md','진행승인규칙.md','저장운영규정.md','이미지2.6사용규칙.md']:
 p=S/name;text=p.read_text(encoding='utf-8-sig')
 if name=='규정A.md':text=text.replace('1. 메인은 현재 대화 포함3개이며 서로 같은 권한으로 요청·분석·기획·실제 시안 제작·비교·선택 지원·지시·검수를 담당한다.','1. 활성 메인은 main01 한 곳이며 요청·분석·기획·실제 시안 제작·비교·선택 지원·지시·검수를 담당한다.').replace('v2.1.0','v2.2.0',1)
 if name=='메인운영규정.md':text=text.replace('담당 메인은 메인01·02·03 중 요청을 받은 창이다. 모든 메인은','담당 메인은 main01이다. main01은').replace('## 3개 메인의 충돌 방지','## 작업 간 충돌 방지').replace('메인3개는 [세계관 트리]','메인01은 [세계관 트리]')
 if name=='팀장운영규정.md':text=text.replace('메인02/03도 기존처럼 요청 접수·기획·시안·전문지시·검수를 맡는다.','메인02/03 역할은 폐지하고 main01이 요청 접수·기획·시안·전문지시·검수를 맡는다.').replace('세 메인은 같은 공유 작업대장을 읽는다.','모든 담당은 같은 공유 작업대장을 읽는다.')
 if name=='이미지2.6사용규칙.md':text=text.replace('C:/Users/user/orca/workspaces/Grid Defenders/메인02/메인작업/main02/model-restriction-20261111/사용자지시.md',str(R/'자료/메인인수/20261111/main02/파일/메인작업/main02/model-restriction-20261111/사용자지시.md').replace('\\','/'))
 write(p,govern+text)
method=S/'기준/main01/작업진행방법.md';write(method,'> 2026-11-11 현재 단일 총괄 main01. [단일 메인 운영](../../단일메인운영규정.md)을 매 작업 필독한다. 다른 메인으로 지시/회신을 분산하지 않는다.\n\n'+method.read_text(encoding='utf-8-sig'))
transferred=[]
proof={'path':str(H/'사용자지시.md'),'sha256':hashlib.sha256((H/'사용자지시.md').read_bytes()).hexdigest()}
with b.writer():
 for p in sorted((S/'작업').glob('*/task.json')):
  t=json.loads(p.read_text(encoding='utf-8'))
  if t.get('main') not in {'main02','main03'}:continue
  backup(p);old_owner=t['main'];old_status=t['status'];old_iteration=t['iteration'];t.setdefault('originalMain',old_owner);t['main']='main01'
  t.setdefault('history',[]).append({'action':'transfer','at':m.now(),'from':old_owner,'to':'main01','iteration':t['iteration'],'evidence':proof,'note':'단일 메인 전환에 따른 담당 이관. 작업번호/차수/상태/사용자판정·이전 승인근거 보존. 새 제작 발송 없음.'})
  t['handover']={'from':old_owner,'to':'main01','evidence':proof,'requiresCurrentRequestReview':True};b.save(t);assert t['status']==old_status and t['iteration']==old_iteration
  transferred.append({'task':t['id'],'from':old_owner,'to':'main01','status':old_status,'iteration':old_iteration,'title':t['title']})
readme='''# Grid Defenders 작업관리 — 단일 메인

현재 활성 총괄은 **main01 한 곳**입니다. 사용자 요청/기획/시안/이해 확인/팀장 하달/검수/통합을 main01이 맡습니다. [단일 메인 운영](단일메인운영규정.md), [규정 A](규정A.md), [팀장 운영](팀장운영규정.md)을 따릅니다.

기존 캐릭터·몬스터·아이템·UI·이펙트·게임개발 팀장, 독립 테스터와 전문/자료 작업 공간은 유지합니다. 자료 분류는 [세계관 트리](도메인/README.md), 실제 담당은 [조직 안내](조직안내.md), 경로는 브랜치목록.json입니다.

메인02·03 자료는 `자료/메인인수/20261111/`에 기존 경로·바이트·버전 이력으로 인수했습니다. [인수 색인](../자료/메인인수/20261111/README.md)과 `메인작업/main01/single-main-20261111/` 기록을 확인하세요. 폐기작품과 사용자 평가 대기는 합격으로 바꾸지 않습니다. 원작업번호와 승인/반려는 보존하고 담당만 main01로 이관합니다.

새 제작은 이해 확인과 명시적인 진행 후 담당에게 전달합니다. 담당은 새 작업 필독/ACK/start를 통과합니다. 2.6은 작업별 허가가 필요하고, 결과 제작·기술검증·사용자 합격·게임 반영·Git 저장을 구분합니다. Git 커밋/푸시는 사용자 저장 요청 때만 수행합니다.

과거 OPS-001~005 기록과 규정 변경 전 사본은 보존합니다. 그 자료에 있는 다중 메인 설명은 현재 운영 기준이 아닙니다.
'''
write(S/'README.md',readme)
write(S/'조직안내.md','''# 현재 AI 조직 — main01 단일 총괄

2026-11-11 사용자 요청으로 main02·main03 역할을 폐지하고 자료와 담당작업을 main01로 인수합니다. [단일 메인 운영](단일메인운영규정.md)이 현재 기준입니다.

```text
총괄 디렉터 main01
├─ 캐릭터 팀장
├─ 몬스터 팀장
├─ 아이템·경제 팀장
├─ UI 팀장
├─ 이펙트·제작도구 팀장
├─ 게임개발 팀장
└─ 독립 테스터
```

자료의 세계관/캐릭터/몬스터 계층과 실제 제작 책임은 구분합니다. 기존 전문/자료 공간과 필요시 하위 에이전트 운영은 유지합니다. 새 본부/서버·결제·라이브 운영 조직은 만들지 않습니다.

main02·03의 원본·변경·미완료와 사용자 승인/반려는 인수 자료와 원작업 이력에 남습니다. 두 메인 전용 Orca 공간만 자료 검증 후 제거하며 분야 팀장은 같이 종료하지 않습니다. 과거 조직 안내의 변경 전 사본과 OPS 기록은 보존합니다.
''')
write(R/'자료/메인인수/20261111/README.md','''# 메인02·03 인수 자료

2026-11-11 사용자 요청으로 main01에 인수했습니다. main02/파일 및 main03/파일 안에 원래 상대경로·파일 바이트를 유지합니다. 원래 브랜치·커밋/인덱스/패치는 별도 복구 자료로 보존합니다. 자동 Git 저장은 하지 않았습니다.

- main02: UI 차수11, 흰 검격/지면타격 이력, 금발 전사 모션 연결·히트스탑, 발로르 최신 스킬 문서 수정 기록.
- main03: 터틀드래곤 v05 선택조합·v06 모션·v07 이동거리/필드진동, 외부AI 전달 묶음, 기존 캐릭터 시안/판정 이력.
- 여성 레이피어 전사 silver-ponytail-rapier v01~v03는 사용자 전체 폐기 이력입니다. 새로 요청한 레나와 혼동하거나 승인 참조로 재사용하지 않습니다.
- 과거 awaiting_user/confirmed는 자동합격/자동제작하지 않습니다. 상세 인수인계와 작업별 소유권/상태는 메인작업/main01/single-main-20261111을 참고하세요.

기존 경로 연결은 파일 참조를 살리기 위한 것이며 main02·03 AI 운영을 유지한다는 뜻이 아닙니다. 카탈로그/게임코드를 이 인수 사본으로 덮어쓰지 않습니다.
''')
result={'activeMainIds':['main01'],'retiredMainIds':['main02','main03'],'transferredTasks':transferred,'transferredTaskCount':len(transferred),'activeInstructionPaths':len(active_paths),'changedFiles':changed,'userProof':proof,'gitCommitPush':False}
(H/'운영통합결과.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'activeMainIds':['main01'],'transferredTasks':len(transferred),'activeInstructionPaths':len(active_paths),'changedFiles':len(changed)},ensure_ascii=False))
