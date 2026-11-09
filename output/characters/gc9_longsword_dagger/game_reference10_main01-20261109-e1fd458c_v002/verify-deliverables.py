from pathlib import Path
from PIL import Image
import hashlib,json,re
R=Path(__file__).parent
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
manifest=json.loads((R/'asset-manifest.json').read_text(encoding='utf-8'))
checks=[]
for a in manifest['assets']:
 p=R/a['file'];rec=json.loads((p.parent/'generation-result.json').read_text(encoding='utf-8'))
 checks.append({'file':a['file'],'exists':p.exists(),'manifestShaMatches':sha(p)==a['sha256'],'rawToolBytesIdentical':sha(p)==sha(Path(rec['sourceRaw'])),'RGBA':Image.open(p).mode=='RGBA','nativeDimensionsMatch':list(Image.open(p).size)==[a['width'],a['height']],'alpha32TouchesEdge':a['boundsAlpha32'][0]<=0 or a['boundsAlpha32'][1]<=0 or a['boundsAlpha32'][2]>=a['width'] or a['boundsAlpha32'][3]>=a['height']})
sources=json.loads((R/'sources.json').read_text(encoding='utf-8'))['games']
sourceChecks=[{'game':s['game'],'referenceExists':(R/s['reference']).exists(),'hashMatches':sha(R/s['reference'])==s['referenceSha256'],'hasPage':bool(s['sourcePage']),'hasImageUrl':bool(s['sourceImageUrl'])}for s in sources]
ack=json.loads((R/'읽기확인-v002.json').read_text(encoding='utf-8-sig'))
ackChanges=[d['path']for d in ack['documents']if sha(Path(d['path']))!=d['sha256']]
required=['index.html','comparison-overview.png','comparison-1.png','comparison-2.png','qa-dark-overview.png','qa-unlabeled.png','qa-small-light.png','qa-small-dark.png','sources.json','분석.md','제작기준.md','검수.md','report.md','결과.json','asset-manifest.json']
report={'task':'MAIN01-20261109-E1FD458C','iteration':2,'generatedCount':len(checks),'expectedCount':10,'assets':checks,'sources':sourceChecks,'readingAcknowledgementChangedDocuments':ackChanges,'requiredFiles':{p:(R/p).is_file()for p in required},'automaticOnly':'file/hash/native/alpha/reference checks; no automatic score proves stylistic difference or aesthetic approval'}
(R/'technical-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'count':len(checks),'rawByteFailures':[x['file']for x in checks if not x['rawToolBytesIdentical']],'edgeContact':[x['file']for x in checks if x['alpha32TouchesEdge']],'changedReadings':ackChanges,'missing':[p for p,v in report['requiredFiles'].items()if not v]},ensure_ascii=False))
