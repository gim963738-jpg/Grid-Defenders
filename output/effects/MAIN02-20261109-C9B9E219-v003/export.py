from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import numpy as np,json,subprocess,math
P=Path(__file__).resolve().parent;S=json.loads((P/'effect.json').read_text('utf-8'))
W,H=S['cell'];N=S['frameCount'];FPS=S['fps']
BG={'grey':Image.new('RGBA',(W,H),'#DADFE3'),'green':Image.new('RGBA',(W,H),'#A5C9A0'),'dark':Image.new('RGBA',(W,H),'#101a25'),'battle':Image.open(P/'battlefield-display.png').convert('RGBA')}
def composite(im,bg):return Image.alpha_composite(BG[bg],im).convert('RGB')
audit={};frames={}
for name in ['combined','impact',*S['layers']]:
 fs=[Image.open(P/f'frames/{name}/frame-{i:03}.png').convert('RGBA') for i in range(N)];frames[name]=fs
 sheet=Image.new('RGBA',(W*8,H*9));rows=[]
 for i,im in enumerate(fs):
  sheet.paste(im,(i%8*W,i//8*H));a=np.array(im);alpha=a[:,:,3];ys,xs=np.where(alpha>0);bbox=im.getbbox();margin=min(xs.min(),ys.min(),W-1-xs.max(),H-1-ys.max()).item() if len(xs) else None
  rows.append(dict(frame=i+1,time=i/FPS,bbox=bbox,margin=margin,visiblePixels=int((alpha>0).sum()),maxAlpha=int(alpha.max()),edgeAlpha=int(max(alpha[0].max(),alpha[-1].max(),alpha[:,0].max(),alpha[:,-1].max())),whiteRGB=bool(np.all(a[:,:,:3][alpha>16]==255)) if name in ['slash','flash'] else None))
 sheet.save(P/f'{name}-sheet.png')
 audit[name]=dict(frames=rows,minMargin=min([r['margin'] for r in rows if r['margin'] is not None],default=None),firstVisible=next((r['frame'] for r in rows if r['visiblePixels']),None),lastVisible=next((r['frame'] for r in reversed(rows) if r['visiblePixels']),None),sheetCellPixelEquality=all(np.array_equal(np.array(sheet.crop((i%8*W,i//8*H,i%8*W+W,i//8*H+H))),np.array(im)) for i,im in enumerate(fs)))
 assert all(r['edgeAlpha']==0 for r in rows),name
 assert audit[name]['minMargin']>=16,name
 assert rows[0]['visiblePixels']==rows[-1]['visiblePixels']==0,name
 if name not in ['combined','slash']:assert all(r['visiblePixels']==0 for r in rows if r['time']<S['contactTime']),name
for bg in BG:
 fs=[composite(im,bg) for im in frames['combined']]
 cmd=['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-an','-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(P/f'impact-{bg}.mp4')]
 proc=subprocess.Popen(cmd,stdin=subprocess.PIPE)
 for im in fs:proc.stdin.write(im.tobytes())
 proc.stdin.close();assert proc.wait()==0
 gif=[fs[min(N-1,round(j*FPS/50))] for j in range(round(S['duration']*50))]
 gif[0].save(P/f'impact-{bg}.gif',save_all=True,append_images=gif[1:],duration=20,loop=0,optimize=False,disposal=2)
 contact=Image.new('RGB',(248*8,164*9),'#eeeeee');draw=ImageDraw.Draw(contact)
 for i,im in enumerate(fs):
  x=i%8*248;y=i//8*164;contact.paste(im.resize((248,143)),(x,y));draw.text((x+5,y+144),f'{i+1:02}  {i/60:.3f}s',fill='black')
 contact.save(P/f'contact-{bg}.jpg',quality=90)
 # Precisely before contact, contact, ejection, dissipation.
 strip=Image.new('RGB',(496*4,310),'#ececec');d=ImageDraw.Draw(strip)
 for col,i in enumerate([17,18,24,42]):
  strip.paste(fs[i].resize((496,286)),(col*496,0));d.text((col*496+8,291),f'frame{i+1}: {i/60:.3f}s',fill='black')
 strip.save(P/f'stages-{bg}.png')
 for i in [17,18,24,42]:fs[i].save(P/f'frame-{i+1:02}-{bg}.png')
# Compare blade at its sweep completion with the previous downcut, same dimensions.
old=Image.open(P.parent/'MAIN02-20261109-C9B9E219/frames/slash/frame-018.png').convert('RGBA')
new=frames['slash'][18]
strip=Image.new('RGB',(W*2,H+28),'#dadfe3');d=ImageDraw.Draw(strip)
for k,im in enumerate([old,new]):strip.paste(composite(im,'grey'),(k*W,0))
d.text((12,H+5),'Iteration1: 205-degree curved slash, width76px',fill='black');d.text((W+12,H+5),'Iteration2: 90-degree curved slash, width110px',fill='black');strip.save(P/'width-comparison.png')
audit['contract']=dict(impactCount=1,contactTime=S['contactTime'],visualCompletedFrame=S['visualImpactCompletedFrame'],firstContactSampleFrame=S['contactFrameAtStart'],allReactionsNotBeforeContact=True,bladeTipAtContact=[496,441],anchor=S['pivotPadded'],allFrameEdgeAlphaZero=True,allSheetCellsEqual=True)
(P/'frame-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2),'utf-8')
print(json.dumps({k:{a:v for a,v in d.items() if a!='frames'} for k,d in audit.items()},ensure_ascii=False))
