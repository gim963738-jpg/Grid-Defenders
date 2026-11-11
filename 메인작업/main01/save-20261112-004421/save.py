"""One user-requested save: records first, scoped files, normal commit/push, SHA check."""
import argparse
from datetime import datetime
import hashlib
import json
from pathlib import Path
import re
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent
ACTIVE = json.loads((ROOT/'메인작업/main01/save-active.json').read_text(encoding='utf-8-sig'))
EXTERNAL = Path(ACTIVE['external'])
BAD = {'node_modules','dist','__pycache__','.cache','.vite','.git','.forge','qa-game','handoffs','user-data','user_data'}
PATTERNS = [re.compile(rb'\bgh[pousr]_[A-Za-z0-9]{30,}\b'), re.compile(rb'github_pat_[A-Za-z0-9_]{30,}'),
            re.compile(rb'\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{28,}'),
            re.compile(rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----')]
TEXT = {'.md','.json','.py','.js','.mjs','.cjs','.ts','.tsx','.toml','.yaml','.yml','.txt','.html','.ini','.log','.xml','.csv','.css','.svg','.sh','.bat','.ps1'}


def git(*args, data=None):
    p = subprocess.run(['git', *args], cwd=ROOT, input=data, capture_output=True)
    if p.returncode: raise RuntimeError(p.stderr.decode('utf-8','replace')[-3000:])
    return p.stdout


def digest(p):
    h=hashlib.sha256()
    with p.open('rb') as stream:
        for chunk in iter(lambda:stream.read(1024*1024),b''):h.update(chunk)
    return h.hexdigest()


def dump(p, data): p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def read(p): return json.loads(p.read_text(encoding='utf-8-sig'))


def reason(name, size):
    parts=[x.lower() for x in Path(name).parts];base=parts[-1]
    if any(x in BAD or ('profile' in x and any(k in x for k in ['edge','browser','chrome','chromium','qa','headless'])) for x in parts):return 'dependency/cache/browser profile'
    if base.startswith('.env') and base not in {'.env.example','.env.sample','.env.template'}:return 'local environment'
    if base.endswith(('.pyc','.pyo','.tmp','.lock','.bundle')):return 'temporary/lock/bundle'
    if size>=100*1024*1024:return '100MiB per-file GitHub normal Git limit'
    if any(x in base for x in ['credentials','private-key','id_rsa','id_ed25519']):return 'credential filename'
    return None


def inspect_file(path):
    if path.suffix.lower() in TEXT or path.name.lower() in {'agents.md','.npmrc','.gitconfig'}:
        data=path.read_bytes()
        if any(p.search(data) for p in PATTERNS):return 'credential-like literal; content not printed'
    if path.suffix.lower()=='.zip':
        try:
            with zipfile.ZipFile(path) as archive:
                for item in archive.infolist():
                    if item.is_dir():continue
                    if reason(item.filename,item.file_size):return 'archive contains excluded local/cache material'
                    if Path(item.filename).suffix.lower() in TEXT and item.file_size<20*1024*1024:
                        if any(p.search(archive.read(item)) for p in PATTERNS):return 'archive contains credential-like literal'
        except zipfile.BadZipFile:return 'invalid archive'
    return None


def inventory():
    raw=git('status','--porcelain=v1','-z','--untracked-files=all').split(b'\0')
    selected=[];excluded=[]
    for item in raw:
        if not item:continue
        status=item[:2].decode();name=item[3:].decode('utf-8')
        if 'R' in status or 'C' in status:raise RuntimeError('Review rename/copy before saving: '+name)
        path=ROOT/name;size=path.stat().st_size if path.is_file() else 0
        why=reason(name,size)
        if not why and path.is_file():why=inspect_file(path)
        row={'path':name,'status':status,'bytes':size}
        if why:excluded.append({**row,'reason':why})
        else:selected.append({**row,'sha256':digest(path) if path.is_file() else None})
    return selected,excluded


def phase_plan():
    if (HERE/'plan.json').exists():raise RuntimeError('Plan exists; inspect instead of overwriting.')
    if git('rev-parse','HEAD').decode().strip()!=ACTIVE['headBefore']:raise RuntimeError('HEAD changed')
    if git('diff','--cached','--name-only').strip():raise RuntimeError('Preserve existing staging; review it first.')
    selected,excluded=inventory()
    plan={'id':ACTIVE['id'],'at':datetime.now().astimezone().isoformat(),'userQuote':'결과물은 내일아침에 확인할게 저장해놔',
          'headBefore':ACTIVE['headBefore'],'selected':selected,'excluded':excluded,'userAcceptance':'not_reviewed',
          'recordDirectory':ACTIVE['record'],'sourceValidation':'메인작업/main01/unified-viewer-20261112/validation.json',
          'scope':'current root snapshot; current policy files from 15 roles; no worktree merge',
          'planItselfAddedAtCommit':True}
    dump(HERE/'plan.json',plan)
    dump(EXTERNAL/'receipt.json',{'id':ACTIVE['id'],'stage':'recorded_before_commit','remoteVerified':False,
                                'headBefore':ACTIVE['headBefore'],'plan':str(HERE/'plan.json')})
    print(json.dumps({'stage':'planned','files':len(selected),'MiB':round(sum(x['bytes'] for x in selected)/1048576,1),
                      'excluded':len(excluded),'sensitiveExcluded':[x['path'] for x in excluded if 'credential' in x['reason']]},ensure_ascii=False),flush=True)


def phase_commit():
    plan=read(HERE/'plan.json');state=read(EXTERNAL/'receipt.json')
    if state['stage']!='recorded_before_commit':raise RuntimeError('Commit already attempted; inspect receipt.')
    if git('rev-parse','HEAD').decode().strip()!=plan['headBefore']:raise RuntimeError('HEAD changed')
    allowed={x['path'] for x in plan['selected']}|{(HERE/'plan.json').relative_to(ROOT).as_posix()}
    existing=set(git('diff','--cached','--no-renames','--name-only','-z').decode('utf-8').split('\0'))-{''}
    if not existing<=allowed:raise RuntimeError('Another staged change must be preserved.')
    for row in plan['selected']:
        p=ROOT/row['path'];actual=digest(p) if p.is_file() else None
        if actual!=row['sha256']:raise RuntimeError('Selected file changed after plan: '+row['path'])
    paths=[x['path'] for x in plan['selected']]+[(HERE/'plan.json').relative_to(ROOT).as_posix()]
    indexed=set(git('ls-files','-z').decode('utf-8').split('\0'))
    add_paths=[x for x in paths if (ROOT/x).exists() or x in indexed]
    path_file=EXTERNAL/'selected-paths.bin';path_file.write_bytes(b'\0'.join(x.encode('utf-8') for x in add_paths)+b'\0')
    git('--literal-pathspecs','add','-A','--pathspec-from-file='+str(path_file),'--pathspec-file-nul')
    actual=set(git('diff','--cached','--no-renames','--name-only','-z').decode('utf-8').split('\0'))-{''}
    if not actual<=set(paths):raise RuntimeError('Unexpected staged scope; preserve staging for review.')
    unchanged=[]
    for name in set(paths)-actual:
        p=ROOT/name
        head=git('rev-parse','--verify','HEAD:'+name).decode().strip()
        if not p.is_file() or git('hash-object','--path='+name,str(p)).decode().strip()!=head:
            raise RuntimeError('Missing selected change; preserve staging for review: '+name)
        unchanged.append(name)
    check=subprocess.run(['git','diff','--cached','--check'],cwd=ROOT,capture_output=True)
    (EXTERNAL/'whitespace-check.txt').write_bytes(check.stdout+check.stderr)
    message=EXTERNAL/'commit-message.txt'
    message.write_text(ACTIVE['id']+': save unified viewer, workflow and review assets\n\nUser requested one save before morning review. Work records written first.\nIncludes current root state and current startup-policy snapshots for 15 roles.\nViewer tests/build passed; visual acceptance remains not reviewed.\nNo automatic saving enabled and no unrelated worktree merge.\n',encoding='utf-8')
    git('commit','-F',str(message))
    commit=git('rev-parse','HEAD').decode().strip()
    state.update(stage='committed',commit=commit,selectedFiles=len(paths),changedFiles=len(actual),normalizedAlreadySaved=unchanged,committedAt=datetime.now().astimezone().isoformat())
    dump(EXTERNAL/'receipt.json',state)
    print(json.dumps({'stage':'committed','commit':commit,'files':len(paths)},ensure_ascii=False),flush=True)


def phase_push():
    state=read(EXTERNAL/'receipt.json')
    if state['stage']=='remote_verified':print(json.dumps(state,ensure_ascii=False));return
    if state['stage']!='committed' or git('rev-parse','HEAD').decode().strip()!=state['commit']:raise RuntimeError('Expected saved HEAD not present')
    output=git('push','--porcelain','origin','HEAD:refs/heads/main')
    (EXTERNAL/'push.txt').write_bytes(output)
    remote=git('ls-remote','origin','refs/heads/main').decode().split()
    if not remote or remote[0]!=state['commit']:raise RuntimeError('Remote SHA mismatch; do not force push')
    state.update(stage='remote_verified',remoteVerified=True,verifiedAt=datetime.now().astimezone().isoformat(),
                 remoteRef='refs/heads/main',url='https://github.com/gim963738-jpg/Grid-Defenders/commit/'+state['commit'])
    dump(EXTERNAL/'receipt.json',state)
    print(json.dumps(state,ensure_ascii=False,indent=2),flush=True)


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('phase',choices=['plan','commit','push']);args=p.parse_args()
    globals()['phase_'+args.phase]()
