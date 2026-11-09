from pathlib import Path
import os,json,hashlib,shutil,datetime
R=Path(__file__).parent; P=Path(os.environ['TEMP'])/'balor-v002-read-pack.json'; pack=json.loads(P.read_text(encoding='utf-8-sig'))
assert pack['iteration']==2
notes=[
'이번 선택1번 SD 및 반려폭수정을 우선한다. 일반ID6체형/GC9성인체형을 강제하지 않고 정면1장만 새로 그리며 게임/UI/공통규정/기존작품 보존.',
'차수2 새 필독 본문독해→문서별 적용ACK→start 후 생성한다. 이전ACK재사용없고 결과/검증/미확인을 구분.',
'실제 진행승인 범위인 좌우폭수정만 수행하고 원본/차수1 보존 및 실제5종기록 추가, AI제안 수치를 사용자확정치로 승격하지 않음.',
'담당main01의 같은 작업 차수2를 이어받고 중복편집자/다른메인원본 통합없이 회신. Sol/medium 기본과 이미지모델 별개, 앱설정조작없음.',
'팀장 본인이 직접 제작·검수. 외주계정전환/하위불필요, 생성성공과 사용자합격/실게임검증 분리.',
'캐릭터 원본/명세와 이번보고만 편집. 게임/UI/타팀/main03 원본을 수정하지 않음.',
'승인발로르IDENTITY/선택1STYLE와 차수1미적반려를 구분. 새작품 기준으로 폭수정 재발방지 기록, 공통규정 미확정.',
'read-pack 27본문을 읽어 새ACK/start 통과하고 현재필독해시를 반환전 대조. 반환등록/사용자판정은main01이 실제회신 근거로 수행.',
'characters 팀장/세계관 도메인 소속과main01 담당 확인, 역할명으로 다른 작업자/타팀을 복제하지 않음.',
'세계관/캐릭터 분류만 유지. 신규소속/정치/스탯·직업을 이번 이미지수정으로 추가하지 않음.',
'characters 노드의 기존소스/실제작업공간 확인. 몬스터/일러스트 다른팀의 기준을 같은것으로 합치지 않음.',
'차수1 진행승인은 최초정면 범위의 이력이며 이번 반려/차수2 진행승인은 별도 새근거로 적용.',
'원본/4번예비/선택1번 구분, 타main03SD반려본을 화풍마스터로 쓰지 않음.',
'손잡이 변경은 정체성오류. 파란감긴그립/폼멜/날개가드/붉은보석/문장/핀을 일대일확인.',
'11개 원본/예비/선택모델과 별도보존사본의 SHA 대조, 이동/삭제/덮어쓰기 없음.',
'차수2 사용자 실제 진행이 있으므로 승인된내부생성·보완마다 재질문하지 않음. 새방향/게임범위는 제외.',
'산출물·최소근거만 로컬작성. 별도저장요청없으므로 커밋/푸시/예약백업/업로드없음.',
'승인발로르v02 SHA061f23cc…와 일단합격을 인물/장비원본 권위로 사용. 차수1SD를 합격으로 해석하지 않음.',
'팔→손목→손·엄지/손가락감김과 폼멜/그립/가드/날 축 유지. 원본자세와인체좌우, 그립참조의검디자인복제금지.',
'선택1정면의 각진매트셀/큰얼굴압축SD만 STYLE로 적용. 이전6장/후보/바이트 유지.',
'작은표시/저알파/미세장비차이와 가림을 실제 검수하고 생성성공을 미적합격으로 대신하지 않음.',
'최신 사용자 너무옆으로퍼짐 불합격 및 진행을 차수2 정면1장 수정권한으로 적용. 게임/측면/공통변경없음.',
'반려본은 폭문제 설명용. 승인원화+선택1주참조로 재작화, 등비등록 비교와 부위폭근거 제출.',
'어깨/흉곽/허리·팔벌림/방패겹침/망토/발벌림을 개별 조정. 가로압축·세로늘림·얼굴축소금지, 큰방패길이 유지.',
'사용자 반려 원문을 보존. 이 문서의 당시 수정대기는 최신 차수2 진행승인으로 갱신된 이력임을 구분.',
'차수1 제작보고는 과거이력이고 최신 미적불합격을 우선. 당시 검·문장/바이트검수와 폭문제는 별개.',
'차수1의 장비/알파/가림 관찰은 다시 대조하되 통과를 승계하지 않음. 방패몸비중·얼굴비중을 폭축소와 함께 관찰.'
]
assert len(notes)==len(pack['documents'])
ack=dict(task=pack['task'],iteration=2,role='characters',workSummary='사용자 좌우폭 반려/진행승인에 따라 승인발로르IDENTITY와선택1STYLE을 주참조로 정면입상1장을 새작화한다. 반려본은폭문제대조용이며 어깨/몸통/팔·방패겹침/망토/발배치를 정돈하고 얼굴크기·장비고유형태는 유지한다. 새PNG바이트보존,동일높이비교·부위폭/머리비중·장비확대·밝음어두움·57/72CSSpx실제검수,이전자료/게임/UI/공통기준/자동Git변경없음.',documents=[dict(path=d['path'],sha256=d['sha256'],applies=n) for d,n in zip(pack['documents'],notes)])
R.mkdir(parents=True,exist_ok=True);shutil.copyfile(P,R/'read-pack-v002.json')
(R/'읽기확인-v002.json').write_text(json.dumps(ack,ensure_ascii=False,indent=2),encoding='utf-8')
(R/'2_사전확인.md').write_text('# characters 차수2 사전확인\n\n'+datetime.datetime.now().astimezone().isoformat()+'\n\n27필독본문과작업연결/작업대장/자기브랜치·main01/분야색인을 읽었다. 최신 진행은 폭수정 정면1장. 원본발로르/선택1두이미지/반려차수1/그립원본 실제열람. 전체압축/늘림/얼굴축소 대신 부위와장비배치를 새로 그린다. 새ACK/start 전 생성안함. 내장host_image/nativenalpha 경로, 유료API전환/패딩/리샘플링/알파정리없음. 새output과차수2기록만작성, 차수1/공통규정/카탈로그/게임/UI/타팀/창보존.\n',encoding='utf-8')
old=R.with_name('style1_front_main01-20261110-d820f076_v001')
baseline=[dict(path=str(p),sha256=hashlib.sha256(p.read_bytes()).hexdigest()) for p in old.rglob('*') if p.is_file() and '.qa-browser-profile' not in p.parts]
(R/'prior-iteration-baseline.json').write_text(json.dumps(baseline,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(dict(documents=len(notes),priorFiles=len(baseline),ack=str(R/'읽기확인-v002.json')),ensure_ascii=True))
