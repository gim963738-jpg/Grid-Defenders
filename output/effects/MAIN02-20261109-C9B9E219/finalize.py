from pathlib import Path
from PIL import Image,ImageDraw
import json,hashlib,math
P=Path(__file__).resolve().parent
def j(n):return json.loads((P/n).read_text('utf-8-sig'))
def write(n,s):(P/n).write_text(s,'utf-8')
def js(n,d):write(n,json.dumps(d,ensure_ascii=False,indent=2))
def link(n):return f'[{n}]({(P/n).as_posix()})'
for d in j('읽기확인.json')['documents']:assert hashlib.sha256(Path(d['path']).read_bytes()).hexdigest()==d['sha256'],d['path']
preserved=[]
for name in ['MAIN02-20261109-C970BE7A','MAIN02-20261109-C970BE7A-v002','MAIN02-20261109-78E189DC','MAIN02-20261109-78E189DC-v002','MAIN02-20261109-78E189DC-v003']:
 root=P.parent/name;manifest=json.loads((root/'manifest.json').read_text('utf-8'))
 for f in manifest:assert hashlib.sha256((root/f['path']).read_bytes()).hexdigest()==f['sha256'],str(root/f['path'])
 preserved.append(dict(folder=str(root),files=len(manifest),unchanged=True))
js('preservation-audit.json',preserved)
s=j('effect.json');a=j('frame-audit.json')
assert a['debris']['firstVisible']>=s['contactFrameAtStart']and a['ground']['firstVisible']>=s['contactFrameAtStart']
def runs(vals):
 out=[]
 for v in vals:
  if not out or v>out[-1][1]+1:out.append([v,v])
  else:out[-1][1]=v
 return out
slashruns=runs([r['frame']for r in a['slash']['frames']if r['visiblePixels']]);assert len(slashruns)==1
flashruns=runs([r['frame']for r in a['flash']['frames']if r['visiblePixels']]);assert len(flashruns)==1
gravity=s['layers']['debris']['gravity'];vy=300
motion={'slashVisibleRuns':slashruns,'flashVisibleRuns':flashruns,'impactCount':1,'contactTime':s['contactTime'],'reactsBeforeContact':False,'debrisModel':'x=vx*t, y=depth-vy*t+0.5*g*t²; angular spin; opacity ramps in and fades on landing/lifetime','gravity':gravity,'representativeVy':vy,'apexAge':vy/gravity,'yRelativeAtAges':{str(t):-vy*t+.5*gravity*t*t for t in [0,.1,.2,.3,.4]},'dustModel':'outward velocity exponentially decays; particle radius grows; opacity decays quadratically; fixed deterministic seeds','allClearBy':(a['combined']['lastVisible'])/60,'finalFrameBlank':True}
js('motion-audit.json',motion)
# Actual separated layers on a light background, without opaque baked rectangles.
names=['slash','flash','ground','debris','dust'];indices=[18,18,24,30,28]
im=Image.new('RGB',(496*5,310),'#dadfe3');dr=ImageDraw.Draw(im)
for k,(name,idx)in enumerate(zip(names,indices)):
 frame=Image.open(P/f'frames/{name}/frame-{idx:03}.png').convert('RGBA');bg=Image.new('RGBA',frame.size,'#dadfe3');bg.alpha_composite(frame);im.paste(bg.convert('RGB').resize((496,286)),(k*496,0));dr.text((k*496+8,291),f'{name} / frame{idx+1}',fill='black')
