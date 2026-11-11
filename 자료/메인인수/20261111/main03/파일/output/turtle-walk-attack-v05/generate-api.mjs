import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {parseEnv} from 'node:util';
import {createHash} from 'node:crypto';
const here=path.dirname(fileURLToPath(import.meta.url));
const adapterDir='C:/Users/user/orca/workspaces/Grid Defenders/캐릭터디자인2/tools/image-studio';
const {validateConfig,requestImage}=await import(pathToFileURL(path.join(adapterDir,'openai.mjs')).href);
const hash=b=>createHash('sha256').update(b).digest('hex');
const statusFile=path.join(here,'records/api-status.json');
// Never repeat this paid request automatically, including after an unknown result.
try {await readFile(statusFile);throw new Error('Existing request status found; refused duplicate generation');}
catch(e){if(e.code!=='ENOENT')throw e;}
let apiKey='';
try {
 const env=parseEnv(await readFile(path.join(adapterDir,'.env.local'),'utf8'));
 apiKey=env.OPENAI_API_KEY?.trim()||process.env.OPENAI_API_KEY?.trim()||'';
 if(!apiKey)throw new Error('missing_api_key');
 const prompt=await readFile(path.join(here,'records/prompt-walk26.txt'),'utf8');
 const config=validateConfig({preset:'sunburst-2.6-high',prompt,size:'1536x1024',background:'transparent'});
 const refs=[
  {file:'C:/Users/user/orca/workspaces/Grid Defenders/몬스터-디자인/output/monsters/turtle-dragon-black-green-main03-20261110-05df6177-v02/front_left.png',name:'approved-v02-identity-and-camera.png'},
  {file:path.join(here,'builtin/slam_right_foreleg.png'),name:'existing-single-paw-attack-target-top-left-frame.png'}
 ];
 const images=await Promise.all(refs.map(async r=>({name:r.name,mime:'image/png',bytes:await readFile(r.file)})));
 const request={startedAt:new Date().toISOString(),status:'in_flight',requestedModel:config.preset.model,quality:config.preset.quality,endpoint:'/images/edits',size:config.size,background:config.background,n:1,automaticRetries:0,promptSha256:hash(Buffer.from(prompt)),references:images.map((im,i)=>({name:im.name,file:refs[i].file,sha256:hash(im.bytes),bytes:im.bytes.length})),approval:'User explicitly requested 2.6 and then said 진행하는데 어떤 좋은 제안 이야기하면 나한테 전달해줘; one sheet only'};
 await writeFile(statusFile,JSON.stringify(request,null,2));
 const result=await requestImage({apiKey,config,images,fetchImpl:fetch});
 await writeFile(path.join(here,'sunburst26/walk_front_left.png'),result.bytes);
 const record={...request,status:'succeeded',finishedAt:new Date().toISOString(),requestId:result.requestId,response:result.response,outputSha256:hash(result.bytes),outputBytes:result.bytes.length,costUsd:'unknown',responseModel:result.response.model||'not reported'};
 await writeFile(statusFile,JSON.stringify(record,null,2));
 console.log(JSON.stringify({status:record.status,requestId:record.requestId,bytes:record.outputBytes,response:record.response}));
} catch(error) {
 const clean=value=>String(value||'').split(apiKey||'___no_key___').join('[REDACTED]');
 const failure={status:'failed_or_unknown',finishedAt:new Date().toISOString(),code:clean(error.code||'unknown'),message:clean(error.message),requestId:clean(error.requestId),automaticRetries:0};
 await writeFile(path.join(here,'records/api-failure.json'),JSON.stringify(failure,null,2));
 console.log(JSON.stringify(failure));process.exitCode=1;
} finally {apiKey='';}
