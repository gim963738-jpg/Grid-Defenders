"""Final decoded-alpha and all-frame audit for background-removed video frames."""
from pathlib import Path
import subprocess
import json
import numpy as np
from PIL import Image, ImageDraw
import imageio_ffmpeg
from remove_background import SOURCE, OUT, write_json, sha


def audit():
    sheet=Image.new('RGB',(16*160,15*106),'#eeeeed')
    draw=ImageDraw.Draw(sheet)
    counts=[]
    padding=[]
    for i in range(1,241):
        image=Image.open(OUT/f'frames/frame_{i:04}.png').convert('RGBA')
        alpha=np.asarray(image)[:,:,3]
        box=image.getchannel('A').getbbox()
        counts.append(int((alpha>127).sum()))
        padding.append(min(box[0],box[1],1280-box[2],720-box[3]))
        assert alpha[0].max()==alpha[-1].max()==alpha[:,0].max()==alpha[:,-1].max()==0
        bg=Image.new('RGBA',(1280,720),'#d9f6d7' if (i//16)%2==0 else '#eeeeed')
        bg.alpha_composite(image)
        x,y=(i-1)%16*160,(i-1)//16*106
        sheet.paste(bg.convert('RGB').resize((160,90),Image.Resampling.LANCZOS),(x,y))
        draw.text((x+4,y+91),f'{i:04d}',fill='#333')
    sheet.save(OUT/'all-240-frames-light.jpg',quality=95)
    # Alpha can be ignored by the native VP9 decoder: explicitly use libvpx.
    ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
    process=subprocess.Popen([ffmpeg,'-hide_banner','-loglevel','error','-c:v','libvpx-vp9',
        '-i',str(OUT/'gemini-00ffc02e-transparent.webm'),'-an','-pix_fmt','rgba',
        '-f','rawvideo','-'],stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    count=0
    max_edge=0
    alpha_errors=[]
    while True:
        data=process.stdout.read(1280*720*4)
        if not data:break
        assert len(data)==1280*720*4
        rgba=np.frombuffer(data,np.uint8).reshape(720,1280,4)
        alpha=rgba[:,:,3]
        edge=int(max(alpha[0].max(),alpha[-1].max(),alpha[:,0].max(),alpha[:,-1].max()))
        max_edge=max(max_edge,edge)
        assert np.count_nonzero(alpha==0)>1280*720*.65
        assert alpha.max()>=250
        original=np.asarray(Image.open(OUT/f'frames/frame_{count+1:04}.png'))[:,:,3]
        alpha_errors.append(float(np.abs(alpha.astype(float)-original).mean()))
        count+=1
    errors=process.stderr.read().decode('utf-8',errors='replace')
    assert process.wait()==0,errors
    assert count==240
    assert max_edge==0
    manifest=json.loads((SOURCE/'frames.json').read_text(encoding='utf-8'))
    assert sha(Path(manifest['source']))==manifest['source_sha256']
    result={'png_count':240,'width':1280,'height':720,'fps':24,'duration_seconds':10,
        'source_video_unchanged':True,'all_png_borders_fully_transparent':True,
        'minimum_png_padding_px':min(padding),'minimum_foreground_pixels':min(counts),
        'maximum_foreground_pixels':max(counts),'decoded_webm_frames':count,
        'webm_borders_alpha_max':max_edge,'mean_webm_alpha_error_8bit':float(np.mean(alpha_errors)),
        'source_foreground_rgb_check':'Every retained pixel byte-identical, checked in frames.json',
        'visual_audits':['all-240-frames-light.jpg','contact-sheet-light.jpg'],
        'game_runtime_integrated':False}
    write_json(OUT/'verification.json',result)
    print(json.dumps(result,ensure_ascii=False),flush=True)


if __name__=='__main__':audit()
