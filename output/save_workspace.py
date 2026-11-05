"""Preserve this conversation's references and a restorable project snapshot."""
from pathlib import Path
from datetime import datetime
import hashlib
import json
import shutil
import zipfile

root = Path(__file__).resolve().parents[1]
attachment_root = Path('C:/Users/NM333-76/AppData/Roaming/orca/agent-session-attachments')
references = [
    ('01_모델1', 'abe02ce4-d8fe-4ad2-a5f7-86c278ac2596'),
    ('02_모델2', '905a0302-3c60-48fd-a96d-629aeb03be15'),
    ('03_모델3', '5721694f-8cb8-4db5-b223-47eb2d4047aa'),
    ('04_모델4', 'a30af1d6-712e-4439-ae09-68d74d3f4464'),
    ('05_영웅목록상세요청', '03723d7b-5b91-4a7a-b94a-a941af88f8f2'),
    ('06_임무아이콘요청', '82d79d7d-7d12-40a1-a198-76de417614bb'),
    ('07_로비8칸편성요청', '8dd29790-2ca9-4c03-8800-fc80006a913b'),
]
records = []
for label, folder in references:
    source_dir = attachment_root / folder
    if not source_dir.is_dir():
        raise FileNotFoundError(source_dir)
    for source in sorted(source_dir.rglob('*')):
        if not source.is_file():
            continue
        destination = root / '자료' / '첨부파일' / label / source.relative_to(source_dir)
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)
        source_hash = hashlib.sha256(source.read_bytes()).hexdigest()
        if hashlib.sha256(destination.read_bytes()).hexdigest() != source_hash:
            raise RuntimeError(f'Copy mismatch: {destination}')
        records.append({'file': destination.relative_to(root).as_posix(), 'source': str(source),
                        'bytes': destination.stat().st_size, 'sha256': source_hash})

stamp = datetime.now().strftime('%Y%m%d-%H%M%S')
reference_manifest = root / '자료' / '첨부파일' / '첨부파일목록.json'
reference_manifest.write_text(json.dumps({'saved_at': stamp, 'files': records}, ensure_ascii=False, indent=2), encoding='utf-8')
backup_dir = root / 'output' / 'backups'
backup_dir.mkdir(parents=True, exist_ok=True)
archive_path = backup_dir / f'Grid-Defenders-{stamp}.zip'
excluded = {'.git', 'node_modules', '__pycache__', '.pytest_cache'}
files = sorted(p for p in root.rglob('*') if p.is_file()
               and not any(part in excluded for part in p.relative_to(root).parts)
               and backup_dir not in p.parents)
entries = []
with zipfile.ZipFile(archive_path, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
    for file in files:
        relative = file.relative_to(root).as_posix()
        archive.write(file, relative)
        entries.append({'file': relative, 'bytes': file.stat().st_size,
                        'sha256': hashlib.sha256(file.read_bytes()).hexdigest()})
with zipfile.ZipFile(archive_path) as archive:
    damaged = archive.testzip()
    if damaged:
        raise RuntimeError(f'Backup damaged: {damaged}')
    if len(archive.namelist()) != len(entries):
        raise RuntimeError('Backup entry count mismatch')
manifest_path = archive_path.with_suffix('.manifest.json')
manifest_path.write_text(json.dumps({'saved_at': stamp, 'archive': archive_path.name,
                                    'attachments': len(records), 'files': entries},
                                   ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'archive': str(archive_path), 'manifest': str(manifest_path),
                  'attachments': len(records), 'project_files': len(entries),
                  'archive_bytes': archive_path.stat().st_size, 'integrity': 'passed'}, ensure_ascii=False))
