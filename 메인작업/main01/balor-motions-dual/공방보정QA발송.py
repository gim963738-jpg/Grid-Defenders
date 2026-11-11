from pathlib import Path
import importlib.util,json,subprocess
R=Path('C:/Users/user/Desktop/Grid Defenders');S=R/'작업관리';H=R/'메인작업/main01/balor-motions-dual/workshop-correction-v001/qa'
p=H/'연결.json';c=json.loads(p.read_text(encoding='utf-8-sig'));receipt=H/'실제발송영수증.json'
if receipt.exists():raise SystemExit('영수증 존재. 중복 발송 금지.')
assert c['state']=='prepared_not_sent'
body=f"main01 {c['task']} 차수1 / 기존 발로르 공방 보정의 독립 기술 검증. 전체 전문지시·자동필독 {c['plan']['prompt']} . 새 read-pack 본문→현재SHA/문서별적용 ACK→start 후 자기 {c['output']} 에만 검증/화면/5종기록을 남깁니다. 원본/보정 독립성·동기·검끝 갭과 좌표·복구/시간 경계 회귀를 실제 새 문맥에서 검사합니다. 새 Sunburst13장 생성/미적검수와는 별개이며 사용자화면/제품/API/Git 변경0. 공식 새Task/Dispatch worker_done으로main01 run_47ce1a81d7b1에 실제outcome과 보고경로를 반환하세요."
cmd=['C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe','orchestration','send','--to','dispatch:'+c['targetDispatch'],'--type','dispatch','--subject',c['task']+' 발로르 공방 보정 독립 기술 검증','--body',body,'--json']
cp=subprocess.run(cmd,capture_output=True,text=True,encoding='utf-8',errors='replace');receipt.write_text(cp.stdout+('\n'+cp.stderr if cp.stderr else ''),encoding='utf-8');print(cp.stdout,flush=True)
if cp.returncode:raise SystemExit(cp.returncode)
d=json.loads(cp.stdout);assert d.get('ok'),'전달 불명확. 복구 지침 전 중복 발송 금지.'
spec=importlib.util.spec_from_file_location('board',S/'도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(S);b.record(c['task'],'main01','sent',receipt)
c.update(state='delivery_receipt_recorded',delivery=d['result']);p.write_text(json.dumps(c,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'task':c['task'],'state':c['state']},ensure_ascii=False))
