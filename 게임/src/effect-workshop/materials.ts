import '../mobile-ui.css';
import './materials.css';
import { addMaterial, compositionDuration, compositionMaterials, creditsFor, emptyComposition, MATERIAL_STORAGE, MAX_COMPOSITION_BYTES, materialName, materialUrl, parseComposition, sampleMaterial, sourceDuration, type Material, type MaterialCatalog, type MaterialComposition, type MaterialLayer } from './materialModel';
import { drawComposition, drawMaterialPreview, loadMaterialImage, materialFrameCanvas, prepareComposition, touchesCanvasEdge } from './materialRender';
import { exportComposition, jsonBlob, pngBlob, saveBlob, zipFiles } from './materialExport';
import { createBattlePreview } from './battle';
import { createPreset, STORAGE_KEY } from './model';
import { createSkillFrame, type SkillFrameArt } from '../skillVisual';
import { COMPONENT_STORAGE, readComponents, writeComponents } from './componentModel';
import { MATERIAL_CATEGORIES, categoryKeywords } from './materialClassification';
import { unifiedMaterials, ORIGIN_LABELS, GROUP_LABELS, materialGroup } from './unifiedMaterials';

const root=document.querySelector<HTMLDivElement>('#materials')!;
const esc=(s:unknown)=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const $=<T extends HTMLElement=HTMLElement>(s:string)=>root.querySelector<T>(s)!;
root.innerHTML=`<header class="m-header"><a class="m-brand" href="./effect-materials.html"><span class="m-logo">✦</span><span><small>GRID DEFENDERS / PERSONAL STUDIO</small><strong>이펙트 재료함</strong></span></a><nav><a href="./effect-gallery.html">공방 작품 갤러리</a><a href="./effect-workshop.html">공방으로 ↗</a></nav></header>
<main><section class="m-intro"><div><span class="m-eyebrow">MATERIAL LIBRARY</span><h1>모든 이펙트, 한 재료함에.</h1><p>무료 팩부터 내 작품의 불꽃·마법진·문양까지. 종류별로 찾아 꺼내 쓰세요.</p></div><div id="m-stats" class="m-stats">재료함 읽는 중…</div></section>
<div id="m-status" class="m-status" role="status" aria-live="polite">개인 보관함을 연결하고 있습니다.</div>
<section class="m-quick"><span>빠르게 시작</span><button data-preset="fire">화염 폭발</button><button data-preset="slash">번개 참격</button><button data-preset="magic">마법 발동</button><button id="m-help">사용법·출처</button></section>
<div class="m-workspace"><section class="m-library" aria-label="이펙트 재료 목록"><div id="m-origins" class="m-origins" aria-label="재료 출처"></div><details id="m-filter-box" class="m-filter-box" open><summary>검색·분류 필터</summary><div class="m-tools"><label class="m-search">재료 검색<input id="m-search" type="search" placeholder="불꽃, 레이저, 마법진, 작품 이름…" /></label><label>제작자<select id="m-pack"><option value="">모든 제작자</option></select></label><label>분류<select id="m-category"><option value="">모든 연출</option></select></label><label>종류<select id="m-kind"><option value="">모든 재료</option><option value="effect">완성 효과</option><option value="part">구성 부품</option><option value="texture">낱개 이미지</option><option value="reference">참고 소재</option></select></label></div><div id="m-categories" class="m-categories" aria-label="연출별 분류"></div></details>
<div class="m-gridbar"><span id="m-count"></span><label class="m-check"><input type="checkbox" id="m-variants" checked /> 크기·FPS 변형 포함</label><label>배경<select id="m-bg"><option value="gray">밝은 회색</option><option value="green">밝은 초록</option><option value="dark">어두운색</option><option value="checker">투명 격자</option></select></label><button id="m-play">Ⅱ 일시정지</button><button id="m-clear-filters">필터 초기화</button></div><div id="m-grid" class="m-grid"></div><div class="m-pagination"><button id="m-prev">← 이전</button><span id="m-page"></span><button id="m-next">다음 →</button></div></section>
<aside class="m-composer" aria-label="재료 조합"><div class="m-composer-head"><div><span class="m-eyebrow">COMPOSER</span><h2>내 연출 조합</h2></div><span id="m-layer-count">0 / 12</span></div><button id="m-back-library" class="m-mobile">↑ 재료 목록으로</button><label>이름<input id="m-name" value="새 재료 조합" maxlength="100" /></label>
<div class="m-stage"><canvas id="m-preview" width="256" height="256" aria-label="합성 이펙트 미리보기"></canvas><span id="m-empty">왼쪽 재료를 눌러 추가하세요</span></div>
<div class="m-timeline"><input id="m-time" type="range" min="0" max="1" step="0.001" value="0" aria-label="재생 위치"/><output id="m-time-label">0.00초</output></div>
<div class="m-actions"><button id="m-undo" disabled>되돌리기</button><button id="m-redo" disabled>다시하기</button><button id="m-reset">초기화</button><button id="m-battle">전장에 보기</button></div>
<div id="m-layers" class="m-layers"></div><section id="m-editor"></section>
<details class="m-settings"><summary>출력 설정</summary><div class="m-fields"><label>프레임 크기<select id="m-size"><option>128</option><option selected>256</option><option>512</option></select></label><label>출력 FPS<input id="m-fps" type="number" min="1" max="60" value="30" /></label><label>전장 표시 크기<input id="m-display" type="number" min="24" max="240" value="150" /></label></div><p>좌우 여백과 기준점을 포함해 출력합니다. 피해 판정과는 연결되지 않습니다.</p></details>
<div class="m-export"><button id="m-export" class="m-primary">게임용 PNG 시트 + 출처 ZIP</button><div><button id="m-save">조합 JSON 저장</button><button id="m-load">조합 JSON 열기</button></div><input type="file" id="m-file" accept="application/json,.json" hidden /></div><small class="m-autosave">이 브라우저에 자동 저장 · 기존 공방 작품은 별도 보관</small></aside></div></main>
<dialog id="m-info" class="m-dialog"><div class="m-dialog-head"><h2>재료 사용법·출처</h2><button data-close="m-info">닫기</button></div><div id="m-info-body"></div></dialog>
<dialog id="m-source" class="m-dialog"><div class="m-dialog-head"><h2 id="m-source-title">원본 프레임</h2><button data-close="m-source">닫기</button></div><div id="m-source-body"></div></dialog>
<dialog id="m-battle-dialog" class="m-dialog m-battle-dialog"><div class="m-dialog-head"><h2>전장 미리보기</h2><button data-close="m-battle-dialog">닫기</button></div><div class="m-actions"><button data-position="top">상단 길</button><button data-position="center">중앙</button><label>속도<select id="m-battle-speed"><option value="0.25">0.25×</option><option value="1" selected>1×</option><option value="5">5×</option></select></label><button id="m-battle-pause">일시정지</button></div><input id="m-battle-time" type="range" min="0" max="1" step="0.001" value="0" aria-label="전장 재생 위치"/><output id="m-battle-time-label"></output><div id="m-battle-host"></div><p>실제 전장 렌더러에서 표시만 확인합니다.</p></dialog>`;
root.dataset.background='gray';
const mobileFilters=matchMedia('(max-width:780px)');
const adaptFilters=()=>{$<HTMLDetailsElement>('#m-filter-box').open=!mobileFilters.matches;};adaptFilters();mobileFilters.addEventListener('change',adaptFilters);
let catalog:MaterialCatalog,byId=new Map<string,Material>(),composition=emptyComposition(),selected='',page=0,filtered:Material[]=[],tiles:{m:Material;layer:MaterialLayer;canvas:HTMLCanvasElement}[]=[];
let freeCatalog:MaterialCatalog|undefined,origin='',tileCursor=0,sourceRevision=0;
let running=true,elapsed=0,cursor=0,last=performance.now(),busy=false,history:string[]=[],future:string[]=[],frameClock=0;
let battle:Awaited<ReturnType<typeof createBattlePreview>>|undefined,battleArt:SkillFrameArt|undefined,battleBusy=false,battleLast=-1,battleRunning=true,battleElapsed=0;
const note=(s:string,error=false)=>{$('#m-status').textContent=s;$('#m-status').classList.toggle('error',error);};
let durationRecipe:MaterialComposition|undefined,cachedDuration=.1,revision=0,previewKey='',battleKey='',previewBusy=false,alive=true,raf=0,lastSelected='',storageHealthy=true;
const visibleTiles=new Set<HTMLCanvasElement>();
const tileObserver=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)visibleTiles.add(e.target as HTMLCanvasElement);else visibleTiles.delete(e.target as HTMLCanvasElement);}));
const duration=()=>{if(durationRecipe!==composition){durationRecipe=composition;cachedDuration=compositionDuration(composition,byId);}return cachedDuration;};
const persist=()=>{if(!storageHealthy){note('기존 저장 데이터를 덮어쓰지 않았습니다. 현재 편집은 조합 JSON으로 저장해 주세요.',true);return;}try{localStorage.setItem(MATERIAL_STORAGE,JSON.stringify(composition));}catch{note('브라우저 저장 공간이 부족합니다. 조합 JSON으로 저장해 주세요.',true);}};
function commit(change:()=>void){
  if(busy)return;const before=JSON.stringify(composition);change();
  try{composition=parseComposition(composition,byId);}catch(e){composition=JSON.parse(before);note(String((e as Error).message),true);renderComposer();return;}
  history.push(before);if(history.length>40)history.shift();future=[];persist();renderComposer();
}
function add(m:Material){if(!catalog||busy)return;if(composition.layers.length>=12){note('한 조합에 최대 12개 재료를 사용할 수 있습니다.',true);return;}commit(()=>{const l=addMaterial(m);composition.layers.push(l);selected=l.id;});$<HTMLDialogElement>('#m-source').close();if(matchMedia('(max-width:780px)').matches)$('.m-composer').scrollIntoView({block:'start'});note(`${materialName(m)} 추가 · 구간과 크기를 조절해 보세요.`);}
function renderGallery(){
  if(!catalog)return;const query=$<HTMLInputElement>('#m-search').value.trim().toLowerCase(),author=$<HTMLSelectElement>('#m-pack').value,cat=$<HTMLSelectElement>('#m-category').value,kind=$<HTMLSelectElement>('#m-kind').value,variants=$<HTMLInputElement>('#m-variants').checked;
  const candidates=catalog.materials.filter(m=>{const p=catalog.packs.find(p=>p.id===m.packId)!;return (variants||m.primary)&&(!origin||m.origin===origin)&&(!author||p.author===author)&&(!kind||materialGroup(m)===kind)&&(!query||`${m.name} ${m.recipeSource?.parent??''} ${m.category} ${categoryKeywords(m.category)} ${p.author} ${p.name}`.toLowerCase().includes(query));});
  filtered=candidates.filter(m=>!cat||m.category===cat);
  $('#m-origins').innerHTML=[['','전체'],...Object.entries(ORIGIN_LABELS)].map(([value,label])=>`<button data-origin="${value}" aria-pressed="${origin===value}">${label} <span>${catalog.materials.filter(m=>!value||m.origin===value).length}</span></button>`).join('');
  $('#m-categories').innerHTML=['',...MATERIAL_CATEGORIES].map(value=>{const count=candidates.filter(m=>!value||m.category===value).length;return `<button data-category="${value}" aria-pressed="${cat===value}" ${!count&&cat!==value?'disabled':''}>${value||'전체 연출'} <span>${count}</span></button>`;}).join('');
  const pages=Math.max(1,Math.ceil(filtered.length/24));page=Math.max(0,Math.min(page,pages-1));const current=filtered.slice(page*24,(page+1)*24);
  $('#m-count').textContent=`${filtered.length}개 / 전체 ${catalog.materials.length}개`;$('#m-page').textContent=`${page+1} / ${pages}`;$<HTMLButtonElement>('#m-prev').disabled=page===0;$<HTMLButtonElement>('#m-next').disabled=page===pages-1;
  $('#m-grid').innerHTML=current.length?current.map(m=>{const p=catalog.packs.find(p=>p.id===m.packId)!;return `<article class="m-card" data-material="${m.id}"><button data-add="${m.id}" title="${esc(materialName(m))} 조합에 추가" class="m-card-add"><div class="m-card-stage"><canvas width="160" height="160" aria-label="${esc(materialName(m))} 움직이는 미리보기"></canvas><span class="m-plus">＋</span><span class="m-group-tag">${GROUP_LABELS[materialGroup(m)]}</span></div><div class="m-card-copy"><span class="m-category-tag">${esc(m.category)}</span><h3>${esc(materialName(m))}</h3><small>${esc(m.recipeSource?.parent??p.author)} · ${m.frames.length}프레임${m.variant?' · '+esc(m.variant):''}</small></div></button><button class="m-card-info" data-info="${m.id}">프레임·출처 보기 ↗</button></article>`;}).join(''):'<p class="m-no-results">검색 결과가 없습니다. 검색어나 분류를 바꿔 보세요.</p>';
  tileObserver.disconnect();visibleTiles.clear();tileCursor=0;tiles=current.map((m,i)=>({m,layer:{...addMaterial(m),hold:0},canvas:root.querySelectorAll<HTMLCanvasElement>('#m-grid canvas')[i]}));for(const {m,canvas} of tiles){tileObserver.observe(canvas);if(!m.recipeSource)void loadMaterialImage(m.preview).catch(e=>note(e.message,true));}
}
const input=(l:MaterialLayer,key:keyof MaterialLayer,label:string,min:number,max:number,step=1)=>`<label>${label}<input type="number" data-field="${key}" min="${min}" max="${max}" step="${step}" value="${l[key]}" /></label>`;
function renderComposer(){
  byId=compositionMaterials(composition,new Map(catalog.materials.map(m=>[m.id,m])));durationRecipe=undefined;
  revision++;const expanded=lastSelected===selected?[...root.querySelectorAll<HTMLDetailsElement>('#m-editor details')].map(d=>d.open):undefined;
  const l=composition.layers.find(l=>l.id===selected)??composition.layers.at(-1);selected=l?.id??'';
  $('#m-layer-count').textContent=`${composition.layers.length} / 12`;$<HTMLInputElement>('#m-name').value=composition.name;$<HTMLSelectElement>('#m-size').value=String(composition.size);$<HTMLInputElement>('#m-fps').value=String(composition.fps);$<HTMLInputElement>('#m-display').value=String(composition.displaySize);
  $<HTMLButtonElement>('#m-undo').disabled=!history.length;$<HTMLButtonElement>('#m-redo').disabled=!future.length;$('#m-empty').hidden=composition.layers.length>0;
  $('#m-layers').innerHTML=composition.layers.map((layer,i)=>`<div class="m-layer ${layer.id===selected?'selected':''}"><button data-select="${layer.id}"><span>${i+1}</span><strong>${esc(materialName(byId.get(layer.materialId)!))}</strong><small>${layer.enabled?layer.start.toFixed(2)+'초':'숨김'}</small></button><button data-visible="${layer.id}" aria-label="레이어 ${i+1} 표시 전환">${layer.enabled?'◉':'○'}</button></div>`).join('');
  if(!l){$('#m-editor').innerHTML='<p class="m-editor-hint">재료마다 시작 시각을 다르게 주면<br />예고 → 타격 → 잔상 순서로 이어집니다.</p>';return;}
  const m=byId.get(l.materialId)!,p=catalog.packs.find(p=>p.id===m.packId)!;
  $('#m-editor').innerHTML=`<div class="m-selection"><strong>선택한 재료</strong><div class="m-actions"><button data-layer-action="up">위로</button><button data-layer-action="down">아래로</button><button data-layer-action="duplicate">복제</button><button data-layer-action="remove">삭제</button></div></div>
  <details open class="m-settings"><summary>사용할 구간·시간</summary><div class="m-fields">${input(l,'from','시작 프레임',1,m.frames.length)}${input(l,'to','끝 프레임',l.from,m.frames.length)}${input(l,'start','출발 시각 (초)',0,30,.05)}${input(l,'speed','재생 속도',.1,4,.1)}${input(l,'hold','마지막 프레임 유지 (초)',0,10,.05)}${input(l,'fadeOut','사라지는 시간 (초)',0,5,.05)}${input(l,'fadeIn','나타나는 시간 (초)',0,5,.05)}</div><label class="m-check"><input data-field="reverse" type="checkbox" ${l.reverse?'checked':''}/> 역재생</label><p>${esc(m.timing)} · 선택 구간 ${sourceDuration(l,m).toFixed(2)}초</p></details>
  <details class="m-settings"><summary>위치·크기·회전</summary><div class="m-fields">${input(l,'x','가로 위치 (0~1)',0,1,.01)}${input(l,'y','세로 위치 (0~1)',0,1,.01)}${input(l,'scale','크기',.05,1.5,.05)}${input(l,'endScale','마지막 크기 배율',.05,3,.05)}${input(l,'rotation','시작 각도',-180,180,5)}${input(l,'spin','재생 중 회전량',-1080,1080,15)}</div><label class="m-check"><input data-field="flipX" type="checkbox" ${l.flipX?'checked':''}/> 좌우 반전</label></details>
  <details class="m-settings"><summary>색·합성·기준점</summary><div class="m-fields">${input(l,'hue','색상 회전',-180,180,5)}${input(l,'opacity','불투명도',0,1,.05)}<label>합성<select data-field="blend">${[['normal','일반'],['add','빛 더하기'],['screen','스크린']].map(([v,t])=>`<option value="${v}" ${l.blend===v?'selected':''}>${t}</option>`).join('')}</select></label>${input(l,'pivotX','원본 기준점 X',0,1,.01)}${input(l,'pivotY','원본 기준점 Y',0,1,.01)}</div></details>
  <div class="m-source-note">${esc(p.author)} · ${esc(p.license)}${m.edgeFrames.length?'<p>원본의 일부 프레임이 셀 경계에 닿습니다. 전체 프레임에서 확인하세요.</p>':''}<button data-info="${m.id}">전체 프레임·원본·출처</button></div>`;
  lastSelected=selected;if(expanded)root.querySelectorAll<HTMLDetailsElement>('#m-editor details').forEach((d,i)=>{d.open=expanded[i]??d.open;});
}
function sourceInfo(m:Material){
  const ticket=++sourceRevision;
  if(m.recipeSource){
    const s=m.recipeSource;$('#m-source-title').textContent=s.name;
    $('#m-source-body').innerHTML=`<p>${esc(s.parent)} · ${GROUP_LABELS[s.group]} · ${esc(s.category)}</p><p>${m.width} × ${m.height}px · ${m.frames.length}프레임 · ${esc(m.timing)}</p><p>조합에 넣으면 현재 모습과 노드 연결이 함께 보관됩니다. 레시피 JSON은 공방에서 다시 편집할 수 있습니다.</p><div class="m-frame-export"><button data-add="${m.id}">조합에 추가</button><button data-component="${m.id}">공방 노드 부품함에 저장</button><button data-recipe="${m.id}">레시피 JSON 저장</button><label>낱장 프레임<input id="m-single-index" type="number" min="1" max="${m.frames.length}" value="${m.firstVisible+1}" /></label><button data-single="${m.id}">이 프레임 PNG + 출처 ZIP</button></div><p>밝은 회색·초록 배경의 전체 프레임</p><canvas id="m-recipe-contact" class="m-contact" width="640" height="${Math.ceil(m.frames.length/8)*96}" aria-label="공방 재료 전체 프레임"></canvas>`;
    $<HTMLDialogElement>('#m-source').showModal();
    const canvas=$<HTMLCanvasElement>('#m-recipe-contact'),ctx=canvas.getContext('2d')!;
    void (async()=>{for(let i=0;i<m.frames.length;i++){
      if(ticket!==sourceRevision||!canvas.isConnected)return;
      const im=await materialFrameCanvas(m,i),x=i%8*80,y=Math.floor(i/8)*96;
      ctx.fillStyle=i%2?'#b5d2bc':'#d5d8dc';ctx.fillRect(x,y,80,96);ctx.drawImage(im,x,y,80,80);ctx.fillStyle='#18251d';ctx.font='12px sans-serif';ctx.fillText(String(i+1),x+4,y+91);
      if(i%4===3)await new Promise(r=>setTimeout(r,0));
    }})().catch(e=>note(e.message,true));return;
  }
  const p=catalog.packs.find(p=>p.id===m.packId)!;$('#m-source-title').textContent=materialName(m);
  $('#m-source-body').innerHTML=`<p>${m.width} × ${m.height}px · ${m.frames.length}프레임 · ${esc(m.timing)}</p><p>${esc(p.credit)} · <a href="${esc(p.url)}" target="_blank" rel="noopener">배포 페이지 ↗</a> · <a href="${esc(p.licenseUrl)}" target="_blank" rel="noopener">${esc(p.license)} ↗</a></p><p>${esc(m.changes)}. 기준점은 원본 캔버스 중심이며 조합에서 조절할 수 있습니다.</p>${m.edgeFrames.length?`<p class="m-warning">원본 경계 접촉: ${m.edgeFrames.slice(0,30).join(', ')}${m.edgeFrames.length>30?'…':''}번. 추가 여백으로 원본의 잘린 그림을 복원하지는 않습니다.</p>`:''}<div class="m-frame-export"><label>낱장 프레임<input id="m-single-index" type="number" min="1" max="${m.frames.length}" value="${Math.min(m.frames.length,m.firstVisible+1)}" /></label><button data-single="${m.id}">이 프레임 PNG + 출처 ZIP</button><button data-add="${m.id}">조합에 추가</button></div><img class="m-contact" loading="lazy" src="${materialUrl(m.contact)}" alt="밝은 회색과 초록 배경에 나열한 모든 원본 프레임"/>`;
  $<HTMLDialogElement>('#m-source').showModal();
}
function showHelp(){
  $('#m-info-body').innerHTML=`<ol><li><b>전체·무료 팩·공방 예제·내 작품·구성 부품</b>으로 출처를 고르고 연출 분류를 선택하세요. 새로 저장한 공방 작품과 부품도 자동으로 반영됩니다.</li><li>재료 카드를 눌러 조합에 추가하세요. 위에 있는 레이어부터 그리며 마지막 레이어가 앞에 보입니다.</li><li><b>시작·끝 프레임</b>으로 필요한 구간만 고르고, <b>출발 시각</b>으로 연출 순서를 정하세요.</li><li><b>색·크기·회전·사라지는 시간</b>을 조절하고 밝은 배경과 전장에서 확인하세요.</li><li><b>게임용 ZIP</b>에는 투명 PNG 시트, 프레임 좌표·기준점 JSON, 조합 JSON, CREDITS.txt가 들어갑니다.</li></ol><p>합쳐진 PNG에서 원래 불꽃·연기 레이어를 자동 복구하는 기능은 아닙니다. 낱장 프레임과 구간을 나누고, 제공된 원본 프로젝트(AI·EPS·Blend·SMP·Spine 등)는 원본 ZIP에 그대로 보관했습니다.</p><p>개인 재료함은 이 컴퓨터의 공방에서 사용합니다. unTied·CraftPix 원본을 다른 사람에게 소재 모음이나 내보내기 도구로 배포하지 마세요. 게임에 넣는 출력물에는 필요한 크레딧을 함께 적용하세요. CodeManu는 페이지의 라이선스 표시가 달라 CC BY 4.0 기준의 크레딧을 포함했습니다.</p><p>조합 JSON에는 사용한 공방 레시피도 함께 들어갑니다. 무료 PNG는 이 컴퓨터의 원본 팩을 참조합니다. 공방 재료의 프레임·출처 화면에서 레시피 JSON을 받거나 노드 부품함에 저장할 수 있습니다. 게임에는 PNG 출력물을 사용합니다.</p><h3>수집한 ${freeCatalog?.packs.length??0}개 팩과 공방</h3><div class="m-license-list">${catalog.packs.map(p=>`<div><strong>${esc(p.name)}</strong><span>${esc(p.author)} · ${esc(p.license)}</span><a href="${esc(p.url)}" target="_blank" rel="noopener">배포 페이지</a> ${p.archives.map((a,i)=>`<a href="${materialUrl(a)}" download>원본 받기${p.archives.length>1?' '+(i+1):''}</a>`).join(' ')}</div>`).join('')}</div>${catalog.pending.length?`<h3>원본만 보관한 항목</h3>${catalog.pending.map(p=>`<p>${esc(p.name)} — ${esc(p.reason)}</p>`).join('')}`:''}`;
  $<HTMLDialogElement>('#m-info').showModal();
}
function suggested(kind:string){
  const find=(words:RegExp)=>catalog.materials.find(m=>m.primary&&m.kind==='animation'&&words.test(m.packId+' '+m.name))??catalog.materials.find(m=>m.primary&&m.kind==='animation')!;
  const names=kind==='slash'?['번개 참격',/slash-sprite/i,/electric|lightning/i,/impact/i]:kind==='magic'?['마법 발동',/magic[ _]circle|rune|ring/i,/magic|sparkle/i,/explosion/i]:['화염 폭발',/spark|flash/i,/explosion[ _]001/i,/smoke/i];
  const chosen=(names.slice(1) as RegExp[]).map(find);
  commit(()=>{composition=emptyComposition();composition.name=String(names[0]);composition.layers=chosen.map((m,i)=>({...addMaterial(m),start:[0,.12,.3][i],scale:[.35,.65,.75][i],speed:i===2?1.4:1.8,opacity:i===2?.65:1,fadeOut:.18,blend:i===2?'normal':'add'}));selected=composition.layers[1].id;});cursor=0;note('추천 조합을 열었습니다. 구간과 색을 바꿔 원하는 느낌으로 다듬으세요.');
}
async function singleFrame(m:Material){
  const index=Math.max(0,Math.min(m.frames.length-1,Math.floor(Number($<HTMLInputElement>('#m-single-index').value)||1)-1)),c=await materialFrameCanvas(m,index);
  const one=emptyComposition();one.layers=[addMaterial(m)];saveBlob(await zipFiles([{name:'frame.png',blob:await pngBlob(c)},{name:'frame.json',blob:jsonBlob({source:m.id,index:index+1,padding:m.padding,width:m.width,height:m.height,pivot:{x:m.width/2+m.padding,y:m.height/2+m.padding},background:'transparent'})},{name:'CREDITS.txt',blob:new Blob([creditsFor(one,catalog)],{type:'text/plain;charset=utf-8'})}]),'effect-frame.zip');note('낱장 PNG와 출처를 저장했습니다.');
}
root.addEventListener('click',async event=>{
  const button=(event.target as HTMLElement).closest<HTMLButtonElement>('button');if(!button)return;
  try {
    if(button.dataset.close){$<HTMLDialogElement>('#'+button.dataset.close).close();return;}
    if(!catalog)return;
    if(button.dataset.origin!==undefined){origin=button.dataset.origin;page=0;renderGallery();return;}
    if(button.dataset.category!==undefined){$<HTMLSelectElement>('#m-category').value=button.dataset.category;page=0;renderGallery();return;}
    if(button.dataset.recipe){const s=byId.get(button.dataset.recipe)!.recipeSource!;saveBlob(jsonBlob(s.recipe),s.name+'.effect.json');return;}
    if(button.dataset.component){
      const s=byId.get(button.dataset.component)!.recipeSource!,items=readComponents(localStorage);
      if(items.some(p=>p.id===s.id)){note('이미 공방 노드 부품함에 보관한 재료입니다.');return;}
      writeComponents(localStorage,[...items,{id:s.id,name:s.name.slice(0,80),category:s.category,origin:s.parent.slice(0,80),recipe:s.recipe}]);
      refreshLibrary();note('공방의 노드 화면 → 부품 보관함 → 내 부품에서 꺼낼 수 있습니다.');return;
    }
    if(button.dataset.add){add(byId.get(button.dataset.add)!);return;}
    if(button.dataset.info){sourceInfo(byId.get(button.dataset.info)!);return;}
    if(button.dataset.single){await singleFrame(byId.get(button.dataset.single)!);return;}
    if(button.dataset.select){selected=button.dataset.select;renderComposer();return;}
    if(button.dataset.visible){commit(()=>{const l=composition.layers.find(l=>l.id===button.dataset.visible)!;l.enabled=!l.enabled;});return;}
    if(button.dataset.preset){suggested(button.dataset.preset);return;}
    if(button.dataset.position){battle?.setPosition(170,button.dataset.position==='top'?128:255);battleKey='';return;}
    if(button.dataset.layerAction){const i=composition.layers.findIndex(l=>l.id===selected);if(i<0)return;commit(()=>{const action=button.dataset.layerAction;if(action==='remove')composition.layers.splice(i,1);if(action==='duplicate'&&composition.layers.length<12){const l={...composition.layers[i],id:crypto.randomUUID()};composition.layers.splice(i+1,0,l);selected=l.id;}if(action==='up'&&i>0)[composition.layers[i-1],composition.layers[i]]=[composition.layers[i],composition.layers[i-1]];if(action==='down'&&i<composition.layers.length-1)[composition.layers[i+1],composition.layers[i]]=[composition.layers[i],composition.layers[i+1]];});return;}
    switch(button.id){
      case 'm-clear-filters':origin='';for(const id of ['m-search','m-pack','m-category','m-kind'])$<HTMLInputElement>('#'+id).value='';$<HTMLInputElement>('#m-variants').checked=true;page=0;renderGallery();break;
      case 'm-prev':page--;renderGallery();break;case 'm-next':page++;renderGallery();$('#m-grid').scrollIntoView({block:'start'});break;
      case 'm-play':running=!running;button.textContent=running?'Ⅱ 일시정지':'▶ 재생';break;
      case 'm-reset':commit(()=>{composition=emptyComposition();selected='';});cursor=0;note('조합을 비웠습니다. 되돌리기로 복원할 수 있습니다.');break;
      case 'm-undo':if(history.length&&!busy){future.push(JSON.stringify(composition));composition=JSON.parse(history.pop()!);persist();renderComposer();}break;
      case 'm-redo':if(future.length&&!busy){history.push(JSON.stringify(composition));composition=JSON.parse(future.pop()!);persist();renderComposer();}break;
      case 'm-help':showHelp();break;case 'm-back-library':$('.m-library').scrollIntoView({block:'start'});break;
      case 'm-save':saveBlob(jsonBlob(composition),composition.name+'.material.json');note('재료 조합 JSON을 저장했습니다.');break;
      case 'm-load':$<HTMLInputElement>('#m-file').click();break;
      case 'm-battle':$<HTMLDialogElement>('#m-battle-dialog').showModal();battleElapsed=0;battle??=await createBattlePreview($('#m-battle-host'));break;
      case 'm-battle-pause':battleRunning=!battleRunning;button.textContent=battleRunning?'일시정지':'재생';break;
      case 'm-export':if(busy)return;busy=true;button.disabled=true;try{const blob=await exportComposition(structuredClone(composition),catalog,s=>note(s));saveBlob(blob,composition.name+'.zip');note('게임용 PNG 시트·좌표 JSON·조합·출처를 ZIP으로 저장했습니다.');}finally{busy=false;button.disabled=false;}break;
    }
  }catch(e){note((e as Error).message,true);}
});
root.addEventListener('change',event=>{
  const el=event.target as HTMLInputElement;if(!catalog)return;
  if(['m-pack','m-category','m-kind','m-variants'].includes(el.id)){page=0;renderGallery();return;}
  if(el.id==='m-bg'){root.dataset.background=el.value;return;}
  if(el.dataset.field){commit(()=>{const l=composition.layers.find(l=>l.id===selected);if(!l)return;const key=el.dataset.field!;(l as unknown as Record<string,unknown>)[key]=el.type==='checkbox'?el.checked:key==='blend'?el.value:Number(el.value);});return;}
  if(['m-name','m-size','m-fps','m-display'].includes(el.id))commit(()=>{if(el.id==='m-name')composition.name=el.value;else if(el.id==='m-size')composition.size=Number(el.value);else if(el.id==='m-fps')composition.fps=Number(el.value);else composition.displaySize=Number(el.value);});
  if(el.id==='m-file'){const file=el.files?.[0];if(!file)return;if(file.size>MAX_COMPOSITION_BYTES){note('조합 JSON은 2MB 이하만 읽습니다.',true);return;}void file.text().then(text=>{const next=parseComposition(JSON.parse(text),byId);commit(()=>{composition=next;selected='';});note('재료 조합을 불러왔습니다.');}).catch(e=>note(e.message,true));el.value='';}
});
$('#m-search').addEventListener('input',()=>{page=0;renderGallery();});
$('#m-time').addEventListener('input',()=>{running=false;$<HTMLButtonElement>('#m-play').textContent='▶ 재생';cursor=Number($<HTMLInputElement>('#m-time').value);});
$('#m-battle-time').addEventListener('input',()=>{battleElapsed=Number($<HTMLInputElement>('#m-battle-time').value);battleRunning=false;$('#m-battle-pause').textContent='재생';});
function animate(now:number){
  if(!alive)return;
  const dt=Math.min(.1,(now-last)/1000);last=now;
  if(catalog&&!document.hidden){
    if(running){elapsed+=dt;cursor=(cursor+dt)%(duration()+.3);}const d=duration(),time=Math.min(cursor,Math.max(0,d-1e-6));
    if(now-frameClock>33){
      frameClock=now;const started=performance.now();let checked=0;
      while(checked++<tiles.length&&performance.now()-started<8){const {m,layer,canvas}=tiles[tileCursor++%tiles.length];if(!visibleTiles.has(canvas))continue;const s=sampleMaterial(layer,m,elapsed%m.duration),frame=s?.index??0;if(canvas.dataset.frame===String(frame))continue;const ctx=canvas.getContext('2d')!;ctx.clearRect(0,0,160,160);if(drawMaterialPreview(ctx,m,frame,160)){canvas.dataset.ready='true';canvas.dataset.frame=String(frame);}}
      const key=`${revision}:${Math.floor(time*composition.fps)}`;
      if(!previewBusy&&key!==previewKey){previewBusy=true;const snapshot=composition;void prepareComposition(snapshot,byId,time,false).then(images=>{if(!alive||snapshot!==composition)return;drawComposition($<HTMLCanvasElement>('#m-preview'),snapshot,byId,time,false,images);previewKey=key;}).catch(e=>note(e.message,true)).finally(()=>previewBusy=false);}
      $<HTMLInputElement>('#m-time').max=String(d);$<HTMLInputElement>('#m-time').value=String(time);$('#m-time-label').textContent=`${time.toFixed(2)} / ${d.toFixed(2)}초`;
    }
    if(battle&&$<HTMLDialogElement>('#m-battle-dialog').open){
      if(battleRunning)battleElapsed+=dt*Number($<HTMLSelectElement>('#m-battle-speed').value);
      $<HTMLInputElement>('#m-battle-time').max=String(d);$<HTMLInputElement>('#m-battle-time').value=String(Math.min(d,battleElapsed%(d+.3)));$('#m-battle-time-label').textContent=Math.min(d,battleElapsed%(d+.3)).toFixed(2)+'초';
      const key=`${revision}:${Math.floor((battleElapsed%(d+.3))*composition.fps)}`;
      if(!battleBusy&&now-battleLast>80&&key!==battleKey){battleBusy=true;battleLast=now;const snapshot=structuredClone(composition),t=battleElapsed%(d+.3);
        void prepareComposition(snapshot,byId,t,true).then(images=>{if(!alive||!$<HTMLDialogElement>('#m-battle-dialog').open)return;const c=document.createElement('canvas');c.width=c.height=snapshot.size;drawComposition(c,snapshot,byId,t,true,images);const art=createSkillFrame(c,{x:0,y:0,width:c.width,height:c.height,pivot:{x:c.width/2,y:c.height/2},background:'transparent'});const recipe=createPreset('slash');recipe.placement.displaySize=snapshot.displaySize;battle!.draw({canvas:c,art,touchesEdge:touchesCanvasEdge(c),visible:true,index:0},recipe);battleArt?.texture.destroy(true);battleArt=art;battleKey=key;$('#m-battle-host').dataset.time=String(t);}).catch(e=>note(e.message,true)).finally(()=>battleBusy=false);
      }
    }
  }
  raf=requestAnimationFrame(animate);
}
function refreshLibrary():string[]{
    const result=unifiedMaterials(freeCatalog,localStorage);catalog=result.catalog;
    byId=compositionMaterials(composition,new Map(catalog.materials.map(m=>[m.id,m])));
    $('#m-stats').innerHTML=`<div><b>${catalog.materials.length}</b><span>전체 재료</span></div><div><b>${freeCatalog?.materials.length??0}</b><span>무료 재료</span></div><div><b>${catalog.stats.presets+catalog.stats.works}</b><span>예제·내 작품</span></div><div><b>${catalog.stats.parts}</b><span>구성 부품</span></div>`;
    for(const [id,values,label] of [['m-pack',[...new Set(catalog.packs.map(p=>p.author))].sort(),'모든 제작자'],['m-category',MATERIAL_CATEGORIES,'모든 연출']] as const){const el=$<HTMLSelectElement>('#'+id),value=el.value;el.innerHTML=`<option value="">${label}</option>`+values.map(a=>`<option>${esc(a)}</option>`).join('');el.value=value;}
    renderGallery();renderComposer();return result.warnings;
}
async function start(){
  let connectionWarning='';
  try{const response=await fetch('/__materials/catalog.json');if(!response.ok)throw Error('무료 팩 원본을 연결하지 못했습니다. 이 컴퓨터의 이펙트공방열기.cmd로 열어 주세요.');freeCatalog=await response.json();if(freeCatalog?.format!=='gd.material-catalog@1'){freeCatalog=undefined;throw Error('무료 재료 목록 형식을 확인하세요.');}}
  catch(e){connectionWarning=(e as Error).message;}
  try{
    const warnings=refreshLibrary();
    const saved=localStorage.getItem(MATERIAL_STORAGE);let storageError='';if(saved){try{composition=parseComposition(JSON.parse(saved),byId);}catch(e){storageHealthy=false;storageError='저장된 조합을 읽지 못했습니다. 원본은 보존했으며 새 편집은 조합 JSON으로 저장해 주세요. '+(e as Error).message;}}
    renderComposer();const errors=[connectionWarning,storageError,...warnings].filter(Boolean);if(errors.length)note(errors.join(' '),true);else note('모든 보관 재료를 분류했습니다. 카드를 누르면 조합에 추가됩니다. 공방 작품을 저장하면 이 목록에도 반영됩니다.');
  }catch(e){note((e as Error).message,true);}
  raf=requestAnimationFrame(animate);
}
window.addEventListener('pagehide',e=>{if(e.persisted)return;alive=false;mobileFilters.removeEventListener('change',adaptFilters);cancelAnimationFrame(raf);tileObserver.disconnect();battle?.destroy();battleArt?.texture.destroy(true);});
document.addEventListener('visibilitychange',()=>{last=performance.now();});
window.addEventListener('storage',e=>{if(e.key===STORAGE_KEY||e.key===COMPONENT_STORAGE){const warnings=refreshLibrary();note(warnings.join(' ')||'새로 저장한 작품과 부품을 재료함에 반영했습니다.',warnings.length>0);}});
void start();
