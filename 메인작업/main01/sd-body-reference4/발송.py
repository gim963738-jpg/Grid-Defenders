from pathlib import Path
import importlib.util,json,subprocess
R=Path('C:/Users/user/Desktop/Grid Defenders');H=Path(__file__).resolve().parent;p=H/'실제발송영수증.json'
if p.exists():raise SystemExit('Delivery receipt exists; inspect before recovery, do not resend.')
l=json.loads((H/'연결.json').read_text(encoding='utf-8'));plan=l['plan']
body=(f"main01 정식 신규 작업 {l['task']} 차수1, 사용자 실제 최종승인 '진행'. "
      f"자동필독 첨부 발송문 {plan['prompt']} 본문과 필독 전부를 열어 읽고 새 ACK/start 후 생성하세요. "
      "최신 확정: SD금발전사 기준 민머리·불투명 검은 밀착 반팔티·짧은 반바지, 맨발·무장비, 자연스럽게 두 발로 선 동일 우측35도3/4뷰. "
      "남녀 실루엣이 어깨/상체/허리/골반/팔다리에서 분명히 다르게 보이되 과장하지 않음. 내장 image_gen 남1여1 + 기존 사용자API GPT Image2.6 남1여1 = 최종4장. "
      "지난 코드마네킹은 판단불가 피드백 대상이므로 새 이미지 화풍참조로 쓰지 말고 실제 blond-right-035 원본을 직접 열고 각 호출에 첨부하세요. "
      "이번은 실제 이미지 생성이며 지난 코드전용 금지는 그 이전 작업 범위입니다. 각 경로를 바꿔표시하거나 서로 자동대체하지 말고 유료API는2이미지2회로 시작, 실패/타임아웃 자동재시도·추가유료보완 금지. 키값은 메모리한정/절대무출력. "
      "기존 image-studio 어댑터/2.6-high 경로만 재사용, 리깅/영상/움직임/게임적용/현재창조작/공통규정수정/커밋푸시 없이 새output에만4PNG·2x2비교판/갤러리·검수/보고·실제사용량기록을 제출. "
      "4장 직접 열어검수하고 사용자 합격으로 자동처리하지 마세요. 완료시 worker_done으로 실제 파일/출처/호출수/usage/한계를 main01에 회신하세요.")
cmd=['C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe','orchestration','send','--to','dispatch:ctx_5794cdcf2e84','--type','dispatch','--subject',l['task']+' 서있는 SD 남녀4장: 내장2+GPT2.6 API2','--body',body,'--json']
r=subprocess.run(cmd,capture_output=True,text=True,encoding='utf-8',errors='replace');p.write_text(r.stdout+('\n'+r.stderr if r.stderr else ''),encoding='utf-8');print(r.stdout,flush=True)
if r.returncode:raise SystemExit(r.returncode)
d=json.loads(r.stdout)
if not d.get('ok'):raise SystemExit('No successful receipt; inspect before any resend.')
spec=importlib.util.spec_from_file_location('board',R/'작업관리/도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(R/'작업관리');b.record(l['task'],'main01','sent',p)
l['state']='delivery_receipt_recorded';l['delivery']=d['result'];(H/'연결.json').write_text(json.dumps(l,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({'task':l['task'],'state':l['state']},ensure_ascii=False),flush=True)
