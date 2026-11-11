from pathlib import Path
import importlib.util,json,subprocess
R=Path('C:/Users/user/Desktop/Grid Defenders');S=R/'작업관리';H=R/'메인작업/main01/blond-motion-apply/visual-spacing-v003';p=H/'연결.json';c=json.loads(p.read_text(encoding='utf-8-sig'));receipt=H/'실제발송영수증.json'
if receipt.exists():raise SystemExit('영수증 존재. 중복 발송 금지.')
assert c['state']=='prepared_not_sent'
body=f"main01 {c['task']} 차수1 / v002 후기 보스 머리 상단 잘림 보완. main01이 실제 arena-boss-late.png를 열어 확인했고 아직 root 미반영입니다. 전체 전문지시·자동필독 {c['plan']['prompt']} . 새 read-pack/현재SHA·적용ACK/start 후 자기 새 {c['output']} 에서만 수정합니다. 기존 앞발 등록·분리·180CSS·사거리100·PNG·전투수치는 유지하고 통상 후반까지 실제 전체외형의 전장 경계를 검증하세요. 최종 누적 patch before는 현재 root v001입니다. 사용자 창/서버·원본/타팀/API/Git 변경0. 공식 새Task/Dispatch worker_done으로 main01 run_47ce1a81d7b1에 실제outcome과 경로를 반환하세요."
cmd=['C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe','orchestration','send','--to','dispatch:'+c['targetDispatch'],'--type','dispatch','--subject',c['task']+' 전장 후기 터틀 상단 잘림 보완','--body',body,'--json']
cp=subprocess.run(cmd,capture_output=True,text=True,encoding='utf-8',errors='replace');receipt.write_text(cp.stdout+('\n'+cp.stderr if cp.stderr else ''),encoding='utf-8');print(cp.stdout,flush=True)
if cp.returncode:raise SystemExit(cp.returncode)
d=json.loads(cp.stdout);assert d.get('ok'),'전달 미확인. 복구 지침 전 중복 발송 금지.'
spec=importlib.util.spec_from_file_location('board',S/'도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(S);b.record(c['task'],'main01','sent',receipt)
c.update(state='delivery_receipt_recorded',delivery=d['result']);p.write_text(json.dumps(c,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({'task':c['task'],'state':c['state']},ensure_ascii=False))
