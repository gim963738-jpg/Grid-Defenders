"""MAIN01 v3: one task spec, fail-closed click gate, independent stages, queued notices.

No network calls, dispatches, image generation or Git commands. A trusted native
click-event reader is deliberately NOT provided: local JSON is not user consent.
"""
import argparse
from contextlib import contextmanager
from datetime import datetime
import hashlib
import json
import os
from pathlib import Path
import re
import uuid


def now():
    return datetime.now().astimezone().isoformat()


def read_json(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))


def write_json(path, data):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_name(path.name + '.' + uuid.uuid4().hex + '.tmp')
    temp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    os.replace(temp, path)


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def evidence(path):
    path = Path(path).resolve()
    if not path.is_file() or not path.read_bytes().strip():
        raise ValueError('실제 근거 파일이 필요합니다.')
    return {'path': str(path), 'sha256': sha(path)}


STAGES = {
    'production': ('not_started', 'in_progress', 'complete', 'partial', 'failed', 'unknown'),
    'technical': ('not_run', 'in_progress', 'pass', 'pass_with_warnings', 'fail', 'unknown'),
    'user': ('not_reviewed', 'accepted', 'rejected', 'unknown'),
    'integration': ('not_applied', 'applied', 'unknown'),
}
LABELS = dict(production='제작 완료', technical='기술 검증', user='사용자 합격', integration='게임 반영')


def initial_stages():
    return {k: {'status': v[0], 'evidence': None} for k, v in STAGES.items()}