im.save(P/'layers-inspection.png')
write('1_대화기록.md','''# MAIN02-20261109-C9B9E219 / 차수1 / effects
사용자는 기존 흰색3타에 “조금 얇은 느낌이긴 한데 잘 뽑긴 했네”라고 평가하고 바닥까지 내려쳐 패이거나 터지는1타를 요청했다. main02 이해문 전체 인용 후 “진행” 확인을 근거로 캐릭터 없는 신규1타만 제작했다. 기존3타/6타/캐릭터 시트는 보존했다.
''')
write('제작프롬프트.md','''# 실제 제작 지시의 구현 의도
기존 v003 Canvas2D 흰색 곡면 검격 메시를 새 output 사본에서 활용한다. 밝은 외측 코어, 안쪽 투명 감쇠, 양끝 테이퍼와 짧은 블룸을 유지하고 폭64→76px를 제안한다. 위에서 아래로 진행하는1회 스윕의 날끝이 지면anchor에 도달한0.30초에만 작은 흰 섬광을 낸다. 그 뒤 가늘고 불규칙한 패임/가지균열, 중력 포물선과 회전을 가진 돌조각, 바닥을 따라 퍼지며 속도와 농도가 줄어드는 분진을 보인다. 전체 흔적은0.92초 이전 정리하고1.2초 클립으로 반복한다. 접촉 전 반응, 캐릭터, 무기본체, 적, 원형 마법 폭발, 전체화면 번쩍임, 청색/분홍 외곽을 넣지 않는다.
이 문장은 모델에 보낸 외주 프롬프트가 아니라 실제 로컬 원본을 만든 제작 의도 기록이다. 사용 도구 Canvas2D/Python/Pillow/FFmpeg/Orca 브라우저, 이미지모델0회/영상AI0회/유료 외주0회/모델전환0회. API 모델·설정·결과·사용량은 호출없음이며 사용량을 추정해 기록하지 않는다.
''')
write('3_작업일지.md','''# 작업일지
2026-11-09 현재 작업15개 필독/직전 결과/공방·재료함 본문 조사→현재 start 통과→사전확인→기존 백색메시 사본으로 신규1타/접점/지면/중력파편/감쇠먼지 제작→통합 및5레이어432RGBA프레임→PNG시트/GIF/MP4 출력.
접촉 순간 중첩 파편이 섬광을 가려 파편 불투명도를25ms 출현으로 수정했다. 초기 절차적 재생의 렌더 부하로 실제 경과시간 검사가 실패해 뷰어를 출력 PNG시트 재생으로 바꾸었다. 변경 후 0.25/0.5/1/2/5배속·정지·재시작·반복과 서버없는 재생 검사가 통과했다. 프레임·영상·모바일·기존원본 해시 검증은 각각 JSON과 결과보고에 기록했다.
''')
write('4_정의문서.md','''# 현재 정의
캐릭터 없는 독립 흰 내려베기1타. 추출원본960×540, 패딩16px, 셀992×572, 공통 지면pivot 콘텐츠(480,425)/셀(496,441). 곡선 회전중심은 날끝이pivot에 도달하도록 별도 계산한다. 표시 크기는 콘텐츠 기준 균일배율이며 피해 범위/게임 사거리와 무관하다.
72프레임60FPS/1.2초 제안, 접촉0.3초=논리18프레임 완료/샘플19. 검격/섬광/패임·균열/돌파편/먼지 각각 투명시트. effect.json과 renderer.js/build.py가 수정 가능한 원본이다. 실제 게임 통합/지형충돌/영구패임/캐릭터연결 없음. 미적 합격과 속도 최종값 미정.
''')
write('5_버전관리.md','''# 버전 관리
이번 신규 output 폴더에만 제작 산출물과 검증 근거를 작성했다. 기존5개 작품 manifest 원본 해시를 모두 대조했다. 게임/src·공방·재료함·규정·타팀 기록 미수정. Git 커밋/푸시/예약백업 미실시: 사용자 저장 요청 없음. manifest.json은 제작 파일 무결성 목록이며 별도 보관/백업을 실행한 것이 아니다.
''')
write('기준보완제안.md','''# 미확정 기준 보완 제안
이번1타에서 접점 섬광과 파편이 같은 프레임에 과밀 중첩하면 접촉을 읽기 어렵다. 접촉 샘플을 흰 섬광 중심으로 두고 파편은 짧게 출현시켜 다음 프레임부터 분출이 읽히도록 하는 검사를 제안한다. 뷰어는 실제 완성 시트를 읽어 재생하고 절차적 렌더는 출력/편집용으로 유지하는 방식을 제안한다. 현재 작품에 적용했으며 다른 작품·활성 공통규정의 확정 변경은 아니다.
''')
rows='\n'.join(f"|{name}|{s['layers'][name]['start']:.3f}|{s['layers'][name]['end']:.3f}|{a[name]['firstVisible']}~{a[name]['lastVisible']}|"for name in names)
write('결과보고.md',f'''{link('combined-sheet.png')} · {link('impact-dark.gif')} · {link('impact-battle.mp4')} · {link('preview.html')}

# MAIN02-20261109-C9B9E219 / 차수1 / effects / main02

**캐릭터 없이, 조금 더 두꺼운 흰 내려베기→접점 섬광→바닥 패임·균열/돌조각·먼지→빠른 소멸의 정확1타**를 실제 제작했다. 기존 v003 백색 곡면/안쪽 투명 감쇠/양끝 테이퍼/짧은 블룸을 유지한 새 작품이다. 폭64→76px(+18.75%)와1×1.2초는 제안 초기값이며 최종 두께·속도·파괴 규모/시각 합격은 사용자 미정이다.

## 파일

- 통합 알파 {link('combined-sheet.png')}:8열9행·72프레임·셀992×572. 원본 {link('frames/combined/frame-018.png')} 등을 포함한 frames/combined/frame-000.png~071.png. 실제RGBA 투명이며 검은배경을 투명이라고 부르지 않는다.
- 분리 알파 {link('slash-sheet.png')} / {link('flash-sheet.png')} / {link('ground-sheet.png')} / {link('debris-sheet.png')} / {link('dust-sheet.png')}. 각72프레임, 동일셀/동일pivot. frames/slash·flash·ground·debris·dust에 각 원본PNG72개. 검격/섬광은 흰색이며 지면과 파편 암부는 의도된 그림으로 보존했다.
- 밝은회색 {link('impact-grey.gif')} / {link('impact-grey.mp4')}; 초록 {link('impact-green.gif')} / {link('impact-green.mp4')}; 어두운 {link('impact-dark.gif')} / {link('impact-dark.mp4')}; 기존전장 {link('impact-battle.gif')} / {link('impact-battle.mp4')}. MP4/GIF는 배경합성으로 알파없음. 영상은 로컬 렌더 출력이며 AI영상 호출이 아니다.
- {link('preview.html')}: 서버 없이 열어 실제 PNG시트를 재생한다. 재생/정지·반복·재시작·이전다음·프레임스크럽·0.25/0.5/1/2/5×·배경4종·전체/5레이어 선택. HTTP 확인 주소 http://127.0.0.1:5201/preview.html. UI는 캔버스 아래 배치했다.
- 수정가능 원본 {link('effect.json')} / {link('renderer.js')} / {link('build.py')}. 기존메시 참조 사본 reference-v003-renderer.js는 출처보존용이다. 전체밝은프레임 {link('contact-grey.jpg')} / {link('contact-green.jpg')}, 추가 contact-dark.jpg/contact-battle.jpg. 대표단계 {link('stages-grey.png')} / {link('stages-green.png')} / {link('stages-dark.png')} / {link('stages-battle.png')}. 분리 확인 {link('layers-inspection.png')}, 기존폭 비교 {link('width-comparison.png')}.

## 시간·접점·조정

|레이어|설정 시작s|설정 종료s|실제 가시 프레임(1부터)|
|---|---|---|---|
{rows}

검격0.12초 출현→0.30초 날끝 지면 도달→0.43초까지 빠르게 꼬리 소멸. 접촉은 **논리18프레임 완료 시각0.30초/샘플19번**이고 실제 피해 이벤트가 아니다. 섬광은 이 순간에만1회, 지면/파편은20번부터, 먼지는21번부터 읽힌다. 접촉 전 지면 반응0. 전체 가시성은9~55번 한 구간이며0.917초부터 완전히 투명하다. 이후1.2초까지 쉬고 반복한다.

ground 공통anchor는 콘텐츠(480,425), 셀(496,441)이고 모든 레이어의 모든 프레임에 동일하다. 검격 타원의 회전중심은 끝점으로부터 별도 역산하며 그림중심을 ground anchor로 사용하지 않는다. 기본 끝점은 실제로(496,441)에 일치한다. 원본 추출영역(16,16,960,540), 패딩16px, 전체셀992×572와 표시범위를 분리했다. 게임 피해/사거리/쿨타임/지형충돌·영웅배정은 전부미정이며 도형으로 판정을 추정하지 않았다.

JSON의 slash에서 폭/타원반경/각도/시작/스윕/수명, pivotSource에서 공통위치, layers에서 독립 offset/angle/scale/opacity를 조절한다. flash.size/duration, ground.width/duration, debris.count/seed/gravity/speed/duration, dust.count/seed/spread/duration을 별도로 제공한다. 지면반응start는 contactTime+delay, contactTime은 slash.start+sweep에서 계산한다. 접촉을 맞출 때 offset을 일관되게 사용하고 파편선행/안전여백을 다시 검사해야 한다. 영구패임은 false 제안이며 잔흔은 항상 사라진다.

수정은 별도JSON 사본→`python build.py --spec <사본.json>`→serve.py로 연 뷰어에서 `demo.exportFrames()`→`python export.py`→`python qa.py` 순서다. build.py를 옵션없이 호출하면 기본제안으로 돌아간다. 현재72프레임/60FPS/1.2초 출력이므로 수명은 이 클립 안으로 맞춘다. 전체클립길이/프레임수까지 변경하려면 출력기와뷰어의72프레임설정도 함께 갱신해야 한다. 출력이 달라지면 기존검증을 합격으로 재사용하지 않는다.

## 도구·적용 기준

현재15개 read-pack 본문과 직전결과/공방·재료함/스킬규약을 읽고 새작업start 통과했다. 저장운영규정에 따라 commit/push/예약백업없음. 작업방법·규정A·메인/팀장운영·파일담당표에 따라 신규output만 작성했다. 기존공방은 읽기참조하고 기존 v003 Canvas2D 곡면메시의 별도사본을 사용했다. 공방 라이브러리 등록/실게임 적용을 했다고 보고하지 않는다.

실제도구 Canvas2D/Python/Pillow/FFmpeg/Orca 내장브라우저. 이미지모델0회/영상AI·Grok0회/유료외주0회/모델전환0회. 상세 {link('제작프롬프트.md')}. 외주 완성시트를 분해/재조립한 공정이 아니다. 원본/분리레이어/파편시드·운동식을 보존해 재현가능하다.

## 검증·한계

- {link('frame-audit.json')}:통합+5레이어432프레임 모두 가장자리alpha0, 최소실측여백41px(필요16px 이상), 처음/마지막투명, 모든시트셀과 원본PNG 픽셀일치. 흰검격/섬광 alpha>16 RGB는순백이고 검은매트없음. 지면 암부는 의도된 균열이며 화면전체 불투명바닥판을 굽지 않았다.
- {link('motion-audit.json')}:검격가시구간/섬광가시구간 각각1개, 접촉전 반응없음. 파편 x=vx·t/y=depth−vy·t+½gt²·회전/착지·수명감쇠; 먼지는 수평속도 지수감쇠/크기증가/농도감쇠. 전체프레임/대표단계를 직접 열어 파편상승·하강/짧은소멸을 검토했다. 숫자가 미적합격을 대신하지 않는다.
- {link('selection-contact-audit.json')} / {link('playback-audit.json')}:날끝좌표와 공통anchor 일치, 배경4/레이어6선택, 프레임이동,0.25/0.5/1/2/5배속/정지/재시작/반복·비반복종료 통과. {link('parameter-audit.json')}:실제렌더에서 두께/섬광크기 증가에 따른 면적변화와원값복원 확인.
- {link('standalone-audit.json')}:file프로토콜 재생/전장배경 로딩 통과. {link('mobile-320.json')} / {link('mobile-390.json')}:가로넘침0·조작48px이상. 큰창 실측은 mobile-1100.json에 기록. 실기기/APK 검사는 아니다. 브라우저 최종콘솔오류0. 초기 절차적 재생부하는 실제시트 재생으로 수정했고 변경후 배속실측이 정상이다.
- {link('media-audit.json')}:MP4네종992×572/72프레임60FPS/1.2초 전체디코드오류0, GIF네종1.2초/무한반복 확인. GIF는50FPS 시간표본이며 원본PNG/MP4는60FPS다.
- {link('preservation-audit.json')}:이전5개작품 모든manifest 파일해시불변. 신규폴더 이외 게임/src·공방·재료함·규정·타팀미수정. 현재필독해시도 제출직전재대조했다.

**남은 판단/한계:** 매우밝은회색에서는 흰검격 대비가낮고, 먼지는 절제된반투명톤이라 작은화면에서 옅게읽힌다. 균열은 스타일화된2D오버레이이며 실제재질/3D지형물리시뮬레이션이 아니다. 전장판은 기존게임 forest-clearing 배경을 복사한 비파괴합성이고 실전캐릭터/유닛겹침·상단길/중앙 게임통합 검사는 하지 않았다. 캐릭터·검본체·적없음. 사용자최종속도/두께/파괴규모/시각합격과 독립테스터 검수는 미실시/미정이다. 기준보완제안.md는 제안이며 활성규정은변경하지 않았다.
''')
files=[]
for f in sorted(P.rglob('*')):
 if f.is_file()and f.name!='manifest.json'and '__pycache__'not in f.parts:files.append(dict(path=f.relative_to(P).as_posix(),bytes=f.stat().st_size,sha256=hashlib.sha256(f.read_bytes()).hexdigest()))
js('manifest.json',files)
print(f'{len(files)} files manifested; previous {sum(x["files"]for x in preserved)} files unchanged; report complete')
