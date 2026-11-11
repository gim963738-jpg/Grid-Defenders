const {chromium} = require('C:/Users/user/AppData/Local/ms-playwright-go/1.57.0/package');
const fs = require('fs');
const path = require('path');
(async () => {
  const browser = await chromium.launch({headless:true, executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
  try {
    const page = await browser.newPage({viewport:{width:1600,height:1100}});
    const errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    await page.goto('http://127.0.0.1:5173/dev-previews/balor-sd-guard35-v003/index.html');
    await page.waitForFunction(()=>window.ready===true);
    const images=await page.locator('#main .card img, #historyGrid .card img').evaluateAll(list=>list.map(i=>({src:i.getAttribute('src'),loaded:i.complete&&i.naturalWidth>0})));
    if(images.length!==9||new Set(images.map(i=>i.src)).size!==9||images.some(i=>!i.loaded))throw Error('Nine comparison image loading failed');
    await page.locator('.stage').first().click();
    if(!await page.locator('#zoom').evaluate(e=>e.open))throw Error('Zoom failed');
    await page.locator('#close').click();
    await page.locator('#native').click();
    if(!await page.locator('body').evaluate(e=>e.classList.contains('native')))throw Error('Native toggle failed');
    await page.locator('#native').click();
    await page.locator('#dark').click();
    if(!await page.locator('body').evaluate(e=>e.classList.contains('dark')))throw Error('Dark theme failed');
    await page.locator('#light').click();
    await page.locator('#fieldbtn').click();
    await page.locator('#dpr').selectOption('2');
    const display=await page.evaluate(()=>({canvas:[battle.width,battle.height],stats:stats.map(s=>({id:s.id,bodyCSS:s.bodyCSS,physicalBody:s.physicalBody,dpr:s.dpr}))}));
    if(display.canvas.join(',')!=='1600,720'||display.stats.some(s=>s.bodyCSS!==72||s.physicalBody!==144))throw Error('DPR2 display failed');
    await page.waitForFunction(()=>[...document.querySelectorAll('img[src]')].every(i=>i.complete&&i.naturalWidth>0));
    if(errors.length)throw Error(errors.join('\n'));
    const result={passed:true,images,zoom:true,nativeToggle:true,lightDarkField:true,display,jsErrors:errors,isolatedHeadless:true,userWindowTouched:false};
    fs.writeFileSync(path.join(__dirname,'접속검증.json'),JSON.stringify(result,null,2));
    console.log(JSON.stringify({passed:true,imageCount:images.length,canvas:display.canvas,jsErrors:errors.length}));
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
