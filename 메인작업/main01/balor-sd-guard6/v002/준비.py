from pathlib import Path
import hashlib
import importlib.util
import json
import shutil

R=Path('C:/Users/user/Desktop/Grid Defenders')
S=R/'작업관리'
H=Path(__file__).resolve().parent
if (H/'연결.json').exists():
    raise SystemExit('Prepared already; inspect the recorded state, do not repeat.')
previous=json.loads((H.parent/'연결.json').read_text(encoding='utf-8'))
tid=previous['task']
source=Path(previous['output'])
worker=Path('C:/Users/user/orca/workspaces/Grid Defenders/캐릭터디자인2')
guide=Path('C:/Users/user/AppData/Roaming/orca/agent-session-attachments/5753fd5f-825e-457b-9bef-dadf09a90e5e/orca-paste-1794378845368-fd477dbc-f072-42ee-96cb-fc5ba0368a1a.png')
assert guide.is_file()
snapshot=H/'사용자검위치표시.png'
shutil.copy2(guide,snapshot)
paths=[source/r for r in ['built-in/front-000.png','built-in/right-035.png','built-in/right-090.png','image26/front-000.png','image26/right-035.png','image26/right-090.png','inputs/style-sd1.png']]+[guide,snapshot]
manifest=[{'path':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in paths]
(H/'입력보존목록.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
spec=importlib.util.spec_from_file_location('board',S/'도구/작업대장.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
b=m.Board(S);t=b.load(tid,'main01')
assert t['status']=='awaiting_user' and t['iteration']==1
b.record(tid,'main01','revise',H/'사용자확인.md','진행')
t=b.load(tid,'main01');assert t['iteration']==2 and t['status']=='draft'
F=b.folder(tid)
out=worker/'output/characters/gc9_balor'/('sd_guard35_lower_'+tid.lower()+'_v002')
prompt=(H/'전문지시초안.md').read_text(encoding='utf-8')
for key,value in {'TASK':tid,'APPROVAL':(H/'사용자확인.md').read_text(encoding='utf-8'),'SOURCE':str(source),'GUIDE':str(snapshot),'OUTPUT':str(out)}.items():
    prompt=prompt.replace('{{'+key+'}}',value)
assert '{{' not in prompt
(F/'요청확인.md').write_text((H/'사용자확인.md').read_text(encoding='utf-8'),encoding='utf-8')
(F/'전문프롬프트.md').write_text(prompt,encoding='utf-8')
(F/'2_사전확인.md').write_text((H/'사전확인.md').read_text(encoding='utf-8'),encoding='utf-8')
entries={
 '1_대화기록.md':(H/'사용자확인.md').read_text(encoding='utf-8'),
 '3_작업일지.md':'차수1 반환 후 사용자가 2.6 SD35 자세를 낮추고 검 위치·각도/길이를 수정하는 범위를 확인하고 진행했다. 기존 작업은 차수1로 보존하고 차수2를 준비한다.',
 '4_정의문서.md':'차수2는 기존2.6 SD35 한 장의 자세·검 수정이다. 나머지5장과 원본을 유지하며 기존6장 전체 합격이나90도 수정이 아니다.',
 '5_버전관리.md':'차수1 원본과 지시는 보존한다. 새 독립v002 output의2.6 편집 최초1POST만 허가. Git 커밋·푸시없음.'}
for name,text in entries.items():
    p=F/name
    old=p.read_text(encoding='utf-8') if p.exists() else ''
    p.write_text(old+'\n\n## 차수2\n\n'+text+'\n',encoding='utf-8')
for name in ['1_대화기록.md','3_작업일지.md','4_정의문서.md','5_버전관리.md']:
    shutil.copy2(F/name,H/name)
extras=[H/'사용자확인.md',H/'사전확인.md',source/'제작기준.md',source/'검수.md',
        S/'이미지2.6사용규칙.md',S/'진행승인규칙.md',S/'저장운영규정.md',
        S/'기준/characters/SD_72CSSpx_표시기준.md',
        worker/'문서/02_세부기획/02_영웅/한손무기그립기준.md',
        worker/'tools/image-studio/README.md']
assert all(p.is_file() for p in extras)
b.set_readings(tid,'main01',[str(p) for p in extras])
b.confirm(tid,'main01','진행',H/'사용자확인.md')
plan=b.prepare(tid,'main01')
connection={'task':tid,'iteration':2,'folder':str(F),'output':str(out),'plan':plan,
            'state':'prepared_not_sent','targetDispatch':'ctx_1b75bbe5bb64',
            'image26InitialCallsAllowed':1,'expectedNewImages':1,'sourceOutput':str(source)}
(H/'연결.json').write_text(json.dumps(connection,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'task':tid,'iteration':2,'state':connection['state'],'prompt':plan['prompt'],'output':str(out)},ensure_ascii=False))
