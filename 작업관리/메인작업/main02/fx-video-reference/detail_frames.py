import cv2
from pathlib import Path
from PIL import Image,ImageDraw
c=cv2.VideoCapture(str(next(Path('C:/Users/user/Videos/Captures').glob('*20-48-49.mp4'))))
a=Image.new('RGB',(1600,800),(25,25,25));d=ImageDraw.Draw(a)
for j,n in enumerate([0,3,6,9,12,15,18,21]):
 c.set(0 if False else cv2.CAP_PROP_POS_FRAMES,n);ok,f=c.read()
 if not ok:continue
 im=Image.fromarray(cv2.cvtColor(f,cv2.COLOR_BGR2RGB)).crop((665,380,1090,780));im.thumbnail((400,370));a.paste(im,((j%4)*400,(j//4)*400));d.text(((j%4)*400+5,(j//4)*400+375),f'frame {n}',fill='white')
a.save(Path(__file__).parent/'detail.jpg')