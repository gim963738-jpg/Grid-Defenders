import json, pathlib, hashlib
out=pathlib.Path(__file__).resolve().parent
root=out.parents[2]
pack=json.loads((out/'read-pack.json').read_text(encoding='utf-8-sig'))
applies=[
'UI 제작 역할과 모바일 공통 규격을 적용하고 이전 원본과 게임 파일은 읽기 전용으로 보존한다.',
'현재 차수2의 필독 본문과 적용 기록을 작성하고 start 통과 후 직접 제작한다.',
'최신 사용자 진행해봐 확인 범위 안에서만 새 배경3종과 공통버튼3종의 매트릭스를 제작한다.',
'main02의 확인된 지시를 수행하며 사용자 최종 합격과 자체 검증을 구분한다.',
'UI 팀장으로 직접 수행하며 다른 제작팀의 파일과 진행 중 원본을 보존한다.',
'output 신규 차수 폴더만 편집하고 게임src 및 공통CSS 담당 경계를 침범하지 않는다.',
'14px 본문/12px 보조/48px 터치와 화면별 판독성 및 패널 겹침을 직접 확인한다.',
'read-pack과 읽기확인 JSON을 연결해 현재 차수2 start 절차를 수행한다.',
'ui 팀 책임 범위에서 직접 제작하며 이번에는 하위 담당을 생성하지 않는다.',
'도메인 분류 자료와 조직 작업 배치를 구분하고 다른 분야 원본을 보존한다.',
'UI 작업 결과는 신규 output에 두고 세계관 원본과 다른 도메인 자료를 수정하지 않는다.',
'기존 장면 고정 대신 회화 질감과 소품 방식을 계승하고 새3테마×동일한 D1/D2/D3로 비교한다.',
'800×360 가로 시안을 3배 렌더링하며 48px 터치와 12/14/20px 글자를 적용한다.',
'차수1 결과의 선호5장을 직접 관찰하되 장면을 복제하지 않고 이전9장과 모든 소스를 보존한다.'
]
evidence={k:pack[k] for k in ('task','iteration','role')}
evidence['workSummary']='차수2: 설산성채/사막유적/해안항구 새 배경3종과 범용 버튼 D1/D2/D3의9장, 비교판과 갤러리를 신규 v002 output에 제작.'
evidence['documents']=[dict(path=d['path'],sha256=d['sha256'],applies=applies[i]) for i,d in enumerate(pack['documents'])]
(out/'읽기확인.json').write_text(json.dumps(evidence,ensure_ascii=False,indent=2),encoding='utf-8')
baseline={}
for base in [root/'게임/src',out.parent/'MAIN02-20261109-063FC22B',out.parent/'MAIN02-20261109-9009B97A']:
 for p in base.rglob('*'):
  if p.is_file() and 'edge-profile' not in str(p):baseline[str(p)]=hashlib.sha256(p.read_bytes()).hexdigest()
(out/'보존기준해시.json').write_text(json.dumps(baseline,ensure_ascii=False,indent=2),encoding='utf-8')
print('evidence iteration',pack['iteration'],'documents',len(evidence['documents']),'baseline',len(baseline))
