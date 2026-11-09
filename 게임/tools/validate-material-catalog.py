"""Verify every normalized frame against its source, coordinates and transparent gutters."""
from pathlib import Path
from PIL import Image, ImageChops
import json, sys
sys.stdout.reconfigure(encoding='utf-8')
root=Path(__file__).resolve().parents[2]/'.local'/'effect-materials'
catalog=json.loads((root/'catalog.json').read_text(encoding='utf-8'))
assert len({m['id'] for m in catalog['materials']})==len(catalog['materials'])
count=0;exact=0;dark=0;failures=[]
for m in catalog['materials']:
    atlas=None;page=None;source=None;sourcepath=None
    for i,f in enumerate(m['frames']):
        if page!=f['sheet']:
            if atlas:atlas.close()
            page=f['sheet'];atlas=Image.open(root/m['sheets'][page]).convert('RGBA')
        x,y,w,h=f['x'],f['y'],f['width'],f['height'];pad=m['padding']
        assert x>=0 and y>=0 and x+w<=atlas.width and y+h<=atlas.height
        cell=atlas.crop((x,y,x+w,y+h));a=cell.getchannel('A')
        for box in [(0,0,w,pad),(0,h-pad,w,h),(0,0,pad,h),(w-pad,0,w,h)]:
            assert not a.crop(box).getbbox(),(m['id'],i,'padding alpha')
        core=cell.crop((pad,pad,pad+m['width'],pad+m['height']))
        if sourcepath!=f['source']:
            if source:source.close()
            sourcepath=f['source'];source=Image.open(root/sourcepath)
        if sourcepath.lower().endswith('.gif'):source.seek(i)
        sx,sy,sw,sh=f['sourceRect'];original=source.convert('RGBA').crop((sx,sy,sx+sw,sy+sh))
        assert original.size==core.size
        if m['sourceBackground']=='transparent':
            assert core.tobytes()==original.tobytes(),(m['id'],i,'source mismatch')
            exact+=1
        else:
            # Matte conversion must reproduce the original light on black, with rounding only.
            bg=Image.new('RGBA',core.size,'black');bg.alpha_composite(core)
            before=Image.new('RGBA',core.size,'black');before.alpha_composite(original)
            extrema=ImageChops.difference(bg.convert('RGB'),before.convert('RGB')).getextrema()
            assert max(v[1] for v in extrema)<=2,(m['id'],i,extrema)
            dark+=1
        count+=1
    if source:source.close()
    if atlas:atlas.close()
    assert (root/m['contact']).is_file() and (root/m['preview']).is_file()
    if count%1000<150:print('Verified',count,flush=True)
result={'packs':len(catalog['packs']),'materials':len(catalog['materials']),'frames':count,'exactSourceFrames':exact,'darkMatteFrames':dark,'allSourceRectsInBounds':True,'allTransparentGutters':True,'uniqueIds':True,'originalEdgeContactMaterials':sum(bool(m['edgeFrames']) for m in catalog['materials']), 'pending':catalog['pending'],'manualVisualReview':'Representative packs only; all-frame bright contact sheets are available per material.'}
(root/'frame-audit.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(result,ensure_ascii=False),flush=True)
