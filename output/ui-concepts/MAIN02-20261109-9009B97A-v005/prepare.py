from pathlib import Path
import json,subprocess,os,hashlib
out=Path(__file__).resolve().parent;root=out.parents[2]
shared=Path('C:/Users/user/Desktop/Grid Defenders/작업관리')
env=dict(os.environ,PYTHONIOENCODING='utf-8')
p=json.loads(subprocess.check_output(['python',str(shared/'도구/작업대장.py'),'read-pack','--task','MAIN02-20261109-9009B97A','--main','main02'],env=env).decode('utf-8'))
def write(n,x): (out/n).write_text(json.dumps(x,ensure_ascii=False,indent=2) if not isinstance(x,str) else x,encoding='utf-8')
write('read-pack.json',p)
applies=['공통800×360·48px터치, 이전원본과게임보존, 차수5읽기후start. 이펙트수정없음.','본문재독·적용기록·차수5start후제작하고 자체검수와사용자합격을구분.','실제9개연결상태와5종기록, 실패배치를재사용하지않고미확정수치는제안명시.','담당main02회신, 이전미커밋보존, 실제OrcaTask/Dispatch에결과연결.','하위담당없이직접제작, 정적검수범위와사용자합격분리, 외주서비스미사용.','게임src·공통CSS·타팀원본편집금지, 신규v005전용표시소스만작성.','800×360 공통크기·기존D3선택유지, 최신불합격피드백우선, 규정개선은별도제안.','read-pack전체본문·해시·적용기록으로차수5start, 원본start이력보존.','UI팀책임과독립테스터경계유지, 직접제작후담당메인반환.','자료계층과조직구분, 실제기존아트소스읽기전용사용.','UI/아이템의기존위치보존, 새세계관·능력치확정없음.','이전maintenance불합격을근거로큰전장실배치/별도장비/자동전투/정비복귀9장으로재설계.','14px본문12px보조48px터치,5×4웨이브판을48px이상확대표시, 제거된보스진형복구안함.','사용자차수5 진행확인범위만제작, 같은허락재요구없음.','요청산출물과최소기록만작성, Git커밋·푸시·예약백업없음.']
assert len(applies)==len(p['documents'])==15
docs=[dict(path=d['path'],sha256=d['sha256'],applies=a) for d,a in zip(p['documents'],applies)]
extras=[(shared/'작업/MAIN02-20261109-9009B97A/발송지시-v005.md','차수5정확한9상태·大전장/장비작업분리·許可출력범위준수.'),(out.parent/'MAIN02-20261109-9009B97A-v003/결과보고.md','D3상단alpha.74/불투명문자만승계, 옛진형판은복구안함.'),(out.parent/'MAIN02-20261109-9009B97A-v004/결과보고.md','기술검수통과가합격아님을실패분석, 과다패널구조폐기.'),(out.parent/'MAIN02-20261109-9009B97A-maintenance/결과보고.md','작은미리보기와상점만정비로간주한실패분석, 큰전장배치복원.')]
write('추가참조읽기확인.json',[dict(path=str(path),sha256=hashlib.sha256(path.read_bytes()).hexdigest(),applies=a) for path,a in extras])
write('읽기확인.json',dict(task=p['task'],iteration=5,role='ui',workSummary='사용자 진행 승인과불합격원문을반영해 D3만승계하고 큰전장실배치/독립장비정리/자동전투·정비복귀를연결한PNG9장과보조상태를신규v005에제작; 원본읽기전용·48px·실배율·행동경로검수.',documents=docs))
write('2_사전확인.md','# 차수5 제작 전 사전확인\n사용자 확인: 진행. 이전v004/maintenance는불합격분석자료이며구조재사용하지않음.\n허용: 본v005폴더의신규PNG·독립소스·갤러리·검사·기록만. 게임/이전출력/main01 devImageCompare읽기전용.\n변경: 큰5×4웨이브배치판, 병력·배치/장비 두작업, 선택과실배치구별, 자동전투에서편집닫힘, 4회후유지복귀. D3/alpha.74유지.\n검증: 9장800×360과2400×1080개별열람, 48px터치·겹침·5카드·8후보탐색·실제점유·구매잔액·유닛동일성·전후장비·배치유지와갤러리링크확인.\n미정: 초기자금/중보스번째/창고칸수는일관된샘플제안; 동시영웅최대3유지. 실게임구현·합격·Git저장아님.\n')
baseline={}
for folder in [root/'게임/src',out.parent]:
 for f in folder.rglob('*'):
  if f.is_file() and out not in f.parents and not any(x.startswith('edge-profile') for x in f.parts): baseline[str(f)]=hashlib.sha256(f.read_bytes()).hexdigest()
write('보존기준해시.json',baseline)
print('Reading evidence and precheck written; originals',len(baseline))
