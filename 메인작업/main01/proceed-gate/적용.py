from pathlib import Path
from datetime import datetime
import json,subprocess
ROOT=Path('C:/Users/user/Desktop/Grid Defenders');S=ROOT/'작업관리';HERE=Path(__file__).resolve().parent
receipt=HERE/'전달결과.json';policy=S/'진행승인규칙.md'
if receipt.exists():raise SystemExit('Already attempted; inspect receipts before recovery.')
catalogPath=S/'메인목록.json';catalog=json.loads(catalogPath.read_text(encoding='utf-8'));changed=[]
marker='GRID-EXPLICIT-PROCEED-20261109'
for role,row in catalog['mains'].items():
 for path in [Path(row['path'])/'AGENTS.md',Path(row['workMethod'])]:
  if marker not in path.read_text(encoding='utf-8'):
   with path.open('a',encoding='utf-8') as f:f.write(f'\n\n<!-- {marker} -->\n## 명시적 진행 전 대기 (사용자 확정 기본값)\n공유 원본 {policy}를 읽는다. 사용자가 해당 범위에 진행이라고 명시하기 전 신규 제작·수정·적용/하달은 대기한다. 조건 추가·피드백·구체적인 요청을 승인이라 추론하지 않는다. 실제 제출한 이 내용으로 진행 선택은 승인이다. 이미 승인된 동일 범위 내부 작업은 반복 확인하지 않는다.\n')
  changed.append(str(path))
 pointer=Path(row['path'])/'작업연결.json';data=json.loads(pointer.read_text(encoding='utf-8'));data['proceedRules']=str(policy);data['requiredReadings']=list(dict.fromkeys([*data['requiredReadings'],str(policy)]));pointer.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 row['proceedRules']=str(policy);row['requiredReadings']=list(dict.fromkeys([*row['requiredReadings'],str(policy)]))
catalogPath.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
report=S/'메인보고형식.md'
if '## 진행 승인 기본값' not in report.read_text(encoding='utf-8'):
 with report.open('a',encoding='utf-8') as f:f.write('\n\n## 진행 승인 기본값\n[명시적 진행 승인 규칙](진행승인규칙.md)을 적용한다. 조건 정리·피드백은 확인 대기이며 사용자의 해당 범위에 대한 실제 진행 지시/선택 후에만 제작·수정·적용을 하달한다. 상세 요청 자체를 승인으로 추론하지 않는다.\n')
style=json.loads((ROOT/'메인작업/main01/style20/연결.json').read_text(encoding='utf-8'))
supplement=Path(style['folder'])/'사용자진행승인_보완.md'
supplement.write_text('# 발송 이후 수신한 실제 진행 지시\n\n사용자: 아니 그대로 진행해\n\n20스타일×두모델40장과 확연한차별화·유사안재제작을포함한기존범위를계속진행한다. 조건추가를승인으로오해해이미발송한뒤수신한후속명시적승인이다. 시간순서를소급하지않고기존필독/발송원문은수정하지않는다.\n',encoding='utf-8')
exe='C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe';sent={}
for role,dest in [('main02','run:run_2939978c8e65'),('main03','run:run_b29b47372e51'),('characters','dispatch:ctx_86394ae5b02a')]:
 body=f'''사용자 확정 기본값: 내가 진행이라고 하기전까진 대기, 메인02·03에도 확실히 전달. {policy} 본문을 읽고 적용하세요. 앞으로 신규 제작·수정·적용은 해당 범위에 대한 실제 진행/진행해/그대로 진행해 또는 제출한 이 내용으로 진행 선택 전까지 대기입니다. 조건 추가·질문·피드백·구체적인 요청만으로 승인이라 추론하지 않습니다. 내용을 먼저 정리해 확인 대기로 둡니다. 승인된 동일범위 내부 구현/검수에는 중복승인 요구하지 않습니다. 사용자가 방금 아니 그대로 진행해라고 한 현재40장작업은 계속하며 중단하지 않습니다. 메인3개 AGENTS·작업방법·필독 포인터에 연결했습니다. 하위 담당에게도 같은 기본값과 승인근거를 전달하세요. 실제 본문을 읽고 적용 이해를 회신해주세요. 창/패널/모델 조작·커밋·푸시 없음. 운영공지이며 새 제작 지시가 아닙니다.'''
 p=subprocess.run([exe,'orchestration','send','--to',dest,'--subject','기본값 확정: 사용자 진행 전 대기·조건추가를 승인으로 추론 금지','--type','status','--body',body,'--json'],capture_output=True,encoding='utf-8')
 try:r=json.loads(p.stdout[p.stdout.index('{'):])
 except (ValueError,json.JSONDecodeError):r={'ok':False,'stdout':p.stdout,'stderr':p.stderr}
 sent[role]=r
 receipt.write_text(json.dumps({'at':datetime.now().astimezone().isoformat(),'policy':str(policy),'changed':changed,'sent':sent,'currentStyleTaskContinuesOnActualProceed':True,'committed':False,'pushed':False},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(sent,ensure_ascii=False,indent=2),flush=True)
