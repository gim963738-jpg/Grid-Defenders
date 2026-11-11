from pathlib import Path
import hashlib,importlib.util,json
R=Path('C:/Users/user/Desktop/Grid Defenders');S=R/'작업관리';H=Path(__file__).resolve().parent;V=H/'visual-spacing-v002';V.mkdir(exist_ok=True)
if (V/'연결.json').exists():raise SystemExit('기존 간격 수정 준비 기록이 있습니다.')
spec=importlib.util.spec_from_file_location('board',S/'도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(S)
q=json.loads((H/'qa/연결.json').read_text(encoding='utf-8'));Q=Path(q['output']);report=Q/'report.md'
if b.load(q['task'],'main01')['status']=='in_progress':b.record(q['task'],'main01','returned',report)
q.update(state='awaiting_visual_spacing_fix',workerOutcome='failed',report=str(report),finding='QA-VIS-01');(H/'qa/연결.json').write_text(json.dumps(q,ensure_ascii=False,indent=2),encoding='utf-8')
c=json.loads((H/'연결.json').read_text(encoding='utf-8'));O=Path(c['output']);checked=[]
for row in json.loads((H/'integration/현재반영해시.json').read_text(encoding='utf-8'))['files']:
 p=Path(row['path']);sha=hashlib.sha256(p.read_bytes()).hexdigest();assert sha==row['sha256'],str(p);checked.append(row)
(V/'입력버전.json').write_text(json.dumps({'source':'current_root_post_v001','files':checked},ensure_ascii=False,indent=2),encoding='utf-8')
proof=(H/'사용자승인.md').read_text(encoding='utf-8');pre='사용자는 각유닛비중첩/작은중첩시영웅상단을명시해진행승인했다. 독립QA D8C7563C는기술122PASS이나일반교전터틀몸통과병사·슬라임의과다중첩을QA-VIS-01/중간심각도로최종FAIL반환했다. main01이arena-crowd.png를직접열어같은문제를확인했다. 발원형간격정상과실제그림비중첩은다르며같은승인기능의보완이다. 새원화/크기축소/사거리·공격력변경없음. 현재root71경로SHA를대조하고gameplay가새독립output에서수정한후정확한패치만받아반영한다. QA원본/현재사용자플레이/타팀/공방/API/Git변경0.'
t=b.new('main01','gameplay','QA-VIS-01 터틀 몸통·다유닛 화면 간격 수정',proof);tid=t['id'];F=b.folder(tid);W=Path('C:/Users/user/orca/workspaces/Grid Defenders/게임개발');out=W/'output'/('blond-turtle-spacing_'+tid.lower()+'_v002')
prompt=f'''# {tid} / 차수1 / gameplay — 실제 화면 간격 QA-VIS-01 수정
원작업 {c['task']} / 독립QA {q['task']} FAIL. 사용자원승인 {H/'사용자승인.md'}의각유닛비중첩/영웅상단요구를충족시키는동일범위기술수정입니다. 새사용자허락을반복요구하지말고새필독/현재SHA·적용ACK/start후수정합니다.

반드시 {report} 및같은QA폴더의arena-crowd.png/arena-late.png·visual-result.json을실제로열어읽습니다. main01도arena-crowd.png를확인했습니다. 일반roster/암살자없음,전투elapsed9.5/16.5초에서터틀이병사·슬라임을크게가리고금발이목/몸통위에중첩됩니다. 발원형간격2worldPASS만으로합격하지않습니다. QA재현visual-check.mjs/시드·기본roster·시간과같은조건으로수정전후를비교합니다.

현재실제root {R/'게임'}의v001반영본을입력으로사용합니다. {V/'입력버전.json'}의현재71경로SHA를대조하고자기새 {out}/game 에서만수정합니다. 이전 {O/'game'}는구현후사본이라현재root와일치하는지확인한파일에한해복사재사용가능합니다. 원래처음baseline204나옛게임개발/게임으로되돌리지않습니다. node_modules/dist/프로필은복사하지말고기존의존성읽기전용재사용. root·UI·사용자현재게임·원화원본은직접편집하지않습니다.

수정목표:
- 터틀과아군병사/영웅·슬라임의 **실제로보이는몸통영역**이일반접근/교전에서과다중첩되지않게합니다. 발밑원형과시각몸통의계약을구분하고원본투명여백/무기/꼬리전체bbox를거대충돌반경으로쓰지않습니다.
- 권장검토는터틀의전투접촉점/앞발기준과뒤쪽큰몸통의표시기준을명확히분리해고정등록하는방법,몸통을고려한안전시작위치·접근/서기간격입니다. 어떤해결이든근거와메타를적습니다. 큰몸통이전투원점에서아군방향으로과도하게침범하는원인을해결하고프레임마다bbox정규화/PNG워핑/임의이동으로숨기지않습니다. 같은캐릭터의등록기준은동작사이에일관되게유지합니다.
- 금발본체72CSSpx와터틀180CSSpx기준/원본PNG12장·선택모션·타격570/1205ms·03/04/05첫7/새06·사거리100/기본공격력·공속·HP/난이도·3초준비·3색친위대수/속성은유지합니다. 크기를줄이거나사거리를늘려해결하지않습니다. 반경만키워근접아군이공격사거리안으로못들어가는해결도금지합니다.
- 같은편서기간격/접근대형·접촉점등구조적보정이필요하면최소로적용하되유한하고안정적이며진입·공격이가능해야합니다. 다유닛이공격못하고막힘/끊임없는위치튐/화면밖밀림/새롭고큰클리핑이생기지않게합니다. 터틀의큰몸통후방·전장경계와HUD/HP/이름의시각등록도확인합니다. scripted암살자돌진의기존경로와일시예외는보존합니다.
- 불가피한무기/작은외곽겹침은영웅상단표시로처리하고그상태만으로큰몸통중첩을통과시키지않습니다. 기존actor/HUD/effect층·웨이브배치고정은유지합니다. 새원화/파츠/자동이미지수정/유료호출은0입니다.

검증:
1. QA의동일기본roster/autoSkills=false/3초준비후elapsed9.5와16.5를포함한초기·접근·교전·후반전체800×360/명암스크린샷. 병사를시험에서빼거나검사장면·카메라·크기만바꿔통과시키지않습니다. 몸통범위·접촉점·실제근접공격거리도함께확인합니다.
2. 보스와3색슬라임/금발및일반병사가살아서접근·평타가능,100거리조건/모션타격1회·딜레이/3초준비·사망·저장복구·정지/배속·원본SHA유지. 같은좌표/경계·좁은범위다수/다른roster에서도안정분리·영웅상단·HUD읽기확인. 새로운시각등록기준은실제표시/피해점과모순없게문서화합니다.
3. 변경관련모델/브라우저/tsc/build검사. 기존1649/61기준과새실제간격검사를구분하고기존정상122기술항목의위험회귀를확인합니다. 테스트기대변경은계약근거를남기고검사삭제/가짜해시/겹침이미지숨김은없습니다.

허용은자기전용game의actorSpacing/bossBattle/View/combatMotionArt및꼭필요한연결·검사/문서입니다. 다른스킬/기획/아이템/UI전체/설정/공유규정수정은제외합니다. root기준전후SHA와정확한수정파일·patch·원본SHA·5종기록·재현/검증·화면/남은한계를새output에취합합니다. main01이검토후정확한파일만root에적용하고독립테스터에게재검증을연결합니다. 현재5173·사용자창/세이브조작0,검사는격리headless/127.0.0.1 port0후종료. Git/API/의존성설치0. 공식새Task/Dispatch worker_done으로main01 run_47ce1a81d7b1에실제outcome과원작업/차수·결과경로를반환합니다.
'''
(F/'요청확인.md').write_text(proof,encoding='utf-8');(F/'전문프롬프트.md').write_text(prompt,encoding='utf-8')
docs={'1_대화기록.md':proof+'\n\nQA 실제 최종 실패: '+str(report),'2_사전확인.md':pre,'3_작업일지.md':'122기술PASS/시각중첩1FAIL 최종보고·실제이미지확인 및 현재루트SHA대조후별도수정본준비.','4_정의문서.md':'고정크기/사거리/선택모션을유지하면서큰몸통의표시등록·서기/접근간격보완. 발원형간격과시각비중첩을구별.','5_버전관리.md':'현재배포v001·QA실패이력/원본보존. 새v002스테이징만수정,root정확한patch검토후반영. API/Git/사용자현재환경0.'}
for name,body in docs.items():
 v='# '+tid+' / 차수1\n\n'+body+'\n';(F/name).write_text(v,encoding='utf-8');(V/name).write_text(v,encoding='utf-8')
extras=[H/'사용자승인.md',report,V/'입력버전.json',H/'integration/반영검증.md',H/'integration/현재반영해시.json',S/'단일메인운영규정.md',S/'기준/characters/SD_72CSSpx_표시기준.md',R/'문서/00_개발규칙/스킬구현규약.md',S/'이미지2.6사용규칙.md',S/'저장운영규정.md']
b.set_readings(tid,'main01',[str(p) for p in extras]);b.confirm(tid,'main01','마지막 연결했던 기준으로 진행해줘',H/'사용자승인.md');plan=b.prepare(tid,'main01')
v={'task':tid,'parentTask':c['task'],'qaTask':q['task'],'iteration':1,'folder':str(F),'output':str(out),'plan':plan,'state':'prepared_not_sent','targetDispatch':'ctx_5e870394f936'}
(V/'연결.json').write_text(json.dumps(v,ensure_ascii=False,indent=2),encoding='utf-8')
c.update(state='root_applied_visual_spacing_fix_pending',knownIssue='QA-VIS-01',spacingFixTask=tid);(H/'연결.json').write_text(json.dumps(c,ensure_ascii=False,indent=2),encoding='utf-8')
EQ=R/'메인작업/main01/character-effect-workshop/qa-v003';e=json.loads((EQ/'연결.json').read_text(encoding='utf-8'));assert e['state']=='confirmed_waiting_for_qa_slot';e['plan']=b.prepare(e['task'],'main01');e['state']='prepared_not_sent';(EQ/'연결.json').write_text(json.dumps(e,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'gameplayTask':tid,'gameplayPrompt':plan['prompt'],'workshopQaTask':e['task'],'workshopQaPrompt':e['plan']['prompt']},ensure_ascii=False))
