from pathlib import Path
from datetime import datetime
import json, subprocess, os, uuid

ROOT=Path('C:/Users/user/Desktop/Grid Defenders')
HERE=Path(__file__).resolve().parent
policy=ROOT/'작업관리/메인보고형식.md'
receipt=HERE/'진행버튼전달결과.json'
if receipt.exists():
    raise SystemExit('Already attempted; inspect existing receipts before recovery.')
prior=json.loads((HERE/'전달결과.json').read_text(encoding='utf-8'))
exe='C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe'
result={'at':datetime.now().astimezone().isoformat(),'policy':str(policy),'version':'1.1','sent':{},
        'v1ReadAcknowledgements':{
            'main02':{'messageId':'msg_2b9b66e85982','readAndApplied':True},
            'main03':{'messageId':'msg_a1a87eca99cd','readAndApplied':True}},
        'crossChatButtonPersistenceTested':False,'previousMessagesRetrofitted':False}
for role,source in prior['sent'].items():
    body=f'''사용자 추가 직접 요청에 따라 {policy}를 v1.1로 갱신했습니다. 본문을 읽고 적용해주세요. 실제 확인이 필요한 작업은 '확인 대기 — 작업명'을 먼저 표시하고 이해한 범위/결과/완료 기준을 설명한 뒤 네이티브 질문 도구(예: functions.request_user_input_async)로 '이 내용으로 진행' / '수정 요청' 선택 버튼을 제공합니다. 질문에 작업번호/차수를 붙여 다른 채팅을 보다가 돌아와도 정확한 대기 작업을 이어가게 합니다. 실제 답변을 해당 차수에 기록한 뒤 기존 발송 절차로 진행합니다. 이미 승인된 요청에 재승인 질문은 만들지 마세요. 침묵/시간경과/사전선택은 승인 아님. 수정 요청은 내용 확인 단계이며 자동 재제작 승인 아님. HTML에 가짜 버튼을 그리거나 기존 메시지에 버튼을 소급 적용했다고 보고하지 마세요. 도구 지원이 없으면 한계를 안내하고 공식 지원 범위만 사용합니다. 창/탭/패널 조작 금지. 기존 제작 계속. 지난 v1.0 본문 수신·적용 회신은 확인했습니다. 이번 v1.1 적용 여부만 회신해주세요.'''
    p=subprocess.run([exe,'orchestration','send','--to','run:'+source['run'],'--subject','확인 대기 작업에 진행·수정 선택 버튼 제공 (보고형식 v1.1)','--type','status','--body',body,'--json'],capture_output=True,encoding='utf-8')
    try: data=json.loads(p.stdout[p.stdout.index('{'):])
    except (ValueError,json.JSONDecodeError): data={'ok':False,'stdout':p.stdout,'stderr':p.stderr}
    result['sent'][role]={'run':source['run'],'receipt':data,'returncode':p.returncode}
    receipt.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

scratch=os.environ.get('ORCA_CHAT_SCRATCH_DIR')
if scratch:
    name='report-buttons-'+uuid.uuid4().hex[:8]+'.html'
    success=all(v['receipt'].get('ok') for v in result['sent'].values())
    rows=['완료 — 메인02·03 보고 형식 수신·적용 확인',
          ('완료 — 확인 대기 선택 버튼 규칙·메인02·03 전달' if success else '진행 중 — 확인 대기 선택 버튼 규칙 전달 확인'),
          '완료 — 이미지 대조 독립 검사 40항목 통과 (시안 평가 대기)']
    html='<!doctype html><html lang="ko"><meta charset="utf-8"><style>body{margin:0;padding:8px 12px;color:var(--foreground);background:var(--background);font:14px/1.85 system-ui}ol{margin:0;padding-left:24px}.current{color:#22c55e;font-weight:700}</style><ol>'+''.join(f'<li class="{("current" if i==1 else "")}">{s}</li>' for i,s in enumerate(rows))+'</ol></html>'
    (Path(scratch)/name).write_text(html,encoding='utf-8')
    result['visual']=name
    receipt.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(result,ensure_ascii=False,indent=2))
