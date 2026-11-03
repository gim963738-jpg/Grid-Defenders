export interface DamageSource {id:string;name:string;color:string;}
export class DamagePeaks {
  readonly units=new Map<string,number>();
  overall=0;
  reset():void{this.units.clear();this.overall=0;}
}
/** Tracks actual lost HP, independent of the developer log retention limit. */
export class DamageMeter {
  private entries=new Map<string,DamageSource&{damage:number}>();
  constructor(readonly peaks=new DamagePeaks()){}
  reset(gameReset=false):void{this.entries.clear();if(gameReset)this.peaks.reset();}
  record(source:DamageSource,actualDamage:number,seconds?:number):void {
    if(!Number.isFinite(actualDamage)||actualDamage<=0)return;
    const before=this.entries.get(source.id)?.damage??0;
    this.entries.set(source.id,{...source,damage:before+actualDamage});
    if(seconds!==undefined)this.snapshot(seconds);
  }
  snapshot(seconds:number){
    const elapsed=Math.max(0,seconds),total=Array.from(this.entries.values()).reduce((sum,e)=>sum+e.damage,0);
    const dps=elapsed>0?total/elapsed:0;
    this.peaks.overall=Math.max(this.peaks.overall,dps);
    const rows=Array.from(this.entries.values()).map(e=>{
      const dps=elapsed>0?e.damage/elapsed:0,peakDps=Math.max(this.peaks.units.get(e.id)??0,dps);
      this.peaks.units.set(e.id,peakDps);
      return {...e,dps,peakDps,share:total>0?e.damage/total:0};
    }).sort((a,b)=>b.damage-a.damage||a.id.localeCompare(b.id));
    return {elapsed,total,dps,peakDps:this.peaks.overall,rows};
  }
}