class Board:
    def __init__(self, root, *, native_click_reader=None):
        self.root = Path(root).resolve()
        # Only an independently authenticated native event adapter may be used.
        # CLI has no file/config/env override. Tests inject a synthetic reader.
        self.native_click_reader = native_click_reader

    @contextmanager
    def writer(self):
        state = self.root / '상태'
        state.mkdir(parents=True, exist_ok=True)
        lock = state / 'writer.lock'
        try:
            fd = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
        except FileExistsError:
            raise ValueError('작업대장 기록 잠금이 사용 중입니다. 임의로 해제하지 마세요.')
        try:
            with os.fdopen(fd, 'w', encoding='utf-8') as stream:
                json.dump({'pid': os.getpid(), 'at': now()}, stream)
            yield
        finally:
            lock.unlink()

    def folder(self, task_id):
        if not re.fullmatch(r'[A-Z0-9-]+', task_id):
            raise ValueError('잘못된 작업번호')
        return self.root / '작업' / task_id

    def load(self, task_id, main='main01'):
        task = read_json(self.folder(task_id) / 'task.json')
        if main != 'main01' or task['main'] != main:
            raise ValueError('현재 총괄은 main01 한 곳입니다.')
        return task

    def save(self, task):
        task['updatedAt'] = now()
        write_json(self.folder(task['id']) / 'task.json', task)

    def spec_path(self, task):
        return self.folder(task['id']) / '통합작업명세.json'

    def new(self, main, branch, title, request):
        if main != 'main01':
            raise ValueError('현재 활성 메인은 main01입니다.')
        catalog = read_json(self.root / '브랜치목록.json')
        if branch not in catalog['branches'] or not request.strip():
            raise ValueError('등록된 담당과 사용자 원문이 필요합니다.')
        with self.writer():
            tid = 'MAIN01-' + datetime.now().strftime('%Y%m%d') + '-' + uuid.uuid4().hex[:8].upper()
            task = dict(schemaVersion=3, id=tid, main=main, branch=branch, title=title,
                        iteration=1, status='draft', createdAt=now(), approval=None,
                        readingPolicyVersion='OPS-006', additionalReadings=[],
                        readingAcknowledgement=None, history=[], stages=initial_stages())
            spec = dict(schemaVersion=1, task=tid, revision=1, originalRequest=request,
                        corrections=[], current={}, revisionHistory=[], unresolved=['최신 조건을 정리하세요.'])
            write_json(self.spec_path(task), spec)
            self.save(task)
            return task

    def update_spec(self, task_id, main, source, correction, provenance):
        current = read_json(source)
        if not isinstance(current, dict) or not correction.strip() or not provenance.strip():
            raise ValueError('현재 조건 JSON과 실제 정정 원문·출처가 필요합니다.')
        with self.writer():
            task = self.load(task_id, main)
            if task['status'] in {'delivery_receipt_recorded', 'in_progress'}:
                raise ValueError('진행 중 원본을 덮어쓰지 마세요. 현재 작업 반환 후 정정합니다.')
            spec = read_json(self.spec_path(task))
            spec['revisionHistory'].append({'revision': spec['revision'], 'current': spec['current'], 'at': now()})
            spec['corrections'].append({'text': correction, 'source': provenance, 'at': now()})
            spec['current'] = current
            spec['unresolved'] = current.pop('unresolved', [])
            if spec.get('migration'):
                spec['migration']['needsReconciliation'] = False
                spec['migration']['reconciledAt'] = now()
            spec['revision'] += 1
            task['iteration'] = spec['revision']
            task['history'].append({'action': 'spec_update', 'at': now(), 'previousApproval': task.get('approval')})
            task.update(approval=None, pendingChoice=None, readingAcknowledgement=None, status='draft')
            # Existing outcomes stay in history; they do not certify the new revision.
            task['history'][-1]['previousStages'] = task.get('stages')
            task['stages'] = initial_stages()
            write_json(self.spec_path(task), spec)
            leases = self.leases()
            if leases.get(task['branch'], {}).get('task') == task_id:
                del leases[task['branch']]
                write_json(self.root / '상태/브랜치잠금.json', leases)
            self.save(task)
            return task

    def validate_spec(self, task):
        spec = read_json(self.spec_path(task))
        if spec.get('task') != task['id'] or spec.get('revision') != task['iteration']:
            raise ValueError('명세의 작업·차수가 일치하지 않습니다.')
        if spec.get('unresolved') or spec.get('migration', {}).get('needsReconciliation'):
            raise ValueError('미해결 조건/과거 이관 명세를 먼저 정리하세요.')
        current = spec.get('current', {})
        for key in ['goal', 'professionalPrompt']:
            if not isinstance(current.get(key), str) or not current[key].strip() or '{{' in current[key]:
                raise ValueError('명세의 목표와 전문 프롬프트가 필요합니다.')
        for key in ['deliverables', 'requirements']:
            if not isinstance(current.get(key), list) or not current[key]:
                raise ValueError('결과물과 요구사항 목록이 필요합니다.')
        for key in ['keep', 'change', 'references', 'allowedFiles', 'checks']:
            if not isinstance(current.get(key), list):
                raise ValueError('유지/변경·참조·허용 파일·검증 기준을 명세에 기록하세요.')
        requirements = current['requirements']
        ids = [r.get('id') for r in requirements if isinstance(r, dict)]
        if len(ids) != len(requirements) or not all(ids) or len(set(ids)) != len(ids):
            raise ValueError('요구사항 ID가 없거나 중복됩니다.')
        coverage = current.get('promptCoverage', {})
        if set(coverage) != set(ids) or any(not text or text not in current['professionalPrompt'] for text in coverage.values()):
            raise ValueError('각 요구사항과 실제 전문 프롬프트 구절을 연결하세요.')
        for req in requirements:
            if not req.get('source') or not req.get('text'):
                raise ValueError('요구사항에 원문 출처와 내용을 기록하세요.')
        if not isinstance(current.get('image26'), dict) or 'allowed' not in current['image26']:
            raise ValueError('작업별 2.6 허가 여부를 명시하세요.')
        if current['image26']['allowed'] and not current['image26'].get('userEvidence'):
            raise ValueError('2.6 사용 허가의 실제 사용자 근거가 필요합니다.')
        return spec

    def reading_snapshot(self, task, contents=False):
        role = read_json(self.root / '브랜치목록.json')['branches'][task['branch']]
        paths = role.get('requiredReadings', [])
        if not role.get('workMethod') or str(Path(role['workMethod']).resolve()) not in {str(Path(p).resolve()) for p in paths}:
            raise ValueError('담당 작업진행방법이 필독에 없습니다.')
        rows, seen = [], set()
        for item in [*paths, *task.get('additionalReadings', []), self.spec_path(task)]:
            path = Path(item).resolve()
            if path in seen:
                continue
            seen.add(path)
            body = path.read_text(encoding='utf-8-sig')
            if not body.strip():
                raise ValueError('빈 필독 문서: ' + str(path))
            row = {'path': str(path), 'sha256': sha(path)}
            if contents:
                if path == self.spec_path(task).resolve():
                    full = json.loads(body)
                    view = {k: full.get(k) for k in ['task', 'revision', 'originalRequest', 'corrections', 'current', 'unresolved']}
                    view['historyLocation'] = '동일 파일의 revisionHistory / migration. 과거 판정 확인이 필요할 때만 읽는다.'
                    body = json.dumps(view, ensure_ascii=False, indent=2)
                    row['view'] = 'current_and_user_requests; sha256 hashes the entire source file'
                row['content'] = body
            rows.append(row)
        return rows

    def set_readings(self, task_id, main, paths):
        if not isinstance(paths, list) or any(not isinstance(p, str) or not p for p in paths):
            raise ValueError('문서 경로 배열이 필요합니다.')
        with self.writer():
            task = self.load(task_id, main)
            if task['status'] != 'draft':
                raise ValueError('초안에서 필독을 확정하세요.')
            task['additionalReadings'] = list(dict.fromkeys(str(Path(p).resolve()) for p in paths))
            self.reading_snapshot(task)
            self.save(task)
            return task

    def read_pack(self, task_id, main):
        task = self.load(task_id, main)
        role = read_json(self.root / '브랜치목록.json')['branches'][task['branch']]
        return {'task': task_id, 'iteration': task['iteration'], 'role': task['branch'],
                'documents': self.reading_snapshot(task, True),
                'context': {'coordinator': 'main01', 'selector': role['selector'], 'stages': task['stages'],
                            'branchLease': self.leases().get(task['branch'])},
                'instruction': '본문을 읽고 문서별 applies 및 requirementCoverage를 기록한 뒤 start. 타 작업 완료 알림은 큐로 보냅니다.'}

    def hashes(self, task):
        self.validate_spec(task)
        return {d['path']: d['sha256'] for d in self.reading_snapshot(task)}

    def approval_request(self, task_id, main):
        with self.writer():
            task = self.load(task_id, main)
            if task['status'] not in {'draft', 'button_pending'}:
                raise ValueError('발송 전 초안만 질문할 수 있습니다.')
            hashes = self.hashes(task)
            request = {'questionId': uuid.uuid4().hex, 'task': task_id, 'revision': task['iteration'],
                       'specSha256': sha(self.spec_path(task)), 'hashes': hashes,
                       'title': f'{task["title"]} v{task["iteration"]} — 진행할까요?',
                       'options': ['진행', '수정 요청']}
            task.update(pendingChoice=request, status='button_pending', approval=None)
            self.save(task)
            return request

    def confirm(self, task_id, main, quote='', source=None):
        # Compatibility signature rejects the old --quote / --evidence shortcut.
        if self.native_click_reader is None:
            raise ValueError('버튼 클릭 출처 검증 연결이 없습니다. 텍스트 진행/로컬 근거 JSON으로 승인할 수 없습니다.')
        with self.writer():
            task = self.load(task_id, main)
            req = task.get('pendingChoice')
            if task['status'] != 'button_pending' or not req or req['hashes'] != self.hashes(task):
                raise ValueError('현재 명세에 대한 선택 질문을 다시 제시하세요.')
            event = self.native_click_reader(req['questionId'])
            expected = dict(questionId=req['questionId'], task=task_id, revision=task['iteration'],
                            specSha256=req['specSha256'], actor='user', inputKind='option_click', option='진행')
            if not isinstance(event, dict) or any(event.get(k) != v for k, v in expected.items()) or not event.get('eventId'):
                raise ValueError('해당 명세의 실제 사용자 진행 버튼 클릭만 승인됩니다.')
            used = self.root / '상태/승인이벤트.json'
            events = read_json(used) if used.exists() else {}
            if event['eventId'] in events:
                raise ValueError('이미 사용한 승인 이벤트입니다.')
            events[event['eventId']] = {'task': task_id, 'at': now()}
            write_json(used, events)
            task.update(approval={'event': event, 'hashes': req['hashes'], 'at': now()}, status='confirmed')
            self.save(task)
            return task

    def leases(self):
        path = self.root / '상태/브랜치잠금.json'
        return read_json(path) if path.exists() else {}

    def validate_approval(self, task):
        approval = task.get('approval')
        if not approval or not approval.get('event') or self.native_click_reader is None:
            raise ValueError('검증 가능한 버튼 승인 연결이 필요합니다.')
        event = self.native_click_reader(approval['event']['questionId'])
        if event != approval['event'] or approval['hashes'] != self.hashes(task):
            raise ValueError('승인 이벤트 또는 승인된 명세/규정이 변경되었습니다.')

    def prepare(self, task_id, main):
        with self.writer():
            task = self.load(task_id, main)
            if task['status'] != 'confirmed':
                raise ValueError('진행 버튼 승인 전에는 발송할 수 없습니다.')
            self.validate_approval(task)
            leases = self.leases()
            if leases.get(task['branch'], {}).get('task', task_id) != task_id:
                raise ValueError('담당 브랜치가 다른 작업에 사용 중입니다.')
            role = read_json(self.root / '브랜치목록.json')['branches'][task['branch']]
            plan = {'task': task_id, 'main': main, 'iteration': task['iteration'], 'selector': role['selector'],
                    'spec': str(self.spec_path(task)), 'specSha256': sha(self.spec_path(task)),
                    'status': 'prepared_not_sent', 'approval': task['approval'],
                    'instruction': 'Single Spec을 그대로 전달. read-pack → 본문/요구사항 적용 확인 → start. 별도 재요약 지시 금지.'}
            write_json(self.folder(task_id) / f'발송준비-v{task["iteration"]:03}.json', plan)
            leases[task['branch']] = {'task': task_id, 'main': main, 'iteration': task['iteration'], 'at': now()}
            write_json(self.root / '상태/브랜치잠금.json', leases)
            task['status'] = 'prepared'
            self.save(task)
            return plan

    def check_read_ack(self, task, ack):
        if any(ack.get(k) != v for k, v in dict(task=task['id'], iteration=task['iteration'], role=task['branch']).items()):
            raise ValueError('읽기 확인의 작업·차수·역할이 다릅니다.')
        def text_ok(text):
            return isinstance(text, str) and bool(text.strip()) and '{{' not in text
        if not text_ok(ack.get('workSummary')):
            raise ValueError('실제 작업 방법 요약이 필요합니다.')
        docs = ack.get('documents', [])
        found = {}
        for row in docs:
            if not isinstance(row, dict) or not row.get('path') or not text_ok(row.get('applies')):
                raise ValueError('문서별 실제 적용 요약이 필요합니다.')
            path = str(Path(row['path']).resolve())
            if path in found:
                raise ValueError('필독 중복')
            found[path] = row.get('sha256')
        if found != {d['path']: d['sha256'] for d in self.reading_snapshot(task)}:
            raise ValueError('필독 누락 또는 버전 변경. 현재 본문을 다시 읽으세요.')
        spec = read_json(self.spec_path(task))
        ids = {r['id'] for r in spec['current'].get('requirements', [])}
        coverage = ack.get('requirementCoverage', {})
        if set(coverage) != ids or any(not text_ok(v) for v in coverage.values()):
            raise ValueError('요구사항별 적용 내용을 빠짐없이 기록하세요.')

    def start(self, task_id, main, role, source):
        with self.writer():
            task = self.load(task_id, main)
            if task['status'] not in {'delivery_receipt_recorded', 'in_progress'} or role != task['branch']:
                raise ValueError('실제 발송 기록과 수신 역할이 필요합니다.')
            data = Path(source).read_bytes()
            ack = json.loads(data.decode('utf-8-sig'))
            self.check_read_ack(task, ack)
            receipt = self.folder(task_id) / f'읽기확인-v{task["iteration"]:03}-{uuid.uuid4().hex}.json'
            receipt.write_bytes(data)
            task['readingAcknowledgement'] = evidence(receipt)
            task['history'].append({'action': 'start', 'at': now(), 'evidence': task['readingAcknowledgement']})
            task['status'] = 'in_progress'
            task['stages']['production'] = {'status': 'in_progress', 'evidence': evidence(receipt)}
            self.save(task)
            return task

    def validate_started(self, task):
        proof = task.get('readingAcknowledgement')
        if not proof or evidence(proof['path']) != proof:
            raise ValueError('현재 필독 증거가 없거나 변경되었습니다.')
        self.check_read_ack(task, read_json(proof['path']))

    def _queue(self, event_id, task_id, summary, proof):
        path = self.root / '상태/완료알림큐.json'
        rows = read_json(path) if path.exists() else []
        if not any(r['eventId'] == event_id for r in rows):
            rows.append({'eventId': event_id, 'task': task_id, 'summary': summary, 'evidence': proof,
                         'at': now(), 'reportedAt': None})
            write_json(path, rows)
        return rows

    def record(self, task_id, main, action, source, quote=''):
        proof = evidence(source)
        with self.writer():
            task = self.load(task_id, main)
            allowed = {'sent': {'prepared'}, 'returned': {'in_progress'},
                       'accept': {'returned', 'accepted'}, 'revise': {'returned', 'accepted', 'integrated'},
                       'integrated': {'accepted'}}
            if action not in allowed or task['status'] not in allowed[action]:
                raise ValueError('현재 단계에서 허용되지 않는 변경입니다.')
            if action in {'accept', 'revise'} and not quote.strip():
                raise ValueError('실제 사용자 판정 원문이 필요합니다.')
            if action == 'sent':
                self.validate_approval(task)
                plan = read_json(self.folder(task_id) / f'발송준비-v{task["iteration"]:03}.json')
                if plan['specSha256'] != sha(self.spec_path(task)):
                    raise ValueError('발송 준비 후 명세가 변경되었습니다.')
                task['status'] = 'delivery_receipt_recorded'
            elif action == 'returned':
                self.validate_started(task)
                # A receipt is not proof of completeness, QA success or user acceptance.
                task['status'] = 'returned'
                task['stages']['production'] = {'status': 'unknown', 'evidence': proof, 'note': '반환 산출물 확인 후 stage로 판정'}
                leases = self.leases()
                if leases.get(task['branch'], {}).get('task') == task_id:
                    del leases[task['branch']]
                    write_json(self.root / '상태/브랜치잠금.json', leases)
                self._queue(f'{task_id}-v{task["iteration"]}-{proof["sha256"]}', task_id, task['title'], proof)
            elif action == 'accept':
                task['stages']['user'] = {'status': 'accepted', 'evidence': proof, 'quote': quote}
                task['status'] = 'accepted'
            elif action == 'integrated':
                if task['stages']['user']['status'] != 'accepted':
                    raise ValueError('사용자 합격 근거가 필요합니다.')
                task['stages']['integration'] = {'status': 'applied', 'evidence': proof}
                task['status'] = 'integrated'
            else:
                task['stages']['user'] = {'status': 'rejected', 'evidence': proof, 'quote': quote}
                task.update(status='draft', approval=None, pendingChoice=None)
                spec = read_json(self.spec_path(task))
                spec['corrections'].append({'text': quote, 'source': proof, 'at': now()})
                spec['unresolved'] = ['수정 조건을 update-spec으로 정리한 뒤 새 버튼 승인 필요']
                write_json(self.spec_path(task), spec)
            task['history'].append({'action': action, 'at': now(), 'iteration': task['iteration'], 'evidence': proof, 'userQuote': quote})
            self.save(task)
            return task

    def stage(self, task_id, main, name, value, source, quote=''):
        if name not in STAGES or value not in STAGES[name]:
            raise ValueError('잘못된 단계/상태')
        if name == 'user' and value in {'accepted', 'rejected'} and not quote.strip():
            raise ValueError('사용자 판정 원문이 필요합니다.')
        proof = evidence(source)
        with self.writer():
            task = self.load(task_id, main)
            if name == 'integration' and value == 'applied' and task['stages']['user']['status'] != 'accepted':
                raise ValueError('게임 반영은 사용자 합격 이후 기록하세요.')
            task['stages'][name] = {'status': value, 'evidence': proof, 'quote': quote}
            task['history'].append({'action': 'stage', 'stage': name, 'value': value, 'at': now(), 'evidence': proof})
            self.save(task)
            return task

    def topic(self, name, close=False):
        with self.writer():
            path = self.root / '상태/대화주제.json'
            previous = read_json(path) if path.exists() else {}
            if close and (not previous.get('active') or previous.get('topic') != name):
                raise ValueError('현재 주제만 종료할 수 있습니다.')
            if not close and previous.get('active') and previous.get('topic') != name:
                raise ValueError('기존 주제를 명시적으로 종료한 뒤 새 주제를 시작하세요.')
            result = {'topic': name, 'active': not close, 'at': now()}
            write_json(path, result)
            return result

    def notifications(self, reported=None):
        with self.writer():
            topic = self.root / '상태/대화주제.json'
            if topic.exists() and read_json(topic).get('active'):
                return {'deferred': True, 'items': []}
            path = self.root / '상태/완료알림큐.json'
            rows = read_json(path) if path.exists() else []
            if reported:
                ids = set(reported)
                if not ids <= {r['eventId'] for r in rows}:
                    raise ValueError('알 수 없는 완료 알림')
                for row in rows:
                    if row['eventId'] in ids and not row['reportedAt']:
                        row['reportedAt'] = now()
                write_json(path, rows)
            return {'deferred': False, 'items': [r for r in rows if not r['reportedAt']]}

    def listing(self, full=False):
        rows = [read_json(p) for p in sorted((self.root / '작업').glob('*/task.json'))]
        if full:
            return rows
        return [{k: t.get(k) for k in ['id', 'title', 'branch', 'iteration', 'status', 'stages']} for t in rows]


