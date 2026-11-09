from pathlib import Path
import json,subprocess,os,hashlib
out=Path(__file__).resolve().parent;root=out.parents[2];shared=Path('C:/Users/user/Desktop/Grid Defenders/작업관리')
p=json.loads(subprocess.check_output(['python',str(shared/'도구/작업대장.py'),'read-pack','--task','MAIN02-20261109-9009B97A','--main','main02'],env=dict(os.environ,PYTHONIOENCODING='utf-8')).decode())
def write(n,x):(out/n).write_text(x if isinstance(x,str) else json.dumps(x,ensure_ascii=False,indent=2),encoding='utf-8')
applies=['800×360/48px共通터치·원본보존·차수7착수후작업,이펙트수정없음.','매새작업본문재독·적용기록·start·자체검증후반환.','승인된세부4건과6PNG·5종기록,이전긍정평가와전체합격/통합구분.','담당main02로공식Orca회신,타메인/미커밋원본보존.','직접수행,다른담당·테스터임의생성없음,본인검수는사용자합격아님.','UI신규v007만작성,게임src·공통CSS·다른담당아트읽기전용.','v006깔끔한3열/D3/54셀유지,새규정은별도제안.','필독16문서path/sha256/applies로현재iteration7 role ui start,추가실제소스참조별도기록.','UI팀책임과독립검수경계보존,외주·계정·타영역제작없음.','자료분류와실제조직구분,기존아트소스위치보존.','새몬스터나장비스킬원본을창작하지않고기존UI표시만보완.','긍정평가한v006에도감/조건부적정보/조합접근과열림/가로전중후열3색만보완,추가승인질문없음.','v006의3열x12/216/508·격자y120·셀54/D3.74·간결한위계를유지,4건만변경.','본문14/보조12/터치48/800×360유지,오른쪽전열색만표시하고보스진형편집·제한신설없음.','같은UI후속에대한최신직접진행지시근거유지,이번발화에진행이있었다고날조없음.','제작과필수기록만작성,Git커밋·푸시·통합·예약백업없음.']
assert p['iteration']==7 and len(p['documents'])==16
write('read-pack.json',p);write('읽기확인.json',dict(task=p['task'],iteration=7,role='ui',workSummary='v006긍정평가배치를보존하고동일UI후속4건만신규v007에6PNG제작;도감조회/기존원레시피조합/중보스직전만적정보/가로전중후열색표시;54셀·48터치·800배율·소스근거·원본해시검수.',documents=[dict(path=d['path'],sha256=d['sha256'],applies=a)for d,a in zip(p['documents'],applies)]))
refs=[(shared/'작업/MAIN02-20261109-9009B97A/발송지시-v007.md','도감조회·조건부적정보·조합·배치3색6장범위와변경제외준수.'),(root/'게임/src/defenseConfig.ts','ITEMS/RECIPES원래효과·칸·네임드기본값을사용,4웨이브스케줄임의확정없음.'),(root/'게임/src/defense.ts','조합은동일소유자·변인접/중복소모금지·모루1·결과공간선검증;명시적창고재료선택. 적HP/공격은웨이브보정됨.'),(root/'게임/src/defenseView.ts','네임드왕관·파란둥근네모의실제표시근거;일반슬라임아트를새중보스로오인복제안함.'),(root/'게임/src/itemArt.ts','원본crop와I08전체그림비례·실점유표시,없는결과원화는실제칸모양도형으로명시.')]
write('추가참조읽기확인.json',[dict(path=str(f),sha256=hashlib.sha256(f.read_bytes()).hexdigest(),applies=a)for f,a in refs])
write('2_사전확인.md','# 차수7 제작 전 사전확인\n최신사용자지속진행근거와전문지시확인. v006긍정평가이며4건만추가;전면재설계/게임구현없음.\n허용:본v007신규6PNG/800검수본/소스/갤러리/비교판/보고·필수기록. 모든이전output/게임/아트/공통CSS/규정/타메인/devImageCompare읽기전용.\n유지:3열·54셀·y120·D3.74·간결정보/전장중심/5후보·8이름/기존정원.\n변경:장비다음도감탭/창고아래조합버튼과기존조건열림/중보스포함4회직전만적정보/오른쪽전열2열·중앙중열1열·왼쪽후열2열의색+라벨. 실제배치보너스·제한신설없음.\n검수:6PNG와800배율직접보기,48터치/정렬/조건부숨김/탭줄바꿈/원레시피/창고재료인접과결과수용/3색방향+라벨·유효강조구분/원본해시. 사용자합격과자체검증분리.\n')
baseline={}
for directory in [root/'게임/src',out.parent]:
 for f in directory.rglob('*'):
  if f.is_file() and out not in f.parents and not any(x.startswith('edge-profile')for x in f.parts):baseline[str(f)]=hashlib.sha256(f.read_bytes()).hexdigest()
write('보존기준해시.json',baseline);print('Reading16, precheck, originals',len(baseline))
