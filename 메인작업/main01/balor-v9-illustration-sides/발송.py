from pathlib import Path
import json,subprocess,importlib.util
H=Path(__file__).resolve().parent;R=Path('C:/Users/user/Desktop/Grid Defenders');receipt=H/'실제발송영수증.json'
if receipt.exists():raise SystemExit('Receipt exists: inspect, do not send twice.')
l=json.loads((H/'연결.json').read_text(encoding='utf-8'))
body=f'''main01 신규 승인 제작 {l['task']} / 차수1 / role characters.
작업: 승인된 발로르 v9 정면을 그대로 보존하고 일러스트 오른쪽35/90를 내장2장+GPT Image2.6 2장 총4장. 사용자가 이 정확한확인내용에 '진행'으로답했으며2.6도이번2장범위명시허가. 측면사용자합격전 SD/리깅금지.
자동필독첨부 전체 전문지시를 이 파일에서 본문으로 읽으세요: {l['plan']['prompt']}
원문전문프롬프트만이 아닌 이 발송지시의 OPS-004 첨부목록 전체를읽고 현재작업/차수/characters ACK 및 start통과후착수하세요. 발송영수증 main01기록이잠시늦으면그기록후start재시도하고필독을생략하지마세요.
새출력허용경로: {l['output']}
승인원본: {l['source']} (직접view_image로확인). 이번v9합격이과거AGENTS미통과판정보다이작업에서우선. 옛파일자체수정금지. v9얼굴/체형/의상/검/방패의동일성유지;2.6자동재시도/모델대체금지. 사용자화면조작/다른원본변경/게임/커밋푸시금지.
새 Task/Dispatch의공식회신으로 main01에작업번호·차수·보고경로·이미지4장·검증·과금횟수를반환하고측면합격대기. 기본텍스트모델은사용자지정6.1Sol/medium이며진행중턴재시작으로설정변경하지마세요.'''
cmd=['C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe','orchestration','send','--to','dispatch:'+l['targetDispatch'],'--type','dispatch','--subject',l['task']+' 승인제작: 발로르v9 일러스트측면4장','--body',body,'--json']
cp=subprocess.run(cmd,capture_output=True,text=True,encoding='utf-8',errors='replace')
receipt.write_text(cp.stdout+('\n'+cp.stderr if cp.stderr else ''),encoding='utf-8');print(cp.stdout,flush=True)
if cp.returncode:raise SystemExit(cp.returncode)
d=json.loads(cp.stdout)
if not d.get('ok'):raise SystemExit('Not confirmed; inspect before recovery.')
spec=importlib.util.spec_from_file_location('board',R/'작업관리/도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(R/'작업관리')
b.record(l['task'],'main01','sent',receipt)
l.update(state='delivery_receipt_recorded',delivery=d['result']);(H/'연결.json').write_text(json.dumps(l,ensure_ascii=False,indent=2),encoding='utf-8')
f=Path(l['folder'])/'3_작업일지.md'
f.write_text('# 작업일지\n2026-11-11 main01: 최신사용자승인/원본/충돌확인, 전문지시와필독첨부준비후 공식발송영수증기록. 실제착수와생성결과는 담당회신대기.\n',encoding='utf-8')
print(json.dumps({'task':l['task'],'state':l['state']},ensure_ascii=False),flush=True)
