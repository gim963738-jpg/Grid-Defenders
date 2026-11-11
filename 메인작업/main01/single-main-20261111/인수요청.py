from pathlib import Path
import subprocess,json
H=Path(__file__).resolve().parent
CLI='C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe'
for role,runid in [('main02','run_2939978c8e65'),('main03','run_b29b47372e51')]:
 receipt=H/(role+'-인수요청영수증.json')
 if receipt.exists():continue
 body=f'''사용자 직접 운영변경 요청: 메인그냥 1번만 쓰는걸로하고 2번 3번 없애자 없애기전에 자료가지고있는 메인있으면 자료만 가지고오고 정리해줘.
main01이 메인02/03 자료와 담당작업을 인수 후 두 메인의 Orca 운영을 종료하는 작업입니다. 새 콘텐츠 제작/유료호출/Git저장 지시가 아닙니다.
지금부터 새 제작·수정 하달이나 공유규정/원본 변경은 하지 말고, 본인 보유 고유자료·작업기록/승인·피드백·미완료 작업·대기 Task/Dispatch/Run·사용 중인 URL/서버·키값 없는 연결 정보·후속사항을 간단히 인수인계해 주세요. 별도 복제편집자나 신규 생성은 만들지 마세요.
기존 승인 제작이 실제로 진행중이면 이를 임의 취소하지 말고 정확한 담당/파일/상태와 회신 연결 방법부터 보고하세요. 이미 완료/반환된 산출물·미커밋 자료는 모두 보존하며, 본인 작업공간/브랜치를 삭제하거나 이동하지 마세요. main01이 백업/해시검증 후 공식 정리합니다.
인수문서 작성 허용: C:/Users/user/Desktop/Grid Defenders/메인작업/main01/single-main-20261111/{role}-인수인계.md
shared 작업대장 원작업번호/사용자판정은 보존하고 자료 원본경로와 실제중요한 항목을 적어 주세요. 자격증명 값/키는 문서/채팅에 쓰지 마세요. 전문자료가 타팀공간에 있으면 파일을 새로 복사하지 말고 원본 위치를 연결하세요.
준비 후 공식 main01 run_47ce1a81d7b1에 회신하고 더 작업하지 말고 대기하세요. 이 인수요청은 사용자의 명시적 운영정리 지시 범위라 별도 진행 재확인은 필요없습니다.'''
 p=subprocess.run([CLI,'orchestration','send','--to','run:'+runid,'--type','status','--subject','단일메인 전환: '+role+' 자료·작업 인수 후 운영종료 준비','--body',body,'--json'],capture_output=True,text=True,encoding='utf-8',errors='replace')
 receipt.write_text(p.stdout+('\n'+p.stderr if p.stderr else ''),encoding='utf-8');print(role,p.stdout,flush=True)
 if p.returncode or not json.loads(p.stdout).get('ok'):raise SystemExit('Unconfirmed delivery; inspect, do not resend.')
