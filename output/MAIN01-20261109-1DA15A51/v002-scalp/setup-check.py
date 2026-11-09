from pathlib import Path
import json,hashlib
out=Path.cwd()/'output/MAIN01-20261109-1DA15A51/v002-scalp'
s=Path(r'C:\Users\user\orca\workspaces\Grid Defenders\게임개발\output\MAIN01-20261109-F89105C9\v002-scalp\browser-check.mjs').read_text(encoding='utf-8')
s=s.replace("const qa=path.join(out,'qa-game'),port=5193,debug=9343;","const port=5173,debug=9351;")
s='\n'.join(l for l in s.splitlines() if not l.startswith('const server=spawn'))
s=s.replace('server.kill();','').replace('battle=infinite-test','battle=normal&from=camp').replace("path.join(out,'edge-profile')","path.join(out,'edge-profile-'+Date.now())")
s=s.replace("source:'localStorage.clear();'","source:'if(location.origin!==\"null\")localStorage.clear();'")
a=s.index(' // Isolated DOM fixture')
b=s.index(" report.result='PASS';",a)
s=s[:a]+r'''
 const staticArts=await evaluate('catalog.filter(a=>a.variant===0&&a.direction===\'front\'||a.variant>=5)');
 for(const a of staticArts)a.data='data:image/png;base64,'+Buffer.from(await (await fetch('http://127.0.0.1:5173/assets/dev-image-compare/'+a.file)).arrayBuffer()).toString('base64');
 await cdp('Page.navigate',{url:'about:blank'});await sleep(100);await cdp('Emulation.setDeviceMetricsOverride',{width:1600,height:700,deviceScaleFactor:1,mobile:false});await evaluate(`window.gallery=${JSON.stringify(staticArts)}`);
 await evaluate(`document.body.innerHTML='<div id="frames" style="display:flex;gap:8px;padding:12px;background:#f8f3e7">'+gallery.map(a=>'<figure style="margin:0;width:300px"><img src="'+a.data+'" style="width:300px;height:550px;object-fit:contain"><figcaption>'+a.label+' 전체 캔버스</figcaption></figure>').join('')+'</div>'`);
 await evaluate(`Promise.all([...document.images].map(n=>n.decode()))`);await snap('fullframes-light.png');await evaluate(`document.querySelector('#frames').style.background='#1b242e';document.querySelector('#frames').style.color='white'`);await snap('fullframes-dark.png');
 check(report.errors.length===0,'QA no runtime exceptions on actual root and isolated gallery');
'''+s[b:]
s=s.replace("report.result='PASS';","report.result=report.checks.every(c=>c.passed)?'PASS':'FAIL';")
(out/'independent-browser.mjs').write_text(s,encoding='utf-8')
m=json.loads(Path(r'C:\Users\user\Desktop\Grid Defenders\메인작업\main01\dev-image-compare\신규4안-v002-통합결과.json').read_text(encoding='utf-8-sig'))
h=[dict(x,actual=hashlib.sha256(Path(x['path']).read_bytes()).hexdigest()) for x in m['changes']]
for p,v in m['preserved'].items():h.append({'path':p,'sha256':v,'actual':hashlib.sha256(Path(p).read_bytes()).hexdigest(),'kind':'preserved'})
for x in h:x['passed']=x['sha256']==x['actual']
(out/'target-hashes.json').write_text(json.dumps(h,ensure_ascii=False,indent=2),encoding='utf-8')
print('hashes',len(h),all(x['passed'] for x in h))
