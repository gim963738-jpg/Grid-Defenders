import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const cli=process.env.ORCA_CLI_COMMAND,page=process.argv[2];
if(!cli||!page)throw Error('Pass the gallery browserPageId using ORCA_CLI_COMMAND.');
const checks=fs.readFileSync(path.join(root,'tools/character-catalog/browser-checks.js'),'utf8');
function run(args){const r=JSON.parse(execFileSync(cli,[...args,'--json'],{cwd:root,encoding:'utf8',maxBuffer:12*1024*1024}));if(r.ok===false)throw Error(JSON.stringify(r));return r.result;}
function evaluate(source){const r=run(['eval','--page',page,'--expression',source]).result;return typeof r==='string'?JSON.parse(r):r;}
const expression=name=>'(async()=>{'+checks+';return JSON.stringify(await '+name+'());})()';
const report={checked_at:new Date().toISOString(),page,method:'Orca browser DOM',externalImageApiCalls:0};
const settle=()=>new Promise(resolve=>setTimeout(resolve,300));
try{
 run(['reload','--page',page]);await settle();report.desktop=evaluate(expression('runCharacterDesktopChecks'));
 run(['reload','--page',page]);await settle();report.bookmark=evaluate(expression('runCharacterBookmarkCheck'));
 report.mobile=[];
 for(const width of [390,320]){
  let mobile;
  // Reloading an embedded page can restore its pane size after emulation was set.
  for(let attempt=0;attempt<3;attempt++){
   run(['viewport','--page',page,'--width',String(width),'--height','844','--scale','1','--mobile']);await settle();
   if(evaluate('innerWidth')!==width)continue;
   try{mobile=evaluate(expression('runCharacterMobileChecks'));}
   catch(error){if(evaluate('innerWidth')!==width)continue;throw error;}
   if(mobile.width===width)break;
   mobile=null;
  }
  if(!mobile||mobile.width!==width)throw Error('Requested mobile viewport did not persist');
  report.mobile.push(mobile);
 }
 report.status='passed';
}finally{evaluate('(function(){reset();return JSON.stringify({restored:true});})()');run(['reload','--page',page]);}
fs.writeFileSync(path.join(root,'output/characters/catalog/browser-verification.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
