"""Build the shared review catalog from existing, unmodified preview assets."""
from pathlib import Path
import hashlib
import json
import shutil

GAME = Path(__file__).resolve().parents[1]
ROOT = GAME.parent
PUBLIC = GAME / 'public'
BASE = PUBLIC / 'dev-previews'
VIEWER = BASE / 'viewer'
TITLES = {
    'balor-sunburst13-main01-v001': '발로르 · Sunburst 13모션',
    'balor-sd-guard35-v003': '발로르 · 전투태세 35° 수정',
    'blond-balor-035-v003': '금발 전사 · 발로르 3방향',
    'idle6-style1-style4': '1번 · 4번 기본 자세',
    'lena-threeviews-sd-v001': '레나 · 일러스트와 SD',
    'lena-illustration-v001': '레나 · 일러스트',
    'balor-motions-dual-v001': '발로르 · 두 경로 모션',
    'body-parts8-v001': '공통 신체 · 전신과 파츠',
    'game-reference10': '인게임 표현 · 10안',
    'monsters': '몬스터 · 방향 비교',
    'blond': '금발 전사 · 기준',
    'mannequin-locomotion-v001': '공통 신체 · 이동 모션',
    'blond-arm-rig3-a-v001': '금발 전사 · 리깅 A',
    'blond-arm-rig3-b-v001': '금발 전사 · 리깅 B',
    'blond-scalp-v03': '금발 전사 · 신체 비율',
    'sd-body-reference4-v001': '공통 신체 · 남녀 시안',
    'balor-builtin35-90-fix-v003': '발로르 · 내장 측면 수정',
    'balor-builtin90-fix-v002': '발로르 · 90° 수정',
    'balor-illustration3-v001': '발로르 · 일러스트 3방향',
    'balor-v9-illustration-sides4-v001': '발로르 v9 · 측면',
    'balor-sd-guard35-v002': '발로르 · 전투태세 35° 이전',
    'balor-sd-guard6-v001': '발로르 · 6방향 비교',
    'balor-sd-provisional-v001': '발로르 · SD 초안',
    'balor-style1': '발로르 · 스타일 1',
    'balor-style1-v002': '발로르 · 스타일 1 수정',
}


