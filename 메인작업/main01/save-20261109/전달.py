from pathlib import Path
import json,subprocess
ROOT=Path('C:/Users/user/Desktop/Grid Defenders'); HERE=Path(__file__).resolve().parent
target=HERE/'운영전달결과.json'
if target.exists():raise SystemExit('Already sent; inspect receipts before retry.')
exe='C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe'
policy=ROOT/'작업관리/저장운영규정.md'
body=f'''사용자 최신 직접 지시: “이제 자동저장하지말고 내가 저장하라할때만 하는걸로 하고 저장할때 작업기록 먼저 작성하고 올리는걸로 하자 지금 말나온김에 저장한번하고”. {policy} 본문을 읽고 적용하세요. 이후 사용자 저장 요청 없이 커밋/푸시/예약백업을 자동 수행하지 않습니다. 제작 파일 작성/착수 최소근거와 게임 플레이 저장을 끄는 의미는 아닙니다. 저장 요청 때 작업 기록 먼저 작성하고 검증/커밋/업로드/원격해시 확인 순서입니다. main01이 지금 요청 1회 저장을 수행하므로 별도 중복 커밋/푸시는 하지 마세요. 기존 작업 계속, 사용자 창/패널 조작 없음. 원본 HEAD/index/작업 파일은 바꾸지 않고 각 작업 공간의 안전한 현재 산출물을 별도 보관 브랜치에 시점 스냅샷으로 올릴 예정이며 WIP는 WIP로 표시합니다. node_modules/브라우저 프로필/캐시/키 제외. 본인 하위 작업자에도 저장 규칙을 전달하고 적용 여부만 회신해주세요. 이번 공지는 제작 범위/승인을 바꾸지 않습니다.'''
recipients={'main02':'run:run_2939978c8e65','main03':'run:run_b29b47372e51','characters':'dispatch:ctx_b7b65fa7d54b'}
result={}
for role,dest in recipients.items():
 p=subprocess.run([exe,'orchestration','send','--to',dest,'--subject','사용자 저장 요청 때만 기록→커밋→GitHub 업로드 / 이번 저장은 main01 담당','--type','status','--body',body,'--json'],capture_output=True,encoding='utf-8')
 try:r=json.loads(p.stdout[p.stdout.index('{'):])
 except (ValueError,json.JSONDecodeError):r={'ok':False,'stderr':p.stderr,'stdout':p.stdout}
 result[role]=r;target.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(result,ensure_ascii=False,indent=2))
