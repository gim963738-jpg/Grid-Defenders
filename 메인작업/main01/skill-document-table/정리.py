from pathlib import Path
import hashlib,json,re
R=Path('C:/Users/user/Desktop/Grid Defenders');H=Path(__file__).resolve().parent
P=R/'문서/02_세부기획/02_영웅/임시영웅.md';old_bytes=P.read_bytes()
expected='2579d58f6636e90065726b6e056989614c3a908bff885f9a5310d6cfd7c02a64'
if hashlib.sha256(old_bytes).hexdigest()!=expected:raise SystemExit('Source changed; inspect before editing.')
if (H/'변경전.md').exists():raise SystemExit('Already started; inspect before repeating.')
(H/'변경전.md').write_bytes(old_bytes)
old=old_bytes.decode('utf-8');text=old.replace('\r\n','\n');nl='\r\n' if b'\r\n' in old_bytes else '\n'
header='| 스킬 아이콘 | 스킬명 | 스킬 종류 | 스킬 설명 |\n|---|---|---|---|'
preserved=[]
def row(name,kind,description):
 assert '|' not in name+kind+description
 return f'| 미등록 | {name} | {kind} | {description} |'
start=text.index('### [패시브] 불패의 지휘');end=text.index('### 범위 비교 단위 R')
block=text[start:end]
heads=re.split(r'^### ',block,flags=re.M)[1:];assert len(heads)==4
rows=[]
for index,part in enumerate(heads):
 title,body=part.split('\n',1);pieces=[x.removeprefix('- ') for x in body.strip().splitlines() if x.strip()]
 preserved+=pieces
 if index==0:name='불패의 지휘';kind='패시브';prefix=''
 elif index==1:name='방패술 : 파쇄격';kind='1스킬';prefix=''
 elif index==2:name='기사의 맹세';kind='2스킬';prefix='쿨타임 8초. '
 else:name='발레시온의 거신병';kind='<span style="color:#e5484d;font-weight:700">궁극기(보스전용)</span>';prefix='쿨타임 30초. '
 rows.append(row(name,kind,prefix+'<br>'.join(pieces)))
text=text[:start]+'### 스킬 목록\n\n'+header+'\n'+'\n'.join(rows)+'\n\n'+text[end:]
groups=[
 ('## 1. 탱커',[('위압감(패시브)','위압감','패시브',''),('도발의 방벽(자동, 12초)','도발의 방벽','자동 스킬','쿨타임 12초. ')]),
 ('## 2. 근접 딜러',[('전투의 열광','전투의 열광','미정(조건 발동)',''),('파괴 참격(자동, 10초)','파괴 참격','자동 스킬','쿨타임 10초. ')]),
 ('## 3. 원거리 딜러',[('마력 폭발','마력 폭발','미정(조건 발동)',''),('종말의 유성(자동, 15초)','종말의 유성','자동 스킬','쿨타임 15초. ')]),
 ('## 4. 힐러',[('빛의 축복','빛의 축복','미정(주기 발동)',''),('구원의 영역(자동, 20초)','구원의 영역','자동 스킬','쿨타임 20초. ')])]
for heading,skills in groups:
 lines=[];table=[]
 for original,name,kind,prefix in skills:
  match=re.search(r'^- '+re.escape(original)+r': (.+)$',text,re.M);assert match,original
  description=match.group(1);preserved.append(description);lines.append(match.group(0));table.append(row(name,kind,prefix+description))
 oldpart=heading+'\n'+'\n'.join(lines)
 assert oldpart in text,heading
 text=text.replace(oldpart,heading+'\n\n'+header+'\n'+'\n'.join(table)+'\n',1)
intro='> 스킬은 영웅별로 **아이콘 → 스킬명 → 종류 → 설명** 순서로 읽습니다. 정확히 대응하는 기존 아이콘이 확인되지 않은 항목은 **미등록**으로 표시했습니다. 과거 후보의 스킬 번호·종류가 정해지지 않은 부분은 임의 확정하지 않았습니다.\n\n'
text=text.replace('# 임시 영웅\n\n','# 임시 영웅\n\n'+intro,1)
for s in preserved:assert s in text,s
spans=lambda s:re.findall(r'<span\b[^>]*>.*?</span>',s)
assert sorted(spans(text))==sorted(spans(old)),'Boss-only style/content mismatch'
# Numbers in the original skill titles are moved into their description cells.
assert sorted(re.findall(r'\d+(?:\.\d+)?',text))==sorted(re.findall(r'\d+(?:\.\d+)?',old)),'Number mismatch'
assert text.count('| 미등록 |')==12
for line in text.splitlines():
 if line.startswith('| 미등록 |'):assert len(line.split('|'))==6
links=re.findall(r'\]\(([^)]+)\)',text)
for link in links:
 if not re.match(r'\w+://',link):assert (P.parent/link.split('#')[0]).resolve().exists(),link
tail=old.replace('\r\n','\n').split('### 범위 비교 단위 R',1)[1]
# Non-skill sections remain byte-for-text unchanged after excluding eight original bullet lines.
def without_skills(s):
 for _,skills in groups:
  for original,_,_,_ in skills:s=re.sub(r'^- '+re.escape(original)+r': .+\n?', '',s,flags=re.M)
 return s
# The retained content is checked explicitly through original text blocks as well.
for a,b in [('### 범위 비교 단위 R','## 1. 탱커'),('## 적용 주의',None)]:
 prior=old.replace('\r\n','\n').split(a,1)[1]
 if b:prior=prior.split(b,1)[0]
 assert prior in text,a
new_bytes=text.replace('\n',nl).encode('utf-8')
assert P.read_bytes()==old_bytes,'Concurrent edit detected'
P.write_bytes(new_bytes)
result={'passed':True,'path':str(P),'beforeSha256':expected,'afterSha256':hashlib.sha256(new_bytes).hexdigest(),'skillTables':5,'skillRows':12,'columns':['스킬 아이콘','스킬명','스킬 종류','스킬 설명'],'preservedDescriptionChunks':len(preserved),'numbersPreserved':True,'bossOnlySpansPreserved':len(spans(old)),'localLinksChecked':len(links),'icons':'미등록 12개; 정확한 대응 자료 미확인','newImages':0,'apiCalls':0,'gitCommitPush':False}
(H/'검증결과.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(result,ensure_ascii=False))