def read(path): return json.loads(path.read_text(encoding='utf-8-sig'))
def digest(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def url(path): return '/' + path.resolve().relative_to(PUBLIC.resolve()).as_posix()


def main():
    VIEWER.mkdir(parents=True, exist_ok=True)
    collections = []
    for folder in sorted(BASE.iterdir()):
        if not folder.is_dir() or folder.name in {'viewer', 'battle-sticker-quality-v001'}:
            continue
        assets, used = [], set()
        manifest = read(folder/'asset-manifest.json') if (folder/'asset-manifest.json').exists() else {}
        candidates = manifest.get('assets', [])
        candidates = list(candidates) if isinstance(candidates, list) else []
        working_refs = manifest.get('commonWorkingReferences', [])
        for idx, ref in enumerate(working_refs):
            if isinstance(ref, dict) and ref.get('file'):
                candidates.append({**ref, 'id': 'working-reference-'+str(idx+1),
                                   'label': '거인 · 작업 기준' if 'giant' in ref['file'] else '발로르 · 작업 기준', '_reference': True})
        if folder.name == 'body-parts8-v001':
            candidates = []
            for item in manifest.get('mainImages', []):
                candidates.extend([{'id': item['set']+'-full', 'label': item['set']+' · 전신', 'file': item['file']},
                                   {'id': item['set']+'-parts', 'label': item['set']+' · 파츠', 'file': item['partsBoard']}])
        for item in candidates:
            if not isinstance(item, dict) or not isinstance(item.get('file'), str): continue
            path = (folder/item['file']).resolve()
            if not path.is_file() or not path.is_relative_to(PUBLIC.resolve()) or path.suffix.lower() not in {'.png', '.jpg', '.jpeg', '.webp', '.gif'}: continue
            ident = str(item.get('id') or path.stem)
            if ident in used: ident = str(item.get('route', len(assets)))+'-'+ident
            if ident in used: continue
            used.add(ident)
            a = {'id': ident, 'label': item.get('label') or item.get('name') or ident,
                 'src': url(path), 'kind': 'image', 'sha256': digest(path)}
            if item.get('_reference'): a['role'] = 'reference'
            if item.get('actor'): a['actor'] = item['actor']
            if item.get('bodyHeight'): a['bodyHeight'] = item['bodyHeight']
            # Layouts must be recorded metadata, never inferred from an image's look.
            columns = item.get('columns') or item.get('cols')
            rows = item.get('rows')
            if columns and rows:
                count = item.get('frameCount') or item.get('frames') or columns * rows
                if isinstance(count, list): count = len(count)
                a.update(kind='sheet', sheet={'columns': columns, 'rows': rows, 'count': count})
            elif isinstance(item.get('frames'), list) and item['frames'] and all(isinstance(f, dict) and len(f.get('rect', [])) == 4 for f in item['frames']):
                rects = [f['rect'] for f in item['frames']]
                columns = len({rect[0] for rect in rects}); rows = len({rect[1] for rect in rects})
                a.update(kind='sheet', sheet={'columns': columns, 'rows': rows, 'count': len(rects), 'rects': rects})
            assets.append(a)
        if not assets:
            for path in sorted(folder.glob('*')):
                if path.suffix.lower() not in {'.png', '.jpg', '.jpeg', '.webp', '.gif'}: continue
                assets.append({'id': path.stem, 'label': path.stem, 'src': url(path), 'kind': 'image', 'sha256': digest(path)})
        if not assets: continue
        collection = {'id': folder.name, 'title': TITLES.get(folder.name, folder.name), 'assets': assets}
        before = next((a for a in assets if a['id'] == 'before'), None)
        if before and len(assets) > 1:
            before['role'] = 'reference'; collection['referenceId'] = before['id']
        elif working_refs:
            refs = [a for a in assets if a.get('role') == 'reference']
            if refs:
                collection['referenceId'] = refs[0]['id']
                for a in assets:
                    if a.get('actor') == 'giant' and len(refs) > 1: a['referenceId'] = refs[1]['id']
        collections.append(collection)

    direct = read(ROOT/'메인작업/main01/balor-sunburst13-direct-v001/작업.json')
    target = next(c for c in collections if c['id'] == 'balor-sunburst13-main01-v001')
    target['assets'] = []
    refs = [('balor35', '발로르 35° · 승인 기준'), ('balor90', '발로르 90° · 작업 기준'), ('giant90', '거인 90° · 작업 기준')]
    for item, (ident, label) in zip(direct['sourceReferences'], refs):
        source = Path(item['file']); dest = VIEWER/'references'/(ident+'.png')
        dest.parent.mkdir(parents=True, exist_ok=True)
        if not dest.exists(): shutil.copy2(source, dest)
        if digest(source) != digest(dest): raise ValueError('Reference bytes differ: '+ident)
        target['assets'].append({'id': ident, 'label': label, 'src': url(dest), 'kind': 'image', 'role': 'reference', 'sha256': digest(dest)})
    for job in direct['jobs']:
        path = BASE/target['id']/(job['id']+'.png')
        ref = 'giant90' if job['id'].startswith(('10-', '11-', '12-', '13-')) else 'balor90' if job['camera'] == 90 else 'balor35'
        target['assets'].append({'id': job['id'], 'label': f'{job["label"]} · {job["camera"]}°', 'src': url(path),
                                'kind': 'sheet', 'referenceId': ref,
                                'sheet': {'columns': job['columns'], 'rows': job['rows'], 'count': job['frames']}, 'sha256': digest(path)})
    collections.sort(key=lambda c: (c['id'] != target['id'], c['id'] != 'balor-sd-guard35-v003', c['title']))
    previous = VIEWER/'catalog.json'
    if previous.exists():
        registered = [c for c in read(previous).get('collections', []) if c.get('registeredTask') and c['id'] not in {x['id'] for x in collections}]
        collections.extend(registered)
    (VIEWER/'catalog.json').write_text(json.dumps({'schemaVersion': 1, 'collections': collections}, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(json.dumps({'collections': len(collections), 'assets': sum(len(c['assets']) for c in collections),
                      'recordedSpriteSheets': sum(bool(a.get('sheet')) for c in collections for a in c['assets'])}, ensure_ascii=False))


if __name__ == '__main__': main()
