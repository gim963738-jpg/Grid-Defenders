from pathlib import Path
import importlib.util,json,subprocess
H=Path(__file__).resolve().parent;R=Path('C:/Users/user/Desktop/Grid Defenders');receipt=H/'실제발송영수증.json'
if receipt.exists():raise SystemExit('Receipt exists; do not resend.')
c=json.loads((H/'연결.json').read_text(encoding='utf-8'));assert c['state']=='prepared_not_sent'
body=f'''main01 신규 사용자 승인 {c['task']} / 차수1 / characters.
레나의 상세설정과 '2.6사용해서 자세와 그림체만 검수하고 바로 넘겨줘' 요청을 받았고, SD/일러스트 형식 확인에 사용자가 '일러스트 진행'이라고 확정했습니다.
필독자동첨부 포함 전체전문지시 본문: {c['plan']['prompt']}
현재 새작업 read-pack 전체본문→문서별실제적용요약·SHA의 새ACK→start 후 생성. 발로르ACK/원본/호출허가 재사용금지.
레나 일반전신 일러스트1장: 긴 연보라기운 은발·차갑고무덤덤한여성·창백피부·은회보라눈·검은오버핏롱코트와밀착이너/짧은팬츠 대비·검은장갑·유광싸이하이부츠·검은곡선/금장가드의길고얇은은레이피어·목다이아/검은귀걸이·주황보석이중벨트/푸른테슬. 영웅/전사/인간형여성/무소속·발트레인출신, 나이숫자등미정.
일반일러스트 기본 오른쪽앞사선 자연입상. GC9 현행 여성 전체작화·얼굴C4/보조C3를 실제열고 style-only로 API참조첨부, 얼굴/갑옷/활/SD를복제하지 않습니다. 자연스러운 한손레이피어와 양발지지, 긴다리·늘씬한비율 유지. 공통중세갑주보다 사용자 모던테크웨어/어반판타지 설정 우선.
2.6 기존승인image-studio 연결로 최초1POST만, high/transparent/1024×1536우선. 자동재시도/추가유료보완/내장대체/모델폴백0, 키/계정출력·설정변경금지.
**자세와 그림체만 실제열람검수하고 실물부터 바로 반환하세요.** 세부장비/검축/문양/알파/여백계측/72CSS/실게임 검사로 추가관문을만들거나 결과를보류하지마세요. 미비는 의견으로 함께적되 추가생성없이반환. 생성+두항목관찰+원본기록제출이 과업반환 기준이며 사용자합격이아닙니다. 도구/파일실패만 failed로, 자세/화풍미달은 실물과 정직한관찰을즉시제출.
허용새output: {c['output']}
원본고해상도PNG/간단index/보고·두항목검수·생성기록·작업기록, 원본바이트/SHA·프롬프트·참조/설정·requestId/실제횟수/usage보존. 기존발로르/타팀/카탈로그/프로필/공유규정/게임/SD/리깅/사용자창/포트/Git변경없음. 공식새Task/Dispatch worker_done으로 원작업차수1/원본·페이지·보고·검수경로/호출·usage·한계를 main01 run_47ce1a81d7b1에 반환하세요.'''
cmd=['C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe','orchestration','send','--to','dispatch:'+c['targetDispatch'],'--type','dispatch','--subject',c['task']+' 레나2.6 일반일러스트1장: 자세/그림체만 검수 후 즉시제출','--body',body,'--json']
cp=subprocess.run(cmd,capture_output=True,text=True,encoding='utf-8',errors='replace');receipt.write_text(cp.stdout+('\n'+cp.stderr if cp.stderr else ''),encoding='utf-8');print(cp.stdout,flush=True)
if cp.returncode:raise SystemExit(cp.returncode)
d=json.loads(cp.stdout)
if not d.get('ok'):raise SystemExit('Delivery unconfirmed; inspect before recovery.')
spec=importlib.util.spec_from_file_location('board',R/'작업관리/도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(R/'작업관리');b.record(c['task'],'main01','sent',receipt)
c.update(state='delivery_receipt_recorded',delivery=d['result']);(H/'연결.json').write_text(json.dumps(c,ensure_ascii=False,indent=2),encoding='utf-8')
with (H/'3_작업일지.md').open('a',encoding='utf-8') as f:f.write('\n기존characters 담당으로 신규레나 전문지시 후속송신·실제영수증연결. 새필독/착수·생성회신대기.\n')
print(json.dumps({'task':c['task'],'state':c['state'],'expectedNewImages':1},ensure_ascii=False))
