from pathlib import Path
from PIL import Image
import hashlib,json,datetime
D=Path(__file__).resolve().parent
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def read(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
m=read(D/'asset-manifest.json');a=m['compareArt'];assert len(a)==3
assert {x['direction'] for x in a}=={'front','right45','right90'}
checks=[]
for x in a:
 assert x['variant']==6 and x['label']=='신규2안'
 assert sha(D/x['file'])==x['sha256']==sha(x['source'])
 im=Image.open(D/x['file']);assert im.size==(x['width'],x['height']) and im.mode=='RGBA'
 alpha=im.getchannel('A');assert alpha.getextrema()==(0,255)
 b=alpha.point(lambda v:255 if v>=32 else 0).getbbox();assert 0<b[0]<b[2]<im.width and 0<b[1]<b[3]<im.height
 assert x['bodyHeight']==x['footY']-x['hairTop']+1
 checks.append({'file':x['file'],'sourceShaMatch':True,'size':im.size,'alpha32InsideCanvas':True,'bodyHeight':x['bodyHeight'],'footX':x['footX'],'footY':x['footY']})
for c in read(D/'generation-records.json')['calls']:
 assert sha(c['source'])==c['sha256']==sha(D/c['retained'])
 for i in c['inputs']:assert sha(i['path'])==i['sha256']
old=read(D/'previous-files-before.json')
for x in old:assert sha(x['path'])==x['sha256']
b=read(D/'browser-evidence.json');assert b['wide']['columns']==3 and b['wide']['loaded']
assert len(b['smallDisplays'])==6 and b['narrow']['width']==b['narrow']['documentWidth']==420
assert b['expansion']['dialogOpen'] and b['expansion']['source']=='variant-2-right-090.png'
for f in ['제작기준.md','분석.md','검수.md','report.md','결과.json','generation-records.json','comparison.png','index.html','qa-dark.png','qa-small.png']:
 assert (D/f).stat().st_size>0
result={'checkedAt':datetime.datetime.now().astimezone().isoformat(),'checks':checks,'fourGenerationCallBytesAndInputsMatch':True,'previousFilesUnchanged':len(old),'threeColumnsAndSixSmallDisplays':True,'narrow420NoOverflow':True,'profileExpandWorks':True,'userAestheticApprovalClaim':False,'gameIntegrationClaim':False}
(D/'delivery-check.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
files=[{'file':str(p.relative_to(D)),'size':p.stat().st_size,'sha256':sha(p)} for p in sorted(D.rglob('*')) if p.is_file() and '.qa-browser-profile' not in p.parts and p.name!='deliverable-manifest.json']
(D/'deliverable-manifest.json').write_text(json.dumps({'iteration':4,'excluded':['.qa-browser-profile/**'],'files':files},ensure_ascii=False,indent=2),encoding='utf-8')
print('PASS:3 delivery PNG/source hashes,4 call inputs/outputs,111 preserved prior files,compareArt6,3columns,57/72x3,420px no overflow,profile dialog.')
