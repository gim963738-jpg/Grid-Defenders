import sys,json,importlib.util
from pathlib import Path
root=Path(r'C:\Users\user\Desktop\Grid Defenders\작업관리')
spec=importlib.util.spec_from_file_location('board',root/'도구/작업대장.py'); m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
b=m.Board(root)
proof=root/'작업/MAIN03-20261109-9D2018F2/범위정정_중단확인.md'
proof.write_text('사용자: 새 2명만 제작: 총 6장\nOrca msg_3cd88c504611 worker_done ctx_a34555321b08 outcome failed: 사용자 범위변경으로 기존4명 제작 취소·실행0건. start 전, 이미지생성0, 제품편집0. 메인 수신확인. CLI에는 start 전 취소명령이 없으므로 자기 작업만 writer 잠금 아래 cancelled 기록. 타메인 잠금 변경없음.\n',encoding='utf-8')
with b.writer():
 t=b.load('MAIN03-20261109-9D2018F2','main03')
 assert t['iteration']==2 and t['status']=='delivery_receipt_recorded'
 t['history'].append({'action':'cancelled_by_user_scope_change','at':m.now(),'iteration':2,'evidence':m.evidence(proof),'userQuote':'새 2명만 제작: 총 6장','productionStarted':False})
 t['status']='cancelled';b.save(t)
 leases=b.leases()
 if leases.get('splash',{}).get('task')==t['id']:
  del leases['splash'];m.write_json(root/'상태/브랜치잠금.json',leases)
req=root/'메인작업/main03/gc9-new-two-six-views/사용자요청.md'
req.write_text('사용자 신규참조: C:/Users/user/Downloads/A Collection of Official MapleStory(2) Artwork.jfif 얘는 남자; C:/Users/user/Downloads/🎀.jfif 얘는 여자. 피드백 받고 만든 결과물 보여주고 표정은 보통표정으로 일관되게 뽑아줘 자세도 서있는 자세로 일관되게\n메인 질문: 기존4명 추가 총6명인지 새2명만인지?\n사용자 답변 원문: 새 2명만 제작: 총 6장\n적용: 새2명 각 정면·화면오른쪽3/4·화면오른쪽측면 =6장. 기존4명 수정 제외. 앞선 피드백은 머릿결 유지/의상얼룩잔상배제/머리과대비율방지에 적용. 신규 남녀 성별명확.\n',encoding='utf-8')
t=b.new('main03','splash','GC9 신규 남녀2명 중립기립3방향6장',req.read_text(encoding='utf-8'))
print(t['id'])