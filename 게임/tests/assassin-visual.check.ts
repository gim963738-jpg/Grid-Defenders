import {MONSTERS,UNITS,type UnitKind} from '../src/defenseConfig';
import {battleResolution} from '../src/renderQuality';
import {Application,Assets,Texture} from 'pixi.js';
import {Defense} from '../src/defense';
import {createDefenseView} from '../src/defenseView';
import {loadHeroArt} from '../src/heroArt';
import {createAssassinAction} from '../src/assassinCombat';
/** Render actual wave sprites independently of the live player's battle. */
export async function renderAssassinSamples(allHeroes=false){
 await loadHeroArt();const app=new Application();await app.init({width:390,height:430,preference:'webgl',resolution:battleResolution(1),antialias:true});
 const g=new Defense();g.summon('assassin',0);g.summon('arcanist',5);g.summon('tank',10);const h=g.units[0],target=g.enemies[0];Object.assign(target,{x:170,y:28,hp:900,maxHp:1000,speed:0});
 const action=createAssassinAction('wave',{...h},h.id,[target.id],100,99,81,target);action.age=.68;action.impact={x:170,y:28};g.assassinActions=[action];g.assassinSkills.set(h.id,{casts:1,cooldown:3.4});
 const names=['heroes/ranged-idle.png','heroes/melee-idle.png','effects/fire-skill-sheet.png','effects/sword-basic-sheet.png','effects/blade-skill-sheet.png','battlefields/forest-clearing-v1.png'],t=await Promise.all(names.map(n=>Assets.load<Texture>('/assets/'+n)));
 const view=createDefenseView(app,g,()=>{},t[0],t[1],t[2],t[3],t[4],()=>true,{top:100,terrain:t[5]});view.draw(null,false);app.render();const impact=await app.renderer.extract.base64({target:app.stage});
 action.age=.36;view.draw(null,false);app.render();const cast=await app.renderer.extract.base64({target:app.stage});action.kind='basic';action.age=6.5*action.frameSeconds;view.draw(null,false);app.render();const basic=await app.renderer.extract.base64({target:app.stage});let roster='';if(allHeroes){g.units=(['assassin','tank','melee','ranged','arcanist','healer'] as UnitKind[]).map((kind,i)=>({id:50+i,kind,slot:[0,1,2,4,5,6][i],level:1,spent:0,cooldown:0}));g.enemies=[...MONSTERS,MONSTERS[0]].map((def,i)=>({...target,...def,id:100+i,x:55+i*55,y:28,hp:def.hp,maxHp:def.hp,bounty:i===5}));g.assassinActions=[];g.assassinSkills.clear();view.draw(null,false);app.render();roster=await app.renderer.extract.base64({target:app.stage});}app.destroy(true,{children:true});return {impact,cast,basic,roster};
}
