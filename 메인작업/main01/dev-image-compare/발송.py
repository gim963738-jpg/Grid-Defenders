from pathlib import Path
import importlib.util,json,subprocess
HERE=Path(__file__).resolve().parent;ROOT=Path('C:/Users/user/Desktop/Grid Defenders')
link=json.loads((HERE/'작업연결.json').read_text(encoding='utf-8'));receipt=HERE/'실제발송영수증.json'
exe='C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe'
if receipt.exists():raise SystemExit('Already attempted: inspect receipt; never duplicate')
body='main01 사용자 확인 작업 '+link['task']+': 개발자 이미지 대조/전장 임시 배치/배치 후 크기조절. 현재 MAIN02-20261109-063FC22B는 output 시안이미지만 소유하고 게임코드 수정 제외임을 확인했습니다. gameplay 별도 작업공간에서 신규 devImageCompare.ts/css와 테스트/최소 main.ts 통합패치만 제작하고, main01이 최종검토 후 UI 작업공간 및 root5173 게임에 해당 모듈/연결점만 단독 반영합니다. main02 시안/기록/규정은 수정하지 않습니다. 공통 main.ts는 최종통합 시 해시 재확인합니다.'
notice=subprocess.run([exe,'orchestration','send','--to','run:run_2939978c8e65','--subject','main01 개발자 미리보기 코드 소유 범위','--type','status','--body',body,'--json'],capture_output=True,encoding='utf-8')
(HERE/'main02협업공지.json').write_text(notice.stdout or notice.stderr,encoding='utf-8')
argv=[exe,'orchestration','worker-start','--spec-file',link['plan']['prompt'],'--worktree',link['plan']['selector'],
      '--agent','codex','--model','gpt-6.1-sol','--effort','medium','--keep-open','--task-title','개발자 이미지 대조·전장 배치·크기 조절','--json']
(HERE/'발송시도.json').write_text(json.dumps(argv,ensure_ascii=False,indent=2),encoding='utf-8')
p=subprocess.run(argv,capture_output=True,encoding='utf-8')
try:reply=json.loads(p.stdout[p.stdout.index('{'):])
except (ValueError,json.JSONDecodeError):
 receipt.write_text(json.dumps({'raw':p.stdout,'stderr':p.stderr,'code':p.returncode},ensure_ascii=False),encoding='utf-8')
 raise SystemExit('Ambiguous launch; inspect receipt and official recovery guide')
receipt.write_text(json.dumps(reply,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(reply,ensure_ascii=False,indent=2),flush=True)
if p.returncode or not reply.get('ok'):raise SystemExit('Failed launch; read failedStage and official recovery, do not repeat')
spec=importlib.util.spec_from_file_location('board',ROOT/'작업관리/도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
m.Board(ROOT/'작업관리').record(link['task'],'main01','sent',receipt)
print('Actual receipt connected to '+link['task'])
