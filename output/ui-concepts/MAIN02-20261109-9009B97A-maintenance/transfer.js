const maintenanceRender=render;
window.render=(n=1)=>{maintenanceRender(n);if(+n===5){const art=stage.querySelector('.big-inventory .gear-art[data-item=I01]');art?.parentElement.classList.add('moving');stage.querySelector('.big-inventory .drop')?.remove();stage.querySelector('.carry-item p').textContent='선택한 장비를 창고로 이동';const buttons=stage.querySelectorAll('.carry-item button');buttons[0].textContent='창고 이동';buttons[1].textContent='영웅 이동';stage.insertAdjacentHTML('beforeend','<svg class="flow" viewBox="0 0 800 360"><path d="M727 147 Q610 198 273 285"/></svg>')}};
render(new URLSearchParams(location.search).get('n')||1);
if(Number(new URLSearchParams(location.search).get('n')||1)===1)stage.querySelector('.wave b').textContent='01';
