from pathlib import Path
out=Path(__file__).resolve().parent
p=out/'check-layout.js';s=p.read_text(encoding='utf-8');s=s.replace("rect(get('.large-item')).w===224","Math.abs(rect(get('.large-item')).w-224)<.1");p.write_text(s,encoding='utf-8')
p=out/'revision.js';s=p.read_text(encoding='utf-8');s=s.replace("'<span class=\"prep-count\">病</span>'.replace('病','병력 6 / 20')","'<span class=\"prep-count\">병력 6 / 20</span>'").replace("<small class=\"enemy-sample\">出現</small>'.replace('出現','出現')","<small class=\"enemy-sample\">출현 몬스터 · 편성 표본</small>'").replace("if(state8===7)stage.querySelector('.enemy-sample').textContent='出現'.replace('出現','출현 몬스터 · 편성 표본');",'');p.write_text(s,encoding='utf-8')
