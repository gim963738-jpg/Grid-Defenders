from pathlib import Path
import hashlib,importlib.util,json
R=Path('C:/Users/user/Desktop/Grid Defenders');S=R/'작업관리';H=Path(__file__).resolve().parent
if (H/'연결.json').exists():raise SystemExit('Prepared already; do not repeat.')
W=Path('C:/Users/user/orca/workspaces/Grid Defenders/캐릭터디자인2')
refs=[W/'output/character-redesign-6x2/images/c04_front.png',W/'output/character-redesign-6x2/images/c03_front.png']
(H/'참조목록.json').write_text(json.dumps([{'path':str(p),'role':'style_only','sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in refs],ensure_ascii=False,indent=2),encoding='utf-8')
spec=importlib.util.spec_from_file_location('board',S/'도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(S)
request=(H/'사용자확인.md').read_text(encoding='utf-8');t=b.new('main01','characters','레나 2.6 일반 일러스트 시안1장·자세/그림체 검수 후 즉시제출',request);tid=t['id'];F=b.folder(tid)
out=W/'output/characters/lena'/('illustration_'+tid.lower()+'_v001')
prompt=(H/'전문지시초안.md').read_text(encoding='utf-8')
for key,value in {'TASK':tid,'APPROVAL':request,'WORKER':str(W),'OUTPUT':str(out)}.items():prompt=prompt.replace('{{'+key+'}}',value)
assert '{{' not in prompt
(F/'요청확인.md').write_text(request,encoding='utf-8');(F/'전문프롬프트.md').write_text(prompt,encoding='utf-8');(F/'2_사전확인.md').write_text((H/'사전확인.md').read_text(encoding='utf-8'),encoding='utf-8')
docs={'1_대화기록.md':request,'3_작업일지.md':'레나 전체설정·2.6 명시요청과 일반 일러스트 진행 확인. 현행GC9 여성 일반전신 참조2장 실제 열람, 자세/그림체만 검수하는 단일생성 지시 준비. 아직 생성 전.','4_정의문서.md':'레나=영웅/전사/인간형여성/무소속·발트레인출신. 긴은발·검은오버핏코트와밀착이너·유광싸이하이부츠·레이피어. 오른쪽앞 자연입상 일반일러스트1장, 자세와GC9그림체관찰 후 즉시실물제출. 숫자나이/키/고정착용위치미정.','5_버전관리.md':'신규 레나 작업 차수1. 독립output. 기존발로르/다른인물/프로필/카탈로그/공유규정/게임/Git불변. 최초2.6 POST1만, 추가생성·내장대체없음.'}
for name,text in docs.items():(F/name).write_text('# '+tid+'\n\n'+text+'\n',encoding='utf-8');(H/name).write_bytes((F/name).read_bytes())
extras=[H/'사용자확인.md',H/'사전확인.md',S/'이미지2.6사용규칙.md',S/'진행승인규칙.md',S/'저장운영규정.md',W/'문서/02_세부기획/02_영웅/캐릭터제작규약.md',W/'문서/02_세부기획/02_영웅/캐릭터그림체/GC9_그림체기준.md',W/'자료/캐릭터그림체/GC9/작화고정기준.json',W/'자료/캐릭터그림체/GC9/완성작화기준8장.json',W/'문서/02_세부기획/02_영웅/한손무기그립기준.md',W/'tools/image-studio/README.md']
assert all(p.is_file() for p in extras)
b.set_readings(tid,'main01',[str(p) for p in extras]);b.confirm(tid,'main01','일러스트 진행',H/'사용자확인.md');plan=b.prepare(tid,'main01')
c={'task':tid,'iteration':1,'folder':str(F),'output':str(out),'plan':plan,'state':'prepared_not_sent','targetDispatch':'ctx_872b55e8e344','image26InitialCallsAllowed':1,'expectedNewImages':1,'reviewScope':['pose','drawing_style'],'form':'illustration'}
(H/'연결.json').write_text(json.dumps(c,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({'task':tid,'prompt':plan['prompt'],'output':str(out),'state':c['state']},ensure_ascii=False))
