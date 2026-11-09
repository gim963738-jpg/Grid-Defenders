from pathlib import Path
import subprocess,json,os,hashlib
root=Path.cwd();out=root/'output/ui-concepts/MAIN02-20261109-9009B97A-v008';out.mkdir(exist_ok=True);shared=Path('C:/Users/user/Desktop/Grid Defenders/작업관리')
p=json.loads(subprocess.check_output(['python','-X','utf8',str(shared/'도구/작업대장.py'),'read-pack','--task','MAIN02-20261109-9009B97A','--main','main02'],env=dict(os.environ,PYTHONIOENCODING='utf-8')).decode())
a=['800×360/48터치;본작업UI시안만,이펙트수정없음','매작업본문재독/적용기록/start/결과검수','확인된차수8만제작;5종필수기록/원본과사용자판정보존','담당main02공식Orca회신;타메인범위제외','직접제작;하위담당/테스터생성없음;자체검수와합격구분','신규v008만편집;게임/아트/공통CSS읽기전용','v006깔끔함/D3/54셀유지;피드백별도제안','iteration8 role ui ACK/start;필독본문읽기','UI책임과팀경계준수;타팀원본제작없음','도메인분류와실제조직구분;색인지정원본보존','몬스터/아이템신규원본창작없이실제표시근거참조','그렇게진행원문과파란선held전용정정우선;7상태제작','v007독립조합창제거;D3/3열/54셀과기능유지','본문14/보조12/터치48;800×360비율;최신시안5x5만표시','보고v1.2상태목록/완료초록구분/실제다음행동과승인상태명시','차수8명시적진행승인근거적용;같은허락재질문없음','출력및최소기록만;요청없는커밋푸시백업금지']
assert p['iteration']==8 and len(p['documents'])==len(a),(len(p['documents']),len(a))
def write(n,x):(out/n).write_text(x if isinstance(x,str)else json.dumps(x,ensure_ascii=False,indent=2),encoding='utf-8')
write('read-pack.json',p);write('읽기확인.json',dict(task=p['task'],iteration=8,role='ui',workSummary='v008신규7PNG;도감이미지뒤점유블록/held전용파란선/장비화면즉시조합/우측조작과5x5/좌몬스터우정보;54셀48터치·状態연속성·원본해시검수;게임미반영',documents=[dict(path=d['path'],sha256=d['sha256'],applies=x)for d,x in zip(p['documents'],a)]))
write('2_사전확인.md','차수8 실제승인 그렇게 진행 및 held전용파란선정정 확인. 허용v008만;기존게임/이전출력/아트/규정/타메인읽기전용. 7PNG2400x1080/800검수본/갤러리/보고. idle-click-purchase-drop-cancel무선/held상대만선,기존조합조건1개연속예시,도감큰이미지뒤블록,우측5후보+영웅8/5x5판,좌목록우상세검수. 게임구현/커밋푸시없음. 생성착수는start통과후.')
baseline={}
for directory in [root/'게임/src',out.parent]:
 for f in directory.rglob('*'):
  if f.is_file() and out not in f.parents and not any(x.startswith('edge-profile')for x in f.parts):baseline[str(f)]=hashlib.sha256(f.read_bytes()).hexdigest()
write('보존기준해시.json',baseline)
print('ACK17 / baseline',len(baseline))
