param([string]$Page = 'f685092c-bb62-409b-b2e2-6da8b8f20b4d')
$ErrorActionPreference = 'Stop'
$expression = @'
(async()=>{
  const v=document.querySelector('video'),stage=document.getElementById('stage');
  await window.videoReady;
  v.pause(); v.load();
  if(v.readyState<2) await new Promise((resolve,reject)=>{v.addEventListener('loadeddata',resolve,{once:true});v.addEventListener('error',()=>reject(Error('Video failed to load')),{once:true})});
  const c=document.createElement('canvas');c.width=c.height=1024;const ctx=c.getContext('2d',{willReadFrequently:true});
  const seeks=[];
  for(const frame of [0,53,102,131,145,161,239]){
    await new Promise(resolve=>{v.addEventListener('seeked',resolve,{once:true});v.currentTime=(frame+.05)/60});
    if(Math.abs(v.currentTime-(frame+.05)/60)>.0167)throw Error('Frame seeking failed');
    ctx.clearRect(0,0,1024,1024);ctx.drawImage(v,0,0);
    const rgba=ctx.getImageData(0,0,1024,1024).data;
    let opaque=0,zero=0;for(let i=3;i<rgba.length;i+=4){if(rgba[i]===255)opaque++;if(rgba[i]===0)zero++}
    const corners=[rgba[3],rgba[1023*4+3],rgba[(1023*1024)*4+3],rgba[rgba.length-1]];
    if(corners.some(x=>x!==0)||opaque<1000||zero<700000)throw Error('Alpha verification failed');
    seeks.push({logical_frame:frame+1,time:v.currentTime,corners_alpha:corners,opaque_pixels:opaque,transparent_pixels:zero});
  }
  const speeds=[];
  for(const rate of [.25,1,5]){
    v.currentTime=0;v.playbackRate=rate;await v.play();
    const start=performance.now();await new Promise(r=>setTimeout(r,450));v.pause();
    const elapsed=(performance.now()-start)/1000;
    if(v.currentTime<=0)throw Error('Playback did not advance');
    speeds.push({rate,elapsed_seconds:elapsed,video_time:v.currentTime,total_decoded_frames:v.getVideoPlaybackQuality().totalVideoFrames});
  }
  const widths=[];
  for(const [name,target] of [['small',320],['mobile',390]]){
    stage.className='stage light '+name;const width=stage.getBoundingClientRect().width;
    if(Math.abs(width-target)>1)throw Error('Preview size mismatch');widths.push({name,width});
  }
  stage.className='stage battle mobile';document.getElementById('bg').value='battle';document.getElementById('size').value='mobile';
  v.playbackRate=1;document.getElementById('speed').value='1';
  await new Promise(resolve=>{v.addEventListener('seeked',resolve,{once:true});v.currentTime=2.6834});
  return JSON.stringify({checked_at:new Date().toISOString(),url:location.href,duration:v.duration,width:v.videoWidth,height:v.videoHeight,alpha:true,seeks,speeds,preview_widths:widths,background_image:getComputedStyle(stage).backgroundImage,ready_state:v.readyState,video_error:v.error?.message||null,game_runtime_integrated:false});
})()
'@
$response = & 'C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe' eval --page $Page --expression $expression --json | ConvertFrom-Json
if (-not $response.ok) { throw ($response.error | ConvertTo-Json -Depth 8) }
$result = $response.result.result | ConvertFrom-Json
$json = $result | ConvertTo-Json -Depth 12
$destination = Join-Path $PSScriptRoot '../../output/animation/sword-overhead-right-v01/verification-browser.json'
[IO.File]::WriteAllText([IO.Path]::GetFullPath($destination),$json,[Text.UTF8Encoding]::new($false))
$json
