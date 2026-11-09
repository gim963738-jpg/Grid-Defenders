import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8').replace(/^\uFEFF/,''));
const standard=read('자료/캐릭터설정/SD_공통제작기준.json');
const measurements=read(standard.measurements);
const frame=standard.body_framing,canvas=standard.generation.framing_canvas;
const folder='output/characters/sd-standard';
function registration(m){
 const head=m.hairTop??m.head_top_y,foot=m.footY??m.foot_baseline_y;
 const width=m.native_dimensions?.width??m.width,height=m.native_dimensions?.height??m.height;
 const scale=(frame.foot_baseline_y-frame.head_top_y)/(foot-head);
 const footX=m.footX??width/2;
 return {...m,width,height,head_top_y:head,foot_baseline_y:foot,body_height_px:foot-head+1,preview_scale:scale,preview_x:canvas.width/2-footX*scale,preview_y:frame.head_top_y-head*scale,raw_frame_matches_standard:Math.abs(head/height-frame.head_top_ratio)<=0.01&&Math.abs(foot/height-frame.foot_baseline_ratio)<=standard.verification.foot_baseline_ratio_tolerance&&Math.abs((foot-head+1)/height-frame.body_height_ratio)<=standard.verification.body_height_ratio_tolerance};
}
const data={standard_id:standard.id,canvas,baseline:frame.foot_baseline_y,head_top:frame.head_top_y,canvas_role:'technical delivery/display template, not native approved reference canvas',examples:standard.reference.views.map(registration),historical_examples:measurements.measurements.map(registration),render_only:true,source_images_modified:false,browser_run:false};
fs.writeFileSync(path.join(root,folder,'preview-data.json'),JSON.stringify(data,null,2)+'\n');
const labels={front:'신규2안 · 정면',right45:'신규2안 · 오른쪽 앞45°',right90:'신규2안 · 오른쪽 정90°',silver_staff:'은발·날개 지팡이 · 이전 체형 기준',blond_warrior:'금발 전사 · 구원본',balor_existing_sd:'발로르 · 당시 선택본'};
function card(m){
 const url=path.posix.relative(folder,m.path),label=labels[m.direction??m.id];
 return `<figure><figcaption><h2>${label}</h2><p>${m.width}×${m.height} 원본 · 본체 ${m.body_height_px}px</p><small>원본 프레이밍: ${m.raw_frame_matches_standard?'기술 기준과 일치':'기술 기준과 다름'} · 원본은 그대로 유지</small></figcaption><div class="stage"><div class="frame" style="--ratio:${m.width}/${m.height}"><div class="guide head" style="top:${frame.head_top_ratio*100}%"></div><div class="guide foot" style="top:${frame.foot_baseline_ratio*100}%"></div><img src="${url}" alt="${label}" style="left:${m.preview_x/canvas.width*100}%;top:${m.preview_y/canvas.height*100}%;width:${m.width*m.preview_scale/canvas.width*100}%"></div></div><a href="${url}">원본 보기</a></figure>`;
}
const html=`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SD 승인 기준 · 신규2안</title><style>
*{box-sizing:border-box}body{margin:0;background:#f4f1eb;color:#293137;font:15px/1.6 system-ui,sans-serif}main{max-width:1800px;margin:auto;padding:24px}h1{margin:0;font-size:28px}h2{font-size:18px;margin:0}p{margin:6px 0}small{color:#66746f}.controls{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0}button,a{font:inherit;min-height:44px;padding:8px 14px;border:1px solid #cdd5d2;border-radius:7px;background:white;color:#315d68;display:inline-flex;align-items:center;text-decoration:none;cursor:pointer}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px}figure{margin:0;border:1px solid #d8dcd9;border-radius:12px;overflow:hidden;background:white;min-width:0}figcaption{padding:12px 16px}.stage{background:var(--bg,#fff)}.frame{position:relative;aspect-ratio:1;overflow:hidden}.frame img{position:absolute;height:auto;max-width:none;image-rendering:pixelated}.guide{position:absolute;left:0;right:0;border-top:1px dashed #c79755;z-index:1;pointer-events:none}.foot{border-color:#4e9aa7}.original .frame{aspect-ratio:var(--ratio)}.original .frame img{left:0!important;top:0!important;width:100%!important}.original .guide{display:none}details{margin-top:24px}@media(max-width:700px){main{padding:14px}.grid{grid-template-columns:1fr}h1{font-size:23px}}</style><main>
<h1>SD 승인 기준 · 신규2안（SD-STD-002）</h1><p>2026-11-09 사용자 채택: 앞으로의 두상·몸 비중·얼굴 가독성·픽셀 표현은 신규2안을 참조합니다.</p><p>다른 캐릭터에게는 STYLE/PROPORTION 기준입니다. 얼굴형·헤어·성별·나이·종족·체격·의상·장비는 각 인물의 것을 유지합니다.</p><p>숨은 정수리는 추정이며 고정 등신값을 새로 확정하지 않습니다. 아래 원본의 좁은 여백·유색 반투명 외곽·미세 생성 차이는 미래 납품 허용 결함이 아닙니다.</p><p><strong>기술 프레이밍 별도 유지:</strong> ${canvas.width}×${canvas.height} 납품 템플릿에서 모발끝 ${frame.head_top_y} / 발선 ${frame.foot_baseline_y} / 본체 ${frame.body_height_px}px. 승인 PNG의 실제 캔버스와 구분합니다.</p>
<div class="controls"><button data-size="standard">기술 키·발선에 등비 표시</button><button data-size="original">원본 전체 캔버스 비율</button><button data-bg="#ffffff">밝게</button><button data-bg="#1b2430">어둡게</button><a href="../../../문서/02_세부기획/02_영웅/SD_공통제작기준.md">최신 제작 기준</a><a href="preview-data.json">실측·표시 데이터</a><a href="../char001/gallery.html">제작 모음</a></div>
<section class="grid">${data.examples.map(card).join('')}</section><details><summary>이전 기준·역사적 원본 비교（현재 두상 마스터 아님）</summary><p>은발의 이전 두상/체형 기준과 구원본 실측을 보존합니다. 표시등록은 기술 프레이밍만 맞추며 다른 작품의 선택/폐기 판정은 바꾸지 않습니다.</p><section class="grid">${data.historical_examples.map(card).join('')}</section></details><p>화면 표시만 등비 등록하며 개별 PNG 바이트를 변경하지 않습니다. 실제 게임·실기기 검증 화면이 아닙니다. 이번 갱신은 파일/산식 검증만 수행했고 브라우저를 열지 않았습니다.</p></main>
<script id="sd-data" type="application/json">${JSON.stringify(data).replaceAll('<','\\u003c')}</script><script>document.querySelectorAll('[data-size]').forEach(b=>b.onclick=()=>document.body.classList.toggle('original',b.dataset.size==='original'));document.querySelectorAll('[data-bg]').forEach(b=>b.onclick=()=>document.documentElement.style.setProperty('--bg',b.dataset.bg));</script></html>`;
fs.writeFileSync(path.join(root,folder,'index.html'),html);
console.log(JSON.stringify({standard:standard.id,approvedReferences:data.examples.length,historicalExamples:data.historical_examples.length,canvasRole:data.canvas_role,browserOpened:false}));
