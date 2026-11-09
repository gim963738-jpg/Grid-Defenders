from pathlib import Path
import json,requests,concurrent.futures
R=Path(__file__).parent
src=json.loads((R/'sources.json').read_text(encoding='utf-8'))['games']
def check(s):
 out={'id':s['id']}
 for k in ['sourcePage','sourceImageUrl']:
  try:
   response=requests.get(s[k],timeout=40,stream=True,headers={'User-Agent':'Mozilla/5.0'})
   out[k]={'url':s[k],'status':response.status_code,'finalUrl':response.url,'contentType':response.headers.get('content-type'),'method':'GET headers then close; actual images/frames separately downloaded and viewed'};response.close()
  except Exception as e:out[k]={'url':s[k],'error':str(e)}
 return out
with concurrent.futures.ThreadPoolExecutor(max_workers=5)as pool:results=list(pool.map(check,src))
(R/'source-link-verification.json').write_text(json.dumps({'checkedDate':'2026-11-09','sources':results},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps([{'id':x['id'],'page':x['sourcePage'].get('status',x['sourcePage'].get('error')),'media':x['sourceImageUrl'].get('status',x['sourceImageUrl'].get('error'))}for x in results],ensure_ascii=False))
