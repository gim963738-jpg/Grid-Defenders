import {ReadyBossBattle as BossBattle} from './ready-boss-fixture';
import {Application,Assets,Texture,Text} from 'pixi.js';
import {Defense} from '../src/defense';
import {waveBossRoster} from '../src/bossBattle';
import {createDefenseView} from '../src/defenseView';
import {createBossBattleView} from '../src/bossBattleView';
export async function checkDamageVisibility(){
 const passed:string[]=[];const check=(ok:boolean,name:string)=>{if(!ok)throw Error(name);passed.push(name);};let visible=false;
 const app=new Application();await app.init({width:390,height:330,preference:'webgl'});
 const textures=await Promise.all(['heroes/ranged-idle.png','heroes/melee-idle.png','effects/fire-skill-sheet.png','effects/sword-basic-sheet.png','effects/blade-skill-sheet.png'].map(name=>Assets.load<Texture>('/assets/'+name)));
 const wave=new Defense(()=>1);wave.damageNumbers=[{id:1,x:100,y:100,damage:123,critical:false,life:.75}];
 const view=createDefenseView(app,wave,()=>{},textures[0],textures[1],textures[2],textures[3],textures[4],()=>visible);
 const count=()=>app.stage.children[0].children.filter(c=>c instanceof Text&&c.text==='123'&&c.visible).length;
 view.draw(null,false);check(count()===0,'wave OFF hides damage numbers before pool creation');
 visible=true;view.draw(null,false);check(count()===1,'wave ON displays damage number');visible=false;view.draw(null,false);check(count()===0,'wave OFF hides an existing damage number');
 visible=true;view.draw(null,false);check(count()===1&&wave.damageNumbers.length===1,'wave ON restores current number without changing model data');
 const roster=new Defense(()=>1);roster.summon('ranged',0);const boss=new BossBattle(waveBossRoster(roster),()=>1),hero=boss.hero()!,target=boss.actors.find(a=>a.side==='enemy')!;
 boss.hits=[{from:hero.id,to:target.id,x:target.x,y:target.y,damage:123,magic:true,life:.32}];
 const root=document.createElement('div'),status=document.createElement('p');document.body.append(root,status);const bossView=createBossBattleView(root,status,boss,()=>visible);
 bossView.draw();check(root.querySelectorAll('.boss-damage-number').length===1,'boss ON displays damage text');visible=false;bossView.draw();check(root.querySelectorAll('.boss-damage-number').length===0&&root.querySelector('circle')!==null,'boss OFF hides only damage text and keeps impact effects');
 visible=true;bossView.draw();check(root.querySelectorAll('.boss-damage-number').length===1&&boss.hits.length===1,'boss ON restores text without changing hit data');
 root.remove();status.remove();app.destroy(true,{children:true});return passed;
}
