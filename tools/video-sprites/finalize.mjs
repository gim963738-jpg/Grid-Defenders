import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const cfg=JSON.parse(fs.readFileSync(process.argv[2],'utf8').replace(/^\uFEFF/,''));
const root=process.cwd(),out=cfg.output;
const read=f=>JSON.parse(fs.readFileSync(path.join(out,f),'utf8').replace(/^\uFEFF/,''));
const write=(f,v)=>fs.writeFileSync(path.join(out,f),JSON.stringify(v,null,2)+'\n');
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const s=read('extraction-stats.json'),durationMs=Math.round(cfg.duration*1000);
if(s.frames.length!==60||new Set(cfg.frames.map(f=>f.source_index)).size!==60)throw Error('Expected sixty unique source samples');
const anchor={x:(s.source_width/2-s.crop_x)/s.cell_width,y:(s.source_max_y+1-s.crop_y)/s.cell_height};
const atlas={
 frames:s.frames.map((f,i)=>({
  filename:path.basename(f.file),frame:{x:f.x,y:f.y,w:f.w,h:f.h},rotated:false,trimmed:false,
  spriteSourceSize:{x:0,y:0,w:f.w,h:f.h},sourceSize:{w:f.w,h:f.h},pivot:anchor,
  duration:Math.round((i+1)*durationMs/60)-Math.round(i*durationMs/60),
  sourceFrameIndex:cfg.frames[i].source_index,sourceTimestamp:cfg.frames[i].source_pts,
  file:f.file,sha256:sha(path.join(out,f.file))
 })),
 meta:{
  app:'Grid Defenders video sprite extraction',image:s.sheet,format:'RGBA8888',
  size:{w:s.sheet_width,h:s.sheet_height},scale:'1',frameCount:60,columns:s.columns,rows:s.rows,
  frameSize:{w:s.cell_width,h:s.cell_height},fps:60000/durationMs,durationMs,
  frameOrder:'row-major, left to right then top to bottom',anchor,
  anchorPixels:{x:s.source_width/2-s.crop_x,y:s.source_max_y+1-s.crop_y},
  sourceCropOrigin:{x:s.crop_x,y:s.crop_y},resampled:false,
  sampling:'60 distinct source frames, nearest timestamps evenly spaced from first to last source frame',
  source:{file:path.basename(cfg.source),path:cfg.source,sha256:sha(cfg.source),width:s.source_width,height:s.source_height,decodedFrames:Number(cfg.source_video.streams.find(t=>t.codec_type==='video').nb_read_frames),durationSeconds:cfg.duration},
  alpha:'binary transparent silhouette; original RGB retained at every visible pixel',
  sheetSha256:sha(path.join(out,s.sheet))
 }
};
write('walk_right_60.json',atlas);
const sourceRecord={
 source:atlas.meta.source,source_probe:cfg.source_video,selected_frames:cfg.frames.map(({index,source_index,source_pts,sample_target})=>({index,source_index,source_pts,sample_target})),
 extraction:{tool:'FFmpeg 9.0.2',native_decoder:true,new_frames_generated:false,interpolation:false,resampled:false,alpha_method:'palette-specific sky/grass separation, largest character component, enclosed foreground-island restoration',common_canvas:true},
 tool_download:{provider:'Gyan Windows build linked from FFmpeg.org',index:'https://ffmpeg.org/download.html',url:'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip',archive_sha256_verified:true},
 output:{sheet:s.sheet,atlas:'walk_right_60.json',preview:'미리보기.html',frames:60,frameSize:atlas.meta.frameSize,sheetSize:atlas.meta.size},
 review_status:'pending visual review',source_preserved:true
};
write('source-and-extraction.json',sourceRecord);
const template=fs.readFileSync(path.join(root,'tools/video-sprites/preview.template.html'),'utf8');
fs.writeFileSync(path.join(out,'미리보기.html'),template.replace('__CLIP_DATA__',JSON.stringify(atlas).replaceAll('<','\\u003c')));
console.log(JSON.stringify({frames:60,sheet:atlas.meta.size,cell:atlas.meta.frameSize,durationMs,fps:atlas.meta.fps,alpha:true,anchor:atlas.meta.anchorPixels}));
