from pathlib import Path
import hashlib, importlib.util, json, shutil

R=Path('C:/Users/user/Desktop/Grid Defenders');S=R/'작업관리';H=Path(__file__).resolve().parent
if (H/'연결.json').exists():raise SystemExit('Already prepared; do not repeat.')
previous=json.loads((H.parent/'v002/연결.json').read_text(encoding='utf-8'))
first=json.loads((H.parent/'연결.json').read_text(encoding='utf-8'))
tid=previous['task'];source=Path(previous['output']);initial=Path(first['output'])
worker=Path('C:/Users/user/orca/workspaces/Grid Defenders/캐릭터디자인2')
guide=H.parent/'v002/사용자검위치표시.png';assert guide.is_file()
snapshot=H/'사용자검위치표시.png';shutil.copy2(guide,snapshot)
paths=[source/'final/right-035.png',initial/'image26/right-035.png',initial/'inputs/style-sd1.png',guide,snapshot]
paths += [initial/p for p in ['built-in/front-000.png','built-in/right-035.png','built-in/right-090.png','image26/front-000.png','image26/right-090.png']]
(H/'입력보존목록.json').write_text(json.dumps([{'path':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in paths],ensure_ascii=False,indent=2),encoding='utf-8')
spec=importlib.util.spec_from_file_location('board',S/'도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(S)
t=b.load(tid,'main01');assert t['status']=='awaiting_user' and t['iteration']==2
b.record(tid,'main01','revise',H/'사용자확인.md','진행');t=b.load(tid,'main01');assert t['iteration']==3 and t['status']=='draft'
F=b.folder(tid);out=worker/'output/characters/gc9_balor'/('sd_guard35_natural_'+tid.lower()+'_v003')
prompt=(H/'전문지시초안.md').read_text(encoding='utf-8')
for key,value in {'TASK':tid,'APPROVAL':(H/'사용자확인.md').read_text(encoding='utf-8'),'SOURCE':str(source),'FIRST':str(initial),'GUIDE':str(snapshot),'OUTPUT':str(out)}.items():prompt=prompt.replace('{{'+key+'}}',value)
assert '{{' not in prompt
(F/'요청확인.md').write_text((H/'사용자확인.md').read_text(encoding='utf-8'),encoding='utf-8')
(F/'전문프롬프트.md').write_text(prompt,encoding='utf-8')
(F/'2_사전확인.md').write_text((H/'사전확인.md').read_text(encoding='utf-8'),encoding='utf-8')
entries={'1_대화기록.md':(H/'사용자확인.md').read_text(encoding='utf-8'),'3_작업일지.md':'차수2 미달 반환 후 사용자 추가조건과 실제 진행 확인. 자연스러운 발간격/자세 소폭 조절·검날 길이·등비 구도축소/여백의2.6 단일편집을 차수3으로 준비한다.','4_정의문서.md':'현재2.6 SD35를 기준으로 조금 넓은 발간격·조금 낮은 자연스러운 방어자세·길어진 검날과 충분한 검끝여백. 신체비율/화풍유지·본체72CSSpx/3번.','5_버전관리.md':'차수1/2 원본·반환실패와 지시를 보존. 새v003 output에2.6 최초편집1POST만 허가. 추가유료/내장대체/기존방향수정/Git없음.'}
for name,text in entries.items():
    p=F/name;old=p.read_text(encoding='utf-8') if p.exists() else '';p.write_text(old+'\n\n## 차수3\n\n'+text+'\n',encoding='utf-8');shutil.copy2(p,H/name)
extras=[H/'사용자확인.md',H/'사전확인.md',source/'제작기준.md',source/'검수.md',H.parent/'v002/반환검토.md',S/'이미지2.6사용규칙.md',S/'진행승인규칙.md',S/'저장운영규정.md',S/'기준/characters/SD_72CSSpx_표시기준.md',worker/'문서/02_세부기획/02_영웅/한손무기그립기준.md',worker/'tools/image-studio/README.md']
assert all(p.is_file() for p in extras)
b.set_readings(tid,'main01',[str(p) for p in extras]);b.confirm(tid,'main01','진행',H/'사용자확인.md');plan=b.prepare(tid,'main01')
c={'task':tid,'iteration':3,'folder':str(F),'output':str(out),'plan':plan,'state':'prepared_not_sent','targetDispatch':'ctx_6706b4af7a95','image26InitialCallsAllowed':1,'expectedNewImages':1,'sourceOutput':str(source),'originalOutput':str(initial)}
(H/'연결.json').write_text(json.dumps(c,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'task':tid,'iteration':3,'state':c['state'],'prompt':plan['prompt'],'output':str(out)},ensure_ascii=False))
