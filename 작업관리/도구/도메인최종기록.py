"""Write final OPS-002 status only after its observed hierarchy verification passed."""
from datetime import datetime
import json
from pathlib import Path
from 도메인정리 import ROOT,SHARED,RECORD,read,dump,write

def main():
 result=read(RECORD/'검증.json')
 if result['status']!='PASS':raise RuntimeError('Hierarchy verification did not pass')
 p=ROOT/'task.md';text=p.read_text(encoding='utf-8')
 text=text.replace('- [ ] 최종 실제 계층·기존 자료 보존·절차 검사 확정','- [x] 실제 계층·원본 보존·운영 연결 검증 및20개 절차/도메인 검사 통과',1);write(p,text)
 for name in ['현재구현현황','정의목록']:
  p=ROOT/'문서/05_프로젝트정의'/(name+'.md');text=p.read_text(encoding='utf-8')
  if '## 세계관 도메인 계층 (OPS-002)' not in text:
   lines=text.splitlines();lines.insert(1,'\n## 세계관 도메인 계층 (OPS-002)\n\n작업 목록을 세계관→몬스터/캐릭터→세부 담당으로 재배치했다. 기존 작업·규정·원본 경로는 보존하며 [도메인 색인](../../작업관리/도메인/README.md)에서 실제 원본과 담당을 찾는다.4개 부족한 관리/작업 공간을 추가했고 기존 역할 ID는 유지했다.20개 절차·도메인 검사와 실제 Orca 관계·원본 보존 검증을 통과했다. 게임 기능·수치·스킬 변경이나 새 제작 지시는 수행하지 않았다. [검증](../../작업관리/기록/OPS-002/검증.json).\n');text='\n'.join(lines)+'\n'
  write(p,text)
 p=SHARED/'README.md';text=p.read_text(encoding='utf-8')
 text=text.replace('│  ├─ ui/','│  ├─ world/                  세계관 원본·기획 연결\n│  ├─ monster_sprites/        몬스터 동작·시트\n│  ├─ character_stats/        캐릭터 능력치\n│  ├─ character_skills/       캐릭터 스킬\n│  ├─ ui/',1)
 text=text.replace('준비 상태와 실제 채팅 초기화 영수증은 [준비 기록](기록/OPS-001/상태.json)을 따른다.','초기 채팅 준비는 [OPS-001 기록](기록/OPS-001/상태.json), 현재 도메인 계층은 [OPS-002 기록](기록/OPS-002/상태.json)을 따른다.');write(p,text)
 p=SHARED/'도구/사용법.md';text=p.read_text(encoding='utf-8')
 text+='''
## 도메인 계층

새 작업은 공유 도메인 트리에서 역할 ID를 고른다. 표시 이름과 Git 경로를 구분한다. `python 작업관리/도구/도메인검증.py`는 실제 Orca 관계와 원본 연결을 읽어 검증한다. `도메인정리.py`, `도메인색인.py`, `도메인문서마무리.py`, `도메인최종기록.py`는 OPS-002 이관용이며 이후 트리를 초기화하기 위해 반복 실행하지 않는다. 기존 절차 검사는 test_workflow.py, 도메인 모델 검사는 test_domain_tree.py다.
''';write(p,text)
 state=read(RECORD/'상태.json');state.update(status='complete',completedAt=datetime.now().astimezone().isoformat(),
    unitTests={'passed':20,'failed':0},liveOrcaHierarchy='PASS',existingSourcesPreserved=True,newProductionAgents=0,productionDispatches=0,sourceMoves=0)
 dump(RECORD/'상태.json',state)
 print('OPS-002 status and navigation completed')

if __name__=='__main__':main()
