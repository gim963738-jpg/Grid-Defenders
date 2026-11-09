from pathlib import Path
from PIL import Image,ImageDraw,ImageChops
import json,subprocess,hashlib,math,re,zipfile
P=Path(__file__).resolve().parent;OLD=P.parent/'MAIN02-20261109-C970BE7A'
def write(n,s):(P/n).write_text(s,encoding='utf-8')
def j(n):return json.loads((P/n).read_text(encoding='utf-8-sig'))
for d in j('읽기확인.json')['documents']:assert hashlib.sha256(Path(d['path']).read_bytes()).hexdigest()==d['sha256'],d['path']
oldfiles=j('v001-preservation.json')
for d in oldfiles:assert hashlib.sha256(Path(d['path']).read_bytes()).hexdigest()==d['sha256'],d['path']
write('preservation-audit.json',json.dumps(dict(iteration1Files=len(oldfiles),allUnchanged=True),indent=2))
spec=j('timeline.json');audit=j('frame-audit.json')
assert spec['iteration']==2 and len(spec['hits'])==6 and len(audit['visibleSegments'])==6
neutral=0
for f in sorted((P/'frames').glob('*.png')):
 im=Image.open(f).convert('RGBA');r,g,b,a=im.split()
 assert ImageChops.difference(r,g).getbbox() is None and ImageChops.difference(g,b).getbbox() is None,f
 neutral+=1
