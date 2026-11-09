"""Read-only structural QA. Pixel analysis does not certify anatomy or motion."""
from pathlib import Path
from PIL import Image
import numpy as np
import hashlib, json
ROOT=Path(__file__).resolve().parent
report={'pixelAnalysisOnly':True,'actions':{}}
for action in ['walk','run']:
    atlas=np.asarray(Image.open(ROOT/action/f'{action}-right-30f.png').convert('RGBA'))
    frames=[];arrays=[]
    source=Image.open(ROOT/('walk-generated-v01.png' if action=='walk' else 'run-assembled-v02.png')).convert('RGBA')
    sa=np.asarray(source)
    for i in range(30):
        f=ROOT/action/'frames'/f'{action}-right-{i+1:02d}.png'
        im=Image.open(f).convert('RGBA');a=np.asarray(im);alpha=a[:,:,3]
        ys,xs=np.where(alpha>=16)
        x=(i%6)*229;y=(i//6)*229;s=sa[y:y+229,x:x+229]
        boundary=np.concatenate([s[0,:,3],s[-1,:,3],s[:,0,3],s[:,-1,3]])
        packed=atlas[(i//6)*256:(i//6+1)*256,(i%6)*256:(i%6+1)*256]
        record={'frame':i+1,'size':list(im.size),'sha256':hashlib.sha256(f.read_bytes()).hexdigest(),
          'visibleBoundsAlpha16':[int(xs.min()),int(ys.min()),int(xs.max()),int(ys.max())],
          'sourceBoundaryVisiblePixels':int(np.count_nonzero(boundary>=16)),
          'transparentPixels':int(np.count_nonzero(alpha==0)),
          'nearOpaquePixels':int(np.count_nonzero(alpha>=240)),
          'atlasAlphaMatchesFrame':bool(np.array_equal(a[:,:,3],packed[:,:,3])),
          'atlasMaxRgbDifference':int(np.max(np.abs(a[:,:,:3].astype(int)-packed[:,:,:3].astype(int)))),
          'sourceAlphaPreserved':bool(np.array_equal(s[:,:,3],a[13:242,13:242,3]))}
        # System.Drawing premultiplication rounds RGB by at most one level.
        # Alpha must still be bit-for-bit identical; do not waive alpha errors.
        assert record['size']==[256,256] and record['atlasAlphaMatchesFrame'] and record['atlasMaxRgbDifference']<=1 and record['sourceAlphaPreserved']
        assert record['sourceBoundaryVisiblePixels']==0 and record['transparentPixels']>0 and record['nearOpaquePixels']>0
        frames.append(record)
        af=a[:,:,3:4]/255
        arrays.append(a[:,:,:3]*af+240*(1-af))
    differences=[float(np.mean(np.abs(arrays[(i+1)%30]-arrays[i]))) for i in range(30)]
    apng=Image.open(ROOT/action/f'{action}-right-animated.png');delays=[]
    for i in range(apng.n_frames):apng.seek(i);delays.append(apng.info['duration'])
    expected=1000 if action=='walk' else 750
    assert apng.n_frames==30 and abs(sum(delays)-expected)<.01 and apng.info['loop']==0
    report['actions'][action]={'frameCount':30,'uniquePngHashes':len(set(x['sha256'] for x in frames)),
      'allSourceBoundariesClear':True,'allAlphaPreservedAfterNormalizedSlicing':True,
      'apngFrameCount':apng.n_frames,'cycleMs':sum(delays),'infiniteLoop':True,
      'adjacentMeanPixelDifferences':differences,'seamDifference':differences[-1],
      'meanNonSeamDifference':float(np.mean(differences[:-1])),
      'frames':frames}
    assert report['actions'][action]['uniquePngHashes']==30
(ROOT/'asset-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({k:{'frames':v['frameCount'],'cycleMs':v['cycleMs'],'seamDifference':round(v['seamDifference'],3),'meanAdjacentDifference':round(v['meanNonSeamDifference'],3)} for k,v in report['actions'].items()}))
