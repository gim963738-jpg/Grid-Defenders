from pathlib import Path
import json
R=Path(__file__).parent
p=R/'generation-records.json';d=json.loads(p.read_text(encoding='utf-8'));d['calls'][1]['output']='candidate-02-shield-ratio.png';d['calls'][1]['decision']='Preserved framing improvement; shield/body ratio about59% triggered dedicated shield-only repair.'
d['calls']=[c for c in d['calls'] if c['id']!=3]+[dict(id=3,input='shield-edit-input.json',request=json.loads((R/'shield-edit-input.json').read_text(encoding='utf-8')),rawPath='C:/Users/user/.codex/generated_images/01a1bf68-4705-71f0-9449-07a1041b38d9/exec-c5520748-e627-448b-a870-7a95273652fb.png',output='front.png',status='completed',decision='Final internal-review delivery; original large shield ratio restored, new SD artistic approval still pending')]
p.write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf-8')
p=R/'measurements.json';d=json.loads(p.read_text(encoding='utf-8'));f=d[2];f.update(hairTop=180,sole=1064,bodyHeight=884,footY=1064,source='builtin imagegen call3 native output',shieldTop=448,shieldBottom=1042,shieldHeight=594,shieldBodyRatioEstimate=594/884,shieldMeasurementErrorPx=8);f['detailROIs']['shield']=[640,440,944,1048]
p.write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf-8')
p=R/'finalize-records.py';s=p.read_text(encoding='utf-8');s=s.replace('left=293,top=181,right=292,bottom=191','left=292,top=180,right=291,bottom=190').replace('882/(428-181)','884/(428-180)')
s=s.replace('882','884').replace('1063','1064').replace('hairInclusiveHeadUnitsEstimate=round(884/(428-180),2)','hairInclusiveHeadUnitsEstimate=round(884/(428-180),2)').replace('약3.57','약3.56')
s=s.replace('모발끝181','모발끝180').replace('턱428 기준 모발포함 머리247px','턱428 기준 모발포함 머리248px')
s=s.replace('[293,181,962,1064]','[292,180,963,1064]').replace('좌293/우292/위181/아래191px','좌292/우291/위180/아래190px').replace('위181/아래191/좌293/우292px','위180/아래190/좌292/우291px')
s=s.replace('약65%에 가깝게 복구했다','약67%(594±8px/몸884±6px)로 복구했다').replace('사자머리 단독/금색 문장으로 변경 안 함. 갈기·발·꼬리의 세부 곡선은 단순화.','사자머리 단독/금색 문장으로 변경 안 함. 갈기·발의 세부 곡선은 단순화. 최종 큰 방패가 오른쪽 꼬리/하체 일부를 가리므로 가린 모양의 완전성은 확인 불가, 보완전 후보에서 전체를 대조했다.')
s=s.replace('원본생성PNG3개바이트보존. 생성候補는candidate-01-tight-framing.png로보관.','원본생성PNG3개바이트보존. 두 후보는candidate-01-tight-framing.png/candidate-02-shield-ratio.png로보관.')
p.write_text(s,encoding='utf-8')
print('call3, measurement, shield repair registered')
