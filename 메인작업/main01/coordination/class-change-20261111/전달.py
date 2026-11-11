from pathlib import Path
import json,subprocess
H=Path(__file__).resolve().parent
receipt=H/'게임개발전달영수증.json'
if receipt.exists():raise SystemExit('Receipt exists; do not repeat delivery.')
body='''main01 → 게임개발 팀장 / 클래스 변경 정보 통보, 제작지시 아님.
main03 공식 메시지 msg_3516d6c2926e에서 다음 사용자 직접 요청을 전달받아 게임설정 책임 담당에게 중계합니다.
사용자 원문: 그 게임설정 쪽에 전달해 창병 없고 궁수 사수 통일해서 사수 성직자 정령술사 통일 해서 지원으로 변경한다고 전해줘 양식은 내가 알아서 수정할꺼니까 내용만 전달해줘

변경사항: 1) 창병 클래스 제외. 2) 궁수/사수는 사수로 통합. 3) 성직자/정령술사는 지원으로 통합.
기존 목록에 이 변경을 적용한 분류 정리: 영웅=기사/전사/사수/암살자/마법사/지원, 병사=보병/방패병/사수/암살자/마법사/지원. 이는 신규 클래스 추가가 아닙니다.

사용자가 양식은 직접 수정한다고 명시했습니다. 이번에는 내용을 읽고 통보 수신만 확인하세요. 클래스 원본문서/양식/표/게임코드/스킬/밸런스/장비/이미지/기존원본/공유규정/Git을 수정하지 마세요. 후속 신규제작 승인으로 확대하지 마세요. 기존 이름과 분류 이력은 보존하고 다음 관련 요청에서 최신 사용자 기준으로 구분하세요.
근거 기록: C:/Users/user/Desktop/Grid Defenders/메인작업/main01/coordination/class-change-20261111/수신내용.md
단순 통보 수신/이해와 파일변경0을 짧게 회신하면 됩니다. 게임설정 책임 담당이 본인과 다르면 실제 담당을 알려주시되 임의로 코드수정 작업을 만들지 마세요.'''
cmd=['C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe','orchestration','send','--to','dispatch:ctx_987a7bd84f54','--type','status','--subject','사용자 클래스 변경 내용 통보: 창병제외·사수/지원 통합 (양식·코드수정없음)','--body',body,'--json']
cp=subprocess.run(cmd,capture_output=True,text=True,encoding='utf-8',errors='replace');receipt.write_text(cp.stdout+('\n'+cp.stderr if cp.stderr else ''),encoding='utf-8');print(cp.stdout,flush=True)
if cp.returncode:raise SystemExit(cp.returncode)
d=json.loads(cp.stdout)
if not d.get('ok'):raise SystemExit('Unconfirmed; inspect before any recovery.')
ack=H/'메인03통보영수증.json'
cmd=['C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe','orchestration','send','--to','run:run_b29b47372e51','--type','status','--subject','클래스 변경3항 게임개발 담당에게 통보 전달','--body','msg_3516d6c2926e의 사용자 원문과 변경3항(창병 제외, 궁수/사수→사수, 성직자/정령술사→지원)을 확인된 게임개발 담당 ctx_987a7bd84f54로 공식 전달했습니다. 사용자 양식 직접수정 지시를 보존해 파일/표/코드/기획/공유규정/Git수정 없이 내용통보만 했습니다. 실제영수증은 C:/Users/user/Desktop/Grid Defenders/메인작업/main01/coordination/class-change-20261111/게임개발전달영수증.json 입니다. 상대 읽기완료와 전달영수증은 구분하며 수신확인 회신은 대기입니다. 이 상태통보에 재회신은 필요하지 않습니다.','--json']
cp=subprocess.run(cmd,capture_output=True,text=True,encoding='utf-8',errors='replace');ack.write_text(cp.stdout+('\n'+cp.stderr if cp.stderr else ''),encoding='utf-8');print(cp.stdout,flush=True)
if cp.returncode:raise SystemExit(cp.returncode)
