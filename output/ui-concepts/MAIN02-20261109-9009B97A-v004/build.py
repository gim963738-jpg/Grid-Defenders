from pathlib import Path
import shutil,json
out=Path(__file__).resolve().parent;old=out.parent/'MAIN02-20261109-9009B97A-v003'
shutil.copy2(old/'skins.css',out/'skins.css');(out/'backgrounds').mkdir(exist_ok=True);shutil.copy2(old/'backgrounds/snow.png',out/'backgrounds/snow.png')
s=(old/'concepts.html').read_text(encoding='utf-8');s=s[:s.index('const stages=')]
s=s.replace('href="panels.css"','href="layout.css"')
extra=Path(out/'ui.js').read_text(encoding='utf-8')
(out/'concepts.html').write_text(s+extra+'</script></body></html>',encoding='utf-8')
print('v004 independent source assembled')
