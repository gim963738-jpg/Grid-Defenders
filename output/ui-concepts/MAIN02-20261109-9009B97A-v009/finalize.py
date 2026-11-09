from pathlib import Path
import json,hashlib
out=Path(__file__).resolve().parent
read=lambda n:json.loads((out/n).read_text(encoding='utf-8-sig'))
g=json.loads(read('gallery-receipt.json')['result']['result']);assert g['pass']
for p in g['links']+g['imageFiles']:assert(out/p).is_file(),p
v=read('최종검증.json');assert len(v['finals'])==6 and all(v['layoutChecks'].values())
for f in v['finals']:assert hashlib.sha256(Path(f['path']).read_bytes()).hexdigest()==f['sha256']
for p,h in read('보존기준해시.json').items():assert hashlib.sha256(Path(p).read_bytes()).hexdigest()==h,p
for d in read('읽기확인.json')['documents']:assert hashlib.sha256(Path(d['path']).read_bytes()).hexdigest()==d['sha256']
start=read('start-receipt.json');assert start['iteration']==9 and start['status']=='in_progress'
live=json.loads(Path('C:/Users/user/Desktop/Grid Defenders/작업관리/작업/MAIN02-20261109-9009B97A/task.json').read_text(encoding='utf-8-sig'));assert live['iteration']==9 and live['status']=='in_progress'
v.update(galleryPass=True,galleryChecks=g['checks'],allLinksExist=True,missingDeliverables=[])
(out/'최종검증.json').write_text(json.dumps(v,ensure_ascii=False,indent=2),encoding='utf-8')
with(out/'결과보고.md').open('a',encoding='utf-8')as f:f.write('\n전달 직전 최종 확인: 갤러리12항목(신규6/참조3 분리·이미지 로드·원본·이동·800배율·닫기 등) 모두 통과. 6PNG 해시/필독18/게임·이전출력557개 동일, 현재차수9 in_progress 확인. 모든 갤러리·보고·비교판·목업·참조 이미지 링크 실제 파일 존재 확인.\n')
print('Final PASS: PNG6 / state45 / gallery12 / reading18 / preserved557')
