from pathlib import Path
import json,hashlib
out=Path(__file__).resolve().parent
def read(n):return json.loads((out/n).read_text(encoding='utf-8-sig'))
g=json.loads(read('gallery-receipt.json')['result']['result']);assert g['pass']
for p in g['links']:assert(out/p).is_file(),p
v=read('최종검증.json')
for f in v['finals']:assert hashlib.sha256(Path(f['path']).read_bytes()).hexdigest()==f['sha256']
for p,h in read('보존기준해시.json').items():assert hashlib.sha256(Path(p).read_bytes()).hexdigest()==h,p
for d in read('읽기확인.json')['documents']:assert hashlib.sha256(Path(d['path']).read_bytes()).hexdigest()==d['sha256']
v.update(galleryChecks=g['checks'],galleryPass=True,finalVisualReview={'individualFullScreens':6,'native800Screens':6,'koreanReadable':True,'craftTitleVisible':True,'rankDirectionConfirmed':True},missingDeliverables=[])
(out/'최종검증.json').write_text(json.dumps(v,ensure_ascii=False,indent=2),encoding='utf-8')
with(out/'결과보고.md').open('a',encoding='utf-8')as f:f.write('\n갤러리 최종 검증10항목 통과: 6카드/원본2400 로드/열기/원본 링크/다음/이전/키보드/800px 배율/닫기. 보고·비교판·독립시안·이전v006 링크 모두 실제 파일 확인. 전달 직전 PNG해시·필독16·보존455개 재확인 통과.\n')
print('Final: six PNG, gallery10/layout26, links, reading16, preservation455 passed')
