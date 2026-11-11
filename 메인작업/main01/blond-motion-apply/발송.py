from pathlib import Path
import importlib.util,json,subprocess

H=Path(__file__).resolve().parent;R=Path('C:/Users/user/Desktop/Grid Defenders');receipt=H/'실제발송영수증.json'
if receipt.exists():raise SystemExit('시도 영수증이 있습니다. 중복 발송하지 않습니다.')
c=json.loads((H/'연결.json').read_text(encoding='utf-8'));assert c['state']=='prepared_not_sent'
body=f'''main01 신규 사용자 승인 {c['task']} / 차수1 / gameplay.
전체 전문지시 및 이번 필독 자동첨부: {c['plan']['prompt']}
사용자는 사거리100·스킬없이평타만,웨이브고정대기/순차평타/딜레이대기,보스3초대기/이동달리기/넉백때만피격/HP0사망까지와 '마지막 연결했던 기준으로 진행해줘'를 지시했습니다. 터틀보스·공격시점동기피해/3색슬라임친위대각1·겹침방지/영웅상단표시도동시에요청했습니다. 달리기질문에 '달리기 추가하고 피격은 넉백시에만 모션적용'이라고정정했으므로재확인대기하지마세요.
현재차수 read-pack본문→문서별적용/현재SHA ACK→start 후착수. 과거ACK/옛게임개발baseline재사용금지. 이번전용기준사본 {c['baseline']} (상세 {c['baselineManifest']}) 은지금5173에서사용중인root게임과해시대조했습니다. 자기새 {c['output']}/game 으로복사해구현/검증하고root게임은직접수정하지마세요. 기존미커밋/타팀/사용자플레이보존,실제변경목록·patch·전후SHA를반환해main01이정확한파일만실게임적용합니다.
마지막금발연결기준은내장03→04→05첫7→신규3/4 06전체12. 타격프레임종료03-6/04-5/05-6/06-5. 상세인수/원본경로와160ms·1.5배속사용자상태근거전문지시참조. 각평타1피해,공격사이에대기/쿨다운,원본완성시트보존·메타frameRects재생.2.6/새이미지/Grok/영상0.
터틀v07after 원본4시트: weak접촉570ms,strong1205ms에모델1회피해. 노랑일반·파랑물방·빨강마방친위대각1,보스포함총4적. 발점/간격충돌과그림여백·무기·피해범위분리. 약간겹쳐도actor레이어내영웅최상단(이펙트·HP등UI는보존).0HP즉시숨김을해제해사망을끝까지표시,넉백없는일반피격으로hurt재생금지.
준비/모션/피해/배속·정지/저장복구시간축/실제다수유닛간격과메타출처·원본SHA·적절한테스트/빌드/격리headless화면으로검증하세요. 실제모델에넉백없으면없는것을명시하고피격진입계약은합성검사하며임의넉백새기믹추가0. 필요한모호한구현선택은기존범위에서합리적으로완성하고한계를정직하게기록합니다.
사용자화면/탭/서버5173조작0,검증서버필요시127.0.0.1 OS임시포트만격리사용후종료. 기존게임/다른영웅·로비기획/계정·키/공유규정/Git수정0. 이번원작업5종기록·검사·패치·원본에셋해시·한계를취합하여공식새Task/Dispatch worker_done으로main01 run_47ce1a81d7b1에반환하세요. 완료한핵심단계는status로중간회신가능합니다.'''
cmd=['C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe','orchestration','send','--to','dispatch:'+c['targetDispatch'],'--type','dispatch','--subject',c['task']+' 금발 평타·사거리100 / 터틀보스·3색친위대 실게임 적용','--body',body,'--json']
cp=subprocess.run(cmd,capture_output=True,text=True,encoding='utf-8',errors='replace');receipt.write_text(cp.stdout+('\n'+cp.stderr if cp.stderr else ''),encoding='utf-8');print(cp.stdout,flush=True)
if cp.returncode:raise SystemExit(cp.returncode)
d=json.loads(cp.stdout)
if not d.get('ok'):raise SystemExit('전달 미확인. 공식 복구절차로 확인하고 중복 발송하지 마세요.')
spec=importlib.util.spec_from_file_location('board',R/'작업관리/도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(R/'작업관리');b.record(c['task'],'main01','sent',receipt)
c.update(state='delivery_receipt_recorded',delivery=d['result']);(H/'연결.json').write_text(json.dumps(c,ensure_ascii=False,indent=2),encoding='utf-8')
with (H/'3_작업일지.md').open('a',encoding='utf-8') as f:f.write('\n현재main01Run의기존gameplay담당에공식후속발송·실제영수증연결. 이번차수필독/착수·구현반환대기. root게임아직수정전.\n')
print(json.dumps({'task':c['task'],'state':c['state']},ensure_ascii=False))
