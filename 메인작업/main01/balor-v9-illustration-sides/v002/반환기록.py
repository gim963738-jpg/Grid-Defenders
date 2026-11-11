from pathlib import Path
import json,importlib.util
H=Path(__file__).resolve().parent;R=Path('C:/Users/user/Desktop/Grid Defenders')
l=json.loads((H/'연결.json').read_text(encoding='utf-8'));v=json.loads((H/'http-review.json').read_text(encoding='utf-8'));delivery=json.loads((H/'결과연결.json').read_text(encoding='utf-8'));assert v['passed']
spec=importlib.util.spec_from_file_location('board',R/'작업관리/도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(R/'작업관리');t=b.load(l['task'],'main01');assert t['iteration']==2
if t['status']=='in_progress':b.record(l['task'],'main01','returned',Path(l['output'])/'report.md')
t=b.load(l['task'],'main01');assert t['status']=='awaiting_user'
l.update(state='awaiting_user',workerOutcome='succeeded',gallery=delivery['gallery'],mainVerification=str(H/'http-review.json'))
(H/'연결.json').write_text(json.dumps(l,ensure_ascii=False,indent=2),encoding='utf-8')
(H/'검증결과.md').write_text('# 차수2 반환 검증\n\nMAIN01-20261111-42D3D4BB 차수2 / main01 / 2026-11-11. report.md/검수.md와comparison.png/최종PNG 직접열람. 검전체축개선과방패뒷면·견장보존을관찰. 얼굴/갑주선소폭재묘사·maxAlpha254·미세유색외곽/숨은손구조한계는유지. 사용자미적합격은대기.\n\n82파일소스/사본/HTTP동일SHA확인. 격리headless Edge로9스테이지(큰3+57/72각3)·모든실제이미지로드·수정전/2.6참고/수정후3출처·확대열기닫기·명암·원본토글·보존6칸링크·JS오류0확인. 최초검사에서src없는확대팝업빈img를로드실패로계산한검사오류를발견하여실제src있는이미지검사로수정후통과. 제품코드변경없음.\n\n현재차수필독ACK검사를거쳐작업대장반환/사용자평가대기. 내장3회는담당기록,main추가생성0/2.6/API0/사용자화면조작0/게임통합0/SD리깅0/Git커밋푸시0.\n',encoding='utf-8')
print(json.dumps({'task':l['task'],'iteration':2,'state':t['status'],'gallery':l['gallery']},ensure_ascii=False))
