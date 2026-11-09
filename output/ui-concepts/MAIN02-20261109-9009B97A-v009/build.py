from pathlib import Path
import shutil,hashlib,json,datetime
out=Path(__file__).resolve().parent;old=out.parent/'MAIN02-20261109-9009B97A-v008';root=out.parents[2]
for n in ['assets.js','base.js','layout.css','revision.css']:shutil.copy2(old/n,out/n)
(out/'backgrounds').mkdir(exist_ok=True);shutil.copy2(old/'backgrounds/snow.png',out/'backgrounds/snow.png')
s=(old/'revision.js').read_text(encoding='utf-8');s=s[:s.index('window.render=')];(out/'flow.js').write_text(s,encoding='utf-8')
(out/'concepts.html').write_text('<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="layout.css"><link rel="stylesheet" href="revision.css"><link rel="stylesheet" href="information.css"><body><main id="stage"></main><script src="assets.js"></script><script src="base.js"></script><script src="flow.js"></script><script src="information.js"></script></body></html>',encoding='utf-8')
refs=[('게임/src/defenseConfig.ts','단위별기본수치/11아이템4레시피;새수치스킬창작없음'),('게임/src/bossBattle.ts','ranged화염기둥실제보스스킬과대상·발동조건;정비조회는발동아님'),('게임/src/fireSkill.ts','cooldown4/radius48/배율1/hits3;추적은비행단계·착지후중심고정'),('게임/src/bossSkillIcons.ts','ranged실제스킬아이콘fire-sheet crop37,369,198,198 재사용'),('게임/src/defense.ts','기존동일소유/변인접/모루1/결과공간선검사참조;별도조합창없음')]
(out/'추가참조읽기확인.json').write_text(json.dumps([dict(path=str(root/p),sha256=hashlib.sha256((root/p).read_bytes()).hexdigest(),applies=a)for p,a in refs],ensure_ascii=False,indent=2),encoding='utf-8')
(out/'제작착수시각.json').write_text(json.dumps(dict(iteration=9,startedAt=datetime.datetime.now().isoformat(),afterStartReceipt=True),indent=2),encoding='utf-8')
