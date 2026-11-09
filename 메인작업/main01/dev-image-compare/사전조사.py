from pathlib import Path
import hashlib,json,subprocess
ROOT=Path('C:/Users/user/Desktop/Grid Defenders')
UI=Path('C:/Users/user/orca/workspaces/Grid Defenders/UI-전투화면')
HERE=Path(__file__).resolve().parent
exe='C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe'
p=subprocess.run([exe,'worktree','ps','--json'],capture_output=True,encoding='utf-8',check=True)
ps=json.loads(p.stdout[p.stdout.index('{'):])
row=next(w for w in ps['result']['worktrees'] if Path(w['path']).resolve()==UI.resolve())
checks=[]
for name in ['main.ts','landscape-entry.ts','devRangeDummy.ts','devRangeDummy.css','blondArt.ts']:
 a=ROOT/'게임/src'/name;b=UI/'게임/src'/name
 checks.append({'file':name,'rootExists':a.exists(),'uiExists':b.exists(),
                'same':a.exists() and b.exists() and a.read_bytes().replace(b'\r\n',b'\n')==b.read_bytes().replace(b'\r\n',b'\n'),
                'rootSha':hashlib.sha256(a.read_bytes()).hexdigest() if a.exists() else None})
result={'scope':'read_only_precheck','request':'게임 개발자 도구 이미지 대조 버튼',
        'liveServer':'http://127.0.0.1:5173','liveWorkspace':str(ROOT),'uiWorkspace':str(UI),
        'uiAgentStates':[{'state':a.get('state'),'paneKey':a.get('paneKey'),'observation':a.get('subagentObservation'),
                          'conversationName':a.get('conversationName'),'taskTitle':a.get('taskTitle'),
                          'prompt':a.get('prompt','')[:700],'toolName':a.get('toolName')} for a in row.get('agents',[])],
        'sourceComparison':checks,'implementation':'선택 방식 사용자 응답 대기; 제작 지시 미발송'}
(HERE/'사전조사.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(result,ensure_ascii=False,indent=2))
