from pathlib import Path
import json
R=Path(__file__).parent;p=R/'generation-records.json';d=json.loads(p.read_text(encoding='utf-8'))
d['calls'].append(dict(id=3,input='edit-03-input.json',rawPath='C:/Users/user/.codex/generated_images/01a1bf68-4705-71f0-9449-07a1041b38d9/exec-9c114fce-460c-4b40-91c2-7f82a719e708.png',candidate='candidate-03-before-shield-length.png',status='completed',decision='Chosen peer head/body calibration; shield/body length still58%, restore shield length with inward overlap only'))
d['calls'].append(dict(id=4,input='edit-04-input.json',status='running'))
p.write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf-8')
