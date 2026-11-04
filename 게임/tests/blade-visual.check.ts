import {Application,Assets,Texture} from 'pixi.js';
import {Defense} from '../src/defense';
import {BossBattle,waveBossRoster} from '../src/bossBattle';
import {createDefenseView} from '../src/defenseView';
import {createBossBattleView} from '../src/bossBattleView';
import {BLADE_SHEET_URL,createBladeCast} from '../src/bladeSkill';
import {FIRE_SHEET_URL} from '../src/fireSkill';
import {SWORD_SHEET_URL} from '../src/swordAttack';
export async function showBladeVisual(){
 const overlay=document.createElement('div');overlay.id='blade-visual-fixture';overlay.style.cssText='position:fixed;inset:0;z-index:99999;background:#101d20;overflow:auto;display:flex;flex-direction:column;align-items:center';
 const label=document.createElement('p');label.textContent='검 영웅 · 범위 3연격';label.style.color='#fff';overlay.append(label);document.body.append(overlay);
 const game=new Defense();game.summon('melee',5);game.summon('ranged',9);game.summon('tank',1);game.enemies=[{...game.enemies[0],x:245,y:160,speed:0}];
 game.meleeSkills.set(game.units[0].id,{cooldown:2,casts:1});const cast=createBladeCast({...game.units[0]},1,90,245,160);cast.age=.98;game.bladeCasts=[cast];
 const app=new Application();await app.init({width:390,height:330,background:'#172620',preference:'webgl',antialias:true});overlay.append(app.canvas);
 const textures=await Promise.all(['ranged-idle.png','melee-idle.png'].map(n=>Assets.load<Texture>('/assets/heroes/'+n)));const fire=await Assets.load<Texture>(FIRE_SHEET_URL),sword=await Assets.load<Texture>(SWORD_SHEET_URL),blade=await Assets.load<Texture>(BLADE_SHEET_URL);
 createDefenseView(app,game,()=>{},textures[0],textures[1],fire,sword,blade).draw(null,false);app.render();
 const root=document.createElement('div');root.style.cssText='position:relative;width:390px;height:220px;background:#344c36;margin-top:15px';overlay.append(root);const status=document.createElement('p');overlay.append(status);
 const b=new BossBattle(waveBossRoster(game)),m=b.actors.find(a=>a.kind==='melee')!,r=b.hero()!,t=b.actors.find(a=>a.side==='enemy')!;m.x=380;m.y=280;r.x=300;r.y=330;t.x=560;t.y=280;
 const bs=createBladeCast({...m},t.id,m.attack,t.x,t.y,40.5);bs.age=.98;b.bladeCasts=[bs];b.heroSkillCooldowns.set(m.id,3);b.heroSkillCooldown=2;
 createBossBattleView(root,status,b).draw();const cards=document.getElementById('boss-hero-skills')!.cloneNode(true) as HTMLElement;cards.removeAttribute('id');cards.style.cssText='width:370px;margin-top:15px';overlay.append(cards);
 for(const child of Array.from(overlay.children))if(child instanceof HTMLElement)child.style.flexShrink='0';
 return {heroes:cards.querySelectorAll('[data-skill-hero]').length,skills:cards.querySelectorAll('[data-hero-skill]').length,empty:cards.querySelectorAll('.boss-skill-empty').length};
}
