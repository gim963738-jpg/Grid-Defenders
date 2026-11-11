import hashlib
import json
import shutil
import urllib.request
import time
from pathlib import Path
from urllib.parse import quote

root = Path(__file__).resolve().parents[3]
coord = Path(__file__).resolve().parent
connection = json.loads((coord / '연결.json').read_text(encoding='utf-8'))
source = Path(connection['output'])
target = root / '게임/public/dev-previews/balor-sd-guard6-v001'
base = 'http://127.0.0.1:5173/dev-previews/balor-sd-guard6-v001/'
names = ['index.html', 'player.js', 'comparison.png', 'comparison-dark.png',
         '보고.md', '검수.md', '제작기준.md', 'asset-manifest.json',
         'generation-records.json', 'input-manifest.json']
files = [source / name for name in names]
for folder in ['built-in', 'image26', 'inputs', 'evidence']:
    files.extend(p for p in (source / folder).iterdir()
                 if p.is_file() and p.suffix.lower() in {'.png', '.json'})
records = []
for item in sorted(set(files)):
    rel = item.relative_to(source)
    dest = target / rel
    data = item.read_bytes()
    if item.suffix in {'.json', '.js', '.html', '.md'}:
        import re
        assert not re.search(rb'sk-(?:proj-)?[A-Za-z0-9_-]{24,}', data), str(rel)
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists():
        assert dest.read_bytes() == data, 'Existing destination differs: ' + str(rel)
    else:
        shutil.copy2(item, dest)
    records.append({'file': rel.as_posix(), 'bytes': len(data),
                    'sha256': hashlib.sha256(data).hexdigest()})
time.sleep(1)
for record in records:
    rel = Path(record['file'])
    data = (source / rel).read_bytes()
    dest = target / rel
    # Allow the existing Vite file watcher to notice newly copied static files.
    for attempt in range(10):
        received = urllib.request.urlopen(base + quote(rel.as_posix()), timeout=20).read()
        if received == data:
            break
        time.sleep(0.3)
    assert received == data == dest.read_bytes(), str(rel)
    record['httpByteMatch'] = True
result = {'task': connection['task'], 'workerOutcome': 'failed',
          'userAccepted': False, 'url': base.replace('127.0.0.1', 'localhost') + 'index.html',
          'files': records, 'fileCount': len(records),
          'excluded': ['.qa-profile', 'api', 'prompts', 'generations', 'generation scripts', 'read-pack']}
(coord / '게시검증.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({k: v for k, v in result.items() if k != 'files'}, ensure_ascii=False))
