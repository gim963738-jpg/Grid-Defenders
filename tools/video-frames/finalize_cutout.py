"""Encode, verify, and package the refined transparent output."""
from pathlib import Path
import zipfile
from remove_background import verify_and_package,OUT,ROOT
from verify_transparent import audit

verify_and_package()
audit()
archive=OUT/'gemini-00ffc02e-transparent-240frames.zip'
with zipfile.ZipFile(archive,'a',zipfile.ZIP_STORED) as z:
    existing=set(z.namelist())
    for name in ['verification.json','all-240-frames-light.jpg']:
        if name not in existing:z.write(OUT/name,name)
    for path in sorted((ROOT/'tools/video-frames').iterdir()):
        if path.suffix in ('.py','.txt','.json'):z.write(path,'reproduce/'+path.name)
    for path in sorted((ROOT/'문서/03_작업기록/VID-002_영상240배경제거').glob('*.md')):
        z.write(path,'documentation/'+path.name)
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    assert len(z.namelist())==len(set(z.namelist()))
    assert len([n for n in z.namelist() if n.startswith('frames/')])==240
print('Final archive verified:',archive.stat().st_size,'bytes',flush=True)
