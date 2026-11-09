from pathlib import Path
from datetime import datetime
import hashlib,json,os,shutil,subprocess,uuid
ROOT=Path('C:/Users/user/Desktop/Grid Defenders');S=ROOT/'작업관리';HERE=Path(__file__).resolve().parent
policy=S/'메인보고형식.md';receipt=HERE/'전달결과.json'
if receipt.exists():raise SystemExit('Already attempted; inspect receipts and do not duplicate')
catalog=json.loads((S/'메인목록.json').read_text(encoding='utf-8'));backup=HERE/'변경전'
changed=[]
for role,row in catalog['mains'].items():
 workspace=Path(row['path']);method=Path(row['workMethod']);pointer=workspace/'작업연결.json'
 for name,path in [('AGENTS.md',workspace/'AGENTS.md'),('작업진행방법.md',method),('작업연결.json',pointer)]:
  saved=backup/role/name;saved.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(path,saved)
  if name=='AGENTS.md':
   marker='<!-- GRID-REPORT-FORMAT-20261109 -->'
   if marker not in path.read_text(encoding='utf-8'):
    with path.open('ab') as f:f.write(f'\n\n{marker}\n# 사용자 결과 보고 순서\n공유 원본 `{policy}`를 읽고 적용한다. 답변은 담당 작업들의 번호/상태/작업명 목록부터 시작하고, 이번에 설명하는 완료 항목은 초록 글씨로 표시한 뒤 상세 결과를 전달한다. 실제 미완료를 완료로 표시하지 않는다.\n<!-- /GRID-REPORT-FORMAT-20261109 -->\n'.encode('utf-8'))
  elif name=='작업진행방법.md':
   with path.open('a',encoding='utf-8') as f:f.write('\n\n## 결과 보고 형식 (사용자 직접 요청, 2026-11-09)\n[메인 보고 형식](../../메인보고형식.md)을 먼저 읽는다. 상태·실제 작업명 번호 목록 → 이번 설명의 완료 항목 초록 글씨 → 결과/근거/링크/남은 과제 순서로 보고한다.\n')
  else:
   data=json.loads(path.read_text(encoding='utf-8'));data['reportRules']=str(policy)
   data['requiredReadings']=list(dict.fromkeys([*data['requiredReadings'],str(policy)]))
   path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
  changed.append({'role':role,'path':str(path),'backup':str(saved),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
 row['reportRules']=str(policy);row['requiredReadings']=list(dict.fromkeys([*row['requiredReadings'],str(policy)]))
shutil.copy2(S/'메인목록.json',backup/'메인목록.json')
(S/'메인목록.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
exe='C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe'
recipients={'main02':S/'작업/MAIN02-20261109-063FC22B/송신영수증-v001.json',
            'main03':S/'작업/MAIN03-20261109-9D2018F2/실제발송영수증-v002.json'}
sent={}
for role,source in recipients.items():
 run=json.loads(source.read_text(encoding='utf-8'))['result']['runId']
 body=f'''사용자 직접 보고형식 변경 요청을 전달합니다. 앞으로 결과/진행 보고는 먼저 담당 작업을 번호 목록으로 보여주세요: 1. 진행 중 — 실제 작업명 / 2. 완료 — 이번에 설명하는 주제(초록 글씨) / 3. 진행 중 — 실제 작업명. 그 다음 이번 결과의 상세 설명·근거·링크·남은 과제를 전달합니다. 목록 개수는 실제 작업 수대로, 현재 설명하는 완료 항목을 초록색으로 강조하며 미완료를 완료로 만들지 않습니다. 공유 원본 {policy}를 본문으로 읽어 적용해주세요. 메인01/02/03 AGENTS·자기 작업진행방법·작업연결의 필독 목록에 연결했습니다. 본문 적용 후 수신/적용 이해를 회신해주세요. 기존 제품 제작 작업은 그대로 계속하고 같은 사용자 승인을 다시 받지 마세요. 사용자 창/패널/탭은 조작하지 않습니다. Orca 채팅 시각화 스킬과 scratch 경로가 제공되면 HTML 목록으로 초록 글씨를 구현하고, 지원되지 않으면 🟢 완료 라벨로라도 명확히 구분합니다. 이번은 보고 규칙 전달이며 새 제작 작업이 아닙니다.'''
 p=subprocess.run([exe,'orchestration','send','--to','run:'+run,'--subject','사용자 요청: 상태목록 먼저·현재 완료 주제 초록 글씨','--type','status','--body',body,'--json'],capture_output=True,encoding='utf-8')
 try:r=json.loads(p.stdout[p.stdout.index('{'):])
 except (ValueError,json.JSONDecodeError):r={'ok':False,'raw':p.stdout,'stderr':p.stderr}
 sent[role]={'run':run,'sourceReceipt':str(source),'receipt':r,'returncode':p.returncode}
 for key in ['reportRules','requiredReadings']:
  actual=json.loads((Path(catalog['mains'][role]['path'])/'작업연결.json').read_text(encoding='utf-8'))
  assert actual[key]==catalog['mains'][role][key]
status={'at':datetime.now().astimezone().isoformat(),'policy':str(policy),'changed':changed,'sent':sent,'claimedReadAcknowledgement':False}
receipt.write_text(json.dumps(status,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
scratch=os.environ.get('ORCA_CHAT_SCRATCH_DIR');visual=None
if scratch:
 target=Path(scratch);target.mkdir(parents=True,exist_ok=True);name='report-status-'+uuid.uuid4().hex[:8]+'.html'
 lines=['완료 — 금발 전사·몬스터 이미지 제작 (시안 평가 대기)','완료 — 보고 형식 적용·메인02·03 전달 (이번 보고)','검증 중 — 이미지 대조 도구 독립 검사']
 if not all(x['receipt'].get('ok') for x in sent.values()):lines[1]='진행 중 — 보고 형식 적용·다른 메인 전달 확인'
 html='<!doctype html><html lang="ko"><meta charset="utf-8"><style>body{margin:0;padding:8px 12px;font:14px/1.8 system-ui;color:var(--foreground);background:var(--background)}ol{margin:0;padding-left:24px}.current{color:#22c55e;font-weight:700}</style><ol>'+''.join(f'<li class="{("current" if i==1 else "")}">{line}</li>' for i,line in enumerate(lines))+'</ol></html>'
 (target/name).write_text(html,encoding='utf-8');visual=name
print(json.dumps({'updatedMains':list(catalog['mains']),'delivery':{r:v['receipt'] for r,v in sent.items()},'visual':visual},ensure_ascii=False,indent=2))
