from pathlib import Path
import importlib.util,json,subprocess
R=Path('C:/Users/user/Desktop/Grid Defenders');H=Path(__file__).resolve().parent/'qa-v002';receipt=H/'실제발송영수증.json'
if receipt.exists():raise SystemExit('영수증 존재/중복발송금지')
c=json.loads((H/'연결.json').read_text(encoding='utf-8'));assert c['state']=='prepared_not_sent'
body=f"{c['task']} 차수1 qa / 원공방 {c['parentTask']} 기술수정 {c['fixTask']} v002 독립 재검증입니다. 본인 최초QA {c['previousQa']} FAIL 2원인을제작팀이수정반환했고main01이현재두파일해시를확인했습니다. 전체전문지시/새필독: {c['plan']['prompt']} . 이번read-pack본문·현재SHA/적용ACK→start 후,기존52재현과정확시간경계/실제불량JSON비동기거부·활성문서/undo·redo보존/정상독립복구/관련좌표·모바일회귀를새고정본에서검사하세요. 기존5182+격리문맥,자기출력 {c['output']} 만사용하고제작원본·사용자작품·화면/실게임/API/Git변경0. 실제outcome·원작업/수정/재검증번호와보고경로를공식새Task/Dispatch worker_done으로main01 run_47ce1a81d7b1에회신하세요."
cmd=['C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe','orchestration','send','--to','dispatch:'+c['targetDispatch'],'--type','dispatch','--subject',c['task']+' 공방 수정본 독립 재검증','--body',body,'--json']
cp=subprocess.run(cmd,capture_output=True,text=True,encoding='utf-8',errors='replace');receipt.write_text(cp.stdout+('\n'+cp.stderr if cp.stderr else ''),encoding='utf-8');print(cp.stdout,flush=True)
if cp.returncode:raise SystemExit(cp.returncode)
d=json.loads(cp.stdout);assert d.get('ok'),'전달미확인/공식복구지침참조/중복발송금지'
spec=importlib.util.spec_from_file_location('board',R/'작업관리/도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(R/'작업관리');b.record(c['task'],'main01','sent',receipt)
c.update(state='delivery_receipt_recorded',delivery=d['result']);(H/'연결.json').write_text(json.dumps(c,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({'task':c['task'],'state':c['state']},ensure_ascii=False))
