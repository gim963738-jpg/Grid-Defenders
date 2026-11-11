const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('C:/Users/user/AppData/Local/ms-playwright-go/1.57.0/package');
const out=__dirname;
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1280,height:800}});
  const page=await context.newPage();const errors=[],failures=[],externalPreviewScripts=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)failures.push({url:r.url(),status:r.status()});});
  page.on('request',r=>{if(/balor-motions-dual-v001\/(data|player)\.js/.test(r.url()))externalPreviewScripts.push(r.url());});
  const url='http://127.0.0.1:5173/dev-previews/balor-motions-dual-v001/index.html';
  const response=await page.goto(url,{waitUntil:'load',timeout:30000});
  await page.waitForFunction(()=>window.ready===true,{timeout:60000});
  const state=await page.evaluate(()=>({ready:window.ready,assets:window.MANIFEST.assets.length,scriptTags:[...document.scripts].filter(s=>/\/(data|player)\.js/.test(s.src)).length,overlays:document.querySelectorAll('vite-error-overlay').length,drawn:window.motionQA.S.drawn}));
  const result={url,status:response.status(),...state,errors,failures,externalPreviewScripts,userBrowserUsed:false};
  result.ok=result.status===200&&result.ready&&result.assets===26&&result.scriptTags===0&&result.overlays===0&&errors.length===0&&failures.length===0&&externalPreviewScripts.length===0;
  fs.writeFileSync(path.join(out,'게시오류검증.json'),JSON.stringify(result,null,2),'utf8');
  console.log(JSON.stringify(result));
  if(!result.ok)process.exitCode=1;
  await context.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
