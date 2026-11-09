from pathlib import Path
import json,hashlib,difflib
from PIL import Image,ImageChops,ImageOps
out=Path.cwd()/'output'/'MAIN01-20261109-1DA15A51'
root=Path(r'C:\Users\user\Desktop\Grid Defenders\게임')
m=json.loads((root/'public/assets/dev-image-compare/directions_v02/asset-manifest.json').read_text(encoding='utf-8-sig'))
arts=[a for v in m['assets'].values() for a in v.values()]
checks=[]
for a in arts:
 p=root/'public/assets/dev-image-compare/directions_v02'/a['file'];im=Image.open(p).convert('RGBA');alpha=im.getchannel('A');bbox=alpha.point(lambda n:255 if n>=32 else 0).getbbox()
 checks.append(dict(file=a['file'],sha256=hashlib.sha256(p.read_bytes()).hexdigest(),sourceMatches=p.read_bytes()==Path(a['source']).read_bytes(),dimensions=list(im.size),alphaExtrema=alpha.getextrema(),alpha32Bounds=bbox,passed=hashlib.sha256(p.read_bytes()).hexdigest()==a['sha256'] and list(bbox)==a['alpha32Bounds'] and im.size==(a['width'],a['height'])))
mirror=[]
for v in m['assets'].values():
 f=Image.open(root/'public/assets/dev-image-compare/directions_v02'/v['front']['file']).convert('RGBA')
 for d in ['right45','right90']:
  im=Image.open(root/'public/assets/dev-image-compare/directions_v02'/v[d]['file']).convert('RGBA')
  mirror.append({'file':v[d]['file'],'notMirroredFront':ImageChops.difference(im,ImageOps.mirror(f)).getbbox() is not None})
integrated=json.loads(Path(r'C:\Users\user\Desktop\Grid Defenders\메인작업\main01\dev-image-compare\통합결과.json').read_text(encoding='utf-8-sig'))
changes=[]
for x in integrated['changes']:
 if x['path'].endswith('main.ts'):
  old=Path(x['backup']).read_text(encoding='utf-8');new=Path(x['path']).read_text(encoding='utf-8');d=list(difflib.unified_diff(old.splitlines(),new.splitlines(),fromfile='before',tofile=x['workspace']))
  changes.append({'workspace':x['workspace'],'added':sum(l.startswith('+') and not l.startswith('+++') for l in d),'removed':sum(l.startswith('-') and not l.startswith('---') for l in d)})
  (out/(x['workspace']+'-main.diff')).write_text('\n'.join(d),encoding='utf-8')
(out/'asset-audit.json').write_text(json.dumps({'assets':checks,'notMirror':mirror,'mainPatch':changes},ensure_ascii=False,indent=2),encoding='utf-8')
print('assets',len(checks),all(c['passed'] and c['sourceMatches'] for c in checks),'nonmirror',all(x['notMirroredFront'] for x in mirror),'patch',changes)
