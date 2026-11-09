from pathlib import Path
import json,hashlib,shutil
out=Path(__file__).resolve().parent;old=out.parent/'MAIN02-20261109-9009B97A-v004';root=out.parents[2]
supp=Path('C:/Users/user/Desktop/Grid Defenders/작업관리/메인작업/main02/maintenance-small-storage/추가지시.md')
ack=json.loads((old/'읽기확인.json').read_text(encoding='utf-8'));ack['workSummary']='원차수4 start를 유지하고 보충문서의 별도읽기확인 방식에 따라 전투/초기준비/4x2/5x2창고 추가비교를 분리제작.'
for d in ack['documents']:d['applies']='추가 정비분리 비교에도 원본보존·D3/모바일48px·자체검증과 사용자합격 구분 및 신규 maintenance 폴더만 편집 원칙 적용. '+d['applies']
ack['documents'].append(dict(path=str(supp),sha256=hashlib.sha256(supp.read_bytes()).hexdigest(),applies='기존차수4 확인을 덮어쓰지 않고 별도추가비교를 제작한다. 전투/정비분리와창고4x2·5x2는UI제안이며셀축소·게임진행규칙확정·새정식start대체호출을 하지 않는다.'))
(out/'보충읽기확인.json').write_text(json.dumps(ack,ensure_ascii=False,indent=2),encoding='utf-8');shutil.copy2(supp,out/'추가지시-근거.md')
if not (out/'2_사전확인.md').exists():(out/'2_사전확인.md').write_text('# 정비분리 추가 사전확인\n보충문서의현재차수4 start유지/별도읽기확인 조항을적용하며원ack불변. 신규maintenance출력에만전투/초기준비/4x2/5x2를제작한다. 셀56px·7칸이월장비의빈칸1대3 비교와상품/영웅인벤확대를제안한다. 초기자금·출현번째·창고게임로직·상점금지정책은미정으로유지. 원통합상점안보존.\n',encoding='utf-8')
for f in ['skins.css','layout.css']:shutil.copy2(old/f,out/f)
(out/'backgrounds').mkdir(exist_ok=True);shutil.copy2(old/'backgrounds/snow.png',out/'backgrounds/snow.png')
s=(old/'concepts.html').read_text(encoding='utf-8');s=s[:s.index('window.render=')]
s=s.replace('href="layout.css"','href="layout.css"><link rel="stylesheet" href="maintenance.css"')
(out/'concepts.html').write_text(s+(out/'maintenance.js').read_text(encoding='utf-8')+(out/'transfer.js').read_text(encoding='utf-8')+'</script></body></html>',encoding='utf-8')
print('supplement acknowledgement and separate maintenance source prepared')
