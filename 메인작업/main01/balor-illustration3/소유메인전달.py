from pathlib import Path
import subprocess,json
here=Path(__file__).resolve().parent
d=json.loads((here/'연결.json').read_text(encoding='utf-8'));prompt=d['plan']['prompt']
body=f'''정정 및 실제 송신 요청: 방금 main01 직접 ctx_81f7538ea0a4 송신은 consumer_fenced(현재caller main01,소유run main03)로 명시 실패하여 새worker/Dispatch생성0건입니다. 실패영수증 {here/'실제발송영수증.json'}. 무응답재발송이아니며권한우회/새담당복제안합니다. 사용자실제진행승인근거 {here/'사용자확인.md'}.
main03 소유의 완료 splash 담당에게 아래 **기존에준비한동일지시**를 공식 orchestration send --to dispatch:ctx_81f7538ea0a4 --type dispatch --body <본문>으로 한 번 전달해 주세요. 발송지시 파일 {prompt}. 작업번호 {d['task']} / 차수1 / 담당main01 / 실행splash. 공유 Board는main01이prepare했고splash잠금소유도이작업입니다. main03새taskboard작업을만들거나main01작업/공통규정/사용자승인/잠금을변경하지마세요. 파일내용수정없이전달만합니다.
실제 CLI 송신 JSON을 {here/'main03-대리송신영수증.json'}에 저장하고 이 run:run_47ce1a81d7b1로즉시회신해 주세요. main01이그실제영수증으로record sent를연결합니다. worker는sent이후자기차수ACK/start통과후제작. main03가과거ACK/준비증거로착수대신하지않음. 이후worker_done은native main03Task를정리하고main01에도보고근거를공식전달해 주세요. 사용자3방향일러스트검수전SD생성금지. 원래요청은main01에서이미사용자진행승인을받았으므로동일허락재질문없음. 새원본/전후비교output만편집하며카탈로그/기존main03산출물/Git저장제외.'''
r=subprocess.run(['C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe','orchestration','send','--to','run:run_b29b47372e51','--type','question','--subject','소유권 경계 준수: 승인된 발로르 일러스트3방향 동일지시 대리송신 요청','--body',body,'--json'],capture_output=True,text=True,encoding='utf-8')
(here/'main03-대리송신요청영수증.json').write_text(r.stdout,encoding='utf-8');print(r.stdout)
