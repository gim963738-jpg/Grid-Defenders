from pathlib import Path
import json,datetime

root=Path(__file__).resolve().parent
p=root/'index.html'
html=p.read_text(encoding='utf-8')
if 'id="viewzoom"' not in html:
    (root/'index-before-resize.html').write_text(html,encoding='utf-8')
    css='''<style>
body{max-width:1400px;margin:0 auto}.stage{height:380px;overflow:auto;display:flex;align-items:flex-start;justify-content:flex-start}canvas{flex-shrink:0;max-width:none;margin:auto}.viewbar{display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin:10px 0 12px}.viewbar input{width:140px}.viewbar output{min-width:46px;font-variant-numeric:tabular-nums}button,select{font-size:14px}.card{min-width:0}body:fullscreen{max-width:none;background:#121923;overflow:auto}
@media(max-width:600px){body{padding:10px}.pair{gap:8px}.stage{height:300px}.title{padding:8px;font-size:14px}}
</style>'''
    toolbar='''<div class="viewbar"><button id="fit">화면에 맞추기</button><button id="smaller" aria-label="축소">−</button><input id="viewzoom" type="range" min="50" max="250" step="10" value="100" aria-label="보기 크기"><button id="larger" aria-label="확대">＋</button><output id="zoomtext">100%</output><button id="fullscreen">전체 화면</button></div>'''
    html=html.replace('<h2>',css+'<h2>',1).replace('<div class="pair">',toolbar+'<div class="pair">',1)
    js='''
let viewZoom=1;
function fitViewer(){document.querySelectorAll('.stage').forEach(stage=>{const c=stage.querySelector('canvas');const fit=Math.min(stage.clientWidth/448,stage.clientHeight/406);c.style.width=(448*fit*viewZoom)+'px';c.style.height=(406*fit*viewZoom)+'px';});document.getElementById('zoomtext').textContent=Math.round(viewZoom*100)+'%';document.getElementById('viewzoom').value=Math.round(viewZoom*100);}
document.getElementById('viewzoom').oninput=e=>{viewZoom=Number(e.target.value)/100;fitViewer();};
document.getElementById('smaller').onclick=()=>{viewZoom=Math.max(.5,viewZoom-.1);fitViewer();};
document.getElementById('larger').onclick=()=>{viewZoom=Math.min(2.5,viewZoom+.1);fitViewer();};
document.getElementById('fit').onclick=()=>{viewZoom=1;fitViewer();document.querySelectorAll('.stage').forEach(s=>{s.scrollLeft=0;s.scrollTop=0;});};
document.getElementById('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch(e){document.getElementById('status').textContent='브라우저의 전체 화면을 사용할 수 없습니다. 크기 조절을 이용해주세요.'}};
window.addEventListener('resize',fitViewer);document.addEventListener('fullscreenchange',fitViewer);new ResizeObserver(fitViewer).observe(document.querySelector('.pair'));fitViewer();
'''
    html=html.replace('</script>',js+'</script>')
    p.write_text(html,encoding='utf-8')
    (root/'크기조절-작업기록.json').write_text(json.dumps({'time':datetime.datetime.now(datetime.timezone.utc).isoformat(),'user':'화면 크기조절안된다 오른쪽 처럼 보여줘','executor':'main02','changes':['right browser requested','fit to available stage','50-250 percent zoom','plus/minus/fullscreen','resize observer'],'sourceArtChanged':False},ensure_ascii=False,indent=2),encoding='utf-8')
print('resize controls ready')
