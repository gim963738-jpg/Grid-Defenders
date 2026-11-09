import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.dirname(fileURLToPath(import.meta.url));
const readJson=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const table=Array.from({length:256},(_,i)=>{let v=i;for(let b=0;b<8;b++)v=v&1?0xedb88320^(v>>>1):v>>>1;return v>>>0;});
function chunk(type,data){const body=Buffer.concat([Buffer.from(type),data]),h=Buffer.alloc(4),crc=Buffer.alloc(4);h.writeUInt32BE(data.length);let c=0xffffffff;for(const b of body)c=table[(c^b)&255]^(c>>>8);crc.writeUInt32BE((c^0xffffffff)>>>0);return Buffer.concat([h,body,crc]);}
function chunks(buffer){const out=[];for(let o=8;o<buffer.length;){const n=buffer.readUInt32BE(o);out.push({type:buffer.toString('ascii',o+4,o+8),data:buffer.subarray(o+8,o+8+n)});o+=n+12;}return out;}
const summary={actions:{},status:'reviewable pilot; not a validated reusable skeleton',character:'silver_staff_mage',direction:'right'};
for(const action of ['walk','run']){
  const folder=path.join(root,action),duration=action==='walk'?1000:750;
  const frames=Array.from({length:30},(_,i)=>({name:`${action}-right-${String(i+1).padStart(2,'0')}.png`,index:i}));
  const pngs=frames.map(f=>chunks(fs.readFileSync(path.join(folder,'frames',f.name))));
  const header=pngs[0].find(c=>c.type==='IHDR').data;
  if(!pngs.every(p=>p.find(c=>c.type==='IHDR').data.equals(header)))throw Error('PNG formats differ');
  const actl=Buffer.alloc(8);actl.writeUInt32BE(30);actl.writeUInt32BE(0,4);
  const out=[Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('acTL',actl)];
  for(const c of pngs[0])if(['sRGB','gAMA','cHRM','pHYs'].includes(c.type))out.push(chunk(c.type,c.data));
  let seq=0;const metadata={};
  for(let i=0;i<30;i++){
    const ms=Math.round((i+1)*duration/30)-Math.round(i*duration/30);
    const fc=Buffer.alloc(26);fc.writeUInt32BE(seq++);fc.writeUInt32BE(256,4);fc.writeUInt32BE(256,8);fc.writeUInt16BE(ms,20);fc.writeUInt16BE(1000,22);
    out.push(chunk('fcTL',fc));
    for(const c of pngs[i].filter(c=>c.type==='IDAT')){if(i===0)out.push(chunk('IDAT',c.data));else{const s=Buffer.alloc(4);s.writeUInt32BE(seq++);out.push(chunk('fdAT',Buffer.concat([s,c.data])));}}
    metadata[frames[i].name]={frame:{x:i%6*256,y:Math.floor(i/6)*256,w:256,h:256},rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:256,h:256},sourceSize:{w:256,h:256},pivot:{x:.5,y:228/256},duration:ms};
  }
  out.push(chunk('IEND',Buffer.alloc(0)));fs.writeFileSync(path.join(folder,`${action}-right-animated.png`),Buffer.concat(out));
  const sourceMap=action==='run'?readJson(path.join(root,'run-source-map.json')):frames.map((f,i)=>({frame:i+1,source:'walk-generated-v01.png',sourceCell:i+1}));
  const json={frames:metadata,animations:{[`${action}-right`]:frames.map(f=>f.name)},meta:{image:`${action}-right-30f.png`,format:'RGBA8888',size:{w:1536,h:1280},scale:'1',columns:6,rows:5,frameCount:30,cycleMs:duration,nominalFps:30000/duration,loop:true,direction:'right',order:'row-major',originPixels:{x:128,y:228},originPurpose:'Visual ground anchor only; not collision or damage bounds.',normalizedSourceCell:229,padding:{left:13,top:13,right:14,bottom:14},resampling:action==='run'?'All four 1774x887 source atlases uniformly reduced to916x458 using nearest-neighbour before slicing.':'None',provenance:sourceMap,tool:'built-in image_gen'}};
  fs.writeFileSync(path.join(folder,`${action}-right-30f.json`),JSON.stringify(json,null,2));
  fs.writeFileSync(path.join(folder,'sequence.json'),JSON.stringify({action,cycleMs:duration,loop:true,frames:frames.map(f=>({frame:f.index+1,file:`frames/${f.name}`,durationMs:metadata[f.name].duration})),sourceMap},null,2));
  summary.actions[action]={frameCount:30,cycleMs:duration,uniqueFrameFileHashes:new Set(frames.map(f=>sha(path.join(folder,'frames',f.name)))).size,atlas:`${action}/${action}-right-30f.png`,animation:`${action}/${action}-right-animated.png`};
}
fs.writeFileSync(path.join(root,'asset-manifest.json'),JSON.stringify(summary,null,2));
console.log(JSON.stringify(summary));
