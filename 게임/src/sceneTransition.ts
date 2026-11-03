export type BattleScene = 'defense' | 'boss';

export function createSceneTransition(options:{
  root:HTMLElement;
  onBusy:(busy:boolean)=>void;
  onCovered:(scene:BattleScene)=>void;
}) {
  let current:BattleScene='defense',busy=false,disposed=false;
  const layer=document.createElement('div');layer.id='battle-doors';layer.hidden=true;layer.setAttribute('aria-hidden','true');
  layer.innerHTML='<div class="battle-door door-left"><span>GRID</span></div><div class="battle-door door-right"><span>DEFENDERS</span></div>';
  document.body.append(layer);
  const panels=Array.from(layer.querySelectorAll<HTMLElement>('.battle-door'));
  const animations:Animation[]=[];
  const position=()=>{const box=options.root.getBoundingClientRect();layer.style.left=`${box.left}px`;layer.style.width=`${box.width}px`;};
  window.addEventListener('resize',position);
  options.root.dataset.battleScene=current;
  async function doors(close:boolean):Promise<void> {
    const duration=matchMedia('(prefers-reduced-motion: reduce)').matches?0:360;
    await Promise.all(panels.map((panel,index)=>{
      const outside=`translateX(${index===0?'-101%':'101%'})`;
      const animation=panel.animate([{transform:close?outside:'translateX(0)'},{transform:close?'translateX(0)':outside}],{duration,easing:'cubic-bezier(.65,0,.35,1)',fill:'forwards'});
      animations.push(animation);return animation.finished;
    }));
  }
  return {
    async go(next:BattleScene):Promise<boolean> {
      if(disposed||busy||next===current)return false;
      busy=true;options.onBusy(true);options.root.inert=true;options.root.setAttribute('aria-busy','true');
      position();layer.hidden=false;
      try {
        await doors(true);if(disposed)return false;
        document.getElementById('defense-screen')!.hidden=next!=='defense';
        document.getElementById('boss-screen')!.hidden=next!=='boss';
        current=next;options.root.dataset.battleScene=next;
        options.onCovered(next);window.scrollTo(0,0);
        await doors(false);return true;
      } catch(error) {
        if(!disposed)console.error('전투 화면 전환 실패',error);
        return false;
      } finally {
        layer.hidden=true;animations.splice(0).forEach(animation=>animation.cancel());
        options.root.inert=false;options.root.setAttribute('aria-busy','false');busy=false;
        if(!disposed){options.onBusy(false);document.querySelector<HTMLElement>(`#${current==='boss'?'boss':'defense'}-screen h1`)?.focus({preventScroll:true});}
      }
    },
    dispose(){disposed=true;animations.splice(0).forEach(animation=>animation.cancel());window.removeEventListener('resize',position);layer.remove();options.root.inert=false;},
  };
}
