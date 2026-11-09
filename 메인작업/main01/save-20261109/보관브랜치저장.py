"""Run once per explicit user save request; never scheduled. Preserve live worktrees."""
from pathlib import Path
from datetime import datetime
import json,subprocess,os,hashlib

ROOT=Path('C:/Users/user/Desktop/Grid Defenders'); HERE=Path(__file__).resolve().parent
plan=json.loads((HERE/'保存計画.json').read_text(encoding='utf-8'))
if plan['secretFlags']:raise SystemExit('Credential-like literals require review; nothing pushed.')
sid=plan['id'];external=Path('C:/Users/user/orca/backups/Grid Defenders')/sid
external.mkdir(parents=True,exist_ok=True)
record=ROOT/'문서/03_작업기록'/f'{sid}_요청저장';record.mkdir(parents=True,exist_ok=True)
statefile=HERE/'보관저장결과.json'
state=json.loads(statefile.read_text(encoding='utf-8')) if statefile.exists() else {'id':sid,'startedAt':datetime.now().astimezone().isoformat(),'roles':{}}
if state['id']!=sid:raise SystemExit('Existing save id differs; inspect state instead of overwriting.')
def persist():statefile.write_text(json.dumps(state,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def git(root,*args,env=None,data=None):
 p=subprocess.run(['git',*args],cwd=root,env=env,input=data,capture_output=True)
 if p.returncode:raise RuntimeError(p.stderr.decode('utf-8','replace')[-3000:])
 return p.stdout
def shafile(path):return hashlib.sha256(path.read_bytes()).hexdigest() if path.exists() else None
def idxpath(root):
 p=Path(git(root,'rev-parse','--git-path','index').decode().strip())
 return p if p.is_absolute() else root/p

(record/'1_대화기록.md').write_text('''# 수동 저장 요청

사용자: “이제 자동저장하지말고 내가 저장하라할때만 하는걸로 하고 저장할때 작업기록 먼저 작성하고 올리는걸로 하자 지금 말나온김에 저장한번하고”.

이번 요청에 따른 1회 저장이다. 다음부터 사용자 저장 요청 없이 자동 커밋·푸시하지 않는다. 제작 파일 작성·최소 착수/전달 근거·게임 플레이 저장은 유지한다. 저장 허가는 제작물의 미적 합격·새 기능 통합·출시 승인이 아니다.
''',encoding='utf-8')
(record/'2_사전확인.md').write_text(f'''# 저장 전 판단

작성 시점 {datetime.now().astimezone().isoformat()}. 커밋 전에 기록했다.
공유 규정A·메인운영/팀장운영·파일담당표·저장운영규정 및 실제 Git 상태를 확인했다. 17개 역할의 실제 작업 경로·HEAD·변경 파일·용량을 조사했다. 메인02/03에 저장 규칙과 이번 저장의 단일 담당을 알렸고 본문 읽기·하위 전달 회신을 받았다.

게임 기준본은 main에 저장한다. 다른 16개 공간은 HEAD/index/작업 파일을 변경하지 않는 별도 index와 보관 브랜치로 시점 상태를 저장한다. 진행 중 파일은 진행 중으로 표시하며 기능 합격/병합으로 해석하지 않는다. 작업자가 이후 새로 만든 파일은 이번 시점 이후 변경으로 남을 수 있다.

보관 범위/제외 원본: 메인작업/main01/save-20261109/保存計画.json. 키·브라우저 프로필·node_modules·캐시·테스트 복제·Git bundle·잠금 파일은 제외한다. 100MiB 이상 일반 Git 파일은 제외하며 로컬 원본을 삭제하지 않는다. 이번 제외된 영상 ZIP은 약165MB,262MB 두 개이며 원본 프레임/영상 등 별도 일반 파일은 허용 범위에서 저장한다. 자격증명 형태 검사에서 새 대상의 의심 리터럴0건.

이번 검증: root 게임 tsc+Vite build PASS(801모듈), test_workflow 12개 PASS. 이미지 대조 도구는 직전 독립 QA 40PASS/예외0 기록이 있다. 나머지 작업 공간 전체를 빌드/미적 승인한 것은 아니며 보관 목적이다. 강제 푸시·자동 병합·진행 중 작업 중단·앱 창 조작은 하지 않는다.
''',encoding='utf-8')
(record/'4_정의문서.md').write_text('''# 저장 시점의 기능/자료 상태

- 게임 기준본: 기존 미커밋 진형/길/단위키 등 변경과 이미지 대조 통합본을 포함한 저장 시점 소스. build 통과. 이미지 대조의 기술 검증은40PASS이며 실기기/미적 판단은 별도다.
- 운영: 3개 메인,6팀장,독립 테스터,도메인 분류,작업별 필독/착수,Sol medium 기본,결과 상태 목록,확인 선택 질문,수동 저장 규칙.
- 금발전사: 원형·정면4안·15방향 및 실제두상/얼굴 확대 차수3 제작 중 자료. 공통 비율 채택/사용자 합격을 의미하지 않는다.
- 몬스터/UI/일러스트/이펙트/스프라이트/영상: 각 공간의 저장 시점 자료를 보관한다. 개별 결과의 완료 여부는 작업번호별 task.json과 작품 보고가 기준이다. 보관 브랜치는 main으로 통합하지 않았다.
- 접근·비교·검수와 저장 결과는 역할별 저장기록·보관저장결과.json을 연결한다. 보관되지 않은 임시/대형 파일은 제외 사유가 목록에 남으며 로컬 원본이 보존된다.
''',encoding='utf-8')
(record/'5_버전관리.md').write_text(f'''# 버전 관리 계획 / {sid}

사용자 1회 저장 요청이 유일한 실행 근거다. 실행 스크립트는 예약되지 않았다. 게임 main은 정상 커밋/푸시하고 나머지16개 역할은 저장 시점 HEAD를 부모로 하는 별도 보관 커밋을 만든다. 원래 브랜치/HEAD/index/작업 파일은 유지한다. 원격 refs/heads/save/<시점>/<역할>을 새로 만들며 강제 갱신하지 않는다.

각 보관 커밋 전에 해당 역할의 작업 기록을 이 폴더와 그 커밋의 동일 경로에 작성한다. 보관 커밋/트리/원격 해시 및 원래 HEAD/index 불변 증거는 메인작업/main01/save-20261109/보관저장결과.json에 기록한다. main 자기 커밋 해시는 자기 커밋 안에 넣을 수 없으므로 마지막 실행 영수증과 Git 원격 조회로 확인한다.
''',encoding='utf-8')
for role,row in plan['roles'].items():
 if role=='main01':continue
 if state['roles'].get(role,{}).get('remoteVerified'):
  print(f'ALREADY VERIFIED {role}',flush=True);continue
 root=Path(row['root']);head=git(root,'rev-parse','HEAD').decode().strip()
 if head!=row['head']:raise SystemExit('Source HEAD changed: '+role)
 defaultindex=idxpath(root);index_before=shafile(defaultindex)
 entry=state['roles'].get(role,{})
 if not entry.get('commit'):
  env=os.environ.copy();env['GIT_INDEX_FILE']=str(external/(role+'.index'))
  git(root,'read-tree',head,env=env)
  paths=external/(role+'-paths.bin');paths.write_bytes(b'\0'.join(x['path'].encode('utf-8') for x in row['files'])+b'\0')
  print(f'STAGING {role}: {len(row["files"])} changed files, {sum(x["bytes"] for x in row["files"])/1048576:.1f} MiB',flush=True)
  if row['files']:git(root,'add','-A','--pathspec-from-file='+str(paths),'--pathspec-file-nul',env=env)
  log=f'''# {sid} / {role} 작업 기록

저장 요청 원문: “이제 자동저장하지말고 내가 저장하라할때만 하는걸로 하고 저장할때 작업기록 먼저 작성하고 올리는걸로 하자 지금 말나온김에 저장한번하고”.

기록 작성: {datetime.now().astimezone().isoformat()}, 보관 커밋 전에 작성.
원본 작업 공간: {root}
원본 브랜치: {row['branch']}
원본 HEAD: {head}
보관 원격: {row['remoteRef']}
조사 시점: {plan['at']}. 새 산출물은 조사 이후일 수 있다.

작업 내용: 저장 시점의 변경/새 파일 {len(row['files'])}개를 기존 HEAD tree에 적용한 보관 사본이다. 원본 HEAD/index/작업 파일을 변경하지 않는다. 다른 제작자의 편집·미커밋 상태를 보존한다. 원본 폴더로의 병합이나 기능/미적 합격을 뜻하지 않는다. 현재 작업의 완료 여부는 공유 task.json과 원작품 보고를 따른다.

검증: 대상/제외 목록·새 대상 키형태 검사, index 작성/트리 생성, 저장 후 원격 해시 조회. 이 역할의 전체 코드를 실행/전체 그림을 재검수하지 않았으므로 보관 검증과 제품 검증은 구분한다. 임시/프로필/의존성/대형파일 {len(row['excluded'])}개는 제외하며 로컬 원본을 보존한다.

변경·제외 상세는 root의 메인작업/main01/save-20261109/保存計画.json, 실제 commit/remote 증거는 보관저장결과.json을 따른다. 뒤에 계속 만들어지는 결과는 다음 사용자 저장 요청 범위다.
'''
  logpath=record/(f'3_작업일지-{role}.md');logpath.write_text(log,encoding='utf-8')
  blob=git(root,'hash-object','-w','--stdin',data=log.encode('utf-8')).decode().strip()
  rel=logpath.relative_to(ROOT).as_posix()
  git(root,'update-index','--add','--cacheinfo','100644',blob,rel,env=env)
  tree=git(root,'write-tree',env=env).decode().strip()
  message=external/(role+'-message.txt');message.write_text(f'{sid}: archive {role} work at user request\n\nWork log written before commit. This is an archival snapshot, not acceptance or integration.\nOriginal branch: {row["branch"]}\n',encoding='utf-8')
  commit=git(root,'commit-tree',tree,'-p',head,'-F',str(message)).decode().strip()
  git(root,'update-ref',f'refs/user-saves/{sid}/{role}',commit,'0'*40)
  if git(root,'rev-parse','HEAD').decode().strip()!=head or shafile(defaultindex)!=index_before:
   raise SystemExit('Original HEAD/index unexpectedly changed: '+role)
  entry={'root':str(root),'originalBranch':row['branch'],'originalHead':head,'originalIndexSha256':index_before,'headAndIndexUnchanged':True,'commit':commit,'tree':tree,'remoteRef':row['remoteRef'],'files':len(row['files']),'excluded':len(row['excluded']),'remoteVerified':False}
  state['roles'][role]=entry;persist()
 print(f'PUSHING {role} {entry["commit"][:10]} -> {row["remoteRef"]}',flush=True)
 remote=git(root,'ls-remote','--heads','origin',row['remoteRef']).decode().strip()
 if remote and remote.split()[0]!=entry['commit']:raise SystemExit('Remote archive ref already differs: '+role)
 if not remote:
  output=git(root,'push','--porcelain','origin',entry['commit']+':'+row['remoteRef'])
  (external/(role+'-push.txt')).write_bytes(output)
 verify=git(root,'ls-remote','--heads','origin',row['remoteRef']).decode().strip()
 if not verify or verify.split()[0]!=entry['commit']:raise SystemExit('Remote commit verification failed: '+role)
 entry['remoteVerified']=True;entry['verifiedAt']=datetime.now().astimezone().isoformat();persist()
 print(f'VERIFIED {role} {entry["commit"][:10]}',flush=True)
print('ARCHIVES VERIFIED; main commit/push remains.',flush=True)
