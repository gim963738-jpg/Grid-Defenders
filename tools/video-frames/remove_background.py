"""Local ToonOut video-frame matting, preserving source RGB and coordinates.

Model: https://huggingface.co/sprited/birefnet-toonout-onnx (MIT)
Original model: https://github.com/MatteoKartoon/BiRefNet (MIT)
No generation, repainting, resize of delivered frames, or paid API is used.
"""
from pathlib import Path
import argparse
import hashlib
import json
import time
import zipfile
import subprocess
import cv2
import numpy as np
import onnxruntime as ort
from PIL import Image, ImageDraw
import imageio_ffmpeg

ROOT=Path(__file__).resolve().parents[2]
SOURCE=ROOT/'output/video-frames/gemini_generated_video_00ffc02e-v01'
OUT=ROOT/'output/video-frames/gemini_generated_video_00ffc02e-transparent-v01'
MODEL=Path('C:/Users/user/.cache/video-matting/toonout/birefnet-toonout-fp16.onnx')


def sha(path):
    with path.open('rb') as f:
        return hashlib.file_digest(f,'sha256').hexdigest()


def write_json(path,data):
    path.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')


def create_session():
    options=ort.SessionOptions()
    options.log_severity_level=3
    options.enable_mem_pattern=False
    options.execution_mode=ort.ExecutionMode.ORT_SEQUENTIAL
    options.intra_op_num_threads=4
    print('Loading ToonOut with DirectML GPU',flush=True)
    start=time.monotonic()
    session=ort.InferenceSession(str(MODEL),sess_options=options,
                                providers=['DmlExecutionProvider','CPUExecutionProvider'])
    print('Model loaded',round(time.monotonic()-start,2),'seconds',session.get_providers(),flush=True)
    print('Inputs',[(i.name,i.shape,i.type) for i in session.get_inputs()],flush=True)
    return session


def infer(session,path):
    rgb=np.asarray(Image.open(path).convert('RGB'))
    resized=np.asarray(Image.fromarray(rgb).resize((1024,1024),Image.Resampling.BILINEAR),dtype=np.float32)/255.
    tensor=((resized-np.array([.485,.456,.406],np.float32))/np.array([.229,.224,.225],np.float32))
    tensor=np.ascontiguousarray(tensor.transpose(2,0,1)[None])
    prediction=session.run(None,{session.get_inputs()[0].name:tensor})[0]
    small=prediction[0,0]
    assert np.isfinite(small).all(), 'Non-finite model output'
    if small.min() < -.01 or small.max()>1.01:
        small=1/(1+np.exp(-np.clip(small,-50,50)))
    mask=cv2.resize(small,(rgb.shape[1],rgb.shape[0]),interpolation=cv2.INTER_LINEAR)
    raw=np.uint8(np.clip(mask*255+.5,0,255))
    return rgb,raw


def clean(raw):
    # Retain the character component and nearby disconnected foreground details.
    n,labels,stats,centres=cv2.connectedComponentsWithStats((raw>16).astype(np.uint8),8)
    if n<2:
        raise ValueError('No character detected')
    largest=1+int(np.argmax(stats[1:,cv2.CC_STAT_AREA]))
    core=(labels==largest).astype(np.uint8)
    nearby=cv2.dilate(core,np.ones((61,61),np.uint8))>0
    keep=core>0
    accepted=[]
    for label in range(1,n):
        if label==largest:
            continue
        island=labels==label
        if stats[label,cv2.CC_STAT_AREA]>=12 and np.any(nearby & island):
            keep|=island
            accepted.append(label)
    # A narrow neighbourhood retains the original soft boundary, not its surroundings.
    support=cv2.dilate(keep.astype(np.uint8),np.ones((5,5),np.uint8))>0
    alpha=np.where(support,raw,0).astype(np.uint8)
    alpha[alpha<=3]=0
    alpha[alpha>=252]=255
    return alpha,{'components':int(n-1),'nearby_components_kept':len(accepted)}


def composite(rgba,color):
    background=Image.new('RGBA',rgba.size,color)
    background.alpha_composite(rgba)
    return background.convert('RGB')


