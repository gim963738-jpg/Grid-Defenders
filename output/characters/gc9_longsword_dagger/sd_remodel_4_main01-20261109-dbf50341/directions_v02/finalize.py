from pathlib import Path
import json,hashlib,datetime,subprocess
O=Path(__file__).resolve().parent
T=Path('C:/Users/user/Desktop/Grid Defenders/작업관리/작업/MAIN01-20261109-DBF50341')
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def read(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def save(p,v):Path(p).write_text(json.dumps(v,ensure_ascii=False,indent=2),encoding='utf-8')
manifest=read(O/'asset-manifest.json');task=read(T/'task.json');before=read(O/'parent-files-before.json')
preservation=[dict(path=x['path'],before=x['sha256'],after=sha(x['path']),unchanged=x['sha256']==sha(x['path'])) for x in before]
save(O/'parent-files-after-check.json',dict(allUnchanged=all(x['unchanged'] for x in preservation),files=preservation))
specs=read(O/'generation-specs.json');refspec=read(O/'variant-2-profile-refinement-spec.json')
invocations=[]
for spec in specs+[refspec]:
    invocations.append(dict(id=spec['id'],prompt=spec['prompt'],transparent_background=spec['transparent_background'],inputs=[dict(path=p,sha256=sha(p),role=['own_front_identity_style_proportions','historical_corresponding_view_camera_only','grip_anatomy_only'][i]) for i,p in enumerate(spec['referenced_image_paths'])]))
save(O/'generation-records.json',dict(task=task['id'],iteration=2,tool='built-in image_gen.imagegen',calls=9,newFinalDirections=8,model='tool-managed image model; no override; separate from text model',paidExternalApiCalls=0,invocations=invocations,initialReturns=read(O/'generation-returned.json'),refinement=read(O/'profile-refinement-returned.json'),finalOutputs=manifest['compareArt'],allNativeBytesPreserved=True,sourceImagesResampled=False))
new=[x for x in manifest['compareArt'] if x['variant']>0 and x['direction']!='front']
remaining=['사용자 미적 합격·개체 동일성 최종 평가 대기','게임개발 담당의 read-only 원본 복사와 필드 배치 비교 연결 대기','방향별 세부 헤어/금속면/옷주름/가드 투영 및 일부 머리 비중 차이 남음','신규 원본 본체높이 정면 대비 약-2.1%~+2.7%,발선은 최대25px 차이;manifest로 표시 등록 필요','bodyBounds의x와footX는 수동 추정,먼발 가림으로 지원 중심에 약20px 불확실성']
pngPaths=[str(O/x['file']) for x in manifest['compareArt']]
checks=dict(assetCount=15,newDirectionCount=8,byteCopiedExistingCount=7,generatedCalls=9,all1254Rgba=all(x['width']==1254 and x['height']==1254 and x['mode']=='RGBA' for x in manifest['compareArt']),allSourceHashesMatch=all(x['sourceBytesMatch'] for x in manifest['compareArt']),allParentFilesUnchanged=all(x['unchanged'] for x in preservation),all15OpenedIndividuallyWithViewImage=True,lightDarkAndNarrowExpandedOpened=True,angleAndRightFacingReviewed=True,anatomicalEquipmentSidesReviewed=True,graspWeaponsCroppingReviewed=True,bodyHeightRelativeMin=min(x['relativeToOwnFront']['bodyHeightRatio'] for x in new),bodyHeightRelativeMax=max(x['relativeToOwnFront']['bodyHeightRatio'] for x in new),footYDeltaMaxAbs=max(abs(x['relativeToOwnFront']['footYDeltaPx']) for x in new),completePixelMatchedConsistency=False,userAestheticApproved=False,commonSdProportionConfirmed=False,gameCodeModified=False,gamePublicModified=False,catalogModified=False,appUiTouched=False,browser=read(O/'browser-evidence.json'))
outputs=dict(png=pngPaths,comparison=str(O/'comparison-directions.png'),html=str(O/'index.html'),assetManifest=str(O/'asset-manifest.json'),analysis=str(O/'분석추가.md'),qa=str(O/'검수.md'),generationRecords=str(O/'generation-records.json'),preservation=str(O/'parent-files-after-check.json'))
save(O/'결과.json',dict(task=task['id'],iteration=2,role='characters',status='additional_direction_concepts_produced_reviewed_awaiting_user_evaluation',outputPaths=outputs,readingAcknowledgement=task['readingAcknowledgement'],checks=checks,remainingIssues=remaining))
viewEvidence=dict(task=task['id'],iteration=2,tool='view_image',individualImagesOpened=pngPaths,comparisonScreenshotsOpened=[str(O/f) for f in ['comparison-directions.png','qa-dark.png','qa-narrow.png','qa-expanded.png']],review='direction, identity, sided equipment, anatomy/grip, clipping, scale, alpha edges on light/dark; limits in 검수.md')
save(O/'view-image-evidence.json',viewEvidence)
report='# 차수2 캐릭터 팀장 결과 보고\n\nMAIN01-20261109-DBF50341 / iteration2 / characters. 신규 오른쪽45도4장과90도4장을 생성했고,기존 사본7장 포함15파일 비교와 manifest를 제작·실제 검토했다.2안90도 머리비중을1회 보완해총9회 내장 image_gen 호출,외부 유료 API0회다.\n\n## 실제15파일\n\n'+'\n'.join('- '+p for p in pngPaths)+'\n\n## 연결 자료\n\n'+'\n'.join('- '+k+': '+str(v) for k,v in outputs.items() if k!='png')+'\n\nmanifest.compareArt는variant0~4,direction=front|right45|right90,file,width,height,bodyHeight,footX,footY를 가진15항목이다. 좌표는 원본픽셀,본체 높이는모발끝~발바닥,footX는지지중심 추정,footY는ROI alpha>=32 실측이며 각 항목의 측정근거·추정여부·source·SHA256을 함께 제공한다.\n\n신규 최종8개와 기존 사본7개 모두1254×1254 RGBA와source SHA256일치,부모1차파일해시전부보존을 확인했다.15개를각각view_image로 열고밝은/어두운 전체캡처 및420px화면/클릭확대를 별도Edge headless에서실행·열람했다. 사용자앱 UI·탭·창·모델설정·게임public/코드/카탈로그/규정은수정하지 않았다.\n\n남은 항목: '+'; '.join(remaining)+'. 방향 시안 제출 가능 상태이며 사용자 미적 합격과 게임통합은 별도다.\n'
(O/'report.md').write_text(report,encoding='utf-8')
(T/'characters-결과보고-v002.md').write_text(report,encoding='utf-8')
head=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
branch=subprocess.check_output(['git','rev-parse','--abbrev-ref','HEAD'],text=True,encoding='utf-8').strip()
(T/'3_작업일지-characters-v002.md').write_text('''# MAIN01-20261109-DBF50341 작업 일지 — 차수2

2026-11-09 캐릭터 팀장이 같은 공간 단일 편집자로 후속 작업을 수행했다. 이번 차수 필독20문서·작업연결·추가요청·1차보고/검수/생성기록을 다시 읽고 새로운 읽기확인을 작성해17:58 start를 통과했다.1차 읽기확인은 재사용하지 않았다.

정면4장과 기존 원형45/90도를 view_image로 열어 구성/방향을 확인했다. 사전확인과 프롬프트를 새 directions_v02에 작성하고 기존7개 PNG를바이트복사했다.1차부모파일SHA256을제작전저장했다.

내장 image_gen으로신규8장생성후2안90도의머리가작아보여1회보완했다.첫후보는candidates에보존하고최종파일계약경로에보완본을선택했다.총9회호출,외부유료API호출없음,리샘플링/반전없음.

각이미지의머리/발ROI alpha32측정과가시몸외곽·발지지중심수동추정으로manifest를작성했다.총괄의추가CompareArt계약을수신해variant0~4,direction,file,width,height,bodyHeight,footX,footY15항목배열을추가했다.게임코드/public은수정하지않았다.

별도Edge headless에서2200×1950밝은/어두운15칸비교,420px넘침없음,1안90도원본클릭확대를실행하고캡처했다.15개개별원본과4종캡처를view_image로다시열어방향·좌우·동일성·무기/손·잘림·비율을검토했다.1차부모파일해시불변도검사했다.

신규몸높이는정면대비−2.1%~+2.7%,발선최대25px차이와일부머리비중/장식/주름차이가남는다.원본을변형하지않고비교화면만등비등록했다.사용자미적합격과게임통합/전장검증은미실행이다.이기록은작업후실제결과기록이며차수1파일을덮어쓰지않았다.
''',encoding='utf-8')
(T/'4_정의문서-characters-v002.md').write_text('''# MAIN01-20261109-DBF50341 정의 — 차수2

확정범위:각정면4안의같은인물을화면오른쪽앞45도와완전정측면90도로추가제작,신규8장.이는정면4안전체미적합격/공통비율확정이아니다.각안별정면의비율·표정·장비를회전입력으로사용했다.

파일계약:variant-N-front.png는기존정면바이트사본,variant-N-right-045.png/variant-N-right-090.png는신규.기존원형3방향은original-front.png/original-right-045.png/original-right-090.png로바이트복사했다.모두directions_v02에저장한다.

메타데이터:asset-manifest.json.assets.original/variant1~4의front/right45/right90과compareArt평면15배열을제공한다.필드variant=0~4,direction=front|right45|right90,file,width,height,bodyHeight,footX,footY,SHA256,source.좌표원점은원본좌상단,bodyHeight=footY-hairTop+1.본체범위는무기끝제외이며ROI alpha>=32로머리끝/발선을측정했다.가로몸외곽과footX는수동추정이고가림/오차를명시한다.

시각조건:두발입상,오른손장검/오른초승달견갑/오른판금정강이,왼손단검/왼청색천장화,짧은후드.45도는두눈·앞흉갑,90도는한눈·옆흉갑이다.먼쪽가림은허용하고숨은장비노출용팔추가는금지했다.

임시비교표시는본체380 CSS px/발선440 CSS px등비등록이다.원본이미지를변형하지않았다.일부방향세부/머리비중/발선차이와1차공통프레이밍미달은한계로유지한다.향후제안은선택된안의정밀등록검토이며공통규정에반영하지않았다.사용자미적합격·게임통합은대기다.
''',encoding='utf-8')
(T/'5_버전관리-characters-v002.md').write_text('# MAIN01-20261109-DBF50341 버전관리 — 차수2\n\n작업공간: '+str(O.parents[4])+'\n브랜치: '+branch+'\n시작/검수 HEAD: '+head+'\n\n이번출력은directions_v02및원작업차수2추가기록뿐이다.1차PNG/HTML/보고/검수/기록을덮어쓰지않았으며부모해시보존검사결과는parent-files-after-check.json이다.정면4/기존원형3은바이트사본,신규8개는생성원본바이트이다.2안90도첫후보도candidates에보존했다.\n\nasset-manifest.json에15파일SHA256/source/실제크기·측정을기록했다.생성입력/프롬프트/9호출결과는generation-records.json을따른다.로컬저장완료,Git통합·커밋·푸시는하지않았다.원격저장상태는이번범위에서검증하지않았다.게임개발은이폴더를read-only로읽어원본을public에바이트복사할예정이며캐릭터담당은public을수정하지않았다.\n',encoding='utf-8')
files=[dict(path=str(p),sha256=sha(p),bytes=p.stat().st_size) for p in sorted(O.iterdir()) if p.is_file() and p.name!='deliverable-manifest.json']
save(O/'deliverable-manifest.json',files)
print(json.dumps(dict(pngCount=len(pngPaths),allSourceHashesMatch=checks['allSourceHashesMatch'],parentPreserved=checks['allParentFilesUnchanged'],bodyRelativeRange=[checks['bodyHeightRelativeMin'],checks['bodyHeightRelativeMax']],report=str(O/'report.md'),manifest=str(O/'asset-manifest.json')),ensure_ascii=False,indent=2))
