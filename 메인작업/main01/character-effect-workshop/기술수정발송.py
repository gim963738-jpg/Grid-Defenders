from pathlib import Path
import importlib.util,json,subprocess
R=Path('C:/Users/user/Desktop/Grid Defenders');H=Path(__file__).resolve().parent/'technical-fix-v002';receipt=H/'실제발송영수증.json'
if receipt.exists():raise SystemExit('영수증이 있습니다. 중복 발송하지 않습니다.')
c=json.loads((H/'연결.json').read_text(encoding='utf-8'));assert c['state']=='prepared_not_sent'
body=f"main01 {c['task']} 차수1 effects / 기존 공방 {c['parentTask']} 승인 범위의 기술 버그 수정입니다. 독립QA {c['qaTask']}가 49PASS/3FAIL, 결함2건으로 최종반환했습니다. 전체 지시·현필독 자동첨부: {c['plan']['prompt']} . 이번 read-pack본문/현재SHA/적용ACK→start 후 착수. effectFrame의0.2시작/10FPS/0.3초 index1 경계오차와 points/keys 배열수락을 수정하고 실제비동기 파일입력 거부/활성문서·이력보존,유효독립복구·집중검사/build를 확인하세요. 구체적재현/원본SHA는 전문지시·QA보고에 있습니다. 새스키마/UI·원화·유료API·타팀·실게임·Git·사용자창 변경0. v001이력보존, 새 {c['output']} 에전후SHA/patch/5종기록/검사·실제보고를 취합하고 공식새Task/Dispatch worker_done으로main01 run_47ce1a81d7b1에 반환하세요. 독립재검증은main01이별도 연결합니다. 같은사용자승인을다시요청하지않습니다."
cmd=['C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe','orchestration','send','--to','dispatch:'+c['targetDispatch'],'--type','dispatch','--subject',c['task']+' 공방 QA 기술결함2건 수정','--body',body,'--json']
cp=subprocess.run(cmd,capture_output=True,text=True,encoding='utf-8',errors='replace');receipt.write_text(cp.stdout+('\n'+cp.stderr if cp.stderr else ''),encoding='utf-8');print(cp.stdout,flush=True)
if cp.returncode:raise SystemExit(cp.returncode)
d=json.loads(cp.stdout);assert d.get('ok'),'공식전달미확인. 복구지침확인/중복발송금지'
spec=importlib.util.spec_from_file_location('board',R/'작업관리/도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(R/'작업관리');b.record(c['task'],'main01','sent',receipt)
c.update(state='delivery_receipt_recorded',delivery=d['result']);(H/'연결.json').write_text(json.dumps(c,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({'task':c['task'],'state':c['state']},ensure_ascii=False))
