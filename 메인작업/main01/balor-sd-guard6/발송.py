from pathlib import Path
import json,subprocess,importlib.util
H=Path(__file__).resolve().parent;R=Path('C:/Users/user/Desktop/Grid Defenders');receipt=H/'실제발송영수증.json'
if receipt.exists():raise SystemExit('Receipt exists; inspect before repeating.')
l=json.loads((H/'연결.json').read_text(encoding='utf-8'))
body=f'''main01 신규 승인 제작 {l['task']} / 차수1 / role characters.
사용자가내장일러스트수정본불합격과2.6일러스트기준SD전투태세진행을명시했고개수를'내장도3장2.6도3장'으로확정했습니다. 정면0/우측35/우측90 내장3+GPT Image2.6 3, 총6개새SD원본. 기존일러스트정면을결과SD로대체하지않습니다.
공통포즈: 오른쪽적을방패로막을준비를하는전투태세,왼방패를전방으로받치고오른손검을자연스럽게쥠. 기존일러스트입상유지가아닌사용자요청새전투태세. 자연손목/그립·일체직선검·방패팔연결·시점/그림체/두상몸통결합비율을독립검수. 1번SD화풍표본과선택2.6일러스트의참조역할을분리.
필독자동첨부를포함한전체전문지시 본문: {l['plan']['prompt']}
원작업42D3D4BB와별개신규작업의현재ACK/read-pack/start를통과후생성. 새2.6허가는이번3장초기POST3에만있으며이전금지범위와혼동하지말고자동재시도/추가유료/대체모델금지. 내장은자기built-in tool,2.6은기존승인image-studio연결. 전역doctor의API없음은프로젝트.local키경로부재판정이아닙니다. 키를출력하거나재등록을반복요구하지마세요.
허용새output: {l['output']}
고해상도6원본/실제프롬프트·route/requestId/usage/SHA보존,위내장0/35/90아래2.6 0/35/90 비교와본체72CSSpx·3번표시. 밝음/어두움/실필드에서배경판잔여/손목·검·방패를실제확인하고결함은미달로보고.
이전원본/반려기록/타팀/공통규정/게임/사용자창/키설정/Git변경금지. SD리깅·애니메이션·게임통합은후속대기. 공식새Task/Dispatch worker_done으로main01에원작업번호/차수1/실제6장·보고·검수·페이지경로/호출횟수와usage/한계를반환. 사용자미적합격은대기입니다.'''
cmd=['C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe','orchestration','send','--to','dispatch:'+l['targetDispatch'],'--type','dispatch','--subject',l['task']+' 신규승인: 발로르SD전투태세0·35·90 내장3+2.6 3','--body',body,'--json']
cp=subprocess.run(cmd,capture_output=True,text=True,encoding='utf-8',errors='replace');receipt.write_text(cp.stdout+('\n'+cp.stderr if cp.stderr else ''),encoding='utf-8');print(cp.stdout,flush=True)
if cp.returncode:raise SystemExit(cp.returncode)
d=json.loads(cp.stdout)
if not d.get('ok'):raise SystemExit('Unconfirmed delivery; inspect before recovery, do not duplicate.')
spec=importlib.util.spec_from_file_location('board',R/'작업관리/도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(R/'작업관리');b.record(l['task'],'main01','sent',receipt)
l.update(state='delivery_receipt_recorded',delivery=d['result']);(H/'연결.json').write_text(json.dumps(l,ensure_ascii=False,indent=2),encoding='utf-8')
(H/'3_작업일지.md').write_text('# 작업일지\nユーザー\n',encoding='utf-8')
(H/'3_작업일지.md').write_text('# 작업일지\n사용자SD진행·각3장확인→반려이력/선택2.6원형/SD1번표본/표시기준확인→비과금doctor→신규작업·필독·승인근거·전문지시준비→기존팀장공식후속발송/영수증연결. 실제새ACK/start와생성회신대기.\n',encoding='utf-8')
(H/'4_정의문서.md').write_text('# 정의\n내장0/35/90 3장+2.6 0/35/90 3장의발로르SD방패전투태세. 외형2.6일러/SD표현1번표본/72CSSpx·3번. 실제호출/출력/비교검수후사용자판정. 리깅·게임통합대기.\n',encoding='utf-8')
(H/'5_버전관리.md').write_text('# 버전관리\n신규원작업 차수1. 이전42D3D4BB은사용자불합격후재제작보류이며이번새SD작업과구분. 모든기존원본/카탈로그/프로젝트설정보존. 이번새output만허용. commit/push없음.\n',encoding='utf-8')
print(json.dumps({'task':l['task'],'state':l['state'],'expectedImages':6},ensure_ascii=False),flush=True)
