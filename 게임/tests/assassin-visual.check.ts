import {Application,Assets,Texture} from 'pixi.js';
import {Defense} from '../src/defense';
import {createDefenseView} from '../src/defenseView';
import {loadHeroArt} from '../src/heroArt';
import {createAssassinAction} from '../src/assassinCombat';
/** Render actual wave sprites independently of the live player's battle. */
export async function renderAssassinSamples(){
 await loadHeroArt();const app=new Application();await app.init({width:390,height:430,preference:'webgl',antialias:true});
 const g=new Defense();g.summon('assassin',0);g.summon('arcanist',5);g.summon('tank',10);const h=g.units[0],target=g.enemies[0];Object.assign(target,{x:170,y:28,hp:900,maxHp:1000,speed:0});
 const action=createAssassinAction('wave',{...h},h.id,[target.id],100,99,81,target);action.age=.68;action.impact={x:170,y:28};g.assassinActions=[action];g.assassinSkills.set(h.id,{casts:1,cooldown:3.4});
 const names=['heroes/ranged-idle.png','heroes/melee-idle.png','effects/fire-skill-sheet.png','effects/sword-basic-sheet.png','effects/blade-skill-sheet.png','battlefields/forest-clearing-v1.png'],t=await Promise.all(names.map(n=>Assets.load<Texture>('/assets/'+n)));
 const view=createDefenseView(app,g,()=>{},t[0],t[1],t[2],t[3],t[4],()=>true,{top:100,terrain:t[5]});view.draw(null,false);app.render();const impact=await app.renderer.extract.base64({target:app.stage});
 action.age=.36;view.draw(null,false);app.render();const cast=await app.renderer.extract.base64({target:app.stage});app.destroy(true,{children:true});return {impact,cast};
}
