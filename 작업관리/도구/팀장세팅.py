"""OPS-003 migration. Official Orca CLI only; preserve existing work and receipts."""
from pathlib import Path
from datetime import datetime
import json, subprocess, shutil, hashlib, sys

ROOT=Path(__file__).resolve().parents[2]
SHARED=ROOT/'작업관리'
REC=SHARED/'기록/OPS-003'
ORCA='C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe'
REPO='de86d10c-8e2c-444d-8b0f-43b772894ad9'
def read(p):return json.loads(p.read_text(encoding='utf-8'))
def write(p,s):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(s,encoding='utf-8',newline='\n')
def dump(p,v):write(p,json.dumps(v,ensure_ascii=False,indent=2)+'\n')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def cli(*args):
 r=subprocess.run([ORCA,*args,'--json'],cwd=ROOT,capture_output=True,text=True,encoding='utf-8')
 try:v=json.loads(r.stdout)
 except Exception:raise RuntimeError('Inspect response before any retry: '+r.stdout+r.stderr)
 if r.returncode or not v.get('ok',True):raise RuntimeError(json.dumps(v,ensure_ascii=False))
 return v
def live():return [w for w in cli('worktree','ps')['result']['worktrees'] if w['repoId']==REPO]
def git(p,*a):return subprocess.check_output(['git',*a],cwd=p).decode('utf-8').strip()
def snapshot():
 if (REC/'before.json').exists():raise RuntimeError('Snapshot already exists; do not overwrite')
 if (SHARED/'상태/writer.lock').exists():raise RuntimeError('Shared state writer is active')
 backup=Path('C:/Users/user/orca/backups/Grid Defenders')/datetime.now().strftime('team-setup-%Y%m%d-%H%M%S')
 shutil.copytree(SHARED,backup/'shared',ignore=shutil.ignore_patterns('__pycache__'))
 state=live();files=[];protected=[]
 for w in state:
  p=Path(w['path']);w['headBefore']=git(p,'rev-parse','HEAD');w['gitStatusBefore']=git(p,'status','--porcelain=v1','--untracked-files=all')
  for rel in ['AGENTS.md','작업연결.json']:
   src=p/rel
   if src.exists():
    dest=backup/'workspaces'/p.name/rel;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dest)
    files.append({'path':str(src),'backup':str(dest),'sha256':sha(src)})
  # Code/prototype content is the material risk of preparing new game workspaces.
  if p==ROOT or p.name=='UI-전투화면':
   for folder in ['게임/src','게임/tests','게임/public']:
    for f in (p/folder).rglob('*'):
     if f.is_file():protected.append({'path':str(f),'sha256':sha(f)})
 for rel in ['README.md','task.md','문서/05_프로젝트정의/현재구현현황.md']:
  src=ROOT/rel
  if src.exists():
   dest=backup/'root'/rel;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dest)
 value={'at':datetime.now().astimezone().isoformat(),'backup':str(backup),'workspaces':state,'files':files,'protected':protected,'registry':read(SHARED/'브랜치목록.json'),'mains':read(SHARED/'메인목록.json')}
 dump(REC/'before.json',value);dump(backup/'before.json',value)
 print(json.dumps({'backup':str(backup),'workspaces':len(state),'protectedFiles':len(protected)},ensure_ascii=False))
 for w in state:
  print(json.dumps({'workspace':w['displayName'],'path':w['path'],'agents':[{'handle':a['paneKey'].split(':')[0],'state':a['state'],'lastMessage':a.get('lastAssistantMessage','')} for a in w.get('agents',[])]},ensure_ascii=False))

