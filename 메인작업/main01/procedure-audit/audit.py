import datetime
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SHARED = ROOT / '작업관리'
OUT = Path(__file__).resolve().parent

def read(p):
    return json.loads(Path(p).read_text(encoding='utf-8-sig'))

def evidence(e):
    if not e or not e.get('path'):
        return {'exists': False, 'reason': 'no evidence path'}
    p = Path(e['path'])
    return {'path': str(p), 'exists': p.is_file(), 'hashMatches':
            p.is_file() and hashlib.sha256(p.read_bytes()).hexdigest() == e.get('sha256')}

result = {'checkedAt': datetime.datetime.now().astimezone().isoformat(),
          'scope': 'shared task records and linked files; not proof of all terminal activity',
          'roles': [], 'tasks': []}
for catalog, key in [('메인목록.json', 'mains'), ('브랜치목록.json', 'branches')]:
    for role, d in read(SHARED / catalog)[key].items():
        docs = d.get('requiredReadings', [])
        result['roles'].append({'role': role, 'name': d.get('displayName', d.get('name')),
            'workMethod': d.get('workMethod'), 'workMethodExists': Path(d['workMethod']).is_file(),
            'requiredCount': len(docs), 'missingReadings': [x for x in docs if not Path(x).is_file()]})

for p in sorted((SHARED / '작업').glob('*/task.json')):
    d = read(p)
    hs = d.get('history', [])
    cur = [h for h in hs if h.get('iteration') == d['iteration']]
    checks = []
    for h in hs:
        checks.append({'iteration': h.get('iteration'), 'action': h['action'],
                       'at': h.get('at'), 'evidence': evidence(h.get('evidence'))})
    ackref = d.get('readingAcknowledgement')
    ack = read(ackref['path']) if ackref and Path(ackref['path']).is_file() else None
    row = {'id': d['id'], 'main': d['main'], 'role': d['branch'], 'title': d['title'],
           'iteration': d['iteration'], 'status': d['status'],
           'approvalQuote': (d.get('approval') or {}).get('userQuote'),
           'approvalSource': evidence((d.get('approval') or {}).get('source')),
           'currentActions': [h['action'] for h in cur], 'historyChecks': checks,
           'ackEvidence': evidence(ackref) if ackref else None,
           'ackDocumentCount': len(ack.get('documents', [])) if ack else 0,
           'ackIdentityMatches': (ack.get('task') == d['id'] and ack.get('iteration') == d['iteration']
                                  and ack.get('role') == d['branch']) if ack else None,
           'ackBlankSummaries': [x.get('path') for x in ack.get('documents', []) if not x.get('applies', '').strip()] if ack else [],
           'currentDocChangesSinceAck': [], 'stageIssues': []}
    if ack:
        for doc in ack.get('documents', []):
            ep = evidence(doc)
            if not ep.get('hashMatches'):
                row['currentDocChangesSinceAck'].append(ep)
    for it in sorted(set(h.get('iteration', 1) for h in hs)):
        events = [h for h in hs if h.get('iteration', 1) == it]
        actions = [h['action'] for h in events]
        for action, prior in [('start', 'sent'), ('returned', 'start'), ('accept', 'returned'), ('integrated', 'accept')]:
            if action in actions and (prior not in actions or actions.index(prior) > actions.index(action)):
                row['stageIssues'].append({'iteration': it, 'action': action, 'missingPrior': prior})
    result['tasks'].append(row)

(OUT / 'snapshot.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
print('roles', len(result['roles']), 'tasks', len(result['tasks']))
for r in result['roles']:
    print('ROLE', r['role'], 'method=', r['workMethodExists'], 'missing=', len(r['missingReadings']))
for r in result['tasks']:
    bad = [x for x in r['historyChecks'] if not x['evidence'].get('hashMatches')]
    print('TASK', r['id'], r['main'], r['role'], r['status'], 'v'+str(r['iteration']),
          'actions='+','.join(r['currentActions']), 'ack='+str(r['ackDocumentCount']),
          'identity='+str(r['ackIdentityMatches']), 'badHistoricalEvidence='+str(len(bad)),
          'changedDocs='+str(len(r['currentDocChangesSinceAck'])), 'stageIssues='+str(r['stageIssues']))
    for x in bad:
        print(' EVIDENCE', json.dumps(x, ensure_ascii=False))
