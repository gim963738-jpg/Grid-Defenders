const {chromium}=require('C:/Users/user/AppData/Local/ms-playwright-go/1.57.0/package');
const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const results=[];
 try{
  for(const dpr of [1,2]){
   const context=await browser.newContext({viewport:{width:1280,height:1000},deviceScaleFactor:dpr,acceptDownloads:true});
   const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   const response=await page.goto('http://127.0.0.1:5173/dev-previews/battle-sticker-quality-v001/index.html');assert.equal(response.status(),200);
   await page.waitForFunction(()=>window.stickerQA?.state.ready);
   assert.deepEqual(await page.locator('#battle').evaluate(c=>({w:c.getBoundingClientRect().width,h:c.getBoundingClientRect().height,pw:c.width,ph:c.height})),{w:800,h:360,pw:800*dpr,ph:360*dpr});
   const initial=await page.evaluate(()=>JSON.parse(JSON.stringify(stickerQA.state.stickers)));assert.equal(initial[0].size,72);
   const box=await page.locator('#battle').boundingBox();
   await page.mouse.move(box.x+280,box.y+240);await page.mouse.down();await page.mouse.move(box.x+320,box.y+255,{steps:8});await page.mouse.up();
   const moved=await page.evaluate(()=>({...stickerQA.state.stickers[0]}));assert.equal(moved.x,320);assert.equal(moved.y,295);
   await page.selectOption('#selection',String(moved.id));
   await page.fill('#size','120');await page.locator('#size').dispatchEvent('change');
   let changed=await page.evaluate(()=>({...stickerQA.state.stickers[0]}));assert.equal(changed.size,120);assert.equal(changed.x,320);assert.equal(changed.y,295);
   await page.locator('#slider').evaluate(el=>{el.value='144';el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))});
   assert.equal(await page.evaluate(()=>stickerQA.state.stickers[0].size),144);assert.equal(await page.evaluate(()=>stickerQA.state.stickers[1].size),180);
   await page.click('#duplicate');await page.click('#add-warrior');await page.click('#add-boss');
   const many=await page.evaluate(()=>JSON.parse(JSON.stringify(stickerQA.state.stickers)));assert.equal(many.length,5);assert.equal(new Set(many.map(x=>x.id)).size,5);
   for(const mode of ['current','quality','edge']){
    await page.selectOption('#mode',mode);await page.waitForTimeout(80);
    assert.deepEqual(await page.evaluate(()=>JSON.parse(JSON.stringify(stickerQA.state.stickers))),many);
    const downloading=page.waitForEvent('download');await page.click('#download');const download=await downloading;
    const file=path.join(__dirname,`http-${mode}-dpr${dpr}.png`);await download.saveAs(file);const buf=fs.readFileSync(file);
    assert.equal(buf.subarray(1,4).toString(),'PNG');assert.equal(buf.readUInt32BE(16),800*dpr);assert.equal(buf.readUInt32BE(20),360*dpr);
   }
   await page.click('#delete');assert.equal(await page.evaluate(()=>stickerQA.state.stickers.length),4);
   await page.click('#reset');assert.equal(await page.evaluate(()=>stickerQA.state.stickers.length),2);
   if(dpr===1)await page.screenshot({path:path.join(__dirname,'http-reviewed-desktop.png'),fullPage:true});
   await page.setViewportSize({width:360,height:800});assert.equal(await page.locator('#battle').evaluate(c=>c.getBoundingClientRect().width),800);
   assert.equal(await page.locator('#scroller').evaluate(e=>e.scrollWidth>e.clientWidth),true);assert.deepEqual(errors,[]);
   results.push({dpr,http:200,css:[800,360],png:[800*dpr,360*dpr],drag:true,bodySizeFootAnchored:true,independentFiveStickers:true,modesPreserveLayout:true,download:true,deleteReset:true,narrowScreenScroll:true,pageErrors:errors});
   await context.close();
  }
  fs.writeFileSync(path.join(__dirname,'http-review.json'),JSON.stringify({passed:true,url:'http://localhost:5173/dev-previews/battle-sticker-quality-v001/index.html',results,visibleUserBrowserChanged:false},null,2));
  console.log(JSON.stringify({passed:true,results}));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
