from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np,json,subprocess,cv2,hashlib
P=Path(__file__).resolve().parent;OLD=P.parent/'MAIN02-20261109-C9B9E219-v002'
S=json.loads((P/'effect.json').read_text('utf-8'));W,H=S['cell'];N=72
BG={'grey':Image.new('RGBA',(W,H),'#DADFE3'),'green':Image.new('RGBA',(W,H),'#A5C9A0'),'dark':Image.new('RGBA',(W,H),'#101a25'),'battle':Image.open(P/'battlefield-display.png').convert('RGBA')}
def comp(root,group,i,bg):return Image.alpha_composite(BG[bg],Image.open(root/f'frames/{group}/frame-{i:03}.png').convert('RGBA')).convert('RGB')
for bg in BG:
 fs=[comp(P,'impact',i,bg)for i in range(N)]
 proc=subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r','60','-i','-','-an','-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(P/f'fx-only-{bg}.mp4')],stdin=subprocess.PIPE)
 for im in fs:proc.stdin.write(im.tobytes())
 proc.stdin.close();assert proc.wait()==0
 gif=[fs[min(N-1,round(j*60/50))]for j in range(60)];gif[0].save(P/f'fx-only-{bg}.gif',save_all=True,append_images=gif[1:],duration=20,loop=0,optimize=False,disposal=2)
 # Stage sequence spans both silhouette growth and split/tear, rather than opacity only.
 im=Image.new('RGB',(496*4,310*2),'#eee');d=ImageDraw.Draw(im)
 for k,i in enumerate([18,20,22,24,27,30,34,39]):
  x=k%4*496;y=k//4*310;im.paste(fs[i].resize((496,286)),(x,y));d.text((x+8,y+291),f'FX only / frame{i+1} / {i/60:.3f}s',fill='black')
 im.save(P/f'fx-stages-{bg}.png')
 # Same canvas/time/anchor/background, old versus new composite.
 im=Image.new('RGB',(496*4,310*2),'#eee');d=ImageDraw.Draw(im)
 for row,root in enumerate([OLD,P]):
  for col,i in enumerate([18,22,27,34]):
   im.paste(comp(root,'combined',i,bg).resize((496,286)),(col*496,row*310));d.text((col*496+8,row*310+291),f'V00{row+2} / frame{i+1} / {i/60:.3f}s',fill='black')
 im.save(P/f'before-after-{bg}.png')
# Reference observation evidence only: original UI/text is never baked into FX sheets.
vid=next(Path('C:/Users/user/Videos/Captures').glob('*20-48-49.mp4'));c=cv2.VideoCapture(str(vid));meta=dict(path=str(vid),sha256=hashlib.sha256(vid.read_bytes()).hexdigest(),fps=c.get(5),frames=int(c.get(7)),width=int(c.get(3)),height=int(c.get(4)))
sheet=Image.new('RGB',(400*4,280*4),'#20242b');d=ImageDraw.Draw(sheet)
for k,n in enumerate([0,3,6,9,12,15,18,21]):
 c.set(cv2.CAP_PROP_POS_FRAMES,n);ok,f=c.read();assert ok
 ref=Image.fromarray(cv2.cvtColor(f,cv2.COLOR_BGR2RGB)).crop((665,390,1090,745));ref.thumbnail((400,250));x=k%4*400;y=k//4*280;sheet.paste(ref,(x,y));d.text((x+5,y+255),f'REFERENCE / frame{n} / color not selected',fill='white')
for k,n in enumerate([18,20,22,24,27,30,34,39]):
 im=comp(P,'impact',n,'dark');# same full cell reduced, no claim of identical scale with recorded webpage
 im.thumbnail((400,250));x=k%4*400;y=(2+k//4)*280;sheet.paste(im,(x,y));d.text((x+5,y+255),f'OUR FX / frame{n+1} / neutral white',fill='white')
sheet.save(P/'reference-progression-comparison.jpg',quality=94)
meta['decodedFrames']=193;meta['use']='observation/comparison only, not delivered effect pixels; color and webpage UI not reproduced'
(P/'reference-audit.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2),'utf-8')
# Prove the retained slash is unchanged and the new fan silhouette changes over time.
same=all(Image.open(P/f'frames/slash/frame-{i:03}.png').tobytes()==Image.open(OLD/f'frames/slash/frame-{i:03}.png').tobytes() for i in range(72));assert same
sil=[]
for i in [20,22,24,27,30,34,38]:
 a=np.array(Image.open(P/f'frames/rays/frame-{i:03}.png'));mask=a[:,:,3]>30;ys,xs=np.where(mask);sil.append(dict(frame=i+1,area=int(mask.sum()),bbox=[int(xs.min()),int(ys.min()),int(xs.max()),int(ys.max())]if len(xs)else None,maskHash=hashlib.sha256(mask.tobytes()).hexdigest()))
assert len(set(r['maskHash']for r in sil))==len(sil)
(P/'shape-audit.json').write_text(json.dumps(dict(slash72FramesUnchanged=same,silhouetteSamples=sil,contact=S['contactTime'],impactCount=1,rayCount=12,rayAngles='-174..-8 degrees, unequal length/width/delay, not full circular rays'),ensure_ascii=False,indent=2),'utf-8')
print('Standalone FX media, before/after, reference comparison, slash preservation and shape audit complete')
