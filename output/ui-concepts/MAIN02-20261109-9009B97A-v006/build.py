from pathlib import Path
import shutil
out=Path(__file__).resolve().parent;previous=out.parent/'MAIN02-20261109-9009B97A-v005'
(out/'backgrounds').mkdir(exist_ok=True);shutil.copy2(previous/'backgrounds/snow.png',out/'backgrounds/snow.png')
shutil.copy2(previous/'assets.js',out/'assets.js')
(out/'concepts.html').write_text('''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>D3 · 정비와 전장</title><link rel="stylesheet" href="../../../게임/src/mobile-ui.css"><link rel="stylesheet" href="layout.css"><body><main id="stage"></main><script src="assets.js"></script><script src="screens.js"></script></body></html>''',encoding='utf-8')
print('Only read-only background and art helpers reused; screen layout new')
