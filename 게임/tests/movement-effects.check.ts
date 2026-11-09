import { createMovementPreset, MOVEMENT_PRESETS } from '../src/effect-workshop/movementPresets';
import { createGraph } from '../src/effect-workshop/graphModel';
import { validateRecipe, makeAiPrompt } from '../src/effect-workshop/model';
import { canvas, createSheet, destroyFrames, renderFrame, renderFrames, sheetMetadata } from '../src/effect-workshop/renderer';

/** Browser-only audit and source export. Does not read or write user storage. */
export async function buildMovementSources() {
  const checks: string[] = [], files: { name: string; data: string; base64: boolean }[] = [], metrics: object[] = [];
  const check = (ok: boolean, message: string) => { if (!ok) throw Error(message); checks.push(message); };
  const addJson = (name: string, data: unknown) => files.push({ name, data: JSON.stringify(data, null, 2), base64: false });
  const addPng = (name: string, image: HTMLCanvasElement) => files.push({ name, data: image.toDataURL('image/png').split(',')[1], base64: true });
  const overview = canvas(1200, 640), oc = overview.getContext('2d')!;
  oc.fillStyle = '#19202B'; oc.fillRect(0, 0, overview.width, overview.height);
  for (let n = 0; n < MOVEMENT_PRESETS.length; n++) {
    const info = MOVEMENT_PRESETS[n], recipe = validateRecipe(createMovementPreset(info.id)), stable = JSON.stringify(recipe), frames = renderFrames(recipe);
    try {
      check(frames.every(f => !f.touchesEdge), `${info.id}: all source frames stay inside their extraction bounds`);
      check(!frames[0].visible && !frames.at(-1)!.visible, `${info.id}: transparent beginning and end`);
      check(frames.filter(f => f.visible).length > frames.length / 2, `${info.id}: visible throughout the authored action`);
      let outerTransparent = true;
      for (const frame of frames) {
        const c = frame.canvas, d = c.getContext('2d')!.getImageData(0,0,c.width,c.height).data;
        for (let i = 0; i < c.width; i++) outerTransparent &&= d[i*4+3]===0 && d[((c.height-1)*c.width+i)*4+3]===0 && d[(i*c.width)*4+3]===0 && d[(i*c.width+c.width-1)*4+3]===0;
      }
      check(outerTransparent, `${info.id}: padded PNG outer edge is completely transparent`);
      const mid = Math.floor(frames.length * .32), again = renderFrame(recipe, mid), graphRecipe = structuredClone(recipe); graphRecipe.graph = createGraph(graphRecipe);
      const nodeFrame = renderFrame(validateRecipe(graphRecipe), mid);
      try {
        check(again.canvas.toDataURL() === frames[mid].canvas.toDataURL(), `${info.id}: repeated rendering is deterministic`);
        const a = nodeFrame.canvas.getContext('2d')!.getImageData(0,0,240,240).data, b = frames[mid].canvas.getContext('2d')!.getImageData(0,0,240,240).data;
        let delta = 0;
        for (let i=0;i<a.length;i+=4) {
          delta=Math.max(delta,Math.abs(a[i+3]-b[i+3]));
          for(let c=0;c<3;c++) delta=Math.max(delta,Math.abs(a[i+c]*a[i+3]/255-b[i+c]*b[i+3]/255));
        }
        // Intermediate normal-blend canvases round alpha independently (up to 3/255).
        check(delta <= 3, `${info.id}: node composition preserves source pixels within 8-bit alpha rounding`);
      } finally { destroyFrames([again, nodeFrame]); }
      check(stable === JSON.stringify(recipe), `${info.id}: rendering and export preserve editable source data`);
      const metadata = sheetMetadata(recipe, 8);
      check(metadata.frames.every(f => f.pivot.x === 24 + .68 * 192 && f.pivot.y === 24 + .68 * 192), `${info.id}: foot pivot remains fixed in every cell`);
      addJson(`${info.id}.effect.json`, recipe); addJson(`${info.id}.sheet.json`, metadata); addPng(`${info.id}.sheet.png`, createSheet(frames, 8));
      const contact = canvas(8 * 144, Math.ceil(frames.length / 8) * 160 + 32), cc = contact.getContext('2d')!;
      cc.fillStyle = '#E1E4E6'; cc.fillRect(0,0,contact.width,contact.height); cc.fillStyle = '#223344'; cc.font = '16px sans-serif'; cc.fillText(`${recipe.name} · ${recipe.settings.frames} frames · ${recipe.settings.frames/recipe.settings.fps}s`, 12, 22);
      frames.forEach((f,i) => { const x=(i%8)*144, y=Math.floor(i/8)*160+32; cc.fillStyle=i%2 ? '#B6D3AE' : '#D7DADD'; cc.fillRect(x,y,144,160); cc.drawImage(f.canvas,x,y,144,144); cc.fillStyle='#334451'; cc.font='11px sans-serif'; cc.fillText(String(i+1),x+6,y+153); });
      addPng(`${info.id}.contact.png`, contact);
      const x=(n%5)*240, y=Math.floor(n/5)*320; oc.fillStyle='#D5D8DC'; oc.fillRect(x+8,y+10,224,224); oc.drawImage(frames[mid].canvas,x+8,y+10,224,224); oc.fillStyle='#F4F5F7'; oc.font='bold 17px sans-serif'; oc.fillText(recipe.name,x+12,y+266); oc.fillStyle='#B2BDCB'; oc.font='13px sans-serif'; oc.fillText(`${recipe.settings.frames/recipe.settings.fps}s · ${frames.length} frames`,x+12,y+290);
      metrics.push({ id: info.id, frames: frames.length, visible: frames.filter(f=>f.visible).length, touchesEdge: frames.filter(f=>f.touchesEdge).length, duration: recipe.settings.frames/recipe.settings.fps, pivot: recipe.placement, layers: recipe.layers.map(l=>l.type) });
    } finally { destroyFrames(frames); }
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  check(makeAiPrompt(createMovementPreset('run-water'),'수정').includes('dust/wind/splash'), 'AI requests preserve all supported movement layer types');
  addPng('movement-overview.png', overview);
  addJson('manifest.json', { format:'gd.effect-pack@1', name:'달리기·이동 이펙트 10종', facing:'right', background:'transparent', recipes:MOVEMENT_PRESETS.map(p=>({ ...p, recipe:`${p.id}.effect.json`, sheet:`${p.id}.sheet.png`, metadata:`${p.id}.sheet.json` })) });
  return { checks, metrics, files };
}

/** Actual battlefield renderer, isolated from combat/player saves. A stationary actor marks the foot pivot. */
export async function captureMovementBattle() {
  const { createBattlePreview } = await import('../src/effect-workshop/battle');
  const host = document.createElement('div'); host.style.cssText='position:fixed;inset:0 auto auto 0;width:390px;height:430px;z-index:999;background:#1c2521'; document.body.append(host);
  const preview = await createBattlePreview(host), files: { name:string; data:string }[] = [];
  const contact = canvas(1100, 760), ctx=contact.getContext('2d')!; ctx.fillStyle='#DCE1E4'; ctx.fillRect(0,0,1100,760);
  try {
    for(let n=0;n<MOVEMENT_PRESETS.length;n++) {
      const info=MOVEMENT_PRESETS[n], recipe=createMovementPreset(info.id), frame=renderFrame(recipe,Math.floor(recipe.settings.frames*.32));
      const posed=structuredClone(recipe);
      posed.drawing ??= {version:1,enabled:true,showBase:true,prompt:'검수용 발 기준점',strokes:[]};
      posed.drawing.strokes.push({id:'qa-foot-pivot',role:'move',purpose:'direction',directionTarget:'actor',points:[[.68,.68],[.68,.68]],step:1,duration:1.2,delay:0,linger:0,color:'#FFFFFF',width:.005,style:'trail',followActor:false,fold:false,note:'검수용 정지 시전자'});
      for(let scene=0;scene<2;scene++) {
        const y=scene ? 255 : 128; preview.setPosition(170,y); preview.draw(frame,posed);
        const surface=host.querySelector('canvas')!, ratio=surface.width/390;
        files.push({name:`${info.id}.battle-${scene ? 'center' : 'top'}.png`,data:surface.toDataURL().split(',')[1]});
        const tx=(n%5)*220,ty=Math.floor(n/5)*380+scene*190;
        ctx.drawImage(surface,75*ratio,(y-90)*ratio,220*ratio,158*ratio,tx,ty,220,158); ctx.fillStyle='#223344'; ctx.font='14px sans-serif'; ctx.fillText(`${recipe.name} · ${scene ? '중앙' : '상단'}`,tx+6,ty+179);
      }
      destroyFrames([frame]);
    }
    files.push({name:'battle-contact.png',data:contact.toDataURL().split(',')[1]});
    return { scenes:20, files };
  } finally { preview.destroy(); host.remove(); }
}