TEAMS={
 'characters':('캐릭터 팀장 AI','영웅·병사 외형, 능력치·스킬 명세, 캐릭터 외주 요청과 결과 관리'),
 'monsters':('몬스터 팀장 AI','일반·방어형·네임드·보스 외형과 동작·기믹 명세, 몬스터 외주 요청과 결과 관리'),
 'items':('아이템·경제 팀장 AI','장비 이미지·그리드 모양·조합식·효과·경제 명세. 사용자 미확정 수치를 임의 확정하지 않는다'),
 'ui':('UI 팀장 AI','로비·전투·상점·영웅·진형 화면과 조작, 공통 모바일 크기와 시안'),
 'effects':('이펙트·제작도구 팀장 AI','기존 공방·재료함·편집기와 캐릭터/몬스터 공용 이펙트 제작'),
 'gameplay':('게임개발 팀장 AI','전투·웨이브·보스·진형·장비 판정·로컬 저장·성장/보상 연결과 승인된 작품의 게임 적용'),
 'qa':('독립 테스터 AI','재현 가능한 기능·화면·자산·모바일 검증과 오류 보고. 제작팀과 분리, 사용자 합격을 대신하지 않는다')}
OWNERS={'world':'main01','characters':'characters','monsters':'monsters','items':'items','ui':'ui','effects':'effects','sprites':'characters','splash':'characters','video':'characters','monster_sprites':'monsters','character_stats':'characters','character_skills':'characters','gameplay':'gameplay','qa':'qa'}
def create():
 cat=read(SHARED/'브랜치목록.json');main=read(SHARED/'메인목록.json')['mains']['main01']
 for role,name in [('gameplay','게임개발'),('qa','테스터')]:
  receipt=REC/'영수증'/f'{role}-create.json'
  if role in cat['branches']:continue
  ref='team/'+role
  if receipt.exists():v=read(receipt)
  else:
   if any(w['branch'].removeprefix('refs/heads/')==ref for w in live()):raise RuntimeError('Unreceipted workspace exists; inspect: '+ref)
   v=cli('worktree','create','--repo','id:'+REPO,'--name',name,'--branch',ref,'--base-branch','main','--parent-worktree','id:'+main['worktreeId'],'--setup','skip');dump(receipt,v)
  w=v['result']['worktree'];cat['branches'][role]={'id':role,'name':TEAMS[role][0],'path':w['path'],'gitBranch':w['branch'].removeprefix('refs/heads/'),'worktreeId':w['id'],'selector':'id:'+w['id'],'rules':f'기준/{role}/규정.md','ruleVersion':'2.0.0','agent':None,'kind':'tester' if role=='qa' else 'team-lead','agentStarted':False}
  cat['expectedRoleCount']=len(cat['branches']);dump(SHARED/'브랜치목록.json',cat)
  print('Created '+role,flush=True)
def baseline():
 cat=read(SHARED/'브랜치목록.json');src=Path(cat['branches']['ui']['path'])/'게임'
 for role in ['gameplay','qa']:
  manifest=REC/f'{role}-baseline.json'
  if manifest.exists():continue
  dst=Path(cat['branches'][role]['path'])/'게임';files=[]
  for f in src.rglob('*'):
   rel=f.relative_to(src)
   if not f.is_file() or any(x in {'node_modules','dist','.git','.cache','.vite'} for x in rel.parts) or f.name.startswith('.env') or f.suffix in {'.log','.tsbuildinfo'}:continue
   target=dst/rel;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(f,target)
   files.append({'path':rel.as_posix(),'sha256':sha(f)})
  dump(manifest,{'source':str(src),'destination':str(dst),'at':datetime.now().astimezone().isoformat(),'files':files,'purpose':'Current uncommitted prototype snapshot, not a new feature or a merge'})
  print(json.dumps({'baseline':role,'files':len(files)},ensure_ascii=False),flush=True)

