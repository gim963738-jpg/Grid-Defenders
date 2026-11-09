from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageStat
import json,hashlib

root=Path(__file__).resolve().parent
workspace=root.parents[2]
files=['01-war-gate','02-war-trench','03-war-citadel','04-forest-golden','05-forest-creek','06-forest-oak','07-demon-fissure','08-demon-grove','09-demon-fortress']
themes=['전쟁터']*3+['햇빛 드는 모험 숲']*3+['마계']*3
titles=['무너진 성문의 방어선','참호 너머의 공성전','잿빛 요새의 잔광','황금 잎새의 원정길','수정 개울의 쉼터','고목 아래 잠든 유적','흑요 균열의 경계','기형 숲의 보랏빛 숨결','망각의 성채 진입로']
descriptions=[
'무너진 석회암 성문과 붉은 군기, 부서진 문짝·화살을 외곽에 배치했다. 노란 사광과 흙/포석 경계가 참조의 회화적인 재질을 잇는다.',
'목책과 모래주머니, 하단 목재 참호, 부서진 투석기를 서로 다른 실루엣으로 구성했다. 중앙에는 넓은 건조 흙바닥이 이어진다.',
'조각난 회청색 포석, 직선 성벽·부서진 망루, 사자상과 화로가 특징이다. 오른쪽 잔광과 차가운 돌그늘의 대비로 방어선 분위기를 구분했다.',
'황금빛 활엽수와 하얀 들꽃, 부드러운 잎그늘로 맑은 원정길을 표현했다. 숲 중앙을 가로로 비워 출발과 탐험의 밝은 인상을 유지했다.',
'흰 나무줄기와 둥근 바위, 화면 하단을 따라 흐르는 맑은 청록 개울로 구성했다. 물은 교전 공간을 가로막지 않으며 오른쪽 숲길이 열린다.',
'커다란 고목 뿌리와 태양 문양 유적, 이끼 낀 낮은 석조 단을 배치했다. 오른쪽 위 햇살과 주황 들꽃으로 유적 탐험의 분위기를 더했다.',
'흑요석 가시 능선과 용암 균열을 가장자리로 모았다. 중앙은 중간 밝기의 청회색 돌바닥으로 비워 마계의 어둠 속에서도 유닛을 구분한다.',
'기이한 잎·꼬인 뿌리·보라색 씨앗과 청록 발광 버섯을 외곽에 배치했다. 중앙 회보라 흙바닥과 다른 식생 실루엣으로 균열/성채 안과 구분한다.',
'각진 검은 성채 부벽과 부서진 철문, 녹색 불빛·자홍 반사광이 특징이다. 평탄한 현무암 진입로를 남겨 마계 성채의 전장을 제안한다.'
]
font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',26)
small=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',20)
groups=[('비교판-전체9.png',list(range(9)),'3테마 × 3안 · 전투 UI 비교'),('비교판-전쟁터.png',[0,1,2],'전쟁터 · 3안 비교'),('비교판-햇빛숲.png',[3,4,5],'햇빛 드는 모험 숲 · 3안 비교'),('비교판-마계.png',[6,7,8],'마계 · 3안 비교')]
for filename,ids,label in groups:
    columns=3;rows=(len(ids)+2)//3;tw,th=800,360
    sheet=Image.new('RGB',(3*(tw+16)+16,rows*(th+68)+76),'#12292b')
    d=ImageDraw.Draw(sheet);d.text((16,14),'GRID DEFENDERS · '+label,font=font,fill='#e6d09c')
    for k,i in enumerate(ids):
        x=16+(k%3)*(tw+16);y=64+(k//3)*(th+68)
        im=Image.open(root/(files[i]+'.png')).convert('RGB').resize((tw,th),Image.Resampling.LANCZOS)
        sheet.paste(im,(x,y));d.text((x,y+th+6),f'{i+1:02} · {themes[i]} · {i%3+1}안',font=small,fill='#c6bf9c');d.text((x,y+th+32),titles[i],font=small,fill='#f1e8d2')
    sheet.save(root/filename)

raw=json.loads((root/'layout-receipt.json').read_text(encoding='utf-8-sig'))
layout=json.loads(raw['result']['result'])
(root/'버튼위치.json').write_text(json.dumps(layout,ensure_ascii=False,indent=2),encoding='utf-8')
before=json.loads((root/'preservation-before.json').read_text(encoding='utf-8'))
changed=[p for p,h in before.items() if hashlib.sha256((workspace/p).read_bytes()).hexdigest()!=h]
readings=json.loads((root/'읽기확인.json').read_text(encoding='utf-8'))
versions=all(hashlib.sha256(Path(d['path']).read_bytes()).hexdigest()==d['sha256'] for d in readings['documents'])
records=[]
for i,name in enumerate(files):
    p=root/(name+'.png');bg=root/'backgrounds'/(name+'.png');im=Image.open(p);back=Image.open(bg).convert('RGB')
    assert im.size==(2400,1080)
    sample=back.crop((int(back.width*.42),int(back.height*.25),int(back.width*.76),int(back.height*.76))).convert('L')
    records.append(dict(number=i+1,theme=themes[i],title=titles[i],path=str(p),sha256=hashlib.sha256(p.read_bytes()).hexdigest(),size=list(im.size),background=str(bg),backgroundSha256=hashlib.sha256(bg.read_bytes()).hexdigest(),backgroundSize=list(back.size),centralMeanLuma=round(ImageStat.Stat(sample).mean[0],1)))
assert len(set(r['backgroundSha256'] for r in records))==9
assert not changed,changed
assert versions
assert all(not r['small'] and not r['outside'] and not r['overlaps'] for r in layout)
assert all(r['slots']==20 and r['allies']==8 and r['enemies']==7 and len(r['buttons'])==9 for r in layout)
validation=dict(task='MAIN02-20261109-9009B97A',iteration=1,role='ui',pngs=records,independentBackgrounds=9,layoutStates=9,buttons=81,smallButtons=0,outsideButtons=0,buttonOverlaps=0,preservedFiles=len(before),changedFiles=changed,readingVersionsCurrent=versions,scope='정적 UI 비교 시안 자체 검증; 실기기/전투런타임/사용자최종합격 아님')
(root/'검증결과.json').write_text(json.dumps(validation,ensure_ascii=False,indent=2),encoding='utf-8')

def link(filename,label):return f'[{label}](<{(root/filename).as_posix()}>)'
report=['# 3테마 × 3안 전투 UI 제작 결과','',
'MAIN02-20261109-9009B97A / 차수1 / main02 → ui / 2026-11-09. **전쟁터3·햇빛 숲3·마계3, 독립 배경9개와 전투 UI PNG9장 제작 및 자체검증 완료.** 사용자 최종 시각 합격과 게임 반영 전이다.','',
'## 열람','',
'- '+link('gallery.html','개별 확대·테마 필터 갤러리'),
'- '+link('비교판-전체9.png','3×3 전체 비교판'),
'- '+link('비교판-전쟁터.png','전쟁터3안 비교판')+' / '+link('비교판-햇빛숲.png','햇빛 숲3안 비교판')+' / '+link('비교판-마계.png','마계3안 비교판'),
'- '+link('concepts.html','독립 시안 소스')+' — ?n=1~9로 표시 상태 선택. 사진의 게임 버튼은 런타임 연결이 없는 정적 표현이다.','',
'갤러리는 각 PNG·배경 원본을 새 창으로 열 수 있고 큰보기·이전/다음·닫기·키보드 좌우 이동을 제공한다. 원본9장은 모두 **2400×1080 / 20:9**다. 3×3 연락판이 개별 이미지를 대신하지 않는다.','',
'|번호|테마·안|제목|개별 PNG 절대경로|','|---|---|---|---|']
for i,name in enumerate(files):report.append(f'|{i+1:02}|{themes[i]} {i%3+1}안|{titles[i]}|{link(name+".png",name+".png")}|')
report += ['', '## 사용자 선호와 조합 근거','',
'최신 원문은 공유 메인작업/main02/three-themes-nine-20261109/사용자요청.md의 “전장디자인,필드표현느낌은 6번,9번,5번 그림체 느낌이 좋고 / 버튼은 개인적으로 9번,5번 느낌이 마음에든”과 이해문 확인 “바로 진행”이다. 이 선호는 부분 승계이며 이전16장 전체나 A 전체의 합격을 뜻하지 않는다.','',
'05-C-wave.png, 06-C-boss.png, 09-shop.png를 모두 직접 열고 비교했다. 공통 배경 terrain.png도 직접 열어 style-only 참조로 내장 생성 도구에 제공했다. 06의 보스 HP·이동전투 HUD는 이번 웨이브 시안으로 복사하지 않았다.','',
'|참조|관찰한 시각 특징|이번 반영|','|---|---|---|',
'|05·06·09 필드|그림으로 그린 돌/흙 재질, 지형과 자연스럽게 이어지는 가장자리, 외곽 수목·유적, 낮은 탑다운/쿼터뷰와 빛의 깊이|고유9배경을 같은 회화적 마감으로 새로 생성. 중앙은 비우고 외곽 랜드마크와 빛·재질·지형 실루엣으로 변형.|',
'|05 버튼|깊은 녹색, 둥근 모서리, 오른쪽 세로 접근, 밝은 글자|오른쪽84×48 버튼5개, 곡률12px, 어두운 녹색 층과 상단 현황 캡슐.|',
'|09 버튼·패널|얇은 금색 외곽, 눌러야 할 행동의 따뜻한 금색, 절제된 프레임|동일한 금색 테두리와 선화 아이콘·재화 강조를 기본전투에 결합. 이번에는 큰 상점 창을 펼치지 않아 교전면을 확보.|','',
'9안은 같은 원본 배경의 색보정·크롭 변형이 아니다. 도구에 독립9개 프롬프트를 한 번씩 전달했고 결과9개를 원본 그대로 backgrounds에 보존했다. 단일배경의 회화 마감을 참고했지만 성문/목책/요새, 황금잎/개울/고목유적, 균열/기이한식생/마계성채의 지형과 외곽 구조는 별도로 생성했다.','',
'## 테마별 차이','']
for i in range(9):report += [f'### {i+1:02} {titles[i]}','',descriptions[i],'']
report += ['## 공통 UI·버튼 매핑','',
'비교 공정성을 위해9장 모두 같은 좌표·유닛/적 크기·기능·시간/재화 상태를 사용했다. 기본 논리800×360, PNG는3배. 여백12px·간격8px·본문14px·보조12px·제목20px, 버튼 최소48px를 유지했다. 공통 mobile-ui.css를 읽기 전용 연결하고 독립 시안 CSS로 배치했다.','',
'왼쪽5×4 방어판은 x104/y92/240×192,48px 칸20개. 기존 보병/궁병/마법병/영웅의 정지 원본과 받침으로 고정 방어를 나타낸다. 중앙 교전과 오른쪽 슬라임7개, 왼쪽을 가리키는 적 진입 표식을 함께 둔다. 루프 길목이나 보스 받침 없는 이동전투로 바꾸지 않았다.','',
'|요소|800×360 좌표·크기|설명|','|---|---|---|',
'|웨이브|(12,8,104,48)|WAVE09|','|시간|(124,8,88,48)|00:18|','|재화|(220,8,112,48)|골드480G / 모루2|','|누적 몬스터|(420,8,128,48)|7/20|',
'|정지|(572,8,48,48)|일시정지 접근|','|배속|(628,8,48,48)|1×|','|설정|(684,8,48,48)|현행 미구현에 맞춰 disabled, 접근성 이름 준비중|','|복귀|(740,8,48,48)|로비 접근|',
'|병사|(704,76,84,48)|고정 방어 배치|','|영웅|(704,132,84,48)|영웅 정보/선택 접근|','|상점|(704,188,84,48)|기존 상점 접근|','|진형|(704,244,84,48)|기존 보스 진형 접근|','|가방|(704,300,84,48)|기존 공용 가방 접근 제안|','',
'숫자·배치는 합성 예시이며 새로운 밸런스를 확정하지 않는다. 기존 영웅3명 제한/가방21칸/상점상품5개/보스42칸 진형 등의 기능을 변경하지 않았다. 가방 단독 접근 등은 시안의 UI 경로 제안이다. 이번 기본 전투9장에는 관리창을 펼친 상태를 추가하지 않았다.','',
'## 생성 원본·프롬프트·도구','',
'내장 image_gen.imagegen 기본 모드9회/성공9회, 투명배경 false, style-only 참조 ../MAIN02-20261109-063FC22B/terrain.png. 원본은 Codex generated_images에 두고 새 output/backgrounds로 복사했다. 정확한 각 프롬프트, 도구·참조, 원본저장 경로 영수증은 '+link('prompts-and-generation.json','생성기록 JSON')+'에 있다. 임의 유료API/다른 모델/CLI 이미지 생성 전환 없음.','',
'배경은 도구가 반환한1870×841 원본을 보존했으며 최종2400×1080 HTML 캔버스 영역에 표시한다. 숫자/한글/버튼/유닛은 코드 렌더링하여 텍스트 오생성을 피했다. 최종 PNG 전체를 AI로 재생성하거나 스프라이트 원본을 분해·재조립하지 않았다.','',
'PNG 저장은 설치된 Edge의 헤드리스 렌더러와 본 output 내부의 별도 프로필을 사용했다. 이전 작업에서 Orca 내장 screenshot이 반복 타일 캡처를 만든 실제 한계를 확인했기 때문에 최종 이미지 저장에 Edge를 계속 사용했다. Orca 브라우저는 독립소스/갤러리 열람·DOM 좌표 검사에 사용했다. Pillow는 크기·해시·명도 검사와 비교판 조립에만 사용했다. '+link('render.ps1','재현 렌더 스크립트')+' / '+link('버튼위치.json','실제 DOM 좌표')+' / '+link('검증결과.json','검증결과')+'를 함께 보존했다.','',
'## 필독 및 start','',
'자동 필독14문서를 이번 작업에서 본문으로 다시 읽었다. AGENTS, UI작업진행방법, 규정A, 메인/팀장규정, 파일담당표, UI규정, 도구사용법, 조직, 도메인README/트리, 이번사용자요청, 모바일UI규격, 원작업결과보고다. 읽기확인.json에는14개 path/sha256/applies와 원본보존·구조·검증 요약을 작성했다. 새 작업 start는2026-11-09 18:26:20 KST 통과했으며 이전 작업 start를 재사용하지 않았다. 제출 시 필독14문서의 현재 해시도 일치한다.','',
'## 자체 검증','',
f'- 원본 배경9개의 SHA256 모두 고유. 최종 PNG9장2400×1080과 네 비교판·갤러리 경로 존재 확인.',
'- 9장에 각각9개 버튼, 총81개에서48px 미만0·화면밖0·버튼끼리겹침0. 병사/영웅/상점/진형/가방과 정지/배속/설정/복귀 누락0.',
'- 방어칸20·아군8·적7은9안 동일. 중앙 교전 영역을 외곽 랜드마크가 가로막지 않는지 원본과 최종PNG를 직접 열어 확인했다.',
'- 모든 최종 PNG를 직접 열어 한글/숫자/우측버튼/그림체/외곽실루엣을 확인했다. 햇빛 숲은 밝은 탐험 분위기, 마계는 중간 밝기 바닥·아군체력색·적체력색·글자배경 분리를 확인했다.',
f'- 보존검사 대상 {len(before)}개 파일의 전후SHA256 동일. 게임/src와 이전 산출폴더 최상위 파일을 포함하며 기존 게임/이전16장 변경 없음.',
'- 검증은 독립정적시안과 갤러리 범위다. 실제 전투/저장/성능/모바일실기기/APK/전체게임 기능 검증과 사용자 미적 합격을 뜻하지 않는다.',
'- 마계 중앙 명도 평균(0~255,배경 중앙42~76%×25~76% 샘플): '+', '.join(f'{r["number"]:02}={r["centralMeanLuma"]}' for r in records[6:])+'. 이는 검은바닥 과다 여부를 보는 보조값이며 유닛 전체 대비 인증 수치가 아니다.','',
'## 남은 항목과 보완 제안','',
'요청한9장/원본9개/전체3×3/테마별3종/갤러리/보고를 제출한다. 남은 것은 메인 검수와 사용자 최종 시각 선택이며 실제 게임 적용은 별도 범위다. 색만 달리한 배경을 독립안으로 세지 않고 지형실루엣과 외곽 랜드마크를 비교표에 남기는 기준을 제안하며 활성 규정 파일은 수정하지 않았다. Git commit/push·통합 없음.','']
(root/'결과보고.md').write_text('\n'.join(report),encoding='utf-8')
(root/'1_대화기록.md').write_text('원작업05/06/09 필드와05/09버튼 선호. 새3테마×3안9장 요청, 사용자 바로 진행 확인. 특정최종안선택/게임통합 아님. read-pack 사용자요청 원문과 연결.\n',encoding='utf-8')
(root/'3_작업일지.md').write_text('2026-11-09 필독14개 재독/start → 참조3장/원본 직접열람 → 내장imagegen9회 → 독립UI·갤러리 → Edge PNG9 → 전체원본/최종 직접검수 → 좌표/고유해시/원본보존 → 비교판·결과보고.\n',encoding='utf-8')
(root/'4_정의문서.md').write_text('논리800×360/최종2400×1080.9개독립배경,UI기능9개동일,슬롯20·아군8·적7 동일. 테마및좌표는결과보고/버튼위치.json. 게임과연결없는정적제안.\n',encoding='utf-8')
(root/'5_버전관리.md').write_text('본 신규output만 저장. 이전16장/게임코드 보존해시일치. commit/push·통합·사용자최종합격 없음.\n',encoding='utf-8')
print(json.dumps({'pngs':9,'backgrounds':9,'buttons':81,'preservedFiles':len(before),'report':str(root/'결과보고.md')},ensure_ascii=False))
