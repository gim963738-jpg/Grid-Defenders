"""Verify role connections, preserved originals, copied runtime, and workflow links."""
import hashlib
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
SHARED = ROOT/'작업관리'


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    result = {'status':'checking','checks':[]}
    active_catalog = read(SHARED/'브랜치목록.json')
    target = SHARED/('기록/OPS-003/운영연결검증.json' if active_catalog.get('organizationFile') else '기록/OPS-002/운영연결검증.json' if active_catalog.get('hierarchyVersion') else '기록/OPS-001/검증.json')
    target.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    def check(ok, label):
        if not ok:
            raise AssertionError(label)
        result['checks'].append(label)
    baseline = read(SHARED/'기록/OPS-001/baseline.json')
    backup = Path(baseline['backup'])
    check(backup.is_dir() and (backup/'baseline.json').is_file(),'external backup and baseline exist')
    connectors = read(SHARED/'기록/OPS-001/connector-manifest.json')['changes']
    for item in connectors:
        original = backup/'before-connectors'/item['role']/'AGENTS.md'
        check(Path(item['path']).read_bytes().startswith(original.read_bytes()),'existing AGENTS prefix preserved: '+item['role'])
    copied = read(SHARED/'기록/OPS-001/ui-copy-manifest.json')
    ui = Path(copied['destination'])
    game_files = [item for item in copied['files'] if item['path'].replace('\\','/').startswith('게임/')]
    check(all(sha(ROOT/item['path']) == item['sha256'] for item in game_files),'original pending game files remain unchanged')
    check(all(sha(ui/item['path']) == item['sha256'] for item in copied['files']),'all copied UI snapshot files match recorded hashes')
    public = read(SHARED/'기록/OPS-001/ui-public-manifest.json')['files']
    check(all(sha(ui/item['path']) == item['sha256'] for item in public),'all UI public runtime resources match')
    designs = read(SHARED/'기록/OPS-001/ui-design-references.json')['files']
    check(all(sha(ui/item['path']) == item['sha256'] and sha(ROOT/item['path']) == item['sha256'] for item in designs),'existing UI concept references copied and originals preserved')
    paths = [p for folder in ['게임/src','게임/tests'] for p in (ROOT/folder).rglob('*') if p.is_file()]
    endings = []
    def same_content(p):
        other = ui/p.relative_to(ROOT)
        if not other.is_file():return False
        a,b = p.read_bytes(),other.read_bytes()
        if a == b:return True
        if p.suffix in {'.ts','.css','.html','.json','.md'} and a.replace(b'\r\n',b'\n') == b.replace(b'\r\n',b'\n'):
            endings.append(p.relative_to(ROOT).as_posix())
            return True
        return False
    check(all(same_content(p) for p in paths),'complete game source and test contents match (checkout line endings normalized)')
    registry = read(SHARED/'브랜치목록.json')['branches']
    mains = read(SHARED/'메인목록.json')['mains']
    expected_roles = read(SHARED/'브랜치목록.json').get('expectedRoleCount',8)
    check(len(mains)==3 and len(registry)==expected_roles,'three mains and the registered specialist/domain roles')
    for role,entry in {**mains,**registry}.items():
        pointer = read(Path(entry['path'])/'작업연결.json')
        check(Path(pointer['sharedRoot']).resolve()==SHARED,'shared authority pointer resolves: '+role)
    for role in ['main01','main02','main03','ui']:
        receipt = read(SHARED/'기록/OPS-001/초기화'/(role+'.json'))
        check(receipt.get('ready') is True and receipt.get('role')==role,'role read-and-ready acknowledgement: '+role)
        check(Path(receipt['sharedRoot']).resolve()==SHARED,'acknowledgement points to shared authority: '+role)
    for role in ['main02','main03','ui']:
        receipt = read(SHARED/'기록/OPS-001/영수증'/(role+'-launch.json'))
        check(receipt.get('ok') is True and receipt['result']['outcome']['kind']=='structured'
              and receipt['result']['prompt']['outcome']=='journaled','actual chat launch and initial prompt receipt: '+role)
    from importlib.util import spec_from_file_location, module_from_spec
    spec=spec_from_file_location('workflow_board',SHARED/'도구/작업대장.py')
    module=module_from_spec(spec);spec.loader.exec_module(module)
    check(module.Board(SHARED).listing()==[],'no example production tasks or dispatches were created')
    check(not (SHARED/'상태/writer.lock').exists(),'no stale writer lock')
    files=list(SHARED.rglob('*.md'))
    for folder in ['OPS-001_다중메인작업체계준비','OPS-002_세계관도메인계층정리']:
        files+=list((ROOT/'문서/03_작업기록'/folder).glob('*.md'))
    count=0;missing=[]
    for p in files:
        for link in re.findall(r'\]\(([^)]+)\)',p.read_text(encoding='utf-8')):
            if link.startswith(('http:','https:','#','mailto:')):continue
            name=link.split('#',1)[0].strip('<>')
            if name:
                count+=1
                if not (p.parent/name).exists():missing.append({'file':str(p),'link':name})
    check(not missing,'new workflow and preparation document links resolve')
    result.update(status='PASS',linkCount=count,uiSnapshotFiles=len(copied['files']),publicResources=len(public),originalGameFiles=len(game_files),checkoutLineEndingDifferences=endings)
    target.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result,ensure_ascii=False,indent=2))


if __name__ == '__main__':
    main()
