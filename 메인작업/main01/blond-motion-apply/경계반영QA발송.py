from pathlib import Path
import importlib.util, json, subprocess

R=Path('C:/Users/user/Desktop/Grid Defenders');S=R/'작업관리'
H=R/'메인작업/main01/blond-motion-apply/visual-spacing-v003/qa'
p=H/'연결.json';c=json.loads(p.read_text(encoding='utf-8-sig'));receipt=H/'실제발송영수증.json'
assert not receipt.exists(),'영수증 존재. 중복 발송 금지.'
assert c['state']=='prepared_not_sent'
body=f"main01 {c['task']} 차수1. 실제 root v003의 독립 재검증입니다. 전체 전문지시·자동필독은 {c['plan']['prompt']} 를 읽으세요. 원래 QA-VIS-01과 후기 머리 잘림 수정이 root에 반영됐고 main의 1733 모델 검사/build/73개 파일 SHA 확인이 끝났습니다. 새로운 read-pack 본문 → 문서별 적용/현재 SHA ACK → start 후 실제 root5173의 새 독립 브라우저에서 간격·후기 전체 경계·접근/저장 회귀를 확인하세요. 자기 출력 {c['output']} 에만 검사/화면/5종 기록을 남깁니다. 사용자 화면·저장·원제품·공방·API·Git 변경 없음. 새 Sunburst13장 아트 검수는 범위 밖입니다. 공식 새 Task/Dispatch worker_done으로 main01 run_47ce1a81d7b1에 실제 outcome과 보고 경로를 반환하세요."
cmd=['C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe','orchestration','send','--to','dispatch:'+c['targetDispatch'],'--type','dispatch','--subject',c['task']+' 실제 게임 v003 독립 재검증','--body',body,'--json']
cp=subprocess.run(cmd,capture_output=True,text=True,encoding='utf-8',errors='replace')
receipt.write_text(cp.stdout+('\n'+cp.stderr if cp.stderr else ''),encoding='utf-8');print(cp.stdout,flush=True)
if cp.returncode:raise SystemExit(cp.returncode)
d=json.loads(cp.stdout);assert d.get('ok'),'전달 불명확. 공식 복구 전 재발송 금지.'
spec=importlib.util.spec_from_file_location('board',S/'도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
m.Board(S).record(c['task'],'main01','sent',receipt)
c.update(state='delivery_receipt_recorded',delivery=d['result']);p.write_text(json.dumps(c,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'task':c['task'],'state':c['state']},ensure_ascii=False))
