from pathlib import Path
import json
R=Path(__file__).parent
p=R/'결과.json';d=json.loads(p.read_text(encoding='utf-8'));d['originalPath']=json.loads((R/'source-inputs.json').read_text(encoding='utf-8'))[0]['source'];d['directionChange']=dict(messageId='msg_eb3a144e6df1',call4AlreadyRunningWhenReceived=True,subsequentImageCalls=0,right34PartsRiggingStarted=False);p.write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf-8')
note='\n\n얼굴 영역 별도 관찰: 눈썹선~턱의 수동ROI는 반려본 y342~428(86px)/884px≈9.7%, 수정본 y314~414(100px)/1001px≈10.0%이며 각 경계 추정오차±8px가 있다. 모발포함머리 비중28.1%→26.2%와 구분한다. 얼굴을 줄여 폭수정을 대신한 것으로 판단하지 않으며, 정확한 나이감/선호 판정은 사용자에게 남긴다.\n'
for n in ['분석.md','검수.md']:
 p=R/n;p.write_text(p.read_text(encoding='utf-8')+note,encoding='utf-8')
checks=json.loads((R/'verification-evidence.json').read_text(encoding='utf-8'));checks['actualViewEvidence']=['front.png','comparison.png','silhouette-comparison.png','identity-comparison.png','identity-detail-comparison.png','qa-dark.png','qa-detail-dark.png','qa-small-light.png','qa-small-dark.png'];checks['call4ReturnedNoLaterImageCalls']=True
(R/'verification-evidence.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2),encoding='utf-8')
print('face measurement separated from hair-inclusive head; no new generation')
