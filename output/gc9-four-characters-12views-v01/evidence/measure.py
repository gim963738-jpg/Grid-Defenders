from pathlib import Path
from PIL import Image
import json,hashlib
root=Path(__file__).resolve().parents[1]
out=[]
for p in sorted((root/'images').glob('*.png')):
 im=Image.open(p).convert('RGB'); w,h=im.size
 xs=[];ys=[]
 for y in range(h):
  for x in range(w):
   r,g,b=im.getpixel((x,y))
   if min(r,g,b)<180 or max(r,g,b)-min(r,g,b)>45: xs.append(x);ys.append(y)
 box=[min(xs),min(ys),max(xs)+1,max(ys)+1]
 margins={'top':box[1]/h,'left':box[0]/w,'right':1-box[2]/w,'bottom':1-box[3]/h}
 rec={'file':p.name,'width':w,'height':h,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'contrast_bounds':box,'margins_estimate':margins,'safe_area_numeric_pass':margins['top']>=.2 and margins['left']>=.15 and margins['right']>=.15 and margins['bottom']>=.06}
 out.append(rec)
 print(p.name,box,{k:round(v*100,1) for k,v in margins.items()},rec['safe_area_numeric_pass'])
(root/'evidence'/'geometry-check.json').write_text(json.dumps({'method':'contrast mask min channel<180 or chroma>45; light background; visual check also required; no image writes','images':out},ensure_ascii=False,indent=2),encoding='utf-8')

