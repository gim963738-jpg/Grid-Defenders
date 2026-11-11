from pathlib import Path
from datetime import datetime
import hashlib
import importlib.util
import json
import urllib.request

R = Path('C:/Users/user/Desktop/Grid Defenders')
S = R / '작업관리'
H = R / '메인작업/main01/character-effect-workshop'
V = H / 'qa-v003'
Q = Path('C:/Users/user/orca/workspaces/Grid Defenders/테스터/output/character-effect-workshop_final_main01-20261111-3a680e78_v003')

def read(p):
    return json.loads(Path(p).read_text(encoding='utf-8-sig'))

def sha(p):
    return hashlib.sha256(Path(p).read_bytes()).hexdigest()

def write(p, value):
    Path(p).write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding='utf-8')

c = read(V / '연결.json')
t = read(S / '작업' / c['task'] / 'task.json')
d = read(Q / 'result.json')
assert c['task'] == d['task'] == 'MAIN01-20261111-3A680E78'
assert c['delivery']['dispatchId'] == 'ctx_011976d8a695'
assert c['delivery']['taskId'] == 'task_bcfb5c8af936'
assert d['outcome'] == 'succeeded' and d['result'] == 'PASS'
assert d['browserChecks'] == 225 and d['focusedPass'] == 139 and d['loopPass'] == 86
assert d['summary']['PASS'] == 227 and d['summary']['FAIL'] == 0
assert not d['runtimeErrors'] and not d['httpErrors']
assert d['productEdits'] == d['gitWrites'] == d['generationApiCalls'] == 0

before = read(Q / 'target-hashes-before.json')
after = read(Q / 'target-hashes-after.json')
assert len(before) == len(after) == 18
fixed = {x['path']: x for x in before}
hashes = []
for x in after:
    p = Path(x['path'])
    actual = sha(p)
    assert x['passed'] and x['unchanged']
    assert actual == x['expected'] == x['actual'] == x['after'] == fixed[x['path']]['actual']
    hashes.append({'path': str(p), 'sha256': actual, 'passed': True})

ack_path = Path(t['readingAcknowledgement']['path'])
ack = read(ack_path)
assert sha(ack_path) == t['readingAcknowledgement']['sha256']
assert ack['task'] == c['task'] and ack['iteration'] == 1 and ack['role'] == 'qa'
assert len(ack['documents']) == 21
for doc in ack['documents']:
    assert doc['applies'].strip() and sha(doc['path']) == doc['sha256']

with urllib.request.urlopen(d['targetUrl'], timeout=10) as response:
    http = response.status
assert http == 200

review = {
    'task': c['task'], 'iteration': 1, 'reviewedBy': 'main01',
    'at': datetime.now().astimezone().isoformat(),
    'nativeMessage': 'msg_2f3e43ca8556',
    'dispatchId': c['delivery']['dispatchId'],
    'nativeTaskId': c['delivery']['taskId'],
    'nativeOutcome': 'succeeded',
    'report': {'path': str(Q / 'report.md'), 'sha256': sha(Q / 'report.md')},
    'result': {'path': str(Q / 'result.json'), 'sha256': sha(Q / 'result.json')},
    'independentChecks': {'browser': 225, 'preservationAndAck': 2, 'failed': 0},
    'productHashRecords': hashes,
    'uniqueProductPaths': len({x['path'] for x in hashes}),
    'readAck': {'path': str(ack_path), 'sha256': sha(ack_path), 'documents': 21},
    'personallyViewed': str(Q / 'loop-exact-0300.png'),
    'observed': '반복 켜짐, 0.300초에서 UI 1/3F. 상세 보고와 현재 제품 SHA 일치.',
    'url': d['targetUrl'], 'httpStatus': http,
    'technicalQaPassed': True, 'userAccepted': False, 'rootGameIntegrated': False,
    'limits': ['실기기/APK', '장기 부하와 최대 문서', '사용자 미적 합격과 재생속도 수용', '실게임 배포·연동']
}
write(V / '반환검증.json', review)
(V / '반환검토.md').write_text(
    '# 공방 v003 최종 독립 재검증 반환 검토\n\n'
    'MAIN01-20261111-3A680E78 차수1. 공식 worker_done succeeded를 확인했다.\n\n'
    '독립 브라우저 225항목 및 보존·ACK 2항목 PASS, 0FAIL. QA01 효과 시간 경계, '
    'QA02 불량파일 거부 및 문서/이력 보존, QA03 루프 경계가 해결됐다. '
    '메인은 보고서를 읽고 정확 0.300초의 1/3F 화면을 직접 확인했으며 '
    '제품18기록(16개 경로)·필독21문서의 현재 SHA와 ACK를 대조했다. '
    '기존 공방 5182의 HTTP200도 확인했다. 독립 검사를 메인이 다시 수행했다고 보고하지 않는다.\n\n'
    '결과는 기술 검증 PASS다. 사용자 미적 합격, 실기기, 장기 부하 및 실제 게임 배포·연동은 '
    '미확인 상태를 유지한다. 전장 유닛 겹침 수정은 별도 담당 작업이며 이번 결과와 섞지 않는다. '
    '제품 수정·이미지 생성/API·Git 커밋/푸시·사용자 화면 조작은 수행하지 않았다.\n', encoding='utf-8')

spec = importlib.util.spec_from_file_location('board', S / '도구/작업대장.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
b = m.Board(S)
if t['status'] == 'in_progress':
    b.record(c['task'], 'main01', 'returned', Q / 'report.md')
else:
    assert t['status'] == 'awaiting_user'
c.update(state='returned_technical_pass', workerOutcome='succeeded',
         report=str(Q / 'report.md'), mainReview=str(V / '반환검증.json'), userAccepted=False)
write(V / '연결.json', c)
parent = read(H / '연결.json')
parent.update(state='technical_qa_pass_awaiting_user', userAccepted=False,
              independentQa={'task': c['task'], 'outcome': 'succeeded', 'result': 'PASS',
                             'report': str(Q / 'report.md'), 'mainReview': str(V / '반환검증.json')})
write(H / '연결.json', parent)
fix_path = H / 'technical-fix-v003/연결.json'
fix = read(fix_path)
fix.update(state='independent_qa_pass', finalQaTask=c['task'], userAccepted=False)
write(fix_path, fix)
print(json.dumps({'task': c['task'], 'state': c['state'], 'independentBrowserChecks': 225,
                  'hashChecks': 2, 'failed': 0, 'currentUniqueFiles': review['uniqueProductPaths'],
                  'currentAckDocuments': 21, 'http': http, 'userAccepted': False,
                  'review': str(V / '반환검증.json')}, ensure_ascii=False))
