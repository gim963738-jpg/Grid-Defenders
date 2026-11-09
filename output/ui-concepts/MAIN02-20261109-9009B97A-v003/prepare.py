import pathlib,json,hashlib
out=pathlib.Path(__file__).resolve().parent;root=out.parents[2]
p=json.loads((out/'read-pack.json').read_text(encoding='utf-8-sig'))
notes=['UI 담당 범위와 공통 모바일 글자·터치를 유지하며 신규 output만 편집한다.','차수3 필독을 다시 읽고 적용기록과 start를 통과한 뒤 직접 제작한다.','이미 확인된 D3정보판 조정과4개 펼침 요청을 수행하고 원본과5종기록을 보존한다.','main02의 현재 차수와 발송 근거를 연결하고 추가 사용자 허락을 요구하지 않는다.','팀장 직접 제작으로 수행하며 사용자 미적 합격과 기술검증을 구분한다.','게임src와 공통CSS 및 main01 devImageCompare 관련파일은 읽기전용·작업제외다.','800×360·본문14/보조12·터치48을 유지하며 실제 PNG로 검수한다.','현재 read-pack 모든문서의 path/sha256/applies와 새차수3 start를 기록한다.','ui 책임으로 작업하고 다른팀의 제작파일을 소유하거나 변경하지 않는다.','도메인 자료분류와 조직 배치를 구분하고 기존 원본 경로를 보존한다.','UI 분야 위치와 원본 참조를 유지하며 캐릭터·아이템 규칙을 새로 확정하지 않는다.','사용자 D3선택을 반영하고 상단4판만 더 투명하게 조정해 병사·영웅·상점·진형4장 제작한다.','본문14/보조12·최소48터치를 적용하고42칸 진형은 축소 대신 충분한 면적을 확보한다.','D3스킨과 설산배경을 읽기전용으로 재사용하고 차수2 결과를 보존한다.','기존16장의 펼침구조와 기능 근거를 확인하되 A가 사용자 선택이라고 주장하지 않는다.','제작파일과 최소근거만 작성하고 Git commit/push/자동백업은 실행하지 않는다.']
assert p['iteration']==3 and len(p['documents'])==len(notes)
e={k:p[k] for k in ['task','iteration','role']};e['workSummary']='D3설산 상단4판 배경알파만 완화하고 기존기능근거로 병사/영웅/상점/보스진형 펼침PNG4장과 비교·갤러리 제작.';e['documents']=[dict(path=d['path'],sha256=d['sha256'],applies=notes[i]) for i,d in enumerate(p['documents'])]
(out/'읽기확인.json').write_text(json.dumps(e,ensure_ascii=False,indent=2),encoding='utf-8')
baseline={}
for base in [root/'게임/src',*out.parent.glob('MAIN02-*')]:
 if base==out:continue
 for f in base.rglob('*'):
  if f.is_file() and 'edge-profile' not in str(f):baseline[str(f)]=hashlib.sha256(f.read_bytes()).hexdigest()
(out/'보존기준해시.json').write_text(json.dumps(baseline,ensure_ascii=False,indent=2),encoding='utf-8')
(out/'2_사전확인.md').write_text('# 차수3 사전확인\nD3선택/상단 배경 조금 더 비침/4개 펼침은 이미 사용자 요청 범위다. 신규 v003 output만 편집하며 기존 배경과 게임 기능 정의를 읽기전용으로 사용한다. main01 devImageCompare 코드·자산과 이전결과 및공통CSS는 제외한다. 새밸런스나 웨이브진형 변경 없이 정적4장/기본참고/상단전후/비교판/갤러리/보고를 제작한다. 본문14·보조12·48px터치 및 상품5/진형42칸을 직접검증하고 사용자 미적합격과 구분한다.\n',encoding='utf-8')
print('current iteration',p['iteration'],'documents',len(notes),'baseline',len(baseline))
