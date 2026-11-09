from pathlib import Path
from datetime import datetime
import subprocess,json,hashlib
ROOT=Path('C:/Users/user/Desktop/Grid Defenders');HERE=Path(__file__).resolve().parent
plan=json.loads((HERE/'保存計画.json').read_text(encoding='utf-8'))
archive=json.loads((HERE/'보관저장결과.json').read_text(encoding='utf-8'))
sid=plan['id'];external=Path('C:/Users/user/orca/backups/Grid Defenders')/sid
receipt=external/'main-final-receipt.json'
if receipt.exists():raise SystemExit('Main save already attempted; inspect receipt before recovery.')
if len(archive['roles'])!=16 or not all(x.get('remoteVerified') for x in archive['roles'].values()):raise SystemExit('Archives not all verified yet; no main save.')
def git(*args,data=None):
 p=subprocess.run(['git',*args],cwd=ROOT,input=data,capture_output=True)
 if p.returncode:raise RuntimeError(p.stderr.decode('utf-8','replace')[-4000:])
 return p.stdout
before=git('rev-parse','HEAD').decode().strip()
if before!=plan['roles']['main01']['head']:raise SystemExit('Main HEAD changed; inspect instead of overwriting.')
if git('diff','--cached','--name-only').strip():raise SystemExit('Existing user staging present; preserve it and review.')
record=ROOT/'문서/03_작업기록'/f'{sid}_요청저장'
lines=[f'- {r}: `{v["commit"]}` → `{v["remoteRef"]}` (원격 일치, 원본HEAD/index 유지)' for r,v in archive['roles'].items()]
(record/'3_작업일지-main01.md').write_text(f'''# {sid} main01 저장 기록

작성 {datetime.now().astimezone().isoformat()}, main 커밋 전에 작성.
사용자 “저장한번” 지시에 따른 1회 저장이며 이후 자동 저장/커밋/푸시하지 않는다. 사용자 원문과 정식 운영 규칙은 이 폴더 1_대화기록.md 및 작업관리/저장운영규정.md에 있다.

1. 현재17개 역할 공간·실제HEAD·미커밋 파일·용량/민감파일을 조사했다.
2. 메인02/03에 새 규칙과 중복 저장 금지를 공식 전달했다. 두 메인은 본문 읽기·적용·하위 전달을 회신했다. 캐릭터 담당에도 전달했다.
3. 각 공간의 보관 커밋 전에 해당 작업 기록을 작성했다. 별도index로16개 공간을 시점 보관하고 원래HEAD/index 불변과 GitHub 원격 해시 일치를 확인했다.
4. 브라우저 프로필/node_modules/캐시/복제/잠금/키/대형 중복 ZIP 등은 제외하고 로컬 원본을 유지했다. 계획·대상·제외는 메인작업/main01/save-20261109/保存計画.json에 기록했다.
5. 실제 root의 tsc+Vite build PASS(801모듈), 운영 도구 test_workflow12개 PASS. 이미지 대조는 별도 독립 QA40PASS/예외0 결과를 검토했다. 전체17공간의 기능/그림을 재인증한 것은 아니다.
6. 저장 중 금발전사 차수3 결과를 수신했다. main01이 비교PNG와 제작 검수보고를 열어 확인하고 returned로 기록했다. 신규4안과 비교/검수/생성기록13파일을 root 게임의 dev-previews/blond-scalp-v03에 바이트 동일하게 보관하고 HTTP6개 경로 바이트를 확인했다. 화면/현재게임캐릭터/스티커는 바꾸지 않았다. 1/2의 절제된 확대,3/4의 큰두상 그룹 및 원문 검수 한계를 유지하고 사용자 선택 대기로 남겼다.
7. 이후 main 기준본·공유 운영 기록·저장 기록·검증된 새 리뷰 사본을 정상 커밋/푸시하고 마지막 실제 원격 해시를 확인한다. 아래 보관 공간은 main으로 병합하지 않았다.

## 업로드 검증된 보관 커밋

'''+ '\n'.join(lines)+'\n\nmain의 최종 자기 커밋 해시는 Git 및 외부 main-final-receipt.json으로 확인한다. 이 기록은 main 업로드 전에 작성한 기록이며 아직 하지 않은 푸시를 완료라고 서술하지 않는다.\n',encoding='utf-8')
(record/'저장목록.json').write_text(json.dumps({'id':sid,'rootParent':before,'archives':archive['roles'],'mainState':'recorded before commit; remote verification pending','generatedArt':'게임/public/dev-previews/blond-scalp-v03/index.html','largeFilesPreservedLocally':[{ 'role':r,**x} for r,v in plan['roles'].items() for x in v['excluded'] if x['bytes']>=100*1024*1024]},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
raw=git('status','--porcelain=v1','-z','--untracked-files=all').split(b'\0');paths=[];excluded=[];i=0
bad={'node_modules','dist','__pycache__','.cache','.vite','.git','.forge','qa-game','handoffs'}
while i<len(raw):
 item=raw[i];i+=1
 if not item:continue
 status=item[:2].decode();name=item[3:].decode('utf-8');p=ROOT/name
 if 'R' in status or 'C' in status:raise SystemExit('Main rename requires review: '+name)
 parts=[x.lower() for x in Path(name).parts];base=parts[-1]
 size=p.stat().st_size if p.is_file() else 0
 if any(x in bad or ('profile' in x and any(k in x for k in ('edge','browser','chrome','chromium','qa-'))) for x in parts) or (base.startswith('.env') and base not in ('.env.example','.env.sample','.env.template')) or base.endswith(('.pyc','.pyo','.tmp','.lock','.bundle')) or size>=100*1024*1024:
  excluded.append(name);continue
 paths.append(name)
pathfile=external/'main-paths.bin';pathfile.write_bytes(b'\0'.join(x.encode('utf-8') for x in paths)+b'\0')
index=Path(git('rev-parse','--git-path','index').decode().strip());index=index if index.is_absolute() else ROOT/index
if index.exists():(external/'main-index-before.bin').write_bytes(index.read_bytes())
print(f'STAGING main: {len(paths)} changed files; {len(excluded)} excluded',flush=True)
git('add','-A','--pathspec-from-file='+str(pathfile),'--pathspec-file-nul')
tree=git('write-tree').decode().strip()
message=external/'main-message.txt';message.write_text(f'{sid}: save game, project records and asset archive index on request\n\nWrite work records before upload; use manual saves only.\nPreserve 16 separate workspaces as archival snapshots without merging or changing their HEAD/index.\nBuild and 12 workflow checks pass; image comparison has 40 independent QA passes.\nBlond SD scalp/face proposals remain awaiting user selection.\n',encoding='utf-8')
state={'id':sid,'parent':before,'tree':tree,'files':len(paths),'excluded':excluded,'archives':16,'stage':'prepared','remoteVerified':False}
receipt.write_text(json.dumps(state,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
# All previously unpublished main objects must also fit GitHub's normal Git limit.
objects=git('rev-list','--objects','origin/main..HEAD')
sizes=git('cat-file','--batch-check=%(objecttype) %(objectsize) %(rest)',data=objects)
large=[]
for line in sizes.decode('utf-8','replace').splitlines():
 pieces=line.split(' ',2)
 if len(pieces)>=2 and pieces[0]=='blob' and int(pieces[1])>=100*1024*1024:large.append(pieces[2] if len(pieces)>2 else '<blob>')
if large:raise SystemExit('Unpublished history has oversized objects; staged files preserved for review: '+str(large))
git('commit','-F',str(message))
commit=git('rev-parse','HEAD').decode().strip();state.update({'stage':'committed','commit':commit});receipt.write_text(json.dumps(state,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('PUSHING main '+commit,flush=True)
output=git('push','--porcelain','origin','HEAD:refs/heads/main');(external/'main-push.txt').write_bytes(output)
remote=git('ls-remote','--heads','origin').decode('utf-8');actual={line.split()[1]:line.split()[0] for line in remote.splitlines() if line.strip()}
if actual.get('refs/heads/main')!=commit:raise SystemExit('Main remote mismatch; inspect receipt. Do not force push.')
for role,row in archive['roles'].items():
 if actual.get(row['remoteRef'])!=row['commit']:raise SystemExit('Archive changed: '+role)
state.update({'stage':'remote_verified','remoteVerified':True,'verifiedAt':datetime.now().astimezone().isoformat(),'all17RefsMatch':True})
receipt.write_text(json.dumps(state,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'id':sid,'commit':commit,'mainRemoteVerified':True,'archiveRefsVerified':16,'all17RefsMatch':True,'receipt':str(receipt),'report':str(record),'url':'https://github.com/gim963738-jpg/Grid-Defenders/commit/'+commit},ensure_ascii=False,indent=2),flush=True)
