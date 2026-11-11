from pathlib import Path
import importlib.util,json,subprocess
R=Path('C:/Users/user/Desktop/Grid Defenders');H=Path(__file__).resolve().parent/'qa';receipt=H/'실제발송영수증.json'
if receipt.exists():raise SystemExit('영수증 존재,중복 송신 금지')
c=json.loads((H/'연결.json').read_text(encoding='utf-8'));assert c['state']=='prepared_not_sent'
body=f"{c['task']} 차수1 qa / 승인된 원작업 {c['parentTask']}의 독립 기술검증입니다. 전체 실제 지시/필독 자동첨부: {c['plan']['prompt']} . 이번 read-pack본문→현재SHA/적용ACK→start 후 검사. 기존5182 공방과 격리headless/독립브라우저문맥,자기출력 {c['output']}만 사용. 제작원본/사용자작품·화면/게임/생성API/Git 변경0. 이미64+402 제작검사보고가 있으므로 위험한 좌표·시간·부착/독립파일복구·모바일·원본해시를 실제 집중 재현. 결함은 수정하지말고 재현근거로 반환. 공식새Task/Dispatch worker_done으로main01 run_47ce1a81d7b1에회신하세요."
cmd=['C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe','orchestration','send','--to','dispatch:'+c['targetDispatch'],'--type','dispatch','--subject',c['task']+' 캐릭터 합성 공방 독립 검증','--body',body,'--json']
cp=subprocess.run(cmd,capture_output=True,text=True,encoding='utf-8',errors='replace');receipt.write_text(cp.stdout+('\n'+cp.stderr if cp.stderr else ''),encoding='utf-8');print(cp.stdout,flush=True)
if cp.returncode:raise SystemExit(cp.returncode)
d=json.loads(cp.stdout);assert d.get('ok'),'공식전달미확인. 중복발송대신복구지침확인'
spec=importlib.util.spec_from_file_location('board',R/'작업관리/도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(R/'작업관리');b.record(c['task'],'main01','sent',receipt)
c.update(state='delivery_receipt_recorded',delivery=d['result']);(H/'연결.json').write_text(json.dumps(c,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'task':c['task'],'state':c['state']},ensure_ascii=False))
