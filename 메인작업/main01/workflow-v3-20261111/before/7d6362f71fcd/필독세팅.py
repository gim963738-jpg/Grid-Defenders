"""OPS-004: install role-specific reading instructions without altering artwork/runtime."""
from pathlib import Path
from datetime import datetime
import json,shutil,hashlib,sys

ROOT=Path(__file__).resolve().parents[2];S=ROOT/'작업관리';R=S/'기록/OPS-004'
def read(p):return json.loads(p.read_text(encoding='utf-8'))
def write(p,t):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(t,encoding='utf-8',newline='\n')
def dump(p,d):write(p,json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()

def main():
 if (R/'installed.json').exists():raise RuntimeError('OPS-004 already installed; do not append again')
 if (S/'상태/writer.lock').exists():raise RuntimeError('Another writer is active')
 cat=read(S/'브랜치목록.json');mains=read(S/'메인목록.json');org=read(S/'조직.json');allrows={**mains['mains'],**cat['branches']}
 backup=Path('C:/Users/user/orca/backups/Grid Defenders')/datetime.now().strftime('required-reading-%Y%m%d-%H%M%S')
 shutil.copytree(S,backup/'shared',ignore=shutil.ignore_patterns('__pycache__'))
 saved=[]
 for role,row in allrows.items():
  for name in ['AGENTS.md','작업연결.json']:
   src=Path(row['path'])/name;dst=backup/'workspaces'/role/name;dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dst)
   saved.append({'path':str(src),'backup':str(dst),'sha256':sha(src)})
 dump(R/'before.json',{'at':datetime.now().astimezone().isoformat(),'backup':str(backup),'files':saved})
 specifics={
 'characters':'기존 캐릭터 AGENTS의 최신 사용자 판정과 GC9/SD/그립 등 이번 결과물에 해당하는 기준을 읽는다. 전체 작화와 SD 비율을 혼용하지 않는다. 승인 참조와 미달 결과를 구분한다.',
 'monsters':'몬스터 디자인 기준과 해당 몬스터의 기존 방향·동작 기준을 읽는다. 신체 구조와 비대칭 장비를 확인하고 정후면을 단순 반전으로 대체하지 않는다.',
 'monster_sprites':'상위 몬스터 팀장이 지정한 원형과 해당 개체의 방향·동작 규정을 읽는다. 기존 몬스터별 프레임 수를 모든 개체에 강제하지 않는다.',
 'sprites':'기존 동작 시트 작업의 대상 작품별 제작기준과 마지막 피드백을 읽는다. 외주에서 완성 시트를 받으면 원본 그대로 보존하며 자동 분해/재조립은 하지 않는다.',
 'splash':'해당 캐릭터의 작화·구도·스플래시 기준과 승인 참조/최근 판정을 읽는다. 다른 작업의 화풍 합격을 현재 작품 합격으로 옮기지 않는다.',
 'video':'대상 영상의 원본·동작·출력 규정과 사용자 요청을 읽는다. 원본 영상, 중간 프레임, 완성 납품물의 상태를 구분하며 과거 배경 분리 공정을 신규 완성 시트에 자동 적용하지 않는다.',
 'character_stats':'현재 클래스·능력치/성장 명세와 확정/임시 상태를 읽는다. 게임 시제품 수치를 최종 밸런스로 간주하지 않는다.',
 'character_skills':'대상 영웅의 스킬 기획, 웨이브/보스전 조건과 스킬 구현 규약을 읽는다. 기획 문구와 실제 구현 상태를 구분한다.',
 'world':'세계관 색인이 지정하는 실제 최신 원본과 사용자 확정 설정을 읽는다. 새 checkout의 과거 사본을 최신으로 간주하거나 소속을 임의 배정하지 않는다.',
 'items':'해당 장비의 이미지·그리드 모양·조합식·옵션/가격 기준과 최근 판정을 읽는다. 명세와 실제 게임 적용 상태를 구분한다.',
 'effects':'기존 공방·재료함·대상 이펙트 사용법과 스킬 구현 규약을 읽는다. 라이브러리 표시/부품 연결/게임 적용을 구분하고 표시 범위와 피해 판정을 분리한다.',
 'ui':'공통 모바일 UI 규격과 이번 화면의 기준·사용자 선택 시안을 읽는다. 기존 현재 사본과 새 변경을 구분하고 화면/입력의 편집 범위를 확인한다.',
 'gameplay':'현재 게임 구현 현황·담당 파일·대상 기능 기획과 실제 최신 사본 출처를 읽는다. 다른 팀의 승인 명세를 받아 공통 실행 코드에 적용한다. 새 공간의 과거 main 사본을 최신으로 간주하지 않는다.',
 'qa':'검사 대상 작업의 지시·버전/해시·제작 규정·기대 결과와 실행 안내를 읽는다. 모델/브라우저/실기기 검사를 구분하고 재현 증거로 보고한다. 제작 원본 수정과 사용자 미적 합격 판단을 대신하지 않는다.'}
 common=[S/'규정A.md',S/'메인운영규정.md',S/'팀장운영규정.md',S/'파일담당표.md']
 for role,row in allrows.items():
  method=S/f'기준/{role}/작업진행방법.md';rule=S/row['rules'] if 'rules' in row else S/'메인운영규정.md'
  detail=specifics.get(role,'사용자의 현재 요청·기존 판정·직전 작업을 먼저 읽는다. 기획/실제 시안/전문지시를 수행하며, 최초·수정 지시의 사용자 이해 확인을 기록한다. 이미 허용된 범위의 같은 승인 질문을 반복하지 않는다.')
  write(method,f'''# {org['nodes'][role]['name']} 작업진행방법 — v1.0.0

역할 ID: `{role}`. 이 문서는 매 작업 하달 후 실제 편집·생성·외주 호출 전에 읽는다. 역할 초기화 때 읽은 것으로 새 작업의 필독을 대신하지 않는다.

1. 작업연결.json에서 공유 운영 원본과 자기 역할을 확인하고, 현재 지시의 원작업·차수·담당 메인/팀장·사용자 확인 범위를 읽는다.
2. 자기 AGENTS.md, 이 작업진행방법, 공통 운영 규정, 자기 분야 규정을 본문으로 읽는다. 목록·파일명·해시만 확인한 것을 읽었다고 기록하지 않는다.
3. {detail}
4. 전문 지시의 필독 목록에 대상 작품의 제작기준·최근 피드백·필요한 세부 문서를 포함한다. 해당 문서가 빠졌다면 담당 메인/팀장에 보완을 요청하고 확인되지 않은 내용으로 제작하지 않는다. 최신 사용자 요청과 충돌하면 사용자 요청을 우선하고 차이를 기록한다.
5. 작업대장 read-pack으로 현재 필독 본문을 열고, 작업 번호/차수/역할 및 각 문서의 적용 요약·버전 해시를 읽기확인 JSON에 기록한다. start 검증을 통과한 뒤 작업한다. 문서를 못 읽거나 경로가 없으면 원인을 보고한다. 사용자에게 추가 허락을 받는 절차가 아니다.
6. 허용 파일·원본 보존·검수 기준에 따라 작업한다. 문서가 갱신되면 영향을 확인하고 다시 읽어 start 확인을 갱신한다. 하위 에이전트에도 같은 절차와 자기 작업 방법/작품 규정을 전달한다.
7. 결과·검증·남은 문제와 읽은 기준을 함께 보고한다. 기술 검증/사용자 합격/게임 반영을 구분한다. 피드백으로 작품과 작업 기준을 함께 개선한다.

하달 작업은 전문 지시의 자동 필독 절차를 따른다. 메인 자체 분석처럼 작업대장에 등록하지 않는 작업도 이 순서로 읽고 사전확인에 문서·적용 내용을 남긴다. 완성 외주 시트는 불필요하게 분해/재조립하지 않으며 재생 속도와 최종 합격은 사용자가 결정한다.
''')
  docs=[Path(row['path'])/'AGENTS.md',method,*common,rule]
  # Deduplicate paths, retain display order and exact absolute locations.
  docs=list(dict.fromkeys(str(p.resolve()) for p in docs))
  row.update(workMethod=str(method),requiredReadings=docs,readingPolicyVersion='OPS-004')
  pointer=Path(row['path'])/'작업연결.json';v=read(pointer);v.update(workMethod=str(method),requiredReadings=docs,readingPolicyVersion='OPS-004');dump(pointer,v)
  ag=Path(row['path'])/'AGENTS.md';old=ag.read_bytes()
  addition=f'''\n\n<!-- GRID-READ-FIRST-OPS004-BEGIN -->
# 매 작업 하달 후 필독 (사용자 요청, 2026-11-09)
작업을 하달받으면 실제 편집·생성·외주 호출 전에 `{method}`와 작업연결.json의 requiredReadings, 자기 분야 규정 및 해당 작품의 최신 제작기준/피드백을 본문으로 읽는다. 메인·팀장·테스터·하위 에이전트 모두 적용한다. 이전 작업에서 읽은 기억으로 생략하지 않는다.
전문 지시의 자동 필독 목록과 작업대장 read-pack을 확인하고, 각 문서의 이번 작업 적용 내용을 기록해 start를 통과한 후 착수한다. 읽기 확인 없이 결과를 제출하지 않는다. 문서가 없거나 읽을 수 없으면 담당 메인/팀장에게 이유를 알린다. 하위 담당 생성 시 이 필독 지침과 자신의 작업 방법·필독 경로를 함께 전달한다. 사용자 추가 승인 절차는 아니다.
<!-- GRID-READ-FIRST-OPS004-END -->
'''
  ag.write_bytes(old+addition.encode('utf-8'))
 cat['readingPolicyVersion']='OPS-004';mains['readingPolicyVersion']='OPS-004';dump(S/'브랜치목록.json',cat);dump(S/'메인목록.json',mains)
 for f in ['규정A.md','메인운영규정.md','팀장운영규정.md','규정변경이력.md']:
  p=S/f;t=p.read_text(encoding='utf-8');write(p,t+'\n\n## OPS-004 매 작업 하달 후 필독 — 2026-11-09\n\n사용자 요청으로 모든 역할의 작업진행방법.md와 requiredReadings를 연결했다. 작업을 받은 에이전트는 본문 읽기 → 작업별 적용 요약 → start 착수 확인 후 작업한다. 전문지시와 하위위임에 실제 필독 경로/버전을 포함하며, 목록만 복사하거나 과거 초기화 응답으로 대신하지 않는다. read-pack/start 절차는 [작업대장 사용법](도구/사용법.md)을 따른다. 사용자 추가 승인 절차가 아니다.\n')
 for f in ['전문프롬프트.md','하위위임.md']:
  p=S/'양식'/f;t=p.read_text(encoding='utf-8');write(p,t+'\n\n## 작업 착수 전 필독\n작업연결.json의 workMethod/requiredReadings와 이번 작품의 제작기준·최신 피드백을 실제로 읽는다. 하위 위임에도 원작업 번호·차수·역할별 작업 방법·필독 절대 경로·읽기확인 방법을 전달한다. 발송 준비 도구가 붙인 필독 목록과 read-pack/start 명령을 따른다. 문서를 읽기 전 제작·수정·외주 호출을 시작하지 않는다.\n')
 dump(R/'installed.json',{'at':datetime.now().astimezone().isoformat(),'roles':list(allrows),'backup':str(backup),'status':'instructions_installed_not_a_read_acknowledgement'})
 print(json.dumps({'roles':len(allrows),'backup':str(backup)},ensure_ascii=False))
