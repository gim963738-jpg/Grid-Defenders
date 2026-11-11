from pathlib import Path
import json,subprocess,importlib.util
H=Path(__file__).resolve().parent;R=Path('C:/Users/user/Desktop/Grid Defenders');receipt=H/'실제발송영수증.json'
if receipt.exists():raise SystemExit('Receipt exists. Inspect before repeating.')
l=json.loads((H/'연결.json').read_text(encoding='utf-8'))
body=f'''{l['task']} / 수정차수3 / main01 → characters. 사용자최신3문제이해확인뒤실제'진행'승인완료.
수정2장: v001원내장35와90. v002는그림체/포즈/손목이반려됐으므로타깃/긍정참조에서제외.
이번핵심: 내장원그림체·기본입상/팔큰위치를보존하며각도별기존2.6의자연손목·그립을해부학참고로국소교정→그자연손과일체형검축연결. 손목을괴상하게만들면서검만곧게세우는수직검포즈해법금지. 몸통/시선참고도그림체·포즈보존우선. 기존2.6손목참고를전체화풍으로전이하지말고입력역할을구분.
필수전체전문지시 및 새필독자동첨부: {l['plan']['prompt']}
이번차수3본문전부새로읽기→문서별적용ACK→characters start통과후편집. 차수2기술통과보고보다사용자반려3문제가우선이며과거ACK재사용금지.
출력허용: {l['output']}
35/90최종2장을페이지첫6칸비교에서동시에보이게하고각도별그림체/포즈/자연손목/검전체/방패견장검수를독립적으로보고. 유료2.6/API/env열람0,내장편집만. 원본/이전6칸/카탈로그/타팀/게임/사용자화면/Git불변. SD/리깅대기.
공식새Task/Dispatch worker_done으로main01에원작업번호/차수3·실물2개·보고/검수/한계·내장회수·API0을회신하세요.'''
cmd=['C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe','orchestration','send','--to','dispatch:'+l['targetDispatch'],'--type','dispatch','--subject',l['task']+' v003 승인: 내장35·90 그림체/손목/검각도 재수정','--body',body,'--json']
cp=subprocess.run(cmd,capture_output=True,text=True,encoding='utf-8',errors='replace');receipt.write_text(cp.stdout+('\n'+cp.stderr if cp.stderr else ''),encoding='utf-8');print(cp.stdout,flush=True)
if cp.returncode:raise SystemExit(cp.returncode)
d=json.loads(cp.stdout)
if not d.get('ok'):raise SystemExit('Delivery unclear; inspect before recovery, do not duplicate.')
spec=importlib.util.spec_from_file_location('board',R/'작업관리/도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(R/'작업관리');b.record(l['task'],'main01','sent',receipt)
l.update(state='delivery_receipt_recorded',delivery=d['result']);(H/'연결.json').write_text(json.dumps(l,ensure_ascii=False,indent=2),encoding='utf-8')
(H/'3_작업일지.md').write_text('# 차수3 작업일지\n사용자3문제/두방향정정과진행승인→규정/원본/반려/담당확인→차수2보존revise→차수3필독/확인/전문지시준비→공식후속발송과영수증연결. 실제제작/새ACK착수회신대기.\n',encoding='utf-8')
(H/'4_정의문서.md').write_text('# 차수3 정의\n내장35와90각1장. 원내장그림체/기본자세보존,각도별2.6해부학그립참고,자연손목과검전체연결. v002수직검포즈사용금지. 전후/2.6참고를같은첫6칸에서비교. API0/SD대기.\n',encoding='utf-8')
(H/'5_버전관리.md').write_text('# 차수3 이력\n원작업42D3D4BB의차수3. 이전차수/v002와원output_v002는반려이력으로보존. v001원내장/기존2.6/승인정면은읽기전용. 새output_v003만제작허용. 커밋/푸시없음.\n',encoding='utf-8')
print(json.dumps({'task':l['task'],'iteration':3,'state':l['state']},ensure_ascii=False),flush=True)
