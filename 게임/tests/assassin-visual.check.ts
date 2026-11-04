import {MONSTERS,UNITS,type UnitKind} from '../src/defenseConfig';
import {battleResolution} from '../src/renderQuality';
import {Application,Assets,Texture,Rectangle} from 'pixi.js';
import {Defense} from '../src/defense';
import {createDefenseView} from '../src/defenseView';
import {loadHeroArt} from '../src/heroArt';
import {createAssassinAction} from '../src/assassinCombat';
/** Render actual wave sprites independently of the live player's battle. */
export async function renderAssassinSamples(allHeroes=false){
 await loadHeroArt();const app=new Application();await app.init({width:390,height:430,preference:'webgl',resolution:battleResolution(1),antialias:true});
 const g=new Defense();g.summon('assassin',0);g.summon('arcanist',1);g.summon('tank',4);const h=g.units[0],target=g.enemies[0];Object.assign(target,{x:170,y:28,hp:900,maxHp:1000,speed:0});
 const action=createAssassinAction('wave',{...h},h.id,[target.id],100,99,81,target);action.age=.68;action.impact={x:170,y:28};g.assassinActions=[action];g.assassinSkills.set(h.id,{casts:1,cooldown:3.4});
 const names=['heroes/ranged-idle.png','heroes/melee-idle.png','effects/fire-skill-sheet.png','effects/sword-basic-sheet.png','effects/blade-skill-sheet.png','battlefields/forest-clearing-v1.png'],t=await Promise.all(names.map(n=>Assets.load<Texture>('/assets/'+n)));
 const view=createDefenseView(app,g,()=>{},t[0],t[1],t[2],t[3],t[4],()=>true,{top:100,terrain:t[5]});
 const capture=async()=>{view.draw(null,false);app.render();return app.renderer.extract.base64({target:app.stage,frame:new Rectangle(0,0,390,430)});};
 const impact=await capture();action.age=.36;const cast=await capture();action.age=8.5*action.frameSeconds;const castStrike=await capture();
 action.kind='basic';action.age=5.5*action.frameSeconds;const basic=await capture();action.age=8.5*action.frameSeconds;const basicLater=await capture();
 g.assassinActions=[];const hits:string[]=[];for(const kind of [1,2,5] as const){g.assassinImpacts=[{x:170,y:28,kind,life:.15}];hits.push(await capture());}g.assassinImpacts=[];
 let roster='';if(allHeroes){g.units=(['assassin','tank','melee','ranged','arcanist','healer'] as UnitKind[]).map((kind,i)=>({id:50+i,kind,slot:[0,1,2,4,5,6][i],level:1,spent:0,cooldown:0}));g.enemies=[...MONSTERS,MONSTERS[0]].map((def,i)=>({...target,...def,id:100+i,x:55+i*55,y:28,hp:def.hp,maxHp:def.hp,bounty:i===5}));g.assassinActions=[];g.assassinSkills.clear();roster=await capture();}
 app.destroy(true,{children:true});return {impact,cast,castStrike,basic,basicLater,hit1:hits[0],hit2:hits[1],hit5:hits[2],roster};
}
