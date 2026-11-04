import {Defense} from '../src/defense';
import {BossBattle,waveBossRoster} from '../src/bossBattle';
import {createBossBattleView} from '../src/bossBattleView';
export function checkBossHeroCards(){
 const passed:string[]=[];const check=(ok:boolean,name:string)=>{if(!ok)throw Error(name);passed.push(name);};
 const wave=new Defense();wave.summon('tank',0);wave.summon('melee',1);wave.summon('ranged',2);const battle=new BossBattle(waveBossRoster(wave));
 const root=document.createElement('div'),status=document.createElement('p');document.body.append(root,status);let paused=false;const view=createBossBattleView(root,status,battle,()=>true,()=>paused);view.draw();const cards=document.getElementById('boss-hero-skills')!;
 check(cards.querySelectorAll('[data-skill-hero]').length===3,'boss displays all three deployed heroes');
 check(cards.querySelectorAll('[data-basic-delay] strong').length===3,'every hero has a basic attack delay');
 check(cards.querySelectorAll('[data-hero-skill]').length===2&&cards.querySelectorAll('.boss-skill-empty').length===1,'assigned heroes get skill cards and tank keeps an empty slot');
 check(cards.querySelector('.boss-skill-empty')!.children.length===0,'unassigned skill slot has no fake label or cooldown');
 const melee=battle.actors.find(a=>a.kind==='melee')!,ranged=battle.hero()!,enemy=battle.actors.find(a=>a.side==='enemy')!;melee.x=enemy.x-20;melee.y=enemy.y;battle.useHeroSkill(melee.id);view.draw();
 const skill=cards.querySelector<HTMLButtonElement>(`[data-hero-skill="${melee.id}"]`)!;check(skill.disabled&&skill.dataset.skillState==='cooldown'&&skill.textContent!.includes('8.0'),'melee skill shows its own eight second cooldown');
 check(cards.querySelector(`[data-hero-skill="${ranged.id}"]`)!.textContent!.includes('접근'),'ranged skill cooldown is independent');
 battle.heroSkillCooldowns.set(melee.id,4);view.draw();check(skill.style.getPropertyValue('--skill-fill')==='50.00%','melee cooldown bar uses eight second duration');
 paused=true;view.draw();check(Array.from(cards.querySelectorAll<HTMLButtonElement>('[data-hero-skill]')).every(b=>b.disabled)&&document.querySelector<HTMLButtonElement>('#boss-commander-skill')!.disabled,'paused boss blocks hero and commander skill buttons');
 check(Array.from(cards.querySelectorAll('[data-basic-delay] strong')).every(n=>n.textContent==='일시정지'),'paused boss cards show paused status');paused=false;view.draw();
 melee.hp=0;view.draw();check(cards.querySelector(`[data-skill-hero="${melee.id}"] .boss-skill-hero-card`)!.classList.contains('hero-absent'),'fallen hero card is dimmed');
 const another=new Defense();another.summon('healer',0);battle.reset(waveBossRoster(another));view.draw();check(cards.querySelectorAll('[data-skill-hero]').length===1&&cards.querySelectorAll('.boss-skill-empty').length===1,'roster change replaces old cards and leaves healer skill blank');
 battle.reset([]);view.draw();check(!cards.querySelector('[data-basic-delay]')&&!cards.querySelector('[data-hero-skill]'),'empty roster shows no phantom hero skill cards');
 root.remove();status.remove();return passed;
}
