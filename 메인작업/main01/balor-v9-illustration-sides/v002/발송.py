from pathlib import Path
import json,subprocess,importlib.util
H=Path(__file__).resolve().parent;R=Path('C:/Users/user/Desktop/Grid Defenders');receipt=H/'실제발송영수증.json'
if receipt.exists():raise SystemExit('Receipt exists. Inspect before repeating.')
l=json.loads((H/'연결.json').read_text(encoding='utf-8'))
body=f'''{l['task']} 수정차수2 / main01 → characters. 사용자최종확인에 '이 내용으로 진행' 실제승인완료.
내장90 한장만편집:기존내장의방패뒷면/전완연결과90도자세·견장디테일은보존,몸통만2.6 90의슬림한표현과시선참고. 검전체를신체의측면방향에맞춰회전하고손목/그립연결하되날–가드–손잡이–폼멜일관축유지. 기존6칸과2.6원본보존/전후비교.
유료·2.6·API·env열람0, 내장편집만. SD/리깅/게임/사용자창/커밋푸시금지.
전체전문지시+새필독자동첨부를반드시본문으로읽을파일: {l['plan']['prompt']}
차수1ACK대신차수2의현재필독전체적용요약→characters start통과후편집. v1결과원본은읽기전용, 신규결과허용경로 {l['output']}
주입력3개와역할/보존범위/실패조건/검증/기록은위파일에있습니다. 실제view_image로타깃과참고를새로열고새원본1장과전체/세부검수/전후페이지를반환. 이전2.6허가·기준을현재추가호출로확대하지마세요.
새Task/Dispatch의 worker_done으로작업번호·차수2·보고경로·내장호출회수·2.6호출0·미달/완료범위를 main01에회신. 실행모델변경을위해진행중턴을재시작하지마세요.'''
cmd=['C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe','orchestration','send','--to','dispatch:'+l['targetDispatch'],'--type','dispatch','--subject',l['task']+' v002 승인수정: 내장90 몸통·검축·그립 (2.6호출금지)','--body',body,'--json']
cp=subprocess.run(cmd,capture_output=True,text=True,encoding='utf-8',errors='replace');receipt.write_text(cp.stdout+('\n'+cp.stderr if cp.stderr else ''),encoding='utf-8');print(cp.stdout,flush=True)
if cp.returncode:raise SystemExit(cp.returncode)
d=json.loads(cp.stdout)
if not d.get('ok'):raise SystemExit('Delivery unclear; inspect before recovery, do not duplicate.')
spec=importlib.util.spec_from_file_location('board',R/'작업관리/도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(R/'작업관리');b.record(l['task'],'main01','sent',receipt)
l.update(state='delivery_receipt_recorded',delivery=d['result']);(H/'연결.json').write_text(json.dumps(l,ensure_ascii=False,indent=2),encoding='utf-8')
(H/'3_작업일지.md').write_text('# 차수2 작업일지\n사용자최종확인수신→원본2개직접열람/해시대조→이전차수보존revise→새범위필독/confirm/prepare→공식후속발송/영수증연결. 실제필독착수/생성/검수는담당회신대기.\n',encoding='utf-8')
(H/'4_정의문서.md').write_text('# 차수2 정의\n내장90 1장수정. 몸통/시선2.6참고,방패/견장내장보존,무기를몸각도에맞추고강체검축과손목그립수정. 기존6칸/원본보존+전후비교. 2.6호출0, SD대기.\n',encoding='utf-8')
(H/'5_버전관리.md').write_text('# 차수2 이력\n작업대장원작업42D3D4BB 수정차수2이며차수1은이전차수/v001과원출력_v001에보존. 이폴더는승인/발송기록이며새제작물은신규_v002경로. Gitcommit/push없음.\n',encoding='utf-8')
print(json.dumps({'task':l['task'],'iteration':2,'state':l['state']},ensure_ascii=False),flush=True)
