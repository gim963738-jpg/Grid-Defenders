export interface DamageSource {id:string;name:string;color:string;}
/** Tracks actual lost HP, independent of the developer log retention limit. */
export class DamageMeter {
  private entries=new Map<string,DamageSource&{damage:number}>();
  reset():void{this.entries.clear();}
  record(source:DamageSource,actualDamage:number):void {
    if(!Number.isFinite(actualDamage)||actualDamage<=0)return;
    const before=this.entries.get(source.id)?.damage??0;
    this.entries.set(source.id,{...source,damage:before+actualDamage});
  }
  snapshot(seconds:number){
    const elapsed=Math.max(0,seconds),total=Array.from(this.entries.values()).reduce((sum,e)=>sum+e.damage,0);
    const rows=Array.from(this.entries.values()).map(e=>({...e,dps:elapsed>0?e.damage/elapsed:0,share:total>0?e.damage/total:0})).sort((a,b)=>b.damage-a.damage||a.id.localeCompare(b.id));
    return {elapsed,total,dps:elapsed>0?total/elapsed:0,rows};
  }
}
