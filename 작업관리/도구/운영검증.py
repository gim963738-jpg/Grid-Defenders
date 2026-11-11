"""Current-state validator; never resets old OPS snapshots or sends work."""
import hashlib
import json
from pathlib import Path
import subprocess
from datetime import datetime
from 팀장검증 import validate_org
from 도메인검증 import validate_tree


def read(p): return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def norm(s): return s.replace('\\', '/').casefold() if s else None
def digest(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()


def main():
    root = Path(__file__).resolve().parents[2]
    shared = root/'작업관리'
    out = root/'메인작업/main01/workflow-v3-20261111'
    catalog = read(shared/'브랜치목록.json')
    org = read(shared/'조직.json')
    mains = read(shared/'메인목록.json')['mains']
    assert set(mains) == {'main01'}
    assert validate_org(org, catalog['branches'], mains) == 15
    validate_tree(read(shared/'도메인/트리.json'), catalog['branches'])
    cli = 'C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe'
    receipt = json.loads(subprocess.check_output([cli,'worktree','list','--repo',
        'id:de86d10c-8e2c-444d-8b0f-43b772894ad9','--json'], text=True, encoding='utf-8'))
    assert receipt['ok']
    live = {norm(w['id']): w for w in receipt['result']['worktrees']}
    before = read(out/'orca-worktrees-before.json')['result']['worktrees']
    protected = {norm(w['id']): w for w in before}
    checks = []
    for role, node in org['nodes'].items():
        w = live[norm(node['worktreeId'])]
        expected = org['nodes'][node['parent']]['worktreeId'] if node['parent'] else None
        assert norm(w['parentWorktreeId']) == norm(expected), role
        assert w['displayName'] == node['name'], role
        old = protected[norm(node['worktreeId'])]
        for k in ['path','branch','head']: assert w[k] == old[k], (role,k)
        p = Path(node['path']); link = read(p/'작업연결.json')
        assert link['role'] == role
        assert link['readingPolicyVersion'] == 'OPS-006'
        assert Path(link['workMethod']).is_file()
        assert len(link['requiredReadings']) <= 4
        assert all(Path(x).is_file() for x in link['requiredReadings'])
        assert 'GRID-OPS006-BEGIN' in (p/'AGENTS.md').read_text(encoding='utf-8-sig')
        checks.append(role)
    assert org['nodes']['characters']['parent'] == org['nodes']['monsters']['parent'] == 'main01'
    snapshots = read(out/'before-manifest.json')
    for row in snapshots: assert digest(row['backup']) == row['sha256'], row['path']
    old_tasks = {Path(r['path']).parent.name: read(r['backup']) for r in snapshots if Path(r['path']).name=='task.json'}
    tasks = [read(p) for p in (shared/'작업').glob('*/task.json')]
    preserved = 0
    for t in tasks:
        folder = shared/'작업'/t['id']
        spec = read(folder/'통합작업명세.json')
        assert t['schemaVersion'] == 3 and t['main'] == 'main01'
        assert t['status'] != 'awaiting_user'
        assert set(t['stages']) == {'production','technical','user','integration'}
        assert spec['task'] == t['id'] and spec['revision'] == t['iteration']
        if t['id'] in old_tasks:
            old = old_tasks[t['id']]
            assert spec['originalRequest'] == old.get('request','')
            assert t['history'][:len(old['history'])] == old['history']
            for record in spec['migration']['records']:
                assert digest(record['path']) == record['sha256'], record['path']
                preserved += 1
    before_chars = sum(x['characters'] for x in read(out/'reading-before.json').values())
    after_chars = sum(sum(len(Path(p).read_text(encoding='utf-8-sig')) for p in r['requiredReadings']) for r in catalog['branches'].values())
    result = dict(at=datetime.now().astimezone().isoformat(),status='PASS',roles=len(checks),tasks=len(tasks),
                  backupsVerified=len(snapshots),historicalInstructionFilesPreserved=preserved,
                  hierarchy='main01 -> parallel team leads; world remains data index',
                  protectedWorkspacePathsBranchesHeads=True,
                  readings={'roles':14,'beforeCharacters':before_chars,'afterCharacters':after_chars,
                            'characterReductionPercent':round((1-after_chars/before_chars)*100,2),
                            'actualTokenReduction':'not measured'},
                  approvalResponseMode='explicit pending-question reply; no click-origin adapter required',
                  gameEdits=False,imageGenerationCalls=0,gitCommits=0)
    (out/'validation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (out/'orca-worktrees-after.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result,ensure_ascii=False,indent=2))


if __name__=='__main__': main()
