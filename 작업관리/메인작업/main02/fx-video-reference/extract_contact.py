import cv2
from PIL import Image,ImageDraw
from pathlib import Path
p=next(Path('C:/Users/user/Videos/Captures').glob('*20-48-49.mp4'))
c=cv2.VideoCapture(str(p))
out=Path(__file__).parent
sheet=Image.new('RGB',(1920,1500),(32,32,32))
d=ImageDraw.Draw(sheet)
for j,n in enumerate(range(0,193,12)):
 c.set(cv2.CAP_PROP_POS_FRAMES,n)
 ok,f=c.read()
 if not ok: continue
 im=Image.fromarray(cv2.cvtColor(f,cv2.COLOR_BGR2RGB))
 im.thumbnail((480,260))
 sheet.paste(im,((j%4)*480,(j//4)*300))
 d.text(((j%4)*480+8,(j//4)*300+263),f'{n} / {n/36.9968:.2f}s',fill='white')
sheet.save(out/'contact.jpg')