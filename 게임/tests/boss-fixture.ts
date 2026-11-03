import { Defense } from '../src/defense';
import { BossBattle, waveBossRoster } from '../src/bossBattle';
export function bossFixture():BossBattle{const g=new Defense();g.devDeploySoldiers();return new BossBattle(waveBossRoster(g),()=>1);}
