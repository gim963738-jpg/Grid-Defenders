from pathlib import Path
import importlib.util
import json
import subprocess

H=Path(__file__).resolve().parent
R=Path('C:/Users/user/Desktop/Grid Defenders')
receipt=H/'실제발송영수증.json'
if receipt.exists():
    raise SystemExit('Receipt exists; do not resend. Inspect official recovery state.')
c=json.loads((H/'연결.json').read_text(encoding='utf-8'))
assert c['state']=='prepared_not_sent' and c['iteration']==2
body=f'''main01 사용자 승인 수정 {c['task']} / 차수2 / characters.
사용자 원문: 자세를 약간만 더 낮추고 검을 빨간선위치 근처로 보내고 저런 각도로 잡고있는 모습인데 검은 지금보다 조금더 길게 뽑아서 35 수정해달라고 2.6에게 전달해줘.
메인이 검손을 내려 칼끝이 화면 왼쪽 아래로 향하는 완만한 대각선, 무릎/골반 약간 낮춤, 검 조금 길게, 자연손목/일체직선검축,35°/기존2.6 SD화풍/방패/외형유지로 이해 확인했고 사용자가 '진행'이라고 승인했습니다.
전체 전문지시/현재차수 필독 자동첨부 본문: {c['plan']['prompt']}
반드시 전체 본문을 읽고 현재차수2 read-pack→새적용요약ACK→start 통과 후 작업. 차수1 ACK/유료허가 재사용 금지.
수정 원본: {c['sourceOutput']}/image26/right-035.png
실제 첨부할 사용자 표시: {H/'사용자검위치표시.png'}
깨끗한 원본과 빨간선 가이드를 실제2.6 edits 호출에 첨부하고 역할을 분리하세요. 이번 GPT Image2.6 편집은 최초1POST만 명시허가, 자동재시도/추가유료보완/내장대체/모델폴백0. 기존 image-studio 승인연결을 읽기전용사용, 키노출/설정변경 금지.
신규 output: {c['output']}
기존6장/금발전사원본보존, 새수정35 PNG와 기존35/수정35/금발전사의 동일키전후 비교 및 기존6장 비교·본체72CSSpx/표시3번·밝음/어두움/실필드 검수. 0/90/내장 추가생성 금지. 검의 새각도를 맞추기 위해 그림체/얼굴/방패/장비좌우/카메라/인물비율을 바꾸지 마세요. 검끝 여백 확보, 자연손목·일체검축을 독립 검수.
기존원본/다른작업/게임런타임/사용자창·탭/공유규정/Git변경없음. 현재90미달은 범위밖으로 보존. 공식 새Task/Dispatch worker_done으로 원작업 차수2/실제이미지·전후페이지·보고·검수 절대경로/호출·usage·보존SHA·한계를 반환하세요. 핵심미달은 failed로 실물과 함께 보고하고 미적 합격은 사용자 판정 대기입니다.'''
cmd=['C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe','orchestration','send',
     '--to','dispatch:'+c['targetDispatch'],'--type','dispatch','--subject',c['task']+' 차수2 승인: 2.6 SD35 낮은자세·검위치/각도·길이 수정1장',
     '--body',body,'--json']
cp=subprocess.run(cmd,capture_output=True,text=True,encoding='utf-8',errors='replace')
receipt.write_text(cp.stdout+('\n'+cp.stderr if cp.stderr else ''),encoding='utf-8')
print(cp.stdout,flush=True)
if cp.returncode:raise SystemExit(cp.returncode)
reply=json.loads(cp.stdout)
if not reply.get('ok'):raise SystemExit('Delivery unconfirmed; do not duplicate.')
spec=importlib.util.spec_from_file_location('board',R/'작업관리/도구/작업대장.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
b=m.Board(R/'작업관리');b.record(c['task'],'main01','sent',receipt)
c.update(state='delivery_receipt_recorded',delivery=reply['result'])
(H/'연결.json').write_text(json.dumps(c,ensure_ascii=False,indent=2),encoding='utf-8')
with (H/'3_작업일지.md').open('a',encoding='utf-8') as f:
    f.write('\n공식 기존 characters 담당 Dispatch로 차수2 후속 지시 발송, 실제 영수증 연결. 현재차수 필독/착수와 생성·검수는 회신 대기.\n')
print(json.dumps({'task':c['task'],'iteration':2,'state':c['state']},ensure_ascii=False))
