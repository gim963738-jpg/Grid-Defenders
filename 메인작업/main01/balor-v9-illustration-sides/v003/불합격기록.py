from pathlib import Path
import json,importlib.util
H=Path(__file__).resolve().parent;R=Path('C:/Users/user/Desktop/Grid Defenders');l=json.loads((H/'연결.json').read_text(encoding='utf-8'))
receipt=H/'불합격기록.json'
if receipt.exists():raise SystemExit('Verdict already recorded; inspect before repeating.')
spec=importlib.util.spec_from_file_location('board',R/'작업관리/도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(R/'작업관리');t=b.load(l['task'],'main01')
assert t['iteration']==3 and t['status']=='awaiting_user'
t=b.record(l['task'],'main01','revise',H/'사용자불합격.md','불합격주고 2.6 이미지 사용으로 진행하고 SD캐릭터 진행 2.6과 동시진행 35도 90도 전투태세(오른쪽에서 오는 적을 방패로 막을 준비를 하면서 한손으로는 검을들고있는자세)')
d={'task':l['task'],'rejectedIteration':3,'userVerdict':'rejected','boardIteration':t['iteration'],'boardStatus':t['status'],'nextIllustrationProduction':'on_hold_not_dispatched','sdRequest':'awaiting_generation_routes_count_clarification','newGenerationCalls':0,'image26Calls':0,'source':str(H/'사용자불합격.md')}
receipt.write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf-8');l.update(state='user_rejected',verdictEvidence=str(H/'사용자불합격.md'));(H/'연결.json').write_text(json.dumps(l,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(d,ensure_ascii=False))
