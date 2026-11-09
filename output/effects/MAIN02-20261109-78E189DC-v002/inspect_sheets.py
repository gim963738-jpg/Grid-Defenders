from pathlib import Path
import cv2,numpy as np,json
from PIL import Image,ImageDraw
P=Path(__file__).resolve().parent
allstats=[]
for source in ['downcut','upcut','diagonal']:
 im=Image.open(P/f'source-{source}.png').convert('RGBA');a=np.array(im);alpha=a[...,3].copy()
 alpha[alpha<=4]=0;solid=cv2.dilate((alpha>=32).astype('uint8'),np.ones((5,5),np.uint8));alpha[(alpha<32)&(solid==0)]=0
 n,labels,stats,centers=cv2.connectedComponentsWithStats((alpha>16).astype('uint8'),8)
 big=[i for i in range(1,n) if stats[i,4]>10000]
 assert len(big)==8,(source,len(big),stats[big].tolist())
 big.sort(key=lambda i:(int(centers[i,1]>im.height/2),centers[i,0]))
 display=Image.new('RGBA',im.size,'#CDD2D5');display.alpha_composite(Image.fromarray(np.dstack((a[...,:3],alpha))));d=ImageDraw.Draw(display)
 rows=[]
 for index,i in enumerate(big):
  x,y,w,h,area=map(int,stats[i]);row=dict(pose=index+1,label=i,bbox=[x,y,x+w,y+h],area=area,center=centers[i].tolist());rows.append(row)
  d.rectangle((x,y,x+w-1,y+h-1),outline='red',width=2);d.text((x+5,y+5),str(index+1),fill='black')
 display.convert('RGB').save(P/f'inspect-{source}.jpg',quality=94)
 allstats.append(dict(source=source,poses=rows,hygieneRemoved=int(np.count_nonzero((a[...,3]>0)&(alpha==0)))))
print(json.dumps(allstats,indent=2))
(P/'source-components.json').write_text(json.dumps(allstats,indent=2),encoding='utf-8')
