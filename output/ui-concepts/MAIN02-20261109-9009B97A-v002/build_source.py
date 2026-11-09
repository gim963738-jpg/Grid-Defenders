from pathlib import Path
import json
out=Path(__file__).resolve().parent
old=out.parent/'MAIN02-20261109-9009B97A'
s=(old/'concepts.html').read_text(encoding='utf-8')
s=s.replace('</style>','</style><link rel="stylesheet" href="skins.css">')
a=s.index('const entries='); b=s.index('const assets=',a)
s=s[:a]+'''const themes=[['설산성채','서릿빛 성채의 방어선','snow'],['사막유적','모래 아래 잠든 유적','desert'],['해안항구','푸른 항구의 전초기지','coast']];
const designs=['D1 · 무광 금속','D2 · 주조 프레임','D3 · 차콜 글라스'];
const entries=Array.from({length:9},(_,i)=>[String(i+1).padStart(2,'0'),themes[Math.floor(i/3)][0],themes[Math.floor(i/3)][1],themes[Math.floor(i/3)][2]]);
''' +s[b:]
a=s.index('window.render=');s=s[:a]+'''
const iconPaths={
 soldier:'M12 3v18M4 8l8-5 8 5-8 13Z',
 hero:'m3 7 4 4 5-7 5 7 4-4-3 13H6Z',
 shop:'M4 9h16v12H4ZM3 9l3-6h12l3 6M8 13h3v8m4-8h2',
 formation:'M4 4h5v5H4Zm11 0h5v5h-5ZM4 15h5v5H4Zm11 0h5v5h-5Z',
 bag:'M5 8h14v13H5ZM9 8V4h6v4m-6 5h6v4H9Z',
 pause:'M7 4v16M17 4v16', settings:'M4 6h16M4 12h16M4 18h16M8 3v6m8 0v6m-6 0v6',
 home:'m3 11 9-8 9 8M6 9v12h12V9m-8 12v-7h4v7'
};
const solidPaths={
soldier:'M11 2h2l2 13h4v3h-5v4h-4v-4H5v-3h4Z',
hero:'m2 7 5 4 5-8 5 8 5-4-3 14H5Zm5 16h10v-2H7Z',
shop:'M3 8 6 2h12l3 6v3H3Zm2 5h14v9h-6v-6h-3v6H5Z',
formation:'M3 3h7v7H3Zm11 0h7v7h-7ZM3 14h7v7H3Zm11 0h7v7h-7Z',
bag:'M8 2h8l2 6h3l1 14H2L3 8h3Zm2 3L9 8h6l-1-3ZM9 12v5h6v-5Z',
pause:'M5 3h5v18H5Zm9 0h5v18h-5Z',
settings:'M3 4h18v3H3Zm0 7h18v3H3Zm0 7h18v3H3ZM6 2h4v7H6Zm8 7h4v7h-4Zm-6 7h4v7H8Z',
home:'m1 11 11-9 11 9-3 1v10h-6v-7h-4v7H4V12Z'
};
const etched={...icons};
function applyIcons(d){for(const k of Object.keys(icons)) icons[k]=d===2?etched[k]:svg('<path d="'+(d===1?solidPaths[k]:iconPaths[k])+'"/>')}
window.render=(n=1)=>{n=Number(n);const e=entries[n-1],d=(n-1)%3+1;applyIcons(d);stage.dataset.number=n;stage.dataset.design=d;stage.className='stage d'+d;stage.innerHTML=`<div class="terrain" style="background-image:url('backgrounds/${e[3]}.png')"></div><div class="edge"></div>${scene()}<div class="hud"><section class="wave panel"><small>WAVE</small><b>09</b></section><section class="clock panel"><small>남은 시간</small><b>00:18</b></section><section class="wallet panel"><div><small>골드</small><b>480G</b></div><div><small>모루</small><b>2</b></div></section></div><section class="enemy-status panel"><small>누적 몬스터</small><strong><em>7</em> / 20</strong></section>${controls()}${commands()}<div class="deflabel">방어 배치 · 5×4</div><div class="arrival"><b>←</b>적 진입</div><div class="number">${e[0]}</div><div class="concept-title"><small>${e[1]} · ${designs[d-1]}</small><h1>${e[2]}</h1></div><div class="proposal">공통 버튼 비교 제안<br>새 배경 3 × 버튼 3</div>`;stage.style.transform=`scale(${innerWidth/800})`;document.title=e[0]+' '+e[1]+' · '+designs[d-1];};window.onresize=()=>stage.style.transform=`scale(${innerWidth/800})`;render(new URLSearchParams(location.search).get('n')||1);
</script></body></html>
'''
(out/'concepts.html').write_text(s,encoding='utf-8')
# Dedicated comparison uses the exact same HTML/CSS/icon functions as the nine finals.
board=s[:s.index('<body>')]+'''<style>
.stage{height:520px;background:#101c24; padding:16px;color:#f4efe3}.board-title{font-size:22px;margin:0 0 3px}.intro{font-size:12px;color:#aebcc4;margin:0 0 18px}.columns{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.sample{background:linear-gradient(150deg,#26323a,#18242d);border:1px solid #4e626b;border-radius:12px;padding:12px}.sample h2{font-size:20px;margin:0}.sample p{font-size:12px;line-height:18px;color:#c5cdd0;height:42px;margin:5px 0 12px}.sample-row{display:flex;gap:8px;align-items:center;margin-bottom:10px}.sample-row>span{font-size:12px;width:44px;color:#c2ced0}.sample button{position:relative;width:84px;height:48px;display:flex;gap:6px;align-items:center;justify-content:center;font-size:14px;font-family:inherit}.sample button svg{width:25px;height:25px;flex:none}.sample .icon-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;padding-top:12px;border-top:1px solid #5d6f7055}.sample .icon-row button{width:48px;height:48px;min-width:48px}.sample .legend{font-size:12px;line-height:20px;color:#a6b6be;margin-top:12px}.board-note{font-size:12px;line-height:20px;color:#b8c6cc;margin:15px 0 0}
</style><body><main id="stage" class="stage"></main>'''
js=s[s.index('<script>')+8:s.index('window.render=')]
board+='<script>'+js+'''
stage.innerHTML='<h1 class="board-title">공통 버튼 3종 · 확대 비교</h1><p class="intro">동일 기능과 48px 터치 영역 / 새 배경 3종에 스킨 그대로 적용 / 실제 게임 반영 전 시안</p><div class="columns"></div>';
const descriptions=['판금 모서리 절삭 · 얇은 은색 테두리<br>불투명 무광 표면 / 실루엣 아이콘','청동 주조 테두리 · 이중 단차 프레임<br>깊은 음각 판 / 정교한 선화 아이콘','라운드 캡슐 · 얇은 유리 외곽선<br>반투명 차콜 / 간결한 선 아이콘'];
for(let d=1;d<=3;d++){applyIcons(d);let html='<section class="sample d'+d+'"><h2>'+designs[d-1]+'</h2><p>'+descriptions[d-1]+'</p>';for(const [label,cls] of [['기본',''],['선택','selected'],['강조','primary'],['비활성','disabled']])html+='<div class="sample-row"><span>'+label+'</span><button '+(cls==='disabled'?'disabled':'class="'+cls+'"')+'>'+icons.bag+'<span>가방</span></button></div>';html+='<div class="icon-row">'+['soldier','hero','shop','formation','bag','pause','settings','home'].map(k=>'<button aria-label="'+k+'">'+icons[k]+'</button>').join('')+'</div><div class="legend">병사 · 영웅 · 상점 · 진형<br>가방 · 정지 · 설정 · 복귀</div></section>';stage.querySelector('.columns').insertAdjacentHTML('beforeend',html)}
stage.insertAdjacentHTML('beforeend','<p class="board-note">선택: D1 왼쪽 표시선 / D2 안쪽 이중선·눌린 음영 / D3 밝은 면·안쪽 윤곽. 비활성은 실제 기본 화면의 준비 중 설정에 적용.<br>확대 비교판의 선택·강조 상태는 시각 규칙 제안이며, 새 게임 기능이나 구매·장비 상태를 확정하지 않습니다.</p>');
stage.style.transform='scale('+innerWidth/800+')';window.onresize=()=>stage.style.transform='scale('+innerWidth/800+')';
</script></body></html>'''
(out/'buttons.html').write_text(board.replace('height:520px','height:720px'),encoding='utf-8')
print('concepts and button comparison source created')
