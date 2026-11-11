from pathlib import Path
from datetime import datetime
import hashlib
import importlib.util
import json
import urllib.request

R=Path('C:/Users/user/Desktop/Grid Defenders');S=R/'작업관리'
H=R/'메인작업/main01/balor-motions-dual/workshop-correction-v001'
V=H/'qa';V.mkdir(exist_ok=True)
if (V/'연결.json').exists():raise SystemExit('이미 준비된 QA입니다. 중복 등록 금지.')
W=Path('C:/Users/user/orca/workspaces/Grid Defenders/스킬-이펙트')
T=Path('C:/Users/user/orca/workspaces/Grid Defenders/테스터')
def read(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def write(p,d):Path(p).write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf-8')
c=read(H/'연결.json');O=Path(c['output'])
assert c['delivery']['dispatchId']=='ctx_62063882989f' and c['delivery']['taskId']=='task_b9b76c2ad144'
changes=read(O/'changed-files.json')
for a in changes:assert sha(a['path'])==a['after']
sources=read(O/'source-hashes.json')
assert len(sources)==6
for a in sources:assert sha(a['source'])==sha(a['copy'])==a['sha256']
for name in ['browser-result.json','loop-result.json','atomic-result.json']:
 d=read(O/name);assert d['result']=='PASS' and not d.get('errors',[])
url='http://127.0.0.1:5182/effect-workshop.html#actor'
with urllib.request.urlopen(url,timeout=10) as res:http=res.status
assert http==200
review={'task':c['task'],'nativeMessage':'msg_db15eaa9f674','nativeTaskId':'task_b9b76c2ad144',
 'dispatchId':'ctx_62063882989f','nativeOutcome':'succeeded','reviewedAt':datetime.now().astimezone().isoformat(),
 'changedFilesChecked':len(changes),'sourceAndCopyPngChecked':12,'report':str(O/'report.md'),
 'reportSha256':sha(O/'report.md'),'personallyViewed':str(O/'comparison-left-dpr2.png'),
 'url':url,'httpStatus':http,'sourceArtAccepted':False,'independentQaPassed':False,
 'notes':'원본/보정 초안과 검끝 표시의 기술 결과 수신. 기존 아트 실패/주의와 사용자 합격은 보존. 새 Sunburst13장과 별개.'}
write(H/'반환검증.json',review)
(H/'반환검토.md').write_text('# 기존 발로르 공방 보정 반환 검토\n\n공식 worker_done succeeded. 보고서 본문을 읽고 변경15파일과 원본·복사PNG12개 SHA를 직접 대조했다. 기존5182 HTTP200 및 원본 비교·검끝 궤적 화면을 확인했다. 제작팀 브라우저24/루프3/입력복구14 PASS는 제작팀 증거이며 독립 QA와 구분한다.\n\n원본 시트 미적 실패/주의, 사용자 속도/최종 선택은 보존한다. 새 메인1 Sunburst13개 생성은 아직 실행되지 않았고 이번 완료·검증과 별개다. 실게임/사용자 화면/API/Git 변경0. 독립 검증은 편집·비교·좌표·복구의 기술 범위로 연결한다.\n',encoding='utf-8')
spec=importlib.util.spec_from_file_location('board',S/'도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(S)
if b.load(c['task'],'main01')['status']=='in_progress':b.record(c['task'],'main01','returned',O/'report.md')
c.update(state='awaiting_independent_technical_qa',workerOutcome='succeeded',report=str(O/'report.md'),mainReview=str(H/'반환검증.json'),userAccepted=False)
write(H/'연결.json',c)
proof=(H/'사용자확인.md').read_text(encoding='utf-8')
t=b.new('main01','qa','발로르 공방 보정·원본 비교·검끝 궤적 독립 기술 검증',proof)
tid=t['id'];F=b.folder(tid);out=T/'output'/('balor-workshop-correction_qa_'+tid.lower()+'_v001')
prompt=f'''# {tid} / 차수1 / qa — 기존 발로르 공방 보정의 독립 기술 검증
main01 run_47ce1a81d7b1. 제작 {c['task']} succeeded, 원공방 MAIN01-20261111-47B7186F, 이전 QA MAIN01-20261111-3A680E78 PASS.
사용자 승인 {H/'사용자확인.md'}의 기존6시트 공방 보정 범위입니다. 새 필독 본문/현재SHA·적용 ACK/start 후 검사합니다.
이후 사용자가 요청한 메인1의 새 Sunburst13장 “검수 없이 전달” 제작은 아직 미실행이며 이번 대상과 별개입니다.
이번은 공방의 편집·비교·좌표·저장 기술 검사입니다. 모션 원화 미적 검수/생성·재생속도 결정은 하지 않습니다.

대상 {W/'게임'}, 기존 {url}. 실제 “발로르 보정 초안 불러오기” → 내장/2.6의 대기/횡베기/종베기 6동작72프레임을 검사합니다.
제작 보고 {O/'report.md'}, 변경파일 {O/'changed-files.json'}, 원본보존 {O/'source-hashes.json'}, 프레임보정표/scene.json/복구JSON,
현재 사용법 {W/'게임/src/effect-workshop/BALOR-README.md'}와 {W/'게임/src/effect-workshop/ACTOR-README.md'}, main검토 {H/'반환검증.json'}을 읽습니다.
실제 시작/끝 제품 SHA와 원본/복사 PNG를 직접 읽어 버전을 고정합니다. 제작자 PASS 수치를 본인 검사 수치로 합산하지 않습니다.

집중 검사:
1. 실제6동작/72프레임의 rect/order/time와 기존 원본 파일이 유지되는지, 초기 비영점 보정 초안이 editable인지 확인합니다.
2. 원본/보정은 동일동작·시간·프레임·관찰배율이며 오른쪽 편집이 왼쪽 원본JSON/픽셀에 영향을 주지 않아야 합니다.
   동작전환·재생/정지·프레임 이동·스크럽, 선택범위·비영점 offset/scale·초기화·undo/redo, 양쪽 관찰 확대/스크롤을 확인합니다.
3. 검끝66점과 미지정6구간은 수동 추정 초안입니다. 누락 구간을 선으로 건너 잇지 않고 삭제·재입력·undo/복구가 동작해야 합니다.
   보정/원본 각각의 point 변환을 코드 결과가 아닌 손계산 좌표와 실제 픽셀로 비교합니다. root/offset/scale·DPR2·관찰확대를 함께 포함합니다.
   source에 없는 검끝을 복구한 것처럼 검사하지 않고 경계 접촉과 불명확 점 표시를 구분합니다.
4. 에셋 포함 내보내기 → 새 독립 incognito 실제파일 입력으로 원본기준/보정/점/문서를 동등 복구합니다.
   선택적인 comparison 메타 없는 옛 정상문서도 유지하고, 손상된 comparison 기준/points/keys 입력의 비동기 거부 후 활성문서·undo/redo가 보존돼야 합니다.
5. 기존QA01 효과 .2시작/fps10/.3 경계와 QA03 loop .1×3의 .3초 index0/첫픽셀 및 nonloop마지막 유지가 회귀하지 않았는지 집중 확인합니다.
   원본 비교 메타 추가로 validator·시간코드가 영향을 받았는지 확인하되 무관한 전체 수백 검사를 반복하지 않습니다.
6. 대표 명암/72CSS·공방 자체필드 및320/390 DPR2에서 새 비교·궤적 조작이 접근 가능하고 현재 초안 전체가 고정 보기 영역에 포함되는지 확인합니다.
   확대/보기 스케일과 기본72CSS를 구분하고, 근거 없는 프레임별 자동줌·그림 크기 맞춤이 추가되지 않았는지 봅니다.

검사 산출물은 {out}에만 재현기·기대/실제·화면·버전SHA·5종기록·실제 판정/한계를 작성합니다.
원제품/원본PNG/타팀/root5173/사용자 현재창·탭·프로필·세이브/계정·API·Git·설치/공유규정 수정0.
기존5182를 재사용하되 격리 headless 새 문맥만 사용하고 종료합니다. 제작 원화 합격이나 실게임 통합을 선언하지 않습니다.
공식 새 Task/Dispatch worker_done으로 main01 run_47ce1a81d7b1에 실제 outcome·제작/QA작업·차수·보고 경로를 반환합니다.
'''
(F/'요청확인.md').write_text(proof,encoding='utf-8');(F/'전문프롬프트.md').write_text(prompt,encoding='utf-8')
docs={'1_대화기록.md':proof,'2_사전확인.md':'제작 공식 succeeded와 현재15파일/원본복사12PNG SHA 및 공방 HTTP200을 확인했다. 같은 승인 범위의 독립 기술검증이며 새13장 원화 검수와 분리한다. QA 슬롯은 이전 실제 반환 이후 사용하며 새 ACK/start를 요구한다.','3_작업일지.md':'기존 공방 보정 완료 수신·근거 대조 후 독립 기술 검사 준비.','4_정의문서.md':'원본/보정 독립성·동기시간·검끝 궤적/미지정 갭·좌표·내보내기/복구/과거경계 회귀. 사용자 미적 판정과 분리.','5_버전관리.md':'현재 제작15파일과 native6/copy6 SHA 고정. 테스트 출력은 새 전용폴더만. 제품/API/Git/사용자환경 변경0.'}
for name,body in docs.items():
 v='# '+tid+' / 차수1\n\n'+body+'\n';(F/name).write_text(v,encoding='utf-8');(V/name).write_text(v,encoding='utf-8')
extras=[H/'사용자확인.md',O/'report.md',O/'changed-files.json',O/'source-hashes.json',H/'반환검증.json',W/'게임/src/effect-workshop/BALOR-README.md',W/'게임/src/effect-workshop/ACTOR-README.md',S/'단일메인운영규정.md',S/'기준/characters/SD_72CSSpx_표시기준.md',R/'문서/00_개발규칙/스킬구현규약.md',S/'이미지2.6사용규칙.md',S/'저장운영규정.md']
assert all(p.is_file() for p in extras)
b.set_readings(tid,'main01',[str(p) for p in extras]);b.confirm(tid,'main01','발로르 작업 진행해봐',H/'사용자확인.md');plan=b.prepare(tid,'main01')
q={'task':tid,'iteration':1,'parentTask':c['task'],'folder':str(F),'output':str(out),'plan':plan,'state':'prepared_not_sent','targetDispatch':'ctx_011976d8a695','imageGenerationAllowed':False}
write(V/'연결.json',q)
print(json.dumps({'task':tid,'state':q['state'],'prompt':plan['prompt']},ensure_ascii=False))
