from pathlib import Path
import json,importlib.util
H=Path(__file__).resolve().parent;R=Path('C:/Users/user/Desktop/Grid Defenders')
l=json.loads((H/'연결.json').read_text(encoding='utf-8'));v=json.loads((H/'http-review.json').read_text(encoding='utf-8'));delivery=json.loads((H/'결과연결.json').read_text(encoding='utf-8'))
assert v['passed'] and delivery['workerOutcome']=='failed'
spec=importlib.util.spec_from_file_location('board',R/'작업관리/도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(R/'작업관리')
t=b.load(l['task'],'main01')
if t['status']=='in_progress':b.record(l['task'],'main01','returned',Path(l['output'])/'보고.md')
t=b.load(l['task'],'main01');assert t['status']=='awaiting_user'
l.update(state='awaiting_user',workerOutcome='failed',technicalLimitations=['검축일관성미달','native프레이밍차이','방패회전해석차이'],gallery=delivery['gallery'],mainVerification=str(H/'http-review.json'))
(H/'연결.json').write_text(json.dumps(l,ensure_ascii=False,indent=2),encoding='utf-8')
(H/'검증결과.md').write_text('# 반환 검증 결과\n\n원본검토와비교판/검축실제열람완료. 새HTTP경로51파일로컬/HTTP동일SHA확인. 격리headlessEdge에서6카드(공유정면2칸+신규4장),5개고유원본의1024×1536로드,확대열기닫기,밝음어두움,원본크기토글,JS오류0확인. http-review.json 및결과연결.json참조.\n\n이것은전달·브라우저검증통과이며이미지핵심조건통과가아니다. worker_done outcome failed(검축/native여백미달)를유지하고사용자평가대기로반환기록했다. 사용자합격/게임통합/추가생성/SD/리깅/화면조작/Git없음.\n',encoding='utf-8')
print(json.dumps({'task':l['task'],'state':t['status'],'workerOutcome':'failed','gallery':l['gallery']},ensure_ascii=False))
