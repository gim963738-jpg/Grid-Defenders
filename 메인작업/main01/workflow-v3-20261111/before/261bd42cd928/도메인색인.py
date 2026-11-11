"""Connect existing source locations to the new domain hierarchy without moving assets."""
from datetime import datetime
import hashlib
import json
import os
from pathlib import Path
import uuid
from 도메인정리 import ROOT,SHARED,RECORD,PARENTS,NAMES,NEW

def read(p):return json.loads(p.read_text(encoding='utf-8'))
def write(p,text):
 p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text,encoding='utf-8',newline='\n')
def dump(p,data):
 temp=p.with_name(p.name+'.'+uuid.uuid4().hex+'.tmp');write(temp,json.dumps(data,ensure_ascii=False,indent=2)+'\n');os.replace(temp,p)

def main():
 if (RECORD/'configured.json').exists():raise RuntimeError('Domain configuration already applied; do not append duplicate instructions.')
 catalog=read(SHARED/'브랜치목록.json');branches=catalog['branches'];mains=read(SHARED/'메인목록.json')['mains']
 chars=Path(branches['characters']['path']);monsters=Path(branches['monsters']['path']);ui=Path(branches['ui']['path'])
 def source(label,path,authority):
  path=Path(path)
  if not path.exists():raise FileNotFoundError(str(path))
  return {'label':label,'path':str(path),'authority':authority,
          'sha256AtIndex':hashlib.sha256(path.read_bytes()).hexdigest() if path.is_file() else None}
 sources={
 'world':[source('기존 세계관 설정집',chars/'문서/02_세부기획/00_세계관/세계관설정집.md','existing_world_document'),
          source('기존 구조화 세계관',chars/'자료/세계관/세계관설정.json','existing_world_data'),
          source('기존 세계관 지도 버전',chars/'output/world/current.json','existing_world_map_index')],
 'monsters':[source('기존 몬스터 제작 기준',monsters/'문서/00_개발규칙/몬스터디자인기준.md','existing_monster_rules'),
             source('기존 몬스터 제작 결과',monsters/'output/monsters','existing_results_not_new_approval')],
 'monster_sprites':[source('승인 여부와 방향·동작의 기존 기준',monsters/'문서/00_개발규칙/몬스터디자인기준.md','existing_monster_rules'),
                    source('기존 몬스터 시트·동작 원본',monsters/'output/monsters','existing_results_not_new_approval')],
 'characters':[source('캐릭터 최신 지침·판정',chars/'AGENTS.md','existing_character_directives'),
               source('GC9 작화 기준',chars/'문서/02_세부기획/02_영웅/캐릭터그림체/GC9_그림체기준.md','existing_character_style'),
               source('SD 공통 제작 기준',chars/'문서/02_세부기획/02_영웅/SD_공통제작기준.md','existing_sd_standard')],
 'splash':[source('일러스트 기존 지침',Path(branches['splash']['path'])/'AGENTS.md','existing_illustration_directives'),
           source('기존 일러스트 결과',Path(branches['splash']['path'])/'output','existing_results_not_new_approval')],
 'sprites':[source('캐릭터 동작 기존 지침',Path(branches['sprites']['path'])/'AGENTS.md','existing_character_sprite_directives'),
            source('기존 동작별 결과와 제작기준',Path(branches['sprites']['path'])/'output/characters','existing_results_not_new_approval')],
 'character_stats':[source('현재 전투 능력치 정의',ui/'게임/src/defenseConfig.ts','runtime_prototype_not_final_design'),
                    source('기존 클래스·배치 기획',ROOT/'문서/02_세부기획/01_전투/클래스별진형배치.md','planning_not_full_implementation')],
 'character_skills':[source('기존 영웅 스킬 기획',ROOT/'문서/02_세부기획/02_영웅/임시영웅.md','planning_not_full_implementation'),
                     source('현재 보스 전투 구현',ui/'게임/src/bossBattle.ts','runtime_prototype'),
                     source('스킬 구현 규약',ROOT/'문서/00_개발규칙/스킬구현규약.md','existing_effect_and_hit_rules')],
 'video':[source('영상·모션 기존 지침',Path(branches['video']['path'])/'AGENTS.md','existing_video_directives')],
 'effects':[source('이펙트 기존 지침·공용 재료',Path(branches['effects']['path'])/'AGENTS.md','existing_shared_effect_tool_directives')],
 }
 notes={
 'world':'세계관 공통 기획·용어·객체 관계와 원본 위치를 관리한다. 기존 설정·지도·종족·소속과 사용자 미지정 항목을 구분하고 새 국가·관계·설정을 임의 확정하지 않는다. 이 공간은 네 번째 메인 채팅이 아니라 도메인 관리 노드다.',
 'monster_sprites':'몬스터별 신체 구조·팔다리 유무/수·변형·공격 부위를 요청별로 명세한다. 인간형 캐릭터의 보행·무기 검수 기준을 모든 몬스터에 강제하지 않는다. 기존 몬스터 디자인 선택본과 방향/동작 자료를 읽고 프레임·알파·접지/기준점·전체 프레임을 검증한다.',
 'character_stats':'캐릭터의 식별자·클래스·기본/성장 능력치·단위·수치 근거와 확정 여부를 관리한다. 현재 게임의 시제품 수치를 출시 기획 확정값으로 간주하지 않는다. 이번 분류 작업으로 능력치나 밸런스를 새로 생성·변경하지 않는다.',
 'character_skills':'캐릭터별 패시브·액티브·궁극기 기획과 모드 조건·범위·효과·구현 상태를 연결한다. 기존 발로르 기획의 보스전용 항목과 미확정 범위를 보존한다. 효과 제작·판정 구현은 스킬 규약과 확인된 개별 작업 범위를 따른다.',
 }
 nodes={};connector_changes=[]
 for role,parent in PARENTS.items():
  row=branches[role];labels=row['domainPath'];folder=SHARED/'도메인'/Path(*labels)
  index={'schemaVersion':1,'role':role,'name':NAMES[role],'parent':parent,'domainPath':labels,
         'worktreeId':row['worktreeId'],'workspace':row['path'],'gitBranch':row['gitBranch'],
         'rules':str(SHARED/row['rules']),'sources':sources[role],
         'sourcePolicy':'Existing source locations remain authoritative until an approved task explicitly updates ownership; do not treat old files in a fresh checkout as latest.',
         'sharedTool':role=='effects','newProductionStarted':False}
  dump(folder/'index.json',index)
  write(folder/'README.md',f'''# {' / '.join(labels)}

담당 역할: `{role}` / 실제 작업 공간: `{row['path']}`

[원본·기준·담당 색인](index.json)을 읽는다. 기존 자료는 원래 위치에 보존하며 이 분류만으로 자료·스킬·수치를 변경하지 않았다. 새 작업 공간의 Git 기준선에 들어 있는 오래된 자료보다 색인이 지정한 원본을 먼저 확인한다. 제작 방식·검수 기준은 이 분야의 기존 규정을 유지한다.

신규 제작 지시와 수정 지시는 담당 메인의 이해 설명·사용자 확인 후 수행한다. 결과와 검증·규정 보완안을 함께 반환한다.
''')
  nodes[role]={'name':NAMES[role],'parent':parent,'domainPath':labels,'index':row['domainIndex'],
               'order':list(PARENTS).index(role),'kind':'domain' if role in {'world','monsters','characters'} else 'specialist'}
  rule=SHARED/row['rules']
  if role in NEW:
   refs='\n'.join('- '+s['label']+': `'+s['path']+'` ('+s['authority']+')' for s in sources[role])
   write(rule,f'''# {NAMES[role]} 작업 기준 — v1.0.0

공통 [규정 A](../../규정A.md)와 [도메인 관리](../../도메인/README.md)를 적용한다.

{notes[role]}

## 기존 기준·원본 연결

{refs}

기존 원본과 과거 결과는 보존한다. 새 작업마다 대상에 해당하는 최신 사용자 판정·제작기준을 읽는다. 기획·시제품·실제 구현·사용자 합격을 구분하고 원본의 미확정 값을 임의로 메우지 않는다. 결과·검증·기준 보완안을 함께 제출하며 확인된 피드백만 활성 기준으로 갱신한다.

현재는 분류 공간과 참조 연결을 준비한 상태다. 새 제작 AI·이미지·수치·스킬 제작은 시작하지 않았다.
''')
  else:
   text=rule.read_text(encoding='utf-8')
   text+='\n## OPS-002 도메인 소속 갱신\n\n현재 소속은 `'+ ' / '.join(labels)+'`다. 기존 제작·검수·참조 기준은 유지한다. 다른 세부 객체의 업무는 도메인 트리의 담당 역할로 연결한다. 같은 출력을 사용해도 캐릭터와 몬스터의 작업 기준을 합치지 않는다. 기존 원본과 과거 작업은 이 위치에 보존한다.\n'
   if role=='monsters':text+='\n몬스터 디자인·개체 기획은 이 노드에서, 신규 방향/동작/시트 제작은 하위 `monster_sprites`에서 관리한다. 기존에 여기서 만든 시트는 원본 참조로 보존한다.\n'
   if role=='characters':text+='\n캐릭터 공통 설정·디자인 기준은 이 노드에서, 일러스트·스프라이트·능력치·스킬은 각 하위 담당에서 관리한다. 여기에 저장된 기존 세계관 원본은 세계관 노드에서 공통 소스로 연결하며 지금 이동하지 않는다.\n'
   write(rule,text);row['ruleVersion']='1.1.0'
  pointer=Path(row['path'])/'작업연결.json'
  value=read(pointer) if pointer.exists() else {'schemaVersion':1,'role':role,'kind':'domain' if role=='world' else 'worker','coordinatorRoot':str(ROOT),'sharedRoot':str(SHARED)}
  value.update(ruleVersion='A-1.1.0',domainPath=labels,domainIndex=str(folder/'index.json'),hierarchyVersion=1)
  dump(pointer,value)
  agent=Path(row['path'])/'AGENTS.md';original=agent.read_bytes() if agent.exists() else b''
  marker='<!-- GRID-DOMAIN-TREE-V1-BEGIN -->'
  if marker.encode() in original:raise RuntimeError('Domain connector already exists: '+str(agent))
  extra=f'''\n\n{marker}
# 세계관 중심 도메인 소속 (사용자 요청,2026-11-08)

소속: {' / '.join(labels)}. 역할 ID는 `{role}`이며 표시 이름과 실제 Git 브랜치·파일 경로를 구분한다. 공유 운영 원본 `{SHARED}`의 `규정A.md`, `메인운영규정.md`, `도메인/README.md`, `브랜치목록.json`, `기준/{role}/규정.md`와 이 노드의 `index.json`을 읽는다. 기존 제작·검수 규정은 그대로 유지한다.

새 작업 공간의 오래된 Git 사본 대신 index.json이 지정한 원본·최신 판정을 확인한다. 최초·수정 제작 지시는 메인에서 이해를 설명하고 사용자 확인 후 수행한다. 이 조직 정리 자체를 새 이미지·능력치·스킬 제작 승인으로 해석하지 않는다. 기존 원본과 미커밋 변경을 보존하며 실제 수정은 확인된 작업 범위를 따른다.
<!-- GRID-DOMAIN-TREE-V1-END -->
'''
  agent.write_bytes(original+extra.encode('utf-8'))
  connector_changes.append({'role':role,'path':str(agent),'beforeSha256':hashlib.sha256(original).hexdigest(),
                            'preservedPrefix':agent.read_bytes().startswith(original)})
 # Existing main pointers adopt the index; they remain the same three main chats.
 for role,row in mains.items():
  p=Path(row['path'])/'작업연결.json';value=read(p);value.update(ruleVersion='A-1.1.0',domainTree=str(SHARED/'도메인/트리.json'),hierarchyVersion=1);dump(p,value)
  p=Path(row['path'])/'AGENTS.md';old=p.read_bytes();p.write_bytes(old+f'\n\n# OPS-002 도메인 작업 분류\n공유 원본 `{SHARED}`의 `도메인/README.md`·`도메인/트리.json`을 매 새 작업에 확인한다. 세계관 아래 몬스터/캐릭터와 해당 세부 담당으로 요청을 분류한다. 표시 이름은 변경됐어도 기존 역할 ID·원본 경로·작업 이력을 보존한다.\n'.encode('utf-8'))
 for role in ['ui','items']:
  p=Path(branches[role]['path'])/'작업연결.json';value=read(p);value.update(ruleVersion='A-1.1.0',domainTree=str(SHARED/'도메인/트리.json'));dump(p,value)
 catalog.update(ruleVersion='A-1.1.0',hierarchyVersion=1,domainTree='도메인/트리.json',branches=branches)
 dump(SHARED/'브랜치목록.json',catalog)
 dump(SHARED/'도메인/트리.json',{'schemaVersion':1,'root':'world','nodes':nodes,'externalRoles':['ui','items']})
 dump(RECORD/'configured.json',{'at':datetime.now().astimezone().isoformat(),'roles':len(branches),'nodes':len(nodes),
                                'connectors':connector_changes,'sourceMoves':0,'newAgentsStarted':0})
 print(json.dumps({'roles':len(branches),'domainNodes':len(nodes),'sourceMoves':0,'newProductionAgents':0},ensure_ascii=False))

if __name__=='__main__':main()