def main():
    p = argparse.ArgumentParser(description=__doc__)
    sub = p.add_subparsers(dest='command', required=True)
    new = sub.add_parser('new')
    for key in ['main', 'branch', 'title', 'request-file']:
        new.add_argument('--' + key, required=True)
    commands = {}
    for name in ['update-spec', 'approval-request', 'confirm', 'prepare', 'read-pack', 'set-readings', 'start', 'record', 'stage']:
        s = sub.add_parser(name)
        s.add_argument('--task', required=True)
        s.add_argument('--main', default='main01')
        commands[name] = s
    for key in ['file', 'correction', 'source']:
        commands['update-spec'].add_argument('--' + key, required=True)
    commands['set-readings'].add_argument('--file', required=True)
    commands['start'].add_argument('--role', required=True)
    for name in ['start', 'record', 'stage']:
        commands[name].add_argument('--evidence', required=True)
    for name in ['record', 'stage']:
        commands[name].add_argument('--quote', default='')
    # Retain old flags only to provide an explicit rejection, never to approve.
    commands['confirm'].add_argument('--quote', default='')
    commands['confirm'].add_argument('--evidence')
    commands['record'].add_argument('--action', choices=['sent', 'returned', 'accept', 'revise', 'integrated'], required=True)
    commands['stage'].add_argument('--stage', choices=list(STAGES), required=True)
    commands['stage'].add_argument('--value', required=True)
    sub.add_parser('list').add_argument('--full', action='store_true')
    topic = sub.add_parser('topic')
    topic.add_argument('--name', required=True)
    topic.add_argument('--close', action='store_true')
    sub.add_parser('notifications').add_argument('--reported', nargs='*')
    a = p.parse_args()
    b = Board(Path(__file__).resolve().parents[1])
    try:
        if a.command == 'new': result = b.new(a.main, a.branch, a.title, Path(a.request_file).read_text(encoding='utf-8-sig'))
        elif a.command == 'update-spec': result = b.update_spec(a.task, a.main, a.file, a.correction, a.source)
        elif a.command == 'confirm': result = b.confirm(a.task, a.main, a.quote, a.evidence)
        elif a.command == 'set-readings': result = b.set_readings(a.task, a.main, read_json(a.file))
        elif a.command == 'start': result = b.start(a.task, a.main, a.role, a.evidence)
        elif a.command == 'record': result = b.record(a.task, a.main, a.action, a.evidence, a.quote)
        elif a.command == 'stage': result = b.stage(a.task, a.main, a.stage, a.value, a.evidence, a.quote)
        elif a.command == 'list': result = b.listing(a.full)
        elif a.command == 'topic': result = b.topic(a.name, a.close)
        elif a.command == 'notifications': result = b.notifications(a.reported)
        else: result = getattr(b, a.command.replace('-', '_'))(a.task, a.main)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    except (ValueError, OSError, KeyError, TypeError) as error:
        p.exit(2, str(error) + '\n')


if __name__ == '__main__':
    main()
