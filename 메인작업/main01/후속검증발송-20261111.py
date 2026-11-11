from pathlib import Path
import importlib.util,json,subprocess
R=Path('C:/Users/user/Desktop/Grid Defenders');P=R/'메인작업/main01'
spec=importlib.util.spec_from_file_location('board',R/'작업관리/도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(R/'작업관리')
for H in [P/'blond-motion-apply/qa',P/'character-effect-workshop/technical-fix-v003']:
 receipt=H/'실제발송영수증.json'
 if receipt.exists():raise SystemExit('영수증 존재/중복발송금지: '+str(H))
 c=json.loads((H/'연결.json').read_text(encoding='utf-8'));assert c['state']=='prepared_not_sent'
 body=f"main01 {c['task']} 차수1 {c['branch']} / 원작업 {c['parentTask']}의 승인범위 후속입니다. 전체전문지시/이번자동필독: {c['plan']['prompt']} . 새read-pack본문/문서별적용·현재SHA ACK→start 후착수. 이전ACK재사용/진행질문반복없음. 자기새출력 {c['output']} 에5종기록·검사·정확한결과를취합하고공식새Task/Dispatch worker_done으로main01 run_47ce1a81d7b1에반환하세요. user현재탭/저장소·타팀·원본시트·생성API/Git변경0. 상세검증/수정경계와기대값은전문지시에있습니다."
 cmd=['C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe','orchestration','send','--to','dispatch:'+c['targetDispatch'],'--type','dispatch','--subject',c['task']+' '+('실게임 반영본 독립 검증' if c['branch']=='qa' else '공방 루프 경계 수정'),'--body',body,'--json']
 cp=subprocess.run(cmd,capture_output=True,text=True,encoding='utf-8',errors='replace');receipt.write_text(cp.stdout+('\n'+cp.stderr if cp.stderr else ''),encoding='utf-8');print(cp.stdout,flush=True)
 if cp.returncode:raise SystemExit(cp.returncode)
 d=json.loads(cp.stdout);assert d.get('ok'),'전달미확인/복구지침확인/중복발송금지'
 b.record(c['task'],'main01','sent',receipt);c.update(state='delivery_receipt_recorded',delivery=d['result']);(H/'연결.json').write_text(json.dumps(c,ensure_ascii=False,indent=2),encoding='utf-8')
 print(json.dumps({'task':c['task'],'branch':c['branch'],'state':c['state']},ensure_ascii=False))
