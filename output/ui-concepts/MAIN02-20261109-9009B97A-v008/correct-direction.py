from pathlib import Path
from PIL import Image
import hashlib,json
out=Path(__file__).resolve().parent
read=lambda n:json.loads((out/n).read_text(encoding='utf-8-sig'))
write=lambda n,d:(out/n).write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf-8')
v=read('최종검증.json');layout=read('button-map.json');assert layout['pass']
details=json.loads(read('방향보완검증-receipt.json')['result']['result'])
assert details['text']=='← 적 진입' and details['writingMode']=='horizontal-tb'
assert abs(details['x']-306)<.1 and abs(details['y']-334)<.1
assert details['boardCells']==25 and details['actors']==6 and details['rightCandidates']==5
preserved=[];before=None;after=None
for f in v['finals']:
 p=Path(f['path']);h=hashlib.sha256(p.read_bytes()).hexdigest()
 if p.name=='06-deployment-5x5.png':before=f['sha256'];after=h;f['sha256']=h
 else:assert h==f['sha256'],p;preserved.append(dict(path=str(p),sha256=h))
for p,h in read('보존기준해시.json').items():assert hashlib.sha256(Path(p).read_bytes()).hexdigest()==h,p
for d in read('읽기확인.json')['documents']:assert hashlib.sha256(Path(d['path']).read_bytes()).hexdigest()==d['sha256']
# Replace only the sixth screenshot region; all other contact-sheet pixels stay intact.
sheet=Image.open(out/'전체7-비교판.png');sheet.paste(Image.open(out/'qa-800/06-deployment-5x5.png'),(1600,424));sheet.save(out/'전체7-비교판.png')
evidence=dict(task='MAIN02-20261109-9009B97A',iteration=8,correction='06 적진입 세로쓰기→가로 ← 적 진입',sourceReview='C:/Users/user/Desktop/Grid Defenders/작업관리/작업/MAIN02-20261109-9009B97A/메인02검수-v008-보완요청.json',direction=details,before06=before,after06=after,otherSixUnchanged=preserved,layout39Passed=True,readings17Current=True,originals503Unchanged=True,visualReviewed800=True,galleryHtmlUnchanged=True,userAccepted=False,gameIntegrated=False)
write('방향보완검증.json',evidence);v['directionCorrection']=evidence;v['layoutChecks']=layout['checks'];write('최종검증.json',v)
with(out/'결과보고.md').open('a',encoding='utf-8')as f:f.write('''

## 차수8 메인 검수 보완 — 적 진입 방향
1. 🟢 완료 — 06 적 진입 표시 검수 수정 (이번 보완)
2. 사용자 평가 대기 — 차수8 시안

메인02검수-v008-보완요청.json에 따라 세로쓰기에서 화살표가 위쪽으로 보이는 오류를 고쳤다. 06의 표시는 가로쓰기 `← 적 진입`이며 전장 우하단 x306/y334/86×22에 두었다. 판 하단과6px, 오른쪽 조작부와8px 간격을 확보했다. 800×360 최종 이미지를 직접 열어 왼쪽 화살표와 한글을 확인했다. 5×5/셀68×48/기존6유닛/전중후열3색/오른쪽5후보·조작은 유지했다.

수정 파일은 revision.css의 06 표시 규칙, 06-deployment-5x5.png, qa-800의06, 전체7-비교판.png의06영역, 관련 보고·검증이다. 다른6PNG는 기존 최종검증의 해시와 동일하다. 갤러리 HTML/링크는 그대로 최신06 파일을 표시하므로 변경하지 않았다. 현재 iteration8 ACK/start와 필독17개 해시, 기존503개 보존해시를 재확인했고 레이아웃39항목을 재검증했다. 상세 좌표와 전후06/다른6장 해시는 방향보완검증.json에 있다. 게임·이전원본·타메인 파일 변경 없음.

기존 승인 범위 안의 검수 보완을 완료했으며 main02에 재검수 결과를 회신합니다. 사용자 합격이나 게임 반영은 아직 아닙니다.
''')
print('06 corrected; other six PNG unchanged; readings17 and originals503 current')
