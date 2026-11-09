from pathlib import Path
from PIL import Image, ImageOps, ImageDraw
import json, subprocess, zipfile, hashlib
P=Path(__file__).resolve().parent
spec=json.loads((P/'timeline.json').read_text(encoding='utf-8'))
frames=[Image.open(p).convert('RGBA') for p in sorted((P/'frames').glob('*.png'))]
assert len(frames)==120
W,H=frames[0].size
metrics=[]; visible=[]
for i,im in enumerate(frames):
 a=im.getchannel('A');bbox=a.getbbox();visible.append(bbox is not None)
 margins=None if bbox is None else [bbox[0],bbox[1],W-bbox[2],H-bbox[3]]
 assert bbox is None or min(margins)>=16,(i,bbox)
 assert max(a.crop((0,0,W,16)).getextrema())==0
 # Every visible RGB pixel comes from cyan/blue artwork, with no black matte.
 pixels=[p for p in im.getdata() if p[3]>16]
 assert not any(p[0]<25 and p[1]<25 and p[2]<25 for p in pixels)
 metrics.append(dict(frame=i+1,time=i/60,bbox=bbox,margins=margins,alpha=a.getextrema()))
segments=[]
for i,v in enumerate(visible):
 if v and (i==0 or not visible[i-1]):segments.append([i+1,None])
 if v and (i==119 or not visible[i+1]):segments[-1][1]=i+1
assert len(segments)==6,segments
backgrounds={'grey':Image.new('RGBA',(W,H),'#DADFE3'),'green':Image.new('RGBA',(W,H),'#A5C9A0'),'dark':Image.new('RGBA',(W,H),'#101E30'),'battle':Image.open(P/'battlefield-display.png').convert('RGBA')}
def compose(i,bg):return Image.alpha_composite(backgrounds[bg],frames[i]).convert('RGB')
for name in backgrounds:
 out=P/('composite-'+name);out.mkdir(exist_ok=True)
 for i in range(120):compose(i,name).save(out/f'frame-{i:03d}.png')
 cmd=['ffmpeg','-hide_banner','-loglevel','error','-y','-framerate','60','-i',str(out/'frame-%03d.png'),'-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(P/f'six-slash-{name}.mp4')]
 subprocess.run(cmd,check=True)
 # Full frame review; every cell is labelled with its 1-based frame and timestamp.
 thumb=(248,143);cell=(248,164);cols=10
 sheet=Image.new('RGB',(cols*cell[0],12*cell[1]),'#F3F4F4');d=ImageDraw.Draw(sheet)
 for i in range(120):
  x=i%cols*cell[0];y=i//cols*cell[1];sheet.paste(compose(i,name).resize(thumb,Image.Resampling.LANCZOS),(x,y));d.text((x+5,y+145),f'{i+1:03d}  {i/60:.3f}s',fill='#142333')
 sheet.save(P/f'contact-{name}.jpg',quality=92)
 compose(79,name).save(P/f'representative-{name}.png')
for name in ['battle','grey']:
 # 50 fps GIF uses exact20ms durations; sample 60fps source by absolute time, preserving2s.
 ims=[compose(round(i*60/50),name).resize((744,429),Image.Resampling.LANCZOS) for i in range(100)]
 ims[0].save(P/f'six-slash-{name}.gif',save_all=True,append_images=ims[1:],duration=20,loop=0,optimize=False)
# Single reusable atlas: original RGBA frames are copied without pixel edits.
atlas=Image.new('RGBA',(W*10,H*12))
for i,im in enumerate(frames):atlas.paste(im,(i%10*W,i//10*H))
atlas.save(P/'six-slash.rgba-atlas.png')
spec['files']={'sequence':'frames/frame-%03d.png','atlas':'six-slash.rgba-atlas.png','atlasColumns':10,'atlasRows':12,'preview':'preview.html','videoAlpha':False,'gifAlpha':False}
spec['atlasFrames']=[dict(frame=i+1,rect=[i%10*W,i//10*H,W,H],pivot=[496,286],durationMs=1000/60) for i in range(120)]
(P/'timeline.json').write_text(json.dumps(spec,ensure_ascii=False,indent=2),encoding='utf-8')
with zipfile.ZipFile(P/'six-slash-alpha-source.zip','w',zipfile.ZIP_DEFLATED) as z:
 for f in (P/'frames').glob('*.png'):z.write(f,'frames/'+f.name)
 for name in ['preview.html','timeline.json','vfx-renderer.js','editable-plans.json','build.py','mobile-ui.css','battlefield-display.png','전문제작프롬프트.md']:z.write(P/name,name)
(P/'frame-audit.json').write_text(json.dumps(dict(frameCount=120,visibleSegments=segments,hitCount=len(segments),paddingMinRequired=16,edgeContact=0,blackMattePixelsAlphaAbove16=0,quantizationNote='Canvas RGB quantization at alpha=1 is excluded from black matte threshold; composited bright contacts inspected',firstTransparent=not visible[0],lastTransparent=not visible[-1],metrics=metrics),indent=2),encoding='utf-8')
print('EXPORT COMPLETE',segments,flush=True)
