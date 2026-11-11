import {readFile,writeFile,access} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {parseEnv} from 'node:util';
import {createHash} from 'node:crypto';
const here=path.dirname(fileURLToPath(import.meta.url));
const dir='C:/Users/user/orca/workspaces/Grid Defenders/캐릭터디자인2/tools/image-studio';
const styleDir='C:/Users/user/orca/workspaces/Grid Defenders/캐릭터디자인2/output/character-redesign-6x2/images';
const {validateConfig,requestImage}=await import(pathToFileURL(path.join(dir,'openai.mjs')).href);
const view=process.argv[2];
if(!['a_front','a_right35','a_right90','b_front','b_right35','b_right90','c_front','c_right35','c_right90','b_right90_fix1'].includes(view))throw new Error('Unsupported view');
const statusPath=path.join(here,'records',view+'-api.json');
try{await access(statusPath);throw new Error('Existing attempt found: duplicate call refused');}catch(e){if(e.code!=='ENOENT')throw e;}
const hash=b=>createHash('sha256').update(b).digest('hex');
let key='',record;
try{
 const env=parseEnv(await readFile(path.join(dir,'.env.local'),'utf8'));key=env.OPENAI_API_KEY?.trim()||process.env.OPENAI_API_KEY?.trim()||'';if(!key)throw new Error('missing_api_key');
 const prompt=await readFile(path.join(here,'records','prompt-'+view+'.txt'),'utf8');
 const variant=view[0];
 const identity=view.endsWith('_front')?path.join(here,'..','silver-ponytail-rapier-v02','a_front.png'):path.join(here,variant+'_front.png');
 const selectedIdentity=view==='b_right90_fix1'?path.join(here,'b_right35.png'):identity;
 const refs=[selectedIdentity,path.join(styleDir,'c04_front.png'),path.join(styleDir,'c03_front.png')];
 const images=await Promise.all(refs.map(async f=>({name:path.basename(f),mime:'image/png',bytes:await readFile(f)})));
 const config=validateConfig({preset:'sunburst-2.6-high',quality:'high',size:'1024x1536',background:'transparent',prompt});
 record={view,startedAt:new Date().toISOString(),status:'in_flight',requestedModel:config.preset.model,quality:config.preset.quality,size:config.size,background:config.background,n:1,endpoint:'/images/edits',automaticRetries:0,promptSha256:hash(Buffer.from(prompt)),references:images.map((im,i)=>({path:refs[i],sha256:hash(im.bytes),bytes:im.bytes.length})),approval:'User explicitly permitted image2.6 and approved revision 3 final summary: nine views, three outfits, arms down empty hands, restored belt and straight screen-left hip sword, GC9 character AND clothes style retained; user said 진행.'};
 await writeFile(statusPath,JSON.stringify(record,null,2));
 const result=await requestImage({apiKey:key,config,images,fetchImpl:fetch});await writeFile(path.join(here,view+'.png'),result.bytes);
 record={...record,status:'succeeded',finishedAt:new Date().toISOString(),requestId:result.requestId,response:result.response,responseModel:result.response.model||'not reported',outputBytes:result.bytes.length,outputSha256:hash(result.bytes),costUsd:'unknown'};
 await writeFile(statusPath,JSON.stringify(record,null,2));console.log(JSON.stringify({view,status:record.status,requestId:record.requestId,bytes:record.outputBytes,response:record.response}));
}catch(e){const safe=v=>String(v||'').split(key||'___empty___').join('[REDACTED]');const failure={...record,status:'failed_or_unknown',finishedAt:new Date().toISOString(),message:safe(e.message),code:safe(e.code),requestId:safe(e.requestId),automaticRetries:0};await writeFile(statusPath,JSON.stringify(failure,null,2));console.log(JSON.stringify({view,status:failure.status,message:failure.message,code:failure.code}));process.exitCode=1;}finally{key='';}
