from pathlib import Path
import importlib.util,json,subprocess
ROOT=Path('C:/Users/user/Desktop/Grid Defenders');HERE=Path(__file__).resolve().parent
link=json.loads((HERE/'연결.json').read_text(encoding='utf-8'));folder=Path(link['folder']);base=Path(link['output']);out=base/'directions_v02'
failed=json.loads((HERE/'방향추가발송영수증-v002.json').read_text(encoding='utf-8'))
if failed.get('error',{}).get('code')!='invalid_argument' or 'Invalid --type' not in failed['error']['message']:raise SystemExit('Uncertain prior send: do not retry')
receipt=HERE/'방향추가실제영수증-v002.json'
if receipt.exists():raise SystemExit('Already sent: never duplicate')
exe='C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe'
plan=json.loads((folder/'발송준비-v002.json').read_text(encoding='utf-8'));body=Path(plan['prompt']).read_text(encoding='utf-8')
p=subprocess.run([exe,'orchestration','send','--to','dispatch:ctx_b184fbb5e644','--subject','금발전사4안 우측45/90도 추가 제작·차수2','--type','dispatch','--body',body,'--json'],capture_output=True,encoding='utf-8')
try:reply=json.loads(p.stdout[p.stdout.index('{'):])
except (ValueError,json.JSONDecodeError):reply={'ok':False,'raw':p.stdout,'stderr':p.stderr}
receipt.write_text(json.dumps(reply,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(reply,ensure_ascii=False,indent=2),flush=True)
if p.returncode or not reply.get('ok'):raise SystemExit('Inspect failure: no automatic retry')
spec=importlib.util.spec_from_file_location('board',ROOT/'작업관리/도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
m.Board(ROOT/'작업관리').record(link['task'],'main01','sent',receipt)
feature=f'''사용자 추가: 금발전사 신규4안 각각 오른쪽 앞3/4(약45도)·오른쪽 정측면90도를 캐릭터 팀장이 제작합니다. 이미지 대조 도구에 front/right45/right90 방향 선택을 추가해 같은 안의 방향을 골라 배치하고, 배치 후 방향교체/크기조절해도 발 기준점과 위치를 유지해주세요. 생성폴더 {out}, asset-manifest.json에 original/variant1~4 ×3방향15개, 파일명 variant-N-front.png,variant-N-right-045.png,variant-N-right-090.png 및 original-front.png,original-right-045.png,original-right-090.png입니다. 정면5개와원형측면2개는기존원본그대로,신규8장만생성합니다. 우선 모듈/정면 기능을 계속 개발하고 방향 데이터는 분리하세요. 생성중인 측면을 임의반전/대체그림으로 완료처리하지마세요. 결과시점에 신규PNG가없으면 코드검증범위와자산대기를나눠 보고하면 총괄이 후속통합합니다. 기존 MAIN01-20261109-F89105C9 범위추가이며 사용자직접지시 근거는 {HERE/'사용자방향추가.md'}입니다. 새지시를 읽고작업기록에적용내용을남기고 진행하세요. 사용자재승인은불필요합니다.'''
notice=subprocess.run([exe,'orchestration','send','--to','dispatch:ctx_90265d63e2c3','--subject','추가 기능: 정면·오른쪽45·오른쪽90 선택','--type','status','--body',feature,'--json'],capture_output=True,encoding='utf-8')
(HERE/'게임개발방향추가공지.json').write_text(notice.stdout or notice.stderr,encoding='utf-8');print(notice.stdout,flush=True)
