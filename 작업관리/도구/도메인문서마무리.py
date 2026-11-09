"""Finalize OPS-002 navigation and preserve the earlier OPS-001 verification snapshot."""
from datetime import datetime
import hashlib
import json
from pathlib import Path
import shutil
from 도메인정리 import ROOT,SHARED,RECORD,dump,read,write

def main():
 if (RECORD/'documents-finalized.json').exists():raise RuntimeError('Documentation already finalized')
 before=read(RECORD/'before.json');backup=Path(before['backup'])
 # Earlier evidence remains a historical snapshot. New verification writes to OPS-002.
 shutil.copy2(backup/'shared/기록/OPS-001/검증.json',SHARED/'기록/OPS-001/검증.json')
 catalog=read(SHARED/'브랜치목록.json');tree=read(SHARED/'도메인/트리.json')
 for role,row in tree['nodes'].items():
  p=SHARED/row['index'];data=read(p)
  for source in data['sources']:
   path=Path(source['path']);source['sha256AtIndex']=hashlib.sha256(path.read_bytes()).hexdigest() if path.is_file() else None
  data['indexedAt']=datetime.now().astimezone().isoformat();dump(p,data)
 p=SHARED/'기준/README.md'
 text='''# 도메인별 작업 기준 연결

최상위 분류는 [세계관 도메인 트리](../도메인/README.md)다. 제작 공정과 검수 기준은 각 대상별로 유지하고, 원본은 기존 위치에서 참조한다.

- [세계관](world/규정.md)
  - [몬스터](monsters/규정.md)
    - [몬스터 스프라이트](monster_sprites/규정.md)
  - [캐릭터](characters/규정.md)
    - [캐릭터 일러스트](splash/규정.md)
    - [캐릭터 스프라이트](sprites/규정.md)
      - [영상·모션 소스](video/규정.md)
    - [캐릭터 능력치](character_stats/규정.md)
    - [캐릭터 스킬](character_skills/규정.md)
      - [이펙트·제작도구](effects/규정.md)

요청 트리 밖의 [UI](ui/규정.md)·[아이템](items/규정.md)은 기존 위치를 유지한다. 이펙트 도구는 다른 분야에서도 공용으로 참조할 수 있다.

기존 기준75개는 OPS-001 당시의 원본·해시·조사 상태를 보존한 목록이다. 새로 분류한 기획/작업 역할은 기존 원본과 현재 구현을 연결하며 미확정 데이터를 새로 확정하지 않는다. 작업마다 최신 사용자 판정과 해당 제작기준을 읽는다.
'''
 write(p,text)
 p=SHARED/'README.md';text=p.read_text(encoding='utf-8')
 text=text.replace('# Grid Defenders — 3개 메인과 분야별 작업 공간','# Grid Defenders — 3개 메인과 세계관 도메인 작업 트리',1)
 text=text.replace('기존 몬스터·시트·캐릭터·아이템·이펙트·스플래시·영상 작업 공간은 위치와 브랜치를 유지한다. 원본 규정과 변경 사항을 보존하고 [기준 목록](기준/README.md)으로 연결했다. 원래의 부모·자식 관계는 Git 브랜치와 별도 정보다. 세 메인은 동등한 역할이며 담당 메인은 작업대장의 소유자로 결정한다.',
 '기존 작업 공간의 위치·Git 브랜치·이력은 유지한다. 실제 부모/자식 관계는 사용자 요청에 맞춰 [세계관 도메인 트리](도메인/README.md)로 재배치했다. 원본 규정과 변경 사항은 [도메인별 기준](기준/README.md)에서 찾는다. 세 메인은 동등한 역할이며 담당 메인은 작업대장의 소유자로 결정한다.')
 text=text.replace('├─ 기준/','├─ 도메인/                    세계관→몬스터/캐릭터의 계층·원본 색인\n├─ 기준/',1)
 text+='''
## 현재 도메인 분류 (OPS-002)

```text
세계관
├─ 몬스터
│  └─ 몬스터 스프라이트
└─ 캐릭터
   ├─ 캐릭터 일러스트
   ├─ 캐릭터 스프라이트
   │  └─ 영상·모션 소스
   ├─ 캐릭터 능력치
   └─ 캐릭터 스킬
      └─ 이펙트·제작도구
```

분류가 실제 작업 목록과 공유 색인에 함께 적용되어 있다. 새 세계관 관리·몬스터 스프라이트·캐릭터 능력치·캐릭터 스킬 공간은 분류·참조 준비 상태이며 이번에 새 제작 AI를 시작하지 않았다. 기존 자료의 물리적 경로와 Git 브랜치 이름은 보존한다. [정리 기록](기록/OPS-002/상태.json)과 [현재 계층 검사](기록/OPS-002/검증.json)를 확인한다.
'''
 write(p,text)
 p=SHARED/'메인운영규정.md';text=p.read_text(encoding='utf-8');text+='''
## OPS-002 도메인 기준 작업 분류

메인3개는 [세계관 트리](도메인/트리.json)에서 요청의 기획 소속을 확인한다. 몬스터 디자인과 몬스터 스프라이트, 캐릭터 공통 설정과 일러스트·스프라이트·능력치·스킬을 각각 연결한다. 기존 역할 ID는 유지하며 index.json의 실제 소스 위치·자료 상태와 selector를 사용한다. 부모 소속이 같아도 제작·검수 기준은 각 분야 규정을 따른다. 새로운 공간에 들어 있는 과거 Git 사본을 최신 데이터로 가정하지 않는다.
''';write(p,text)
 p=ROOT/'task.md';text=p.read_text(encoding='utf-8');anchor='## OPS-001 —';assert text.count(anchor)==1
 text=text.replace(anchor,'''## OPS-002 — 세계관 중심 도메인 계층

- [x] 사전확인·전후 작업 공간/규정 백업
- [x] 세계관→몬스터/캐릭터→세부 객체의 실제 Nesting 재배치
- [x] 없는4개 분류/작업 공간 추가, 기존 경로·브랜치·이력 보존
- [x] 도메인 색인·규정 A1.1·전달 분류 연결
- [ ] 최종 실제 계층·기존 자료 보존·절차 검사 확정

[도메인 트리](작업관리/도메인/README.md) · [사전확인](문서/03_작업기록/OPS-002_세계관도메인계층정리/2_사전확인.md).

'''+anchor,1);write(p,text)
 for name in ['현재구현현황','정의목록']:
  p=ROOT/'문서/05_프로젝트정의'/(name+'.md');text=p.read_text(encoding='utf-8');lines=text.splitlines();lines.insert(1,'\n최신 작업 분류: [세계관 중심 도메인 트리](../../작업관리/도메인/README.md). OPS-002에서 실제 부모/자식 관계와 원본 색인을 재편했으며 기존 제작·검수 기준과 자료 위치를 보존했다.\n');write(p,'\n'.join(lines)+'\n')
 dump(RECORD/'documents-finalized.json',{'at':datetime.now().astimezone().isoformat(),'sourceMoves':0,'historicalOps001ValidationPreserved':True})
 dump(RECORD/'상태.json',{'status':'configured_validation_pending','domainNodes':10,'requestedNodes':8,'newWorkspaces':4,'originalWorkspacesPreserved':11,'roles':12,'mainChats':3,'newProductionAgents':0,'sourceMoves':0,'commitPush':'not_performed'})
 print('Domain navigation and historical evidence finalized')

if __name__=='__main__':main()
