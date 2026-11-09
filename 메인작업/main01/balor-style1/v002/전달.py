from pathlib import Path
import json, hashlib, importlib.util, subprocess, datetime

ROOT=Path(__file__).resolve().parents[4]; S=ROOT/'작업관리'; HERE=Path(__file__).resolve().parent
prior=HERE.parent
receipt=HERE/'실제발송영수증.json'
if receipt.exists() or (HERE/'연결.json').exists():raise SystemExit('Existing attempt; inspect before retry.')
spec=importlib.util.spec_from_file_location('board',S/'도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(S)
t=b.load('MAIN01-20261110-D820F076','main01')
if t['status']!='draft' or t['iteration']!=2:raise SystemExit('Unexpected revision state')
if 'characters' in b.leases():raise SystemExit('Character lease conflict')
folder=b.folder(t['id'])
old=json.loads((prior/'연결.json').read_text(encoding='utf-8')); oldout=Path(old['output']); out=oldout.parent/(oldout.name[:-4]+'v002')
assert out!=oldout
proof=HERE/'사용자확인.md'
proof.write_text('''# 차수2 실제 진행 승인
반려 원문: “너무 옆으로 퍼진느낌인데 불합격”.
메인 이해확인: 1번 그림체와 장비 디테일 유지, 어깨·몸통 폭을 줄이고 팔·방패를 몸에 가깝게 배치. 이미지 전체를 가로로 눌러 보정하지 않음. 진행 전 수정 제작 대기.
이 설명 뒤 사용자 실제 승인: “진행”.
대상은 MAIN01-20261110-D820F076 차수2의 발로르 정면1장 수정이다. 기존 원본/4번 예비안/차수1 반려본 보존. 게임 적용/측면/공통기준변경/커밋푸시 제외.
''',encoding='utf-8')
pre=HERE/'사전확인.md'
pre.write_text('''# 수정 하달 전 사전확인
main01 역할/작업방법과 공통/메인/팀장/분야 규정, 보고·진행규칙 및 직전 지시/원본/반려판정/제작보고를 대조했다. 차수2 draft 및 characters lease 없음, 기존 ctx_db7946ccdb85 succeeded/settled/retained 확인. 차수1은 반려본이며 승인 마스터로 사용하지 않는다. 승인원화/선택1번을 주참조로, 반려본은 넓어진 문제 설명용으로만 전달한다. 원본과 반려본에 파일 변형 없이 새 output 차수2만 작성. 폭 감소는 실제 새 작화/자세 조정으로 수행하고 등신·얼굴/장비를 일괄 세로늘림/가로압축하지 않는다. 같은 높이의 반려전후/1번참조 비교와 부위별 폭·머리높이 대조를 요구한다. 수치 목표는 새 사용자 확정치로 만들지 않는다. 실제 하달 뒤 영수증 연결, 담당 새 ACK/start 필요. 화면/게임/공통파일/자동Git저장 제외.
''',encoding='utf-8')
feedback=HERE/'실루엣수정기준.md'
feedback.write_text('''# 반려를 반영한 차수2 제작·검수 기준
확정 문제: 좌우로 퍼진 느낌. 허용 수정: 1번 화풍·장비 정체성을 유지하며 어깨/흉곽/허리 폭을 정돈, 팔 벌어짐 축소, 방패와 망토의 좌우 확장·다리 벌림을 줄여 세로 흐름 정리. 과도한 근육질 상체나 둥근 가로 덩어리 대신 다부진 기사 체형. 방패의 크기/형태 자체를 무조건 축소하는 방식은 금지하며, 몸과의 배치·겹침으로 조절한다.
주의: 모든 폭을 같은 비율로 압축하거나 머리를 작게/키를 길게 만들어 좁아 보이게 하지 않는다. 선택1번의 얼굴·SD 비중과 작화 유지. 검 손잡이/가드/붉은 보석/방패 문장/가슴사자/망토 핀 변경은 여전히 오류.
검수: 같은 본체높이·발선에 반려차수1/선택1번/수정차수2를 놓고 실제 어깨폭·허리폭·상완 벌림·방패 포함 외곽·망토폭을 구분해 측정/시각대조. 머리/본체비중과 장비상대크기도 함께 확인. 원본PNG를 변형한 치수로 통과시키지 않는다. 관찰 수치는 결과 근거이며 사용자 합격을 대신하지 않음. 작은57/72CSSpx와 밝고어두운 전체/얼굴·무기 확대도 확인.
''',encoding='utf-8')
previous=(folder/'전문프롬프트.md').read_text(encoding='utf-8')
# The former instruction is preserved in 이전차수/v001; current prompt keeps its immutable identities and exclusions.
base=previous.replace('차수1','차수2').replace(str(oldout),str(out)).replace(str(prior/'사용자확인.md'),str(proof))
prefix=f'''# 차수2 우선 지시: 가로로 퍼진 발로르 실루엣 수정
실제 반려/수정진행 승인 {proof}; 사전확인 {pre}; 상세 수정기준 {feedback}. 이번 차수2 새 read-pack/characters ACK/start를 통과하기 전 생성 금지.
차수1 {oldout/'front.png'}는 사용자 불합격이다. 이를 승인된 완성본으로 고정하지 말고 문제 대조용으로만 직접 열어 본다. 사용자 문제는 **너무 옆으로 퍼진 느낌**이다. 1번 화풍/SD 얼굴가독성 및 발로르 고유장비를 유지하면서 어깨·흉곽·허리폭, 팔의 벌어짐, 방패/망토/다리 배치를 새로 그려 세로 실루엣을 정돈한다. 전체 가로압축/세로늘림/얼굴축소로 해결한 척하지 않는다. 큰방패의 길이·디자인 정체성을 살리고 몸에 가깝게 겹쳐 배치한다. 생성할 때 승인원화와 선택1번을 주참조로 구분하고 반려본은 피해야 할 폭 설명용으로 쓴다.
새 출력 {out}에 정면1장 front.png와 반려차수1/선택1번/수정차수2 동일높이 비교 comparison.png, 부위 폭 근거 silhouette-comparison.png, 장비 identity-detail-comparison.png, index.html/제작기준/검수/report/생성기록/manifest를 제출한다. 차수1 원본·비교페이지·기록·카탈로그를 덮어쓰지 않는다. 사용자 원문과 제안/관찰수치를 구분하며 임의 비율수치를 사용자 확정 기준으로 기록하지 않는다.
반려본보다 좁아진 이유가 **어떤 부위/배치의 변경인지** 보고하고 장비/손잡이 디테일 검수도 다시 수행한다. 이전 start/ACK 재사용 금지. 차수2의5종 기록은 실제 수행 내용으로 새로 추가하고 차수1 기록을 지우지 않는다. 같은 승인 재질문 없이 이 범위의 실제 제작·내부보완·검수·납품까지 수행한다.
아래 원작업의 디자인 정체성/도구/허용범위/원본보존 규칙은 위 차수2 수정사항과 함께 적용한다. 이전 결과의 합격을 뜻하지 않는다.
\n'''
for name,text in [('요청확인.md',proof.read_text(encoding='utf-8')),('전문프롬프트.md',prefix+base),('2_사전확인.md',pre.read_text(encoding='utf-8'))]: (folder/name).write_text(text,encoding='utf-8')
pres=json.loads((prior/'보존목록.json').read_text(encoding='utf-8'))
for x in pres['files']:
 for k in ['source','preserved']:
  assert hashlib.sha256(Path(x[k]).read_bytes()).hexdigest()==x['sha256']
ack={'role':'main01','iteration':2,'at':datetime.datetime.now().astimezone().isoformat(),'scope':'수정하달 전 필독 및 승인·충돌·보존 확인','documents':[]}
prevack=json.loads((prior/'메인필독확인.json').read_text(encoding='utf-8'))
for doc in prevack['documents']:
 p=Path(doc['path']); ack['documents'].append({'path':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'applies':doc['applies']+' 이번 차수2의 좌우폭 수정·반려본 보존에 적용.'})
(HERE/'메인필독확인.json').write_text(json.dumps(ack,ensure_ascii=False,indent=2),encoding='utf-8')
readings=[Path(x) for x in t.get('additionalReadings',[])]+[proof,pre,feedback,prior/'사용자반려-좌우폭-v001.md',oldout/'report.md',oldout/'검수.md']
b.set_readings(t['id'],'main01',list(dict.fromkeys(str(x) for x in readings)))
b.confirm(t['id'],'main01','진행',proof);plan=b.prepare(t['id'],'main01')
(HERE/'연결.json').write_text(json.dumps({'task':t['id'],'iteration':2,'folder':str(folder),'output':str(out),'previousOutput':str(oldout),'plan':plan},ensure_ascii=False,indent=2),encoding='utf-8')
r=subprocess.run(['C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe','orchestration','send','--to','dispatch:ctx_db7946ccdb85','--subject','진행 승인: 발로르 가로로 퍼진 실루엣 수정·정면 차수2','--type','dispatch','--body',Path(plan['prompt']).read_text(encoding='utf-8'),'--json'],capture_output=True,text=True,encoding='utf-8')
receipt.write_text(r.stdout,encoding='utf-8'); print(r.stdout,flush=True)
if r.returncode or not json.loads(r.stdout).get('ok'):raise SystemExit('Inspect receipt; no blind retry.')
b.record(t['id'],'main01','sent',receipt)
print(json.dumps({'task':t['id'],'iteration':2,'sourcePreservationChecks':22,'output':str(out),'sent':True,'workerStartNotYetVerified':True},ensure_ascii=False),flush=True)
