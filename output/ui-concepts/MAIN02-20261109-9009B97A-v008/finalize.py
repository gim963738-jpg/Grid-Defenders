from pathlib import Path
import json,hashlib
out=Path(__file__).resolve().parent
read=lambda n:json.loads((out/n).read_text(encoding='utf-8-sig'))
g=json.loads(read('gallery-receipt.json')['result']['result']);assert g['pass']
for p in g['links']:assert(out/p).is_file(),p
v=read('최종검증.json');assert len(v['finals'])==7 and len(v['layoutChecks'])==39 and all(v['layoutChecks'].values())
for f in v['finals']:assert hashlib.sha256(Path(f['path']).read_bytes()).hexdigest()==f['sha256']
for p,h in read('보존기준해시.json').items():assert hashlib.sha256(Path(p).read_bytes()).hexdigest()==h,p
for d in read('읽기확인.json')['documents']:assert hashlib.sha256(Path(d['path']).read_bytes()).hexdigest()==d['sha256']
start=read('start-receipt.json');assert start['iteration']==8 and start['status']=='in_progress'
v.update(galleryPass=True,galleryChecks=g['checks'],linksExist=True,missingDeliverables=[])
(out/'최종검증.json').write_text(json.dumps(v,ensure_ascii=False,indent=2),encoding='utf-8')
with(out/'결과보고.md').open('a',encoding='utf-8')as f:f.write('\n최종 갤러리10항목 통과(7카드/원본2400로드/열기/원본링크/다음/이전/키보드/800배율/닫기), 보고·비교판·시안·차수7 비교 링크 실제 존재 확인. 전달 직전 PNG7해시·필독17·기존503개 재검증 통과.\n')
print('Final: PNG7 / layout39 / gallery10 / preservation503 / reading17 PASS')
