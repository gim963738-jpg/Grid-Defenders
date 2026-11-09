from pathlib import Path
import shutil,hashlib,json
out=Path(__file__).resolve().parent;old=out.parent/'MAIN02-20261109-9009B97A-v007';root=out.parents[2]
for n in ['assets.js','layout.css']:shutil.copy2(old/n,out/n)
(out/'backgrounds').mkdir(exist_ok=True);shutil.copy2(old/'backgrounds/snow.png',out/'backgrounds/snow.png')
s=(old/'screens.js').read_text(encoding='utf-8-sig');s=s[:s.index('window.render=')]
(out/'base.js').write_text(s,encoding='utf-8')
(out/'concepts.html').write_text('<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="layout.css"><link rel="stylesheet" href="revision.css"><body><main id="stage"></main><script src="assets.js"></script><script src="base.js"></script><script src="revision.js"></script></body></html>',encoding='utf-8')
refs=[('게임/src/defenseConfig.ts','실제11아이템4레시피/5몬스터기본값;시안5x5와창고5x2는게임규격변경아님'),('게임/src/defense.ts','인접같은소유자/중복소모방지/모루1/결과공간선검증/원래선택영웅+가방계획'),('게임/src/landscape-inventory.ts','조합상대는실제recipeForTypes;인벤배치/commit조건'),('게임/src/landscape-entry.ts','기존drawConnections는정지인접쌍과focusPick도그림;이번최신정정held전용과차이가있어시안만정정/게임읽기전용'),('게임/src/defenseView.ts','네임드는색상+왕관기존표현'),('게임/src/slimeArt.ts','일반yellow/물방blue/마방red;네임드는슬라임스프라이트아님')]
(out/'추가참조읽기확인.json').write_text(json.dumps([dict(path=str(root/p),sha256=hashlib.sha256((root/p).read_bytes()).hexdigest(),applies=a)for p,a in refs],ensure_ascii=False,indent=2),encoding='utf-8')
print('Native UI source staged inside v008')
