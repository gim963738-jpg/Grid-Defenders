from pathlib import Path
import json,importlib.util
H=Path(__file__).resolve().parent;R=Path('C:/Users/user/Desktop/Grid Defenders')
l=json.loads((H/'연결.json').read_text(encoding='utf-8'));v=json.loads((H/'http-review.json').read_text(encoding='utf-8'));d=json.loads((H/'결과연결.json').read_text(encoding='utf-8'));assert v['httpDeliveryPassed'] and not v['artTechnicalPass'] and d['workerOutcome']=='failed'
spec=importlib.util.spec_from_file_location('board',R/'작업관리/도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(R/'작업관리');t=b.load(l['task'],'main01');assert t['iteration']==3
if t['status']=='in_progress':b.record(l['task'],'main01','returned',Path(l['output'])/'보고.md')
t=b.load(l['task'],'main01');assert t['status']=='awaiting_user'
l.update(state='awaiting_user',workerOutcome='failed',technicalPass=False,gallery=d['gallery'],mainVerification=str(H/'http-review.json'))
(H/'연결.json').write_text(json.dumps(l,ensure_ascii=False,indent=2),encoding='utf-8')
(H/'검증결과.md').write_text('# 차수3 반환 결과\n\n공식실패회신/보고/검수와비교판·35/90최종PNG를main01이직접열어검토. 큰팔위치/사선포즈유지는관찰되지만배경판잔여가명백하고미세작화/그립·검정합및몸통/시선반영한계가남아artTechnicalPass=false. 사용자합격미기록.\n\n새HTTP허용목록53파일원본/사본/HTTP동일SHA. 격리headlessEdge에서첫6칸의수정35/90동시표시,두방향동시전후토글,아래행2.6불변,공통정면동일,전체이미지로드,두수정확대열기닫기,명암/원본토글/JS오류0확인. http-review.json의httpDeliveryPassed=true는파일전달검사만뜻한다.\n\n현재차수20문서ACK게이트를통과해작업대장returned/사용자평가대기. 내장6회는담당기록이며main추가생성0/2.6/API0/사용자화면조작0/게임SD리깅0/Git없음. 이전원본과실패이력보존.\n',encoding='utf-8')
print(json.dumps({'task':l['task'],'iteration':3,'state':t['status'],'workerOutcome':'failed','gallery':l['gallery']},ensure_ascii=False))
