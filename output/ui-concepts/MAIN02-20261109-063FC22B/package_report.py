from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,hashlib

root=Path(__file__).resolve().parent
workspace=root.parents[2]
names=['01-A-wave','02-A-boss','03-B-wave','04-B-boss','05-C-wave','06-C-boss','07-placement','08-tower-upgrade','09-shop','10-shared-bag','11-equipment-combination','12-hero','13-skill','14-pause','15-boss-formation','16-boss-allies']
titles=['A 웨이브 기본','A 보스 기본','B 웨이브 기본','B 보스 기본','C 웨이브 기본','C 보스 기본','타워 배치','선택 타워·강화','상점 펼침','공용 가방 펼침','장비·조합 펼침','영웅 정보','스킬 상세','웨이브 준비·일시정지','보스전 진형 편집','보스전 아군 상태·스킬']
font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',22)
small=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',16)
for filename,indices,cols in [('비교연락판-ABC.png',list(range(6)),2),('비교연락판-전체16.png',list(range(16)),4)]:
    w,h=600,270
    rows=(len(indices)+cols-1)//cols
    sheet=Image.new('RGB',(cols*(w+16)+16,rows*(h+56)+68),'#142426')
    draw=ImageDraw.Draw(sheet)
    draw.text((16,12),'GRID DEFENDERS · UI 비교 제안 · 사용자 미선택',font=font,fill='#ead5a3')
    for k,i in enumerate(indices):
        x=16+(k%cols)*(w+16);y=60+(k//cols)*(h+56)
        im=Image.open(root/(names[i]+'.png')).convert('RGB');im.thumbnail((w,h),Image.Resampling.LANCZOS)
        sheet.paste(im,(x,y));draw.text((x,y+h+8),f'{i+1:02}  {titles[i]}'+(' · 대표 비교안' if i>=6 else ''),font=small,fill='#dedbc9')
    sheet.save(root/filename)

receipt=json.loads((root/'layout-receipt.json').read_text(encoding='utf-8-sig'))
layout=json.loads(receipt['result']['result'])
(root/'버튼위치.json').write_text(json.dumps(layout,ensure_ascii=False,indent=2),encoding='utf-8')
base=json.loads((root/'source-baseline.json').read_text())
changed=[p for p,h in base.items() if hashlib.sha256((workspace/p).read_bytes()).hexdigest()!=h]
records=[]
for i,name in enumerate(names):
    p=root/(name+'.png');im=Image.open(p)
    assert im.size==(2400,1080),(name,im.size)
    records.append(dict(number=i+1,title=titles[i],path=str(p),width=im.width,height=im.height,sha256=hashlib.sha256(p.read_bytes()).hexdigest()))
assert len(records)==16
assert not changed,changed
assert all(not x['small'] and not x['outside'] and not x['overlaps'] for x in layout)
validation=dict(task='MAIN02-20261109-063FC22B',iteration=1,role='ui',pngs=records,logicalSize=[800,360],physicalSize=[2400,1080],sourceFilesChecked=len(base),changedGameSources=changed,buttonCount=sum(len(x['buttons']) for x in layout),smallButtons=0,outsideButtons=0,buttonOverlaps=0,grids={'bag':21,'equipment':20,'formation':42},scope='독립 정적 시안 자체검증, APK 실기기/런타임/사용자 합격 아님')
(root/'검증결과.json').write_text(json.dumps(validation,ensure_ascii=False,indent=2),encoding='utf-8')

desc=[
'상단 웨이브·시간·재화 / 우상단 조작 / 하단 병사·영웅·상점·진형·가방 독. 왼쪽 배치와 오른쪽 진입을 수평 교전으로 연결.',
'보스 HP와 시간 최우선. 하단 영웅3명 평타·수동스킬, 우하단 지휘. 전장 격자와 받침을 제거하여 이동전투 표현.',
'좌측 세로 현황판, 화면 폭 하단 명령 띠, 사각 종이 프레임. A와 정보 흐름 및 패널 재료를 비교.',
'좌측 세로 영웅 스킬 장부로 변경. 중앙 교전을 넓게 확보하고 우측 진형·아군 접근 유지.',
'우측 세로5버튼, 좌상단 캡슐형 현황. 전장 하단을 비워 손가락 도달과 시야 확보의 교환관계 제시.',
'보스 체력을 좌측 별도 카드로 분리. 둥근 지휘버튼·독립 영웅 카드와 우측 도구 사용.',
'기존 보병·궁병·마법병 소환을 방어 배치로 표현. 하단3종, 오른쪽 비용·능력치·취소/배치선택.',
'기존 병사 강화와 이동 표시. 보병 Lv.1 공격26→33, 강화30G는 현행 임시식 예시이며 신규 타워 밸런스가 아님.',
'하단 판매상품5개+새로고침1개. 선택한 철검만 구매 툴팁 표시. 오른쪽 장비/가방 접근과 닫기.',
'공용7×3 고정21칸을 48px 칸으로 표시. 오른쪽 확장판과 하단 장비/상점 복귀. 원본 가방 확장 없음.',
'영웅5×4와 공용7×3을 전체 관리판에 병렬 배치. 닫기/전투복귀, 드래그장착·두번회전, 기존 일괄조합.',
'아리아 근접딜러 현행10항목 능력치 표시. 닫기와 착용장비·스킬상세 접근. 로비 성장 연동을 주장하지 않음.',
'현재 보스 화염 기둥의 기본피해×3·범위·사거리 조건 표시. 닫기/영웅정보 복귀. 스킬 아이콘은 임시 UI 문양.',
'현재 웨이브를 수동 정지한 준비 상태. 재개·병사·장비·배속·준비중설정·로비복귀. 새로운 자동 준비단계를 추가하지 않음.',
'7×6=42칸, 위쪽 진행, 전중후열 각2행. 영웅은 중열. 자동배치/완료/닫기. 다음 보스 반영 및 편집정지 명시.',
'기존 영웅의 생존체력·스킬 준비/재사용 정보를 확대. 금발전사 미부여 명시, 자동스킬과 닫기. 새 치료·스킬 추가 없음.'
]
report=['# 전투 UI 비교 시안 결과보고','',
'작업 MAIN02-20261109-063FC22B / 차수1 / main02 → ui / 2026-11-09. **PNG16장 제작·자체검증 완료, 사용자 선택·합격 및 게임 반영 전.** 07~16은 A 구조를 사용한 대표 비교 제안이며 사용자가 A를 선택한 것이 아니다.','',
'## 산출물','',f'산출 폴더: `{root}`. 개별 PNG는 모두 **2400×1080 (800×360의 3배)**이며 동일 20:9 비율이다. 연락판은 개별 원본을 대체하지 않는다.','',
f'- [A/B/C 비교 연락판]({(root/"비교연락판-ABC.png").as_posix()})',f'- [전체16 연락판]({(root/"비교연락판-전체16.png").as_posix()})',f'- [독립 시안 소스]({(root/"concepts.html").as_posix()}) — ?n=1~16으로 상태 선택, 게임 연결 없는 정적 렌더.',f'- [좌표 원문 JSON]({(root/"버튼위치.json").as_posix()}) / [검증결과]({(root/"검증결과.json").as_posix()})','',
'|번호|안·상태|개별 PNG 절대경로|','|---|---|---|']
for i,r in enumerate(records):report.append(f'|{i+1:02}|{titles[i]}|[{names[i]}.png]({Path(r["path"]).as_posix()})|')
report += ['', '## 비교안의 선택 지점','',
'A Gilded Command: 어두운 금속과 얇은 금색 외곽, 하단 공통 명령 독. 기능 분류가 직관적이고 펼침 구조 연결이 쉽다. 하단64px를 점유하는 만큼 전투 시야가 줄어든다.','',
'B Field Journal: 좌측 세로 현황, 폭 전체 하단 명령, 보스 영웅 조작은 좌측 세로 장부. 종이 프레임과 사각 버튼이 고전 판타지에 어울리고 정보 탐색 순서가 명료하다. 밝은 패널 면적과 좌측 점유가 더 크다.','',
'C Verdant Tactics: 캡슐형 상태, 우측 세로 명령, 보스 체력의 좌측 별도 카드와 둥근 지휘. 전장 하단이 넓고 조작 접근이 일정하다. 우측 적 진입부와 도구를 함께 배치하므로 진입 표시를 안쪽으로 옮겼다.','',
'## 공식 참조 조사','',
'조회일 2026-11-09(KST). 공식 Steam 상점 본문을 조회하고 Steam appdetails가 제공한 공식 게임 스크린샷을 내려받아 **실제로 열어 관찰**했다. 저장본과 정확한 이미지 URL은 references/sources.json에 있다. 아래 세 게임은 유사 레퍼런스이며 최근 인기 순위·현재 이용자 순위를 주장하지 않는다. 조회 당시 최근30일 긍정 리뷰가 있다는 사실과 인기 순위는 구분한다.','',
'|게임·출처|실제로 관찰한 배치·장점·단점|이번 적용|','|---|---|---|',
'|[Thronefall](https://store.steampowered.com/app/2239150/Thronefall/)|첫 공식 화면은 UI 없이 큰 전장 여백과 명확한 성벽·전투 공간을 보여준다. 군집·지형 경계가 잘 읽히지만 이 화면만으로 상세 메뉴 사용성을 평가할 수 없다.|장식은 외곽에, 교전은 중앙에. 로우폴리 그림 자체는 복제하지 않았다.|',
'|[The King is Watching](https://store.steampowered.com/app/2753900/The_King_is_Watching/)|좌측 생산 격자·우측 전장·상단 시간/배속·하단 자원이 분리된다. 역할 분류는 명료하나 모바일로 그대로 축소하면 밀집된다.|관리판과 전투면 분리, 조작 묶음. 생산·왕의시선·자원 체계는 도입하지 않았다.|',
'|[Backpack Battles](https://store.steampowered.com/app/2427700/Backpack_Battles/)|왼쪽 가방과 오른쪽 상품 선반, 가격표가 물품과 결합한다. 장비 형태와 공간 제약이 명료하나 다수 정보·장식의 면적 비용이 크다.|상품5개와 고정 가방을 구분, 11번은 두 격자를 충분한 크기로 병렬 배치. 캐릭터/프레임/아이템은 복제하지 않았다.|','',
'공식 본문 최근30일 리뷰 조회값: Thronefall 155건/긍정90%, The King is Watching 111건/93%, Backpack Battles 92건/84%. 이는 조회 시점 스냅샷이며 판매량·동시접속·순위 근거가 아니다.','',
'첨부 YouTube 화면은 직접 열었다. 브라우저·YouTube 외곽은 제외하고 **왼쪽 배치·중앙 교전·오른쪽 진입**만 반영했다. 기존 순환 길목을 직선으로 바꾼 것은 제안 이미지에만 적용했다.','',
'## 기존 기능과 제안 경계','',
'읽은 구현 근거: 게임/src/landscape-entry.ts(메뉴·상점·영웅10능력치), defenseConfig.ts(영웅3/상품5/가방7×3/장비5×4/가격·공격), mobile-ui.css, bossBattle.ts 및 bossBattleView.ts(이동전투·스킬·보스HP6000), battleFormation.ts(7×6·중열), itemArt.ts(아이템 원본추출), soldierArt.ts·heroArt.ts·blondArt.ts·rangedArt.ts(원본), 현재구현현황 및 모바일UI규격.','',
'시안 속 시간·HP·골드·인원·장비 위치는 기능 표시를 위한 합성 예시다. 정식 밸런스나 하나의 실제 저장게임을 캡처한 값이 아니다. 시험 보스는 현행 시험 보스의 체력6000을 표시하고 슬라임 원본으로 외형을 임시 표현했다. 기존 메인 영웅과 아트 정체성·로비 연동이 확정된 것으로 간주하지 않는다.','',
'타워는 이번 사용자의 방어 배치 요청을 표현하는 명칭이며 새 지원 건물이나 별도 스킬을 설계하지 않았다. 기존 병사3종의 소환·강화·이동을 대응시켰다. 방어 유닛 받침은 배치 상태를 설명하는 시각 제안이다. 보스는 받침·고정 격자 없이 접근하는 아군·보스·친위대로 표현했다.','',
'가방 단독 진입, 스킬상세·아군상태 확대판, 전체 장비 관리판, 정지 메뉴의 바로가기는 **기존 정보·기능에 대한 UI 접근 제안**이며 현행 게임에 이 화면들이 구현되어 있다는 뜻이 아니다. 설정은 현행 disabled 상태를 유지해 준비중으로 표시했다. 금발전사 스킬 미부여·평타 자동을 유지했다.','',
'## 화면별 기능과 버튼 좌표','',
'좌표는 800×360 논리화면의 (x,y,width,height). PNG 픽셀은 각 값의3배다. 표는 화면에 보이는 모든 버튼을 기록하며 버튼 아이콘 글자는 기능 식별용이다. 07~16 기본 우상단 제어는 유지하며, 11·15의 전면 관리에서는 뒤쪽 제어를 숨겨 닫기와 충돌하지 않게 했다.','']
for i,row in enumerate(layout):
    report += [f'### {i+1:02} {titles[i]}', '',desc[i],'','|버튼|위치·크기|','|---|---|']
    for b in row['buttons']:
        coord=', '.join(str(round(b[k],1)) for k in ['x','y','width','height'])
        report.append(f'|{b["text"].replace(chr(10)," ")}|({coord})|')
    report.append('')
report += ['## 적용 기준·읽기확인','',
'read-pack 15문서를 본문으로 읽고 각 문서 path/sha256/applies를 읽기확인.json에 작성했다. start는 2026-11-09 17:35:06 KST in_progress로 통과했다. 수신 sent 영수증은 현재 작업에 연결되어 있었다. 사전확인·read-pack·읽기확인·게임소스 기준 해시는 이 산출폴더에 보존했다.','',
'기본 여백12px·간격8px·본문14px·보조12px·제목20px·최소 터치48px를 적용하고 공통 mobile-ui.css를 읽기 전용으로 연결했다. 인벤토리와 진형도 이번 비교안에서는 칸48px로 제안했다. 기존 좁은 오른쪽 30×42 진형 예외와 달리 제안은 더 넓은 오른쪽 영역을 사용한다. 이는 활성 규정 개정이 아니라 사용자 비교용 배치 변경이다.','',
'## 사용 도구·프롬프트','',
'내장 image_gen.imagegen 1회로 배경판을 생성했다. 성공 원본을 terrain.png로 복사했다. 유료 API/다른 모델/CLI 생성 전환 없음. 배경 원본 해상도는 생성 도구 결과 그대로 보존하고, 시안 안에서 비율에 맞춰 표시했다. 정확한 프롬프트는 prompts.json. UI와 한글은 독립 HTML/CSS/JavaScript를 작성하여 Edge 헤드리스로 렌더링했다. 게임/src는 전부 읽기 전용이다.','',
'Orca 내장 브라우저에서 구조를 열고 DOM 좌표를 검증했다. 내장 screenshot은 같은 화면 일부가 반복되는 캡처 오류가 있어 최종 PNG 저장에 사용하지 않았다. 설치된 Edge를 별도 output 내부 임시 프로필로 실행했다. render.ps1은 이 과정을 재현한다. Python Pillow는 PNG 크기·해시 검사 및 비교 연락판 구성에만 사용했다. 스프라이트 시트는 원본 분해·재조립 없이 HTML의 SVG 뷰포트로 한 프레임을 표시하며 이웃 프레임 노출을 검수 중 수정했다.','',
'## 검증 결과와 한계','',
f'- 개별 PNG16장, 전부2400×1080·20:9·고유 해시 확인. 축소 연락판 외 원본을 모두 제공했다.',
f'- 전체 {validation["buttonCount"]}개 표시 버튼에서 최소48×48, 화면밖0, 버튼끼리겹침0. DOM 검사 결과·실제 좌표 원문 보존.',
'- 가방21칸/장비20칸/진형42칸, 상품5개+새로고침, 영웅3명 표시 확인.',
'- 밝은 숲 전장 배경의 각 PNG를 직접 열어 확인했다. 웨이브 왼쪽 방어/오른쪽 진입, 보스 이동전투 차이, 메뉴 닫기/복귀, 숫자와 한글·프레임 경계·패널 내용을 점검했다.',
'- 초안에서 스킬명 줄바꿈, 이웃 프레임 노출, 상세하단 가림을 발견하여 수정 후 재렌더·재열람했다. 12번10능력치와16번미부여 문구가 최종 이미지에서 전부 보인다.',
f'- 게임/src {len(base)}개 파일의 작업 전후 SHA256 동일. 원본과 기존 미커밋 변경 보존. Git commit/push·통합 없음.',
'- 실제 게임 작동·새 UI 조작 이벤트·전투 밸런스·APK/실기기·동적 저장·플레이 성능은 검사하지 않았다. 정적 시안이므로 사진 안 버튼을 실행 가능한 완성기능으로 보고하지 않는다.',
'- 자체 검증 완료는 사용자 미적 합격을 대신하지 않는다. 다음 단계는 메인의 검수와 사용자 A/B/C 또는 부분 조합 판정이며 게임 구현은 별도 범위다.','',
'## 기준 보완 제안 (미확정)','',
'전투 UI 비교안에는 정보 구조·프레임·버튼 조형 차이를 함께 남기고, 상태별 최소 터치와 글자 넘침을 이미지로 재검토할 것을 제안한다. 시트 표시 SVG는 원본 추출 뷰포트와 화면 맞춤 뷰포트를 분리해 이웃 프레임이 비치는 문제를 막는다. 규정 원본은 수정하지 않았다.','']
(root/'결과보고.md').write_text('\n'.join(report),encoding='utf-8')
(root/'1_대화기록.md').write_text('사용자 요청 및 진행 확인은 read-pack 사용자요청.md 참조. main02의 전문 하달로 독립 비교 시안16장 제작. A/B/C 미선택, 실제 게임 구현 제외.\n',encoding='utf-8')
(root/'3_작업일지.md').write_text('2026-11-09 필독/start → 공식 화면 조사 → 내장 배경 생성 → 독립 UI16상태 → Edge PNG → 직접 이미지검수/수정 → DOM 최소터치 및 소스보존 검사 → 연락판·보고서. 상세 원인·결과는 결과보고.md.\n',encoding='utf-8')
(root/'4_정의문서.md').write_text('정의: 800×360 논리화면,2400×1080 PNG,3개안 기본6장/대표A 비교용10장. 버튼 좌표는 버튼위치.json. 기능/제안/미구현 구분은 결과보고.md.\n',encoding='utf-8')
(root/'5_버전관리.md').write_text('본 output 폴더에만 새 산출물 저장. 게임/src 전후 해시 동일, 기존 미커밋 원본 보존. Git commit/push·게임통합·사용자합격 없음.\n',encoding='utf-8')
print(json.dumps({'pngs':len(records),'buttons':validation['buttonCount'],'sourceFilesUnchanged':len(base),'report':str(root/'결과보고.md')},ensure_ascii=False))
