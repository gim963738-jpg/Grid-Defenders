from pathlib import Path
import json,subprocess,importlib.util,shutil,hashlib
ROOT=Path('C:/Users/user/Desktop/Grid Defenders'); S=ROOT/'작업관리'; HERE=Path(__file__).resolve().parent
CHAR=Path('C:/Users/user/orca/workspaces/Grid Defenders/캐릭터디자인2')
EXE='C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe'
def dump(p,v):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def write(p,t):p.write_text(t,encoding='utf-8')
def run(*args):
 p=subprocess.run([EXE,*args],capture_output=True,encoding='utf-8',check=True)
 return json.loads(p.stdout[p.stdout.index('{'):])

if __name__=='__main__':
 if (HERE/'연결.json').exists():raise SystemExit('Already prepared; do not duplicate the assignment')
 ps=run('worktree','ps','--json')
 row=next(w for w in ps['result']['worktrees'] if w['path'].replace('\\','/').rstrip('/')==CHAR.as_posix())
 dump(HERE/'전달전담당상태.json',row)
 if any(a.get('state') not in {'done','idle'} for a in row.get('agents',[])):
  raise SystemExit('Existing character agent has active or unclear state; no duplicate editor')
 request='''현이미지의 캐릭터 비율을 참고해서 우리가 디자인한 SD캐릭터의 캐릭터 신체부위를 조절하고, 이미지2의 각 캐릭터들이 성별 인상·콘셉트·특징·개성을 어떤 요소로 표현했는지 분석해서 기존 금발 전사를 리모델링한 시안 4개를 만든다. 기존 SD 1개와 신규 4개를 비교하는 사진을 이미지3의 오른쪽 화면에 띄운다.'''
 approved='''메인이 이해한 범위: 이미지1의 머리·몸통·팔·다리·손발 비율 분석, 이미지2의 얼굴·헤어·체형·의상 실루엣·색·장식 분석, 금발전사 정체성을 유지한 4개 시안 제작, 원본+신규4개를 같은 전시 크기·발선으로 비교, 결과만 지정 오른쪽 영역 표시.\n사용자 확인 원문: 진행'''
 write(HERE/'사용자확인.md',request+'\n\n'+approved+'\n')
 spec=importlib.util.spec_from_file_location('board',S/'도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(S)
 task=b.new('main01','characters','금발 전사 SD 비율·개성 리모델링 4안',request);folder=b.folder(task['id'])
 refs=[
  Path('C:/Users/user/AppData/Roaming/orca/agent-session-attachments/8b2d3738-4a80-49f0-898c-dd34d28886b3/orca-paste-1794211506995-919ec7e6-17d6-4089-a44d-65c47621e703.png'),
  Path('C:/Users/user/AppData/Roaming/orca/agent-session-attachments/b84d3f42-3a33-4ad0-8b99-33da7c6d9fc3/orca-paste-1794211568587-15927aa7-4abe-487a-8904-a9f5e6400f4f.png'),
  Path('C:/Users/user/AppData/Roaming/orca/agent-session-attachments/93ff857d-5f81-4b55-8d3c-d7fe34f5beab/orca-paste-1794211748374-b1382ed4-c4eb-4e07-8a80-aaa59b939054.png')]
 (folder/'참조').mkdir()
 copies=[]
 for i,p in enumerate(refs,1):
  q=folder/f'참조/reference-{i}.png';shutil.copy2(p,q);copies.append(str(q))
 identity=CHAR/'output/characters/gc9_longsword_dagger/pixel_8views_v01/images/01_front_000.png'
 output=CHAR/'output/characters/gc9_longsword_dagger'/('sd_remodel_4_'+task['id'].lower())
 readings=[CHAR/'문서/02_세부기획/02_영웅/SD_공통제작기준.md',CHAR/'자료/캐릭터설정/SD_공통제작기준.json',
  CHAR/'output/characters/gc9_longsword_dagger/pixel_8views_v01/제작기준.md',CHAR/'output/characters/gc9_longsword_dagger/제작기준.md',
  CHAR/'문서/02_세부기획/02_영웅/캐릭터제작규약.md',CHAR/'문서/02_세부기획/02_영웅/한손무기그립기준.md']
 for p in readings:
  if not p.is_file():raise SystemExit('Missing specific reading '+str(p))
 prompt=f'''# 승인된 캐릭터 팀장 제작 지시 — {task['id']} / 차수 1

담당 main01 → characters(캐릭터 팀장). 당신은 이 작업 공간의 캐릭터 팀장 역할로 실제 결과물을 제작하고 총괄에게 보고한다. 기존 채팅/원본은 보존한다. 기존 담당의 최근 상태는 완료로 확인하고 같은 공간에서 이 작업의 단일 편집자로 실행한다.
사용자 요청: {request}
이해 확인 근거: {HERE/'사용자확인.md'}; 사용자 실제 답변은 “진행”. 범위 재승인을 요구하지 않는다.
도메인: 세계관 / 캐릭터. 기본 모델 GPT-6.1 Sol / medium. 이미지 도구의 모델과는 별개다.

## 작업 전 반드시 수행
1. 자기 AGENTS, 작업연결, 자기 작업진행방법, 작업대장 read-pack과 추가 필독을 본문으로 전부 읽는다. 본문이 잘리면 파일을 나눠 읽는다. 기록만 기계적으로 복사하지 않는다.
2. 이번 작업의 적용 요약과 문서별 해시/적용 내용을 읽기확인 JSON으로 작성한 뒤 start를 통과해야 제작한다. 전송 영수증은 총괄이 worker-start 직후 연결한다. 발송 기록만 아직 없으면 원작업 task.json 상태를 읽어 확인하거나 orchestration ask로 연결을 요청한다. 사용자 승인 문제로 돌리지 않는다.
3. imagegen SKILL.md를 읽고 내장 image_gen 도구로 실제 신규 시안을 제작한다. 화면/기하도형으로 캐릭터를 그리거나 사진을 수학적으로 늘린 것만으로 시안을 대신하지 않는다. 기존 유료 외주 API/크레딧 호출은 이번에 불필요하다. 도구 미지원이면 즉시 실제 제약과 가능한 경로를 총괄에게 보고한다.

## 실제 입력과 우선순위
- 참고 1 (신체 비율): {copies[0]}
- 참고 2 (여러 캐릭터의 개성 표현): {copies[1]}
- 참고 3 (최종 자료 표시 위치만, 작화 참조 아님): {copies[2]}
- 기존 금발 전사 SD 정면 원본: {identity}
- 같은 폴더의 사선/정측면은 장비 확인 보조. 출력은 정면 대기 자세를 주 비교로 통일한다.
모든 대상 이미지를 view_image로 실제 확인한다. 원본보다 미검증 실패 시안을 우선하지 않는다.
최신 직접 요청이 기존 ‘은발 마법사와 동일한 신체 비율’, ‘시안은 1장 후 승인’, ‘일러스트부터 시작’과 충돌하는 부분은 이번 승인된 SD 4안 비교 범위에서 최신 요청을 우선한다. 이번엔 방향 세트/애니메이션/게임 통합을 제작하지 않는다. 새 비율을 공통 규정 전체에 확정하지 않는다.

## 전문 분석과 시안 차별화
참고1의 모발 포함 머리/얼굴 머리 단위, 턱·어깨·골반·무릎·발선의 상대 위치, 몸통/다리/팔 길이와 어깨·손발 폭을 분석한다. 작은 이미지의 원근·가림·픽셀 한계를 기록하고 실측 가능한 비율과 추정치를 구분한다. 빨간 표시선은 사용자 주석이며 몸/복장에 그려 넣지 않는다.
참고2는 확실히 보이는 인물들을 골라 헤어 실루엣/눈썹·눈·턱/어깨와 허리/상·하의/장화/큰 모자·소품/색 대비/선의 굵기와 명암이 어떻게 성별 인상·직업·성격을 전달하는지 구체적으로 분석한다. 외모로 실제 성별이나 공식 캐릭터명을 확정하지 말고 시각적 인상과 콘셉트 추정으로 표기한다. 단순히 ‘남성은 짧은머리/여성은 긴머리’로 축약하지 않는다.
기존 금발 전사의 청년 남성 인상, 금발 뾰족 헤어, 갈색 눈, 푸른 목도리/내려진 후드, 은빛 갑옷, 청색 허리 천, 갈색 벨트/바지, 오른손 장검·왼손 단검, 오른쪽 견갑 초승달, 오른쪽 판금 정강이·왼쪽 청색 천 장화와 금속 보호대라는 정체성을 유지한다. 무기는 인체 기준 좌우다. 장검의 청색 사선 장식·날개 가드·고리형 손 보호대와 단검의 짧은 각진 날을 보존한다. 긴 망토를 추가하지 않는다.
새 비율을 공통으로 적용하되 다음과 같이 서로 구분되는 4안의 디자인 포인트를 설계하라(세부 외형은 분석에 맞게 조정 가능):
1. 원형 계승 — 기존 인상을 가장 가깝게 보존하며 새 신체 비율/갑옷 덩어리 정리.
2. 민첩한 쌍수 전사 — 날렵한 어깨·허리·다리선과 헤어 리듬으로 기동성 강조.
3. 단단한 전위 전사 — 상체/갑옷 실루엣·견갑·눈썹 인상으로 안정감 강조. 캐릭터 본체의 전시 높이는 동일.
4. 개성 강조 모험 전사 — 금발 헤어·목도리·시선/표정과 비대칭 장비 대비로 작은 크기에서도 인상 강화.
이는 같은 캐릭터 4안이다. 새 성별/별개 인물/계급/세계관 출신을 임의 확정하거나 새로운 게임 스탯을 추가하지 않는다. 단순 색상 교체만 한 4안은 불충분하다.

## 산출물과 허용 파일
새 제작 폴더: {output}
허용: 위 새 폴더 및 원작업 기록 폴더 {folder}. 기존 파일 수정·덮어쓰기 금지. 공유 규정 변경은 제안만 따로 기록한다. 카탈로그/게임 실행 코드 편집·자동 Git 통합/커밋/푸시는 하지 않는다.
필수 산출물:
- 분석.md: 비율 분석·참고2 개성 분석·각 안 적용점·기존 기준과 차이.
- 신규 개별 PNG 4개(원본 결과 바이트 보존), 사용한 이미지 입력/프롬프트/설정/생성 결과 기록.
- comparison.png: 원본 1개+신규 4개 총5열, ‘기존 / 1 / 2 / 3 / 4’ 명확한 표기, 발선과 전시 본체 높이를 맞춘 중립 배경. 기존 원본은 새로 그려서 바꾸지 않는다. 가로 압축/몸체 비균일 변형 금지. 전시용 등비 조절은 HTML/CSS 등 비교용에서만 수행하고 실제 개별 원본은 유지한다.
- index.html: 오른쪽 좁은 화면에서도 5개 전체를 축소 비교하고 누르면 크게 볼 수 있는 비교 페이지. 이미지 비교표를 HTML로 구성하고 별도 브라우저의 캡처로 PNG를 내보내도 된다. 데스크톱 창을 움직이거나 사용자의 현재 브라우저 탭을 탐색하지 말고, 실제 앱 표시 동작은 총괄이 완성 후 한정 수행한다.
- 검수.md: 4개 존재/실제 이미지 확인/정체성/장비 좌우/손가락·무기·잘림/비율/밝은·어두운 배경 검수. 통과를 사용자 합격이라고 말하지 않는다.
- 결과.json: task,iteration,role,status,outputPaths,originalPath,originalSha256,readingAcknowledgement,checks,remainingIssues. 원작업 3/4/5 기록도 실제 결과로 작성.
원작업의 1/2 기록은 이미 총괄이 시작 전에 작성했다. 자기 세부 작업 전 추가 사전확인을 생성한다.

## 회신·완료
최종 보고에 생성된 4개와 비교 PNG·HTML의 절대 경로를 포함하고 worker_done으로 회신한다. 결과물을 실제 열어 확인한 증거를 남긴다. 도중에 유료 호출, 도구 제약, 원본 충돌이 있으면 승인 범위 내 대안을 먼저 확인하고 막히는 점만 ask한다. 임의 색상판·플레이스홀더를 완료로 반환하지 않는다.
사용자는 화면을 자꾸 건드리지 말라고 했다. 작업 중 앱 UI/모델설정/창 크기/패널/탭을 조작하지 않는다. 완성된 비교자료를 지정 영역에 표시하는 것은 사용자 승인 범위지만 총괄이 한 번만 처리한다.
'''
 write(folder/'요청확인.md',approved)
 write(folder/'전문프롬프트.md',prompt)
 write(folder/'1_대화기록.md',request+'\n\n'+approved)
 write(folder/'2_사전확인.md','# 사전확인\n담당 main01. 캐릭터 규정과 작업진행방법, SD 공통/금발 원본 기준, 공유 운영 문서를 읽고 위 범위로 지시를 준비한다. 사용자 진행 확인 후 생성/수정 지시가 허용되었다. 기존 담당 완료 상태를 조회했다. 기존 캐릭터 원본 보존, 새 폴더에만 제작, 기술/미적 합격을 구분한다. 대상 폴더와 완료 기준은 전문프롬프트에 명시했다.\n')
 b.set_readings(task['id'],'main01',[str(p) for p in readings])
 b.confirm(task['id'],'main01','진행',HERE/'사용자확인.md')
 plan=b.prepare(task['id'],'main01')
 dump(HERE/'연결.json',{'task':task['id'],'folder':str(folder),'plan':plan,'output':str(output),'characterLiveness':[{'state':a.get('state'),'paneKey':a.get('paneKey'),'observation':a.get('subagentObservation')} for a in row.get('agents',[])]})
 print(json.dumps({'task':task['id'],'prompt':plan['prompt'],'selector':plan['selector'],'liveness':[a.get('state') for a in row.get('agents',[])]},ensure_ascii=False))
