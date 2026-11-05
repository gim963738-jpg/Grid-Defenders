// Lobby-only Bran sample, based on the item workshop stat catalog (2026-11-05).
// Caps are reference limits, not values to assign to every hero or combat rules.
export const BRAN_STAT_SAMPLE=[
 {id:'attack',name:'공격력',value:'136',note:'기본 대비 100%',cap:'500%'},
 {id:'physicalDefense',name:'물리 방어력',value:'210',note:'피해 감소 28.11%',cap:'피해 감소 99%'},
 {id:'magicDefense',name:'마법 방어력',value:'30%',note:'피해 감소율',cap:'피해 감소 99%'},
 {id:'health',name:'체력',value:'2,300',note:'기본 대비 100%',cap:'1,000%'},
 {id:'attackSpeed',name:'공격속도',value:'120%',note:'기본 대비',cap:'500%'},
 {id:'regeneration',name:'초당 회복',value:'12 / 초',note:'고정 회복량',cap:null},
 {id:'criticalChance',name:'치명타 확률',value:'18%',note:'',cap:'100%'},
 {id:'criticalDamage',name:'치명타 피해량',value:'175%',note:'총 피해 배율',cap:'500%'},
 {id:'moveSpeed',name:'이동속도',value:'110%',note:'기본 대비',cap:'500%'},
 {id:'evasion',name:'회피율',value:'8%',note:'',cap:'60%'},
 {id:'guard',name:'가드율',value:'20%',note:'',cap:'60%'},
 {id:'effectHit',name:'효과 적중',value:'125',note:'기본 100 + 추가 25',cap:'200%'},
 {id:'resistance',name:'저항력',value:'36.25',note:'기본 25 · 증가 +45',cap:'증가 +99%'},
] as const;
