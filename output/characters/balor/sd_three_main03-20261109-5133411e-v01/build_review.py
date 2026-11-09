from pathlib import Path
from PIL import Image
import json,hashlib,shutil,zipfile,datetime
ROOT=Path(__file__).resolve().parent
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
metrics=json.loads((ROOT/'evidence/alpha-inspection.json').read_text())
manual=[dict(angle=0,pose='neutral_standing',bodyTopY=62,bodyHeight=1145,footX=618,footY=1206),dict(angle=45,pose='idle_ready',bodyTopY=57,bodyHeight=1154,footX=630,footY=1210),dict(angle=90,pose='neutral_ready_profile',bodyTopY=31,bodyHeight=1168,footX=632,footY=1198)]
for m,n in zip(metrics,manual):
 m.update(n);m['measurementMethod']='Manual visible hair top to grounded boot sole; equipment excluded. FootX support midpoint (profile visible boot), footY sole contact. Approximate visual landmarks, not anatomical scalp measurement.'
 m['baselineDeltaFromFront']=m['footY']-manual[0]['footY']
 m['bodyHeightDeltaFromFront']=m['bodyHeight']-manual[0]['bodyHeight']
 m['damageCollider']=None;m['displayBounds']=m['bboxAlpha16'];m['rawSourceUnmodified']=True
