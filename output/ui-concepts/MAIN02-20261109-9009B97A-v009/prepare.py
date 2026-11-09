from pathlib import Path
import json,hashlib,datetime
out=Path('output/ui-concepts/MAIN02-20261109-9009B97A-v009').resolve();root=out.parents[2]
p=json.loads((out/'read-pack.json').read_text(encoding='utf-8-sig'))
applies=['800×360/48touch/原본읽기전용;이펙트작업없음','본문재독→차수ACK/start→제작→직접검수','차수9실제진행범위6PNG와5종기록;합격게임반영구분','main02공식회신;다른메인편집없음','직접제작;새AI/테스터생성없음','v009만편집;게임·아트·이전출력읽기전용','D3/모바일공통;정비정보위계재설계','현재iteration9 role ui18문서ACK/start','UI표시책임과팀경계유지','분류와실제조직구분;색인원본유지','새캐릭터스킬/밸런스원본창작없음','진행원문과정지정비/병사1영웅4/설명조회6상태범위','고정60대40/TFT전제폐기;상시핵심·요청상세/카드1개/버튼가림방지','v008장비3열54셀/5x5/held선/직접조합/도감/적정보및방향보완보존참조','본문14보조12값16/아이콘32~40·터치48;과거전투예외를이번축소근거로삼지않음','v1.2상태목록/초록완료구분/실제다음행동명시','이번진행명시승인만사용;같은허락재질문없음','필수기록·로컬산출만;커밋푸시백업없음']
assert p['iteration']==9 and len(p['documents'])==18
write=lambda n,x:(out/n).write_text(x if isinstance(x,str)else json.dumps(x,ensure_ascii=False,indent=2),encoding='utf-8')
write('읽기확인.json',dict(task=p['task'],iteration=9,role='ui',workSummary='정지정비정보UI6전체PNG/병사1영웅4아이콘·単一説明카드/10스탯+스킬/선택아이템정보와명시비교;닫기탭소환구매전투차단;v009만·이전게임읽기전용;직접이미지·상태·해시검수',documents=[dict(path=d['path'],sha256=d['sha256'],applies=a)for d,a in zip(p['documents'],applies)]))
write('2_사전확인.md','차수9사용자진행/정지정비정보판단전제. TFT60:40폐기. 신규v0096PNG및검증/갤러리/보고만. 기존게임·모든이전output·아트·규정·타메인읽기전용. 상시핵심수치/1·4아이콘과탭설명1카드/10능력치동시/아이템조회비교. 미정스킬은표본,신규효과수치정책창작없음. 닫기와뒤실행차단/held전용선계약/5x5·3열54셀검사. 필독18ACK/start통과뒤제작. 사전기록시각 '+datetime.datetime.now().isoformat())
b={}
for directory in [root/'게임/src',out.parent]:
 for f in directory.rglob('*'):
  if f.is_file()and out not in f.parents and not any(x.startswith('edge-profile')for x in f.parts):b[str(f)]=hashlib.sha256(f.read_bytes()).hexdigest()
write('보존기준해시.json',b)
print('ACK18 + baseline',len(b))