POLICY='''# 팀장 운영 규정 — v2.0.0 / OPS-003

사용자 승인: 2026-11-09 “그럼 지금구성 세팅먼저 진행해줄래”. 이번 세팅 이후 신규 제작 요청은 별도로 확인한다. 본 문서는 규정A의 팀장 운영 확정 부분이며 상충하는 과거 조직 설명에 우선한다.

## 책임과 요청
사용자가 게임 방향·수치·최종 합격 및 재생 속도를 결정한다. 메인01은 조직·통합을 총괄하며 메인02/03도 기존처럼 요청 접수·기획·시안·전문지시·검수를 맡는다. 작업별 담당 메인은 한 명이며 다른 메인의 확인을 반복해서 받지 않는다. 세 메인은 같은 공유 작업대장을 읽는다.
총괄/담당 메인은 최초·수정 제작 지시 전 이해한 내용의 사용자 확인을 받는다. 팀장은 확인된 작업을 직접 수행하거나 필요한 하위 에이전트·외부 서비스를 사용한다. 결과물은 담당 팀장 창에서 볼 수 있게 모으고, 사용자 피드백은 담당 메인이 이해를 확인해 수정 지시로 전달한다.
고정 실행 담당은 현재 6개 팀장과 독립 테스터다. 본부·파트장 AI를 추가로 상설화하지 않는다. 새 부서가 필요하면 근거·책임·기존 담당과의 경계를 설명하고 신설한다. 게임 서버·결제·라이브 운영은 범위 밖이다.

## 하위 작업과 실제 위임
기존 일러스트·동작·영상 작업은 원본/대화/규정을 보존한 전문 작업으로 연결한다. 세계관·몬스터 스프라이트·캐릭터 능력치/스킬의 준비 공간에 실제 AI가 없는 경우, 작업 없이 AI부터 만들지 않는다.
팀장이 하위 에이전트가 필요하다고 판단하면 승인된 원작업 범위 안에서 목적·입출력·담당 파일·검수 기준·상위 팀장·원작업 번호를 기록하고 생성한다. 이 세분화 자체로 사용자에게 같은 제작 허락을 다시 요구하지 않는다. 범위·디자인 의도가 바뀌면 담당 메인에게 돌려 사용자 이해 확인을 받는다.
Orca의 독립 작업 공간/지속 채팅이 필요하면 공식 orca-cli/orchestration 지침을 따른다. 작업 공간은 공식 worktree create/worker-start로 만들며 별도 편집자와 공유 파일을 중복 소유하지 않는다. 새 담당도 작업연결.json, AGENTS 연결, 분야 규정, 원본과 승인 근거를 제공한다. 감독 작업은 worker-start 후 공식 회신 절차를 따른다. 단순 역할 안내·지속 채팅은 감독 작업으로 위장하지 않는다.
하위 작업은 원작업의 담당 메인과 사용자 확인 근거를 유지한다. 팀장은 산출물·검증·규정 보완을 취합하며 하위 AI의 완료 문구만으로 합격 처리하지 않는다. 하위 위임 기록은 양식/하위위임.md를 사용하고 작업대장 원작업에서 연결한다.

## 외주와 완성 작품
외부 제작 요청·결과 수령은 담당 팀장 책임이다. AetherForgeAI 등 서비스·모델·입력 원본·프롬프트·설정·결과 파일·사용량을 작업에 기록한다. 외주 완성 시트는 원본 그대로 보존한다. 시트 자동 분해·재조립·배경 제거·재생성은 기본 단계가 아니다. 사용 가능한 완성 시트는 그대로 게임에서 읽고 지정 위치·사용자가 결정한 속도로 표시한다. 새 미승인 모델로 임의 전환하지 않는다.
계정·키는 채팅/소스에 기록하지 않고 이미 승인된 연결 경로를 사용한다. 이번 세팅에서는 외부 계정 연결·유료 생성·프레임 변환을 실행하지 않는다. 기존 캐릭터 작업의 Sunburst 연결 도구는 보존하되 도구 구현과 실제 생성 성공을 구분한다.

## 파일 책임과 검증
콘텐츠팀은 원본·명세, 게임개발팀은 공통 게임 실행 코드, UI팀은 화면·입력, 이펙트팀은 공방·효과 제작을 맡는다. 파일담당표.md를 따른다. 같은 파일은 한 작업에서 한 담당만 편집한다. 작업대장의 브랜치 잠금만으로 서로 다른 브랜치의 같은 파일 충돌이 방지되는 것은 아니다.
게임개발/테스터의 초기 게임은 OPS-003 baseline manifest의 UI 사본이다. 이후 테스트 시 검사 대상 커밋/파일 해시와 출처를 기록하고 최신이라고 가정하지 않는다. 원본 작업이 진행 중이면 해당 범위가 확정된 사본에서 검사한다.
테스터는 제작팀 밖에서 재현 순서·기대/실제 결과·증거·검사한 버전을 보고한다. 제작 원본을 고치거나 미적 합격·재생 속도를 대신 결정하지 않는다. 모델 검사·브라우저 검사·실기기 검사 범위를 구분한다. 수정은 담당 제작팀으로 돌리고 결과가 바뀐 부분을 재검증한다.
사용자 피드백으로 결과와 작업 기준을 함께 다듬는다. 확정된 변경만 활성 규정으로 승격하고 버전·근거를 남긴다. 현재 배치와 자료 분류는 조직.json과 도메인/트리.json에서 각각 관리한다.
'''
def configure():
 if (REC/'configured.json').exists():raise RuntimeError('Already configured; do not repeat migration')
 cat=read(SHARED/'브랜치목록.json');branches=cat['branches'];mains=read(SHARED/'메인목록.json');tree=read(SHARED/'도메인/트리.json');nodes={}
 write(SHARED/'팀장운영규정.md',POLICY)
 write(SHARED/'파일담당표.md','''# 파일 담당과 통합 경계

|담당|기본 책임|연결 경계|
|---|---|---|
|캐릭터|캐릭터 원본·설정·능력치/스킬 명세·일러스트·동작|공통 런타임 반영은 게임개발|
|몬스터|몬스터/보스 원본·개체 기믹 명세·동작|이동/판정 공통 코드는 게임개발|
|아이템|장비 원본·모양·조합/가격/효과 명세·아이템 시안|실제 재화 차감/조합/효과는 게임개발|
|게임개발|defense.ts, defenseConfig.ts, bossBattle.ts, gameRun.ts, main.ts, battleSave.ts, battleFormation.ts, training.ts, campProgress.ts, 아트 로더, 실제 길 경로|UI와 함께 쓰는 파일은 작업별 편집자 한 명 지정|
|UI|mobile-ui.css, 화면 CSS·패널·입력, landscape-entry.ts의 표시·입력|전투 수치/판정 변경은 게임개발과 연결|
|이펙트·제작도구|effect-workshop 및 효과 공방·재료함·완성 연출|실게임 스킬 적용은 게임개발|
|테스터|독립 검증 사본·재현 보고·검사 코드|제품 원본 수정과 사용자 합격 결정 금지|

landscape-entry.ts, landscape-inventory.ts, landscapeField.ts처럼 표시·판정이 만나는 파일은 작업 등록 시 편집 담당 한 명과 허용 범위를 기록한다. 브랜치 잠금은 브랜치 단위이므로 담당 메인이 파일 소유권까지 확인한다. 타 팀은 필요한 변경을 명세/검토 가능한 패치로 전달한다. 원본의 미커밋 구현을 통째로 자동 병합하지 않는다.
''')
 write(SHARED/'양식/하위위임.md','''# 하위 작업 위임
원작업 번호 / 담당 메인 / 담당 팀장 / 실행 하위 역할:
사용자 확인 근거 및 허용된 원작업 범위:
목표·입력 원본·적용 규정과 버전:
편집 허용 파일·공통 파일 담당·병행 충돌 확인:
산출물·검사·회신 위치:
실제 공간·Task/Dispatch 또는 채팅 핸들·송신 영수증:
완료/미완료/사용자 판정·기준 보완:
''')
 for role,row in {**mains['mains'],**branches}.items():
  if role.startswith('main'):
   parent=None;display='총괄 디렉터 AI · 메인01' if role=='main01' else f'메인{role[-2:]} · 기획·시안·지시';kind='director' if role=='main01' else 'main';owner=role
  else:
   owner=OWNERS[role];kind='tester' if role=='qa' else 'team-lead' if role in TEAMS else 'domain-index' if role=='world' else 'specialist'
   parent=tree['nodes'].get(role,{}).get('parent')
   if role in {'world','items','ui','effects','gameplay','qa'}:parent='main01'
   display=TEAMS[role][0] if role in TEAMS else '세계관 · 자료 분류' if role=='world' else row['name']+' · 전문 작업'
  nodes[role]={'role':role,'name':display,'kind':kind,'parent':parent,'teamOwner':owner,'worktreeId':row['worktreeId'],'path':row['path']}
  row.update(organizationRole=kind,teamOwner=owner,organizationParent=parent,displayName=display)
  pointer=Path(row['path'])/'작업연결.json';v=read(pointer) if pointer.exists() else {'schemaVersion':1,'role':role,'coordinatorRoot':str(ROOT),'sharedRoot':str(SHARED)}
  v.update(organization=str(SHARED/'조직.json'),teamRules=str(SHARED/'팀장운영규정.md'),ruleVersion='A-2.0.0',teamOwner=owner,organizationRole=kind)
  dump(pointer,v)
  ag=Path(row['path'])/'AGENTS.md';old=ag.read_bytes() if ag.exists() else b''
  extra=f'''\n\n<!-- GRID-TEAM-OPS003-BEGIN -->
# OPS-003 팀장 운영 (사용자 승인, 2026-11-09)
현재 역할: {display}, 역할 ID `{role}`, 책임 담당 `{owner}`. 공유 원본 `{SHARED}`의 `팀장운영규정.md`, `조직.json`, `파일담당표.md`와 자기 분야 규정을 매 작업에 확인한다. 조직 배치는 도메인 자료 분류와 별개이며 최신 팀장 규정이 과거 역할 설명에 우선한다.
팀장은 확인된 요청 범위에서 직접 작업/필요한 하위 에이전트/외부 제작 서비스를 사용한다. 기존 전문 작업·미커밋 원본·사용자 판정을 보존한다. 하위 작업도 같은 규정과 원작업 확인 근거를 이어받는다. 외주 완성 시트를 자동으로 분해·재조립하지 않는다. 사용자에게 재생 속도·최종 합격 결정권이 있다. 테스터는 제작팀과 분리되어 검사하고 수정은 담당팀에 돌린다. 이번 운영 세팅 자체가 새 콘텐츠 제작 승인은 아니다.
<!-- GRID-TEAM-OPS003-END -->
'''
  if b'GRID-TEAM-OPS003-BEGIN' in old:raise RuntimeError('Duplicate connector: '+role)
  ag.write_bytes(old+extra.encode('utf-8'))
  if role in branches:
   rule=SHARED/row['rules'];oldrule=rule.read_text(encoding='utf-8') if rule.exists() else f'# {display} 작업 기준\n'
   note=TEAMS.get(role,(None,'기존 전문 작업·색인 유지. 담당 팀장의 확인된 요청으로 작업하며 해당 작품별 기준을 보존한다.'))[1]
   write(rule,oldrule+'\n\n## OPS-003 현재 역할 — v2.0.0\n\n'+note+'\n\n공통 [팀장 운영 규정](../../팀장운영규정.md)과 [파일 담당표](../../파일담당표.md)를 따른다. 실제 보고 담당은 `'+owner+'`다. 완성 외주 시트의 불필요한 재가공은 제외하고 사용자 결정 재생 속도를 따른다.\n')
   row['ruleVersion']='2.0.0'
 org={'schemaVersion':1,'version':'2.0.0','at':datetime.now().astimezone().isoformat(),'director':'main01','teamLeads':[r for r in TEAMS if r!='qa'],'independentTester':'qa','nodes':nodes,'domainTree':'도메인/트리.json','newWorkspaces':['gameplay','qa'],'externalAccounts':'not_changed_by_OPS003'}
 dump(SHARED/'조직.json',org);cat.update(ruleVersion='A-2.0.0',organizationFile='조직.json',organizationVersion='2.0.0');dump(SHARED/'브랜치목록.json',cat);dump(SHARED/'메인목록.json',mains)
 for file in ['규정A.md','메인운영규정.md','README.md','규정변경이력.md','프로젝트빠른이해.md']:
  p=SHARED/file;old=p.read_text(encoding='utf-8')
  if file=='규정A.md':old=old.replace('# 공통 작업 규정 A — v1.1.0','# 공통 작업 규정 A — v2.0.0',1)
  write(p,old+'\n\n## OPS-003 팀장 체계 적용 — 2026-11-09\n\n현재 조직은 [조직.json](조직.json), 운영은 [팀장운영규정.md](팀장운영규정.md), 공유 파일 책임은 [파일담당표.md](파일담당표.md)를 따른다. 기존 5담당을 팀장으로 이어받고 게임개발 팀장·독립 테스터를 신설한다. 총 6개 팀장과 독립 테스터이며 메인3개 역할을 유지한다. 자료의 세계관 계층과 원본 위치는 보존한다. 실제 조직 관계는 조직.json이 우선한다. 원본 완성 시트의 불필요한 분해·재조립은 기본 공정에서 제외한다. 사용자 확인 근거는 OPS-003 대화기록이며 새 게임 콘텐츠 지시0건이다.\n')
 write(SHARED/'작업대장.md',(SHARED/'작업대장.md').read_text(encoding='utf-8')+'\n\nOPS-003: 팀장 조직·독립 테스터 세팅. 실제 상태와 전달 영수증은 `기록/OPS-003/`에 기록한다. 운영 안내는 콘텐츠 제작 작업과 구분한다.\n')
 dump(REC/'configured.json',{'at':datetime.now().astimezone().isoformat(),'teamLeads':org['teamLeads'],'roles':len(branches),'status':'configured_not_yet_delivered'})
 print('Configured 6 team leads + independent tester',flush=True)
