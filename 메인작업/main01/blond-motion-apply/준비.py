from pathlib import Path
import hashlib,importlib.util,json,shutil

R=Path('C:/Users/user/Desktop/Grid Defenders'); S=R/'작업관리'; H=Path(__file__).resolve().parent
if (H/'연결.json').exists():raise SystemExit('준비 기록이 있습니다. 중복 등록하지 않습니다.')
W=Path('C:/Users/user/orca/workspaces/Grid Defenders/게임개발')
A2=R/'자료/메인인수/20261111/main02/파일/메인작업/main02'
A3=R/'자료/메인인수/20261111/main03/파일'
B=Path('C:/Users/user/orca/workspaces/Grid Defenders/스프라이트-시트작업/output/characters/blond_motions_MAIN02-20261111-8D69415B_v002')
src=R/'게임'; base=H/'baseline-game'
if base.exists():raise SystemExit('입력 기준 사본이 이미 있습니다. 보존 상태를 확인하세요.')
files=[]
for relative in ['src','tests','scripts','public/assets']:
 files.extend(p for p in (src/relative).rglob('*') if p.is_file())
files.extend(p for p in src.iterdir() if p.is_file() and (p.suffix in ['.html','.json','.ts'] or p.name=='README.md'))
records=[]
for p in sorted(set(files)):
 rel=p.relative_to(src); d=base/rel; d.parent.mkdir(parents=True,exist_ok=True); shutil.copy2(p,d)
 a=hashlib.sha256(p.read_bytes()).hexdigest(); z=hashlib.sha256(d.read_bytes()).hexdigest(); assert a==z
 records.append({'relativePath':rel.as_posix(),'sha256':a,'bytes':p.stat().st_size})
bm=H/'기준사본목록.json'; bm.write_text(json.dumps({'source':str(src),'copy':str(base),'purpose':'approved_task_input_snapshot_not_git_backup','files':records},ensure_ascii=False,indent=2),encoding='utf-8')
(H/'입력기준.md').write_text('# 현재 실제 게임 입력 기준\n\n현재 실행 원본: '+str(src)+'\n\n검증용 기준사본: '+str(base)+'\n\n원본과 사본 SHA256를 파일별 대조했다. '+str(len(records))+'파일. 상세: '+str(bm)+'\n\n게임개발의 옛 게임 사본을 최신으로 간주하지 않는다. 이 사본에서 자기 전용 output/game을 만들어 수정한다. 원본 시트/과거 미커밋·현재 사용자 플레이는 보존한다. 게임 코드 적용은 main01이 기준해시를 확인한 변경 파일만 반영하며 의존성/개발자갤러리 전체 복사는 하지 않는다.\n',encoding='utf-8')
proof=(H/'사용자승인.md').read_text(encoding='utf-8'); preflight=(H/'사전확인.md').read_text(encoding='utf-8')
extras=[H/'사용자승인.md',H/'사전확인.md',H/'입력기준.md',S/'단일메인운영규정.md',S/'진행승인규칙.md',S/'저장운영규정.md',S/'이미지2.6사용규칙.md',S/'기준/characters/SD_72CSSpx_표시기준.md',S/'기준/sprites/규정.md',S/'기준/sprites/작업진행방법.md',R/'문서/00_개발규칙/스킬구현규약.md',R/'문서/00_개발규칙/모바일UI규격.md',R/'메인작업/main01/single-main-20261111/main02-인수인계.md',R/'메인작업/main01/single-main-20261111/main03-인수인계.md',A2/'blond-xslash34-20261111/connected-record.json',A2/'blond-xslash34-20261111/hitstop-record.json',A2/'blond-xslash34-20261111/hitstop-report.md',B/'납품보고.md',A3/'output/turtle-fullmotion-v07/보고.md',A3/'output/turtle-fullmotion-v07/manifest.json']
assert all(p.is_file() for p in extras),[str(p) for p in extras if not p.is_file()]
spec=importlib.util.spec_from_file_location('board',S/'도구/작업대장.py'); m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m); b=m.Board(S)
t=b.new('main01','gameplay','금발 전사 평타·사거리100 / 터틀드래곤·3색 친위대·겹침 방지 실게임 적용',proof); tid=t['id']; F=b.folder(tid); out=W/'output'/('blond-turtle-runtime_'+tid.lower()+'_v001')
prompt=(H/'전문지시초안.md').read_text(encoding='utf-8')
values={'TASK':tid,'PROOF':str(H/'사용자승인.md'),'BASELINE':str(base),'BASEMANIFEST':str(bm),'OUTPUT':str(out),'ARCHIVE2':str(A2),'ARCHIVE3':str(A3),'BLONDSOURCE':str(B)}
for k,v in values.items():prompt=prompt.replace('{{'+k+'}}',v)
assert '{{' not in prompt
(F/'요청확인.md').write_text(proof,encoding='utf-8');(F/'전문프롬프트.md').write_text(prompt,encoding='utf-8')
docs={'1_대화기록.md':proof,'2_사전확인.md':preflight,'3_작업일지.md':'실제 사용자 진행/달리기 정정→마지막 내장03/04/05첫7+신규06 및 타격점·속도 기록 확인→터틀v07after/3색슬라임 확인→현재 실제게임 기준사본 SHA대조→자기공간 작업/수정목록 반환 전문지시 준비. 아직 실게임 코드 수정/하달 전.','4_정의문서.md':'웨이브 고정대기/순차평타/딜레이대기. 보스3초대기/이동달리기/순차평타/넉백만피격/HP0사망완료. 사거리100,스킬없음. 터틀 공격시점에 각1피해/노랑·파랑·빨강 친위대각1,총4적. 유닛분리/영웅상단. 원본/시간축/저장호환·실제필드 검증.','5_버전관리.md':'기준사본목록.json의 원본SHA로 충돌검사. gameplay 새output/game에서 구현하고 allowlist/patch/검증을 반환,main01이root해시동일파일만적용. 기존모든미커밋/진행중art·공방/원본시트보존. Git/생성API/사용자화면조작0.'}
for name,body in docs.items():
 text='# '+tid+' / 차수1\n\n'+body+'\n';(F/name).write_text(text,encoding='utf-8');(H/name).write_text(text,encoding='utf-8')
b.set_readings(tid,'main01',[str(p) for p in extras]);b.confirm(tid,'main01','마지막 연결했던 기준으로 진행해줘 / 달리기 추가하고 피격은 넉백시에만 모션적용이란이야기야',H/'사용자승인.md');plan=b.prepare(tid,'main01')
c={'task':tid,'iteration':1,'folder':str(F),'output':str(out),'plan':plan,'state':'prepared_not_sent','targetDispatch':'ctx_1b71b13679c8','baseline':str(base),'baselineManifest':str(bm),'source':'current_root_game','selectedBlond':'builtin03_04_05first7_new34_06','selectedTurtle':'v07_after','enemyRoster':['yellow','blue','red','turtle'],'imageGenerationAllowed':False,'clarificationResolved':True}
(H/'연결.json').write_text(json.dumps(c,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'task':tid,'state':c['state'],'baselineFiles':len(records),'baselineBytes':sum(x['bytes'] for x in records),'prompt':plan['prompt']},ensure_ascii=False))