def make_contact(indices,name):
    sheet=Image.new('RGB',(1280,205*((len(indices)+3)//4)),'#efefeb')
    draw=ImageDraw.Draw(sheet)
    for j,i in enumerate(indices):
        image=Image.open(OUT/f'frames/frame_{i:04}.png').convert('RGBA')
        tile=composite(image,'#d9f6d7' if (j//4)%2==0 else '#eeeeed')
        x,y=(j%4)*320,(j//4)*205
        sheet.paste(tile.resize((320,180),Image.Resampling.LANCZOS),(x,y))
        draw.text((x+8,y+185),f'{i:04d}  |  {(i-1)/24:.3f}s',fill='#29323a')
    sheet.save(OUT/name,quality=95)


def process(session,indices):
    for i in indices:
        destination=OUT/f'frames/frame_{i:04}.png'
        if destination.exists():
            continue
        start=time.monotonic()
        rgb,raw=infer(session,SOURCE/f'frames/frame_{i:04}.png')
        alpha,details=clean(raw)
        rgba=np.dstack((rgb,alpha))
        rgba[alpha==0,:3]=0
        Image.fromarray(raw).save(OUT/f'masks/raw_{i:04}.png')
        Image.fromarray(rgba).save(destination,compress_level=3)
        print(f'Frame {i:04}: {time.monotonic()-start:.2f}s; bbox={Image.fromarray(alpha).getbbox()}; {details}',flush=True)


def verify_and_package():
    source_manifest=json.loads((SOURCE/'frames.json').read_text(encoding='utf-8'))
    records=[]
    union=[1280,720,0,0]
    for i in range(1,241):
        path=OUT/f'frames/frame_{i:04}.png'
        image=Image.open(path).convert('RGBA')
        a=np.asarray(image)
        src=np.asarray(Image.open(SOURCE/f'frames/frame_{i:04}.png').convert('RGB'))
        assert image.size==(1280,720)
        alpha=a[:,:,3]
        foreground=alpha>0
        assert np.array_equal(a[:,:,:3][foreground],src[foreground]), f'RGB changed {i}'
        edge=int(max(alpha[0].max(),alpha[-1].max(),alpha[:,0].max(),alpha[:,-1].max()))
        assert edge==0, f'Nontransparent outer border at frame {i}'
        bbox=image.getchannel('A').getbbox()
        for axis in [0,1]:union[axis]=min(union[axis],bbox[axis])
        for axis in [2,3]:union[axis]=max(union[axis],bbox[axis])
        records.append({'frame':i,'file':f'frames/{path.name}',
                        'source_time_seconds':source_manifest['frames'][i-1]['source_time_seconds'],
                        'alpha_bbox':bbox,'border_alpha_max':edge,
                        'visible_pixels':int(foreground.sum()),'rgb_unchanged':True,'sha256':sha(path)})
    write_json(OUT/'frames.json',{'source_frames':str(SOURCE),'source_video':source_manifest['source'],
                'source_video_sha256':source_manifest['source_sha256'],'width':1280,'height':720,
                'frame_count':240,'fps':24,'duration_seconds':10,
                'background':'transparent','source_rgb_preserved':True,
                'source_positions_preserved':True,'frame_resampling':False,
                'model':'ToonOut ONNX fp16','model_sha256':sha(MODEL),
                'model_revision':'2ded6fe6063fe146b7b30d8b4cfc5636df322525',
                'model_url':'https://huggingface.co/sprited/birefnet-toonout-onnx',
                'refinement':'5px morphological opening + 4px support restoration; attached crystal/petal/scenery speed-streak color/shape filtering; forest green outer-edge cleanup; components under 12px removed',
                'license':'MIT','alpha_union_bbox':union,'frames':records})
    make_contact([1+round(i*239/23) for i in range(24)],'contact-sheet-light.jpg')
    ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
    subprocess.run([ffmpeg,'-hide_banner','-loglevel','error','-y','-framerate','24',
        '-start_number','1','-i',str(OUT/'frames/frame_%04d.png'),'-frames:v','240','-an',
        '-c:v','libvpx-vp9','-pix_fmt','yuva420p','-b:v','0','-crf','18',
        '-auto-alt-ref','0','-row-mt','1',str(OUT/'gemini-00ffc02e-transparent.webm')],check=True)
    # Background in this MP4 is only a preview of the alpha result.
    base=np.indices((720,1280))
    tile=((base[0]//32+base[1]//32)%2*15+226).astype(np.uint8)
    check=Image.fromarray(np.dstack((tile,tile,tile,np.full_like(tile,255))))
    preview=subprocess.Popen([ffmpeg,'-hide_banner','-loglevel','error','-y','-f','rawvideo',
        '-pix_fmt','rgb24','-s','1280x720','-r','24','-i','-','-frames:v','240','-an',
        '-c:v','libx264','-pix_fmt','yuv420p','-crf','20','-movflags','+faststart',
        str(OUT/'preview-checkerboard.mp4')],stdin=subprocess.PIPE)
    for i in range(1,241):
        image=check.copy()
        image.alpha_composite(Image.open(OUT/f'frames/frame_{i:04}.png').convert('RGBA'))
        preview.stdin.write(image.convert('RGB').tobytes())
    preview.stdin.close()
    assert preview.wait()==0
    archive=OUT/'gemini-00ffc02e-transparent-240frames.zip'
    with zipfile.ZipFile(archive,'w',zipfile.ZIP_STORED) as z:
        for path in sorted((OUT/'frames').glob('*.png')):z.write(path,'frames/'+path.name)
        for path in [OUT/'frames.json',OUT/'contact-sheet-light.jpg',OUT/'gemini-00ffc02e-transparent.webm',OUT/'preview-checkerboard.mp4']:
            z.write(path,path.name)
        if (OUT/'all-240-frames-light.jpg').exists():z.write(OUT/'all-240-frames-light.jpg','all-240-frames-light.jpg')
    with zipfile.ZipFile(archive) as z:
        assert z.testzip() is None
        assert len([n for n in z.namelist() if n.startswith('frames/')])==240
    print('Verified and packaged',archive,archive.stat().st_size,flush=True)


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--samples',action='store_true')
    parser.add_argument('--package-only',action='store_true')
    args=parser.parse_args()
    for name in ['frames','masks']:(OUT/name).mkdir(parents=True,exist_ok=True)
    if args.package_only:
        verify_and_package();return
    session=create_session()
    indices=[1,40,120,200,240] if args.samples else range(1,241)
    process(session,indices)
    if args.samples:make_contact(indices,'samples-light.jpg')
    else:verify_and_package()


if __name__=='__main__':main()
