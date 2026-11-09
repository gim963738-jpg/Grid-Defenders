from pathlib import Path
P=Path(__file__).resolve().parent
p=P/'build.py';s=p.read_text('utf-8').replace("'flash':dict(delay=0,duration=.105", "'flash':dict(delay=0,duration=.15")
s=s.replace("let g=fc.createRadialGradient(-4,-14,2,0,-12,86);g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(.36,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');fc.fillStyle=g;fc.fillRect(-95,-110,190,140);", "fc.save();fc.scale(1,.55);let g=fc.createRadialGradient(-4,-24,2,0,-20,98);g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(.36,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');fc.fillStyle=g;fc.fillRect(-110,-130,220,220);fc.restore();")
p.write_text(s,'utf-8')
# Expand actual layer-selection QA and standalone MP4/GIF verification.
p=P/'qa.py';s=p.read_text('utf-8-sig');s=s.replace("['combined','slash','flash','ground','debris','dust']", "['combined','impact','slash','rays','sparks','flash','ground','debris','dust']")
s=s.replace("print('GROUND SLASH VIEWER/MEDIA QA PASS')", """
for bg in ['grey','green','dark','battle']:
 f=P/f'fx-only-{bg}.mp4';r=subprocess.run(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width,height,nb_frames,r_frame_rate,duration','-of','json',str(f)],capture_output=True,text=True,check=True);ss=json.loads(r.stdout)['streams'][0]
 assert ss['nb_frames']=='72'and float(ss['duration'])==1.2
 subprocess.run(['ffmpeg','-v','error','-i',str(f),'-f','null','-'],check=True,capture_output=True);checks.append(dict(file=f.name,decode='pass',**ss))
 im=Image.open(P/f'fx-only-{bg}.gif');total=0
 for i in range(im.n_frames):im.seek(i);total+=im.info.get('duration',0)
 assert total==1200 and im.info.get('loop')==0
 checks.append(dict(file=f'fx-only-{bg}.gif',durationMs=total,loop=0,alpha=False))
save('media-audit.json',checks)
print('V003 COMBINED / STANDALONE FX VIEWER/MEDIA QA PASS')
""")
p.write_text(s,'utf-8')
