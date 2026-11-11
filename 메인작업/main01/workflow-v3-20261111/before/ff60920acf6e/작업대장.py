"""Shared task records and explicit user-confirmation gates. No automatic sending."""
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
    return json.loads(path.read_text(encoding='utf-8-sig'))


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_name(path.name+'.'+uuid.uuid4().hex+'.tmp')
    temp.write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    os.replace(temp, path)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def evidence(path):
    path = Path(path).resolve()
    if not path.is_file() or not path.read_text(encoding='utf-8').strip():
        raise ValueError('실제 확인/결과 근거 파일이 필요합니다.')
    return {'path':str(path), 'sha256':sha(path)}


class Board:
    def __init__(self, root):
        self.root = Path(root).resolve()

    @contextmanager
    def writer(self):
        state = self.root/'상태'
        state.mkdir(parents=True, exist_ok=True)
        lock = state/'writer.lock'
        try:
            fd = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
        except FileExistsError:
            raise ValueError('다른 메인이 작업대장을 갱신 중입니다. 잠금을 임의로 삭제하지 마세요.')
        try:
            with os.fdopen(fd, 'w', encoding='utf-8') as f:
                json.dump({'pid':os.getpid(), 'createdAt':now()}, f)
            yield
        finally:
            lock.unlink()

    def folder(self, task_id):
        if not re.fullmatch(r'[A-Z0-9-]+', task_id):
            raise ValueError('잘못된 작업번호')
        return self.root/'작업'/task_id

    def load(self, task_id, main):
        task = read_json(self.folder(task_id)/'task.json')
        if task['main'] != main:
            raise ValueError('다른 메인 소유 작업입니다. 먼저 명시적으로 인계해야 합니다.')
        return task

    def save(self, task):
        task['updatedAt'] = now()
        write_json(self.folder(task['id'])/'task.json', task)

    def reading_snapshot(self, task, contents=False):
        """Read current bytes once: the digest describes the exact displayed text."""
        if not task.get('readingPolicyVersion'):
            return []
        role = read_json(self.root/'브랜치목록.json')['branches'][task['branch']]
        paths = role.get('requiredReadings', [])
        method = role.get('workMethod')
        if not method or not paths or str(Path(method).resolve()) not in {str(Path(p).resolve()) for p in paths}:
            raise ValueError('수신 역할의 작업진행방법·필독 목록이 설정되지 않았습니다.')
        result, seen = [], set()
        for path in [*paths, *task.get('additionalReadings', [])]:
            p = Path(path).resolve()
            if str(p) in seen:
                continue
            seen.add(str(p))
            data = p.read_bytes()
            body = data.decode('utf-8-sig')
            if not body.strip():
                raise ValueError('필독 문서가 비어 있습니다: '+str(p))
            row = {'path':str(p), 'sha256':hashlib.sha256(data).hexdigest()}
            if contents:
                row['content'] = body
            result.append(row)
        return result

    def set_readings(self, task_id, main, paths):
        if not isinstance(paths, list) or any(not isinstance(p, str) or not p.strip() for p in paths):
            raise ValueError('추가 필독 문서의 경로 배열이 필요합니다.')
        with self.writer():
            task = self.load(task_id, main)
            if task['status'] != 'draft':
                raise ValueError('작품별 기준은 사용자 확인 전 초안에 연결하세요.')
            task['additionalReadings'] = list(dict.fromkeys(str(Path(p).resolve()) for p in paths))
            self.reading_snapshot(task)
            self.save(task)
            return task

    def read_pack(self, task_id, main):
        task = self.load(task_id, main)
        # Live coordination state changes with other tasks; read it, but do not
        # invalidate an acknowledgement whenever another team updates its status.
        live = []
        registry = read_json(self.root/'브랜치목록.json')['branches'][task['branch']]
        for p in [self.root/'작업대장.md', self.root/'브랜치목록.json', self.root/'메인목록.json',
                  Path(registry['path'])/'작업연결.json']:
            if p.is_file():
                live.append({'path':str(p.resolve()), 'content':p.read_text(encoding='utf-8-sig')})
        return {'task':task_id, 'iteration':task['iteration'], 'role':task['branch'],
                'documents':self.reading_snapshot(task, contents=True),
                'liveContext':live,
                'instruction':'본문을 읽고 각 문서의 적용 요약을 작성한 뒤 start로 기록하세요. 이 출력 자체는 착수 확인이 아닙니다.'}

    def check_read_ack(self, task, ack):
        if any(ack.get(k) != v for k, v in {'task':task['id'], 'iteration':task['iteration'], 'role':task['branch']}.items()):
            raise ValueError('읽기 확인의 작업·차수·수신 역할이 일치하지 않습니다.')
        def summary_ok(value):
            return isinstance(value, str) and bool(value.strip()) and '{{' not in value
        if not summary_ok(ack.get('workSummary')):
            raise ValueError('이번 작업에 적용할 작업 방법 요약이 필요합니다.')
        docs = ack.get('documents')
        if not isinstance(docs, list) or any(not isinstance(d, dict) for d in docs):
            raise ValueError('각 필독 문서의 확인 기록이 필요합니다.')
        found = {}
        for d in docs:
            if not isinstance(d.get('path'), str) or not summary_ok(d.get('applies')):
                raise ValueError('문서 경로와 각 문서의 적용 요약을 기록하세요.')
            path = str(Path(d['path']).resolve())
            if path in found:
                raise ValueError('같은 문서의 읽기 확인이 중복되었습니다.')
            found[path] = d.get('sha256')
        expected = {d['path']:d['sha256'] for d in self.reading_snapshot(task)}
        if not expected or found != expected:
            raise ValueError('필독 문서가 누락되었거나 버전이 바뀌었습니다. read-pack으로 다시 읽으세요.')

    def start(self, task_id, main, role, source):
        with self.writer():
            task = self.load(task_id, main)
            if role != task['branch']:
                raise ValueError('수신 역할이 작업 담당과 다릅니다.')
            if not task.get('readingPolicyVersion'):
                raise ValueError('필독 정책이 없는 과거 작업입니다. 새 차수 또는 새 작업으로 등록하세요.')
            if task['status'] not in {'delivery_receipt_recorded', 'in_progress'}:
                raise ValueError('실제 발송 기록 후 착수할 수 있습니다. 기록 대기라면 담당 메인에게 연결을 요청하세요.')
            data = Path(source).read_bytes()
            ack = json.loads(data.decode('utf-8-sig'))
            if not isinstance(ack, dict):
                raise ValueError('읽기 확인 JSON 객체가 필요합니다.')
            self.check_read_ack(task, ack)
            receipt = self.folder(task_id)/f'읽기확인-v{task["iteration"]:03}-{uuid.uuid4().hex}.json'
            receipt.write_bytes(data)
            task['readingAcknowledgement'] = evidence(receipt)
            task['history'].append({'action':'start','at':now(),'iteration':task['iteration'],
                                    'role':role,'evidence':task['readingAcknowledgement']})
            task['status'] = 'in_progress'
            self.save(task)
            return task

    def validate_started(self, task):
        proof = task.get('readingAcknowledgement')
        if not proof or evidence(proof['path']) != proof:
            raise ValueError('현재 작업의 읽기 확인 원본이 없거나 변경되었습니다.')
        self.check_read_ack(task, read_json(Path(proof['path'])))

    def hashes(self, task):
        folder = self.folder(task['id'])
        paths = [folder/'요청확인.md', folder/'전문프롬프트.md', folder/'2_사전확인.md',
                 self.root/'규정A.md', self.root/'기준'/task['branch']/'규정.md']
        registry = read_json(self.root/'브랜치목록.json')['branches'][task['branch']]
        paths.append(Path(registry['path'])/'AGENTS.md')
        for p in paths[:3]:
            text = p.read_text(encoding='utf-8')
            if not text.strip() or '{{' in text:
                raise ValueError('요청 확인·전문 프롬프트·사전확인의 빈 항목을 먼저 작성하세요.')
        hashes = {str(p):sha(p) for p in paths}
        hashes.update({d['path']:d['sha256'] for d in self.reading_snapshot(task)})
        return hashes

    def new(self, main, branch, title, request):
        mains_file = self.root/'메인목록.json'
        if mains_file.is_file():
            mains = read_json(mains_file).get('mains', {})
            active_mains = {key for key, value in mains.items()
                            if value.get('active', True) and value.get('status') != 'retired'}
        else:
            # Preserve compatibility with historical boards that have no registry.
            active_mains = {'main01','main02','main03'}
        if main not in active_mains:
            raise ValueError('현재 활성 메인만 새 작업을 등록할 수 있습니다.')
        catalog = read_json(self.root/'브랜치목록.json')
        registry = catalog['branches']
        if branch not in registry:
            raise ValueError('등록되지 않은 작업 브랜치')
        if not request.strip():
            raise ValueError('사용자 요청 원문이 필요합니다.')
        with self.writer():
            task_id = main.upper()+'-'+datetime.now().strftime('%Y%m%d')+'-'+uuid.uuid4().hex[:8].upper()
            folder = self.folder(task_id)
            folder.mkdir(parents=True, exist_ok=False)
            names = ['1_대화기록.md','2_사전확인.md','3_작업일지.md','4_정의문서.md','5_버전관리.md','요청확인.md','전문프롬프트.md']
            for name in names:
                source = self.root/'양식'/name
                text = source.read_text(encoding='utf-8').replace('{{작업번호}}',task_id).replace('{{원문}}',request)
                (folder/name).write_text(text, encoding='utf-8')
            task = {'schemaVersion':1,'id':task_id,'main':main,'branch':branch,'title':title,
                    'request':request,'iteration':1,'status':'draft','createdAt':now(),'approval':None,'history':[]}
            if catalog.get('readingPolicyVersion'):
                task.update(readingPolicyVersion=catalog['readingPolicyVersion'], additionalReadings=[], readingAcknowledgement=None)
            self.save(task)
            return task

    def confirm(self, task_id, main, quote, source):
        if not quote.strip():
            raise ValueError('사용자의 실제 확인 원문이 필요합니다. AI가 대신 승인할 수 없습니다.')
        proof = evidence(source)
        with self.writer():
            task = self.load(task_id, main)
            if task['status'] not in {'draft','confirmed'}:
                raise ValueError('발송 전 작업만 확인할 수 있습니다.')
            task['approval'] = {'userQuote':quote,'source':proof,'recordedBy':main,'recordedAt':now(),
                                'iteration':task['iteration'],'hashes':self.hashes(task)}
            task['status'] = 'confirmed'
            self.save(task)
            return task

    def leases(self):
        path = self.root/'상태/브랜치잠금.json'
        return read_json(path) if path.exists() else {}

    def prepare(self, task_id, main):
        with self.writer():
            task = self.load(task_id, main)
            approval = task['approval']
            if task['status'] != 'confirmed' or not approval or approval['iteration'] != task['iteration']:
                raise ValueError('사용자 이해 확인이 없는 제작·수정 지시는 준비할 수 없습니다.')
            if approval['hashes'] != self.hashes(task):
                raise ValueError('확인 후 요청·지시·규정이 바뀌었습니다. 이해 확인을 갱신하세요.')
            if evidence(approval['source']['path']) != approval['source']:
                raise ValueError('확인 근거가 변경되었습니다.')
            leases = self.leases()
            prior = leases.get(task['branch'])
            if prior and prior['task'] != task_id:
                raise ValueError('같은 브랜치가 다른 작업에 사용 중입니다: '+prior['task'])
            leases[task['branch']] = {'task':task_id,'main':main,'iteration':task['iteration'],'at':now()}
            write_json(self.root/'상태/브랜치잠금.json', leases)
            registry = read_json(self.root/'브랜치목록.json')['branches'][task['branch']]
            prompt = self.folder(task_id)/'전문프롬프트.md'
            original_hash = sha(prompt)
            if task.get('readingPolicyVersion'):
                original = prompt.read_text(encoding='utf-8')
                docs = self.reading_snapshot(task)
                command = f'python "{self.root / "도구" / "작업대장.py"}"'
                flags = f'--task {task_id} --main {main}'
                supplement = '\n\n## 자동 첨부: 작업 전 필독 (OPS-004)\n'
                supplement += f'작업: {task_id} / 차수: {task["iteration"]} / 수신 역할: {task["branch"]}\n'
                supplement += '아래 본문을 모두 읽고 이번 작업에 적용할 내용을 기록하기 전에는 편집·생성·외주 호출을 시작하지 마세요.\n'
                supplement += '\n'.join('- '+d['path'] for d in docs)
                supplement += f'\n\n1. `{command} read-pack {flags}`로 현재 본문을 엽니다.\n'
                supplement += '2. task / iteration / role / workSummary / documents[{path, sha256, applies}] 형식의 읽기확인 JSON을 작성합니다. 목록·해시만 열람한 것은 필독이 아닙니다.\n'
                supplement += f'3. `{command} start {flags} --role {task["branch"]} --evidence <읽기확인.json>`을 실행합니다. 발송 기록 대기는 담당 메인에게 알리고 재시도하며 사용자 승인을 추가 요구하지 않습니다.\n'
                supplement += '4. 하위 에이전트에는 본인의 작업 방법과 작품별 기준을 전달하고 같은 읽기 확인을 받습니다. 규정 변경 시 다시 읽어 start를 갱신합니다.\n'
                prompt = self.folder(task_id)/f'발송지시-v{task["iteration"]:03}.md'
                prompt.write_text(original+supplement, encoding='utf-8')
            plan = {'task':task_id,'main':main,'iteration':task['iteration'],'selector':registry['selector'],
                    'prompt':str(prompt),'promptSha256':sha(prompt),'sourcePromptSha256':original_hash,
                    'status':'prepared_not_sent','approval':approval,'instruction':'Use the official Orca skill; record the actual receipt. Do not duplicate an active editor.'}
            write_json(self.folder(task_id)/f'발송준비-v{task["iteration"]:03}.json', plan)
            task['status'] = 'prepared'
            self.save(task)
            return plan

    def record(self, task_id, main, action, source, quote=''):
        proof = evidence(source)
        with self.writer():
            task = self.load(task_id, main)
            expected = {'sent':{'prepared'},'returned':{'delivery_receipt_recorded'},
                        'accept':{'awaiting_user'},'revise':{'awaiting_user'},'integrated':{'accepted'}}
            if task.get('readingPolicyVersion'):
                expected['returned'] = {'in_progress'}
            if action not in expected or task['status'] not in expected[action]:
                raise ValueError('현재 단계에서 허용되지 않는 변경')
            if action == 'returned' and task.get('readingPolicyVersion'):
                self.validate_started(task)
            if action in {'accept','revise'} and not quote.strip():
                raise ValueError('사용자 판정 원문을 기록하세요.')
            entry = {'action':action,'at':now(),'iteration':task['iteration'],'evidence':proof,'userQuote':quote}
            task['history'].append(entry)
            if action == 'sent':
                if task['approval']['hashes'] != self.hashes(task):
                    raise ValueError('발송 준비 후 내용이 바뀌었습니다. 실제 발송하지 마세요.')
                plan = read_json(self.folder(task_id)/f'발송준비-v{task["iteration"]:03}.json')
                if sha(Path(plan['prompt'])) != plan['promptSha256']:
                    raise ValueError('발송문이 준비 이후 변경되었습니다. 실제 발송하지 마세요.')
                task['status'] = 'delivery_receipt_recorded'
            elif action == 'returned':
                task['status'] = 'awaiting_user'
                leases = self.leases()
                if leases.get(task['branch'],{}).get('task') == task_id:
                    del leases[task['branch']]
                    write_json(self.root/'상태/브랜치잠금.json', leases)
            elif action == 'accept':
                task['status'] = 'accepted'
            elif action == 'integrated':
                task['status'] = 'integrated'
            else:
                archive = self.folder(task_id)/'이전차수'/f'v{task["iteration"]:03}'
                archive.mkdir(parents=True, exist_ok=False)
                for name in ['요청확인.md','전문프롬프트.md','2_사전확인.md']:
                    (archive/name).write_bytes((self.folder(task_id)/name).read_bytes())
                write_json(archive/'확인기록.json',task['approval'])
                write_json(archive/'필독기록.json',task.get('readingAcknowledgement'))
                task['iteration'] += 1
                task['approval'] = None
                task['readingAcknowledgement'] = None
                catalog = read_json(self.root/'브랜치목록.json')
                if catalog.get('readingPolicyVersion'):
                    task['readingPolicyVersion'] = catalog['readingPolicyVersion']
                task['status'] = 'draft'
            self.save(task)
            return task

    def listing(self):
        return [read_json(p) for p in sorted((self.root/'작업').glob('*/task.json'))]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    new = sub.add_parser('new')
    for name in ['main','branch','title','request-file']:
        new.add_argument('--'+name, required=True)
    confirm = sub.add_parser('confirm')
    prepare = sub.add_parser('prepare')
    record = sub.add_parser('record')
    readings = sub.add_parser('set-readings')
    pack = sub.add_parser('read-pack')
    start = sub.add_parser('start')
    for p in [confirm,prepare,record,readings,pack,start]:
        p.add_argument('--task',required=True)
        p.add_argument('--main',required=True)
    confirm.add_argument('--quote',required=True)
    confirm.add_argument('--evidence',required=True)
    record.add_argument('--action',choices=['sent','returned','accept','revise','integrated'],required=True)
    record.add_argument('--evidence',required=True)
    record.add_argument('--quote',default='')
    readings.add_argument('--file',required=True,help='작품별 추가 필독 경로 JSON 배열')
    start.add_argument('--role',required=True)
    start.add_argument('--evidence',required=True)
    sub.add_parser('list')
    args = parser.parse_args()
    board = Board(Path(__file__).resolve().parents[1])
    try:
        if args.command == 'new':
            result = board.new(args.main,args.branch,args.title,Path(args.request_file).read_text(encoding='utf-8'))
        elif args.command == 'confirm':
            result = board.confirm(args.task,args.main,args.quote,args.evidence)
        elif args.command == 'prepare':
            result = board.prepare(args.task,args.main)
        elif args.command == 'record':
            result = board.record(args.task,args.main,args.action,args.evidence,args.quote)
        elif args.command == 'set-readings':
            result = board.set_readings(args.task,args.main,read_json(Path(args.file)))
        elif args.command == 'read-pack':
            result = board.read_pack(args.task,args.main)
        elif args.command == 'start':
            result = board.start(args.task,args.main,args.role,args.evidence)
        else:
            result = board.listing()
        print(json.dumps(result,ensure_ascii=False,indent=2))
    except (ValueError,OSError,KeyError) as error:
        parser.exit(2,str(error)+'\n')


if __name__ == '__main__':
    main()