def nest():
 org=read(SHARED/'조직.json');nodes=org['nodes']
 for role,n in nodes.items():
  receipt=REC/'영수증'/f'{role}-nest.json'
  if receipt.exists():continue
  args=['worktree','set','--worktree','id:'+n['worktreeId'],'--display-name',n['name']]
  args+=['--parent-worktree','id:'+nodes[n['parent']]['worktreeId']] if n['parent'] else ['--no-parent']
  args+=['--comment','OPS-003 · '+n['kind']+' · 담당 '+n['teamOwner']+' · 기존 작업/원본 보존']
  dump(receipt,cli(*args));print('Placed '+role,flush=True)

def notify_roles():
 org=read(SHARED/'조직.json');cat=read(SHARED/'브랜치목록.json');observed={w['worktreeId']:w for w in live()}
 for role,n in org['nodes'].items():
  if role=='main01':continue
  receipt=REC/'영수증'/f'{role}-notify.json'
  if receipt.exists():continue
  agents=observed[n['worktreeId']].get('agents',[])
  if not agents and role not in {'gameplay','qa'}:
   dump(REC/'준비공간'/(role+'.json'),{'role':role,'status':'rules_ready_no_agent_required','rules':str(Path(n['path'])/'AGENTS.md')});continue
  prompt=f'''[OPS-003 역할 세팅 안내 / 새 콘텐츠 제작 지시 아님]
사용자 승인: 2026-11-09 “그럼 지금구성 세팅먼저 진행해줄래”. 당신의 현재 역할은 {n['name']} ({role}), 소속/보고 책임은 {n['teamOwner']}입니다. 기존 작업·대화·원본·진행 상태를 보존하세요.
공유 원본 {SHARED}의 팀장운영규정.md, 규정A.md, 메인운영규정.md, 조직.json, 파일담당표.md, 작업대장.md, 자기 분야 규정과 현재 작업공간의 작업연결.json/AGENTS.md를 읽으세요. 각 분야의 이전 작품별 기준을 그대로 보존하면서 최신 사용자 결정인 OPS-003을 적용합니다.
사용자가 방향·최종 합격·재생 속도를 결정합니다. 메인은 최초/수정 이해 확인 후 팀장에게 전달하고 팀장은 직접 작업/필요한 하위 에이전트/외부 서비스 사용을 맡습니다. 하위 담당에도 원작업 범위와 규정을 이어 전달합니다. 외주 완성 시트를 불필요하게 분해/재조립하지 않습니다. 별도 테스터는 기술 검사만 하고 원본을 수정하지 않습니다. 게임 서버/결제/라이브 운영 제외.
이번 메시지는 운영 초기화만 요청합니다. 새 이미지/기능 제작, 외부 유료 호출, 다른 AI 생성/발송, 원본 수정, 커밋/푸시는 하지 마세요. 진행 중 작업이 있으면 중단시키지 말고 새 조직 소속으로 이어받을 상태만 기록하세요.
읽기 완료 후 {REC}/초기화/{role}.json 한 파일에 role, ready, readFiles, currentWork(또는 대기), blockers, observedAt을 기록하세요. 읽지 못한 항목은 ready:false와 이유를 기록합니다. 이 파일 외에는 수정하지 마세요. 채팅에서 맡은 역할과 준비 상태를 짧게 답한 뒤 다음 사용자 작업을 기다리세요. 준비 완료를 게임 검증/사용자 합격으로 보고하지 마세요.
'''
  if role in {'gameplay','qa'}:prompt+=f'\n게임 시작 사본은 {REC}/{role}-baseline.json에 기록한 UI의 현재 파일입니다. 새 checkout의 과거 main 자료를 최신으로 간주하지 마세요. 후속 작업/검사 전에 대상 출처와 해시를 확인하세요.\n'
  write(REC/'안내문'/(role+'.md'),prompt)
  if agents:
   # Current CLI cannot address the preserved idle structured chats as mailboxes.
   # Do not create duplicate chats or claim a delivered message.
   dump(REC/'전달대기'/(role+'.json'),{'role':role,'status':'instructions_installed_chat_notification_unavailable','reason':'Current Orca CLI rejected preserved structured chat address (terminal_not_found / terminal_handle_stale).','existingPaneKeys':[a['paneKey'] for a in agents],'prompt':str(REC/'안내문'/(role+'.md')),'connectedRules':str(Path(n['path'])/'AGENTS.md')})
   print('Rules connected; direct chat notice unavailable: '+role,flush=True);continue
  else:
   v=cli('agent','launch','--agent','codex','--worktree','id:'+n['worktreeId'],'--surface','chat','--prompt',prompt)
   result=v['result'];cat['branches'][role].update(agentStarted=True,agent={'handle':result['outcome']['handle'],'kind':result['outcome']['kind'],'promptOutcome':result.get('prompt',{}).get('outcome')})
   dump(SHARED/'브랜치목록.json',cat)
  dump(receipt,v);print(json.dumps({'role':role,'receipt':v},ensure_ascii=False),flush=True)

if __name__=='__main__':
 {'snapshot':snapshot,'create':create,'baseline':baseline,'configure':configure,'nest':nest,'notify':notify_roles}[sys.argv[1]]()
