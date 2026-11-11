import {ReadyBossBattle as BossBattle} from './ready-boss-fixture';
import { Defense } from '../src/defense';
import {waveBossRoster} from '../src/bossBattle';
export function bossFixture():BossBattle{const g=new Defense();g.devDeploySoldiers();const battle=new BossBattle(waveBossRoster(g),()=>1);battle.autoSkills=false;return battle;}
