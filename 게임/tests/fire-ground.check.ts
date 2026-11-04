import {createFireCast,advanceFire,fireFrame,firePlacement} from '../src/fireSkill';
import {Defense,enemyRadius} from '../src/defense';
import {bossFixture} from './boss-fixture';
export function checkFireGround(){
 const passed:string[]=[];const check=(ok:boolean,name:string)=>{if(!ok)throw Error(name);passed.push(name);};
 const c=createFireCast({},1,75,0,0,10,20,14);advanceFire(c,.1,{x:10,y:20});
 check(c.stage==='pillar'&&c.x===10&&c.y===20,'projectile hits monster body center');
 advanceFire(c,.05,{x:80,y:90});check(c.tx===10&&c.ty===20,'magic circle locks immediately at landing');
 const p=firePlacement(c);check(p.x===10&&p.y===34,'ground visual starts at feet while damage center stays at body');
 advanceFire(c,.9,{x:150,y:200});check(c.tx===10&&c.ty===20,'peak flames remain at landing location');
 const pivots:[number,number,number][]=[[.1,625.5,544],[.91,1429.5,732.5],[.98,336,948],[1.54,1444,949]];
 const aligned=pivots.every(([age,x,y])=>{c.age=age;const f=fireFrame(c),p=firePlacement(c);const wx=p.x-p.width*p.anchorX+(x-f.x)*p.width/f.width,wy=p.y-p.height*p.anchorY+(y-f.y)*p.height/f.height;return Math.abs(wx-10)<1e-6&&Math.abs(wy-34)<1e-6;});
 check(aligned,'measured circle centers align across uneven frames and animation rows');
 check(pivots.every(([age])=>{c.age=age;const f=fireFrame(c),p=firePlacement(c);return p.width/f.width===.75&&p.height/f.height===.75;}),'ground frames keep a constant pixel scale');
 check(enemyRadius({named:false})===8&&enemyRadius({named:false,bounty:true})===12&&enemyRadius({named:true})===14,'ground offsets match regular bounty and named monster feet');
 const w=new Defense(()=>1);w.enemies[0].speed=0;w.waveSpawned=10;w.summon('ranged',0);w.units[0].cooldown=999;w.tick(.01);
 check(w.fireCasts[0].footOffset===8,'wave cast receives the rendered monster foot offset');
 const b=bossFixture(),h=b.hero()!,t=b.actors.find(a=>a.kind==='retainer')!;b.actors=[h,t];h.x=t.x-20;h.y=t.y;h.cooldown=999;t.cooldown=999;b.tripleSkill();
 check(b.fireCasts[0].footOffset===40.5,'boss retainer flame is based at its feet');
 b.reset();const h2=b.hero()!,boss=b.actors.find(a=>a.kind==='boss')!;b.actors=[h2,boss];h2.x=boss.x-20;h2.y=boss.y;b.tripleSkill();
 check(b.fireCasts[0].footOffset===55.6875,'large boss uses its own foot height');
 return passed;
}
