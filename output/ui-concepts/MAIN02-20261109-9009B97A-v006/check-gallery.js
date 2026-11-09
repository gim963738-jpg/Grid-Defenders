(async()=>{
const opened=[];
for(let i=0;i<data.length;i++){
 show(i);
 if(!$('large').complete)await new Promise(resolve=>{$('large').onload=resolve;$('large').onerror=resolve});
 opened.push({n:i+1,loaded:$('large').naturalWidth===2400,open:$('viewer').classList.contains('open'),file:$('large').getAttribute('src'),original:$('original').getAttribute('href')});
}
show(0);$('next').click();const nextOk=index===1;$('prev').click();const prevOk=index===0;
document.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight'}));const keyboardOk=index===1;
$('native').click();const nativeOk=$('viewer').classList.contains('native')&&Math.abs($('large').getBoundingClientRect().width-800)<1;
document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));const closed=!$('viewer').classList.contains('open');
const links=Array.from(document.querySelectorAll('a')).map(a=>a.getAttribute('href')).filter(Boolean);
return JSON.stringify({opened,nextOk,prevOk,keyboardOk,nativeOk,closed,links,pass:opened.length===7&&opened.every(x=>x.open&&x.loaded&&x.file===x.original)&&nextOk&&prevOk&&keyboardOk&&nativeOk&&closed});
})()
