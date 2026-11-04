import {SWORD_SHEET_URL} from '../src/swordAttack';
import {Application,Assets,Texture} from 'pixi.js';
import {Defense} from '../src/defense';
import {createDefenseView} from '../src/defenseView';
import {createFireCast,FIRE_SHEET_URL} from '../src/fireSkill';
import {createBossBattleView} from '../src/bossBattleView';
import {BossBattle,waveBossRoster} from '../src/bossBattle';
/** Browser-only visual fixture; does not touch the running game's state. */
export async function showFireVisual(age=.98){
 const overlay=document.createElement('div');overlay.id='fire-visual-fixture';overlay.style.cssText='position:fixed;inset:0;z-index:99999;background:#101d20;overflow:auto;display:flex;flex-direction:column;align-items:center';
 const label=document.createElement('p');label.textContent='화염 스킬 · 윗길 몬스터 발밑 기준';label.style.color='#fff';overlay.append(label);document.body.append(overlay);
 const app=new Application();await app.init({width:390,height:330,background:'#172620',preference:'webgl',antialias:true});overlay.append(app.canvas);
 const game=new Defense();game.summon('ranged',9);game.enemies=[{...game.enemies[0],x:195,y:28,speed:0}];
 const cast=createFireCast({...game.units[0]},1,75,195,28,195,28);cast.stage='pillar';cast.age=age;cast.hits=2;game.fireCasts=[cast];
 const textures=await Promise.all(['ranged-idle.png','melee-idle.png'].map(name=>Assets.load<Texture>('/assets/heroes/'+name)));const sheet=await Assets.load<Texture>(FIRE_SHEET_URL);
 const sword=await Assets.load<Texture>(SWORD_SHEET_URL);
 const view=createDefenseView(app,game,()=>{},textures[0],textures[1],sheet,sword);view.draw(null,false);app.render();
 const root=document.createElement('div');root.style.cssText='position:relative;width:390px;height:220px;background:#344c36;margin-top:20px';overlay.append(root);const status=document.createElement('p');overlay.append(status);
 const b=new BossBattle(waveBossRoster(game));b.actors.forEach(a=>{a.x=a.side==='ally'?160:560;a.y=280;});const h=b.hero()!,t=b.actors.find(a=>a.side==='enemy')!;
 b.actors=[h,t];const fire=createFireCast({...h},t.id,h.attack,h.x,h.y,t.x,t.y,40.5);fire.stage='pillar';fire.age=age;fire.hits=2;b.fireCasts=[fire];createBossBattleView(root,status,b).draw();
 return {waveEffects:game.fireCasts.length,bossEffects:root.querySelectorAll('.boss-fire-skill').length};
}
