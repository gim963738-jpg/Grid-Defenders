from pathlib import Path
import json,hashlib,subprocess,os,shutil,datetime
O=Path(__file__).resolve().parents[1];R=Path('C:/Users/user/orca/workspaces/Grid Defenders/캐릭터디자인2');S=Path('C:/Users/user/Desktop/Grid Defenders/작업관리')
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def git(*args):return subprocess.check_output(['git','-c','core.quotepath=false',*args],cwd=R,env={**os.environ,'GIT_OPTIONAL_LOCKS':'0'},encoding='utf-8')
files=['tools/character-catalog/build.mjs','output/characters/catalog/catalog.json','output/characters/catalog/image-metadata.json','output/characters/char001/gallery.html','tools/character-catalog/gallery.template.html','tools/character-catalog/verify-files.mjs','자료/캐릭터설정/캐릭터목록.json','자료/캐릭터설정/제작순서.json']
b={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'root':str(R),'head':git('rev-parse','HEAD').strip(),'index_path':git('rev-parse','--path-format=absolute','--git-path','index').strip(),'files':[{ 'path':p,'sha256':sha(R/p),'bytes':(R/p).stat().st_size} for p in files]};b['index_sha256']=sha(b['index_path'])
for p in files[:4]:
 q=O/'before'/p;q.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(R/p,q)
(O/'evidence/baseline.json').write_text(json.dumps(b,ensure_ascii=False,indent=2),encoding='utf-8')
(O/'evidence/git-status-before.txt').write_text(git('status','--porcelain=v1','--untracked-files=no'),encoding='utf-8')
(O/'evidence/git-diff-before.patch').write_text(git('diff','--',files[0],'output/characters/catalog',files[3]),encoding='utf-8')
(O/'evidence/git-diff-index-before.patch').write_text(git('diff','--cached','--',files[0],'output/characters/catalog',files[3]),encoding='utf-8')
excerpt=S/'메인작업/main03/catalog-update-20261110/사용자원대화발췌.json';shutil.copy2(excerpt,O/'evidence/사용자원대화발췌.json')
(O/'1_대화기록.md').write_text('# 실제 원대화 근거\nMAIN03-20261110-20B313E5 / 차수1 / splash\n최신화 해봐 → 분류작업도 같이 → 직전설명 범위 → 진행의 실제4메시지는 evidence/사용자원대화발췌.json에 보존했다. 전체 세션로그를 복사하지 않았다. 담당창 원문을 main03가 직접검토해 confirm/prepare했고 msg_7502b97810ed로 단일편집권 조정했다. 발로르/신규남녀의 일단합격은 별도원작업 근거를 따른다.\n',encoding='utf-8')
(O/'2_사전확인.md').write_text('# 제품 편집 전 사전확인\n시각 '+b['at']+'\n작업 MAIN03-20261110-20B313E5 / 차수1 / splash\n필독20개 본문확인과 start 통과. 현재 D820F076 awaiting_user 확인, 소유권조정 전문지시의3경로만 편집. HEAD '+b['head']+'와 index 해시는 evidence/baseline.json에 보존. 기존 미커밋diff와수정예정텍스트사본을 before/에 보존했다.\n변경은 build.mjs + catalog 내부 확장데이터/메타/검증 + 기존 gallery.html. 승인7장 원본을 상대경로로 연결하고 N01/N02 미지정 프로필은 카탈로그 내부 확장으로 한정할 계획. 프로필원본·템플릿·이미지 수정금지. 전체재스캔 대신 skip-scan과 신규7장실측 사용.\n검증은 구문·원본해시·7장수량/방향/판정·기존아이템/구주소·링크·브라우저100%/다운로드. 구형검증이 과거불합격상태를 고정하면 실패원인을 분리기록하고 최신범위 검증을 추가한다. 제품UI합격·원격저장·게임통합을 대신선언하지 않는다.\n',encoding='utf-8')
(O/'3_작업일지.md').write_text('# 작업일지\n'+b['at']+' read-pack20개 본문/ACK/start 성공. preflight.py로 현재HEAD/index 및 허용파일 미커밋·텍스트사본을 읽기전용 조사/증거보존 완료; 제품수정 전 기록.\n',encoding='utf-8')
print(json.dumps({'head':b['head'],'index_sha256':b['index_sha256'],'preserved_text_files':4,'source_messages':4}))