def complete_links():
 """Finish OPS-004 links without reinstalling or duplicating instructions."""
 if not (R/'installed.json').exists():raise RuntimeError('Install OPS-004 first')
 if (S/'상태/writer.lock').exists():raise RuntimeError('Another writer is active')
 cat=read(S/'브랜치목록.json');mains=read(S/'메인목록.json')
 stable=[S/'도구/사용법.md',S/'조직.json',S/'도메인/README.md',S/'도메인/트리.json']
 for role,row in {**mains['mains'],**cat['branches']}.items():
  row['requiredReadings']=list(dict.fromkeys([*row['requiredReadings'],*[str(p.resolve()) for p in stable]]))
  for p in row['requiredReadings']:
   if not Path(p).is_file():raise RuntimeError('Missing required reading: '+p)
  pointer=Path(row['path'])/'작업연결.json';v=read(pointer);v['requiredReadings']=row['requiredReadings'];dump(pointer,v)
 dump(S/'브랜치목록.json',cat);dump(S/'메인목록.json',mains)
 print('OPS-004 stable reading links completed for 17 roles')

def verify():
 cat=read(S/'브랜치목록.json');mains=read(S/'메인목록.json')
 rows={**mains['mains'],**cat['branches']};results=[]
 before=read(R/'before.json');saved={f['path']:f for f in before['files']}
 for role,row in rows.items():
  folder=Path(row['path']);pointer=read(folder/'작업연결.json');ag=folder/'AGENTS.md';old=saved[str(ag)]
  docs=row['requiredReadings'];method=Path(row['workMethod'])
  assert pointer['workMethod']==row['workMethod'] and pointer['requiredReadings']==docs,role
  assert pointer['readingPolicyVersion']=='OPS-004' and row['readingPolicyVersion']=='OPS-004',role
  assert method.is_file() and f'`{role}`' in method.read_text(encoding='utf-8'),role
  assert ag.read_bytes().startswith(Path(old['backup']).read_bytes()),role
  assert ag.read_text(encoding='utf-8').count('<!-- GRID-READ-FIRST-OPS004-BEGIN -->')==1,role
  assert str(method.resolve()) in docs and str(ag.resolve()) in docs,role
  assert all(Path(p).is_file() and Path(p).read_text(encoding='utf-8').strip() for p in docs),role
  results.append({'role':role,'documents':len(docs),'method':str(method),'status':'passed'})
 for f in before['files']:
  assert sha(Path(f['backup']))==f['sha256'],f['backup']
 checks={'at':datetime.now().astimezone().isoformat(),'roles':results,'backupFilesIntact':len(before['files']),
         'existingAgentsPreserved':len(rows),'productionTasks':len(list((S/'작업').glob('*/task.json'))),
         'status':'passed','scope':'configuration_and_backup_integrity_not_proof_of_agent_comprehension'}
 dump(R/'설정검증.json',checks)
 print(json.dumps({'roles':len(rows),'backupFilesIntact':len(before['files']),'status':'passed'},ensure_ascii=False))

if __name__=='__main__':
 if sys.argv[1:]==['--complete-links']:complete_links()
 elif sys.argv[1:]==['--verify']:verify()
 elif not sys.argv[1:]:main()
 else:raise SystemExit('Usage: 필독세팅.py [--complete-links | --verify]')
