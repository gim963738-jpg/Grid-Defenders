"""Save only the requested Codex model defaults, preserving other settings."""
from pathlib import Path
from datetime import datetime
import json, re, shutil, tomllib

root=Path(__file__).resolve().parents[4]
record=Path(__file__).resolve().parent
config=Path('C:/Users/user/.codex/config.toml')
before=config.read_bytes() if config.exists() else b''
data=tomllib.loads(before.decode('utf-8-sig')) if before else {}
backup=config.with_name('config.toml.before-gd-sol-medium-'+datetime.now().strftime('%Y%m%d-%H%M%S')+'.bak')
if config.exists():shutil.copy2(config,backup)
text=before.decode('utf-8-sig')
top,sep,rest=text.partition('[')
for key,value in {'model':'gpt-6.1-sol','model_reasoning_effort':'medium'}.items():
 pattern=rf'(?m)^\s*{key}\s*=.*$'
 if re.search(pattern,top):top=re.sub(pattern,f'{key} = "{value}"',top)
 else:top=f'{key} = "{value}"\n'+top
new=top+sep+rest
parsed=tomllib.loads(new)
assert parsed['model']=='gpt-6.1-sol' and parsed['model_reasoning_effort']=='medium'
old_other={k:v for k,v in data.items() if k not in {'model','model_reasoning_effort'}}
assert {k:v for k,v in parsed.items() if k not in {'model','model_reasoning_effort'}}==old_other
config.write_text(new,encoding='utf-8')
check=tomllib.loads(config.read_text(encoding='utf-8'))
result={'at':datetime.now().astimezone().isoformat(),'path':str(config),'backup':str(backup),
        'before':{k:data.get(k) for k in ('model','model_reasoning_effort')},
        'after':{k:check.get(k) for k in ('model','model_reasoning_effort')},'otherValuesPreserved':True,
        'scope':'Codex configuration defaults; existing Orca session overrides are separate'}
(record/'저장검증.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(result,ensure_ascii=False))
