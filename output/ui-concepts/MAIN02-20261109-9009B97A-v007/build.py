from pathlib import Path
import shutil
out=Path(__file__).resolve().parent;old=out.parent/'MAIN02-20261109-9009B97A-v006'
(out/'backgrounds').mkdir(exist_ok=True)
for name in ['assets.js','layout.css','screens.js'] :shutil.copy2(old/name,out/name)
shutil.copy2(old/'backgrounds/snow.png',out/'backgrounds/snow.png')
(out/'concepts.html').write_text('''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>D3 · 차수7</title><link rel="stylesheet" href="../../../게임/src/mobile-ui.css"><link rel="stylesheet" href="layout.css"><link rel="stylesheet" href="additions.css"><body><main id="stage"></main><script src="assets.js"></script><script src="screens.js"></script><script src="additions.js"></script></body></html>''',encoding='utf-8')
print('v006 read-only copy retained; four details added separately')
