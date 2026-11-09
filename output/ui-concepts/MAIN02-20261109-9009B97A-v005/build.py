from pathlib import Path
import shutil
out=Path(__file__).resolve().parent
old=out.parent/'MAIN02-20261109-9009B97A-v004'
(out/'backgrounds').mkdir(exist_ok=True)
shutil.copy2(old/'backgrounds/snow.png',out/'backgrounds/snow.png')
# Only read-only asset definitions, never the rejected screen structure.
helpers='\n'.join((old/'ui.js').read_text(encoding='utf-8').splitlines()[:4])
(out/'assets.js').write_text("const assets='../../../게임/public/assets/';\n"+helpers,encoding='utf-8')
(out/'concepts.html').write_text('''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>D3 · 전장 준비</title><link rel="stylesheet" href="../../../게임/src/mobile-ui.css"><link rel="stylesheet" href="flow.css"><body><main id="stage"></main><script src="assets.js"></script><script src="flow.js"></script></body></html>''',encoding='utf-8')
print('Independent new screens: asset definitions + snow backdrop only')