manifest=dict(task='MAIN03-20261109-5133411E',iteration=1,role='sprites',main='main03',status='candidates_created_technical_QC_NOT_PASS_user_pending',styleStandard='SD-STD-002 new2 ID6',assets=metrics,baselineSpreadPx=12,bodyHeightSpreadPx=23,footRegistration='Explicit metadata; preview only aligns soles and body display height, no raw rewriting',alphaPolicy='Native generated alpha preserved; no cleanup or quantization applied',collision='No collider or damage range defined; body height, alpha extent, display extent and anchor are separate',gameIntegration=False,userAcceptance=False)
(ROOT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
calls=json.loads((ROOT/'evidence/calls.json').read_text())
for c in calls:
 c['tool']='image_gen.imagegen';c['art_source']='host_image';c['transparent_background']=True;c['actualPrompt']=(ROOT/c['prompt']).read_text(encoding='utf-8')
 c['referenceOrder']=[dict(index=i+1,path=p,sha256=sha(p),role=('identity/style/grip as explicitly stated in actualPrompt')) for i,p in enumerate(c.pop('refs'))]
 c['sourceSha256']=sha(c['source']);c['outputSha256']=sha(ROOT/c['file']);c['bytePreserved']=c['sourceSha256']==c['outputSha256']
 c['actualDimensions']=list(Image.open(ROOT/c['file']).size);c['model']='not exposed by built-in tool';c['cost']='not exposed by built-in tool'
(ROOT/'generation-record.json').write_text(json.dumps(dict(task=manifest['task'],iteration=1,route='host_image: image_gen.imagegen; no API/CLI fallback',calls=calls,identityApprovedSha256='061f23cc26b1f023918288446f9ac025de99bcf32550fb9be3e9850850f496fe',sourcePreservation='Every generated output copied byte-for-byte; candidate and rejected cleanup trial preserved'),ensure_ascii=False,indent=2),encoding='utf-8')
html='''<!doctype html><html lang="ko"><meta charset="utf-8"><title>발로르 SD 3종 · 차수1 검토본</title><style>
*{box-sizing:border-box}body{font:16px/1.6 system-ui,sans-serif;margin:0;background:#e9edf2;color:#172035}main{max-width:1440px;margin:auto;padding:24px}h1{font-size:26px}h2{margin-top:28px;font-size:22px}.notice{padding:14px;background:#fff1ce;border-left:5px solid #b07012}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}article{background:#fff;border-radius:10px;overflow:hidden;padding:12px}.stage{position:relative;overflow:hidden;width:100%;aspect-ratio:1;cursor:zoom-in}.stage img{width:100%;height:100%;object-fit:contain;image-rendering:pixelated}.light{background:#fff8ea}.dark{background:#17202d}.check{background:repeating-conic-gradient(#ddd 0% 25%,#fff 0% 50%) 50% /20px 20px}.label{font-size:14px}.smallstage{height:180px;position:relative;background:#dfe9d4;border-bottom:2px solid #596b48;overflow:hidden}.smallstage img{position:absolute;image-rendering:pixelated;max-width:none}.refs{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.refs img{width:100%;height:300px;object-fit:contain;background:#f5f0e6}.controls{position:sticky;top:0;z-index:1;background:#fff;padding:10px;display:flex;gap:12px;flex-wrap:wrap}button,select,input{font:inherit;min-height:40px}table{border-collapse:collapse;background:white;width:100%;font-size:14px}td,th{padding:8px;border:1px solid #bbc3cf;text-align:left}dialog{width:min(95vw,1350px);max-width:none;max-height:95vh;overflow:auto}dialog img{width:100%;image-rendering:pixelated}dialog::backdrop{background:#000b}.zoomwrap{overflow:auto}.muted{color:#4c5868}
</style><main><h1>발로르 SD 정면 · 대기45° · 오른쪽90°</h1><p>MAIN03-20261109-5133411E / 차수1 / main03 → sprites · SD-STD-002 신규2안(ID6)</p>
<p class="notice">상태: 실제 PNG 3장 제작 및 자체 검수. 기술검수 미달: 유색 외곽/저알파 잡점, 원본 발선 차이 12px. 사용자 미적 합격 대기. 정면 정리 후보는 픽셀 표현이 달라져 미채택.</p>
<div class="controls"><label>전체프레임 배경 <select id="bg"><option value="light">밝게</option><option value="dark">어둡게</option><option value="check">체커</option></select></label><label>작은표시 본체 키 <input id="size" type="range" min="64" max="200" value="112"> <span id="sizeLabel">112px</span></label><a href="originals.zip">원본 ZIP</a><a href="manifest.json">manifest</a><a href="generation-record.json">생성 기록</a></div>
<h2>전체 프레임 · 클릭하면 원본 확대</h2><div class="grid" id="full"></div>
<h2>실제 작은 표시 · 본체 키와 발점으로 배치</h2><p class="muted">검수용 표시이며 실제 게임 통합 화면은 아닙니다. 장비 외곽이 아닌 모발 상단~발바닥 본체 키로 균일 배율 적용, 발점 y=160으로 표시만 정렬합니다. PNG 바이트는 변경하지 않습니다.</p><div class="grid" id="small"></div>
<h2>측정과 분리</h2><div id="metrics"></div><p>투명여백: alpha 범위 / 본체 키: 시각적 모발 상단~발바닥 / 기준점: 지지 발점 / 표시범위: alpha≥16 참고 / 피해판정: 미정·미구현. 해부학 정수리~턱 수치나 게임 절대 키를 확정하지 않았습니다.</p>
<h2>디자인 원본과 최신 SD 비율 참조</h2><div class="refs"><article><p>발로르 v02 · 정체성만</p><img src="references/balor-v02.png"></article><article><p>신규2안 · 정면</p><img src="references/variant-2-front.png"></article><article><p>신규2안 · 45°</p><img src="references/variant-2-right-045.png"></article><article><p>신규2안 · 90°</p><img src="references/variant-2-right-090.png"></article></div>
<h2>검수 메모</h2><p>정면: 중립 두발 지지, 양쪽 눈과 가슴 정면. 대기: 오른쪽3/4로 얼굴·가슴 앞면 함께 보임, 무기를 낮게 든 안정 자세. 오른쪽90°: 한쪽 눈/코 윤곽, 가슴과 방패 edge-on, 오른손 검이 가까운 쪽, 왼손 방패와 먼 발은 가림. 가려진 왼손 손가락 연결은 직접 확인 불가.</p><p>원본1:1에서 일부 고채도 외곽을 확인했습니다. 알파255가 아닌 내부 주값253과 아주 낮은 알파 잡점도 보존되어 있습니다. 실제 전장 통합/독립 테스터 검수/최종 사용자 합격은 수행하지 않았습니다.</p>
<details><summary>미채택 생성 기록</summary><p>90도 첫 후보는 가슴 앞면이 넓어 방향 보정. 정면 알파 정리 후보는 픽셀 표현 변화로 미채택.</p><div class="grid"><img style="width:100%" src="right_090_candidate.png"><img style="width:100%" src="front_alpha_cleanup_candidate.png"></div></details>
</main><dialog id="zoom"><button onclick="zoom.close()">닫기</button><label>배율 <select id="zoomScale"><option value="100">100%</option><option value="200">200%</option><option value="50">50%</option></select></label><div class="zoomwrap light" id="zoomWrap"><img id="zoomImg"></div></dialog><script>
const assets=ASSETS;
const names=['정면 0° · 평상 기립','대기 45° · 오른쪽 준비자세','오른쪽 90° · 완전 정측면'];
assets.forEach((a,i)=>{full.insertAdjacentHTML('beforeend',`<article><b>${names[i]}</b><div class="stage light"><img alt="${names[i]}" src="${a.file}"></div><p class="label">${a.width}×${a.height} · 본체 키 ${a.bodyHeight}px · 발점(${a.footX},${a.footY})</p></article>`);small.insertAdjacentHTML('beforeend',`<article><b>${names[i]}</b><div class="smallstage"><img alt="${names[i]}" src="${a.file}"></div></article>`)});
function update(){let h=+size.value;sizeLabel.textContent=h+'px';document.querySelectorAll('.smallstage img').forEach((img,i)=>{let a=assets[i],s=h/a.bodyHeight;img.style.width=a.width*s+'px';img.style.height=a.height*s+'px';img.style.left='calc(50% - '+a.footX*s+'px)';img.style.top=160-a.footY*s+'px'})}
update();size.oninput=update;bg.onchange=()=>document.querySelectorAll('.stage,#zoomWrap').forEach(e=>e.className=(e.id==='zoomWrap'?'zoomwrap':'stage')+' '+bg.value);document.querySelectorAll('.stage img').forEach(img=>img.onclick=()=>{zoomImg.src=img.src;zoom.showModal()});zoomScale.onchange=()=>{zoomImg.style.width=+zoomScale.value+'%'};metrics.innerHTML='<table><tr><th>종류</th><th>본체 키</th><th>발점</th><th>alpha≥16 외곽</th><th>유색반투명 후보</th><th>캔버스 경계 alpha&gt;0</th></tr>'+assets.map((a,i)=>'<tr><td>'+names[i]+'</td><td>'+a.bodyHeight+'</td><td>'+a.footX+', '+a.footY+'</td><td>'+a.bboxAlpha16.join(', ')+'</td><td>'+a.saturatedFringeCandidatePixels+'</td><td>'+a.edgeTouchPixels+'</td></tr>').join('')+'</table>';
</script></html>'''
html=html.replace('ASSETS',json.dumps(metrics,ensure_ascii=False))
(ROOT/'index.html').write_text(html,encoding='utf-8')
with zipfile.ZipFile(ROOT/'originals.zip','w',zipfile.ZIP_DEFLATED) as z:
 for n in ['front.png','idle_right_045.png','right_090.png','right_090_candidate.png','front_alpha_cleanup_candidate.png','manifest.json','generation-record.json']:
  z.write(ROOT/n,n)
 for p in (ROOT/'prompts').glob('*.txt'):z.write(p,p.relative_to(ROOT))
print(json.dumps(dict(manifest=str(ROOT/'manifest.json'),index=str(ROOT/'index.html'),zip=str(ROOT/'originals.zip'),bytePreserved=all(c['bytePreserved'] for c in calls)),ensure_ascii=False))

