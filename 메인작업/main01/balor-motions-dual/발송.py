from pathlib import Path
import importlib.util, json, subprocess

H=Path(__file__).resolve().parent; R=Path('C:/Users/user/Desktop/Grid Defenders'); receipt=H/'실제발송영수증.json'
if receipt.exists(): raise SystemExit('영수증이 있습니다. 중복 발송하지 않습니다.')
c=json.loads((H/'연결.json').read_text(encoding='utf-8')); assert c['state']=='prepared_not_sent'
body=f'''main01 승인 신규 작업 {c['task']} / 차수1 / characters.
사용자: 발로르 전투태세 합격 후 '2.6과 내부 스프라이트시트 만든다',9종·거인 궁극기 동작을 상세 확정하고 총정리 뒤 '진행'. 이번 범위2.6 명시 허가입니다. 과거 다른 작업 허가 재사용 아님.
전체 전문지시 및 현재 필독 자동첨부: {c['plan']['prompt']}
먼저 read-pack 본문/최신 발로르합격·동작설계·각 규정 실제 읽기→현재차수 ACK→start. 이전 레나/전투태세 ACK 재사용 금지. 단일 메인 main01 run_47ce1a81d7b1으로 공식 새 Task/Dispatch worker_done 회신.
사용자 합격 마스터 {c['master']} 실제 열고 참조 입력 첨부. 자연스러움·본체크기/장비길이 유지. 서로 다른포즈13시트를 내장/2.6 같은 동작설계로 제작합니다. 내장13최초호출,2.6은공통90기준2+시트13=15최초POST 한도(구현편성값,사용자직접지정수치아님). 자동재시도/추가유료/Grok/영상/모델폴백0. 기존승인 image-studio 연결 읽기전용,키노출0.
스킬1 방패모서리로 횡방향 후려침. 스킬2 방패35도 바닥강타고정→검세우며90도 서서기사도자세. 궁극기는 발로르 그자세로정지, 뒤의큰백색중갑기사거인: 준비소멸역재생소환→방패머리위로크게들어무겁게강타(독립시트)→방패사라지고대검크고높게들어강하게내려찍기→타격자세유지·검부터흰입자로분해·왼쪽바람에소멸. 소환용준비소멸과타격후소멸은별개. 연결13동작정의는전문지시/동작설계에있습니다.
새 출력 {c['output']}. 원본완성시트바이트보존/frameRects로재생,프레임별bbox확대축소/코드로몸·무기·입자재그림/시트재조립0.72CSSpx표시3번·밝음/어두움/실필드·A/B재생·전체궁극기연결·프레임/속도조절(사용자가최종속도결정). 네이티브시트26개 기대목록/공통작업원형2/프롬프트·호출기록·검수·실제사용량을제출. 원형은임시작업기준,최종합격표시0.
순서/접지/체격/그립·검축/방패·대검큰힘모음과타격/연결경계/알파·잘림을실제전프레임확인. 부족은정직하게기록하고자동보완루프없이실물반환. 레나처럼자세/화풍만검수하는별개제한은이번에적용하지않습니다. 완료한소묶음은status실물중간회신가능. 필요하위담당은같은원작업/방법/필독·2.6상한승계,파일중복편집0.
기존작업/공유규정/게임런타임/피해판정·스킬수치/리깅/카탈로그/설정/사용자창/새서버/Git변경0. 기존5173게시(main01)는후속에서실시합니다. 정직한실제성공·실패/주의로보고하며사용자합격은대기입니다.'''
cmd=['C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe','orchestration','send','--to','dispatch:'+c['targetDispatch'],'--type','dispatch','--subject',c['task']+' 발로르9종·거인 궁극기 / 내장·2.6 스프라이트','--body',body,'--json']
cp=subprocess.run(cmd,capture_output=True,text=True,encoding='utf-8',errors='replace'); receipt.write_text(cp.stdout+('\n'+cp.stderr if cp.stderr else ''),encoding='utf-8'); print(cp.stdout,flush=True)
if cp.returncode: raise SystemExit(cp.returncode)
d=json.loads(cp.stdout)
if not d.get('ok'): raise SystemExit('송신 미확인. 중복 발송 대신 공식 복구 절차로 확인하세요.')
spec=importlib.util.spec_from_file_location('board',R/'작업관리/도구/작업대장.py'); m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m); b=m.Board(R/'작업관리')
b.record(c['task'],'main01','sent',receipt); c.update(state='delivery_receipt_recorded',delivery=d['result']); (H/'연결.json').write_text(json.dumps(c,ensure_ascii=False,indent=2),encoding='utf-8')
with (H/'3_작업일지.md').open('a',encoding='utf-8') as f: f.write('\n기존 characters 담당에 공식 후속 발송/실제 영수증을 연결했다. 현재 차수 필독·착수 및 실물 제작 회신 대기.\n')
print(json.dumps({'task':c['task'],'state':c['state'],'expectedSheets':26},ensure_ascii=False))
