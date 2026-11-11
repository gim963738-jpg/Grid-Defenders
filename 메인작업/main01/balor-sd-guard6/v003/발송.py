from pathlib import Path
import importlib.util,json,subprocess
H=Path(__file__).resolve().parent;R=Path('C:/Users/user/Desktop/Grid Defenders');receipt=H/'실제발송영수증.json'
if receipt.exists():raise SystemExit('Receipt exists; inspect official state, do not resend.')
c=json.loads((H/'연결.json').read_text(encoding='utf-8'));assert c['state']=='prepared_not_sent' and c['iteration']==3
body=f'''main01 사용자 확인 수정 {c['task']} / 차수3 / characters.
사용자는 차수2에 대해 그림을 캔버스 안에서 등비로 조금 줄여 여백을 확보하고 검길이를 늘리라 했으며, 추가로 발사이 간격 조금 넓힘·자세 조금 더 낮춤·자연스러운 자세를 명시했습니다. 메인이 이 조건과2.6 SD35 단일편집으로 이해 확인한 뒤 실제 '진행'을 받았습니다. 전체합격/다른방향제작은 아닙니다.
자동필독첨부 전체전문지시: {c['plan']['prompt']}
현재차수3 전체본문·최신피드백을 읽고 새ACK/read-pack/start 통과 후 제작하세요. 차수2 ACK/허가 재사용금지.
편집 원본은 반드시 {c['sourceOutput']}/final/right-035.png 입니다. 기존 낮은검/자연그립과2.6 SD35 화풍·얼굴·35도·신체비율·방패를 유지하며 작게 수정합니다. 빨간선 보조는 {H/'사용자검위치표시.png'} 이고 옛 높은검으로 되돌리지 않습니다.
자연스러운 안정된 방어태세가 최우선: 양발간격을 조금 넓히고 무릎/골반을 조금 낮추되 깊은웅크림/찢어진다리/억지손목/몸비율변화 금지. 현재 완만한 왼쪽아래 검각도·그립을 유지하고 검날을 조금 더 길게, 충분한 투명여백을 위해 캐릭터+장비 전체를 캔버스 안에서 등비로 조금 작게 배치. 같은 본체키 비교에서 실제 검이 길어졌는지와 여백을 별도 확인하세요. 4px검끝여백·검짧아짐을 반복하지 마세요.
명시허가 GPT Image2.6 edits 최초1POST만, 기존 image-studio 승인연결 읽기전용. 자동재시도/추가유료보완/내장대체/모델폴백0. 키출력/설정변경 금지. 원본바이트·프롬프트·요청/usage/SHA를 보존하고 미달은 failed로 실제결과와 반환하세요.
허용새output: {c['output']}
차수2/이번수정/금발전사의 동일본체키 비교+동일캔버스배율 전후·기존6장 보존·72CSSpx/3번 DPR1·2 밝음/어두움/필드 검수. 자세·지지발/무게중심·검날길이/검끝여백·자연손목·일체검축·35도/화풍을 실제 눈으로 독립검수. 이전원본/0·90/내장/타팀/공유규정/카탈로그/게임/리깅/애니메이션/사용자창/Git변경0. 공식 새Task/Dispatch worker_done으로 원작업 차수3·실제1장/전후페이지/보고/검수경로·호출/usage·한계를 main01에 반환하세요.'''
cmd=['C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe','orchestration','send','--to','dispatch:'+c['targetDispatch'],'--type','dispatch','--subject',c['task']+' 차수3 승인: 자연스러운 낮은자세·발간격·긴검·여백 2.6수정1장','--body',body,'--json']
cp=subprocess.run(cmd,capture_output=True,text=True,encoding='utf-8',errors='replace');receipt.write_text(cp.stdout+('\n'+cp.stderr if cp.stderr else ''),encoding='utf-8');print(cp.stdout,flush=True)
if cp.returncode:raise SystemExit(cp.returncode)
d=json.loads(cp.stdout)
if not d.get('ok'):raise SystemExit('Delivery unconfirmed; do not duplicate.')
spec=importlib.util.spec_from_file_location('board',R/'작업관리/도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(R/'작업관리');b.record(c['task'],'main01','sent',receipt)
c.update(state='delivery_receipt_recorded',delivery=d['result']);(H/'연결.json').write_text(json.dumps(c,ensure_ascii=False,indent=2),encoding='utf-8')
with (H/'3_작업일지.md').open('a',encoding='utf-8') as f:f.write('\n공식 기존characters 담당으로 차수3 후속발송·영수증 연결. 현재필독/착수·실제생성/검수 회신대기.\n')
print(json.dumps({'task':c['task'],'iteration':3,'state':c['state']},ensure_ascii=False))
