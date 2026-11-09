"""Read-only project inventory and a recoverable snapshot before workflow setup."""
import hashlib
import json
from datetime import datetime
from pathlib import Path
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[2]
BASE = Path('C:/Users/user/orca/workspaces/Grid Defenders')
ROLES = {'ui': ROOT, 'items': BASE/'item-system', 'monsters': BASE/'몬스터-디자인',
         'effects': BASE/'스킬-이펙트', 'sprites': BASE/'스프라이트-시트작업',
         'splash': BASE/'스플래시-아트', 'video': BASE/'영상제작', 'characters': BASE/'캐릭터디자인2'}

def git(path, *args):
    return subprocess.check_output(['git', *args], cwd=path).decode('utf-8')

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def main():
    stamp = datetime.now().astimezone().strftime('%Y%m%d-%H%M%S')
    backup = Path('C:/Users/user/orca/backups/Grid Defenders')/('workflow-'+stamp)
    backup.mkdir(parents=True, exist_ok=False)
    changed = set(git(ROOT, 'diff', '--name-only', '-z', 'HEAD').split('\0'))
    changed.update(git(ROOT, 'ls-files', '--others', '--exclude-standard', '-z').split('\0'))
    files = []
    for rel in sorted(changed-{''}):
        source = (ROOT/rel).resolve()
        if not source.is_relative_to(ROOT) or not source.is_file():
            continue
        dest = backup/'root-files'/rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, dest)
        files.append({'path':rel, 'sha256':digest(source), 'bytes':source.stat().st_size})
    rules = {}
    for role, path in ROLES.items():
        agent = path/'AGENTS.md'
        if agent.exists():
            dest = backup/'agents'/role/'AGENTS.md'
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(agent, dest)
        tracked = git(path, 'ls-files', '-z').split('\0')
        untracked = git(path, 'ls-files', '--others', '--exclude-standard', '-z').split('\0')
        candidates = []
        for rel in sorted(set(tracked+untracked)-{''}):
            p = path/rel
            if p.suffix.lower() not in {'.md', '.json'} or not p.is_file():
                continue
            if not any(k in p.name.lower() for k in ('agents.md','규정','규칙','기준','가이드','지침','guide','readme')):
                continue
            if any(k in rel.replace('\\','/').split('/') for k in ('before','snapshot','node_modules','.git')):
                continue
            candidates.append({'path':rel,'sha256':digest(p),'kind':'per-artifact' if rel.startswith('output') else 'existing-reference'})
        rules[role] = {'path':str(path),'head':git(path,'rev-parse','HEAD').strip(),
                       'branch':git(path,'branch','--show-current').strip(),
                       'status':git(path,'status','--porcelain=v1','--untracked-files=all'),
                       'agentSha256':digest(agent) if agent.exists() else None,
                       'criteria':candidates,'review':'Core instructions read; other references indexed for mandatory task-specific reading.'}
    snapshot = {'createdAt':datetime.now().astimezone().isoformat(),'root':str(ROOT),
                'backup':str(backup),'head':git(ROOT,'rev-parse','HEAD').strip(),
                'remoteMain':git(ROOT,'ls-remote','origin','refs/heads/main').strip(),
                'files':files,'roles':rules}
    (backup/'baseline.json').write_text(json.dumps(snapshot,ensure_ascii=False,indent=2),encoding='utf-8')
    (backup/'root.patch').write_bytes(subprocess.check_output(['git','diff','--binary','HEAD'],cwd=ROOT))
    out = ROOT/'작업관리/기록/OPS-001'
    out.mkdir(parents=True,exist_ok=True)
    (out/'baseline.json').write_text(json.dumps(snapshot,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'backup':str(backup),'savedFiles':len(files),'roles':len(rules),
                      'criteria':sum(len(r['criteria']) for r in rules.values())},ensure_ascii=False))

if __name__ == '__main__':
    main()
