from pathlib import Path
import importlib.util,json,subprocess
H=Path(__file__).resolve().parent;R=Path('C:/Users/user/Desktop/Grid Defenders');receipt=H/'실제발송영수증.json'
if receipt.exists():raise SystemExit('Receipt exists; do not resend.')
c=json.loads((H/'연결.json').read_text(encoding='utf-8'));assert c['state']=='prepared_not_sent'
body=f'''main01 새승인 후속 {c['task']} / 차수1 / characters.
사용자: '합격 매우 만족 / 정면3/4우측면으로3장하고 SD작업 동시 진행 /2.6사용허가'. 개수 질문에 'SD3방향도 함께제작'으로 답했습니다. 기존 레나3/4 일반일러스트는 실제사용자합격으로 기록했습니다.
전체 전문지시·현재필독 자동첨부: {c['plan']['prompt']}
이번 새작업 read-pack 본문→문서별적용/현재SHA의 새ACK→start 후 생성. 단일메인운영규정 신규필독: main01 한곳만활성,메인02/03폐지,기존팀장유지. 이전레나ACK/호출허가 재사용금지.
승인된3/4일러스트 {c['preservedApprovedView']} 는 그바이트로세트에포함하고 새0/90만추가. SD0/35/90 3장은새제작. 총6칸/신규5장/2.6최초5POST(일러2+SD3)만,자동재시도·추가유료·내장·대체모델0. 기존승인image-studio연결읽기전용,키노출/설정변경없음.
일러스트와SD는 병행하고 일러스트다방향새합격을기다려SD를보류하지마세요. 현재합격레나가인물/의상/일러화풍마스터이며C4/C3로되돌려재스타일링하지않습니다. SD는같은레나외형과1번금발SD표본의결합비율을역할분리. 다른인물/폐기여전사/발로르참조금지. 여유있는검은코트와밀착이너·긴은발/유광부츠·레이피어와차가운여성인상유지.
같은자연양발입상/편안한한손레이피어의0정면/오른앞3/4약35/우측정90. 머리만회전/좌우반전대체/방향별새포즈금지. 기존손과장비의인체좌우·디자인/색·얼굴·재질유지. SD3/4 내부후보는사용자합격아니며다른SD방향연속성에만사용.
허용새output: {c['output']}
illustration/0·35·90 및 sd/0·35·90 원본6파일,위일러3/아래SD3 첫페이지비교·확대·명암·SD본체72CSSpx/표시3번. 원본바이트/출처·프롬프트·참조SHA·설정/호출·requestId·usage보존.
사용자최신요청대로 **자세·그림체만 실질검수 후 바로 실물반환**. 부족은기록하되세부장비/검축/알파여백정밀계측을새제출관문으로추가하지말고추가생성루프없음. 각트랙먼저끝나면status로실물먼저알려도되며전체는6칸으로반환. 생성/파일실패시실패를정직하게보고, 사용자최종합격은대기.
기존원본/타팀/공유규정/게임/리깅/애니메이션/프로필DB/사용자창·서버/Git변경없음. 공식새Task/Dispatch worker_done으로 main01 run_47ce1a81d7b1에 원작업/차수1/실물6·페이지/보고·검수/실제호출·usage·한계를회신하세요.'''
cmd=['C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe','orchestration','send','--to','dispatch:'+c['targetDispatch'],'--type','dispatch','--subject',c['task']+' 레나 합격 후 일러3+SD3 병행 /2.6 신규5장','--body',body,'--json']
cp=subprocess.run(cmd,capture_output=True,text=True,encoding='utf-8',errors='replace');receipt.write_text(cp.stdout+('\n'+cp.stderr if cp.stderr else ''),encoding='utf-8');print(cp.stdout,flush=True)
if cp.returncode:raise SystemExit(cp.returncode)
d=json.loads(cp.stdout)
if not d.get('ok'):raise SystemExit('Delivery unconfirmed; inspect official state before recovery.')
spec=importlib.util.spec_from_file_location('board',R/'작업관리/도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(R/'작업관리');b.record(c['task'],'main01','sent',receipt)
c.update(state='delivery_receipt_recorded',delivery=d['result']);(H/'연결.json').write_text(json.dumps(c,ensure_ascii=False,indent=2),encoding='utf-8')
with (H/'3_작업일지.md').open('a',encoding='utf-8') as f:f.write('\n실제characters 담당에두트랙공식후속발송/영수증연결. 현재새필독/착수와생성회신대기.\n')
print(json.dumps({'task':c['task'],'state':c['state'],'newImages':5,'comparisonImages':6},ensure_ascii=False))
