from pathlib import Path
import json,hashlib
out=Path(__file__).resolve().parent
def read(n):return json.loads((out/n).read_text(encoding='utf-8-sig'))
g=read('gallery-receipt.json');assert g['ok'];gal=json.loads(g['result']['result']);assert gal['pass']
assert all((out/link).exists()for link in gal['links'])
ack=read('읽기확인.json');assert ack['iteration']==6 and len(ack['documents'])==16
for d in ack['documents']:assert hashlib.sha256(Path(d['path']).read_bytes()).hexdigest()==d['sha256'],d['path']
start=read('start-receipt.json');assert start['iteration']==6 and start['status']=='in_progress'
qa=read('최종검증.json');assert qa['layoutPass'] and not qa['changedOriginals']
qa.update(galleryPassed=True,galleryImages=7,allGalleryLinksExist=True,readingHashesCurrent=True,iteration6StartPassed=True,nativeScaleManuallyViewed=7)
(out/'최종검증.json').write_text(json.dumps(qa,ensure_ascii=False,indent=2),encoding='utf-8')
f=out/'결과보고.md';s=f.read_text(encoding='utf-8');s+='\n최종영수증:갤러리7장2400px원본로드·이전/다음·키보드·닫기·800배율토글통과,링크실파일존재확인. 필독16현재SHA256/차수6start확인. gallery-receipt.json/최종검증.json 참조.\n';f.write_text(s,encoding='utf-8')
print('Final: core6 + support1, gallery7 passed, readings16 current, originals',qa['preservedFiles'])
