from pathlib import Path
import json
R=Path(__file__).parent;p=R/'generation-records.json';d=json.loads(p.read_text(encoding='utf-8'));c=d['calls'][-1];assert c['id']==4;c.update(status='completed',rawPath='C:/Users/user/.codex/generated_images/01a1bf68-4705-71f0-9449-07a1041b38d9/exec-9dd13e54-a37f-4eb3-96ab-f20cc19c8f7f.png',output='front.png',decision='Returned already-running shield-only edit, inspected; no further image calls after coordinator direction-change message')
d['directionChange']=dict(messageId='msg_eb3a144e6df1',receivedWhileCall4Running=True,callsStartedAfterMessage=0,newRight34PartsRiggingStarted=False,remainingWork='preserve returned current front and complete authorized iteration2 comparisons/QA only')
p.write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf-8')
p=R/'measurements.json';d=json.loads(p.read_text(encoding='utf-8'));f=d[2];f.update(sole=1153,bodyHeight=1001,footY=1153,chin=414,footX=626,shieldROI=[638,433,884,1064],shieldHeightEstimate=631,shieldBodyHeightEstimate=631/1001,shieldHeightErrorPx=10);f['detailROIs']['shield']=[635,430,891,1072];f['faceRegion']=[537,314,710,414]
f['widthMeasurements']['shield'].update(x1=638,x2=883,y=685)
p.write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf-8')
p=R/'finalize-v002.py';s=p.read_text(encoding='utf-8');s=s.replace('8캡처/원본1254px확대','8캡처/원본1254px확대')
s=s.replace("report=f'''# 발로르", "faceold=100*(old['faceRegion'][3]-old['faceRegion'][1])/old['bodyHeight']; facenew=100*(new['faceRegion'][3]-new['faceRegion'][1])/new['bodyHeight']\nreport=f'''# 발로르")
s=s.replace('사용자확정수치/미적합격을대신하지않는다. 선택1번의얼굴비중을줄여좁아보이게속이지않고','사용자확정수치/미적합격을대신하지않는다. 모발포함머리비중은약2%p작아졌지만 눈썹선~턱의실제얼굴영역비중은{faceold:.1f}%→{facenew:.1f}%로유지됐고, 얼굴축소로폭을속인것이아니다. 선택1번의얼굴비중을줄여좁아보이게속이지않고')
s=s.replace('신규정면의사용자합격/측면/', '총괄새방향메시지msg_eb3a144e6df1확인당시4번째호출은이미진행중이었고반환을보존했다. 메시지이후신규이미지호출0건/우측3/4·파츠·리깅제작0건, 현재차수2비교·기록만마무리했다. 신규정면의사용자합격/측면/')
p.write_text(s,encoding='utf-8')
print('returned call4 preserved; new calls after coordinator steering:0')
