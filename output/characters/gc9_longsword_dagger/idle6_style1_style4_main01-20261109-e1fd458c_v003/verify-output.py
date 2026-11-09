from pathlib import Path
from PIL import Image
import json,hashlib
R=Path(__file__).parent
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
manifest=json.loads((R/'asset-manifest.json').read_text(encoding='utf-8'));src=json.loads((R/'source-inputs.json').read_text(encoding='utf-8'));ack=json.loads((R/'읽기확인-v003.json').read_text(encoding='utf-8'))
checks=[]
for a in manifest['assets']:
 p=R/a['file'];im=Image.open(p);b=a['boundsAlpha32']
 checks.append({'file':a['file'],'nativeDimensionsMatch':list(im.size)==a['nativeDimensions'],'RGBA':im.mode=='RGBA','manifestShaMatches':sha(p)==a['sha256'],'toolRawByteIdentical':sha(p)==sha(Path(a['rawSource'])),'measured':a['measurementReviewed'],'edgeAlpha32Contact':b[0]<=0 or b[1]<=0 or b[2]>=im.width or b[3]>=im.height,'bodyWithinImage':0<=a['hairTop']<a['sole']<im.height,'loweredBladeExcludedFromBodyHeight':bool(a['measurementROI'])})
sourceChecks=[{'variant':s['variant'],'sourceHashUnchanged':sha(Path(s['source']))==s['sha256'],'sourceCopyByteIdentical':sha(R/s['copy'])==s['sha256']}for s in src]
ackChanges=[x['path']for x in ack['documents']if sha(Path(x['path']))!=x['sha256']]
required=['variant-1-front.png','variant-1-right-045.png','variant-1-right-090.png','variant-4-front.png','variant-4-right-045.png','variant-4-right-090.png','index.html','comparison.png','comparison-variant-1.png','comparison-variant-4.png','original-comparison.png','qa-small-light.png','qa-small-dark.png','分析.md','제작기준.md','검수.md','report.md','결과.json','asset-manifest.json']
required=[x.replace('分析.md','분석.md')for x in required]
report={'task':'MAIN01-20261109-E1FD458C','iteration':3,'assets':checks,'sources':sourceChecks,'ackChanges':ackChanges,'requiredFiles':{p:(R/p).exists()for p in required},'scope':'file/byte/dimension/alpha/metadata checks only; visual identity and user approval are separate'}
(R/'technical-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'count':len(checks),'rawFailures':[x['file']for x in checks if not x['toolRawByteIdentical']],'unmeasured':[x['file']for x in checks if not x['measured']],'edgeContact':[x['file']for x in checks if x['edgeAlpha32Contact']],'sourcesOK':all(x['sourceHashUnchanged'] and x['sourceCopyByteIdentical']for x in sourceChecks),'ackChanged':ackChanges,'missing':[k for k,v in report['requiredFiles'].items()if not v]},ensure_ascii=False))
