from pathlib import Path
import importlib.util,json,subprocess
ROOT=Path('C:/Users/user/Desktop/Grid Defenders');S=ROOT/'작업관리';HERE=Path(__file__).resolve().parent
QA=Path('C:/Users/user/orca/workspaces/Grid Defenders/테스터');ENGINE=Path('C:/Users/user/orca/workspaces/Grid Defenders/게임개발')
EXE='C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe'
if (HERE/'QA발송시도.json').exists():raise SystemExit('Already attempted QA; inspect receipt, no duplicate')
def write(p,t):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(t,encoding='utf-8')
def dump(p,d):write(p,json.dumps(d,ensure_ascii=False,indent=2)+'\n')
ps=subprocess.run([EXE,'worktree','ps','--json'],capture_output=True,encoding='utf-8',check=True)
row=next(w for w in json.loads(ps.stdout[ps.stdout.index('{'):])['result']['worktrees'] if Path(w['path']).resolve()==QA.resolve())
dump(HERE/'QA사전상태.json',row)
if any(a.get('state') not in {'done','idle'} for a in row.get('agents',[])):raise SystemExit('QA already active; coordinate instead of duplicating')
spec=importlib.util.spec_from_file_location('board',S/'도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(S)
task=b.new('main01','qa','이미지 대조 실제 게임 통합 독립 검증', '사용자가 직접 요청·구체화한 개발자 이미지 대조/전장배치/배치후크기조절/45·90방향의 실제 게임 통합을 독립 기술 검증한다. 원 제작 작업 MAIN01-20261109-F89105C9.');folder=b.folder(task['id'])
out=QA/'output'/task['id']
prompt=f'''# 독립 테스터 지시 — {task['id']}
원작업 MAIN01-20261109-F89105C9 / main01. 실제 root/UI 통합이 끝났고 root tsc/build가 통과했다. 제작담당의자체검사와독립적으로실제사용가능여부를검사한다. 사용자 원문/확인은 {HERE/'사용자확인.md'}, 추가방향은 {ROOT/'메인작업/main01/sd-remodel-4/사용자방향추가.md'}.
자기 AGENTS/작업연결/작업방법/공통규정/추가필독을읽고read-pack→자기읽기확인→start 통과후검사한다. 메인이send직후영수증을연결한다. 필독본문을전부읽고목록복사로대신하지않는다.

대상은 {ROOT/'게임'} 실제실행원본이며 root5173 Vite는그대로유지한다. 검사대상해시는 {HERE/'통합결과.json'}이다. UI보존사본은 C:/Users/user/orca/workspaces/Grid Defenders/UI-전투화면/게임 와동일하다. 테스터자기공간의초기구버전소스를현재최신본으로오해하지않는다.
기존사용자앱/브라우저탭/창/모델/패널/서버를조작하거나종료하지않는다. 새headless 브라우저의독립프로필로 실제 http://127.0.0.1:5173/battle-landscape.html?battle=normal&from=camp 를검사할수있다. 또는검증용사본을만들되실제통합해시와일치함을확인한다. 자기검사프로세스만정리한다. 사용자의localStorage세이브에영향을주지않는다.
허용편집은 {out}와원QA작업기록 {folder}, 테스트에필요한임시사본/독립프로필뿐이다. 제품src/assets/다른팀원본/기록은수정하지않는다. 실패는재현근거와함께main01에보고하고제작팀수정후재검증한다.

핵심검사:
1. 게임이실제로로드되고개발자도구‘이미지대조’버튼이1개이며원본/1~4안과정면/오른쪽45/오른쪽90총15이미지가깨짐없이선택/배치된다.
2. 복수대상배치,선택,드래그이동,배치후50/100/200%조절과숫자입력,방향교체시선택대상만바뀌고위치/발기준이유지된다. ratio를늘여가로세로찌그러지지않는다.
3. 터치/드래그/취소/ESC/블러/패널닫기/다시열기/개별삭제/전체삭제를검사한다. 닫은후그림은남되기존게임입력을가로채지않고,배치모드해제후병사/영웅선택·소환이정상이다.
4. 골드/실제유닛정원/전투저장에개발자미리보기가들어가지않는다. 웨이브/보스전환·리사이즈에서고스트/고정좌표/오래된선택이남지않는다.800×360과좁은화면에서패널조작가능하다.
5. 신규3모듈+최소main.ts패치/15PNG의해시와참조·비대칭방향을확인한다. 제작자31브라우저검사가재현가능한지또는독립동등검사를수행한다. 필수범위중못한항목은사유/범위를명시한다.

참고자료는 {ENGINE/'output/MAIN01-20261109-F89105C9/검증.md'}, browser-check.mjs, browser-result.json, 변경manifest.json, 통합.patch. 그대로통과를인용하는것만으로독립검증이라하지않는다. 이자료는동작/실행방법파악용이며직접새프로필에서조작결과를관찰해야한다.
산출물 {out}/report.md, result.json(항목별PASS/FAIL/미검증),대상해시목록,실제브라우저스크린샷/재현증거. 원작업3/4/5기록도완성한다. 최종worker_done에결과와남은문제를보고한다. 사용자미적합격·실기기APK검사를대신하지않는다.
'''
for name,body in [('전문프롬프트.md',prompt),('요청확인.md','원사용자확인에기반한개발자미리보기기능의독립검증. 제작/코드수정이아니며이미확인된기능범위의필수검증이다.'),('1_대화기록.md',(HERE/'사용자확인.md').read_text(encoding='utf-8')),('2_사전확인.md','# 사전확인\n독립QA착수전작성. 제작담당과다른테스터공간·새브라우저프로필에서실제통합root해시를검사한다. 제품원본/사용자화면/세이브를수정하지않는다. 사용자직접요청기능범위안검증이며검증승인을추가요구하지않는다. 메인은원본/코드/기능/자체검수자료를검토했고root/UI에20파일범위를좁게반영했다. 루트tsc/build통과. 필독/start후동작재현/자산/좌표/입력복구를검사해증거로보고한다.\n')]:write(folder/name,body)
b.set_readings(task['id'],'main01',[str(HERE/'사용자확인.md'),str(HERE/'통합사전확인.json'),str(HERE/'통합결과.json'),str(ENGINE/'output/MAIN01-20261109-F89105C9/검증.md')])
b.confirm(task['id'],'main01','전장에 직접 병사나 영웅처럼 배치할수있게 해주고 배치가 되어도 캐릭터 크기조정할수있게 기능도 추가해서만들어줘',HERE/'사용자확인.md')
plan=b.prepare(task['id'],'main01');dump(HERE/'QA작업연결.json',{'task':task['id'],'folder':str(folder),'output':str(out),'plan':plan})
argv=[EXE,'orchestration','worker-start','--spec-file',plan['prompt'],'--worktree',plan['selector'],'--agent','codex','--model','gpt-6.1-sol','--effort','medium','--keep-open','--task-title','이미지 대조 실제게임 독립QA','--json']
dump(HERE/'QA발송시도.json',argv);p=subprocess.run(argv,capture_output=True,encoding='utf-8')
try:reply=json.loads(p.stdout[p.stdout.index('{'):])
except (ValueError,json.JSONDecodeError):reply={'ok':False,'raw':p.stdout,'stderr':p.stderr}
receipt=HERE/'QA실제발송영수증.json';dump(receipt,reply);print(json.dumps(reply,ensure_ascii=False,indent=2),flush=True)
if p.returncode or not reply.get('ok'):raise SystemExit('Inspect failedStage/recovery, no repeat')
b.record(task['id'],'main01','sent',receipt)
