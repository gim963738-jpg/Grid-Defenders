import { compositionDuration, compositionMaterials, creditsFor, parseComposition, type MaterialCatalog, type MaterialComposition } from './materialModel';
import { drawComposition, prepareComposition, touchesCanvasEdge } from './materialRender';

const crcTable=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=(n&1)?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
const crc=(a:Uint8Array)=>{let c=0xffffffff;for(const v of a)c=crcTable[(c^v)&255]^(c>>>8);return (c^0xffffffff)>>>0;};
/** Small, uncompressed ZIP writer: PNGs are already compressed. UTF-8 filenames. */
export async function zipFiles(files:{name:string;blob:Blob}[]):Promise<Blob> {
  const body:BlobPart[]=[],central:BlobPart[]=[];let offset=0,centralSize=0;
  for(const file of files){
    const name=new TextEncoder().encode(file.name),data=new Uint8Array(await file.blob.arrayBuffer()),sum=crc(data);
    const local=new Uint8Array(30+name.length),l=new DataView(local.buffer);
    l.setUint32(0,0x04034b50,true);l.setUint16(4,20,true);l.setUint16(6,0x800,true);l.setUint32(14,sum,true);l.setUint32(18,data.length,true);l.setUint32(22,data.length,true);l.setUint16(26,name.length,true);local.set(name,30);
    const cd=new Uint8Array(46+name.length),d=new DataView(cd.buffer);d.setUint32(0,0x02014b50,true);d.setUint16(4,20,true);d.setUint16(6,20,true);d.setUint16(8,0x800,true);d.setUint32(16,sum,true);d.setUint32(20,data.length,true);d.setUint32(24,data.length,true);d.setUint16(28,name.length,true);d.setUint32(42,offset,true);cd.set(name,46);
    body.push(local,data);central.push(cd);offset+=local.length+data.length;centralSize+=cd.length;
  }
  const end=new Uint8Array(22),e=new DataView(end.buffer);e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,centralSize,true);e.setUint32(16,offset,true);
  return new Blob([...body,...central,end],{type:'application/zip'});
}
export const pngBlob=(canvas:HTMLCanvasElement)=>new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('PNG 생성 실패')),'image/png'));
export const jsonBlob=(v:unknown)=>new Blob([JSON.stringify(v,null,2)],{type:'application/json'});
export function saveBlob(blob:Blob,name:string):void {const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
export async function exportComposition(c:MaterialComposition,catalog:MaterialCatalog,onProgress:(v:string)=>void):Promise<Blob> {
  if(!c.layers.some(l=>l.enabled))throw Error('재료를 먼저 추가하세요.');
  const base=new Map(catalog.materials.map(m=>[m.id,m]));c=parseComposition(c,base);
  const byId=compositionMaterials(c,base),duration=compositionDuration(c,byId),count=Math.ceil(duration*c.fps-1e-8);
  if(count>900||duration>30)throw Error('30초·900프레임 이하로 맞춰 주세요.');
  const size=c.size,padding=Math.max(2,Math.ceil(size/64)),cell=size+padding*2,cols=Math.min(8,Math.floor(4096/cell)),capacity=cols*cols;
  const core=document.createElement('canvas');core.width=core.height=size;const files:{name:string;blob:Blob}[]=[],frames:unknown[]=[];
  for(let begin=0;begin<count;begin+=capacity){
    const total=Math.min(capacity,count-begin),sheet=document.createElement('canvas');sheet.width=cell*Math.min(cols,total);sheet.height=cell*Math.ceil(total/cols);
    const ctx=sheet.getContext('2d')!,name=`sheet-${Math.floor(begin/capacity)+1}.png`;
    for(let j=0;j<total;j++){
      const i=begin+j,time=i/c.fps,images=await prepareComposition(c,byId,time,true);drawComposition(core,c,byId,time,true,images);
      if(touchesCanvasEdge(core))throw Error(`${i+1}번 프레임이 화면 경계에 닿습니다. 레이어 크기를 줄이거나 위치를 중앙으로 옮겨 주세요.`);
      const x=j%cols*cell+padding,y=Math.floor(j/cols)*cell+padding;ctx.drawImage(core,x,y);
      frames.push({index:i+1,sheet:name,x,y,width:size,height:size,pivot:{x:size/2,y:size/2},background:'transparent',duration:1/c.fps,padding});
      if(i%12===0){onProgress(`${i+1} / ${count} 프레임 확인 중`);await new Promise(r=>setTimeout(r,0));}
    }
    files.push({name,blob:await pngBlob(sheet)});sheet.width=sheet.height=1;
  }
  files.push({name:'animation.json',blob:jsonBlob({format:'gd.sprite-animation@1',name:c.name,fps:c.fps,frames,displaySize:c.displaySize,sourceDuration:duration,duration:count/c.fps,notes:'Visual animation only. No damage, range, targets or impact timing attached.'})},
    {name:'composition.json',blob:jsonBlob(c)},{name:'CREDITS.txt',blob:new Blob([creditsFor(c,catalog)],{type:'text/plain;charset=utf-8'})});
  return zipFiles(files);
}
