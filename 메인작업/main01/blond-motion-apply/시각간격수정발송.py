from pathlib import Path
import importlib.util,json,subprocess
R=Path('C:/Users/user/Desktop/Grid Defenders');S=R/'작업관리';P=R/'메인작업/main01'
spec=importlib.util.spec_from_file_location('board',S/'도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(S)
for H in [P/'blond-motion-apply/visual-spacing-v002',P/'character-effect-workshop/qa-v003']:
 receipt=H/'실제발송영수증.json'
 if receipt.exists():raise SystemExit('영수증존재/중복발송금지:'+str(H))
 c=json.loads((H/'연결.json').read_text(encoding='utf-8'));assert c['state']=='prepared_not_sent'
 subject='터틀 몸통·다유닛 시각 간격 수정' if 'visual-spacing' in str(H) else '공방 v003 최종 독립 재검증'
 body=f"main01 {c['task']} 차수1 / {subject}. 전체전문지시·이번자동필독: {c['plan']['prompt']} . 기존사용자승인범위의필수기술수정/재검증이며새진행질문반복없음. read-pack본문→현재SHA·문서별적용ACK→start 후착수하세요. 자기새출력 {c['output']} 에만규정상5종기록/검사·화면/정확한보고를취합하고공식새Task/Dispatch worker_done으로main01 run_47ce1a81d7b1에원작업·차수/실제outcome/결과경로를반환합니다. 제작·검사범위는전문지시대로이며사용자현재창/프로필·세이브/원본PNG·타팀/공유규정/API/Git변경0."
 cmd=['C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe','orchestration','send','--to','dispatch:'+c['targetDispatch'],'--type','dispatch','--subject',c['task']+' '+subject,'--body',body,'--json']
 cp=subprocess.run(cmd,capture_output=True,text=True,encoding='utf-8',errors='replace');receipt.write_text(cp.stdout+('\n'+cp.stderr if cp.stderr else ''),encoding='utf-8');print(cp.stdout,flush=True)
 if cp.returncode:raise SystemExit(cp.returncode)
 d=json.loads(cp.stdout);assert d.get('ok'),'전달미확인/복구지침확인/중복발송금지'
 b.record(c['task'],'main01','sent',receipt);c.update(state='delivery_receipt_recorded',delivery=d['result']);(H/'연결.json').write_text(json.dumps(c,ensure_ascii=False,indent=2),encoding='utf-8')
 print(json.dumps({'task':c['task'],'state':c['state']},ensure_ascii=False))
