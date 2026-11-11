from pathlib import Path
import importlib.util,json,subprocess

H=Path(__file__).resolve().parent; R=Path('C:/Users/user/Desktop/Grid Defenders'); receipt=H/'실제발송영수증.json'
if receipt.exists(): raise SystemExit('실제 시도 영수증이 있습니다. worker-start를 반복하지 않습니다.')
c=json.loads((H/'연결.json').read_text(encoding='utf-8')); assert c['state']=='prepared_not_sent'
cmd=['C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe','orchestration','worker-start','--spec-file',c['plan']['prompt'],'--worktree',c['workspace'],'--agent','codex','--model',c['model'],'--effort',c['effort'],'--run','run_47ce1a81d7b1','--task-title',c['task']+' 캐릭터 보정·이펙트 동기 공방','--keep-open','--json']
cp=subprocess.run(cmd,capture_output=True,text=True,encoding='utf-8',errors='replace'); receipt.write_text(cp.stdout+('\n'+cp.stderr if cp.stderr else ''),encoding='utf-8'); print(cp.stdout,flush=True)
if cp.returncode: raise SystemExit(cp.returncode)
d=json.loads(cp.stdout)
if not d.get('ok'): raise SystemExit('공식 기동 미확인. failedStage 확인 후 복구 지침을 읽고 재실행은 금지합니다.')
spec=importlib.util.spec_from_file_location('board',R/'작업관리/도구/작업대장.py'); m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m); b=m.Board(R/'작업관리'); b.record(c['task'],'main01','sent',receipt)
c.update(state='delivery_receipt_recorded',delivery=d['result']); (H/'연결.json').write_text(json.dumps(c,ensure_ascii=False,indent=2),encoding='utf-8')
with (H/'3_작업일지.md').open('a',encoding='utf-8') as f: f.write('\n공식 Orca 감독 작업을 기존 effects 작업 공간에 연결했다. 실제 발송영수증/Task/Dispatch 보존. 현재 차수 필독/착수·실제 구현 회신 대기.\n')
print(json.dumps({'task':c['task'],'state':c['state']},ensure_ascii=False))
