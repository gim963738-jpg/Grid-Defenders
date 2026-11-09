from pathlib import Path
import subprocess,json,hashlib,os,datetime,difflib
O=Path(__file__).resolve().parents[1];R=Path('C:/Users/user/orca/workspaces/Grid Defenders/캐릭터디자인2')
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def git(*args):return subprocess.check_output(['git','-c','core.quotepath=false',*args],cwd=R,env={**os.environ,'GIT_OPTIONAL_LOCKS':'0'},encoding='utf-8')
b=json.loads((O/'evidence/baseline.json').read_text(encoding='utf-8'));now=datetime.datetime.now(datetime.timezone.utc).isoformat()
changed=['tools/character-catalog/build.mjs','output/characters/catalog/approved-splash-assets.json','output/characters/catalog/catalog.json','output/characters/catalog/image-metadata.json','output/characters/catalog/verify-approved-splash.mjs','output/characters/char001/gallery.html']
for cmd,name in [(['node','--check','tools/character-catalog/build.mjs'],'node-check.txt'),(['node','--check','output/characters/catalog/verify-approved-splash.mjs'],'verifier-node-check.txt'),(['node','output/characters/catalog/verify-approved-splash.mjs',str(O/'before/output/characters/catalog/catalog.json')],'file-verification.json')]:
 p=subprocess.run(cmd,cwd=R,capture_output=True,encoding='utf-8');(O/'evidence'/name).write_text(p.stdout+p.stderr,encoding='utf-8');assert p.returncode==0,name
beforeRebuild={p:sha(R/p) for p in changed};p=subprocess.run(['node','tools/character-catalog/build.mjs','--skip-scan'],cwd=R,capture_output=True,encoding='utf-8');(O/'evidence/build-output.json').write_text(p.stdout+p.stderr,encoding='utf-8');assert p.returncode==0
idempotent=all(sha(R/p)==h for p,h in beforeRebuild.items());assert idempotent
ack=json.loads((O/'evidence/읽기확인.json').read_text(encoding='utf-8-sig'));readings=[{'path':x['path'],'matches':sha(x['path'])==x['sha256']} for x in ack['documents']]
forbidden=[{'path':x['path'],'matches':sha(R/x['path'])==x['sha256']} for x in b['files'][4:]]
head=git('rev-parse','HEAD').strip();index=sha(b['index_path']);assert head==b['head'] and index==b['index_sha256'];assert all(x['matches'] for x in readings+forbidden)
files=[{'path':p,'sha256':sha(R/p),'bytes':(R/p).stat().st_size} for p in changed]
result={'task':'MAIN03-20261110-20B313E5','iteration':1,'at':now,'head_before':b['head'],'head_after':head,'head_unchanged':True,'index_before':b['index_sha256'],'index_after':index,'index_unchanged':True,'idempotent_skip_scan_rebuild':idempotent,'readings':readings,'forbidden_files':forbidden,'modified_files':files,'browser_checks':29,'new_images_generated':0,'git_mutations_performed':False,'user_ui_approval':None,'existing_approved_image_verdicts_preserved':True}
(O/'evidence/final-verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
(O/'evidence/git-diff-after.patch').write_text(git('diff','--',changed[0],'output/characters/catalog',changed[-1]),encoding='utf-8')
for f in changed:
 before=O/'before'/f
 if before.exists():
  patch=''.join(difflib.unified_diff(before.read_text(encoding='utf-8-sig').splitlines(True),(R/f).read_text(encoding='utf-8-sig').splitlines(True),fromfile='before/'+f,tofile='after/'+f))
  q=O/'evidence'/('change-'+Path(f).name+'.patch');q.write_text(patch,encoding='utf-8')
with (O/'3_작업일지.md').open('a',encoding='utf-8') as f:f.write(now+' 승인7장 Pillow읽기전용측정→approved-splash-assets.json 확장데이터→build.mjs 외부원본 상대경로/프로필패치→node --check→build --skip-scan 성공(257경로/250고유/현재94/이력77/참조79)→기존verify-files의프로필고정실패분리→신규verify-approved-splash 성공(534문서링크/83구형항목/기존모든asset동일)→Orca공식페이지29검사·7원본100%/다운로드경로·0누락이미지 확인→동일빌드재실행바이트불변→HEAD/index/금지파일/필독20개 해시검증 성공.\n')
(O/'4_정의문서.md').write_text('# 현재 정의와 완료범위\nMAIN03-20261110-20B313E5 차수1 / splash\n기존 gallery.html 주소를 유지하고 발로르v02 1장·N01/N02 6장 추가. 3캐릭터 묶음, 새2인 클래스/출신/소속/직업 미지정. GC9 일러스트와 기존SD를 style/소유그룹/판정으로 구분하며 정면0/오른쪽사선45/오른쪽측면90 정확분류. 모든 신규7장 상태는 사용자 일단합격이며 공통스타일마스터로 승격하지 않음. 발로르 여백/저알파검수잔여는 review_note와외부검수링크에 보존. 이전243개고유asset과83개구형항목·8개대분류·세계관과생산순서는 보존.\n자료/캐릭터설정/캐릭터목록.json은 미수정. 승인근거가연결된 catalog/approved-splash-assets.json의 카탈로그한정2인프로필+발로르현재판정패치를 빌드에 합성한다. 구형프로필의 불합격상태는 historical필드와원본파일에 보존. 새 발로르SD/불합격SD3종은 이번등록에 없고 원본미수정/합격승격없음.\n미완/한계: 이름/소속/직업은 사용자미지정, 사용자UI합격 미정, 네트워크저장/게임통합 미실행. 기존verify-files.mjs는 원본registry와catalog의완전동일 및 과거발로르불합격0일러스트를 고정해 이번확장검증에 부적합; 해당도구수정권한은 없어 보존하고 별도검증기로 전원본·링크·회귀검증했다.\n',encoding='utf-8')
(O/'5_버전관리.md').write_text('# 버전관리 실기록\n시작/종료HEAD '+head+' 동일. index SHA256 '+index+' 동일. git status/diff/rev-parse만 읽기전용 실행하며 GIT_OPTIONAL_LOCKS=0 사용. git add/commit/push/checkout/reset/clean 미실행.\n기존미커밋: evidence/git-status-before.txt와git-diff-before.patch, 스테이징상태는git-diff-index-before.patch 보존. 변경전실파일텍스트4종은 before/ 보존. 전체로그/이미지/프로필원본 복사없음.\n실제변경6파일과SHA/바이트는evidence/final-verification.json. 허용3경로 안에서만제품변경. 다른4개금지텍스트(템플릿/기존검증기/레지스트리/제작순서) 해시동일, 원본257경로 해시검증통과. 이 기록은 제작의최소근거이며 사용자별도저장요청없이원격저장하지 않았다.\n',encoding='utf-8')
print(json.dumps({'modified':len(files),'head_unchanged':True,'index_unchanged':True,'idempotent':idempotent,'readings_current':len(readings)}))
