from pathlib import Path
import subprocess,json,zipfile,hashlib
P=Path(__file__).resolve().parent
cli=r'C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe'
page='e1e963b1-46f9-4608-b584-5757e5430392'
def run(*args):
 r=subprocess.run([cli,*args,'--json'],capture_output=True,encoding='utf-8');d=json.loads(r.stdout);assert d.get('ok'),d;return d['result']
run('goto','--page',page,'--url',(P/'preview.html').as_uri())
r=run('eval','--page',page,'--expression',"(async()=>{await battle.decode();return {protocol:location.protocol,hasPlayer:!!window.demo,canvasWidth:document.querySelector('canvas').width,backgroundLoaded:battle.naturalWidth>0}})()")
d=json.loads(r['result']);assert d['hasPlayer'] and d['protocol']=='file:' and d['canvasWidth']==992 and d['backgroundLoaded'],d
(P/'standalone-file-audit.json').write_text(json.dumps(d,indent=2),encoding='utf-8')
run('goto','--page',page,'--url','http://127.0.0.1:5198/preview.html')
(P/'기준보완제안.md').write_text('미확정 제안 / MAIN02-20261109-C970BE7A 차수2: 다각도 연격은 타격별 진행벡터·곡률·코어두께·스윕완료시각을 함께 기록하고, 무채색채널 기술검사와 사용자스타일 합격을 분리한다. 차수1의 유사사선/평평한리본 반려에 대응한 제안이며 활성 공통규정 변경이나 새 승인절차가 아니다.\n',encoding='utf-8')
with zipfile.ZipFile(P/'six-slash-alpha-source.zip','w',zipfile.ZIP_DEFLATED) as z:
 for f in (P/'frames').glob('*.png'):z.write(f,'frames/'+f.name)
 for name in ['preview.html','viewer-template.html','timeline.json','vfx-renderer.js','editable-plans.json','build.py','export.py','serve.py','qa.py','finalize.py','package.py','mobile-ui.css','battlefield-display.png','battlefield-source.png','v001-preservation.json','전문제작프롬프트.md','결과보고.md']:z.write(P/name,name)
with zipfile.ZipFile(P/'six-slash-alpha-source.zip') as z:
 assert z.testzip() is None
 count=len(z.namelist())
(P/'packaging-audit.json').write_text(json.dumps(dict(zipIntegrity='pass',zipFiles=count,alphaFrames=120),indent=2),encoding='utf-8')
manifest=[]
for p in sorted(P.rglob('*')):
 if p.is_file() and p.name!='manifest.json':manifest.append(dict(path=str(p.relative_to(P)),bytes=p.stat().st_size,sha256=hashlib.sha256(p.read_bytes()).hexdigest()))
(P/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print('V002 STANDALONE/ZIP VERIFIED',len(manifest),'files')
