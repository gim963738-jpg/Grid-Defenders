from pathlib import Path
import importlib.util
import json
import subprocess

R = Path('C:/Users/user/Desktop/Grid Defenders')
S = R/'작업관리'
H = R/'메인작업/main01/balor-motions-dual/workshop-correction-v001'
p = H/'연결.json'
c = json.loads(p.read_text(encoding='utf-8-sig'))
receipt = H/'실제발송영수증.json'
if receipt.exists():
    raise SystemExit('발송 영수증이 있습니다. 중복 발송하지 않습니다.')
assert c['state'] == 'prepared_not_sent'
body = (f"main01 {c['task']} 차수1. 발로르 공방 보정 작업을 실제 승인받았습니다. "
        f"자동 필독이 붙은 전체 전문 지시: {c['plan']['prompt']} . "
        "기존 내장/2.6 대기·횡베기·종베기6시트의 보정 초안, 원본/보정 동기 비교, 수동 검끝 궤적 표시입니다. "
        "이번 새 read-pack 본문→문서별 현재 SHA/적용 ACK→start 후 착수하세요. "
        "사용자가 직접 조절할 수 있는 초안을 제공하며 과거 아트 품질 실패를 이유로 전부 다시 중단하지 않습니다. "
        "원본 보존, API/이미지 생성/2.6/영상/Git/실게임/사용자 현재창 조작0입니다. "
        f"자기 결과 {c['output']} 에 5종 기록과 검증/변경/한계를 취합하고 "
        "공식 새 Task/Dispatch worker_done으로 main01 run_47ce1a81d7b1에 실제 outcome과 경로를 반환하세요.")
cmd = ['C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe', 'orchestration', 'send',
       '--to', 'dispatch:'+c['targetDispatch'], '--type', 'dispatch', '--subject',
       c['task']+' 발로르 공방 보정 초안·비교·검끝 궤적', '--body', body, '--json']
cp = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='replace')
receipt.write_text(cp.stdout+('\n'+cp.stderr if cp.stderr else ''), encoding='utf-8')
print(cp.stdout, flush=True)
if cp.returncode:
    raise SystemExit(cp.returncode)
d = json.loads(cp.stdout)
assert d.get('ok'), '공식 전달 미확인. 복구 절차 확인 전 중복 발송 금지.'
spec = importlib.util.spec_from_file_location('board', S/'도구/작업대장.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
b = m.Board(S)
b.record(c['task'], 'main01', 'sent', receipt)
c.update(state='delivery_receipt_recorded', delivery=d['result'])
p.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'task': c['task'], 'state': c['state']}, ensure_ascii=False))
