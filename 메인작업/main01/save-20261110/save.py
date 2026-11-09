from pathlib import Path
from datetime import datetime
import subprocess,json,os,hashlib,re

ROOT=Path(__file__).resolve().parents[3]; HERE=Path(__file__).resolve().parent; S=ROOT/'작업관리'
def git(root,*args,env=None,data=None):
 p=subprocess.run(['git',*args],cwd=root,env=env,input=data,capture_output=True)
 if p.returncode:raise RuntimeError(p.stderr.decode('utf-8','replace')[-2500:])
 return p.stdout
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest() if p.is_file() else None
stamp=datetime.now().strftime('%Y%m%d-%H%M%S'); sid='SAVE-'+stamp
if (HERE/'plan.json').exists():raise SystemExit('Save attempt exists; inspect before retry')
external=Path('C:/Users/user/orca/backups/Grid Defenders')/sid;external.mkdir(parents=True)
record=ROOT/'문서/03_작업기록'/f'{sid}_요청저장';record.mkdir(parents=True)
roles=json.loads((S/'메인목록.json').read_text(encoding='utf-8'))['mains'];roles.update(json.loads((S/'브랜치목록.json').read_text(encoding='utf-8'))['branches'])
bad={'node_modules','dist','__pycache__','.cache','.vite','.git','.forge','qa-game','handoffs','user-data','user_data'}
patterns=[re.compile(rb'\bgh[pousr]_[A-Za-z0-9]{30,}\b'),re.compile(rb'github_pat_[A-Za-z0-9_]{30,}'),re.compile(rb'sk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{28,}'),re.compile(rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----')]
def inventory(root):
 raw=git(root,'status','--porcelain=v1','-z','--untracked-files=all').split(b'\0'); selected=[];excluded=[]
 for item in raw:
  if not item:continue
  status=item[:2].decode();name=item[3:].decode('utf-8');p=root/name
  if 'R' in status or 'C' in status:raise RuntimeError('Rename needs review: '+name)
  parts=[x.lower() for x in Path(name).parts];base=parts[-1];size=p.stat().st_size if p.is_file() else 0
  reason=None
  if any(x in bad or ('profile' in x and any(k in x for k in ('edge','browser','chrome','chromium','qa','headless'))) for x in parts):reason='dependency/cache/browser/test copy'
  if base.startswith('.env') and base not in ('.env.example','.env.sample','.env.template'):reason='local environment'
  if base.endswith(('.pyc','.pyo','.tmp','.lock','.bundle')):reason='temporary/lock/bundle'
  if size>=100*1024*1024:reason='100MiB GitHub normal Git limit'
  if any(k in base for k in ('credentials','private-key','id_rsa','id_ed25519')):reason='credential filename'
  row={'path':name,'status':status,'bytes':size}
  if reason:excluded.append({**row,'reason':reason});continue
  if p.is_file() and size<3*1024*1024 and p.suffix.lower() in ('.md','.json','.py','.js','.mjs','.ts','.tsx','.toml','.yaml','.yml','.txt','.html','.ini'):
   if any(x.search(p.read_bytes()) for x in patterns):raise RuntimeError('Credential-like literal; local review required: '+name)
  selected.append(row)
 return selected,excluded
plan={'id':sid,'at':datetime.now().astimezone().isoformat(),'userQuote':'진행하기전에 저장하고 진행','validation':{'rootBuild':'PASS tsc+Vite801 modules via npm.cmd','workflow':'PASS12'},'roles':{}}
for role,d in roles.items():
 root=Path(d['path']);files,excluded=inventory(root)
 plan['roles'][role]={'root':str(root),'head':git(root,'rev-parse','HEAD').decode().strip(),'branch':git(root,'branch','--show-current').decode().strip(),'files':files,'excluded':excluded,'remoteRef':'refs/heads/main' if role=='main01' else f'refs/heads/save/{stamp}/{role}'}
 print('INVENTORY',role,len(files),round(sum(x['bytes'] for x in files)/1048576,1),'MiB','excluded',len(excluded),flush=True)
(HERE/'plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2),encoding='utf-8')
state={'id':sid,'roles':{},'stage':'records_before_commit','remoteVerified':False}
statefile=external/'receipt.json'
def persist():statefile.write_text(json.dumps(state,ensure_ascii=False,indent=2),encoding='utf-8')
persist()
for name,text in {
 '1_대화기록.md':'사용자 실제 요청: “진행하기전에 저장하고 진행”. 이번1회 저장 후 새6장 제작. 자동저장 재개 아님.',
 '2_사전확인.md':'커밋 전 기록.17공간 실제HEAD/변경/제외/민감패턴을 점검. root 스테이징이 있으면 중단. 다른16공간은 별도index와 신규보관ref로 HEAD/index/작업파일을 유지. 강제푸시/병합 없음. 원본·반려본·진행중 자료는 상태를 유지. 임시/브라우저프로필/키/캐시/100MiB이상은 제외하고 로컬 보존.',
 '3_작업일지.md':'저장규칙 읽기→실제Git조사→main02/03공식공지→npm.cmd build PASS801모듈→workflow12PASS→대상검사 및 이 기록 작성→별도보관커밋/정상main커밋→push 및 원격SHA검증 예정. npm.ps1 실행정책 오류는 npm.cmd로 해결했고 OS설정은 바꾸지 않음.',
 '4_정의문서.md':'현재 발로르 디자인은 차수1/2 모두 사용자 불합격. 좌우두께 개선을 포함한1번·발로르 각0/35/90 총6장 제작은 저장후 승인범위. 리깅/파츠/애니메이션/게임교체는 보류.1번 그림체선택/원본·4번예비 보존과 미적합격/기술검수/게임통합을 구분. 다른공간 저장은 보관이며 main통합 아님.',
 '5_버전관리.md':f'{sid}. 대상/제외/HEAD는 메인작업/main01/save-20261110/plan.json. main은 정상커밋푸시, 나머지16공간은 save/{stamp}/<role> 보관ref. 커밋/원격 결과는 외부 {statefile}. 조사이후 새파일은 다음 변경으로 남을 수 있음. 모든작품을 재승인/재실행한 검사는 아님.'}.items():
 (record/name).write_text(text+'\n',encoding='utf-8')
if git(ROOT,'diff','--cached','--name-only').strip():raise SystemExit('Existing staging; preserve and review')
for role,row in plan['roles'].items():
 if role=='main01':continue
 root=Path(row['root']);head=git(root,'rev-parse','HEAD').decode().strip()
 if head!=row['head']:raise RuntimeError('Concurrent HEAD change '+role)
 idx=Path(git(root,'rev-parse','--git-path','index').decode().strip());idx=idx if idx.is_absolute() else root/idx;indexbefore=digest(idx)
 env=os.environ.copy();env['GIT_INDEX_FILE']=str(external/(role+'.index'));git(root,'read-tree',head,env=env)
 paths=external/(role+'-paths.bin');paths.write_bytes(b'\0'.join(x['path'].encode('utf-8') for x in row['files'])+b'\0')
 if row['files']:git(root,'add','-A','--pathspec-from-file='+str(paths),'--pathspec-file-nul',env=env)
 log=f'{sid} / {role}\n작성 {datetime.now().astimezone().isoformat()} 보관커밋 전. 사용자 요청 “진행하기전에 저장하고 진행”. 원본 {root}, 브랜치 {row["branch"]}, HEAD {head}. 변경{len(row["files"])}개/제외{len(row["excluded"])}개. 작업중·반려·미검증 상태 보존. 이공간 기능/미적 검증은 이번에 재수행하지 않음. 원본HEAD/index/작업파일 유지, main병합/사용자합격 아님. 대상·제외·검증범위는 root plan.json.\n'
 (record/(role+'.md')).write_text(log,encoding='utf-8')
 blob=git(root,'hash-object','-w','--stdin',data=log.encode('utf-8')).decode().strip()
 git(root,'update-index','--add','--cacheinfo','100644',blob,(record/(role+'.md')).relative_to(ROOT).as_posix(),env=env)
 tree=git(root,'write-tree',env=env).decode().strip();commit=git(root,'commit-tree',tree,'-p',head,data=(sid+': archive '+role+' at user request\n').encode()).decode().strip()
 git(root,'update-ref',f'refs/user-saves/{sid}/{role}',commit,'0'*40)
 assert git(root,'rev-parse','HEAD').decode().strip()==head and digest(idx)==indexbefore
 state['roles'][role]={'commit':commit,'ref':row['remoteRef'],'originalHeadAndIndexUnchanged':True,'remoteVerified':False};persist()
 print('PUSH',role,commit[:10],flush=True)
 git(root,'push','--porcelain','origin',commit+':'+row['remoteRef'])
 remote=git(root,'ls-remote','origin',row['remoteRef']).decode().split();assert remote and remote[0]==commit
 state['roles'][role]['remoteVerified']=True;persist();print('VERIFIED',role,flush=True)
(record/'보관결과.json').write_text(json.dumps(state,ensure_ascii=False,indent=2),encoding='utf-8')
files,excluded=inventory(ROOT)
head=git(ROOT,'rev-parse','HEAD').decode().strip();assert head==plan['roles']['main01']['head']
paths=external/'main-paths.bin';paths.write_bytes(b'\0'.join(x['path'].encode('utf-8') for x in files)+b'\0')
git(ROOT,'add','-A','--pathspec-from-file='+str(paths),'--pathspec-file-nul')
git(ROOT,'commit','-m',sid+': save work records, game and design reviews before next production')
commit=git(ROOT,'rev-parse','HEAD').decode().strip();state['roles']['main01']={'commit':commit,'ref':'refs/heads/main','remoteVerified':False};persist()
print('PUSH main',commit,flush=True);git(ROOT,'push','--porcelain','origin','HEAD:refs/heads/main')
remote=git(ROOT,'ls-remote','--heads','origin').decode();refs={line.split()[1]:line.split()[0] for line in remote.splitlines()}
for role,row in state['roles'].items():assert refs.get(row['ref'])==row['commit']
state['roles']['main01']['remoteVerified']=True;state['stage']='remote_verified';state['remoteVerified']=True;state['verifiedAt']=datetime.now().astimezone().isoformat();persist()
print(json.dumps({'id':sid,'mainCommit':commit,'remoteRefsVerified':len(state['roles']),'receipt':str(statefile)},ensure_ascii=False),flush=True)
