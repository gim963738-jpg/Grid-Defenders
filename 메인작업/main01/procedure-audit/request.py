import json
import subprocess
from pathlib import Path

exe = 'C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe'
out = Path(__file__).resolve().parent
body = '''사용자 직접 요청: “작업하달 하고나서 메인을 포함한 모든 부서가 절차적으로 작업이 이루어지고있는지 확인”. 신규 제작 지시가 아닌 읽기 전용 운영점검입니다. 자기 메인의 최근 실제 작업과 관할 부서에 대해 사용자 진행 승인/예외 근거 → 사전확인 → 공식 발송영수증 → 차수별 규정 본문 읽기/ACK/start → 제작 → 검수/결과 → 사용자 합격/통합 분리를 실제 파일로 점검해 회신해 주세요. 자기 메인 자체 사전 규정읽기 증거와, 등록하지 않은 직접 작업/하위위임도 포함해 주세요. 누락·불명확·대기는 정상 완료와 구분하고 소급 사전기록/승인/ACK를 만들지 마세요. 작업 원본/공통규정/화면/Git 저장은 변경하지 마세요. main01 감사 근거는 메인작업/main01/procedure-audit/snapshot.json입니다. main02 UI 차수7은 감사 시점 sent로만 관찰됐으므로 실제 현재 start 여부를 대조해 주세요. main03 confirmed 잔여 작업 7290915B의 현 의미와 요청확인 문구가 대기라고 남은 5133411E의 실제 후속 승인 증거도 설명해 주세요. 보고는 이 run:run_47ce1a81d7b1로 근거 절대경로와 함께 회신해 주세요.'''
for name, target in [('main02', 'run:run_2939978c8e65'), ('main03', 'run:run_b29b47372e51')]:
    r = subprocess.run([exe, 'orchestration', 'send', '--to', target, '--subject', '사용자 요청: 메인 포함 작업 절차 실제 증거 점검', '--type', 'question', '--body', body, '--json'], capture_output=True, text=True, encoding='utf-8')
    (out / (name + '-점검요청영수증.json')).write_text(r.stdout, encoding='utf-8')
    print(name, r.returncode, r.stdout, r.stderr)
