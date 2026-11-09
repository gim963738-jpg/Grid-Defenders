"""Write a compact self-contained Orca player and package the completed deliverables."""
import zipfile
from render import OUT, ROOT, digest, save_json


def inline_preview():
    # Chat CSP blocks video tags; draw actual frames with permitted image/canvas.
    from chat_player import build
    build()


def package():
    archive = OUT/'sword-overhead-right-complete.zip'
    files = sorted(p for p in OUT.rglob('*') if p.is_file() and p != archive and p.name!='manifest.json')
    save_json(OUT/'manifest.json', {
        'archive': archive.name, 'delivery': '4 seconds, 60fps, 240 frames, transparent RGBA',
        'files': [{'path': p.relative_to(OUT).as_posix(), 'bytes': p.stat().st_size,
                   'sha256': digest(p)} for p in files]})
    files.append(OUT/'manifest.json')
    with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        for path in files:
            z.write(path, path.relative_to(OUT).as_posix())
        for path in sorted(p for p in (ROOT/'tools/sword-animation').iterdir() if p.suffix in ('.py','.ps1','.html')):
            z.write(path, 'reproduce/'+path.name)
        z.write(ROOT/'tools/sword-animation/requirements.txt', 'reproduce/requirements.txt')
        for path in sorted((ROOT/'문서/03_작업기록/VID-001_양손검내려치기').glob('*.md')):
            z.write(path, 'documentation/'+path.name)
    with zipfile.ZipFile(archive) as z:
        assert z.testzip() is None
        assert len([n for n in z.namelist() if n.startswith('frames/')]) == 240
        print('Verified ZIP:', len(z.namelist()), 'entries;', archive.stat().st_size, 'bytes', flush=True)


if __name__ == '__main__':
    inline_preview()
    package()
