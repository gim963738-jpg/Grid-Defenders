import hashlib
import json
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[3]
out = Path(__file__).resolve().parent
exe = 'C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe'
body = '''사용자 직접 확정 운영 기본값입니다: “메인 3AI에게 전달해 내가 이거이렇게 해야겠다. 이렇게 진행해야겠다라고해도 항상 마지막에 멘트를 절차를확인후 작업하달을하겠다 진행하겠습니다 라고 체크하고 진행하는걸 기본값으로 맞춰놔”. 공유 원본 작업관리/메인보고형식.md의 새 v1.2 절과 자신의 기준/main02 또는 main03/작업진행방법.md 본문을 실제 읽고 적용해 주세요. 방향 정리/실행 안내 마지막 문장에 절차 확인 후 하달(직접 업무면 진행)의 다음 행동을 명시하고 실제 승인·범위·규정·최신판정·충돌/사전확인·공식 발송·담당 ACK/start 확인을 생략하지 않습니다. 승인 전에는 “진행 승인 대기 상태이며, 승인 후 절차를 확인하고 작업을 하달하겠습니다.”, 승인 후에는 “절차를 확인한 뒤 담당 팀장에게 작업을 하달하겠습니다.”, 이미 발송했으면 하달 완료와 이후 확인을 실제 상태대로 안내합니다. 기존 명시적 진행 전 대기와 무단 커밋/푸시 금지는 그대로 유지합니다. 이 공지로 작품을 재개/중단/복제하지 마세요. 새 부서 제작 지시가 아닌 총괄3메인의 기본 응답·절차 설정입니다. 읽은 실제 문서 경로/해시와 적용 요약을 run:run_47ce1a81d7b1로 회신해 주세요. 자기 진행 중 작업의 필독에 이 문서가 있다면 다음 해당 착수/반환에서 현 버전을 읽고 ACK를 갱신하되 과거 확인을 소급 작성하지 마세요.'''
for name, target in [('main02', 'run:run_2939978c8e65'), ('main03', 'run:run_b29b47372e51')]:
    r = subprocess.run([exe, 'orchestration', 'send', '--to', target, '--subject', '사용자 확정: 총괄3메인 절차 확인·마지막 실행 안내 기본값', '--type', 'status', '--body', body, '--json'], capture_output=True, text=True, encoding='utf-8')
    (out / (name + '-송신영수증.json')).write_text(r.stdout, encoding='utf-8')
    print(name, r.returncode, r.stdout, r.stderr)
paths = [root/'작업관리/메인보고형식.md'] + [root/f'작업관리/기준/main0{i}/작업진행방법.md' for i in range(1,4)]
checks = []
for p in paths:
    text = p.read_text(encoding='utf-8')
    assert '절차 확인·마지막 행동 안내' in text or '절차 확인·마지막 실행 안내' in text
    checks.append({'path': str(p), 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()})
(out/'문서검증.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2),encoding='utf-8')
print('verified',len(checks))
