from pathlib import Path
import importlib.util,json,subprocess
R=Path('C:/Users/user/Desktop/Grid Defenders');H=Path(__file__).resolve().parent;p=H/'실제발송영수증.json'
if p.exists():raise SystemExit('Receipt exists; inspect before recovery. Do not resend.')
l=json.loads((H/'연결.json').read_text(encoding='utf-8'));plan=l['plan']
body=(f"main01 신규정식작업 {l['task']} 차수1. 실제 사용자 '분리작업 진행하고…진행해줘…이미지2.6사용한다' 및 구성질문응답 '총8장,3/4뷰4장 전신/파츠분리+우측뷰4장 전신파츠분리'를 기록했습니다. "
      f"자동필독첨부발송문 {plan['prompt']} 전체와최신사용자확인/선택을읽고새ACK/start후착수하세요. "
      "기준은직전내장A-male/A-female(사용자선택),기존3/4전신2장은보존사본. 새90도정측면남녀2장과각시점성별의분리/가림복원을기존사용자GPT Image2.6/high API로제작합니다. "
      "주요결과는남성35전신+파츠판/여성35전신+파츠판/남성90전신+파츠판/여성90전신+파츠판=8장,개별파트PNG는부속입니다. "
      "Head/Torso/Pelvis·좌우상완/전완/손/허벅지/종아리/발을완성형으로분리하고90도에서완전히가려진부위도복원해펼침판에표시. 검은티·반바지·민머리·기존SD체형/얼굴·입상유지. 가시추출과AI추정복원을구분하고재조립/알파·밝은배경/관절연결검수. "
      "이미지모델은최신사용자지정GPT2.6,내장/타사대체없음. 기존어댑터/키메모리한정,외부텍스트영상API/자동재시도/추가결제·충전/UI·env수정금지. 초기6회내최소요청+필요국소보완최대2회는작업내관리범위이며사용자금액예산으로기록하지않음. "
      "새output만수정,원본/기존작업/게임/공통규정/카탈로그/현재화면/Git보존. 리깅·걷기애니메이션·게임적용으로확대하지마세요. "
      "실제8장/개별PNG/갤러리/재조립·보고·검수·API횟수usage·한계를worker_done으로main01에회신하세요. 전문작업을세분화할경우같은원작업/필독/사용자범위를전달하되동일파일중복편집금지.")
cmd=['C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe','orchestration','send','--to','dispatch:ctx_33d71f8f3bbe','--type','dispatch','--subject',l['task']+' GPT2.6 남녀35·90도 전신/숨은부위파츠 총8장','--body',body,'--json']
r=subprocess.run(cmd,capture_output=True,text=True,encoding='utf-8',errors='replace');p.write_text(r.stdout+('\n'+r.stderr if r.stderr else ''),encoding='utf-8');print(r.stdout,flush=True)
if r.returncode:raise SystemExit(r.returncode)
d=json.loads(r.stdout)
if not d.get('ok'):raise SystemExit('No successful receipt; inspect before any resend.')
spec=importlib.util.spec_from_file_location('board',R/'작업관리/도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(R/'작업관리');b.record(l['task'],'main01','sent',p)
l['state']='delivery_receipt_recorded';l['delivery']=d['result'];(H/'연결.json').write_text(json.dumps(l,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({'task':l['task'],'state':l['state']},ensure_ascii=False),flush=True)
