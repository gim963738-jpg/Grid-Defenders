"""Publish local result files in the common viewer without changing original bytes."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil

PUBLIC = Path(__file__).resolve().parents[1]/'public'
VIEWER = PUBLIC/'dev-previews/viewer'


def digest(p): return hashlib.sha256(p.read_bytes()).hexdigest()


def register(manifest, viewer=VIEWER):
    if not isinstance(manifest.get('id'), str) or not manifest['id'] or any(c not in 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_' for c in manifest['id']):
        raise ValueError('영문·숫자·하이픈·밑줄 작업 ID가 필요합니다.')
    if not isinstance(manifest.get('assets'), list) or not 1 <= len(manifest['assets']) <= 2000 or not isinstance(manifest.get('title'), str) or not manifest['title']:
        raise ValueError('작업명과 결과물 목록이 필요합니다.')
    viewer = Path(viewer)
    lock = viewer/'catalog.lock'
    try:
        fd = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
    except FileExistsError:
        raise ValueError('다른 결과를 등록 중입니다. 기존 등록이 끝난 뒤 다시 실행하세요.')
    try:
        os.close(fd)
        catalog_file = viewer/'catalog.json'
        data = json.loads(catalog_file.read_text(encoding='utf-8-sig'))
        assets, ids = [], set()
        for a in manifest['assets']:
            if not isinstance(a, dict): raise ValueError('이미지 목록의 형식이 잘못되었습니다.')
            ident = a.get('id')
            if not isinstance(ident, str) or not ident or any(c not in 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_' for c in ident) or ident in ids:
                raise ValueError('중복 없는 안전한 이미지 ID가 필요합니다.')
            ids.add(ident)
            if a.get('sheet'):
                sheet = a['sheet']
                cols, rows = sheet.get('columns'), sheet.get('rows')
                count = sheet.get('count', (cols or 0)*(rows or 0))
                if any(type(n) is not int for n in [cols, rows, count]) or not 1 <= cols <= 128 or not 1 <= rows <= 128 or not 1 <= count <= min(4096, cols*rows):
                    raise ValueError('시트의 가로·세로 칸과 프레임 수를 확인하세요.')
            source = Path(a['file']).resolve()
            if not source.is_file() or source.suffix.lower() not in {'.png', '.jpg', '.jpeg', '.webp', '.gif'}:
                raise ValueError('실제 PNG/JPEG/WebP/GIF 파일이 필요합니다.')
            checksum = digest(source)
            dest = viewer/'collections'/manifest['id']/(ident+'-'+checksum[:12]+source.suffix.lower())
            dest.parent.mkdir(parents=True, exist_ok=True)
            if not dest.exists(): shutil.copy2(source, dest)
            if digest(dest) != checksum: raise ValueError('원본 바이트 대조 실패')
            record = {k: a[k] for k in ['id', 'label', 'role', 'referenceId', 'kind', 'sheet', 'bodyHeight'] if k in a}
            record.update(label=a.get('label', ident), src='/dev-previews/viewer/'+dest.relative_to(viewer).as_posix(), sha256=checksum)
            assets.append(record)
        if manifest.get('referenceId') and manifest['referenceId'] not in ids:
            raise ValueError('기준 이미지도 같은 목록에 등록하세요.')
        if any(a.get('referenceId') and a['referenceId'] not in ids for a in assets):
            raise ValueError('참조 이미지를 찾을 수 없습니다.')
        collection = {'id': manifest['id'], 'title': manifest['title'], 'assets': assets, 'registeredTask': True}
        if manifest.get('referenceId'): collection['referenceId'] = manifest['referenceId']
        data['collections'] = [collection] + [c for c in data['collections'] if c['id'] != manifest['id']]
        temp = viewer/'catalog.next.json'
        temp.write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
        os.replace(temp, catalog_file)
        return {'entry': '/dev-previews/viewer/index.html', 'collection': manifest['id'], 'catalogFile': str(catalog_file.resolve()), 'assetCount': len(assets)}
    finally:
        lock.unlink()


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--manifest', required=True, help='id,title,assets[{id,label,file,referenceId?,sheet?}],referenceId? JSON')
    a = p.parse_args()
    try:
        result = register(json.loads(Path(a.manifest).read_text(encoding='utf-8-sig')))
        print(json.dumps(result, ensure_ascii=False, indent=2))
    except (ValueError, OSError, KeyError) as error:
        p.exit(2, str(error)+'\n')


if __name__ == '__main__': main()
