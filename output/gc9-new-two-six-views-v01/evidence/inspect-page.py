from pathlib import Path
root=Path(__file__).resolve().parents[1]
centers={
'n01_front':{'face':(510,495),'cloth':(510,740),'left':(642,886),'right':(388,880)},
'n01_right_threequarter':{'face':(532,495),'cloth':(520,740),'left':(639,888),'right':(420,891)},
'n01_right_profile':{'face':(540,494),'cloth':(526,739),'left':(616,890),'right':(508,890)},
'n02_front':{'face':(510,710),'cloth':(510,865),'left':(625,956),'right':(399,966)},
'n02_right_threequarter':{'face':(540,707),'cloth':(527,867),'left':(633,944),'right':(435,966)},
'n02_right_profile':{'face':(540,710),'cloth':(524,869),'left':(599,925),'right':(512,980)}}
import json
tiles=[]
for name,c in centers.items():
 x,y=c['face']
 tiles.append('<article><h2>'+name+'</h2><div class="crop"><img data-id="'+name+'" src="images/'+name+'.png" style="left:'+str(130-2*x)+'px;top:'+str(140-2*y)+'px"></div><a href="images/'+name+'.png">원본</a></article>')
page='''<!doctype html><html lang="ko"><meta charset="utf-8"><title>GC9 신규2명 원본2배 검수</title><style>body{font:14px system-ui;background:#f3f0e9;padding:12px;margin:0}h1{font-size:21px}nav{display:flex;gap:8px;margin:12px 0;flex-wrap:wrap}button{padding:8px}main{display:grid;grid-template-columns:repeat(2,280px);gap:10px}article{background:white;padding:10px}h2{font-size:12px}.crop{width:260px;height:280px;overflow:hidden;position:relative;background:#fff9f3}.crop img{width:2048px;height:3072px;max-width:none;position:absolute}</style><h1>원본2배 확대 · CSS 표시만</h1><nav><button onclick="show('face')">얼굴</button><button onclick="show('cloth')">옷</button><button onclick="show('left')">왼손·장비/줄</button><button onclick="show('right')">오른손·소품</button><a href="index.html">전체 프레임</a></nav><p>원본 PNG는 변경하지 않습니다. 가려진 손가락·소품 뒤 구조는 미확정으로 기록합니다.</p><main>'''+''.join(tiles)+'''</main><script>const centers='''+json.dumps(centers)+'''; function show(region){document.querySelectorAll('[data-id]').forEach(im=>{let c=centers[im.dataset.id][region];im.style.left=(130-2*c[0])+'px';im.style.top=(140-2*c[1])+'px';});} if(location.hash)show(location.hash.slice(1));</script></html>'''
(root/'inspect.html').write_text(page,encoding='utf-8')

