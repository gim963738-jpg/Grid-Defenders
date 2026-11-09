from pathlib import Path
import json, hashlib, datetime

out = Path(__file__).resolve().parent
now = datetime.datetime.now().astimezone().isoformat()
r = json.loads((out/'browser-result.json').read_text(encoding='utf-8'))
h = json.loads((out/'target-hashes.json').read_text(encoding='utf-8'))
for x in h:
    x['afterSha256'] = hashlib.sha256(Path(x['path']).read_bytes()).hexdigest()
    x['unchangedAfterQA'] = x['actual'] == x['afterSha256']
(out/'target-hashes.json').write_text(json.dumps(h, ensure_ascii=False, indent=2), encoding='utf-8')
result = {
    'task':'MAIN01-20261109-1DA15A51', 'iteration':1, 'role':'qa', 'at':now,
    'technicalResult':r['result'], 'runtimeExceptions':len(r['errors']),
    'url':'http://127.0.0.1:5173/battle-landscape.html?battle=normal&from=camp',
    'checks':[{'item':c['name'],'status':'PASS' if c['passed'] else 'FAIL','evidence':'browser-result.json; independent-browser.mjs'} for c in r['checks']],
    'additionalChecks':[
        {'item':'root/UI 40 integrated hashes unchanged after QA','status':'PASS' if all(x['passed'] and x['unchangedAfterQA'] for x in h) else 'FAIL','evidence':'target-hashes.json'},
        {'item':'15PNG source bytes/alpha32/dimensions/nonmirror directions','status':'PASS','evidence':'asset-audit.json; fullframes-light.png; fullframes-dark.png'},
        {'item':'main.ts minimal patch: 7 added / 1 replaced','status':'PASS','evidence':'live-root-main.diff; ui-main.diff'}
    ],
    'unverified':[
        {'item':'사용자 미적 합격','status':'미검증','reason':'사용자 판정 영역'},
        {'item':'실기기 Android/APK/WebView/실제 멀티터치/OS 앱전환','status':'미검증','reason':'headless CDP; blur/pointercancel 일부 합성 이벤트'},
        {'item':'세로 실제전투/장기 자연 웨이브진행/기존15 browser suites','status':'미검증','reason':'지정 가로 URL 및 개발자 전환으로 한정'},
        {'item':'제작자 isolated dispose2회 fixture와 수학 단위검사','status':'미검증','reason':'제품 DOM 동등40항목으로 대체; fixture 제품 추가 없음'}
    ],
    'productFilesModified':False,'existingServerRestarted':False,
    'userProfileTouched':False,'productionBuildRerun':False,'artAcceptance':'pending_user'
}
(out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
records = Path('C:/Users/user/Desktop/Grid Defenders/작업관리/작업/MAIN01-20261109-1DA15A51')
entries = {
 '3_작업일지.md': '# MAIN01-20261109-1DA15A51 작업 일지\n\n2026-11-09 수신 후 필독 본문 read-pack과 개별 적용요약 작성, 18:19:09 start 통과. 실제 root/UI40해시 확인 후 새 headless Edge/CDP9347로 root5173 검사. 기존 서버/사용자 프로필 무조작.\n\n검사 도구 인코딩/전역const/클릭억제대기/선택해제/정적갤러리격리/자동저장안정화 문제를 교정했다. 제품수정0. 초기 실패와 최종 판정의 구분은 report.md에 기록했다.\n\n'+now+' 최종40브라우저PASS/예외0,15자산 원본·알파PASS,40파일 검사후해시 불변. 결과: '+str(out/'report.md')+' 및 result.json/스크린샷. 실기기/미적합격/세로/장기자연진행은 미검증.\n',
 '4_정의문서.md': '# MAIN01-20261109-1DA15A51 정의\n\n원작업 MAIN01-20261109-F89105C9의 실제 root5173 통합 이미지대조 개발도구를 검사한다. 사용자확인.md의 직접배치/배치후크기 및 사용자방향추가.md의우45/우90을 기대결과로 사용했다. OPS004 읽기확인/start 기록을 준수했다.\n\n기술PASS는 브라우저 동작과 파일일치만 뜻한다. 사용자 미적합격/실기기APK는 별도이며 제작원본 수정권한이 없다. 신규 활성규정 변경없음. footX±20px/footY±3px 제작추정한계 유지.\n\n40개 항목과 미검증: '+str(out/'result.json')+' 및 report.md.\n',
 '5_버전관리.md': '# MAIN01-20261109-1DA15A51 버전 관리\n\nQA워크스페이스 HEAD:1a54b474e96a718f77c4852c1aea3f66e0564a34. 기존 미커밋 게임소스/AGENTS/작업연결 보존. 검사대상은Desktop root실행본.\n\n대상40파일 SHA256: '+str(out/'target-hashes.json')+'; 시작/종료 모두 통합결과.json 일치. root/UI main.ts는 통합백업과 비교해7행추가/1행교체.\n\n이QA 변경은 자기output와 본작업3/4/5기록뿐. 제품src/assets수정0, 기존서버재시작0, 커밋0, 푸시0. 독립프로필과 산출물은로컬보관. 산출물SHA256은 artifact-hashes.json.\n'
}
for name, content in entries.items():
    (records/name).write_text(content,encoding='utf-8')
manifest = [{'path':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in out.iterdir() if p.is_file() and p.name!='artifact-hashes.json']
(out/'artifact-hashes.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print('browser checks:',len(r['checks']),'unchanged hashes:',all(x['unchangedAfterQA'] for x in h))
