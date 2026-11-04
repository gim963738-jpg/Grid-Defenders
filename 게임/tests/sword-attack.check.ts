import {createSwordAttack,advanceSword,swordAlive,swordImpactTime,swordVisuals,swordSlashFrame} from '../src/swordAttack';
import {Defense,pathPoint} from '../src/defense';
import {BossBattle,waveBossRoster} from '../src/bossBattle';
export function checkSwordAttack(){
 const passed:string[]=[];const check=(ok:boolean,name:string)=>{if(!ok)throw Error(name);passed.push(name);};
 check([0,1,2,3].map(i=>createSwordAttack(1,2,90,false,i,1,0,0).kind).join(',')==='5,4,3,5','basic swings cycle 5 then 4 then 3');
 const s=createSwordAttack(1,2,90,false,0,1,0,0);
 check(!advanceSword(s,.14,{x:40,y:50})&&!s.hit,'windup does not hit early');
 check(swordVisuals(s,10,20).some(v=>v.part==='glint')&&!swordVisuals(s,10,20).some(v=>v.part==='slash'),'sword glows before target slash');
 check(advanceSword(s,.01,{x:45,y:55})&&s.hit&&s.connected,'light peak triggers one impact');
 check(swordVisuals(s,10,20).some(v=>v.part==='slash'),'target slash starts at damage beat');
 check(!advanceSword(s,.1,{x:100,y:200})&&s.x===45&&s.y===55,'slash stays at impact position and never repeats damage');
 advanceSword(s,.3);check(!swordAlive(s)&&swordVisuals(s,10,20).length===0,'all visuals disappear after animation');
 const quick=createSwordAttack(1,2,90,false,0,4,0,0);check(quick.duration<.25&&swordImpactTime(quick)<swordImpactTime(s),'fast attack animation fits attack interval');
 const lost=createSwordAttack(1,2,90,false,0,1,0,0);check(!advanceSword(lost,.2)&&!lost.connected,'dead target before impact causes no ghost hit');
 check([3,4,5].every(kind=>swordSlashFrame(kind as 3|4|5,4).y>=720),'only selected lower three slash rows are used');
 const setup=()=>{const g=new Defense();const base=g.enemies[0];g.enemies=[{...base,id:100,distance:20,...pathPoint(20),speed:0,hp:5000,maxHp:5000,defenseType:'normal' as const}];g.waveSpawned=10;g.summon('melee',0);g.units[0].cooldown=0;g.meleeSkills.set(g.units[0].id,{cooldown:999,casts:0});return g;};
 const g=setup(),target=g.enemies[0],hero=g.units[0];g.tick(.01);check(target.hp===5000&&g.swordAttacks.length===1&&g.shots.length===0,'wave queues sword motion instead of instant hit or old beam');
 hero.cooldown=999;g.tick(.1);check(target.hp===5000,'wave waits for sword light peak');g.tick(.05);check(target.hp===4910,'wave peak deals exactly one base attack');
 for(let i=0;i<15;i++)g.tick(.05);check(target.hp===4910&&g.damageMeter.snapshot(g.elapsed).total===90,'ten slash frames do not multiply damage or DPS');
 const kinds=[5];for(let i=0;i<3;i++){hero.cooldown=0;g.tick(.01);kinds.push(g.swordAttacks[0].kind);hero.cooldown=999;for(let j=0;j<11;j++)g.tick(.05);}
 check(kinds.join(',')==='5,4,3,5','successive wave attacks use the approved sequence');
 g.units[0].cooldown=0;g.tick(.01);g.nextTestWave();check(g.swordAttacks.length===0,'wave change clears pending sword damage and effects');g.reset();check(g.swordSwingCounts.size===0,'game reset restarts swing sequence');
 const removed=setup();removed.tick(.01);removed.units=[];removed.tick(.2);check(removed.enemies[0].hp===5000&&removed.swordAttacks.length===0,'removed source cannot finish a sword strike');
 const wave=new Defense();wave.summon('melee',0);const b=new BossBattle(waveBossRoster(wave));const h=b.actors.find(a=>a.kind==='melee')!,t=b.actors.find(a=>a.kind==='retainer')!;b.actors=[h,t];h.x=t.x-20;h.y=t.y;h.cooldown=0;t.cooldown=999;t.defenseType='normal';const hp=t.hp;
 b.tick(.01);check(t.hp===hp&&b.swordAttacks[0].kind===5,'boss starts with the same windup and fifth slash');h.cooldown=999;for(let i=0;i<3;i++)b.tick(.05);check(hp-t.hp===h.attack&&b.hits.filter(hit=>hit.sword).length===1,'boss sword peak deals one physical attack');
 for(let i=0;i<12;i++)b.tick(.05);check(hp-t.hp===h.attack,'boss slash animation causes no extra hits');
 const final=createSwordAttack(h.id,t.id,90,false,0,1,t.x,t.y);final.connected=true;final.hit=true;final.age=.15;b.swordAttacks=[final];b.result='victory';const combatTime=b.elapsed,finalHp=t.hp;
 for(let i=0;i<10;i++)b.tick(.05);check(b.swordAttacks.length===0&&b.elapsed===combatTime&&t.hp===finalHp,'victory finishes the flash without extra combat time or damage');
 b.reset();check(b.swordAttacks.length===0&&b.swordSwingCounts.size===0,'boss restart clears motion and sequence');
 return passed;
}
