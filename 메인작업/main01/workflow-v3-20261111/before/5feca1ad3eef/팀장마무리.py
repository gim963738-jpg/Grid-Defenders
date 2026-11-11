"""Finalize OPS-003 records from actual verification and acknowledgement evidence."""
from 팀장세팅 import ROOT,SHARED,REC,read,write,dump,TEAMS
from datetime import datetime

report=read(REC/'팀장검증.json');assert report['status']=='PASS'
cat=read(SHARED/'브랜치목록.json');mains=read(SHARED/'메인목록.json');org=read(SHARED/'조직.json')
for role,row in {**cat['branches'],**mains['mains']}.items():
 ack=REC/'초기화'/f'{role}.json'
 if role=='main01':
  dump(ack,{'role':'main01','ready':True,'observedAt':datetime.now().astimezone().isoformat(),'readFiles':['규정A.md','메인운영규정.md','팀장운영규정.md','조직.json','파일담당표.md'],'currentWork':'OPS-003 세팅·검증','blockers':[]})
 if 'ready' in row and 'previousReadiness' not in row:row['previousReadiness']={'ready':row['ready'],'acknowledgement':row.get('acknowledgement'),'version':'OPS-001'}
 if ack.exists() and read(ack).get('ready'):
  row.update(ready=True,acknowledgement=str(ack),instructionReadiness='read_confirmed',instructionVersion='A-2.0.0')
 elif (REC/'전달대기'/f'{role}.json').exists():row.update(ready=False,instructionReadiness='files_connected_chat_notice_pending',instructionVersion='A-2.0.0')
 else:row.update(ready=False,instructionReadiness='prepared_slot_no_agent',instructionVersion='A-2.0.0')
dump(SHARED/'브랜치목록.json',cat);dump(SHARED/'메인목록.json',mains)
tree=read(SHARED/'도메인/트리.json');tree['externalRoles']=['ui','items','gameplay','qa'];tree['organizationFile']='조직.json';dump(SHARED/'도메인/트리.json',tree)
for file in ['README.md','도메인/README.md','기준/README.md']:
 p=SHARED/file;old=p.read_text(encoding='utf-8');lines=old.splitlines(keepends=True)
 intro='\n현재 실제 담당 조직은 '+('[조직 안내](조직안내.md)' if file=='README.md' else '[조직 안내](../조직안내.md)')+'와 조직.json을 따른다. 아래 세계관 트리는 자료 분류이며 실제 AI 조직의 표시·부모 관계와는 구분한다. OPS-001/002의 인원·동일 계층 설명은 당시 기록이다.\n\n'
 write(p,lines[0]+intro+''.join(lines[1:]))
