"""Expose review artifacts on the existing game origin, without navigating user UI."""
from pathlib import Path
from datetime import datetime
import hashlib,json,re,shutil
from urllib.request import urlopen
from urllib.parse import quote
ROOT=Path('C:/Users/user/Desktop/Grid Defenders');HERE=Path(__file__).resolve().parent
UI=Path('C:/Users/user/orca/workspaces/Grid Defenders/UI-전투화면')
MON=Path('C:/Users/user/orca/workspaces/Grid Defenders/몬스터-디자인/output/monsters/three_types_three_views_main01-20261109-7ae73f23')
CHAR=Path('C:/Users/user/orca/workspaces/Grid Defenders/캐릭터디자인2/output/characters/gc9_longsword_dagger/sd_remodel_4_main01-20261109-dbf50341/directions_v02')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def put(p,data):
 p.parent.mkdir(parents=True,exist_ok=True)
 if p.exists() and p.read_bytes()!=data:raise RuntimeError('Unexpected existing preview file: '+str(p))
 p.write_bytes(data)
style='body{margin:0;padding:20px;font:16px/1.6 system-ui;background:#142725;color:#f4eedc}a{color:#ffdc55}nav{display:flex;gap:12px;flex-wrap:wrap}nav a{padding:12px;border:1px solid #9c8e65;border-radius:6px}img{display:block;width:100%;height:auto;background:#eee}main{max-width:1800px;margin:auto}'
hub=f'''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>이미지 대조 자료</title><style>{style}</style><main><h1>이미지 대조 자료</h1><nav><a href="/battle-landscape.html?battle=normal&amp;from=camp">게임에서 배치 비교</a><a href="blond/index.html">금발 전사 15개 비교</a><a href="monsters/index.html">몬스터 9개 비교</a></nav><p>게임 개발자 도구의 이미지 대조에서 안과 방향을 고른 뒤 전장에 배치합니다. 배치한 대상을 선택하면 크기를 조절할 수 있습니다.</p></main></html>'''
gold=f'''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>금발 전사 15개 비교</title><style>{style}</style><main><nav><a href="../index.html">비교 자료 목록</a><a href="/battle-landscape.html?battle=normal&amp;from=camp">게임에서 배치 비교</a></nav><h1>금발 전사 · 원본＋4안 × 정면·45도·90도</h1><p>비교 이미지를 눌러 원본 크기로 볼 수 있습니다. 시안 선택과 최종 미적 합격은 대기 상태입니다.</p><a href="comparison.png"><img src="comparison.png" alt="금발 전사 원본과 신규4안의 정면·오른쪽45도·오른쪽90도15개 비교"></a></main></html>'''
monhtml=(MON/'index.html').read_text(encoding='utf-8').replace(' target="_blank"','')
monhtml=monhtml.replace('<h1>','<nav><a href="../index.html">비교 자료 목록</a> · <a href="/battle-landscape.html?battle=normal&amp;from=camp">게임 화면</a></nav><h1>',1)
files=[MON/p for p in ['comparison-light.png','comparison-dark.png','manifest.json','검수.md']]
files += [MON/k/f for k in ['green-warrior','blue-golem','undead-warrior'] for f in ['front_000.png','left_270.png','right_090.png']]
changes=[]
for workspace in [UI,ROOT]:
 base=workspace/'게임/public/dev-previews'
 put(base/'index.html',hub.encode('utf-8'));put(base/'blond/index.html',gold.encode('utf-8'))
 put(base/'blond/comparison.png',(CHAR/'comparison-directions.png').read_bytes())
 put(base/'monsters/index.html',monhtml.encode('utf-8'))
 for source in files:
  dest=base/'monsters'/source.relative_to(MON);put(dest,source.read_bytes());assert sha(dest)==sha(source)
  changes.append({'path':str(dest),'source':str(source),'sha256':sha(dest)})
checks=[]
for route in ['/dev-previews/index.html','/dev-previews/blond/index.html','/dev-previews/blond/comparison.png','/dev-previews/monsters/index.html',
 '/dev-previews/monsters/comparison-light.png','/battle-landscape.html?battle=normal&from=camp']:
 with urlopen('http://localhost:5173'+route,timeout=10) as response:
  body=response.read();assert response.status==200
  checks.append({'url':'http://localhost:5173'+route,'status':response.status,'bytes':len(body),'contentType':response.headers.get('Content-Type')})
for source in files:
 route='/dev-previews/monsters/'+quote(source.relative_to(MON).as_posix())
 with urlopen('http://localhost:5173'+route,timeout=10) as response:
  assert hashlib.sha256(response.read()).hexdigest()==sha(source),route
 for field in ['src','href']:
  for link in re.findall(field+r'="([^"]+)"',monhtml):
   if link.startswith(('/','http','#')):continue
   assert (ROOT/'게임/public/dev-previews/monsters'/link).is_file(),link
result={'at':datetime.now().astimezone().isoformat(),'status':'same_origin_links_verified','httpChecks':checks,'copiedFiles':changes,
 'monsterFilesByteVerified':len(files),'uiNavigated':False,'runtimeCodeChanged':False,
 'reason':'Avoid cross-workspace absolute local file links; serve review documents from the existing localhost:5173 game origin.'}
(HERE/'같은그룹연결결과.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'status':result['status'],'httpChecks':len(checks),'monsterFilesByteVerified':len(files),'entry':'http://localhost:5173/dev-previews/index.html'},ensure_ascii=False))
