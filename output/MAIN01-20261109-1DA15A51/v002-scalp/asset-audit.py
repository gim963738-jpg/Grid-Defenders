from pathlib import Path
import json,hashlib,re
from PIL import Image
out=Path.cwd()/'output/MAIN01-20261109-1DA15A51/v002-scalp'
root=Path(r'C:\Users\user\Desktop\Grid Defenders\게임')
m=json.loads((root/'public/assets/dev-image-compare/scalp_face_v03/asset-manifest.json').read_text(encoding='utf-8-sig'))
s=(root/'src/devImageCompareArt.ts').read_text(encoding='utf-8')
a=json.loads(s[s.index('['):s.rindex(']')+1])
checks=[]
for meta in m['assets']:
 if meta['variant']==0:continue
 p=root/'public/assets/dev-image-compare/scalp_face_v03'/meta['file'];im=Image.open(p).convert('RGBA');alpha=im.getchannel('A');bbox=alpha.point(lambda n:255 if n>=32 else 0).getbbox();runtime=next(x for x in a if x['variant']==meta['variant']+4)
 c={'file':meta['file'],'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'source':meta['source'],'sourceBytesMatch':p.read_bytes()==Path(meta['source']).read_bytes(),'size':im.size,'alpha32Bounds':bbox,'alphaMinMax':alpha.getextrema(),'runtime':runtime}
 c['passed']=c['sha256']==meta['sha256'] and c['sourceBytesMatch'] and list(bbox)==meta['alpha32Bounds'] and im.size==(meta['width'],meta['height']) and runtime['bodyHeight']==meta['bodyHeight'] and runtime['footX']==meta['footAnchor']['x'] and runtime['footY']==meta['footAnchor']['y'] and runtime['width']==im.width and runtime['height']==im.height
 checks.append(c)
(out/'asset-audit.json').write_text(json.dumps({'checks':checks,'runtimeCatalogCount':len(a),'passed':all(x['passed'] for x in checks)},ensure_ascii=False,indent=2),encoding='utf-8')
print('new assets',len(checks),'PASS',all(x['passed'] for x in checks))

