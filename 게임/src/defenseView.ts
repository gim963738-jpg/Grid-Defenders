import { Application, Container, Graphics, Text } from 'pixi.js';
import { Defense } from './defense';
import { RULES, SLOTS, UNITS } from './defenseConfig';

export function createDefenseView(app:Application,game:Defense,onSlot:(slot:number)=>void) {
  const root=new Container();app.stage.addChild(root);
  const field=new Graphics();root.addChild(field);
  field.roundRect(4,4,382,322,18).fill(0x101d20).stroke({width:2,color:0x52614a});
  field.roundRect(13,13,364,304,15).fill(0x8c7751);
  field.roundRect(45,45,300,240,12).fill(0x344c36).stroke({width:3,color:0x504831});
  field.roundRect(50,50,290,230,10).fill(0x3d583d);
  for(let i=0;i<100;i++)field.rect(54+(i*83%280),54+(i*47%220),2,3).fill(i%2?0x4c6745:0x304c37);
  for(let i=0;i<46;i++) {
    const x=19+(i*79%350),y=18+(i*43%294);
    if(x<43||x>346||y<43||y>286)field.rect(x,y,3,2).fill(0xa99167);
  }
  const slots=new Container();root.addChild(slots);
  const slotGraphics=SLOTS.map((p,index)=>{
    const slot=new Container();slot.position.set(p.x,p.y);
    const g=new Graphics();
    g.roundRect(-25,-23,50,46,6).fill({color:0x20382d,alpha:0.7}).stroke({width:1,color:0x63805b,alpha:0.65});
    slot.eventMode='static';slot.cursor='pointer';slot.on('pointertap',()=>onSlot(index));slots.addChild(slot);
    const t=new Text({text:'+',style:{fontFamily:'system-ui',fontSize:17,fill:0x739072}});t.anchor.set(0.5);slot.addChild(g,t);
    return slot;
  });
  const selected=new Graphics();root.addChild(selected);
  selected.eventMode='none';
  const effects=new Graphics();effects.eventMode='none';root.addChild(effects);
  const movementPreview=new Graphics();movementPreview.eventMode='none';root.addChild(movementPreview);
  const actors=new Graphics();root.addChild(actors);
  actors.eventMode='none';
  const badges=SLOTS.map(p=>{const t=new Text({text:'',style:{fontFamily:'system-ui',fontSize:10,fontWeight:'bold',fill:0xf5f4e7}});t.anchor.set(0.5);t.position.set(p.x,p.y+15);root.addChild(t);return t;});
  const caption=new Text({text:'순환 디펜스 · 전투 시험',style:{fontFamily:'system-ui',fontSize:10,fill:0xdacdb1}});caption.position.set(13,RULES.height-17);root.addChild(caption);
  const numberPool:Text[]=[];
  const enemyLabels:Text[]=[];
  return {
    draw(selectedId:number|null,pending:boolean,movement?:{id:number;slot:number}) {
      actors.clear();selected.clear();effects.clear();
      movementPreview.clear();
      const moving=game.units.find(u=>u.id===movement?.id);
      if(moving&&!UNITS[moving.kind].hero&&movement&&SLOTS[movement.slot]&&movement.slot!==moving.slot){
        const p=SLOTS[movement.slot],color=UNITS[moving.kind].color;
        movementPreview.roundRect(p.x-25,p.y-23,50,46,6).fill({color,alpha:0.25}).stroke({width:2,color:0xc9efce,alpha:0.9});
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
        slotGraphics[i].children[1].visible=!u;
        badges[i].text=u?`${UNITS[u.kind].hero?'영웅':`Lv.${u.level}`} ${UNITS[u.kind].icon}`:'';
        if(pending&&!u)selected.roundRect(p.x-25,p.y-23,50,46,6).stroke({width:1,color:0xf3c76c,alpha:0.8});
        if(!u)continue;
        if(u.id===selectedId) {
          selected.circle(p.x,p.y,game.stats(u).range)
            .fill({color:UNITS[u.kind].color,alpha:UNITS[u.kind].hero?0.16:0.07})
            .stroke({width:2,color:UNITS[u.kind].color,alpha:UNITS[u.kind].hero?0.95:0.5});
          selected.roundRect(p.x-26,p.y-24,52,48,7).stroke({width:2,color:0xffd27b});
        }
        const color=UNITS[u.kind].color;
        actors.ellipse(p.x,p.y+7,15,5).fill({color:0x0a1713,alpha:0.5});
        actors.roundRect(p.x-10,p.y-9,20,21,4).fill(color).stroke({width:2,color:0x172731});
        actors.circle(p.x,p.y-13,7).fill(0xe1c7a5).stroke({width:2,color:0x273943});
        if(u.kind==='archer'||u.kind==='ranged')actors.moveTo(p.x+12,p.y-12).lineTo(p.x+17,p.y).lineTo(p.x+12,p.y+7).stroke({width:3,color:0xd2b47b});
        else if(u.kind==='mage'||u.kind==='healer') {
          actors.moveTo(p.x+13,p.y+9).lineTo(p.x+13,p.y-17).stroke({width:3,color:0xab8758});
          actors.circle(p.x+13,p.y-17,4).fill(color);
        } else actors.moveTo(p.x+12,p.y+3).lineTo(p.x+18,p.y-17).stroke({width:3,color:0xd9e4e6});
      }
      for(const [index,e] of game.enemies.entries()) {
        actors.ellipse(e.x,e.y+7,10,4).fill({color:0x1d261d,alpha:0.4});
        const radius=e.named?14:e.bounty?12:8,color=e.bounty?0xb87a30:e.defenseType==='physical'?0x518db2:e.defenseType==='magic'?0x9660b4:0xbc6560;
        actors.roundRect(e.x-radius,e.y-radius,radius*2,radius*2,5).fill(color).stroke({width:2,color:e.bounty||e.named?0xffdc73:0x394550});
        if(e.bounty)actors.moveTo(e.x-8,e.y-12).lineTo(e.x-8,e.y-18).lineTo(e.x-2,e.y-12).moveTo(e.x+8,e.y-12).lineTo(e.x+8,e.y-18).lineTo(e.x+2,e.y-12).stroke({width:3,color:0xffdc73});
        if(e.named)actors.moveTo(e.x-10,e.y-radius-1).lineTo(e.x-11,e.y-radius-7).lineTo(e.x-5,e.y-radius-4).lineTo(e.x,e.y-radius-10).lineTo(e.x+5,e.y-radius-4).lineTo(e.x+11,e.y-radius-7).lineTo(e.x+10,e.y-radius-1).closePath().fill(0xffdc73);
        actors.rect(e.x-4,e.y-3,2,3).fill(0xffdb9c).rect(e.x+3,e.y-3,2,3).fill(0xffdb9c);
        const bar=radius+2;
        actors.rect(e.x-bar,e.y-radius-5,bar*2,3).fill(0x332c29);
        actors.rect(e.x-bar,e.y-radius-5,bar*2*Math.max(0,e.hp/e.maxHp),3).fill(0xe4a27c);
        if(!enemyLabels[index]){const t=new Text({style:{fontFamily:'system-ui',fontSize:8,fill:0xf3e5c2,stroke:{color:0x14201d,width:2}}});t.anchor.set(0.5);t.eventMode='none';root.addChild(t);enemyLabels.push(t);}
        const label=enemyLabels[index];label.visible=true;
        label.text=e.named?e.name:e.bounty?'현상금':e.defenseType==='physical'?'물방':e.defenseType==='magic'?'마방':'일반';
        label.style.fill=e.named||e.bounty?0xffdd8a:e.defenseType==='physical'?0xa6d9ff:e.defenseType==='magic'?0xdec0ff:0xf3e5c2;
        label.position.set(Math.max(label.width/2+2,Math.min(RULES.width-label.width/2-2,e.x)),e.y+radius+8);
      }
      for(let i=game.enemies.length;i<enemyLabels.length;i++)enemyLabels[i].visible=false;
      for(const s of game.shots)actors.moveTo(s.x,s.y).lineTo(s.tx,s.ty).stroke({width:2,color:s.color,alpha:Math.min(1,s.life/0.12)});
      for(let i=0;i<Math.max(numberPool.length,game.damageNumbers.length);i++){
        const number=game.damageNumbers[i];
        if(!number){numberPool[i].visible=false;continue;}
        if(!numberPool[i]){const t=new Text({style:{fontFamily:'system-ui',fontSize:14,fontWeight:'bold',fill:0xffffff,stroke:{color:0x15201c,width:3}}});t.anchor.set(0.5);t.eventMode='none';root.addChild(t);numberPool.push(t);}
        const t=numberPool[i],progress=1-number.life/0.75;t.visible=true;
        t.text=number.critical?`치명 ${number.damage}`:String(number.damage);
        t.style.fill=number.critical?0xffd15c:0xf4f5e8;t.style.fontSize=number.critical?18:14;
        t.alpha=Math.min(1,number.life/0.25);
        const y=number.y<65?number.y+22+progress*30+(number.id%3)*7:number.y-20-progress*30-(number.id%3)*7;
        t.position.set(Math.max(t.width/2+3,Math.min(RULES.width-t.width/2-3,number.x+(number.id%5-2)*12)),Math.max(12,Math.min(RULES.height-12,y)));
      }
    },
  };
}
