from pathlib import Path
import importlib.util,json,subprocess
ROOT=Path('C:/Users/user/Desktop/Grid Defenders')
HERE=Path(__file__).resolve().parent
receipt=HERE/'실제발송영수증.json'
if receipt.exists():raise SystemExit('Existing delivery receipt: inspect before any resend.')
plan=json.loads((HERE/'발송준비.json').read_text(encoding='utf-8'))
body=(f"main01 정식 B안 지시, 작업 {plan['task']} / 차수1. 사용자 실제 승인 'B안 진행'. "
      f"발송문 {plan['prompt']} 본문과 자동 필독 전부를 읽고 B의 새 ACK/start를 통과한 뒤 착수하세요. "
      "선행 A MAIN01-20261110-0FE35B71은 실제 성공 반환 및 Board awaiting_user 전환 완료. 사용자 합격은 아님. "
      "A-frozen-contract.json의 원본/rig/animations/renderer SHA를 main01이 대조했고 동일했습니다. "
      "같은 원본·관절·3클립으로 이미지 파츠 생성 경로만 GPT Image2.6 이미지API로 비교합니다. "
      "API키 값은 절대 로그/회신/산출물/명령 인자에 쓰지 말고 기존 파일에서 메모리로만 읽으세요. "
      "이미지 비용만 사용, 리깅은 로컬. 실패/타임아웃 자동 재시도·다른 모델 대체 금지. "
      "A는 덮어쓰지 마세요. A 검토에서 확인한 파츠 경계 잔여 픽셀과 큰 회전의 천 겹침도 B 검수에서 비교·기록하되 공통 모션은 바꾸지 마세요. "
      "화면 조작/게임 적용/새 부위 확대/커밋·푸시 없이 준비된 B 출력 폴더에만 제작하고 worker_done으로 실제 호출수·사용량/동기 비교/검수와 보고 경로를 회신하세요.")
command=['C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe',
         'orchestration','send','--to','dispatch:ctx_3e4dd44a42e7','--type','dispatch',
         '--subject','MAIN01-20261110-DE754BC7 B안 정식 하달: GPT Image2.6 파츠+동일 리깅3안',
         '--body',body,'--json']
p=subprocess.run(command,capture_output=True,text=True,encoding='utf-8',errors='replace')
receipt.write_text(p.stdout+(('\n'+p.stderr) if p.stderr else ''),encoding='utf-8')
print(p.stdout,flush=True)
if p.returncode:raise SystemExit(p.returncode)
data=json.loads(p.stdout)
if not data.get('ok'):raise SystemExit('Orca send did not report ok; receipt preserved.')
spec=importlib.util.spec_from_file_location('board',ROOT/'작업관리/도구/작업대장.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(ROOT/'작업관리')
b.record(plan['task'],'main01','sent',receipt)
link=json.loads((HERE/'연결.json').read_text(encoding='utf-8'))
link['state']='delivery_receipt_recorded';link['deliveryReceipt']=str(receipt)
(HERE/'연결.json').write_text(json.dumps(link,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'boardStatus':b.load(plan['task'],'main01')['status']},ensure_ascii=False),flush=True)
