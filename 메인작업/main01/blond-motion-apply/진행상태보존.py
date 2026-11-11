from pathlib import Path
import subprocess,json,hashlib
H=Path(__file__).resolve().parent/'integration';H.mkdir(exist_ok=True)
if (H/'진행상태보존.json').exists():raise SystemExit('진행 상태 기록 존재. 중복 제어하지 않습니다.')
expression="""(async()=>{const p=document.querySelector('#pause');const before={url:location.href,wave:document.querySelector('#wave-number')?.textContent,paused:p?.getAttribute('aria-pressed')==='true',dialog:document.querySelector('#battle-resume-dialog')?.open===true};if(p&&!before.paused&&!before.dialog)p.click();await new Promise(r=>setTimeout(r,100));const checkpoints={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith('grid-defenders.battle-save.v1'))checkpoints[k]=localStorage.getItem(k);}return {before,after:{url:location.href,wave:document.querySelector('#wave-number')?.textContent,paused:p?.getAttribute('aria-pressed')==='true'},checkpoints};})()"""
cp=subprocess.run(['C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe','eval','--page','d64ea76c-f998-405c-ae0d-02f24ccdb499','--expression',expression,'--json'],capture_output=True,text=True,encoding='utf-8',errors='replace')
(H/'진행상태보존-영수증.json').write_text(cp.stdout,encoding='utf-8')
if cp.returncode:print(cp.stdout);raise SystemExit(cp.returncode)
data=json.loads(cp.stdout);assert data.get('ok');result=data['result']['result'];result=json.loads(result) if isinstance(result,str) else result
assert result['after']['paused'] or result['before']['dialog'],'게임 진행 정지 미확인'
assert result['checkpoints'],'진행 중인 체크포인트 없음: 확인 필요'
(H/'진행상태보존.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'before':result['before'],'after':result['after'],'checkpointCount':len(result['checkpoints']),'checkpointHashes':{k:hashlib.sha256(v.encode()).hexdigest() for k,v in result['checkpoints'].items()}},ensure_ascii=False))
