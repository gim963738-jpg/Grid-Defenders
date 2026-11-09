from pathlib import Path
import importlib.util,json,subprocess,hashlib
ROOT=Path('C:/Users/user/Desktop/Grid Defenders');S=ROOT/'작업관리';HERE=Path(__file__).resolve().parent
receipt=HERE/'신규4안-v002-실제발송영수증.json'
if receipt.exists():raise SystemExit('Already attempted; inspect receipt, do not duplicate.')
link=json.loads((HERE/'신규4안-v002-연결.json').read_text(encoding='utf-8'));plan=link['plan']
spec=importlib.util.spec_from_file_location('board',S/'도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(S)
task=b.load(link['task'],'main01');p=Path(plan['prompt'])
if task['iteration']!=2 or task['status']!='prepared' or b.hashes(task)!=task['approval']['hashes']:raise SystemExit('Scope/state changed before send.')
if hashlib.sha256(p.read_bytes()).hexdigest()!=plan['promptSha256']:raise SystemExit('Prepared text changed.')
exe='C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe'
notice='main01 사용자 직접 지시로 기존 개발자 이미지 대조에 금발전사 두상확대 정면4안을 추가합니다. 기존15개유지+새정면4개, 총19개. 기존 gameplay 제작자가 자기 새output에서 구현/패치를 제출하고 main01이 UI작업공간의 devImageCompare.ts/devImageCompareArt.ts/devImageCompare.css와새전용자산만 좁게 통합합니다. UI시안output/main02작업은편집하지않고 main.ts/일반게임UI도범위제외입니다. 현재UI브랜치잠금없음을확인했습니다. 이번기능추가는새저장요청이아니므로커밋/푸시하지않습니다. 파일충돌이있으면실제경로와함께알려주세요. 사용자화면조작없음.'
q=subprocess.run([exe,'orchestration','send','--to','run:run_2939978c8e65','--subject','파일경계 공지: main01 이미지 대조 신규4안 추가','--type','status','--body',notice,'--json'],capture_output=True,encoding='utf-8')
(HERE/'신규4안-v002-main02공지.json').write_text(q.stdout or q.stderr,encoding='utf-8')
r=subprocess.run([exe,'orchestration','send','--to','dispatch:ctx_90265d63e2c3','--subject','이미지 대조에 신규 두상확대 정면4안 추가 / 차수2','--type','dispatch','--body',p.read_text(encoding='utf-8'),'--json'],capture_output=True,encoding='utf-8')
try:data=json.loads(r.stdout[r.stdout.index('{'):])
except (ValueError,json.JSONDecodeError):data={'ok':False,'stdout':r.stdout,'stderr':r.stderr}
receipt.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(data,ensure_ascii=False,indent=2),flush=True)
if r.returncode or not data.get('ok'):raise SystemExit('Inspect error; no automatic retry.')
t=b.record(task['id'],'main01','sent',receipt)
print(json.dumps({'task':t['id'],'iteration':t['iteration'],'state':t['status'],'committed':False,'pushed':False},ensure_ascii=False),flush=True)
