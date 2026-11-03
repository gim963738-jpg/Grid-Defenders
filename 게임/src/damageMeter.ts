export interface DamageSource {id:string;name:string;color:string;}
export class DamagePeaks {
  readonly units=new Map<string,number>();
  overall=0;
  reset():void{this.units.clear();this.overall=0;}
}
/** Tracks actual lost HP, independent of the developer log retention limit. */
export class DamageMeter {
  private entries=new Map<string,DamageSource&{damage:number}>();
  private recent:{time:number;id:string;damage:number}[]=[];
  private recentTotals=new Map<string,number>();
  private recentTotal=0;
  private clock=0;
  constructor(readonly peaks=new DamagePeaks()){}
  private advance(seconds:number):void {
    this.clock=Math.max(this.clock,Number.isFinite(seconds)?Math.max(0,seconds):0);
    this.recent=this.recent.filter(hit=>{
      if(hit.time>this.clock-1+1e-8)return true;
      this.recentTotal=Math.max(0,this.recentTotal-hit.damage);
      const total=(this.recentTotals.get(hit.id)??0)-hit.damage;
      if(total>1e-8)this.recentTotals.set(hit.id,total);else this.recentTotals.delete(hit.id);
      return false;
    });
  }
  reset(gameReset=false):void {
    this.entries.clear();this.recent=[];this.recentTotals.clear();this.recentTotal=0;this.clock=0;
    if(gameReset)this.peaks.reset();
  }
  record(source:DamageSource,actualDamage:number,seconds?:number):void {
    if(!Number.isFinite(actualDamage)||actualDamage<=0)return;
    const before=this.entries.get(source.id)?.damage??0;
    this.entries.set(source.id,{...source,damage:before+actualDamage});
    this.advance(seconds??this.clock);
    this.recent.push({time:this.clock,id:source.id,damage:actualDamage});
    const rolling=(this.recentTotals.get(source.id)??0)+actualDamage;
    this.recentTotals.set(source.id,rolling);this.recentTotal+=actualDamage;
    // Fixed one-second denominator, including the opening partial second.
    this.peaks.units.set(source.id,Math.max(this.peaks.units.get(source.id)??0,rolling));
    this.peaks.overall=Math.max(this.peaks.overall,this.recentTotal);
  }
  snapshot(seconds:number){
    this.advance(seconds);
    const elapsed=Number.isFinite(seconds)?Math.max(0,seconds):0,total=Array.from(this.entries.values()).reduce((sum,e)=>sum+e.damage,0);
    const divisor=Math.max(1,elapsed),dps=elapsed>0?total/divisor:0;
    const rows=Array.from(this.entries.values()).map(e=>{
      const dps=elapsed>0?e.damage/divisor:0,peakDps=this.peaks.units.get(e.id)??0;
      return {...e,dps,peakDps,share:total>0?e.damage/total:0};
    }).sort((a,b)=>b.damage-a.damage||a.id.localeCompare(b.id));
    return {elapsed,total,dps,peakDps:this.peaks.overall,rows};
  }
}
