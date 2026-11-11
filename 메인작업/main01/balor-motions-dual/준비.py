from pathlib import Path
import hashlib, importlib.util, json

R=Path('C:/Users/user/Desktop/Grid Defenders'); S=R/'작업관리'; H=Path(__file__).resolve().parent
if (H/'연결.json').exists(): raise SystemExit('준비 기록이 이미 있습니다. 중복 등록하지 않습니다.')
W=Path('C:/Users/user/orca/workspaces/Grid Defenders/캐릭터디자인2')
piece=S/'기준/characters/작품/발로르'
accepted=json.loads((piece/'전투태세승인.json').read_text(encoding='utf-8'))
master=Path(accepted['source']); digest=hashlib.sha256(master.read_bytes()).hexdigest()
assert accepted['state']=='user_accepted' and digest==accepted['sha256']=='f131b85dd33bfde3a3c80782995094ecbac0644f96eea5a85de2980f1db2b9b0'
jobs=json.loads((H/'동작설계.json').read_text(encoding='utf-8')); assert len(jobs['jobs'])==13
proof=(H/'사용자확인.md').read_text(encoding='utf-8')
extras=[H/'사용자확인.md',H/'사전확인.md',H/'동작설계.json',piece/'전투태세승인.json',Path(accepted['evidence']),master.parent.parent/'제작기준.md',S/'단일메인운영규정.md',S/'이미지2.6사용규칙.md',S/'진행승인규칙.md',S/'저장운영규정.md',S/'기준/characters/SD_72CSSpx_표시기준.md',S/'기준/sprites/규정.md',S/'기준/sprites/작업진행방법.md',R/'문서/00_개발규칙/스킬구현규약.md',W/'문서/02_세부기획/02_영웅/한손무기그립기준.md',W/'tools/image-studio/README.md']
assert all(p.is_file() for p in extras),[str(p) for p in extras if not p.is_file()]
spec=importlib.util.spec_from_file_location('board',S/'도구/작업대장.py'); m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m); b=m.Board(S)
t=b.new('main01','characters','발로르9종 모션·백색기사 거인 궁극기 / 내장·2.6 비교',proof); tid=t['id']; F=b.folder(tid)
out=W/'output/characters/gc9_balor'/('motions_dual_'+tid.lower()+'_v001')
prompt=(H/'전문지시초안.md').read_text(encoding='utf-8')
for key,value in {'TASK':tid,'APPROVAL':proof,'MASTER':str(master),'PLAN':str(H/'동작설계.json'),'OUTPUT':str(out)}.items(): prompt=prompt.replace('{{'+key+'}}',value)
assert '{{' not in prompt
(F/'요청확인.md').write_text(proof,encoding='utf-8'); (F/'전문프롬프트.md').write_text(prompt,encoding='utf-8')
docs={
 '1_대화기록.md':proof,
 '2_사전확인.md':(H/'사전확인.md').read_text(encoding='utf-8'),
 '3_작업일지.md':'승인 전투태세 실제 원본/해시 확인. 사용자9종 동작과 궁극기 상세 요청/진행을 현재 작업별2.6 허가로 연결. 기본 시트13개/경로, 공통 작업원형2개, 기존 팀장 후속전달 준비. 현재 생성/제작 완료 아님.',
 '4_정의문서.md':'확정: 크기 변화 최소화·자연스러운 동작,35/90 방향별9종, 기사도 입상, 궁극기 발로르 정지/뒤의 거인 큰 강타/검부터 왼쪽 흰입자 소멸. 구현 편성안: 경로별13시트,공통원형2장,2.6최초15POST/내장13시트. 위상/격자/프레임시간은 담당 설계이며 사용자 직접 지정 수치가 아니다. 최종 속도·시각합격은 사용자 결정.',
 '5_버전관리.md':'새 독립 output v001. 기존 승인 SD35와 모든 불합격/이전 결과 보존. 원본 시트 바이트 유지 및 frameRects 재생. 공통 규정/키설정/프로필DB/게임 런타임/사용자창 변경 없음. Git 커밋·푸시 없음. native Task/Dispatch는 실제 발송영수증으로 이후 연결.'}
for name,body in docs.items():
 text='# '+tid+' / 차수1\n\n'+body+'\n'; (F/name).write_text(text,encoding='utf-8'); (H/name).write_text(text,encoding='utf-8')
(H/'입력목록.json').write_text(json.dumps([{'path':str(master),'sha256':digest,'role':'user_accepted_balor_sd35_identity_style_and_combat_guard'}],ensure_ascii=False,indent=2),encoding='utf-8')
b.set_readings(tid,'main01',[str(p) for p in extras]); b.confirm(tid,'main01','진행',H/'사용자확인.md'); plan=b.prepare(tid,'main01')
c={'task':tid,'iteration':1,'folder':str(F),'output':str(out),'plan':plan,'state':'prepared_not_sent','targetDispatch':'ctx_0f7988dd2c0f','master':str(master),'userMotionBundles':9,'sheetsPerRoute':13,'expectedSheets':26,'sharedWorkingStills':2,'initialImage26PostLimit':15,'initialBuiltinSheetLimit':13,'countsAreImplementationBreakdown':True}
(H/'연결.json').write_text(json.dumps(c,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'task':tid,'state':c['state'],'prompt':plan['prompt'],'sheetsPerRoute':13,'sharedWorkingStills':2},ensure_ascii=False))
