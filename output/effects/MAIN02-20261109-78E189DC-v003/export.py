from pathlib import Path
from PIL import Image,ImageDraw,ImageChops
import numpy as np,cv2,json,subprocess,math
P=Path(__file__).resolve().parent
spec=json.loads((P/'effect.json').read_text(encoding='utf-8'));W,H=spec['cell'];audit={};allframes={}
def save(n,d):(P/n).write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf-8')
for group,count,cols in [('combo',96,8),('hit1',30,6),('hit2',30,6),('hit3',30,6)]:
 frames=[Image.open(p).convert('RGBA')for p in sorted((P/'frames'/group).glob('*.png'))];assert len(frames)==count
 allframes[group]=frames;metrics=[];visible=[];sheet=Image.new('RGBA',(W*cols,H*math.ceil(count/cols)))
 for i,im in enumerate(frames):
  a=np.array(im);box=im.getbbox();visible.append(box is not None);margin=None if box is None else min(box[0],box[1],W-box[2],H-box[3]);assert margin is None or margin>=16,(group,i,box)
  assert np.max(np.abs(a[...,0].astype(int)-a[...,1]))==0 and np.max(np.abs(a[...,1].astype(int)-a[...,2]))==0
  assert not np.any((a[...,3]>16)&(np.max(a[...,:3],axis=2)<25))
  metrics.append(dict(frame=i+1,time=i/60,box=box,margin=margin,alphaZero=int(np.sum(a[...,3]==0)),areaAlpha64=int(np.sum(a[...,3]>=64))))
  sheet.paste(im,(i%cols*W,i//cols*H))
 sheet.save(P/(group+'-sheet.png'))
 segments=[]
 for i,v in enumerate(visible):
  if v and (i==0 or not visible[i-1]):segments.append([i+1,None])
  if v and (i==count-1 or not visible[i+1]):segments[-1][1]=i+1
 assert len(segments)==(3 if group=='combo'else 1) and not visible[0] and not visible[-1],(group,segments)
 audit[group]=dict(count=count,visibleSegments=segments,padding=16,edgeContact=0,firstLastTransparent=True,neutralChannelDifference=0,metrics=metrics)
 spec.setdefault('clips',{})[group]=dict(sheet=group+'-sheet.png',columns=cols,rows=math.ceil(count/cols),count=count,fps=60,duration=count/60,alpha=True,pivot=spec['pivotPadded'],frames=[dict(frame=i+1,rect=[i%cols*W,i//cols*H,W,H],pivot=spec['pivotPadded'],durationMs=1000/60,file=f'frames/{group}/frame-{i:03d}.png')for i in range(count)])
save('frame-audit.json',audit)
backgrounds={'grey':Image.new('RGBA',(W,H),'#DADFE3'),'green':Image.new('RGBA',(W,H),'#A5C9A0'),'dark':Image.new('RGBA',(W,H),'#101E30'),'battle':Image.open(P/'battlefield-display.png').convert('RGBA')}
for name,bg in backgrounds.items():
 comps=[Image.alpha_composite(bg,f).convert('RGB')for f in allframes['combo']]
 proc=subprocess.Popen(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r','60','-i','-','-an','-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(P/f'combo-{name}.mp4')],stdin=subprocess.PIPE)
 for im in comps:proc.stdin.write(im.tobytes())
 proc.stdin.close();assert proc.wait()==0
 ims=[comps[min(95,round(i*60/50))].resize((620,358),Image.Resampling.LANCZOS)for i in range(80)]
 ims[0].save(P/f'combo-{name}.gif',save_all=True,append_images=ims[1:],duration=20,loop=0,optimize=False)
 contact=Image.new('RGB',(8*248,12*164),'#F0F2F4');d=ImageDraw.Draw(contact)
 for i,im in enumerate(comps):x=i%8*248;y=i//8*164;contact.paste(im.resize((248,143),Image.Resampling.LANCZOS),(x,y));d.text((x+4,y+145),f'{i+1:02d} {i/60:.3f}s',fill='black')
 contact.save(P/f'contact-{name}.jpg',quality=94)
 for h in spec['hits']:
  i=math.ceil(h['emphasis']*60);comps[i].save(P/f'hit{h["id"]}-{name}.png')
for k in range(1,4):
 frames=allframes[f'hit{k}'];comps=[Image.alpha_composite(backgrounds['dark'],f).convert('RGB') for f in frames]
 ims=[comps[min(29,round(i*60/50))].resize((620,358),Image.Resampling.LANCZOS)for i in range(25)]
 ims[0].save(P/f'hit{k}-dark.gif',save_all=True,append_images=ims[1:],duration=20,loop=0,optimize=False)
 h=spec['hits'][k-1];h['end']=round(h['start']+h['duration'],6);h['gapAfter']=round((spec['hits'][k]['start']-h['end']) if k<3 else spec['duration']-h['end'],6)
 h['visibleFrameRange']=audit['combo']['visibleSegments'][k-1]
 # Direction contract is recorded in source coordinates, before padding.
 def endpoint(angle):
  a=angle*math.pi/180;r=h['rotation']*math.pi/180;x=h['radiusX']*math.cos(a);y=h['radiusY']*math.sin(a)
  return [h['pivot'][0]+x*math.cos(r)-y*math.sin(r),h['pivot'][1]+x*math.sin(r)+y*math.cos(r)]
 h['leadingTipStart']=endpoint(h['startAngle']);h['leadingTipEnd']=endpoint(h['endAngle'])
 dy=h['leadingTipEnd'][1]-h['leadingTipStart'][1];dx=h['leadingTipEnd'][0]-h['leadingTipStart'][0]
 assert dy>0 if k!=2 else dy<0
 if k==3:assert dx>0
old=P.parent/'MAIN02-20261109-C970BE7A-v002';oldim=Image.open(old/'frames/frame-012.png').convert('RGBA');newim=allframes['combo'][15]
def width(im):return float(cv2.distanceTransform((np.array(im)[...,3]>=64).astype('uint8'),cv2.DIST_L2,5).max()*2)
compare=Image.new('RGB',(W*2,H+36),'#101E30');d=ImageDraw.Draw(compare)
for i,im in enumerate([oldim,newim]):bg=Image.alpha_composite(backgrounds['dark'],im).convert('RGB');compare.paste(bg,(W*i,0));d.text((W*i+16,H+8),['Prior white6-hit reference','New wide curved3-hit'][i],fill='white')
compare.save(P/'width-comparison.png')
save('width-audit.json',dict(method='max inscribed diameter at alpha>=64; not weapon or damage radius',oldDiameterPx=width(oldim),newDiameterPx=width(newim),oldAreaAlpha64=int(np.sum(np.array(oldim)[...,3]>=64)),newAreaAlpha64=int(np.sum(np.array(newim)[...,3]>=64))))
save('effect.json',spec)
print('V003 EXPORT PASS',[(k,v['visibleSegments'])for k,v in audit.items()])
