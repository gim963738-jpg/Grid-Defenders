from pathlib import Path
import json,hashlib,datetime,subprocess
from PIL import Image
O=Path(__file__).resolve().parent
T=Path('C:/Users/user/Desktop/Grid Defenders/작업관리/작업/MAIN01-20261109-DBF50341')
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def read(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def save(p,v):Path(p).write_text(json.dumps(v,ensure_ascii=False,indent=2),encoding='utf-8')
meta=read(O/'image-metadata.json');task=read(T/'task.json');specs=read(O/'generation-specs.json');refspecs=read(O/'generation-specs-refined.json')
inputs=[]
for i,p in enumerate(specs[0]['referenced_image_paths']):
    im=Image.open(p);inputs.append(dict(path=p,sha256=sha(p),dimensions=list(im.size),generationInput=True,role=['identity_pixel_finish','reference1_body_proportions','reference2_design_language','hand_grasp_only'][i]))
for name in ['reference-3.png']:
    p=T/'참조'/name;im=Image.open(p);inputs.append(dict(path=str(p),sha256=sha(p),dimensions=list(im.size),generationInput=False,role='display_location_only'))
save(O/'generation-records.json',dict(task=task['id'],iteration=1,tool='built-in image_gen.imagegen',calls=8,paidExternalApiCalls=0,model='tool-managed; no explicit model override',transparent_background=True,inputs=inputs,firstPass=dict(specs='generation-specs.json',returns='generation-returned.json',status='history, not selected'),finalPass=dict(specs='generation-specs-refined.json',returns='generation-refined-returned.json',status='comparison concepts awaiting user evaluation'),outputs=meta[1:],nativeBytesPreserved=True))
paths={f'variant{i}':str(O/f'variant-{i}-final.png') for i in range(1,5)}
paths.update({k:str(O/v) for k,v in {'comparison':'comparison.png','html':'index.html','analysis':'분석.md','qa':'검수.md','browserEvidence':'browser-evidence.json','generationRecords':'generation-records.json','imageMetadata':'image-metadata.json'}.items()})
remaining=['사용자 시안 선택과 미적 합격 대기','총괄이 지정 오른쪽 영역에 최종 비교자료를 한 번 표시','실제 등신 약3.01~3.18로 목표3.3과 차이; 생성 상단 여백/본체 점유는 공통 규격 미달이며 표시에서만 등비 등록','1/2/4안 차이는3안보다 미세해 확대 비교 권장']
checks=dict(finalCount=4,viewImageOpenedFinals=True,viewImageOpenedComparisonAndLightDarkNarrowExpanded=True,nativeDimensionsAll=[1254,1254],allGeneratedBytesMatchSource=all(x['byteIdentical'] for x in meta[1:]),originalBytesUnchanged=meta[0]['byteIdentical'],actualAlpha=True,identityAndAnatomicalSidesReviewed=True,weaponsGraspAndClippingReviewed=True,bodyDisplayHeightCssPx=680,footBaselineCssPx=760,displayScaleUniform=True,sourceImagesResampled=False,headInclusiveUnits=[x['hairInclusiveHeads'] for x in meta[1:]],commonFramingPassed=False,browser=read(O/'browser-evidence.json'),userApproved=False,gameIntegrated=False,committed=False,pushed=False)
result=dict(task=task['id'],iteration=1,role='characters',status='produced_and_reviewed_awaiting_user_evaluation',outputPaths=paths,originalPath=meta[0]['originalSource'],originalSha256=meta[0]['sha256'],readingAcknowledgement=task['readingAcknowledgement'],checks=checks,remainingIssues=remaining)
save(O/'결과.json',result)
report='# 캐릭터 팀장 결과 보고\n\n작업 '+task['id']+' / 1차. 실제 신규 정면4안과 기존 원본 포함5열 비교를 제작·검수했다. 사용자 미적 합격은 대기다.\n\n'+'\n'.join('- '+k+': '+v for k,v in paths.items())+'\n\n기존 원본 SHA-256: '+meta[0]['sha256']+'\n\n내장 image_gen 총8회(초기4+비율 보완4), 외부 유료 API 호출0회. 모든 최종 개별 PNG는1254×1254 RGBA 원본 바이트 보존. 별도 Edge headless에서420px 화면·5열·확대 클릭·밝고 어두운 배경을 검사하고 실제 캡처를 열었다.\n\n남은 항목: '+'; '.join(remaining)+'. 앱 UI·모델 설정·탭·패널은 조작하지 않았다.\n'
(O/'report.md').write_text(report,encoding='utf-8')
(T/'characters-결과보고.md').write_text(report,encoding='utf-8')
(T/'3_작업일지.md').write_text('''# MAIN01-20261109-DBF50341 작업 일지

2026-11-09 characters 단일 편집자 작업. 17:24~17:25 필독 본문·작업연결·공유 작업대장·참조 승인 근거를 열람하고 문서별 적용 요약과 해시를 기록했다. 17:25:44 start 통과 후 새 폴더에 세부 사전확인과 분석을 작성했다.

참고1~3, 기존 금발 전사 정면·사선·정측면, 그립2장을 view_image로 열었다. 참고1의 비율/추정 한계와 참고2의8개 인물 실루엣·표정·의상·색·명암 개성 표현을 분석했다.

내장 image_gen으로 정면4안 생성 후 머리 비중이 목표보다 작은 문제를 확인했다. 초기 원본을 보존하고 같은 입력 원본으로 비율 우선 문구를 추가해4안을 새 생성했다. 외부 유료 API·크레딧 호출은 하지 않았다.

최종4개는1254×1254 RGBA이며 생성 원본과 SHA-256이 동일하다. 기존 원본도 그대로 복사했다. HTML/CSS 등비 등록만으로 본체680px·발선760px를 맞추고 별도 Edge headless 캡처로 비교 PNG를 작성했다. 초기 카드 폭에서 기존 장검 끝 잘림을 발견해600px로 넓히고 재검수했다.

420px 화면 가로 넘침0,5열 이미지 로드,3안 클릭 확대 dialog 동작을 실제 브라우저에서 확인했다. 최종4개와 밝은/어두운/좁은/확대 캡처를 view_image로 다시 열었다. 앱 UI·모델·패널·탭은 건드리지 않았다. 실전장·방향세트·애니메이션·게임 통합은 범위 밖이다.

초기 read-pack은 cp949 출력 인코딩 오류가 발생해 PYTHONIOENCODING=utf-8로 재실행했다. Orca 상태 보고의 progress 타입은 지원되지 않아 status로 수정 후 전달했다. 생성 도구는 정상 작동했다.

남은 사항은 사용자 선택/미적 평가와 총괄의 지정 영역1회 표시다. 실제 비율3.01~3.18 머리 단위와 생성 프레이밍 미달은 검수/결과에 명시했다. 이 문서는 작업 후 실제 결과 기록이다.
''',encoding='utf-8')
(T/'4_정의문서.md').write_text('''# MAIN01-20261109-DBF50341 정의

확정된 제작 범위: 기존 금발 장검·단검 SD의 정체성을 유지한 정면4안과 기존 포함5열 비교. 사용자 확인 원문 ‘진행’. 새 비율은 이번 작업의 참고1 우선이며 기존 은발 공통 규정 전체를 바꾸지 않는다. 일반 일러스트→1장 승인 순서는 이번 승인된 SD4안 비교에 한정해 대체했다.

1 원형 계승 / 2 민첩한 쌍수 전사 / 3 단단한 전위 전사 / 4 개성 강조 모험 전사. 이는 같은 캐릭터의 시안 분류이고 새로운 직업·계급·능력 수치·소속 설정이 아니다. 출신·소속은 기존 미지정 유지다.

모든 시안: 금발·갈색눈·청년 남성 인상·청색 목도리/내려진 후드·은갑옷·청색 허리 천·갈색 벨트/바지, 오른손 장검·왼손 단검·오른 견갑 초승달·오른 판금 정강이·왼 청색 천 장화/금속보호대 유지. 장검의 청색 사선·날개 가드·고리 보호대와 단검 짧은 각진 날을 유지한다.

비교용 임시 표시: 본체680 CSS px, 발선760 CSS px, 원본별 등비 배율. 실제 PNG는 확대·축소·재저장하지 않았다. 최종 머리 단위 약3.01~3.18이며 목표3.3과 차이가 있다. 생성 프레이밍20% 상단/74% 본체 점유는 미충족으로 기록하며 사용자 합격·공통 규정 합격을 주장하지 않는다.

비교 페이지는 좁은 화면에서도5열 전체를 표시하고 클릭 시 원본을 확대한다. reference3은 위치 확인 전용이며 생성 입력이 아니다. 기존 파일·규정·카탈로그·게임은 수정하지 않았고 실제 지정 영역 표시는 총괄이 수행한다. 개선 제안은 추후 선택된 안의 정확한 비율·프레이밍을 생성 단계에서 정교화하는 것이며 현재 공통 규정에 반영하지 않는다.

결과 경로와 검증 근거는 characters-결과보고.md 및 새 폴더 결과.json에 연결한다. 사용자 선택·미적 합격·방향세트·게임 반영은 미확정/미실행이다.
''',encoding='utf-8')
head=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
branch=subprocess.check_output(['git','rev-parse','--abbrev-ref','HEAD'],text=True,encoding='utf-8').strip()
manifest=[dict(path=str(p),sha256=sha(p),bytes=p.stat().st_size) for p in sorted(O.iterdir()) if p.is_file()]
save(O/'deliverable-manifest.json',manifest)
(T/'5_버전관리.md').write_text('# MAIN01-20261109-DBF50341 버전 관리\n\n작업 공간: '+str(O.parents[3])+'\n브랜치: '+branch+'\n검수 시점 HEAD: '+head+'\n시작 시점 HEAD는 별도 채집하지 않았으며 시작값으로 소급 주장하지 않는다.\n\n이번 변경은 지정 새 제작 폴더와 원작업 기록 폴더만이다. 새 폴더는 Git 미추적 상태이며 기존 PNG·프롬프트·규정·코드를 덮어쓰지 않았다. 기존 원본 SHA-256: '+meta[0]['sha256']+'\n\n생성 원본8개와 입력/프롬프트/결과 기록을 보존했다. 최종4개의 소스/사본 SHA-256 일치와 PNG 크기/알파는 image-metadata.json 및 generation-records.json, 산출물 해시는 deliverable-manifest.json을 따른다. 초기4안은 variant-1.png~variant-4.png와 first-pass에 보존했다.\n\n로컬 저장 완료, 사용자 합격 대기. Git 통합·커밋·푸시를 실행하지 않았다. 원격 저장 여부는 이번 범위에서 검증하지 않았다. 실제 앱 표시와 사용자 평가는 담당 main01 후속이다.\n',encoding='utf-8')
print(json.dumps(result,ensure_ascii=False,indent=2))
