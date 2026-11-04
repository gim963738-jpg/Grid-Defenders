import {loadHeroArt,heroFrame,heroPortrait,assassinArt,assassinSkillIcon,ASSASSIN_SHEET_URL} from '../src/heroArt';
import {Defense} from '../src/defense';
import {BossBattle,waveBossRoster} from '../src/bossBattle';
import {createBossBattleView} from '../src/bossBattleView';
export async function checkHeroArt(){
 const passed:string[]=[];const check=(ok:boolean,name:string)=>{if(!ok)throw Error(name);passed.push(name);};await loadHeroArt();
 const decode=async(url:string)=>{const image=new Image();image.src=url;await image.decode();return image;};
 const sheet=await decode(ASSASSIN_SHEET_URL);check(sheet.naturalWidth===1536&&sheet.naturalHeight===1024,'assassin uses replacement high-resolution source');
 for(const kind of ['tank','arcanist','assassin','healer'] as const){
  const frames=await Promise.all(['idle','walk','attack'].map((p,i)=>decode(heroFrame(kind,p as 'idle'|'walk'|'attack',i)!.url)));
  check(frames.every(f=>f.width===256&&f.height===180)&&heroPortrait(kind).includes('hero-roster-sheet.png'),kind+' uses aligned sprite poses and its own portrait row');
  const c=document.createElement('canvas');c.width=256;c.height=180;const ctx=c.getContext('2d')!;ctx.drawImage(frames[0],0,0);check(ctx.getImageData(1,1,1,1).data[3]===0&&Array.from(ctx.getImageData(0,0,256,180).data).filter((_,i)=>i%4===3).some(a=>a===255),kind+' has a transparent surrounding area and visible character pixels');
 }
 check(Array.from({length:12},(_,i)=>assassinArt('basic',i+1)).every(f=>f&&f.texture.width>115),'all twelve basic frames retain high-resolution cells');
 check(Array.from({length:16},(_,i)=>assassinArt('wave',i+1)).every(f=>f&&f.contentHeight===129&&f.texture.height===177),'all sixteen wave frames include transparent overflow padding without labels');
 check(assassinArt('wave',11)!.url===assassinArt('wave',12)!.url&&assassinArt('wave',16)!.url!==assassinArt('wave',15)!.url,'missing source label12 holds previous frame without discarding last source cell');
 check(Array.from({length:24},(_,i)=>assassinArt('boss',i+1)).every(f=>f&&f.texture.width>115),'all twenty-four boss frames use both source rows');
 check([1,2,5].every(i=>assassinArt('impact',i)!.texture.width>100),'three approved common hit effects are extracted');
 check(assassinSkillIcon('wave').includes('1330')&&assassinSkillIcon('boss').includes('1434'),'wave and boss use distinct supplied core icons');
 const g=new Defense();g.summon('assassin',0);g.summon('arcanist',1);g.summon('healer',2);const b=new BossBattle(waveBossRoster(g)),hero=b.actors.find(a=>a.kind==='assassin')!,target=b.actors.find(a=>a.kind==='boss')!;b.actors=[...b.actors.filter(a=>a.side==='ally'),target];hero.x=target.x-60;hero.y=target.y;b.autoSkills=false;b.useHeroSkill(hero.id);b.assassinActions[0].age=1.31;target.armorBreakRemaining=5;
 const root=document.createElement('div'),status=document.createElement('p');document.body.append(root,status);const view=createBossBattleView(root,status,b);view.draw();const cards=document.getElementById('boss-hero-skills')!;
 check(cards.querySelectorAll('[data-basic-delay]').length===3&&cards.querySelectorAll('[data-hero-skill]').length===1&&cards.querySelectorAll('.boss-skill-empty').length===2,'new heroes all show basic delay while unassigned skills remain empty');
 check(cards.querySelector('[data-hero-skill]')!.textContent!.includes('35% ×3 + 250%')&&cards.querySelector('[data-hero-skill]')!.textContent!.includes('5.0'),'assassin card shows four-hit damage and five-second cooldown');
 check(!!root.querySelector('.boss-fighter.assassin-motion .boss-assassin-frame image')&&root.querySelector('.boss-fighter.boss .boss-armor-break')?.hasAttribute('hidden')===false,'boss renders assassin source frame and broken shield above boss');
 check(root.querySelectorAll('.sheet-hero .boss-fighter-art img,.sheet-hero .boss-fighter-art .boss-assassin-frame').length===3,'all three new roster heroes render image art during boss battle');root.remove();status.remove();return passed;
}
