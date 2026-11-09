from pathlib import Path
import subprocess,json,base64
ROOT=Path(__file__).resolve().parent
CLI=r'C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe'
PAGE='2e9a0ecc-fae4-4db9-85ff-a88ea8987de1'
expr="""(async()=>{const c=document.createElement('canvas');c.width=1500;c.height=1200;const ctx=c.getContext('2d');ctx.fillStyle='#e9edf2';ctx.fillRect(0,0,1500,1200);const imgs=Array.from(document.querySelectorAll('#full img'));const titles=['FRONT 0 / neutral','RIGHT 45 / idle ready','RIGHT 90 / profile'];for(let i=0;i<3;i++){let x=i*500;ctx.fillStyle='#172035';ctx.font='bold 22px sans-serif';ctx.fillText(titles[i],x+15,32);ctx.fillStyle='#fff8ea';ctx.fillRect(x,50,500,500);ctx.imageSmoothingEnabled=false;ctx.drawImage(imgs[i],x,50,500,500);ctx.fillStyle='#17202d';ctx.fillRect(x,560,500,500);ctx.drawImage(imgs[i],x,560,500,500);ctx.fillStyle='#dfe9d4';ctx.fillRect(x,1070,500,130);let a=assets[i],s=96/a.bodyHeight;ctx.drawImage(imgs[i],x+250-a.footX*s,1190-a.footY*s,a.width*s,a.height*s);}return c.toDataURL('image/png')})()"""
p=subprocess.run([CLI,'eval','--page',PAGE,'--expression',expr,'--json'],capture_output=True,text=True,encoding='utf-8')
d=json.loads(p.stdout)
if d.get('ok'):
 value=d['result']['result']
 if isinstance(value,str) and value.startswith('data:image/png;base64,'):
  target=ROOT/'evidence'/'review-browser-canvas.png'
  target.write_bytes(base64.b64decode(value.split(',',1)[1]))
  print(str(target))
 else:print(str(value)[:500])
else:print(p.stdout)
