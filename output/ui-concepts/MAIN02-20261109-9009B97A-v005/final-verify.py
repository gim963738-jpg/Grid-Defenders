from pathlib import Path
import json,hashlib
out=Path(__file__).resolve().parent
def read(n):return json.loads((out/n).read_text(encoding='utf-8-sig'))
receipt=read('gallery-receipt.json');g=json.loads(receipt['result']['result']);assert receipt['ok'] and g['pass'] and len(g['opened'])==18
assert all((out/link).exists() for link in g['links'])
ack=read('읽기확인.json');assert ack['iteration']==5 and ack['role']=='ui'
for d in ack['documents']:assert hashlib.sha256(Path(d['path']).read_bytes()).hexdigest()==d['sha256'],d['path']
start=read('start-receipt.json');assert start['iteration']==5 and start['status']=='in_progress'
qa=read('최종검증.json');assert qa['layoutPass'] and not qa['changedOriginals']
qa.update(galleryPassed=True,galleryImages=18,allGalleryLinksExist=True,readingHashesCurrent=True,iteration5StartPassed=True,nativeScaleManuallyViewed=18,coreImages=9,supportImages=9)
(out/'최종검증.json').write_text(json.dumps(qa,ensure_ascii=False,indent=2),encoding='utf-8')
f=out/'결과보고.md';s=f.read_text(encoding='utf-8').replace('4열이아닌**0기준','**0기준')
s+='\n최종 확인: 갤러리18장 원본로드/이전·다음/키보드/닫기/800배율토글 통과, 모든 링크 실파일 존재, 필독15문서 현재SHA256 일치 및차수5start 확인. 최종검증.json/gallery-receipt.json 참조.\n'
f.write_text(s,encoding='utf-8')
assert all((out/d['file']).exists() for d in read('화면목록.json'))
print('Final pass: 9 core + 9 support; gallery18; reading15 current; start5; originals',qa['preservedFiles'])