rows='\n'.join(f'|{name}|{scope}|'+('신규 생성·규정 읽기 확인' if role in {'gameplay','qa'} else '기존 작업·채팅 유지, 역할 연결')+'|' for role,(name,scope) in TEAMS.items())
outline='''총괄 디렉터 AI · 메인01
├─ 세계관 · 자료 분류
│  ├─ 몬스터 팀장 AI
│  │  └─ 몬스터 스프라이트 · 전문 작업 준비
│  └─ 캐릭터 팀장 AI
│     ├─ 캐릭터 일러스트 · 기존 전문 작업
│     ├─ 캐릭터 스프라이트 · 기존 전문 작업
│     │  └─ 영상·모션 소스 · 기존 전문 작업
│     ├─ 캐릭터 능력치 · 전문 작업 준비
│     └─ 캐릭터 스킬 · 전문 작업 준비
├─ 아이템·경제 팀장 AI
├─ UI 팀장 AI
├─ 이펙트·제작도구 팀장 AI
├─ 게임개발 팀장 AI [신규]
└─ 독립 테스터 AI [신규]

메인02 · 기획·시안·지시
메인03 · 기획·시안·지시'''
write(SHARED/'조직안내.md',f'''# Grid Defenders 담당 구성 — 2026-11-09

6개 팀장과 독립 테스터를 실제 Orca 작업 목록에 배치했다. 메인02/03의 요청·시안·지시 역할을 유지한다. 기존 하위 제작 작업 3개와 자료/준비 공간4개는 보존하며 새 하위 AI를 일괄 생성하지 않았다.

```text
{outline}
```

|담당|책임|이번 처리|
|---|---|---|
{rows}

## 게임에 근거한 구성

[현재 구현 현황](../문서/05_프로젝트정의/현재구현현황.md)의 웨이브·보스전·장비 퍼즐·로비 성장을 기준으로 조사했다. 실제 게임의 defenseConfig.ts는 캐릭터/아이템/몬스터를 함께 정의하고, defense.ts·bossBattle.ts·battleSave.ts·main.ts가 전투와 저장·성장·화면을 연결한다. 웨이브·보스·저장·맵을 초기부터 별도 상시 팀으로 나누면 같은 파일 편집이 겹치므로 게임개발팀이 공통 실행 책임을 맡는다. UI는 [파일 담당표](파일담당표.md)에 따라 화면/입력을 맡는다.

이펙트 기존 작업에는 effect-workshop 편집기·재료함·갤러리·내보내기가 있어 독립 팀장으로 유지했다. 캐릭터·몬스터·아이템 팀은 승인 명세와 원본을 관리한다. 세계관 원본은 기존 캐릭터 작업 공간의 소스를 계속 참조한다. 사운드는 현재 src에서 구현 근거를 확인하지 못해 실제 작업이 생길 때 필요성을 설명하고 신설한다. 게임 서버·결제·라이브 운영은 제외했다.

## 현재 준비와 전달 상태

- 실제 17개 작업 공간: 메인3 + 팀장6 + 테스터1 + 보존된 전문/자료 공간7.
- 기존15개 공간의 경로·Git 브랜치·HEAD·채팅을 보존했다. 게임개발/테스터 2개만 신설했다.
- 새 두 채팅에 초기 안내가 접수됐고 두 담당 모두 규정 읽기 완료를 기록했다.
- 기존10개 채팅은 자동 안내를 직접 보내는 CLI가 수신 주소를 인식하지 못한다. 각 공간의 AGENTS.md/작업연결.json/공유규정 및 안내문은 연결했지만, 새 규정 읽기 확인을 받았다고 보고하지 않는다. 다음 작업에서 최신 규정 읽기를 확인한다. 기존 채팅을 복제하거나 종료하지 않았다.
- 기존 채팅 알림 실패는 `terminal_not_found`, `terminal_handle_stale`이며 권한 승인 거부가 아니다. 알림을 우회하기 위해 앱 내부 DB나 비공식 API를 수정하지 않았다.
- 외부 계정 연결과 유료 생성은 이번에 하지 않았다. 캐릭터 작업에는 기존 Sunburst 로컬 도구가 존재하고 과거 실제 호출이 크레딧 부족으로 실패한 기록이 있다. 도구 존재와 생성 성공을 구분한다.

## 사용할 때

사용자는 메인 창에 요청/피드백을 전달한다. 담당 메인이 이해를 확인한 뒤 팀장에게 전문 지시를 전달하고 팀장 창/작업 결과 링크에서 확인할 수 있게 모은다. 실제 제작은 [팀장 운영 규정](팀장운영규정.md)과 [메인 운영 규정](메인운영규정.md)을 따른다. 기존 비감독 채팅을 수신 주소로 단정하지 않고 실제 전송 가능 여부를 확인한다. 공식 감독 작업이 필요하면 해당 팀 작업 공간에서 Orca worker-start를 사용하며, 기존 편집자 상태와 겹침을 먼저 확인한다. 이번에는 콘텐츠 제작 작업을 발송하지 않았다.

하위 AI는 팀장이 승인 범위 내에서 필요할 때 활용한다. 신규 역할에는 원작업·규정·원본·검수·회신 경로를 이어 전달한다. 외주 발송/수령은 팀장 책임이고, 완성 시트는 그대로 보존한다. 사용자가 재생 속도와 최종 합격을 결정한다. 독립 테스터는 문제를 재현하고 담당팀에 반환한다.

## 검증과 복구

25개 절차/도메인/조직 검사 통과. 실제 Orca 배치·신규 채팅 접수·규정 읽기, 기존 게임 코드/테스트/리소스328개 불변, 새 게임 사본 각178개 해시 일치 확인. 게임 기능을 수정하지 않아 게임 빌드/실기기 검사를 이번 세팅에서 반복하지 않았다. 새 공간의 의존성 설치와 게임 실행은 실제 개발/검사 착수 시 진행한다.

백업: `{report['backup']}`. [조직 검증](기록/OPS-003/팀장검증.json), [도메인 검증](기록/OPS-003/도메인검증.json), [공통 연결 검증](기록/OPS-003/운영연결검증.json). 이전 OPS-001/002의 증거는 유지했다. 로컬 반영이며 커밋·푸시는 하지 않았다.
''')
records=ROOT/'문서/03_작업기록/OPS-003_팀장체계세팅'
write(records/'3_작업일지.md',f'''# OPS-003 작업일지

2026-11-09. 사전확인 작성 후 공유 원본과 기존15개 공간의 지침·상태를 백업했다. 게임 코드 및 12개 기존 역할의 파일·규정을 읽기 조사했다. 기존5개 제작담당을 팀장으로 유지하고 게임개발 팀장과 독립 테스터를 신설했다. 실제 Orca 표시·부모 관계와17개 공간의 운영 연결을 갱신했다.

새 담당의 시작 게임은 UI 현재 사본 각178개 파일이다. 기존 미커밋 코드를 main HEAD의 과거 사본으로 대체하지 않았다. 파일 이동·게임 코드 수정·커밋·푸시 없음.

기존 구조화 채팅에 직접 안내 시 terminal_not_found/terminal_handle_stale가 반환됐다. 반복 생성/중복 발송을 하지 않고 10개 기존 채팅의 안내문/시작 지침을 연결해 직접 알림 대기로 명시했다. 신규 두 채팅은 journaled 접수와 ready:true 응답을 확인했다.

25개 자동검사, 실제 배치/도메인/운영연결 검사 PASS. 기존 게임328개 파일 불변과 새 시작 사본 일치 확인. 게임 기능 빌드/실기기 검사는 미수행(변경 범위는 운영 세팅).

백업: {report['backup']}
''')
write(records/'4_정의문서.md','''# OPS-003 정의

현재 역할과 화면 구조는 [조직 안내](../../../작업관리/조직안내.md), 기계 판독 기준은 작업관리/조직.json이다. 역할 ID·Git 경로는 유지하고 organizationParent/teamOwner를 별도로 둔다. 세계관 자료 분류는 도메인/트리.json이며 조직 개편이 원본 이동을 뜻하지 않는다.

ready는 해당 규정 버전 읽기 확인을 뜻한다. 기존 OPS-001 준비 응답은 previousReadiness로 보존하고 OPS-003 수신 근거로 재사용하지 않는다. instructions_installed와 chat_notice_pending을 구분한다. 부서와 신규 담당 생성은 완료, 기존 채팅 직접 알림은 CLI 한계로 대기다.

공통 운영 v2.0.0: 사용자 방향·합격·재생 속도 결정, 메인 이해 확인, 팀장 직접/하위/외주 작업, 원본 완성 시트 보존, 독립 검사, 기준 개선. 서버/결제/라이브 운영 제외.
''')
write(records/'5_버전관리.md','''# OPS-003 버전 관리

공통 규정 A 및 팀장 규정 v2.0.0. 이전 규정·원본은 외부 백업과 기존 기록으로 복구 가능하다. 기존15개 공간의 HEAD와 Git 브랜치·경로를 보존했고 팀/gameplay·team/qa에 해당하는 team/gameplay, team/qa 브랜치 두 개를 새로 생성했다. 게임 최신 사본은 미커밋 상태로 각 workspace에 연결했다.

로컬 문서/도구/Orca 배치 변경 완료. 커밋·원격 푸시·기존 브랜치 병합은 하지 않았다. 기존 작업과 OPS-003 변경을 구분해 검토한 뒤 사용자가 커밋 범위를 결정할 수 있다. 실제 구성과 알림 제한은 조직안내.md 및 기록/OPS-003 검증 자료를 따른다.
''')
for p in [ROOT/'README.md',ROOT/'문서/05_프로젝트정의/현재구현현황.md']:
 old=p.read_text(encoding='utf-8');first,rest=old.split('\n',1)
 link='작업관리/조직안내.md' if p==ROOT/'README.md' else '../../작업관리/조직안내.md'
 write(p,first+'\n\nOPS-003 (2026-11-09): 6개 팀장과 독립 테스터를 배치하고 신규 게임개발/테스터 채팅의 규정 읽기를 확인했다. 기존 채팅 직접 알림은 CLI 제한으로 대기하며 시작 지침·공유규정은 연결했다. [현재 조직과 준비 상태]('+link+').\n'+rest)
dump(REC/'상태.json',{'status':'configured_with_existing_chat_notice_limit','at':datetime.now().astimezone().isoformat(),'structureVerified':True,'newAgentsReady':['gameplay','qa'],'existingChatNotificationsPending':10,'gameModified':False,'externalPaidCalls':0,'backup':report['backup']})
dump(REC/'전달실패근거.json',{'events':[{'command':'orchestration send','target':'main02 existing structured chat','error':'terminal_not_found','requestId':'bb0708dd-d42c-455b-a11d-add2911f385c'},{'command':'terminal send','target':'same preserved structured chat','error':'terminal_handle_stale','requestId':'4767823d-3859-47fd-ad61-339eedcad474'}],'interpretation':'No success receipt; do not claim notification delivered. Existing chats preserved; latest rules and per-role notices installed.'})
print('Final records written; existing chat notification limit explicitly retained.')
