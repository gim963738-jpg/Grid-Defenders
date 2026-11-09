from pathlib import Path
from PIL import Image
import json
out=Path(__file__).resolve().parent;root=out.parents[2];assets=root/'게임/public/assets/items'
atlas=Image.open(assets/'tier1-equipment-atlas.png').convert('RGBA')
crops=[[90,275,190,495],[335,290,292,480],[640,295,267,460],[950,285,210,480],[1200,395,285,300]]
records=[]
for i,(x,y,w,h) in enumerate(crops):
 im=atlas.crop((x,y,x+w,y+h));a=im.getchannel('A');bbox=a.point(lambda a:255 if a>32 else 0).getbbox()
 records.append(dict(id=f'I0{i+1}',source=str(assets/'tier1-equipment-atlas.png'),sourceCanvas=list(atlas.size),crop=[x,y,w,h],alphaContentBBox=bbox))
im=Image.open(assets/'gale-sword.png').convert('RGBA');bbox=im.getchannel('A').point(lambda a:255 if a>32 else 0).getbbox();records.append(dict(id='I08',source=str(assets/'gale-sword.png'),sourceCanvas=list(im.size),alphaContentBBox=bbox))
(out/'아트측정.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8');print([(r['id'],r['alphaContentBBox']) for r in records])
