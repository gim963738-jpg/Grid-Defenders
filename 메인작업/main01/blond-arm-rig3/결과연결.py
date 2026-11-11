from pathlib import Path
import hashlib, json, shutil, urllib.request

ROOT = Path('C:/Users/user/Desktop/Grid Defenders')
HERE = Path(__file__).resolve().parent
link = json.loads((HERE/'연결.json').read_text(encoding='utf-8'))
src = Path(link['output'])
dest = ROOT/'게임/public/dev-previews/blond-arm-rig3-a-v001'
receipt = HERE/'결과연결.json'
if receipt.exists():
    raise SystemExit('Already delivered; inspect receipt before repeating.')
selected = {p.name for p in src.iterdir() if p.is_file() and p.suffix in {'.png', '.webm'}}
selected.discard('recorder-background-throttled.webm')
selected.update(['index.html', 'renderer.js', 'rig.json', 'animations.json', 'parts-manifest.json',
                 'A-frozen-contract.json', 'report.md', '검수.md', '리깅설계.md', '연구분석.md'])
selected.update(p.relative_to(src).as_posix() for p in (src/'parts').rglob('*') if p.is_file())
rows=[]
for name in sorted(selected):
    p=(src/name).resolve()
    assert p.is_relative_to(src.resolve()) and p.is_file(), name
    d=dest/name
    d.parent.mkdir(parents=True, exist_ok=True)
    if d.exists() and d.read_bytes()!=p.read_bytes():
        raise SystemExit('Different existing delivery file: '+str(d))
    if not d.exists():
        shutil.copy2(p,d)
    content=d.read_bytes()
    digest=hashlib.sha256(content).hexdigest()
    assert digest==hashlib.sha256(p.read_bytes()).hexdigest()
    rows.append({'path':name, 'sha256':digest, 'bytes':len(content)})
for row in rows:
    name=row['path']
    url='http://127.0.0.1:5173/dev-previews/blond-arm-rig3-a-v001/'+urllib.parse.quote(name)
    with urllib.request.urlopen(url, timeout=15) as response:
        assert response.status==200 and hashlib.sha256(response.read()).hexdigest()==row['sha256'], name
    row['http']=200
data={'task':link['task'], 'state':'delivered_for_review_not_accepted', 'source':str(src),
      'gallery':'http://localhost:5173/dev-previews/blond-arm-rig3-a-v001/index.html',
      'files':rows, 'userScreenChanged':False, 'gameRuntimeChanged':False,
      'committed':False, 'pushed':False,
      'mainReviewed':['source-reassembled-comparison.png','parts-board.png','motion-contact.png','검수.md'],
      'mainObservation':'원본/재조립의 주요 디자인 유지 및 서로 다른 팔 궤적 확인. 파츠 외곽의 거친 잔여 픽셀과 큰 회전의 천 겹침/경계가 남음. 몸통/왼팔/다리 정지인 부위 시험이며 최종 공격 모션 합격이 아님.'}
receipt.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'gallery':data['gallery'],'httpByteVerified':len(rows),'runtimeChanged':False},ensure_ascii=False))
