"""Lossless, reproducible local VFX atlas index. Never modifies the downloaded originals.

Frame layouts come from supplied frame files, documented grids, or inspected sheets.
An unknown frame rate is explicitly an editor default, never presented as original timing.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageSequence
from collections import defaultdict, Counter
import hashlib, json, math, re, sys
import numpy as np

sys.stdout.reconfigure(encoding='utf-8')
ROOT=Path(__file__).resolve().parents[2]/'.local'/'effect-materials'
OUT=ROOT/'normalized';OUT.mkdir(exist_ok=True)
materials=[];pending=[]
def natural(p):return [int(v) if v.isdigit() else v.lower() for v in re.split(r'(\d+)',str(p))]
def pngs(p):return sorted((x for x in p.rglob('*.png') if '__MACOSX' not in x.parts and not x.name.startswith('._')),key=natural)
def category(name):
    s=name.lower()
    for keys,label in [('slash sword slice cut','참격'),('smoke puff dust fog fart','먼지·연기'),('explosion explode kaboom bomb','폭발'),('lightning electric thunder','전기'),('fire flame magma burn','화염'),('water bubble rain splash','물'),('hit impact blood','타격'),('ring aura shield teleport portal','장판·보호막'),('spark star flare light flash','빛·파티클')]:
        if any(k in s for k in keys.split()):return label
    return '마법·기타'
def unmatte(im):
    a=np.array(im,dtype=np.float32);level=a[:,:,:3].max(axis=2)
    a[:,:,:3]=np.divide(a[:,:,:3]*255,level[:,:,None],out=np.zeros_like(a[:,:,:3]),where=level[:,:,None]>0)
    a[:,:,3]*=level/255
    return Image.fromarray(np.clip(a,0,255).astype('uint8'),'RGBA')

def emit(pack,key,frames,sources,fps=15,timing='원본 FPS 미기재 · 편집 기본 15 FPS',variant='',primary=True,dark=False,rects=None,durations=None):
    if not frames:return
    ident=pack+'-'+hashlib.sha256(key.encode()).hexdigest()[:12]
    dest=OUT/ident;dest.mkdir(exist_ok=True)
    sizes={im.size for im in frames}
    # Keep the same pixel coordinate origin throughout a sequence. Never auto-center each frame.
    if len(sizes)!=1:
        pending.append({'packId':pack,'source':sources[0],'reason':'프레임 크기가 달라 기준점 확인 필요','name':key});return
    w,h=frames[0].size;pad=max(2,math.ceil(max(w,h)/64));cw,ch=w+2*pad,h+2*pad
    cols=max(1,min(8,4096//cw));rows=max(1,4096//ch);capacity=cols*rows
    records=[];sheets=[];touching=[];opaque=[];visible=[];thumbs=[]
    preview=Image.new('RGBA',(128*min(8,len(frames)),128*math.ceil(len(frames)/8)))
    for page in range(math.ceil(len(frames)/capacity)):
        part=frames[page*capacity:(page+1)*capacity];ncols=min(cols,len(part));nrows=math.ceil(len(part)/ncols)
        atlas=Image.new('RGBA',(ncols*cw,nrows*ch))
        for j,im in enumerate(part):
            i=page*capacity+j;im=im.convert('RGBA');alpha=im.getchannel('A')
            if alpha.getextrema()[0]==255:opaque.append(i+1)
            if dark:im=unmatte(im);alpha=im.getchannel('A')
            bbox=alpha.getbbox()
            if bbox and (bbox[0]==0 or bbox[1]==0 or bbox[2]==w or bbox[3]==h):touching.append(i+1)
            if bbox:visible.append(i)
            miniature=Image.new('RGBA',(cw,ch));miniature.paste(im,(pad,pad));miniature.thumbnail((128,128),Image.Resampling.LANCZOS)
            preview.paste(miniature,((i%8)*128+(128-miniature.width)//2,(i//8)*128+(128-miniature.height)//2))
            x=(j%ncols)*cw;y=(j//ncols)*ch;atlas.paste(im,(x+pad,y+pad))
            records.append({'sheet':page,'x':x,'y':y,'width':cw,'height':ch,'source':sources[min(i,len(sources)-1)],'sourceRect':rects[i] if rects else [0,0,w,h],'duration':durations[i] if durations else 1/fps})
            # Full-frame gray/green contact sheets, one per material (not a black-only check).
            thumb=Image.new('RGBA',(100,100),'#b5d2bc' if i%2 else '#d5d8dc')
            art=im.copy();art.thumbnail((92,82),Image.Resampling.NEAREST);thumb.alpha_composite(art,((100-art.width)//2,2+(82-art.height)//2))
            ImageDraw.Draw(thumb).text((4,86),str(i+1),fill='#18251d');thumbs.append(thumb)
        path=dest/f'sheet-{page}.png';atlas.save(path,optimize=False)
        sheets.append(path.relative_to(ROOT).as_posix())
    contact=Image.new('RGB',(800,100*math.ceil(len(thumbs)/8)),'#d5d8dc')
    for i,t in enumerate(thumbs):contact.paste(t,((i%8)*100,(i//8)*100))
    contact.save(dest/'frames.jpg',quality=87)
    preview.save(dest/'preview.png')
    materials.append({'id':ident,'packId':pack,'name':key.replace('_',' '),'category':category(pack+' '+key),'variant':variant,'primary':primary,
      'kind':'animation' if len(frames)>1 else 'texture','width':w,'height':h,'padding':pad,'pivotX':.5,'pivotY':.5,'pivotSource':'원본 캔버스 중심 · 편집 가능',
      'fps':fps,'timing':timing,'background':'transparent','sourceBackground':'dark' if dark else 'transparent','sheets':sheets,'frames':records,
      'duration':sum(f['duration'] for f in records),'contact':(dest/'frames.jpg').relative_to(ROOT).as_posix(),'preview':(dest/'preview.png').relative_to(ROOT).as_posix(),'edgeFrames':touching,
      'opaqueFrames':opaque if not dark else [],'firstVisible':visible[0] if visible else 0,
      'changes':'원본 좌표 유지, 비례 투명 여백 추가, 아틀라스 재배열'+(', 검정 매트 투명화' if dark else '')})
    if len(materials)%40==0:print('Indexed',len(materials),flush=True)

def sequence(pack,d,files=None,**kw):
    files=files if files is not None else sorted(d.glob('*.png'),key=natural)
    key=kw.pop('key',d.relative_to(ROOT/'originals'/pack).as_posix())
    ims=[Image.open(p).convert('RGBA') for p in files]
    emit(pack,key,ims,[p.relative_to(ROOT).as_posix() for p in files],**kw)
    for im in ims:im.close()
def sheet(pack,p,w,h,count=None,**kw):
    im=Image.open(p).convert('RGBA');assert im.width%w==0 and im.height%h==0,p
    rects=[[x,y,w,h] for y in range(0,im.height,h) for x in range(0,im.width,w)]
    if count is not None:rects=rects[:count]
    frames=[im.crop((x,y,x+w,y+h)) for x,y,w,h in rects]
    emit(pack,p.relative_to(ROOT/'originals'/pack).as_posix(),frames,[p.relative_to(ROOT).as_posix()],rects=rects,**kw)
def static(pack,p,**kw):sequence(pack,p.parent,[p],key=p.relative_to(ROOT/'originals'/pack).as_posix(),**kw)

def build_all():
    for pack in ['untied','codemanu']:
        root=ROOT/'originals'/pack
        dirs=sorted({p.parent for p in pngs(root) if ('/PNG/' if pack=='untied' else '/Frames/') in p.as_posix()},key=natural)
        for d in dirs:
            if pack=='untied':
                large='_large_' in d.name;sequence(pack,d,key='/'.join(d.parts[-3:]),fps=15,timing='제작자 guide.txt · 15 FPS',variant='large' if large else 'small',primary=large)
            else:
                fps=60 if '60fps' in d.parts else 30;sequence(pack,d,key=d.parts[-4]+'/'+str(fps)+'fps',fps=fps,timing='제작자 '+str(fps)+'fps 폴더',variant=str(fps)+'fps',primary=fps==30)

    report=json.loads((ROOT/'acquisition.json').read_text(encoding='utf-8'))
    for packdata in report['packs']:
        pack=packdata['id'];root=ROOT/'originals'/pack
        if pack in ['untied','codemanu'] or packdata['status']!='downloaded':continue
        fs=pngs(root);dirs=sorted({p.parent for p in fs},key=natural)
        if pack in ['kenney-smoke','oga-particle-pack-80-sprites']:
            for p in fs:
                if 'PNG' in p.parts:static(pack,p,dark=pack=='oga-particle-pack-80-sprites')
        elif pack.startswith('craftpix'):
            if 'pixel-magic' in pack:
                for p in fs:
                    if '1 Magic' in p.parts:sheet(pack,p,72,72)
            else:
                for d in dirs:
                    if any('icon' in x.lower() for x in d.relative_to(root).parts):continue
                    if not any(x.lower()=='png' for x in d.relative_to(root).parts):continue
                    files=[p for p in fs if p.parent==d]
                    sequence(pack,d,files)
        elif pack in ['oga-grass-ground','oga-grass-blades-alpha-card-texture-side-view']:
            pending.append({'packId':pack,'source':fs[0].relative_to(ROOT).as_posix(),'reason':'이펙트가 아닌 배경·지형 소재 · 원본 보관','name':packdata['name']})
        elif pack in ['oga-animated-particle-effects-1','oga-animated-particle-effects-2']:
            for p in fs:sheet(pack,p,128,128,fps=30,timing='제작자 설명 · 셀 128px / 30 FPS')
        elif pack in ['oga-hit-animation-frame-by-frame','oga-hit-animation-2-frame-by-frame']:
            for p in fs:sheet(pack,p,1024,1024,timing='제작자 설명 · 셀 1024px / FPS 미기재 · 편집 기본 15 FPS')
        elif pack=='oga-animations-blood-hit-and-both-d':
            for p in fs:sheet(pack,p,512,512)
        elif pack.startswith('oga-2d-explosion-animations'):
            for p in fs:sheet(pack,p,256 if 'Half Sized' in p.parts else 512,256 if 'Half Sized' in p.parts else 512,variant='half' if 'Half Sized' in p.parts else 'full',primary='Half Sized' not in p.parts)
        elif pack=='oga-explosion-effects-and-more':
            for p in fs:sheet(pack,p,128,128,timing='시트 실제 128px 격자 확인 · FPS 미기재 · 편집 기본 15 FPS')
        elif pack in ['oga-2d-spell-effects','oga-fire-fx-burning-fire-animation','oga-sparkling-fireball-effect','oga-5x-special-effects-2d','oga-25-special-effects-rendered-with-blender']:
            for d in dirs:
                if d==root:continue
                if pack=='oga-25-special-effects-rendered-with-blender' and d.name=='effects':continue
                sequence(pack,d)
        elif pack in ['oga-magic-flame','oga-teleporter-effect']:
            for d in dirs:
                numbered=[p for p in fs if p.parent==d and p.stem.isdigit()]
                if numbered:sequence(pack,d,numbered,key='original-sequence' if d==root else d.name)
            for p in root.glob('*.png'):
                if p.stem.isdigit():continue
                if pack=='oga-teleporter-effect':sheet(pack,p,240,320,dark='overlay' in p.name)
                # Two flame sheets duplicate the individual frame sequences.
        elif pack=='oga-animated-blue-ring-explosion':sequence(pack,root,[p for p in fs if p.parent==root],key='Blue Ring Explosion')
        elif pack=='oga-lightning-animation':
            for d in dirs:sequence(pack,d,dark=True)
        elif pack=='oga-lightning':
            for p in fs:static(pack,p,dark=True)
        elif pack=='oga-effect-fx-hitting-a-invisible-wall':
            p=next(root.glob('*.gif'));gif=Image.open(p);frames=[];durations=[]
            for f in ImageSequence.Iterator(gif):frames.append(f.convert('RGBA'));durations.append(max(.01,f.info.get('duration',100)/1000))
            emit(pack,p.stem,frames,[p.relative_to(ROOT).as_posix()],durations=durations,timing='원본 GIF 프레임 시간',dark=True)
        elif pack=='oga-lasers-and-beams':
            pending.append({'packId':pack,'source':fs[0].relative_to(ROOT).as_posix(),'reason':'크기가 서로 다른 낱개 빔 모음 · 개별 영역 확인 필요','name':packdata['name']})
        elif pack in ['oga-flare-effect','oga-thick-fog']:
            for p in fs:static(pack,p)
        else:pending.append({'packId':pack,'source':'originals/'+pack,'name':packdata.get('name',pack),'reason':'프레임 배치 확인 필요'})

    packs=[]
    for p in report['packs']:
        if p['status']!='downloaded':continue
        q={k:v for k,v in p.items() if k not in ['files','error']}
        q['archives']=[f['path'] for f in p['files']]
        q['licenseUrl']=q.get('licenseUrl','https://creativecommons.org/publicdomain/zero/1.0/' if p['license']=='CC0' else 'https://creativecommons.org/licenses/by/3.0/' if p['license']=='CC BY 3.0' else 'https://creativecommons.org/licenses/by/4.0/' if p['id']=='codemanu' else p['url'])
        q['credit']='Super Pixel Effects Gigapack - Will Tice / unTied Games' if p['id']=='untied' else p.get('name',p['id'])+' — '+p.get('author','See source')
        packs.append(q)
    catalog={'format':'gd.material-catalog@1','date':report['date'],'packs':packs,'materials':materials,'pending':pending,
     'stats':{'packs':len(packs),'materials':len(materials),'primary':sum(m['primary'] for m in materials),'animations':sum(m['kind']=='animation' for m in materials),'textures':sum(m['kind']=='texture' for m in materials),'frames':sum(len(m['frames']) for m in materials),'pending':len(pending)}}
    (ROOT/'catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    credits=['Grid Defenders / third-party effect materials','Originals remain under their respective licenses.','Changes: lossless frame extraction, transparent padding, atlas repacking; black matte removal only where specified.','']
    for p in packs:credits += [p['credit'],p['url'],'License: '+p['license'],p['licenseUrl'],'']
    (ROOT/'CREDITS.txt').write_text('\n'.join(credits),encoding='utf-8')
    (ROOT/'validation.json').write_text(json.dumps({'stats':catalog['stats'],'allFramesHaveTransparentPadding':True,'sourceEdgeContact':[{ 'id':m['id'],'frames':m['edgeFrames']} for m in materials if m['edgeFrames']],'opaqueSources':[m['id'] for m in materials if m['opaqueFrames']],'pending':pending},ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(catalog['stats']),flush=True)


if __name__=='__main__':
    build_all()
    import subprocess
    subprocess.run([sys.executable,str(Path(__file__).with_name('complete-material-catalog.py'))],check=True)
