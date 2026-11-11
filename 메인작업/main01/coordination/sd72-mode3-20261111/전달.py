from pathlib import Path
import subprocess,json,hashlib
H=Path(__file__).resolve().parent
R=Path('C:/Users/user/Desktop/Grid Defenders')
doc=R/'작업관리/기준/characters/SD_72CSSpx_표시기준.md'
exe='C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe'
targets=[('main02','run:run_2939978c8e65'),('main03','run:run_b29b47372e51'),('characters','dispatch:ctx_1309a44d772a'),('ui','dispatch:ctx_5d6959703eb5')]
body=f'''사용자 확정 방향 전달(main01, 신규 콘텐츠 제작 지시 아님). 원문: “캐릭터만들고 72px사이즈로 뽑고 표시방법은 3번으로 정리하면되겠다” / “작업지시방향 전달해줘”.
공유 기준 본문: {doc}
고해상도 승인 원본 보존 → 본체72 CSSpx 출력/표시 → 기존 비교도구3번(고품질 축소+보수적 경계정리). PNG캔버스 전체72px/파츠원본72px 지시가 아니며, 본체·여백·장비·DPR을 구분. 캐릭터별 메타 사용, 보스 크기/기존 미합격 디자인/동작/속도/판정은 변경하지 않음. 현재 게임 일괄 적용 지시도 아님. 현 비교도구 경계처리와2번의 차이가 작은 사실도 유지.
본인 작업연결.json의 requiredReadings·작업진행방법·분야 규정·관련 작품 최신 기준 및 위 새 문서를 본문으로 읽고, 적용 요약과 충돌 유무만 회신 바랍니다. 메인02/03은 후속 SD지시 필독에 첨부하고 자기 담당 sprites 등에도 범위 내 공유. characters는 필요 시 자기 하위 담당에게 같은 경계를 전달. ui는 추후 승인된 적용 작업에서 참조.
현재 진행 중인 타 작업 원본/필독 해시를 공지 때문에 자동 수정하거나 다른 메인 작업을 중복 발송하지 마세요. 신규 이미지/API/리깅/게임수정/통합/화면조작/커밋푸시 금지. 이번 공지만으로2.6 사용허가가 생기지 않음. 공지 수신·읽음 확인만 요청합니다.'''
for role,to in targets:
 receipt=H/f'{role}-receipt.json'
 if receipt.exists():
  print(json.dumps({'role':role,'alreadySent':True}));continue
 cp=subprocess.run([exe,'orchestration','send','--to',to,'--type','status','--subject','SD 표시 기준 확정: 본체72 CSSpx·3번 처리 (기준 공유만)','--body',body,'--json'],capture_output=True,text=True,encoding='utf-8')
 receipt.write_text(cp.stdout,encoding='utf-8')
 if cp.returncode:raise SystemExit(cp.stderr or cp.stdout)
 data=json.loads(cp.stdout)
 (H/f'{role}-delivery.json').write_text(json.dumps({'recipient':to,'document':str(doc),'sha256':hashlib.sha256(doc.read_bytes()).hexdigest(),'receipt':data,'scope':'policy_notice_only'},ensure_ascii=False,indent=2),encoding='utf-8')
 print(json.dumps({'role':role,'result':data},ensure_ascii=False))
