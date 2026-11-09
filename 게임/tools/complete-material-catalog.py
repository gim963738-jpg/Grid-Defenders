"""Classify all collected effects and expose inspected, lossless beam crops.

art_source=existing. Coordinates are ownership rectangles reviewed over a light
background. Keep the whole beam sheet as a reference; never discard faint pixels
or claim to reconstruct authoring layers. Re-runnable without duplicating entries.
"""
from pathlib import Path
from collections import Counter
from PIL import Image
import importlib.util, json, re

HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('atlas_builder',HERE/'build-material-catalog.py')
builder=importlib.util.module_from_spec(spec);spec.loader.exec_module(builder)
ROOT=builder.ROOT
catalog=json.loads((ROOT/'catalog.json').read_text(encoding='utf-8'))
definitions=json.loads((HERE.parent/'src/effect-workshop/materialCategories.json').read_text(encoding='utf-8'))

def classify(name,pack,hint=''):
    for pack_id,pattern,category in definitions['overrides']:
        if pack_id==pack and re.search(pattern,name,re.I):return category
    for pattern,category in definitions['rules']:
        if re.search(pattern,name,re.I):return category
    for pattern,category in definitions['packRules']:
        if re.search(pattern,pack,re.I):return category
    return hint if hint in definitions['categories'] else '소환·특수'

pack='oga-lasers-and-beams';source=ROOT/'originals'/pack/'beams.png'
im=Image.open(source).convert('RGBA')
# Six colours, six visibly separated small projectiles per colour.
groups=[
 ('green',[(4,5,24,31),(6,38,23,59),(3,67,25,93),(36,0,57,20),(38,25,56,49),(39,53,56,86)]),
 ('magenta',[(83,10,103,36),(85,43,102,64),(82,72,104,98),(115,4,136,25),(117,30,135,54),(118,58,135,91)]),
 ('yellow',[(168,6,188,32),(170,39,187,60),(167,68,189,94),(200,0,221,21),(202,26,220,50),(203,54,220,87)]),
 ('red',[(3,120,23,146),(5,153,22,174),(2,182,24,208),(35,114,56,135),(37,140,55,164),(38,168,55,201)]),
 ('cyan',[(84,115,104,141),(86,148,103,169),(83,177,105,203),(116,109,137,130),(118,135,136,159),(119,163,136,196)]),
 ('blue',[(170,113,190,139),(172,146,189,167),(169,175,191,201),(202,107,223,128),(204,133,222,157),(205,161,222,194)])]
regions=[(f'{color} light bullet {i+1:02}',rect) for color,rects in groups for i,rect in enumerate(rects)]
regions += [
 ('yellow beam head',(236,6,285,89)),('cyan beam head',(232,96,288,193)),
 ('green beam head',(117,220,158,290)),('blue beam head',(162,215,209,300)),
 ('blue laser',(294,26,365,146)),('magenta laser',(227,210,275,295)),
 ('yellow laser',(77,309,116,379)),('cyan laser',(135,309,189,406)),('red laser',(203,300,265,411)),
 ('yellow beam head ownership crop',(44,225,104,302)),('green laser ownership crop',(5,302,77,402))]
for name,(x,y,right,bottom) in regions:
    assert 0<=x<right<=im.width and 0<=y<bottom<=im.height
    builder.emit(pack,name,[im.crop((x,y,right,bottom))],[source.relative_to(ROOT).as_posix()],rects=[[x,y,right-x,bottom-y]],timing='낱개 빛·빔 소재 · 원본 애니메이션 시간 없음')
    builder.materials[-1]['category']='투사체' if 'bullet' in name else '레이저·빔'
    builder.materials[-1]['classificationSource']='inspected-beam-regions'
    builder.materials[-1]['changes']+=' · 검토한 개별 사각 영역 추출, 원본 시트 별도 보관'

# Retain the complete irregular beam sheet, including overlapping and cut fragments.
builder.emit(pack,'빔 배치 원본 · 참고',[im],[source.relative_to(ROOT).as_posix()],timing='원본 배치 참고 · 애니메이션 아님')
builder.materials[-1].update(category='배경·참고',group='reference',classificationSource='reference')
for item in catalog['pending']:
    if item['packId'].startswith('oga-grass'):
        p=ROOT/item['source']
        builder.static(item['packId'],p,timing='배경·지형 참고 · 애니메이션 아님')
        builder.materials[-1].update(category='배경·참고',group='reference',classificationSource='reference')

indexed={m['id']:m for m in catalog['materials']}
indexed.update({m['id']:m for m in builder.materials})
for m in indexed.values():
    if m.get('classificationSource') not in ['reference','inspected-beam-regions']:
        m['category']=classify(m['name'],m['packId'],m['category'])
        m['classificationSource']='asset-name-then-pack'
    m['group']=m.get('group','texture' if m['kind']=='texture' else 'effect')
    m['origin']='free'
catalog['materials']=list(indexed.values())
catalog['pending']=[p for p in catalog['pending'] if p['packId'] not in {pack,'oga-grass-ground','oga-grass-blades-alpha-card-texture-side-view'}]
catalog['stats'].update(materials=len(indexed),primary=sum(m['primary'] for m in indexed.values()),animations=sum(m['kind']=='animation' for m in indexed.values()),textures=sum(m['kind']=='texture' for m in indexed.values()),frames=sum(len(m['frames']) for m in indexed.values()),pending=len(catalog['pending']))
catalog['classificationVersion']=1
(ROOT/'catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
audit={'art_source':'existing','route':'lossless owned rectangles + transparent padding','beamRegions':len(regions),'referenceSheets':3,'stats':catalog['stats'],'categories':dict(Counter(m['category'] for m in indexed.values())),'allCategorized':all(m['category'] in definitions['categories'] for m in indexed.values()),'beamRegionsManifest':[{'name':n,'rect':list(r)} for n,r in regions]}
(ROOT/'classification-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in audit.items() if k!='beamRegionsManifest'},ensure_ascii=False))
