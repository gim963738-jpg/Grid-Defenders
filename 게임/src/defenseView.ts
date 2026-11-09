import {smoothTexture} from './renderQuality';
import {skillFramePlacement} from './skillVisual';
import {heroFrame,assassinArt} from './heroArt';
import {ASSASSIN,assassinFrame,assassinBasicTrail} from './assassinCombat';
import type {UnitKind} from './defenseConfig';
import {BLADE_SKILL,bladeFrame,bladePlacement,BLADE_ALPHA_MATRIX} from './bladeSkill';
import {swordVisuals,SWORD_ALPHA_MATRIX} from './swordAttack';
import {FIRE_SKILL,fireFrame,firePlacement,FIRE_ALPHA_MATRIX} from './fireSkill';
import { Application, ColorMatrixFilter, Container, Graphics, Sprite, Texture, Text, Rectangle } from 'pixi.js';
import { Defense,enemyRadius } from './defense';
import { iceProjectileShape, iceBurstShape } from './iceEffects';
import {  RULES, SLOTS, UNITS } from './defenseConfig';

export function createDefenseView(app:Application,game:Defense,onSlot:(slot:number)=>void,rangedTexture:Texture,meleeTexture:Texture,fireTexture:Texture,swordTexture:Texture,bladeTexture:Texture,showDamageNumbers:()=>boolean=()=>true,scene?:{top:number;terrain?:Texture}) {
  const sceneTop=scene?.top??0;
  for(const texture of [rangedTexture,meleeTexture,...(scene?.terrain?[scene.terrain]:[])])smoothTexture(texture);
  if(scene?.terrain){
    const terrain=new Sprite(scene.terrain);terrain.eventMode='none';terrain.width=RULES.width;
    // Measured road centers in the supplied art align with local PATH y=28 and 302.
    terrain.height=(RULES.height+sceneTop)*1.113;terrain.y=-(RULES.height+sceneTop)*.03325;
    app.stage.addChild(terrain);
  }
  const root=new Container();root.y=sceneTop;app.stage.addChild(root);
  if(!scene)root.addChild(new Graphics().rect(0,0,RULES.width,RULES.height).fill(0x344c36));
  const slots=new Container();root.addChild(slots);
  const slotGraphics=SLOTS.map((p,index)=>{
    const slot=new Container();slot.position.set(p.x,p.y);
    const g=new Graphics();
    g.ellipse(0,7,21,10).fill({color:0xb5df8c,alpha:.14}).stroke({width:1,color:0xc9edb4,alpha:.65});
    slot.hitArea=new Rectangle(-25,-23,50,46);slot.eventMode='static';slot.cursor='pointer';slot.on('pointertap',()=>onSlot(index));slots.addChild(slot);
    const marker=new Graphics().circle(0,7,2).fill({color:0xe5f6b7,alpha:.85});slot.addChild(g,marker);
    return slot;
  });
  const selected=new Graphics();root.addChild(selected);
  selected.eventMode='none';
  const effects=new Graphics();effects.eventMode='none';root.addChild(effects);
  const movementPreview=new Graphics();movementPreview.eventMode='none';root.addChild(movementPreview);
  const assassinTrails=new Graphics();assassinTrails.eventMode='none';root.addChild(assassinTrails);
  const actors=new Graphics();root.addChild(actors);
  actors.eventMode='none';
  const heroSprites:Partial<Record<UnitKind,Sprite>>={ranged:new Sprite(rangedTexture),melee:new Sprite(meleeTexture)};
  for(const kind of ['melee','tank','healer','arcanist','assassin'] as const){const art=heroFrame(kind);if(art)heroSprites[kind]=new Sprite(art.texture);}
  for(const sprite of Object.values(heroSprites)){
    sprite.anchor.set(.5,1);sprite.eventMode='none';sprite.height=57;sprite.scale.x=sprite.scale.y;sprite.visible=false;root.addChild(sprite);
  }
  const iceEffects=new Graphics();iceEffects.eventMode='none';root.addChild(iceEffects);
  // Unclipped effect layer above actors, below labels; its bounds never use a placement slot.
  const assassinLayer=new Container();assassinLayer.eventMode='none';root.addChild(assassinLayer);
  const assassinSprites:Sprite[]=[];
  const badges=SLOTS.map(p=>{const t=new Text({text:'',style:{fontFamily:'system-ui',fontSize:10,fontWeight:'bold',fill:0xf5f4e7}});t.anchor.set(0.5);t.position.set(p.x,p.y+15);root.addChild(t);return t;});
  const skillBars=new Graphics();skillBars.eventMode='none';root.addChild(skillBars);
  const skillLabels=SLOTS.map(p=>{const text=new Text({text:'',style:{fontFamily:'system-ui',fontSize:7,fill:0xeafaff,stroke:{color:0x10282f,width:1}}});text.anchor.set(.5);text.position.set(p.x,p.y+28);text.eventMode='none';text.visible=false;root.addChild(text);return text;});
  const fireLayer=new Container();fireLayer.eventMode='none';root.addChild(fireLayer);
  const fireFilter=new ColorMatrixFilter();fireFilter.matrix=FIRE_ALPHA_MATRIX;fireLayer.filters=[fireFilter];
  const fireSprites:Sprite[]=[],fireTextures=new Map<string,Texture>();
  const swordLayer=new Container();swordLayer.eventMode='none';root.addChild(swordLayer);
  const swordFilter=new ColorMatrixFilter();swordFilter.matrix=SWORD_ALPHA_MATRIX;swordLayer.filters=[swordFilter];
  const swordSprites:Sprite[]=[],swordTextures=new Map<string,Texture>();
  const bladeLayer=new Container();bladeLayer.eventMode='none';root.addChild(bladeLayer);
  const bladeFilter=new ColorMatrixFilter();bladeFilter.matrix=BLADE_ALPHA_MATRIX;bladeLayer.filters=[bladeFilter];
  const bladeSprites:Sprite[]=[],bladeTextures=new Map<string,Texture>();
  const numberPool:Text[]=[];
  const enemyLabels:Text[]=[];
  return {
    // Authoring previews may attach visuals here, above actors and below labels.
    effectLayer:assassinLayer,
    draw(selectedId:number|null,pending:boolean,movement?:{id:number;slot:number}) {
      actors.clear();selected.clear();effects.clear();assassinTrails.clear();
      skillBars.clear();skillLabels.forEach(t=>t.visible=false);
      Object.values(heroSprites).forEach(sprite=>sprite.visible=false);iceEffects.clear();
      movementPreview.clear();
      const moving=game.units.find(u=>u.id===movement?.id);
      if(moving&&!UNITS[moving.kind].hero&&movement&&SLOTS[movement.slot]&&movement.slot!==moving.slot){
        const p=SLOTS[movement.slot],color=UNITS[moving.kind].color;
        movementPreview.ellipse(p.x,p.y+7,24,12).fill({color,alpha:.2}).stroke({width:2,color:0xc9efce,alpha:.9});
        movementPreview.roundRect(p.x-10,p.y-9,20,21,4).fill({color,alpha:0.45});
        movementPreview.circle(p.x,p.y-13,7).fill({color:0xe1c7a5,alpha:0.45});
      }
      for(const area of game.attackAreas) {
        if(area.kind==='circle')effects.circle(area.x,area.y,area.radius);
        else effects.moveTo(area.x,area.y).arc(area.x,area.y,area.radius,area.angle-area.halfAngle,area.angle+area.halfAngle).closePath();
        effects.fill({color:area.color,alpha:0.22*Math.min(1,area.life/0.12)}).stroke({width:2,color:area.color,alpha:Math.min(1,area.life/0.12)});
      }
      for(let i=0;i<SLOTS.length;i++) {
        const u=game.units.find(u=>u.slot===i),p=SLOTS[i];
        const available=pending&&!u;
        slotGraphics[i].children[0].visible=available;
        slotGraphics[i].children[1].visible=available;
        badges[i].text=u?`${UNITS[u.kind].hero?'영웅':`Lv.${u.level}`} ${UNITS[u.kind].icon}`:'';
        if(!u)continue;
        const skill=u.kind==='ranged'?game.rangedSkills.get(u.id):u.kind==='melee'?game.meleeSkills.get(u.id):u.kind==='assassin'?game.assassinSkills.get(u.id):undefined;
        if(skill&&skill.casts>0){
          const progress=Math.max(0,Math.min(1,1-skill.cooldown/(u.kind==='assassin'?ASSASSIN.waveCooldown:u.kind==='melee'?BLADE_SKILL.cooldown:FIRE_SKILL.cooldown)));
          skillBars.roundRect(p.x-23,p.y+24,46,8,3).fill(0x10232d).stroke({width:1,color:0x557783});
          if(progress>0)skillBars.roundRect(p.x-22,p.y+25,44*progress,6,2).fill(skill.cooldown>0?0x6ebee9:0x82dfa3);
          const text=skillLabels[i];text.visible=true;text.text=skill.cooldown>0?`${skill.cooldown.toFixed(1)}s`:'준비';
        }
        if(u.id===selectedId) {
          selected.circle(p.x,p.y,game.stats(u).range)
            .fill({color:UNITS[u.kind].color,alpha:UNITS[u.kind].hero?0.08:0.04})
            .stroke({width:2,color:UNITS[u.kind].color,alpha:UNITS[u.kind].hero?0.65:0.4});
          selected.ellipse(p.x,p.y+8,23,10).fill({color:0xf2d88a,alpha:.12}).stroke({width:2,color:0xffdc90,alpha:.9});
        }
        const color=UNITS[u.kind].color;
        actors.ellipse(p.x,p.y+7,15,5).fill({color:0x0a1713,alpha:0.5});
        if(heroSprites[u.kind]){
          const sprite=heroSprites[u.kind]!;sprite.visible=true;sprite.position.set(p.x,p.y+12);
          const action=game.assassinActions.find(a=>a.sourceId===u.id&&!a.cancelled&&(a.kind==='basic'||a.kind==='wave'&&assassinFrame(a)<=9));
          const motion=action?assassinArt(action.kind==='basic'?'basic':'wave',assassinFrame(action)):undefined;
          const art=motion??heroFrame(u.kind,u.cooldown>1/game.stats(u).rate-.2?'attack':'idle',Math.floor(game.elapsed*5));
          if(art){sprite.texture=art.texture;
            if(motion){const v=skillFramePlacement(motion,p.x,p.y+12,65);sprite.anchor.set(v.anchorX,v.anchorY);sprite.width=v.width;sprite.height=v.height;}
            else{sprite.height=57;sprite.scale.x=sprite.scale.y;sprite.anchor.set(.5,1);}
          }
          continue;
        }
        actors.roundRect(p.x-10,p.y-9,20,21,4).fill(color).stroke({width:2,color:0x172731});
        actors.circle(p.x,p.y-13,7).fill(0xe1c7a5).stroke({width:2,color:0x273943});
        if(u.kind==='archer')actors.moveTo(p.x+12,p.y-12).lineTo(p.x+17,p.y).lineTo(p.x+12,p.y+7).stroke({width:3,color:0xd2b47b});
        else if(u.kind==='mage'||u.kind==='healer') {
          actors.moveTo(p.x+13,p.y+9).lineTo(p.x+13,p.y-17).stroke({width:3,color:0xab8758});
          actors.circle(p.x+13,p.y-17,4).fill(color);
        } else actors.moveTo(p.x+12,p.y+3).lineTo(p.x+18,p.y-17).stroke({width:3,color:0xd9e4e6});
      }
      for(const action of game.assassinActions){
        const trail=assassinBasicTrail(action),source=game.units.find(u=>u.id===action.sourceId);if(!trail||!source)continue;
        const p=SLOTS[source.slot],cx=p.x+3,cy=p.y-18,shift=Math.sin(trail.phase*Math.PI)*5;
        const curve=()=>assassinTrails.moveTo(cx-24,cy+12).bezierCurveTo(cx+9,cy+25-shift,cx+trail.reach+8,cy+8,cx+trail.reach-5,cy-19);
        curve().stroke({width:7,color:0xd8214e,alpha:trail.alpha*.28,cap:'round'});
        curve().stroke({width:3,color:0xff3766,alpha:trail.alpha*.7,cap:'round'});
        curve().stroke({width:1.1,color:0xffd4db,alpha:trail.alpha,cap:'round'});
      }
      for(const [index,e] of game.enemies.entries()) {
        actors.ellipse(e.x,e.y+8,11,4).fill({color:0x142419,alpha:0.22});
        actors.ellipse(e.x,e.y+7,8,2.6).fill({color:0x0f1c16,alpha:0.25});
        const radius=enemyRadius(e),color=e.bounty?0xb87a30:e.defenseType==='physical'?0x518db2:e.defenseType==='magic'?0x9660b4:0xbc6560;
        actors.roundRect(e.x-radius,e.y-radius,radius*2,radius*2,radius*.55).fill(color).stroke({width:1.25,color:e.bounty||e.named?0xffdc73:0x394550});
        if(e.bounty)actors.moveTo(e.x-8,e.y-12).lineTo(e.x-8,e.y-18).lineTo(e.x-2,e.y-12).moveTo(e.x+8,e.y-12).lineTo(e.x+8,e.y-18).lineTo(e.x+2,e.y-12).stroke({width:3,color:0xffdc73});
        if(e.named)actors.moveTo(e.x-10,e.y-radius-1).lineTo(e.x-11,e.y-radius-7).lineTo(e.x-5,e.y-radius-4).lineTo(e.x,e.y-radius-10).lineTo(e.x+5,e.y-radius-4).lineTo(e.x+11,e.y-radius-7).lineTo(e.x+10,e.y-radius-1).closePath().fill(0xffdc73);
        actors.roundRect(e.x-radius+2,e.y-radius+2,radius*2-4,radius*.6,radius*.3).fill({color:0xffffff,alpha:.12});
        actors.ellipse(e.x-3.5,e.y-1.5,1.3,1.8).ellipse(e.x+3.5,e.y-1.5,1.3,1.8).fill(0xffdfac);
        actors.moveTo(e.x-2,e.y+3).quadraticCurveTo(e.x,e.y+4.4,e.x+2,e.y+3).stroke({width:.8,color:0x30252d,alpha:.8});
        const bar=radius+2;
        actors.roundRect(e.x-bar,e.y-radius-5,bar*2,3,1.2).fill(0x332c29);
        actors.roundRect(e.x-bar,e.y-radius-5,bar*2*Math.max(0,e.hp/e.maxHp),3,1.2).fill(0xe4a27c);
        if(!enemyLabels[index]){const t=new Text({style:{fontFamily:'system-ui',fontSize:8,fill:0xf3e5c2,stroke:{color:0x14201d,width:2}}});t.anchor.set(0.5);t.eventMode='none';root.addChild(t);enemyLabels.push(t);}
        const label=enemyLabels[index];label.visible=true;
        label.text=e.named?e.name:e.bounty?'현상금':e.defenseType==='physical'?'물방':e.defenseType==='magic'?'마방':'일반';
        label.style.fill=e.named||e.bounty?0xffdd8a:e.defenseType==='physical'?0xa6d9ff:e.defenseType==='magic'?0xdec0ff:0xf3e5c2;
        label.position.set(Math.max(label.width/2+2,Math.min(RULES.width-label.width/2-2,e.x)),e.y+radius+8);
      }
      for(let i=game.enemies.length;i<enemyLabels.length;i++)enemyLabels[i].visible=false;
      for(const s of game.shots)actors.moveTo(s.x,s.y).lineTo(s.tx,s.ty).stroke({width:2,color:s.color,alpha:Math.min(1,s.life/0.12)});
      for(const p of game.iceProjectiles){
        const shape=iceProjectileShape(p);
        iceEffects.moveTo(shape.trail[0],shape.trail[1]).lineTo(p.x,p.y).stroke({width:5,color:0x62baff,alpha:0.25});
        iceEffects.circle(p.x,p.y,10).fill({color:0x66ccff,alpha:0.14});
        iceEffects.poly(shape.crystal).fill(0x80dfff).stroke({width:1,color:0xe8fbff});
      }
      for(const b of game.iceBursts){
        const {radius,alpha,shards}=iceBurstShape(b);
        iceEffects.circle(b.x,b.y,radius).fill({color:0x87dcff,alpha:alpha*0.2}).stroke({width:2,color:0xb9efff,alpha});
        shards.forEach((points,i)=>iceEffects.poly(points).fill({color:i%2?0xd9faff:0x69c7ff,alpha}));
      }
      fireSprites.forEach(sprite=>sprite.visible=false);
      game.fireCasts.forEach((cast,i)=>{
        const frame=fireFrame(cast),placement=firePlacement(cast),key=`${frame.x}:${frame.y}:${frame.width}:${frame.height}`;
        let texture=fireTextures.get(key);
        if(!texture){texture=new Texture({source:fireTexture.source,frame:new Rectangle(frame.x,frame.y,frame.width,frame.height)});fireTextures.set(key,texture);}
        if(!fireSprites[i]){const sprite=new Sprite(texture);sprite.eventMode='none';fireSprites.push(sprite);fireLayer.addChild(sprite);}
        const sprite=fireSprites[i];sprite.texture=texture;sprite.visible=true;sprite.anchor.set(placement.anchorX,placement.anchorY);sprite.position.set(placement.x,placement.y);sprite.width=placement.width;sprite.height=placement.height;sprite.rotation=placement.rotation;
      });
      swordSprites.forEach(sprite=>sprite.visible=false);
      const swordFrames=game.swordAttacks.flatMap(swing=>{
        const source=game.units.find(u=>u.id===swing.sourceId);if(!source)return [];
        const pos=SLOTS[source.slot];return swordVisuals(swing,pos.x+7,pos.y-21);
      });
      swordFrames.forEach((v,i)=>{
        const f=v.frame,key=`${f.x}:${f.y}:${f.width}:${f.height}`;
        let texture=swordTextures.get(key);if(!texture){texture=new Texture({source:swordTexture.source,frame:new Rectangle(f.x,f.y,f.width,f.height)});swordTextures.set(key,texture);}
        if(!swordSprites[i]){const sprite=new Sprite(texture);sprite.eventMode='none';swordSprites.push(sprite);swordLayer.addChild(sprite);}
        const sprite=swordSprites[i];sprite.texture=texture;sprite.visible=true;sprite.anchor.set(.5);sprite.position.set(v.x,v.y);sprite.width=v.width;sprite.height=v.height;sprite.rotation=v.rotation;sprite.alpha=v.alpha;
      });
      bladeSprites.forEach(sprite=>sprite.visible=false);
      game.bladeCasts.forEach((cast,i)=>{
        const f=bladeFrame(cast),p=bladePlacement(cast),key=`${f.x}:${f.y}:${f.width}:${f.height}`;
        let texture=bladeTextures.get(key);if(!texture){texture=new Texture({source:bladeTexture.source,frame:new Rectangle(f.x,f.y,f.width,f.height)});bladeTextures.set(key,texture);}
        if(!bladeSprites[i]){const sprite=new Sprite(texture);sprite.eventMode='none';bladeSprites.push(sprite);bladeLayer.addChild(sprite);}
        const sprite=bladeSprites[i];sprite.texture=texture;sprite.visible=true;sprite.anchor.set(p.anchorX,p.anchorY);sprite.position.set(p.x,p.y);sprite.width=p.width;sprite.height=p.height;
      });
      assassinSprites.forEach(sprite=>sprite.visible=false);
      const assassinVisuals=game.assassinActions.filter(a=>!a.cancelled&&a.kind==='wave'&&assassinFrame(a)>=10).map(a=>({art:assassinArt('wave',assassinFrame(a)),x:a.impact?.x??game.enemies.find(e=>e.id===a.targets[0])?.x??a.origin.x,y:(a.impact?.y??game.enemies.find(e=>e.id===a.targets[0])?.y??a.origin.y)+10,height:90,alpha:1}));
      for(const impact of game.assassinImpacts)assassinVisuals.push({art:assassinArt('impact',impact.kind),x:impact.x,y:impact.y,height:48,alpha:Math.min(1,impact.life/.1)});
      assassinVisuals.forEach((v,i)=>{if(!v.art)return;if(!assassinSprites[i]){const sprite=new Sprite(v.art.texture);sprite.eventMode='none';assassinSprites.push(sprite);assassinLayer.addChild(sprite);}const sprite=assassinSprites[i],p=skillFramePlacement(v.art,v.x,v.y,v.height);sprite.texture=v.art.texture;sprite.visible=true;sprite.anchor.set(p.anchorX,p.anchorY);sprite.position.set(p.x,p.y);sprite.width=p.width;sprite.height=p.height;sprite.alpha=v.alpha;});
      for(let i=0;i<Math.max(numberPool.length,game.damageNumbers.length);i++){
        const number=game.damageNumbers[i];
        if(!number||!showDamageNumbers()){if(numberPool[i])numberPool[i].visible=false;continue;}
        if(!numberPool[i]){const t=new Text({style:{fontFamily:'system-ui',fontSize:14,fontWeight:'bold',fill:0xffffff,stroke:{color:0x15201c,width:3}}});t.anchor.set(0.5);t.eventMode='none';root.addChild(t);numberPool.push(t);}
        const t=numberPool[i],progress=1-number.life/0.75;t.visible=true;
        t.text=number.critical?`치명 ${number.damage}`:String(number.damage);
        t.style.fill=number.critical?0xffd15c:0xf4f5e8;t.style.fontSize=number.critical?18:14;
        t.alpha=Math.min(1,number.life/0.25);
        const y=number.y-20-progress*30-(number.id%3)*7;
        t.position.set(Math.max(t.width/2+3,Math.min(RULES.width-t.width/2-3,number.x+(number.id%5-2)*12)),Math.max(-sceneTop+12,Math.min(RULES.height-12,y)));
      }
    },
  };
}
