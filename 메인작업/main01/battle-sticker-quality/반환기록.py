from pathlib import Path
import json, importlib.util
H=Path(__file__).resolve().parent
R=Path('C:/Users/user/Desktop/Grid Defenders')
S=R/'작업관리'
link=json.loads((H/'연결.json').read_text(encoding='utf-8'))
review=json.loads((H/'http-review.json').read_text(encoding='utf-8'))
delivery=json.loads((H/'결과연결.json').read_text(encoding='utf-8'))
assert review['passed'] and all(x['http']==200 for x in delivery['files'])
spec=importlib.util.spec_from_file_location('board',S/'도구/작업대장.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
b=m.Board(S); task=b.load(link['task'],'main01')
if task['status']=='in_progress':
 b.record(link['task'],'main01','returned',Path(link['output'])/'보고.md')
task=b.load(link['task'],'main01')
assert task['status']=='awaiting_user',task['status']
link.update(state='awaiting_user',gallery=delivery['gallery'],mainVerification=str(H/'검증결과.md'))
(H/'연결.json').write_text(json.dumps(link,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'task':task['id'] if 'id' in task else link['task'],'status':task['status'],'httpFiles':len(delivery['files']),'gallery':delivery['gallery']},ensure_ascii=False))
