from pathlib import Path
import importlib.util,json

R=Path('C:/Users/user/Desktop/Grid Defenders'); S=R/'작업관리'; H=Path(__file__).resolve().parent
W=Path('C:/Users/user/orca/workspaces/Grid Defenders/스킬-이펙트')
if (H/'연결.json').exists(): raise SystemExit('기존 준비 기록이 있습니다. 중복 등록하지 않습니다.')
proof=(H/'사용자확인.md').read_text(encoding='utf-8'); preflight=(H/'사전확인.md').read_text(encoding='utf-8')
balor=json.loads((S/'기준/characters/작품/발로르/전투태세승인.json').read_text(encoding='utf-8'))['source']
extras=[H/'사용자확인.md',H/'사전확인.md',S/'진행승인규칙.md',S/'단일메인운영규정.md',S/'이미지2.6사용규칙.md',S/'저장운영규정.md',S/'기준/characters/SD_72CSSpx_표시기준.md',R/'문서/00_개발규칙/스킬구현규약.md',R/'문서/00_개발규칙/모바일UI규격.md',W/'문서/03_작업기록/WEB-168_공방부품노드와사용성/2_사용법과검증.md',W/'문서/03_작업기록/WEB-169_전체이펙트재료함통합/2_사용법과검증.md']
assert all(p.is_file() for p in extras),[str(p) for p in extras if not p.is_file()]
spec=importlib.util.spec_from_file_location('board',S/'도구/작업대장.py'); m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m); b=m.Board(S)
t=b.new('main01','effects','캐릭터 프레임 위치·크기 보정 및 이펙트 동기 편집 공방',proof); tid=t['id']; F=b.folder(tid); out=W/'output'/('character-effect-workshop_'+tid.lower()+'_v001')
prompt=(H/'전문지시초안.md').read_text(encoding='utf-8')
for k,v in {'TASK':tid,'SHARED':str(S),'PROOF':str(H/'사용자확인.md'),'BALOR':balor,'OUTPUT':str(out)}.items(): prompt=prompt.replace('{{'+k+'}}',v)
assert '{{' not in prompt
(F/'요청확인.md').write_text(proof,encoding='utf-8'); (F/'전문프롬프트.md').write_text(prompt,encoding='utf-8')
docs={'1_대화기록.md':proof,'2_사전확인.md':preflight,'3_작업일지.md':'기존 공방 코드 진입점/규정/미커밋·작업공간/담당 상태 확인. 참고 화면 기반 프레임 보정 제안과 이펙트 환경 추가 뒤 실제 진행 승인으로 통합 작업 준비. 제작/검증은 미실시.','4_정의문서.md':'기존 이펙트 공방 안에 캐릭터 이미지/시트/모션 불러오기, 프레임별 X/Y·크기·기준점 보정/겹침/되돌리기, 같은 시간축의 이펙트 위치·크기·시점·앞뒤/부착점 조정, 실제 필드72CSSpx, 원본 보존·보정 JSON 복구. 신규 이미지/API0.','5_버전관리.md':'effects 자체 도구 파일에 한정. 기존 미커밋·저장 작품·재료함·타팀원본 보존. chars 발로르 모션 작업과 독립 진행. 현재 Git 저장/새 포트/사용자 화면 조작 없음. 공식 Task/Dispatch는 실제 영수증 이후 연결.'}
for name,body in docs.items():
 text='# '+tid+' / 차수1\n\n'+body+'\n'; (F/name).write_text(text,encoding='utf-8'); (H/name).write_text(text,encoding='utf-8')
b.set_readings(tid,'main01',[str(p) for p in extras]); b.confirm(tid,'main01','진행',H/'사용자확인.md'); plan=b.prepare(tid,'main01')
c={'task':tid,'iteration':1,'folder':str(F),'output':str(out),'plan':plan,'state':'prepared_not_sent','workspace':'id:de86d10c-8e2c-444d-8b0f-43b772894ad9::C:/Users/user/orca/workspaces/Grid Defenders/스킬-이펙트','model':'gpt-6.1-sol','effort':'medium','imageGenerationAllowed':False}
(H/'연결.json').write_text(json.dumps(c,ensure_ascii=False,indent=2),encoding='utf-8'); print(json.dumps({'task':tid,'state':c['state'],'prompt':plan['prompt']},ensure_ascii=False))
