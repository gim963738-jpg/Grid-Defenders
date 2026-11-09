from pathlib import Path
import json,hashlib,datetime
out=Path(__file__).resolve().parent
now=datetime.datetime.now().astimezone().isoformat()
r=json.loads((out/'browser-result.json').read_text(encoding='utf-8'))
h=json.loads((out/'target-hashes.json').read_text(encoding='utf-8'))
for x in h:
    x['afterSha256']=hashlib.sha256(Path(x['path']).read_bytes()).hexdigest()
    x['unchangedAfterQA']=x['afterSha256']==x['actual']
(out/'target-hashes.json').write_text(json.dumps(h,ensure_ascii=False,indent=2),encoding='utf-8')
result={
 'task':'MAIN01-20261109-1DA15A51','iteration':2,'role':'qa','at':now,
 'technicalResult':r['result'],'runtimeExceptions':len(r['errors']),
 'checks':[{'item':c['name'],'status':'PASS' if c['passed'] else 'FAIL','evidence':'browser-result.json; independent-browser.mjs'} for c in r['checks']],
 'additionalChecks':[
  {'item':'root/UI changed16 + preserved34 hashes match and remain unchanged','status':'PASS' if all(x['passed'] and x['unchangedAfterQA'] for x in h) else 'FAIL','evidence':'target-hashes.json'},
  {'item':'four new PNG source SHA/alpha/dimensions/runtime metadata','status':'PASS','evidence':'asset-audit.json'},
  {'item':'bright/dark full native canvases and live battlefield visual inspection','status':'PASS','evidence':'fullframes-light.png; fullframes-dark.png; new-four-wave.png; new-boss.png; narrow-320.png'}
 ],
 'unverified':[
  {'item':'실기기/APK/WebView/세로전투전체','status':'미검증','reason':'지정 가로5173 URL의headless검사'},
  {'item':'실제손가락/멀티터치/OS앱전환/장기자연웨이브','status':'미검증','reason':'CDP터치및마우스/합성pointercancel/개발자전환사용'},
  {'item':'dispose/setAssets isolated fixture 및 전체기존모델/브라우저suite','status':'미검증','reason':'변경관련실제게임77항목완료;제품fixture추가/반복모델테스트불필요'},
  {'item':'사용자미적합격/공통비율채택/무기각도·유색알파외곽잔여해소','status':'미검증','reason':'원작품검수한계를보존하며기능QA로대신하지않음'}
 ],
 'productFilesModified':False,'existingServerRestarted':False,'userProfileTouched':False,
 'committed':False,'pushed':False,'scheduledBackup':False,
 'build':'main root tsc+Vite801 PASS report referenced; not rerun',
 'artAcceptance':'pending_user'
}
(out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
records=Path('C:/Users/user/Desktop/Grid Defenders/작업관리/작업/MAIN01-20261109-1DA15A51')
entries={
 '3_작업일지.md':'차수2 새read-pack/문서별ACK와start 통과 후실제root5173에서새Edge/CDP9351검사. 첫48/확장76/최종77항목PASS,예외0. 신규4PNG원본·알파·메타PASS,변경16+보존34총50해시 검사전후일치. 스크린샷view_image열람완료. 제품/기존QA결과/사용자환경수정0. 결과 '+str(out/'report.md')+' 및 result.json. 미검증은해당보고서참조.',
 '4_정의문서.md':'차수2는사용자직접요청 이미지대조추가해봐에따라신규두상·얼굴정면4안과기존15개의혼합기능만검사했다. 없는신규측면은비활성/강제change보존,선택묶음/방향/스케일일관성검사PASS. 실제유닛교체/측면제작/공통비율채택/사용자미적합격으로승격하지않음. 저장운영규정준수:기능요청은Git저장요청아님.',
 '5_버전관리.md':'차수2 QA HEAD1a54b474e96a718f77c4852c1aea3f66e0564a34의오래된자기게임은실행하지않고Desktop실행본검사. 변경16개와main.ts/기존15PNG/manifest보존34개전후SHA는 '+str(out/'target-hashes.json')+'. 차수1output보존,차수2output와이3/4/5추가기록만작성. 커밋0/푸시0/예약백업0/제품수정0/기존서버재시작0. 로컬산출물SHA는artifact-hashes.json.'
}
for name,content in entries.items():
    with (records/name).open('a',encoding='utf-8') as f:
        f.write('\n\n## 차수2 독립QA — '+now+'\n\n'+content+'\n')
artifacts=[{'path':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in out.iterdir() if p.is_file() and p.name!='artifact-hashes.json']
(out/'artifact-hashes.json').write_text(json.dumps(artifacts,ensure_ascii=False,indent=2),encoding='utf-8')
print('checks',len(r['checks']),'runtime exceptions',len(r['errors']),'all hashes unchanged',all(x['unchangedAfterQA'] for x in h))
