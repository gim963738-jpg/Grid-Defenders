"""Remove tiny attached scenery remnants without repainting source pixels."""
import argparse
import json
from pathlib import Path
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from remove_background import SOURCE, OUT


def refine(rgb,raw,frame_index=None):
    raw=raw.copy()
    r,g,b=rgb.astype(np.int16).transpose(2,0,1)
    foreground=raw>32
    # Background crystals touch a hand/cape in the source video. Their tall,
    # bright cyan/purple islands differ from the short cyan stripes in the blade.
    cyan=foreground&(g-r>35)&(b-r>50)&(g>90)&(b>g)
    purple=foreground&(r>90)&(b-r>15)&(b-g>20)&(np.abs(r-g)<35)
    middle_x=float(np.median(np.where(foreground)[1]))
    exclusions=np.zeros(raw.shape,np.uint8)
    for color,minimum,max_bg in [(cyan,200,45),(purple,130,90)]:
        n,labels,stats,_=cv2.connectedComponentsWithStats(color.astype(np.uint8),8)
        for label in range(1,n):
            x,y,w,h,area=stats[label]
            if area<minimum or h<w*1.15 or w>65 or h>90:continue
            if minimum==130 and x+w>middle_x-70:continue
            island=labels==label
            mean=rgb[island].mean(axis=0)
            if mean[2]-mean[1]>=max_bg:continue
            grown=cv2.dilate(island.astype(np.uint8),np.ones((7,7),np.uint8))>0
            if minimum==130:
                exclusions[grown&(b-r>10)&(b-g>15)]=1
            else:
                exclusions[grown&(b-r>20)&(g-r>5)]=1
    # Pink scenery petals below head height; armor/gloves cover the arms/hands.
    pink=foreground&(r-g>35)&(r-b>30)&(np.abs(g-b)<13)&(r>130)
    n,labels,stats,_=cv2.connectedComponentsWithStats(pink.astype(np.uint8),8)
    top=int(np.where(foreground)[0].min())
    for label in range(1,n):
        x,y,w,h,area=stats[label]
        if area<180 or y<top+180:continue
        grown=cv2.dilate((labels==label).astype(np.uint8),np.ones((5,5),np.uint8))>0
        exclusions[grown&(r-g>20)&(r-b>20)]=1
    orange=foreground&(r>130)&(r-g>25)&(r-b>30)&(g-b>-5)&(g-b<65)
    n,labels,stats,_=cv2.connectedComponentsWithStats(orange.astype(np.uint8),8)
    for label in range(1,n):
        x,y,w,h,area=stats[label]
        # Orange petals touching the extended forward glove, away from belt,
        # sword guard, and the face. Do not alter those same-colored items.
        if area<30 or y<top+200 or x<middle_x+105:continue
        grown=cv2.dilate((labels==label).astype(np.uint8),np.ones((5,5),np.uint8))>0
        exclusions[grown&(r-g>20)&(r-b>25)]=1
    # Long pale-cyan speed streaks in the scenery may touch a boot. Blade
    # inlays are separate short stripes; blue cloth has a larger B-G gap.
    wind=foreground&(b-r>35)&(g-r>30)&(np.abs(b-g)<45)&(g>100)&(b>120)
    n,labels,stats,_=cv2.connectedComponentsWithStats(wind.astype(np.uint8),8)
    for label in range(1,n):
        x,y,w,h,area=stats[label]
        if w<50 or w<h*2.5 or y<top+220:continue
        grown=cv2.dilate((labels==label).astype(np.uint8),np.ones((5,5),np.uint8))>0
        exclusions[grown&(b-r>20)&(g-r>15)&(np.abs(b-g)<55)]=1
    raw[exclusions>0]=0
    binary=(raw>16).astype(np.uint8)
    opened=cv2.morphologyEx(binary,cv2.MORPH_OPEN,
                            cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(5,5)))
    n,labels,stats,_=cv2.connectedComponentsWithStats(opened,8)
    largest=1+int(np.argmax(stats[1:,cv2.CC_STAT_AREA]))
    core=(labels==largest).astype(np.uint8)
    support=cv2.dilate(core,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(9,9)))>0
    alpha=np.where(support,raw,0).astype(np.uint8)
    # Only the outer six-pixel band: saturated forest green is not present in
    # blond hair, skin, blue cloth, silver armor or the cyan blade inlays.
    edge=cv2.distanceTransform((alpha>32).astype(np.uint8),cv2.DIST_L2,3)<6
    excess=g-np.maximum(r,b)
    green=(excess>5)&edge
    reduction=np.clip((18-excess)/13.,0,1)
    alpha[green]=np.uint8(alpha[green]*reduction[green])
    alpha[alpha<=3]=0
    alpha[alpha>=252]=255
    if frame_index is not None:
        corrections=json.loads(Path(__file__).with_name('matte-corrections.json').read_text(encoding='utf-8'))
        for correction in corrections.get(str(frame_index),[]):
            # Trace the visible occluder boundary instead of rectangularly
            # erasing an opaque region or inventing pixels hidden by the rock.
            remove=Image.new('L',(1280,720))
            painter=ImageDraw.Draw(remove)
            painter.polygon([tuple(p) for p in correction['polygon']],fill=255)
            for stroke in correction.get('strokes',[]):
                painter.line([tuple(p) for p in stroke['points']],fill=255,width=stroke['width'],joint='curve')
            remove=remove.filter(ImageFilter.GaussianBlur(.55))
            alpha=np.uint8(alpha.astype(np.float32)*(1-np.asarray(remove,dtype=np.float32)/255)+.5)
    alpha[alpha<=3]=0
    n,labels,stats,_=cv2.connectedComponentsWithStats((alpha>0).astype(np.uint8),8)
    for label in range(1,n):
        if stats[label,cv2.CC_STAT_AREA]<12:alpha[labels==label]=0
    result=np.dstack((rgb,alpha))
    result[alpha==0,:3]=0
    return Image.fromarray(result)


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--review',action='store_true')
    args=parser.parse_args()
    indices=[1,5,10,15,40,120,200,240] if args.review else range(1,241)
    destination=OUT/'refine-review' if args.review else OUT/'frames'
    destination.mkdir(exist_ok=True)
    for i in indices:
        rgb=np.asarray(Image.open(SOURCE/f'frames/frame_{i:04}.png').convert('RGB'))
        raw=np.asarray(Image.open(OUT/f'masks/raw_{i:04}.png').convert('L'))
        refine(rgb,raw,i).save(destination/f'frame_{i:04}.png',compress_level=3)
    if args.review:
        sheet=Image.new('RGB',(1280,410),'#eeeeed')
        draw=ImageDraw.Draw(sheet)
        for j,i in enumerate(indices):
            im=Image.open(destination/f'frame_{i:04}.png').convert('RGBA')
            bg=Image.new('RGBA',im.size,'#eeeeed');bg.alpha_composite(im)
            x,y=(j%4)*320,(j//4)*205
            sheet.paste(bg.convert('RGB').resize((320,180),Image.Resampling.LANCZOS),(x,y))
            draw.text((x+8,y+185),f'{i:04d}',fill='#333')
        sheet.save(OUT/'refine-review.jpg',quality=96)
    print('Refined',len(indices),'frames',flush=True)


if __name__=='__main__':main()
