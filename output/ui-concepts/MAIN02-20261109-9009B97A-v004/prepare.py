import pathlib,json,hashlib
out=pathlib.Path(__file__).resolve().parent;root=out.parents[2]
p=json.loads((out/'read-pack.json').read_text(encoding='utf-8-sig'))
notes=['UI전용 신규output만 편집하고 공통모바일크기와 기존원본을 보존한다.','차수4본문을 다시 읽고 path/sha256/applies 적용기록 후 start 통과한다.','확인된 7상태 시안과5종기록을 제작하며 합격·통합·커밋을 구분한다.','main02 현재지시와 사용자 그렇게 진행해봐 확인을 연결한다.','직접 제작하며 사용자 미적합격과 자체검증을 구분한다.','게임src/공통CSS/타팀아이템원본과 devImageCompare를 읽기전용으로 보존한다.','800×360·본문14/보조12·최소48터치 및 실제PNG읽힘을 검수한다.','차수4 read-pack 전체에 적용내용을 적고 sent연결/start를 통과한다.','ui책임범위로 직접 수행하고 추가 제작담당을 복제하지 않는다.','도메인분류와 조직배치를 구분하고 기존원본경로를 유지한다.','아이템/캐릭터 원자료를 참조하되 밸런스나 새정식콘텐츠를 확정하지 않는다.','5선택칸·8영웅탐색·스킬동시정보·통합상점3방향이동·아이템배율비교 및 가방/진형메뉴제거를 적용한다.','48px인벤칸을 확보하고 화면전체를 임의축소하지 않으며 최신시안요청을 우선한다.','D3상단알파.74와읽힘은 유지하고 이전3칸/분리상점 구조는 이번피드백에 맞춰 새로 제안한다.','제작파일과 최소근거만 작성하며 Git커밋/푸시/예약백업을 실행하지 않는다.']
assert p['iteration']==4 and len(notes)==len(p['documents'])
e={k:p[k] for k in ['task','iteration','role']};e['workSummary']='D3선택5칸/영웅8명탐색·능력치스킬동시·통합상점과3방향이동·다음보스정보 7상태와 아이템실배율비교를 정적PNG로 제작.';e['documents']=[dict(path=d['path'],sha256=d['sha256'],applies=notes[i]) for i,d in enumerate(p['documents'])]
(out/'읽기확인.json').write_text(json.dumps(e,ensure_ascii=False,indent=2),encoding='utf-8')
baseline={}
for base in [root/'게임/src',*out.parent.glob('MAIN02-*')]:
 if base==out:continue
 for f in base.rglob('*'):
  if f.is_file() and 'edge-profile' not in str(f):baseline[str(f)]=hashlib.sha256(f.read_bytes()).hexdigest()
(out/'보존기준해시.json').write_text(json.dumps(baseline,ensure_ascii=False,indent=2),encoding='utf-8')
(out/'2_사전확인.md').write_text('# 차수4 사전확인\n사용자 그렇게 진행해봐 확인 범위로 신규v004 output에7상태PNG와통합상점확대/크기비교/갤러리/보고 제작. 이전산출·게임src·공통CSS·규정·타팀원본·devImageCompare읽기전용. 병사5칸중미정2칸은준비중,영웅8명탐색은출전3명제한과구분. 통합상점은48px창고/인벤칸을우선하며새직접구매경로는정적UI제안임을보고. 실제아이템원본/점유/배율을확인하고7장직접검수. 커밋푸시통합없음.\n',encoding='utf-8')
print('iteration',p['iteration'],'documents',len(notes),'baseline',len(baseline))
