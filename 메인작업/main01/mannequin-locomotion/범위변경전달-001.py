from pathlib import Path
import subprocess,json,hashlib
H=Path(__file__).resolve().parent
p=H/'범위변경발송영수증-001.json'
if p.exists():raise SystemExit('Receipt exists; inspect before any resend.')
amend=H/'범위변경-001.md';digest=hashlib.sha256(amend.read_bytes()).hexdigest()
body=("main01 전달: 진행 중 MAIN01-20261110-B87520F7 차수1의 최신 사용자 직접 변경 지시입니다. "
      "사용자 원문: '여성체 남성체 따로 구분해서 만들어야해서 이것도 같이 작업시켜줘 / 3안제작하지말고 남 1안 여 1안 으로 가져오고 내가 보면서 피드백 줄께'. "
      "기존 움직임3안 제작을 더 진행하지 말고 최종 납품을 남성체1+여성체1, 합계2개로 교체하세요. 체형마다3안 총6개 아님. "
      f"전체 보충지시 {amend} (SHA256 {digest})를 지금 본문으로 읽고 별도 보충읽기확인 및 현재작업 ACK/start 갱신 후 반영하세요. "
      "동일 우측3/4·코드 마네킹·Idle/Start/Walk/Run/Stop·이미지API0은 유지. 같은 기본 동작과 주기로 두 체형을 나란히 비교, 체형에 필요한 관절/접지 보정만 기록. "
      "원본 승인/발송문·A/B/게임·규정·UI/Git는 보존하고 기존 output에서 작업을 이어가며 새 편집자를 만들지 마세요. "
      "3안 임시 결과는 삭제하지 않고 이력 보존하되 제출 플레이어는 남녀2개로 명확히 표시합니다. 반영 확인과 결과/검증을 이 원작업에 회신하세요.")
cmd=['C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe','orchestration','send','--to','dispatch:ctx_5794cdcf2e84','--type','dispatch','--subject','MAIN01-20261110-B87520F7 최신 변경: 3안 중단→남성체1·여성체1','--body',body,'--json']
r=subprocess.run(cmd,capture_output=True,text=True,encoding='utf-8',errors='replace')
p.write_text(r.stdout+('\n'+r.stderr if r.stderr else ''),encoding='utf-8');print(r.stdout,flush=True)
if r.returncode:raise SystemExit(r.returncode)
d=json.loads(r.stdout)
if not d.get('ok'):raise SystemExit('Send not successful; inspect receipt before recovery.')
(H/'최신범위.json').write_text(json.dumps({'task':'MAIN01-20261110-B87520F7','iteration':1,'amendment':str(amend),'sha256':digest,'desiredDeliverables':['남성체1안','여성체1안'],'states':['Idle','Start','Walk','Run','Stop'],'delivery':d['result'],'acknowledgement':'pending_actual_worker_confirmation'},ensure_ascii=False,indent=2),encoding='utf-8')
