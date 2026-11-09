from pathlib import Path
from PIL import Image
import numpy as np, json, hashlib
ROOT=Path(__file__).resolve().parent
records=[]
for name in ['front.png','idle_right_045.png','right_090.png']:
    p=ROOT/name
    im=Image.open(p).convert('RGBA'); a=np.asarray(im); alpha=a[:,:,3]
    ys,xs=np.where(alpha>0)
    ys16,xs16=np.where(alpha>=16)
    rgb=a[:,:,:3].astype(int)
    edge=(alpha>0)&(alpha<255)
    color=((rgb[:,:,0]>180)&(rgb[:,:,2]>130)&(rgb[:,:,1]<90))|((rgb[:,:,2]>180)&(rgb[:,:,0]<80)&(rgb[:,:,1]<90))
    records.append(dict(file=name,width=im.width,height=im.height,mode=Image.open(p).mode,sha256=hashlib.sha256(p.read_bytes()).hexdigest(),bytes=p.stat().st_size,alphaMin=int(alpha.min()),alphaMax=int(alpha.max()),transparentPixels=int((alpha==0).sum()),semiTransparentPixels=int(edge.sum()),opaquePixels=int((alpha==255).sum()),saturatedFringeCandidatePixels=int((edge&color).sum()),bboxAlpha1=[int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)],bboxAlpha16=[int(xs16.min()),int(ys16.min()),int(xs16.max()+1),int(ys16.max()+1)],edgeTouchPixels=int(np.count_nonzero(alpha[0]))+int(np.count_nonzero(alpha[-1]))+int(np.count_nonzero(alpha[:,0]))+int(np.count_nonzero(alpha[:,-1]))))
(ROOT/'evidence'/'alpha-inspection.json').write_text(json.dumps(records,indent=2),encoding='utf-8')
print(json.dumps(records,indent=2))
