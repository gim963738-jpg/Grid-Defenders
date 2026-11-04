import {BLADE_SHEET_URL} from '../src/bladeSkill';
import {Application,Assets,Texture} from 'pixi.js';
import {Defense} from '../src/defense';
import {BossBattle,waveBossRoster} from '../src/bossBattle';
import {createDefenseView} from '../src/defenseView';
import {createBossBattleView} from '../src/bossBattleView';
import {createSwordAttack,SWORD_SHEET_URL} from '../src/swordAttack';
import {FIRE_SHEET_URL} from '../src/fireSkill';
/** Isolated browser fixture; the player's game state remains untouched. */
export async function showSwordVisual(sequence=0,animate=false){
 const overlay=document.createElement('div');overlay.id='sword-visual-fixture';overlay.style.cssText='position:fixed;inset:0;z-index:99999;background:#101d20;overflow:auto;display:flex;flex-direction:column;align-items:center';
 const label=document.createElement('p');label.textContent='검 영웅 · 검빛과 ⑤ → ④ → ③';label.style.color='#fff';overlay.append(label);document.body.append(overlay);
 const app=new Application();await app.init({width:390,height:330,background:'#172620',preference:'webgl',antialias:true});overlay.append(app.canvas);
 const game=new Defense();game.summon('melee',5);game.enemies=[{...game.enemies[0],x:245,y:137,speed:0}];
 const hero=game.units[0],swing=createSwordAttack(hero.id,game.enemies[0].id,90,false,sequence,1,245,137);swing.age=.29;swing.hit=true;swing.connected=true;game.swordAttacks=[swing];
 const textures=await Promise.all(['ranged-idle.png','melee-idle.png'].map(name=>Assets.load<Texture>('/assets/heroes/'+name)));const fire=await Assets.load<Texture>(FIRE_SHEET_URL),sword=await Assets.load<Texture>(SWORD_SHEET_URL);
 const blade=await Assets.load<Texture>(BLADE_SHEET_URL);
 const view=createDefenseView(app,game,()=>{},textures[0],textures[1],fire,sword,blade);view.draw(null,false);app.render();
 const root=document.createElement('div');root.style.cssText='position:relative;width:390px;height:220px;background:#344c36;margin-top:20px';overlay.append(root);const status=document.createElement('p');overlay.append(status);
 const b=new BossBattle(waveBossRoster(game)),h=b.actors.find(a=>a.kind==='melee')!,t=b.actors.find(a=>a.kind==='retainer')!;h.x=330;h.y=280;t.x=560;t.y=280;b.actors=[h,t];
 const bs=createSwordAttack(h.id,t.id,90,false,sequence,1,t.x,t.y);Object.assign(bs,{age:.29,hit:true,connected:true});b.swordAttacks=[bs];const bossView=createBossBattleView(root,status,b);bossView.draw();
 if(animate)app.ticker.add(ticker=>{swing.age=(swing.age+ticker.deltaMS/1000)%.8;bs.age=swing.age;swing.connected=bs.connected=swing.age>=.15;view.draw(null,false);bossView.draw();});
 return {wave:game.swordAttacks[0].kind,boss:root.querySelectorAll('.boss-sword-slash').length};
}
