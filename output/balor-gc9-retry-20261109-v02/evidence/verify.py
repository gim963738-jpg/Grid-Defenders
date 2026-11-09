from pathlib import Path
import json,hashlib
O=Path(__file__).resolve().parents[1]
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
m=json.loads((O/'manifest.json').read_text(encoding='utf-8'))
a=json.loads((O/'evidence/읽기확인.json').read_text(encoding='utf-8-sig'))
r=[]
for d in a['documents']:r.append({'path':d['path'],'expected_sha256':d['sha256'],'current_matches':sha(d['path'])==d['sha256']})
refs=[]
for d in m['inputs']:refs.append({'path':d['path'],'original_unchanged':sha(d['path'])==d['sha256'],'local_copy_matches':sha(O/d['local'])==d['sha256']})
v1=O.parent/'balor-gc9-retry-20261109-v01'
old=json.loads((v1/'manifest.json').read_text(encoding='utf-8'))
history=[]
for d in old['generation_inputs']+old['observed_comparison_sources']:history.append({'path':d['path'],'original_unchanged':sha(d['path'])==d['sha256']})
result={'task':m['task'],'iteration':2,'readings':r,'references':refs,'v01_historical_source_checks':history,'v01_png_preserved':sha(v1/'front.png')=='6675a0243f67018af29eaeea1af43f7ccf6e0d9ab96ef3d8f3be830d6afd96d9','output_hash_matches':sha(O/'front.png')==m['after']['sha256'],'generated_original_copy_matches':m['after']['source_copy_matches'],'all_readings_current':all(x['current_matches'] for x in r),'all_references_preserved':all(x['original_unchanged'] and x['local_copy_matches'] for x in refs) and all(x['original_unchanged'] for x in history),'actual_generation_calls':1,'actual_output_pngs':1,'local_change_inspected':True,'technical_acceptance':False,'user_approval':None}
(O/'evidence/verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in result.items() if k not in ['readings','references','v01_historical_source_checks']},ensure_ascii=False,indent=2))
