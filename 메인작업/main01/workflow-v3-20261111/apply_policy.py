"""One-time, backed-up MAIN01 operational migration. No production/Git/API calls."""
import hashlib
import json
import re
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parents[3]
S = ROOT / '작업관리'
OUT = Path(__file__).resolve().parent
AT = datetime.now().astimezone().isoformat()

def read(p): return Path(p).read_text(encoding='utf-8-sig')
def data(p): return json.loads(read(p))
def put(p, body):
    p = Path(p); p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(body.rstrip() + '\n', encoding='utf-8')
def js(p, obj): put(p, json.dumps(obj, ensure_ascii=False, indent=2))
def digest(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()

if (OUT / 'migration-result.json').exists():
    raise SystemExit('Already applied; do not replay a migration over live work.')
backups = {r['path']: r for r in data(OUT / 'before-manifest.json')}
def checked(p):
    key = str(Path(p).resolve())
    row = backups.get(key)
    if not row or digest(p) != row['sha256']:
        raise RuntimeError('Backup mismatch or concurrent edit: ' + key)

catalog = data(S / '브랜치목록.json')
org = data(S / '조직.json')
# Fail before modifying shared instruction files if another editor changed one.
for row in backups.values(): checked(row['path'])

aliases = {
    '규정A.md': '공통 작업 규정', '메인운영규정.md': 'MAIN01 운영',
    '팀장운영규정.md': '팀장 운영', '단일메인운영규정.md': '단일 메인 운영',
    '진행승인규칙.md': '버튼 승인', '메인보고형식.md': '대화 보호 및 결과 보고',
    '이미지2.6사용규칙.md': '작업별 이미지 2.6 허가', '저장운영규정.md': '사용자 요청 시 Git 저장',
}
for filename, title in aliases.items():
    put(S / filename, f'# {title}\n\n현재 본문은 [운영규칙 v3](운영규칙.md) 한 곳에서 관리한다. 이 경로는 기존 링크 호환용이다. 과거 운영 본문은 활성 지침에서 제거했으며 복구 사본은 메인작업/main01/workflow-v3-20261111/before-manifest.json에 연결한다.')

put(S / 'README.md', '''# Grid Defenders 작업 운영

활성 총괄은 MAIN01. [운영규칙](운영규칙.md)을 적용한다.
요청과 정정·전문 프롬프트는 작업별 통합작업명세.json 하나에서 관리한다.
진행 버튼 클릭 증거를 확인하기 전에는 제작을 하달하지 않는다. 현재 네이티브 클릭 인증 연결은 미지원 상태이며 문자로 대체하지 않는다.
상태는 제작 완료·기술 검증·사용자 합격·게임 반영을 각각 기록한다. 타 작업 완료 알림은 현재 대화가 끝날 때 함께 보고한다.

[도구 사용법](도구/사용법.md) · [조직](조직.json) · [분야 기준](기준/README.md) · [파일 책임](파일담당표.md)
''')
put(S / '작업대장.md', '''# 공유 작업대장

지시 원본: `작업/<ID>/통합작업명세.json`. 상태·증거 색인: 같은 폴더의 `task.json`.
`python 작업관리/도구/작업대장.py list`는 작업별 4단계와 발송 흐름을 표시한다.
이 문서에 별도 수기 상태표를 유지하지 않는다. [운영규칙](운영규칙.md)과 [사용법](도구/사용법.md)을 따른다.
기존 요청확인/전문프롬프트/발송지시 및 이전 차수는 과거 증거이며 새 발송 원본이 아니다.
과거 자료가 불충분하면 미확인으로 남기며 사용자 합격이나 게임 반영을 추정하지 않는다.
''')
put(S / '조직안내.md', '''# 담당 조직

MAIN01 아래 캐릭터·몬스터·아이템/경제·게임개발·UI·이펙트/제작도구의 6개 팀장과 독립 테스터를 둔다.
캐릭터와 몬스터는 병렬 담당이다. 세계관은 병렬 자료 색인으로 유지하며 지시를 중계하지 않는다.
실제 전문 작업이 있을 때만 하위 담당을 사용하고 같은 통합 명세를 전달한다. 단순 전달을 위한 상주 중계 AI를 만들지 않는다.
실제 관계는 [조직.json](조직.json), 원본 경로는 [브랜치목록.json](브랜치목록.json)을 따른다.
''')
put(S / '도메인/README.md', '''# 세계관 자료 색인

이 트리는 자료 분류다. 세계관 아래 몬스터·캐릭터와 일러스트·스프라이트·능력치·스킬 자료를 찾는다.
제작 조직은 [조직.json](../조직.json)의 병렬 팀장 구조다. MAIN01은 세계관 담당을 거치지 않고 실제 담당에게 같은 통합 명세를 직접 전달한다.
기존 자료·도메인 경로·index.json은 보존한다. 분류 계층을 Git 병합 또는 지시 전달 단계로 해석하지 않는다.
작품 원본과 최신 사용자 판정은 해당 색인에서 확인한다. 원본 이동·새 제작은 이 분류 변경의 범위가 아니다.
''')
put(S / '기준/README.md', '''# 분야별 작업 기준

현재 운영은 [운영규칙](../운영규칙.md), 분야별 제작·검수 기준은 각 역할의 `규정.md`다.
매 작업에 자기 `작업진행방법.md`, 역할 AGENTS, 공통 운영 규칙, 분야 기준, 통합 명세를 읽는다.
작품별 제작기준은 필요한 문서만 additionalReadings에 연결한다. 과거 작품 판정을 전역 제작 기준으로 승격하지 않는다.
''')

# Replace duplicated workflow blocks; preserve every domain/art instruction outside them.
pairs = [('GRID-SINGLE-MAIN-20261111', '/GRID-SINGLE-MAIN-20261111'),
         ('GRID-WORKFLOW-A-BEGIN','GRID-WORKFLOW-A-END'),
         ('GRID-DOMAIN-TREE-V1-BEGIN','GRID-DOMAIN-TREE-V1-END'),
         ('GRID-TEAM-OPS003-BEGIN','GRID-TEAM-OPS003-END'),
         ('GRID-READ-FIRST-OPS004-BEGIN','GRID-READ-FIRST-OPS004-END'),
         ('GRID-REPORT-FORMAT-20261109','/GRID-REPORT-FORMAT-20261109')]
roles = {'main01': {'path': str(ROOT), 'displayName': '총괄 디렉터 AI · MAIN01'}, **catalog['branches']}
for role, row in roles.items():
    base = Path(row['path']); agents = base / 'AGENTS.md'
    body = read(agents)
    for a, b in pairs:
        body = re.sub(r'<!-- '+re.escape(a)+r' -->.*?<!-- '+re.escape(b)+r' -->', '', body, flags=re.S)
    body = re.sub(r'<!-- GRID-EXPLICIT-PROCEED-20261109 -->.*?(?=\n<!--|\Z)', '', body, flags=re.S)
    body = re.sub(r'^##? 사용자 요청 시 GitHub 저장[^\n]*\n.*?(?=\n#|\n<!--|\Z)', '', body, flags=re.M|re.S)
    body = re.sub(r'^# OPS-002 도메인 작업 분류\n.*?(?=\n#|\n<!--|\Z)', '', body, flags=re.M|re.S)
    header = f'''<!-- GRID-OPS006-BEGIN -->
# MAIN01 단일 명세 운영 — v3 / 2026-11-11
역할 `{role}`. 공유 원본 `{S.as_posix()}`의 `운영규칙.md`와 이 공간 `작업연결.json`의 requiredReadings를 매 작업 본문으로 읽는다.
지시는 작업별 통합작업명세.json 한 곳에서 관리한다. 문자 “진행”은 승인이 아니며 실제 사용자 진행 버튼 클릭을 검증한 뒤 발송한다. 클릭 출처를 검증할 수 없으면 실행하지 않는다.
타 작업 완료는 현재 대화 종료까지 큐에 보관한다. 제작 완료/기술 검증/사용자 합격/게임 반영을 독립 표시한다. 지시·회신은 MAIN01로 연결하며 단순 중계 AI를 두지 않는다.
작업별 2.6 사용 허가와 사용자 요청 시 Git 저장 기준을 유지한다. 기존 작품 원본·판정은 보존한다. 읽기 확인/start 후 착수하며 하위 담당도 같은 명세·차수·규칙을 따른다.
<!-- GRID-OPS006-END -->
'''
    put(agents, header + '\n' + body.strip())
    method = S / '기준' / role / '작업진행방법.md'
    # Preserve the role-specific step; shared procedure now has one source.
    previous = read(method)
    step = next((l for l in previous.splitlines() if l.startswith('3. ')), '')
    if role == 'main01':
        step = '요청을 끝까지 수합하고 통합 명세의 원문·정정·현재 조건·전문 프롬프트를 대조한다. 시스템 진행 버튼을 제공하며 클릭 검증 전 하달하지 않는다.'
    else:
        step = re.sub(r'^3\.\s*', '', step)
    put(method, f'''# {row.get('displayName', role)} 작업진행방법 — v3

역할: `{role}`. 공통 절차는 [운영규칙](../../운영규칙.md) 한 곳을 따른다.

1. 작업연결.json의 역할·공유 경로를 확인하고 requiredReadings 및 해당 통합 명세의 본문을 읽는다.
2. {step}
3. 최신 차수·명세 해시·승인 범위·원본·담당 파일을 확인한다. 읽기 확인에 문서별 applies와 요구사항 ID별 적용 내용을 적고 start 후 착수한다.
4. 명세의 professionalPrompt를 임의 재해석하지 않는다. 조건 충돌·누락은 MAIN01에 반환한다. 실제 제출 프롬프트 및 파일 증거를 연결한다.
5. 네 단계 상태와 증거를 각각 보고한다. 다른 대화 주제 중 완료는 큐에 보관한다. 사용자 미적 합격은 대신 결정하지 않는다.
''')
    link = data(base / '작업연결.json')
    readings = [str(agents.resolve()), str((S/'운영규칙.md').resolve()), str(method.resolve())]
    field = S / '기준' / role / '규정.md'
    if field.exists(): readings.append(str(field.resolve()))
    link.update(requiredReadings=readings, ruleVersion='OPS-006-v3', readingPolicyVersion='OPS-006',
                coordinatorRole='main01', operatingMode='single-main', instructionSource=str(S/'운영규칙.md'))
    js(base / '작업연결.json', link)
    if role != 'main01':
        row.update(requiredReadings=readings, workMethod=str(method), ruleVersion='OPS-006-v3',
                   readingPolicyVersion='OPS-006', instructionVersion='OPS-006-v3',
                   instructionReadiness='files_updated_requires_next_task_read_ack', ready=False)

for role in ['characters', 'monsters']:
    org['nodes'][role]['parent'] = 'main01'
    catalog['branches'][role]['parentRole'] = 'main01'
    catalog['branches'][role]['organizationParent'] = 'main01'
    catalog['branches'][role]['domainParent'] = 'world'
    p = Path(catalog['branches'][role]['path'])/'작업연결.json'
    link = data(p); link['organizationParent'] = 'main01'; js(p, link)
org.update(version='3.0.0', at=AT, operatingMode='single-main', routing='main01-direct-executor')
catalog.update(ruleVersion='OPS-006-v3', readingPolicyVersion='OPS-006', organizationVersion='3.0.0', hierarchyVersion=2)
js(S/'조직.json', org); js(S/'브랜치목록.json', catalog)

# Remove retired roles' live methods, not the archived evidence or their source data.
for role in ['main02', 'main03']:
    directory = (S/'기준'/role).resolve()
    if not directory.is_relative_to((S/'기준').resolve()): raise RuntimeError('Invalid retired path')
    for name in ['작업진행방법.md', '메인운영규정.md']:
        p = directory/name
        if p.is_file():
            checked(p)
            p.unlink()
    put(directory/'README.md', '# 폐지 역할\n\n현재 운영 지침 없음. 담당은 MAIN01이며 과거 자료는 복구 사본과 원작업 이력으로만 보존한다.')

for name in ['요청확인.md','전문프롬프트.md','사용자확인근거.md','피드백.md',
             '1_대화기록.md','2_사전확인.md','3_작업일지.md','4_정의문서.md','5_버전관리.md']:
    if (S/'양식'/name).exists():
        put(S/'양식'/name, '# 호환 경로\n\n요청·정정·전문 프롬프트는 통합작업명세.json에만 작성한다. 상태·검증·변경 증거는 task.json의 이력에 연결한다. 이 양식에 지시를 중복 작성하지 않는다.')
put(S/'양식/하위위임.md', '# 하위 작업 전달 봉투\n\n원작업 ID / 차수 / 통합 명세 절대 경로 / SHA-256 / 담당 역할 / 명세 안의 담당 요구사항 ID / 회신 위치만 적는다. 사용자 지시를 따로 재작성하지 않는다. 작업진행방법·필독·start 적용 여부를 확인한다.')
put(S/'양식/결과보고.md', '# 결과 보고\n\n작업 ID·명세 차수·해시 / 제작 완료 / 기술 검증 / 사용자 합격 / 게임 반영 / 실제 파일·검증 증거 / 남은 문제. 실행 지시는 통합 명세에만 있다. 완료 알림은 현재 대화 종료 후 보고한다.')

# Same entry point, no reachable legacy quote-approval implementation.
put(S/'도구/작업대장.py', '''"""Stable CLI entry point for MAIN01 workflow v3."""
import importlib.util
from pathlib import Path
_spec = importlib.util.spec_from_file_location('grid_workflow_v3', Path(__file__).with_name('워크플로우.py'))
_module = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_module)
Board = _module.Board
read_json = _module.read_json
write_json = _module.write_json
sha = _module.sha
evidence = _module.evidence
if __name__ == '__main__':
    _module.main()
''')

migrated=[]
for p in sorted((S/'작업').glob('*/task.json')):
    task=data(p); old_status=task['status']; folder=p.parent
    spec_file=folder/'통합작업명세.json'
    if spec_file.exists(): raise RuntimeError('Existing Single Spec; review manually: '+str(spec_file))
    legacy=[]
    # All prior request versions stay together in the single authoritative record.
    sources=[]
    for name in ['요청확인.md','전문프롬프트.md','2_사전확인.md']:
        if (folder/name).exists(): sources.append(folder/name)
    sources+=sorted((folder/'이전차수').glob('*/요청확인.md'))
    sources+=sorted((folder/'이전차수').glob('*/전문프롬프트.md'))
    for source in sources:
        legacy.append({'path':str(source),'sha256':digest(source),'content':read(source),
                       'use':'historical evidence; not independent current instructions'})
    current_prompt=read(folder/'전문프롬프트.md') if (folder/'전문프롬프트.md').exists() else ''
    spec={'schemaVersion':1,'task':task['id'],'revision':task['iteration'],
          'originalRequest':task.pop('request',''),
          'corrections':[{'text':h['userQuote'],'source':h.get('evidence'),'at':h.get('at')} for h in task.get('history',[]) if h.get('userQuote')],
          'current':{'goal':task['title'],'professionalPrompt':current_prompt},'revisionHistory':[],
          'unresolved':['이관된 과거 조건의 최신 범위 정리 필요. 재발송 승인 아님.'],
          'migration':{'at':AT,'needsReconciliation':True,'records':legacy}}
    js(spec_file,spec)
    stages={k:{'status':v,'evidence':None} for k,v in [('production','unknown'),('technical','unknown'),('user','not_reviewed'),('integration','unknown')]}
    if old_status=='draft': stages['production']['status']='not_started'
    if old_status=='in_progress': stages['production']['status']='in_progress'
    for h in task.get('history',[]):
        if h.get('action')=='accept': stages['user']={'status':'accepted','evidence':h.get('evidence'),'quote':h.get('userQuote')}
        elif h.get('action')=='revise': stages['user']={'status':'rejected','evidence':h.get('evidence'),'quote':h.get('userQuote')}
        elif h.get('action')=='integrated': stages['integration']={'status':'applied','evidence':h.get('evidence')}
    if task.get('rootIntegrated') is True:
        stages['integration']={'status':'applied','evidence':{'source':'pre-migration task.json rootIntegrated', 'backup':backups[str(p.resolve())]['backup']}}
    task['history'].append({'action':'OPS006_migration','at':AT,'previousStatus':old_status,'previousApproval':task.get('approval'),
                            'note':'原 지시/판정 보존; 새 발송은 버튼 승인 필요'})
    task.update(schemaVersion=3,stages=stages,approval=None,pendingChoice=None,spec=str(spec_file),
                readingPolicyVersion='OPS-006',updatedAt=AT)
    if old_status=='awaiting_user': task['status']='returned'
    if old_status in {'confirmed','prepared'}: task['status']='draft'
    if task['id']=='MAIN02-20261111-8D69415B':
        task['title']='금발 전사 90도·3/4측면 8종 모션 — 제작 경로는 최신 명세 참조'
    js(p,task)
    migrated.append({'task':task['id'],'oldStatus':old_status,'newStatus':task['status'],'spec':str(spec_file)})

js(S/'상태/대화주제.json', {'topic':'MAIN01 운영 개편','active':True,'at':AT})
if not (S/'상태/완료알림큐.json').exists(): js(S/'상태/완료알림큐.json',[])
after={role:{'files':len(r['requiredReadings']), 'characters':sum(len(read(x)) for x in r['requiredReadings'])} for role,r in catalog['branches'].items()}
js(OUT/'reading-after.json',after)
js(OUT/'migration-result.json',{'at':AT,'tasks':migrated,'rolesUpdated':len(roles),'nativeClickAdapter':'unavailable_fail_closed',
                               'specsNeedReconciliationBeforeAnyNewDispatch':len(migrated)})
print(json.dumps({'tasks':len(migrated),'rolesUpdated':len(roles)},ensure_ascii=False))
