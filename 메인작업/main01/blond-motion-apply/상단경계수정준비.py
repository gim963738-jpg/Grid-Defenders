from pathlib import Path
import hashlib,importlib.util,json
R=Path('C:/Users/user/Desktop/Grid Defenders');S=R/'작업관리';H=R/'메인작업/main01/blond-motion-apply'
P=H/'visual-spacing-v002';V=H/'visual-spacing-v003';V.mkdir(exist_ok=True)
if (V/'연결.json').exists():raise SystemExit('이미 준비된 경계 수정 작업입니다. 중복 금지.')
def read(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def write(p,d):Path(p).write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf-8')
c=read(P/'연결.json');O=Path(c['output']);r=read(O/'결과.json');manifest=read(O/'변경manifest.json')
assert r['outcome']=='succeeded' and r['dispatch']=='ctx_f49d6c6f7524'
rows=manifest['productFiles']+manifest['checkFiles'];verified=[]
for a in rows:
 p=R/'게임'/a['path'];current=sha(p) if p.exists() else None
 assert current==a['beforeSha256'] and sha(a['delivery'])==a['afterSha256']
 verified.append({'path':a['path'],'rootBeforeSha256':current,'v002AfterSha256':a['afterSha256'],'v002Delivery':a['delivery']})
write(V/'입력버전.json',{'rootStillV001':True,'v002NotIntegrated':True,'files':verified,'initialRoot71':str(P/'입력버전.json')})
issue='main01이 반환된 after-visual/arena-boss-late.png를 직접 열어 확인했다. 후반 보스 교전24.5초의 터틀 머리/상단 일부가 실제800×360 전장 윗경계에 잘린다. arena-crowd.png의 전체 몸통 분리 개선은 보이지만 후반 경계 문제가 남아 원래 지시의 새롭고 큰 클리핑 방지 조건을 충족하지 못한다. root8경로는 아직 v001 입력 SHA 그대로이며 수정본은 반영하지 않았다.'
(V/'경계피드백.md').write_text('# main01 반환 화면 검토 — 상단 잘림 보완\n\n'+issue+'\n\n사용자 원승인: '+str(H/'사용자승인.md')+'\n현재 수정은 원래 비중첩/화면 경계 계약의 보완이며 새 원화/크기/사거리 변경이 아니다.\n',encoding='utf-8')
spec=importlib.util.spec_from_file_location('board',S/'도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(S)
if b.load(c['task'],'main01')['status']=='in_progress':b.record(c['task'],'main01','returned',O/'결과.json')
c.update(state='returned_boundary_fix_pending',workerOutcome='succeeded',mainReviewIssue='main01 후반 상단 보스 잘림',report=str(O/'결과.json'),rootIntegrated=False,userAccepted=False);write(P/'연결.json',c)
proof=(H/'사용자승인.md').read_text(encoding='utf-8')
t=b.new('main01','gameplay','전장 v002 보스 교전 후반 상단 잘림 보완 — 원본 크기 유지',proof);tid=t['id'];F=b.folder(tid)
W=Path('C:/Users/user/orca/workspaces/Grid Defenders/게임개발');out=W/'output'/('blond-turtle-spacing-boundary_'+tid.lower()+'_v003')
prompt=f'''# {tid} / 차수1 / gameplay — v002 후반 상단 잘림 보완
main01 run_47ce1a81d7b1. 원작업 MAIN01-20261111-1EB56391 / v002 {c['task']} succeeded 반환.
원래 승인 {H/'사용자승인.md'}와 기존 v002 지시의 “화면밖 밀림/새롭고 큰 클리핑 방지” 범위 내 필수 수정입니다.
동일 허락을 다시 묻지 말고 새 read-pack 본문→현재 SHA/문서별 적용 ACK→start 후 착수합니다.

main01 확인: {V/'경계피드백.md'} 및 {O/'after-visual/arena-boss-late.png'}를 실제로 열어 봅니다.
전장24.5초에서 터틀 머리가 상단에 크게 잘립니다. 분리 proxy 면적0/64프레임 등록/초기 안전위치만으로 이 후반 문제를 검증했다고 하지 않습니다.
v002의 몸통 분리와 고정 앞발 등록 개선은 유지하며, 후기 실제 표시 경계까지 보완합니다.
현재 root5173는 아직 v001이고 새8경로는 main01이 직접 before SHA 대조했습니다. {V/'입력버전.json'}을 읽습니다.

작업 입력은 {O/'game'}의 구현완료 v002, 수정은 자기 새 {out/'game'}에서만 합니다.
기존 의존성은 읽기 전용 재사용하고 node_modules/dist/브라우저프로필/캐시는 복제하지 않습니다.
root/UI/5173/사용자 창·진행 저장·타팀·v002 결과·원본 PNG는 읽기 전용입니다.
최종 누적 통합.patch/manifest의 before는 v002가 아니라 현재 root v001 SHA여야 main01이 좁게 반영할 수 있습니다.
v002 before/src와 초기 root71 입력을 사용해 최종 누적4소스/관련 검사만 전달하며 옛204 baseline으로 되돌리지 않습니다.

필수 보완:
- 터틀의 고정 앞발 contact40/270, 본체180CSS·230source 참조, 원본64프레임/PNG와 사거리100 등 수치/타격/순서/3초를 유지합니다.
- 실제 표시되는 머리/뿔·몸·발 등 전체 외형의 고정 최대 범위를 보고, 통상 이동/교전에서도 전장 상단/우측/하단 안에 보이게 합니다.
  초기 spawn만 아니라 매 이동·간격 재배치·저장 복구에서 일관된 경계 조건을 적용합니다.
  프레임별 bbox 확대축소/카메라 변경·전장 임의확대/마스크 숨김/원본 잘림/보스 조기숨김·크기축소/사거리확장으로 회피하지 않습니다.
  원본 전체 투명 캔버스를 무조건 거대 충돌 원으로 삼지 말고 표시 경계와 발/공격 접촉을 구분합니다.
- 고정 경계에서 boss와 일반병사/금발·3슬라임이 유한하고 안정적으로 움직이며 실제 공격할 수 있어야 합니다.
  위쪽 아군을 향해 계속 이동/보정 충돌하거나 서기 간격이 깨지거나 후방 우회·저장 재현이 달라지는 문제를 함께 확인합니다.
- 기존 영웅 상단·actor/HUD/effect 순서와 중앙 HUD, 웨이브 고정 배치를 보존합니다.

검증:
1. 동일18개체/RNG1/autoSkills=false와 기존7시점의 전체800×360 원배경·명암 수정전후를 보존합니다.
   특히 보스가 살아 실제 교전하는 후기(기존19.5/24.5초 포함)와 상단·우측 근처까지 확인합니다.
   보스가 먼저 죽어 숨은 장면만으로 통과시키지 말고 살아있는 교전에서 머리까지 포함되는 실화면을 제출합니다.
2. 실제64프레임의 표시 외형과 전장 경계를 함께 검사하고 고정 등록/180CSS/몸통 비중첩/HUD 오차 근거를 분리합니다.
   선언한 core만 보지 말고 원본 알파의 실제 외곽 또는 그에 근거한 고정 최대 표시 범위를 사용해 후반 clipping 회귀를 잡습니다.
3. 기본·다른 편성·동좌표/벽·후방 접근/저장·살아있는 근접100 공격과 거북/각친위대 공격·3초/모션 접촉·원본21SHA를 유지합니다.
   새 경계에 따른 전투 시간 변화는 같은 수치·시드로 공개하며 밸런스 계수는 바꾸지 않습니다.
4. 변경 관련 모델/브라우저/tsc/build와 정확한 최종 누적 patch 재구성을 수행합니다.
   v002의1709/63과122+11 조건에서 위험 회귀를 확인하고 새 후기 경계 검사를 추가하되 무관한 전체 검사 반복은 피합니다.

검토 근거인 {O/'검증보고.md'}·시각등록메타/manifest/원본검증·기존 반환은 보존합니다.
새 output에 5종 기록/정확한 전후SHA/누적patch·파일/경계 조건과 before-after 화면·실제 검사/남은 한계를 취합합니다.
새 원화/내장·2.6·영상 API/설치/Git/현재 사용자 화면·서버 조작0.
자기127.0.0.1 port0 격리 headless만 사용해 검사하고 종료합니다.
공식 새Task/Dispatch worker_done으로 main01 run_47ce1a81d7b1에 실제 outcome과 원작업/차수/보고 경로를 반환합니다.
'''
(F/'요청확인.md').write_text(proof,encoding='utf-8');(F/'전문프롬프트.md').write_text(prompt,encoding='utf-8')
docs={'1_대화기록.md':proof+'\n\nmain01 화면 관찰: '+issue,'2_사전확인.md':'v002 실제 succeeded/8파일SHA와 원래 승인 범위를 확인했다. main01은 실제 후기 상단 잘림을 관찰했고 적용 전 같은 범위 경계 수정을 보완한다. root/사용자 환경은 그대로이며 gameplay 한 담당의 새 격리본만 편집한다.','3_작업일지.md':'v002 분리 개선 확인, 후기 머리 클리핑 발견. 현재 root before 일치/미반영을 확인하고 새 v003 경계 수정 준비.','4_정의문서.md':'앞발 접촉과 별개인 전체 터틀 표시 경계를 보존. 고정 본체 크기·원본·사거리 유지, 통상 후기까지 머리 포함.','5_버전관리.md':'v002 결과/성공·미적미합격 보존. 새 v003 누적 patch before는 root v001. 현재 root/API/Git/창 조작0.'}
for name,body in docs.items():
 v='# '+tid+' / 차수1\n\n'+body+'\n';(F/name).write_text(v,encoding='utf-8');(V/name).write_text(v,encoding='utf-8')
extras=[H/'사용자승인.md',V/'경계피드백.md',V/'입력버전.json',O/'검증보고.md',O/'변경manifest.json',O/'시각등록메타.json',P/'입력버전.json',S/'단일메인운영규정.md',S/'기준/characters/SD_72CSSpx_표시기준.md',R/'문서/00_개발규칙/스킬구현규약.md',S/'이미지2.6사용규칙.md',S/'저장운영규정.md']
assert all(p.is_file() for p in extras)
b.set_readings(tid,'main01',[str(p) for p in extras]);b.confirm(tid,'main01','마지막 연결했던 기준으로 진행해줘',H/'사용자승인.md');plan=b.prepare(tid,'main01')
q={'task':tid,'iteration':1,'parentTask':c['task'],'originalTask':'MAIN01-20261111-1EB56391','folder':str(F),'output':str(out),'plan':plan,'state':'prepared_not_sent','targetDispatch':'ctx_f49d6c6f7524','rootIntegrated':False}
write(V/'연결.json',q);c['boundaryFixTask']=tid;write(P/'연결.json',c)
print(json.dumps({'task':tid,'state':q['state'],'prompt':plan['prompt']},ensure_ascii=False))
