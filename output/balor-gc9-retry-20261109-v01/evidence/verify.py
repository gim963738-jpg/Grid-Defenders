from pathlib import Path
import json,hashlib
O=Path(__file__).resolve().parents[1]
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
m=json.loads((O/'manifest.json').read_text(encoding='utf-8'))
checks=[]
for r in m['generation_inputs']+m['observed_comparison_sources']:
 checks.append({'path':r['path'],'original_unchanged':sha(r['path'])==r['sha256'],'preserved_copy_matches':sha(O/r['local'])==r['sha256']})
a=json.loads((O/'evidence/읽기확인.json').read_text(encoding='utf-8-sig'))
reading=[{'path':r['path'],'hash_current':sha(r['path'])==r['sha256']} for r in a['documents']]
extra=[]
S=Path('C:/Users/user/Desktop/Grid Defenders/작업관리')
for p in [O.parents[1]/'문서/00_개발규칙/캐릭터스프라이트제작규약.md',O.parents[1]/'작업연결.json',S/'작업대장.md',S/'브랜치목록.json',S/'도메인/세계관/캐릭터/캐릭터 일러스트/index.json',S/'작업/MAIN03-20261109-21F94B82/발송지시-v001.md']:
 extra.append({'path':str(p),'sha256':sha(p),'applies':'본문 또는 splash 해당항목 확인; 단일 정면과 기존원본 읽기전용 범위 적용'})
result={'task':m['task'],'iteration':1,'source_checks':checks,'reading_checks':reading,'additional_readings':extra,'output_sha_matches':sha(O/'front.png')==m['output']['sha256'],'all_originals_and_reading_hashes_match':all(r['original_unchanged'] and r['preserved_copy_matches'] for r in checks) and all(r['hash_current'] for r in reading),'technical_acceptance':False,'user_approval':None,'actual_generation_calls':1,'actual_generated_pngs':1}
(O/'evidence/verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in result.items() if k not in ['source_checks','reading_checks','additional_readings']},ensure_ascii=False,indent=2))