directions=[h['angle'] for h in spec['hits']]
write('style-technical-audit.json',json.dumps(dict(neutralFrames=neutral,channelDifference=0,directions= directions,quadrants=4,differentLengths=len(set(h['length'] for h in spec['hits'])),differentCurvatures=len(set(h['curvature'] for h in spec['hits'])),userStyleAccepted=False),indent=2))
checks=[]
for name in ['battle','grey','green','dark']:
 f=P/f'six-slash-{name}.mp4'
 r=subprocess.run(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=codec_name,width,height,nb_frames,r_frame_rate,duration','-of','json',str(f)],capture_output=True,text=True,check=True)
 s=json.loads(r.stdout)['streams'][0];assert s['nb_frames']=='120' and float(s['duration'])==2 and s['width']==992 and s['height']==572,s
 subprocess.run(['ffmpeg','-v','error','-i',str(f),'-f','null','-'],check=True,capture_output=True)
 checks.append(dict(file=f.name,decode='pass',**s))
for name in ['battle','grey']:
 im=Image.open(P/f'six-slash-{name}.gif');duration=0
 for i in range(im.n_frames):im.seek(i);duration+=im.info.get('duration',0)
 assert duration==2000 and im.info.get('loop')==0
 checks.append(dict(file=f'six-slash-{name}.gif',frames=im.n_frames,durationMs=duration,loop=0,alpha=False))
write('media-audit.json',json.dumps(checks,indent=2))
for h in spec['hits']:
 seg=next(seg for seg in audit['visibleSegments'] if h['start']<audit['metrics'][seg[0]-1]['time']<h['end'])
 h['firstVisibleFrame'],h['lastVisibleFrame']=seg;h['emphasisSampleFrame']=math.ceil(h['emphasis']*60-1e-8)+1
spec['extraction']='No extraction: authored960x540 effect content on992x572 padded canvas; original frames unmodified.'
spec['backgroundProvenance']='Existing game forest-clearing-v1.png retained unchanged; display background uses uniform cover crop.'
write('timeline.json',json.dumps(spec,ensure_ascii=False,indent=2))
oldspec=json.loads((OLD/'timeline.json').read_text(encoding='utf-8'))
compare=Image.new('RGB',(1488,1256),'#152332');d=ImageDraw.Draw(compare)
for row,(root,timeline,iteration) in enumerate([(OLD,oldspec,1),(P,spec,2)]):
 for i,h in enumerate(timeline['hits']):
  frame=min(timeline['frames']-1,math.ceil(h['emphasis']*60-1e-8));im=Image.open(root/'composite-dark'/f'frame-{frame:03d}.png').convert('RGB')
  x=i%3*496;y=(row*2+i//3)*314
  compare.paste(im.resize((496,286),Image.Resampling.LANCZOS),(x,y));d.text((x+12,y+291),f'v00{iteration}  HIT {i+1}  {h["angle"]} deg  {h["emphasis"]:.3f}s',fill='white')
  if iteration==2:im.save(P/f'hit-{i+1}-dark.png')
compare.save(P/'comparison-v001-v002.jpg',quality=94)
write('comparison-timeline.json',json.dumps(dict(iteration1=dict(status='user requested revision; not approved style',duration=2.5,hits=oldspec['hits']),iteration2=dict(status='submitted; user style decision pending',duration=2,hits=spec['hits'])),ensure_ascii=False,indent=2))
write('viewer-template.html',re.sub(r'<script>[\s\S]*?</script>','<script></script>',(P/'preview.html').read_text(encoding='utf-8')))
link=lambda n:f'[{n}]({(P/n).as_posix()})'
table='\n'.join(f"|{h['number']}|{h['angle']}°|{h['start']:.3f}|{h['emphasis']:.3f}|{h['fadeStart']:.3f}|{h['end']:.3f}|{h['firstVisibleFrame']}–{h['lastVisibleFrame']}|" for h in spec['hits'])
margins=[min(x['margins']) for x in audit['metrics'] if x['margins']]
write('결과보고.md',f'''{link('preview.html')} · {link('six-slash-battle.mp4')} · {link('six-slash-battle.gif')}

# MAIN02-20261109-C970BE7A / 차수2 / effects / main02

흰색 중심의 다각도6연격으로 실제 수정했다. 기존 청백색·거의 같은 사선·평평한 리본을 중성흰색의 끝이 가는 곡선 칼날·다중 블룸·짧은 잔광으로 교체했다. 각 타격은 서로 다른 방향/길이/곡률/두께/진행 속도를 사용한다. 마지막은 같은 언어에서 길이·코어 두께·잔광 지속만 절제해 강조한다. 전체2초·120프레임·60FPS는 **제안 초기값**, 사용자 확정속도가 아니다.

## 산출물

- 전장합성 {link('six-slash-battle.mp4')} / {link('six-slash-battle.gif')}; 밝은 회색 {link('six-slash-grey.mp4')} / {link('six-slash-grey.gif')}; 밝은 초록 {link('six-slash-green.mp4')}; 어두운 배경 {link('six-slash-dark.mp4')}.
- 서버 없이 열리는 {link('preview.html')}:재생/정지·재시작·반복·0.25/0.5/1/2배속·배경4종·프레임 이동/스크럽·타격번호. UI는 시야 밖에 배치, 모바일48px 조작 기준 유지. HTTP 확인 주소 http://127.0.0.1:5198/preview.html.
- 투명 원본 {link('six-slash-alpha-source.zip')} / {link('six-slash.rgba-atlas.png')}:frames/frame-000.png~119.png,10열12행992×572 RGBA셀. MP4/GIF는 배경합성이므로 **알파 없음**, 원본PNG에는 **실제 알파 있음**.
- 편집/명세 {link('timeline.json')} / {link('editable-plans.json')} / {link('vfx-renderer.js')} / {link('전문제작프롬프트.md')}.
- 전체120프레임 {link('contact-grey.jpg')} / {link('contact-green.jpg')} / {link('contact-dark.jpg')} / {link('contact-battle.jpg')}.
- 대표 {link('representative-grey.png')} / {link('representative-dark.png')} / {link('representative-battle.png')}, 타격별 hit-1-dark.png~hit-6-dark.png.

## 차수1 대비

{link('comparison-v001-v002.jpg')}는 위6개가 차수1·아래6개가 차수2이며 타격별 강조 시점을 같은 배경에서 비교한다. {link('comparison-timeline.json')}에 두 차수의 실제 타임라인을 함께 보존했다. 차수1은 사용자 미달/수정 요청 상태이며 승인 참조가 아니다.

|항목|차수1|차수2|
|---|---|---|
|색|청백색 날/푸른 리본|중성흰색 날/무채색 블룸|
|방향|23~28도 유사사선|27/-34/151/218/68/-16도, 네 진행 사분면|
|형태|직선+평평한반투명면|휘어짐/원근두께/끝테이퍼가 다른 칼날+부드러운광량|
|시간|2.5초,출현0.16~잔광1.85초|2초,출현0.12~잔광1.47초|
|교차|요구하지 않음|시간차교차, 오래남는X자 누적 없음|

## 타임라인/좌표 계약

|타|진행각|시작s|강조/가르기완료s|소멸시작s|끝s|표시프레임|
|---|---|---|---|---|---|---|
{table}

원본 콘텐츠960×540, 사방16px 패딩 후992×572. 대상 중심 pivot은 원본(480,270), 패딩후(496,286)으로 고정하며 모든 칼날 곡선이 이 중심을 지나간다. 전체 표시 셀을 균일 축척하고 발광부와 피해범위를 혼동하지 않는다. 추출영역은 자동 시트 추출이 아닌 새 절차적 출력 전체 콘텐츠이며, 원본 시트를 분해/재조립하지 않았다. 모든 표시프레임 외곽 최소여백{min(margins)}px, 규약960px대응 최소15px보다 넓은16px 안전여백을 확보했다. 피해·사거리·영웅·실제6회피해·쿨타임·대상·캔슬은 미정, 게임통합 없음.

## 작업 기준·도구·보존

차수2 발송지시·사용자피드백·차수1 결과보고 및15개 자동 필독 본문을 새로 읽고, path/sha256/applies를 읽기확인.json에 작성해 차수2 start를 통과했다. 제출 전 필독 해시와 차수1의{len(oldfiles)}개 파일 해시를 다시 대조해 변경없음을 확인했다. 게임/src·공방·재료함·규정·타팀 기록은 수정하지 않았다. 최신 사용자 확인 “맞아 그느낌이야 진행”에 따라 이전의 청백색/같은방향/X자금지 조건을 흰색/다방향 시간차교차로 대체했다. 공통 규정 자체는 바꾸지 않았다.

기존 공방·재료함 WEB-155/169 본문과 기존출력도구를 읽고 차수1의 독립뷰어/출력·검증 도구를 신규폴더 사본으로 사용했다. 평평한 field 도형은 쓰지 않고 이 사본의 Canvas2D 출력기에 tapered curved mesh와 백색 다중blur 합성을 작성했다. **공방원본 기능추가나 gd.effect@1 직접가져오기 자산이라고 주장하지 않는다**; 재사용 입력은 editable-plans.json/타임라인/알파프레임이다. 스킬구현규약의 원본/패딩/pivot/표시/피해 분리 계약을 명세에 유지했으며 실제 SkillFrameArt 게임 연결 검사는 후속이다.

도구:Canvas2D·Python/Pillow·FFmpeg/libx264·Orca 내장브라우저. 외부이미지/영상생성호출0, 유료API비용0, 외부모델전환0. 전문제작프롬프트는 별도 보존했다. 원본파일/설정/사용량 기록은 timeline·vfx-renderer·전문프롬프트와 manifest로 연결한다.

## 검증

- frame-audit.json:120프레임의 알파 출현구간 정확히6개 {audit['visibleSegments']}, 가장자리접촉0,16px여백 통과, 첫/끝 투명. style-technical-audit.json:전체120프레임 R=G=B, 채널차0으로 청색외곽 없음; 여섯길이/여섯곡률이 다르다. 색/방향의 기술검사는 스타일합격이 아니다.
- 밝은회색/초록 전체연락판, 어두운 대표와 타격별모양, 실제전장배경합성을 직접 열어 확인했다. 기존 forest-clearing-v1.png를 원본보존해 별도 cover crop 합성했다. 유닛·라벨·실제전투피해 검사는 수행하지 않았으며 실제게임스킬 적용으로 보고하지 않는다.
- playback-audit.json:0.25/0.5/1/2배속 실제시간경과, 속도별정지 안정성, 재시작, 비반복종료, 반복재시작 통과; background-audit.json 배경4종 전환 통과; browser-console.json 오류0.
- mobile-320/390.json와 캡처:가로넘침0·조작48px·캔버스296/366 CSSpx. 큰화면은 Orca의 실제창1641px에서 별도확인(1100px 요청이 실제창에 그대로 적용되지 않음),47.994px 조작치수는 배율반올림. DPR1 캡처 증거이며 APK/실기기 검사가 아니다.
- media-audit.json:MP4 네종992×572·60FPS·120프레임·2초 전체디코드 오류0. GIF 두종744×429·총2초·무한반복; GIF의20ms50FPS표본과60FPS원본은 구분했다. ZIP 손상검사와 file프로토콜 독립HTML검사는 standalone-file-audit/packaging-audit에 기록한다.

독립테스터 확인·사용자 최종 스타일합격·최종 속도는 남아 있다. 기술통과를 사용자시각합격으로 승격하지 않는다. 게임빌드/전투회귀검사·commit/push는 수행하지 않았다.

## 미확정 기준 보완안

다각도 연격은 타격별 진행벡터·곡률·코어두께·스윕완료시각을 명세하고 색조채널 검사와 사용자스타일 판정을 분리하자. 이는 차수1의 유사사선/평평한리본 문제에서 도출한 제안이며 활성 규정은 변경하지 않았다.
''')
write('1_대화기록.md','사용자 피드백: 다양한 각도 / 청백색보다 흰색 / 애니메이션보다 진짜 이펙트 느낌. 확인 원문: 맞아 그느낌이야 진행. 차수1 미달본 보존, 차수2 제출/사용자합격미정.\n')
write('3_작업일지.md','필독15본문 재독→차수2 start→사본신규폴더→백색곡선mesh/다층블룸6방향 타임라인→120RGBA프레임→배경4종→전체연락판/모바일/배속→미디어디코드→차수1비교/보존해시. 기존게임과공방저장소 미수정.\n')
write('4_정의문서.md','차수2 명세:timeline.json, 독립 재생:preview.html, 편집파라미터:editable-plans.json, 출력코드:vfx-renderer.js/build.py. 6타 실제피해/영웅 미지정. 상세는 결과보고.md.\n')
write('5_버전관리.md','v002 로컬 신규결과물. 차수1 모든파일 보존검사 통과. 게임통합/commit/push 없음. manifest.json에 현재 파일 sha256 기록.\n')
print('V002 MEDIA/NEUTRAL/PRESERVATION/COMPARISON VERIFIED')
