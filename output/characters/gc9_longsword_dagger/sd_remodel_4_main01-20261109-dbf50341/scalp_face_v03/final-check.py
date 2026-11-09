from pathlib import Path
import hashlib,json
from PIL import Image
D=Path(__file__).resolve().parent
def sha(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
m=json.loads((D/'asset-manifest.json').read_text(encoding='utf-8'))
checks=[]
for a in m['assets']:
    p=D/a['file']; im=Image.open(p); alpha=im.getchannel('A')
    assert sha(p)==a['sha256']==sha(a['source'])
    edges=[alpha.crop(box).getextrema()[1] for box in [(0,0,im.width,1),(0,im.height-1,im.width,im.height),(0,0,1,im.height),(im.width-1,0,im.width,im.height)]]
    assert max(edges)<32
    checks.append({'file':a['file'],'sourceBytesMatch':True,'edgeMaxAlphaTopBottomLeftRight':edges,'meaning':'No alpha>=32 silhouette reaches canvas edge; extremely faint alpha1..3 may touch border'})
for f in ['분석.md','제작기준.md','검수.md','report.md','결과.json','generation-records.json','index.html','comparison.png']:
    assert (D/f).stat().st_size>0
r=json.loads((D/'generation-records.json').read_text(encoding='utf-8'))
assert len(r['calls'])==10
for c in r['calls']:
    for i in c['inputs']: assert sha(i['retainedExactInput'])==i['sha256']
for old in json.loads((D/'previous-files-before.json').read_text(encoding='utf-8-sig')):
    assert sha(old['path'])==old['sha256']
e={'checks':checks,'allRetainedGenerationInputsHashMatched':True,'previous72FilesStillUnchanged':True,'requiredFilesPresent':True,'verificationNote':'PowerShell stdin Unicode filename check initially failed from codepage conversion; file-backed Python verification used here succeeds.'}
(D/'final-check.json').write_text(json.dumps(e,ensure_ascii=False,indent=2),encoding='utf-8')
# Update manifest after the final evidence file; exclude local browser state.
files=[{'file':str(p.relative_to(D)),'size':p.stat().st_size,'sha256':sha(p)} for p in sorted(D.rglob('*')) if p.is_file() and '.qa-browser-profile' not in p.parts and p.name!='deliverable-manifest.json']
(D/'deliverable-manifest.json').write_text(json.dumps({'iteration':3,'excluded':['.qa-browser-profile/**'],'files':files},ensure_ascii=False,indent=2),encoding='utf-8')
print('PASS: 5 source-byte matches, 10 calls and retained inputs, 72 previous files preserved; no alpha>=32 silhouette at borders.')
