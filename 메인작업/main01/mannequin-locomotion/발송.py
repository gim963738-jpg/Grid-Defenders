from pathlib import Path
import importlib.util,json,subprocess
R=Path('C:/Users/user/Desktop/Grid Defenders');H=Path(__file__).resolve().parent;p=H/'실제발송영수증.json'
if p.exists():raise SystemExit('Receipt exists; do not resend.')
l=json.loads((H/'연결.json').read_text(encoding='utf-8'));plan=l['plan']
body=(f"main01 신규 승인 작업 {l['task']} 차수1. 최신 사용자 원문: '지금이작업은 이미지 작업이라기보단 코딩작업에 가까워보이니 GPT2.6은 사용하지않고 진행하자 / Idle 기본 대기 / 시작/ Walk / Run / 정지'. "
      f"필독 자동첨부 발송문 {plan['prompt']} 전체를 읽고 이번 작업 새 ACK/start 후 제작하세요. "
      "금발전사 비율·우측3/4의 옷/헤어/장비 없는 단순한 전신 코드 마네킹+공통 본, Idle/Start/Walk/Run/Stop를 서로 다른 전신움직임3안으로 비교. "
      "GPT2.6뿐 아니라 모든 이미지/영상 생성·외부 제작 API 및 env/키 열람 금지. SVG/Canvas 코드 도형·본과 로컬 렌더만 사용. 기존 A/B·게임코드·규정·사용자 화면·Git 건드리지 않음. "
      "이전 B는 성공 반환·awaiting_user로 정리됨. 의상/헤어 연결·공격/스킬은 후속이며 이번 제작에 넣지 마세요. "
      f"새 출력 {l['output']}만 편집하고 실제 연속동작/접지/루프·상태연결/밝은배경/작은표시 검사 후 worker_done으로 보고. 같은 필독 및 작업 절차를 필요한 하위 담당에게도 전달하고 최종속도·미적합격은 사용자에게 남겨두세요.")
cmd=['C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe','orchestration','send','--to','dispatch:ctx_c31804ccdcad','--type','dispatch','--subject',l['task']+' 코드 전용 마네킹 Idle·Start·Walk·Run·Stop 3안','--body',body,'--json']
r=subprocess.run(cmd,capture_output=True,text=True,encoding='utf-8',errors='replace');p.write_text(r.stdout+('\n'+r.stderr if r.stderr else ''),encoding='utf-8');print(r.stdout,flush=True)
if r.returncode:raise SystemExit(r.returncode)
d=json.loads(r.stdout)
if not d.get('ok'):raise SystemExit('No successful receipt; inspect before recovery.')
spec=importlib.util.spec_from_file_location('board',R/'작업관리/도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(R/'작업관리');b.record(l['task'],'main01','sent',p)
l['state']='delivery_receipt_recorded';l['delivery']=d['result'];(H/'연결.json').write_text(json.dumps(l,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({'task':l['task'],'state':l['state']},ensure_ascii=False),flush=True)
