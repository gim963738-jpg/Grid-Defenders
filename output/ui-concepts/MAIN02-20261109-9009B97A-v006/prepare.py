from pathlib import Path
import json,subprocess,os,hashlib
out=Path(__file__).resolve().parent;root=out.parents[2];shared=Path('C:/Users/user/Desktop/Grid Defenders/작업관리')
env=dict(os.environ,PYTHONIOENCODING='utf-8')
p=json.loads(subprocess.check_output(['python',str(shared/'도구/작업대장.py'),'read-pack','--task','MAIN02-20261109-9009B97A','--main','main02'],env=env).decode())
def write(n,x):(out/n).write_text(x if isinstance(x,str) else json.dumps(x,ensure_ascii=False,indent=2),encoding='utf-8')
applies=['800×360·48px共通터치,게임과이전작업보존,이펙트수정없음.','새차수본문재독·적용기록·start후제작,사용자추가확인없이승인범위실행.','요청6장과필수5종기록,이전실패분석과변경을연결,자체검수와합격분리.','담당main02로공식Orca반환,예전미커밋과공유파일보존.','직접제작·하위담당없음,독립테스터를임의생성하지않고검수자료반환.','게임/src·공통CSS·다른팀아트편집금지,허용v006독립표시소스만작성.','800×360기준과D3미술유지,실패배치승격금지,규정보완은별도제안.','read-pack필독16문서path/sha256/applies로차수6정확start,추가참조별도확인.','UI팀책임과담당main02·독립검수경계유지,다른영역생성없음.','원자료위치와조직을구분하고기존아트읽기전용사용.','UI·아이템외세계관·몬스터·캐릭터설정새확정없음.','끼워맞춘구성수정판정:큰캡슐·안내·디버그ID삭제,상점영웅창고3열새위계.','모집배치/정비/자동전투분리,선택맥락정보·동일격자·직접전달원리를모바일에변형.','본문14/보조12/터치48,동일54px셀과5후보,제거된보스진형복구없음.','실제승인요청하지말고진행및후속배치요청범위로반복허락없이제작.','산출물최소기록만작성,Git커밋·푸시·통합·예약백업실행없음.']
assert p['iteration']==6 and len(p['documents'])==len(applies)==16
write('read-pack.json',p)
write('읽기확인.json',dict(task=p['task'],iteration=6,role='ui',workSummary='차수6 승인범위6장과영웅후보보조1장만신규v006제작; 상점→영웅→창고3열과전장중심정보위계를재설계; D3알파.74와동일셀/48px/14·12글자/원본보존/800배율행동경로검수.',documents=[dict(path=d['path'],sha256=d['sha256'],applies=a)for d,a in zip(p['documents'],applies)]))
extras=[(shared/'작업/MAIN02-20261109-9009B97A/발송지시-v006.md','기본6장집중·추가영웅탐색1장만,새3열전체위계와장비작업/배치/전투분리.'),(out.parent/'MAIN02-20261109-9009B97A-v003/결과보고.md','D3배경알파.74/불투명글자·곡면/선아이콘만승계.'),(out.parent/'MAIN02-20261109-9009B97A-v005/결과보고.md','대형상황판/문구덩어리/상하상점창고/디버그ID/18장증식을실패분석하고폐기.')]
write('추가참조읽기확인.json',[dict(path=str(f),sha256=hashlib.sha256(f.read_bytes()).hexdigest(),applies=a)for f,a in extras])
write('2_사전확인.md','# 차수6 제작 전 사전확인\n확인원문: 승인요청 하지말고 진행 / 참고해서 UI배치 뽑아와봐. 같은승인질문없음.\n허용:본v006신규독립시안·PNG6+영웅보조1·갤러리·연락판·검수·기록. 이전게임/시안/아트/공통규정/타메인/devImageCompare읽기전용.\n변경:상점2열상품판→중앙영웅→오른쪽작은창고3열; 54px동일셀·격자시작선·정렬통일; 상단작은정보와48터치분리; 대형안내/상시강조/디버그ID제거. 전장중심실배치와조건부영웅상세·자동전투분리.\n검수:전체800배율직접열람·48px/오버플로·3열시작선·동일셀/다칸수용·5후보/8탐색·스킬능력치동시·구매이동전투연속·원본해시. 창고/금전은미정샘플로보고서에한번명시. 자체검증과사용자합격분리.\n')
baseline={}
for folder in [root/'게임/src',out.parent]:
 for f in folder.rglob('*'):
  if f.is_file() and out not in f.parents and not any(part.startswith('edge-profile') for part in f.parts):baseline[str(f)]=hashlib.sha256(f.read_bytes()).hexdigest()
write('보존기준해시.json',baseline);print('Reading16, precheck and preservation baseline',len(baseline))
