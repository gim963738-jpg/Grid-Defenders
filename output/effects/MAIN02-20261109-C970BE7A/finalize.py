from pathlib import Path
from PIL import Image
import json, subprocess, hashlib, zipfile
P=Path(__file__).resolve().parent
def write(n,s):(P/n).write_text(s,encoding='utf-8')
def j(n):return json.loads((P/n).read_text(encoding='utf-8-sig'))
checks=[]
for name in ['battle','grey','green','dark']:
 f=P/f'six-slash-{name}.mp4'
 r=subprocess.run(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=codec_name,width,height,nb_frames,r_frame_rate,duration','-of','json',str(f)],capture_output=True,text=True,check=True)
 s=json.loads(r.stdout)['streams'][0]
 assert s['nb_frames']=='150' and float(s['duration'])==2.5 and s['width']==992 and s['height']==572,s
 subprocess.run(['ffmpeg','-v','error','-i',str(f),'-f','null','-'],check=True,capture_output=True)
 checks.append(dict(file=f.name,decode='pass',**s))
for name in ['battle','grey']:
 f=P/f'six-slash-{name}.gif';im=Image.open(f);duration=0
 for i in range(im.n_frames):im.seek(i);duration+=im.info.get('duration',0)
 assert duration==2500 and im.info.get('loop')==0,(name,duration)
 checks.append(dict(file=f.name,frames=im.n_frames,durationMs=duration,loop=0,alpha=False))
write('media-audit.json',json.dumps(checks,indent=2))
ack=j('읽기확인.json')
for d in ack['documents']:assert hashlib.sha256(Path(d['path']).read_bytes()).hexdigest()==d['sha256'],d['path']
audit=j('frame-audit.json'); margins=[min(x['margins']) for x in audit['metrics'] if x['margins']]
spec=j('timeline.json')
for h in spec['hits']:
 import math
 h['firstVisibleFrame']=next(x['frame'] for x in audit['metrics'] if x['bbox'] and h['start']<x['time']<h['end'])
 h['emphasisSampleFrame']=math.ceil(h['emphasis']*60-1e-8)+1
 h['lastVisibleFrame']=max(x['frame'] for x in audit['metrics'] if x['bbox'] and h['start']<x['time']<h['end'])
spec['extraction']='No sheet extraction; authored transparent render output. Source canvas960square cropped y210..750 into content960x540 then padded16px.'
spec['backgroundProvenance']='Original forest-clearing-v1.png retained unmodified; battlefield-display.png is uniform cover crop for non-destructive standalone composition.'
write('timeline.json',json.dumps(spec,ensure_ascii=False,indent=2))
# Refresh the packaged specification after adding sampled frame times.
with zipfile.ZipFile(P/'six-slash-alpha-source.zip','w',zipfile.ZIP_DEFLATED) as z:
 for f in (P/'frames').glob('*.png'):z.write(f,'frames/'+f.name)
 for name in ['preview.html','timeline.json','drawingRender.js','drawingModel.js','editable-plans.json','build.py','export.py','serve.py','qa.py','finalize.py','mobile-ui.css','battlefield-display.png','battlefield-source.png','sources.json','전문제작프롬프트.md']:z.write(P/name,name)
links=lambda name:f'[{name}]({(P/name).as_posix()})'
table='\n'.join(f"|{h['number']}|{h['start']:.2f}|{h['emphasis']:.2f}|{h['fadeStart']:.2f}|{h['end']:.2f}|{h['firstVisibleFrame']}–{h['lastVisibleFrame']}|" for h in spec['hits'])
write('결과보고.md',f'''{links('preview.html')} · {links('six-slash-battle.mp4')} · {links('six-slash-battle.gif')}

# MAIN02-20261109-C970BE7A / 차수1 / effects 결과

청백색 사선 검격을 정확히 여섯 번 가르는 하나의 연속 콤보로 제작했다. 전체2.5초·150프레임·60FPS,1배는 **제안 초기값**이며 사용자 확정값이 아니다. 처음/마지막 프레임은 투명하고 마지막 잔광은1.85초에 끝난다. 각 타격은 각도23~28도/길이/위치/간격이 다르고 마지막만 길이와 소멸 지속을 절제해 늘렸다. 레이저봉·X자·충격파·화염·보라색 폭발은 추가하지 않았다.

## 바로 보는 파일

- {links('six-slash-grey.mp4')} · {links('six-slash-green.mp4')} · {links('six-slash-dark.mp4')}:992×572 H.264 MP4, 각각2.5초·150프레임, 알파 없음.
- {links('six-slash-grey.gif')} · {links('six-slash-battle.gif')}:744×429 반복 GIF, 각2.5초, 배경 합성되어 알파 없음. GIF는20ms 단위50FPS 시간 표본이며60FPS 원본은 PNG/MP4에 보존.
- {links('six-slash-alpha-source.zip')} · {links('six-slash.rgba-atlas.png')}: 실제 RGBA150프레임, frames/frame-000.png~149.png 및10열15행 아틀라스. 검은 배경 영상을 투명 원본으로 부르지 않는다.
- {links('timeline.json')} · {links('editable-plans.json')} · {links('전문제작프롬프트.md')}: 타임라인, 여섯 타의 실제 편집 도형, 전문 프롬프트.
- {links('contact-grey.jpg')} · {links('contact-green.jpg')} · {links('contact-dark.jpg')} · {links('contact-battle.jpg')}: 전체150프레임을 번호/시간과 함께 나열.
- {links('representative-grey.png')} · {links('representative-dark.png')} · {links('representative-battle.png')}:6타 강조 대표 프레임.

## 재생 사용법

preview.html을 폴더 그대로 열면 서버 없이 재생된다. 재생/정지·처음부터·반복·0.25/0.5/1/2배속·배경4종·스크럽·이전/다음 프레임·완료 타격번호가 있다. UI는 시야 밖에 배치했다. 로컬 HTTP 확인 주소는 http://127.0.0.1:5197/preview.html 이며 serve.py는 원본 재출력용 보조 서버다. build.py→서버→qa.py의 exportFrames→export.py→finalize.py 순으로 재출력할 수 있다.

## 타임라인 계약

|타|시작s|강조/가르기완료s|소멸시작s|종료s|실제 표시 프레임(1부터)|
|---|---|---|---|---|---|
{table}

기준점은 대상 중심으로 고정: 원본 콘텐츠960×540의(480,270), 패딩 후992×572의(496,286). 사방16px 안전 여백이며 규약1536px당24px를960px에 비례 적용한15px보다 넓다. 실제 모든 표시 프레임의 최소 외곽 여백은{min(margins)}px이다.960정사각 렌더 중 y210~750만 사용하되 전체 도형이 그 영역 안에 들어가도록 작성했고 잘린 그림을 패딩으로 숨기지 않았다. 추출 좌표·투명 여백·pivot·표시 범위·피해 판정은 분리했다. 영웅·물리/마법·피해배율·사거리·실제6회피해·쿨타임·대상·캔슬은 전부 미정이며 게임과 연결하지 않았다.

## 적용 기준과 원본

읽기확인.json의13개 필독 본문/해시/적용 요약으로 start 통과, 제출 직전 전부 해시 재확인했다. AGENTS와 effects 작업방법/규정, 스킬구현규약v1, 사용자요청을 우선 적용했다. 추가로 기존 공방 WEB-155 정의, WEB-162 최신 수평검상 피드백, WEB-169 재료함 계약/사용법, 모바일UI규격을 본문으로 조사했다. 수평 일섬의0.65초 사용자 판정은 해당 작품 기준이므로 이번6연격 전체의 확정 속도로 복제하지 않았다.

기존 공방의 drawingModel/drawingRender를 Vite 컴파일 사본으로 읽어 신규 출력 폴더에 보존했다. 동일 선 그리기/시작점 소멸 엔진 위에서6타 타임라인·푸른 잔광 합성·독립 뷰어만 구성했다. 기존 게임/src·재료함·라이브러리·공통 규정은 수정하지 않았다. sources.json은 실제 엔진 및 전장 원본 절대경로/해시다. 입력 참조는 직접 열어 분석했으며 픽셀 추출이 아닌 절차적 재현이다.

도구: 기존 Canvas2D 공방 렌더러, Orca 내장 브라우저, Python/Pillow, FFmpeg/libx264. 이미지/영상 외부 생성 서비스 호출0·유료모델 전환0·외주 사용량0. 외주 완성 시트를 분해/재조립하지 않았다.

## 검증과 한계

- frame-audit.json:150프레임, 알파 표시 구간6개 {audit['visibleSegments']}, 경계 접촉0,16px 안전 여백 확보, 첫/마지막 투명. RGB 검정 매트는 alpha>16 픽셀에서0개다. alpha=1의 Canvas 양자화 검정은 최대1/255로 기록하고 밝은 합성에서 검은 테두리 없는 것을 확인했다.
- 밝은 회색·초록 전체 연락판과 어두운/전장 대표 프레임을 직접 열어 확인했다. 전장 원본은 기존 게임의 forest-clearing-v1.png이며 원본 사본을 보존하고 동일 비율 cover crop으로 별도 합성했다. 실제 유닛·상단 라벨·진행 중 전투와의 겹침 검사는 하지 않았고 게임 스킬 적용으로 보고하지 않는다.
- playback-audit.json:실제 브라우저에서0.25/0.5/1/2배속 경과시간, 각 속도 정지 안정성, 처음부터, 비반복 종료/반복 재시작 통과. background-audit.json:배경4종 전환 통과. browser-console.json:오류0.
- mobile-320/390.json과 preview-320/390.png:각320/390 CSSpx, 가로 넘침0, 캔버스296/366px, 조작영역48px 이상. 큰 화면은 요청1100px에 대해 Orca가 실제1641px 창을 사용했으며 DOM 측정상 가로 넘침 없고 캔버스1076px이다.47.994px 측정은 브라우저 배율 반올림값이다. DPR3 스크린샷의 반복 타일 오류가 관찰되어 최종 증거는 DPR1 캡처로 검증했다. 실기기/APK 검사는 아니다.
- media-audit.json:MP4 네 파일 각각150프레임/60FPS/2.5초 확인, 전체 디코드 오류0; GIF 두 파일2.5초/무한반복 확인. MP4/GIF는 배경 합성본이며 알파가 없다.
- 독립 출력만 바꿨으므로 게임 빌드·피해/쿨타임 회귀 검사는 실행하지 않았다. 독립 테스터 검사와 사용자의 최종 시각 합격·최종 속도 판정은 남아 있다. 사용자에게 추가 승인 절차를 만들지 않았다.

## 기준 보완 제안 (미확정)

후속 다연격은 각 타격의 출현 구간과 강조 완료 시간을 별도 명세하고, 영상/GIF의 시간 양자화와 알파 원본을 분리 기록한다. 이는 이번 결과의 기술 제안이며 활성 공통 규정은 수정하지 않았다. 파일 변경·해시는 manifest.json에 보존하며 commit/push/게임통합은 수행하지 않았다.
''')
write('1_대화기록.md','사용자 확인 원문: “저검격이 6연격으로 만든 연출을 나한테 보여줄수있도록 전문 프롬프트 작성해서 작업 바로 진행해”.\n원작업 MAIN02-20261109-C970BE7A / 차수1 / main02 / effects. 사용자 판정·속도 미확정.\n')
write('3_작업일지.md','필독13문서 본문 및 관련 공방/재료함 문서 조사 → start 통과 → 첨부 직접 분석 → 기존 엔진 사본/신규 타임라인 작성 →150 RGBA프레임 → 밝은 배경 잔광 보정 → 전체프레임 알파/여백 확인 → 모바일/배속/정지/재시작 확인 →MP4/GIF 출력·디코드 확인 → 결과보고.\n초기 UTF-8 출력 오류, HTML 텍스트 치환 오류, 시험 배속 select 값 표현 불일치는 수정 후 재검증했다. alpha1 양자화는 frame-audit에 한계를 명시했다.\n')
write('4_정의문서.md','작품 정의/사용법/원본·좌표·시간·피해미정 계약은 결과보고.md와 timeline.json을 따른다. 도형 편집 원본은 editable-plans.json, 재현 스크립트는 build.py/export.py/qa.py/finalize.py.\n')
write('5_버전관리.md','차수1 로컬 신규산출물 v1. 기존 미커밋 변경 보존. 게임/src·라이브러리/재료함·공유규정 미수정, commit/push/게임통합 없음. manifest.json에 산출물 sha256 기록.\n')
manifest=[]
for p in sorted(P.rglob('*')):
 if p.is_file() and p.name!='manifest.json':manifest.append(dict(path=str(p.relative_to(P)),bytes=p.stat().st_size,sha256=hashlib.sha256(p.read_bytes()).hexdigest()))
write('manifest.json',json.dumps(manifest,ensure_ascii=False,indent=2))
print('FINAL VERIFIED',len(manifest),'files',len(checks),'media outputs')
