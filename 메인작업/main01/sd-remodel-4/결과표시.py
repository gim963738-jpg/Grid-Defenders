from pathlib import Path
import importlib.util,json,subprocess
HERE=Path(__file__).resolve().parent;ROOT=Path('C:/Users/user/Desktop/Grid Defenders')
link=json.loads((HERE/'연결.json').read_text(encoding='utf-8'))
output=Path(link['output']);receipt=HERE/'비교표시영수증.json'
if receipt.exists():raise SystemExit('Display already attempted: inspect the receipt before repeating any navigation')
page='140a904a-3ec6-4cd6-8b32-6b2cb642754c'
exe='C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe'
argv=[exe,'goto','--page',page,'--url',(output/'index.html').as_uri(),'--json']
p=subprocess.run(argv,capture_output=True,encoding='utf-8')
try:result=json.loads(p.stdout[p.stdout.index('{'):])
except (ValueError,json.JSONDecodeError):result={'ok':False,'raw':p.stdout,'stderr':p.stderr}
receipt.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(result,ensure_ascii=False,indent=2))
if p.returncode or not result.get('ok'):raise SystemExit('Display not confirmed; inspect receipt, do not claim success')
spec=importlib.util.spec_from_file_location('board',ROOT/'작업관리/도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
b=m.Board(ROOT/'작업관리');task=b.load(link['task'],'main01')
if task['status']=='in_progress':b.record(link['task'],'main01','returned',output/'report.md')
(HERE/'총괄검토.md').write_text('''# 총괄 검토

기존 원본+신규4안 비교 PNG와 팀장 검수 보고서를 열어 확인했다. 새 이미지4개와 비교자료가 존재한다. 사용자 판정은 대기다.
1/2/4안 차이가 3안보다 작고 신체비율 및 원본 캔버스 프레이밍에 미달 조건이 있어 최종 제작규격 통과로 승인하지 않는다. 이번 결과는 선택용 시안으로 제시한다.
사용자가 지정했던 기존 오른쪽 게임 브라우저 페이지 하나에 비교 HTML을 표시했다. 다른 화면/모델설정/창/패널은 조작하지 않았다. 실제 표시 결과는 비교표시영수증.json을 따른다.
''',encoding='utf-8')
