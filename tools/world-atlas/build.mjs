import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8').replace(/^\uFEFF/,''));
const write=(p,text)=>{fs.mkdirSync(path.dirname(path.join(root,p)),{recursive:true});fs.writeFileSync(path.join(root,p),text);};
const canonPath='자료/세계관/세계관설정.json',bookPath='문서/02_세부기획/00_세계관/세계관설정집.md',atlasFolder='output/world/atlas';
const data=read(canonPath);
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
const png=fs.readFileSync(path.join(root,data.map.image));
if(png.subarray(1,4).toString()!=='PNG')throw Error('Expected native PNG map');
data.map.actual_native_size=[png.readUInt32BE(16),png.readUInt32BE(20)];
data.map.sha256=sha(data.map.image);data.map.source_sha256=sha(data.map.source_image);
write(canonPath,JSON.stringify(data,null,2)+'\n');
const e=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const rel=(from,to)=>path.posix.relative(from,to);
const factionName=id=>id===null?'중립':data.factions.find(f=>f.id===id).name;
const entityName=id=>data.regions.find(r=>r.id===id)?.name||data.capitals.find(c=>c.id===id)?.name||(data.organizations||[]).find(o=>o.id===id)?.name||data.families.find(f=>f.id===id)?.name||(data.peoples||[]).find(p=>p.id===id)?.name||(data.landmarks||[]).find(l=>l.id===id)?.name||id;
const tables={
 overview:{headers:['대륙','국가와 거점','주요 성격'],rows:data.regions.map(r=>[r.continent,r.name,r.theme])},
 capitals:{headers:['수도','성격','역할'],rows:data.capitals.map(c=>[c.name,c.kind,c.role])},
 factions:{headers:['세력','중심','정치적 지향'],rows:data.factions.filter(f=>f.region_id==='central').map(f=>[f.name,f.seat,f.position])},
 organizations:{headers:['세력','거점과 지위','마법사 소속 기준'],rows:(data.organizations||[]).map(o=>[o.name,entityName(o.location_city_id)+' · '+o.political_status,o.membership_rule])},
 families:{headers:['가문','정치적 입장','왕국과의 관계','전문 마법'],rows:data.families.map(f=>[f.name,factionName(f.faction_id),f.kingdom_relationship,f.magic.description])},
 tribes:{headers:['부족','대외 기조','주력','함께 보유한 전력'],rows:data.tribes.map(t=>[t.name,t.diplomacy,t.majority,t.id==='harban'?'우르칸에서 넘어온 일부 주술사':'하르반보다 적은 규모의 무투 전사'])},
 deities:{headers:['신','신앙 주체','신앙에서의 성격'],rows:data.deities.map(d=>[d.name,d.worshipper,d.description])},
 relations:{headers:['대상','관계','내용'],rows:data.relations.map(r=>[r.parties.map(entityName).join(' ↔ '),r.layer?r.layer+' · '+r.status:r.status,r.description])},
 peoples:{headers:['민족','거점','국력 비교','교류와 성향'],rows:(data.peoples||[]).map(p=>[p.name,entityName(p.home_landmark_id),p.power_summary,p.exchange_summary])}
};
for(const region of data.regions){
 const sectTypes=region.martial_organization?.sect_types;
 if(sectTypes)tables['sects_'+region.id]={headers:['문파 계열','문파 수'],rows:sectTypes.map(s=>[s.discipline+' 문파',s.count+'개'])};
 const factions=data.factions.filter(f=>f.region_id===region.id);
 if(factions.length)tables['factions_'+region.id]={headers:['세력','정치적 입장'],rows:factions.map(f=>[f.name,f.position])};
 const divisions=(data.regional_divisions||[]).filter(d=>d.region_id===region.id);
 if(divisions.length)tables['divisions_'+region.id]={headers:['구역','방향'],rows:divisions.map(d=>[d.name,d.direction_label])};
}
const mdTable=t=>['| '+t.headers.join(' | ')+' |','|'+t.headers.map(()=>'---').join('|')+'|',...t.rows.map(row=>'| '+row.map(c=>String(c).replaceAll('|','\\|')).join(' | ')+' |')].join('\n');
const htmlTable=t=>'<div class="table-wrap"><table><thead><tr>'+t.headers.map(h=>'<th scope="col">'+e(h)+'</th>').join('')+'</tr></thead><tbody>'+t.rows.map(row=>'<tr>'+row.map(c=>'<td>'+e(c)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
const characterText=data.character_placement_policy.description;
const namesText='작은 마법 수도의 표준명은 아르케리온이다. 이전 제작물의 아르켈리온·하르케리온 표기는 이 도시를 가리키는 이전 표기로 보관한다.';
const geographyText='중앙대륙의 큰 도시는 발레시온이며, 그 북동쪽의 작은 마법도시는 아르케리온이다. 독립 세력인 마탑은 아르케리온에 자리한다. 성휘 대교회는 발레시온의 도시 구역 안에 있다. 북서부의 거대한 이계 충돌 흔적과 '+(data.names.contaminatedRegion||'오염지대')+', 남동부의 차원 균열은 지도에 유지한다.'+(data.map.terrain_note?' '+data.map.terrain_note:'');
const mapLayoutText=data.map.layout_summary||'';
const easyText='↳ 쉽게 말하면: 중앙대륙 마법사의 기본 소속은 독립 세력인 마탑이다. 마탑을 떠나 왕국에 정착한 네 가문은 별도로 분류하며, 두 봉신가문 외 마법사들의 활동 자유는 유지된다.';
const bookRel=target=>rel(path.posix.dirname(bookPath),target);
let md='# '+data.title+'\n\n'+data.opening+'\n\n';
md+='[지도와 설정 열람](<'+bookRel(atlasFolder+'/index.html')+'>) · [지도 원본](<'+bookRel(data.map.image)+'>) · [구조화 설정](<'+bookRel(canonPath)+'>)\n\n';
md+='## 대륙 개관\n\n'+mdTable(tables.overview)+'\n\n';
for(const region of data.regions){
 md+='## '+region.continent+' '+region.name+'\n\n'+region.summary+'\n\n';
 for(const section of region.sections){
  md+='### '+section.title+'\n\n'+section.paragraphs.join('\n\n')+'\n\n';
  if(section.table_source)md+=mdTable(tables[section.table_source])+'\n\n';
  if(region.id==='central'&&section.title==='아르케리온의 충의와 자율')md+=easyText+'\n\n';
 }
}
if((data.peoples||[]).length){md+='## 엘프와 드워프 소수민족\n\n'+data.peoples_summary+'\n\n'+mdTable(tables.peoples)+'\n\n';for(const people of data.peoples)md+='### '+people.name+'\n\n'+people.paragraphs.join('\n\n')+'\n\n';}
md+='## 신앙과 국제 관계\n\n### 두 신앙의 신\n\n'+mdTable(tables.deities)+'\n\n### 주요 관계\n\n'+mdTable(tables.relations)+'\n\n';
md+='## 지도 읽기\n\n'+geographyText+'\n\n'+(mapLayoutText?mapLayoutText+'\n\n':'');
for(const landmark of data.landmarks||[])md+='### '+landmark.name+'\n\n'+landmark.location+'\n\n'+landmark.paragraphs.join('\n\n')+'\n\n';
md+='## 캐릭터 연결\n\n'+characterText+'\n\n## 지명 표준\n\n'+namesText+'\n';
write(bookPath,md);
const viewData={...data,tables,characterText,namesText,geographyText,mapLayoutText,easyText};
let template=fs.readFileSync(path.join(root,'tools/world-atlas/atlas.template.html'),'utf8');
for(const [key,value] of Object.entries({
 WORLD_DATA:JSON.stringify(viewData).replaceAll('<','\\u003c'),
 MAP_URL:rel(atlasFolder,data.map.image),
 MAP_WIDTH:data.map.actual_native_size[0],MAP_HEIGHT:data.map.actual_native_size[1],
 BOOK_HTML:'설정집.html',BOOK_MD:rel(atlasFolder,bookPath),
 CANON_URL:rel(atlasFolder,canonPath),
 GALLERY_URL:rel(atlasFolder,'output/characters/char001/gallery.html')
}))template=template.replaceAll('__'+key+'__',value);
write(atlasFolder+'/index.html',template);
const style=String.raw`*{box-sizing:border-box}body{margin:0;background:#f2efe8;color:#2c302f;font:16px/1.85 "Segoe UI","Malgun Gothic",sans-serif}main{max-width:960px;margin:auto;padding:32px 28px 64px;background:#fffdf8}h1{font-size:34px;line-height:1.35;margin:0 0 20px}h2{font-size:25px;line-height:1.45;margin:38px 0 16px;border-bottom:1px solid #dcd4c5;padding-bottom:8px}h3{font-size:19px;margin:25px 0 10px}p{margin:0 0 14px}a{color:#845823;text-underline-offset:3px}.links{display:flex;flex-wrap:wrap;gap:10px 18px;margin:0 0 24px}.map{display:block;width:100%;height:auto;max-height:760px;object-fit:contain;margin:20px 0}.table-wrap{overflow:auto;margin:15px 0 20px}table{border-collapse:collapse;width:100%;font-size:14px;line-height:1.7}th,td{border:1px solid #d8d1c4;text-align:left;vertical-align:top;padding:9px;overflow-wrap:anywhere}th{background:#eee8db}.easy{padding:12px 16px;background:#f4f0e5;border-left:3px solid #ac8645}@media(max-width:600px){main{padding:22px 15px 45px}h1{font-size:27px}h2{font-size:22px}th,td{padding:7px;font-size:12px}}@media print{body,main{background:white}main{max-width:none;padding:0}.links{display:none}h2,h3{break-after:avoid}.map{max-height:550px}tr{break-inside:avoid}a{color:inherit;text-decoration:none}}`;
let body='<h1>'+e(data.title)+'</h1><p>'+e(data.opening)+'</p><nav class="links"><a href="index.html">지도와 함께 보기</a><a href="'+e(rel(atlasFolder,bookPath))+'">Markdown 설정집</a><a href="'+e(rel(atlasFolder,data.map.image))+'">지도 원본</a></nav>';
body+='<a href="'+e(rel(atlasFolder,data.map.image))+'"><img class="map" src="'+e(rel(atlasFolder,data.map.image))+'" width="'+data.map.actual_native_size[0]+'" height="'+data.map.actual_native_size[1]+'" alt="오대륙 세계관 지도"></a><h2>대륙 개관</h2>'+htmlTable(tables.overview);
for(const region of data.regions){
 body+='<section id="'+region.id+'"><h2>'+e(region.continent+' '+region.name)+'</h2><p>'+e(region.summary)+'</p>';
 for(const section of region.sections){
  body+='<h3>'+e(section.title)+'</h3>'+section.paragraphs.map(p=>'<p>'+e(p)+'</p>').join('');
  if(section.table_source)body+=htmlTable(tables[section.table_source]);
  if(region.id==='central'&&section.title==='아르케리온의 충의와 자율')body+='<p class="easy">'+e(easyText)+'</p>';
 }
 body+='</section>';
}
if((data.peoples||[]).length){body+='<h2 id="peoples">엘프와 드워프 소수민족</h2><p>'+e(data.peoples_summary)+'</p>'+htmlTable(tables.peoples);for(const people of data.peoples)body+='<h3>'+e(people.name)+'</h3>'+people.paragraphs.map(p=>'<p>'+e(p)+'</p>').join('');}
body+='<h2>신앙과 국제 관계</h2><h3>두 신앙의 신</h3>'+htmlTable(tables.deities)+'<h3>주요 관계</h3>'+htmlTable(tables.relations);
for(const [title,text] of [['지도 읽기',geographyText],['캐릭터 연결',characterText],['지명 표준',namesText]]){
 body+='<h2>'+e(title)+'</h2><p>'+e(text)+'</p>';
 if(title==='지도 읽기'&&mapLayoutText)body+='<p>'+e(mapLayoutText)+'</p>';
 if(title==='지도 읽기')for(const landmark of data.landmarks||[])body+='<h3>'+e(landmark.name)+'</h3><p>'+e(landmark.location)+'</p>'+landmark.paragraphs.map(p=>'<p>'+e(p)+'</p>').join('');
}
write(atlasFolder+'/설정집.html','<!doctype html>\n<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+e(data.title)+'</title><style>'+style+'</style></head><body><main>'+body+'</main></body></html>\n');
write('output/world/current.json',JSON.stringify({title:data.title,version:data.version,updated_on:data.updated_on,map:data.map.image,map_version:data.map.version,map_sha256:data.map.sha256,atlas:atlasFolder+'/index.html',book_html:atlasFolder+'/설정집.html',book_markdown:bookPath,canon:canonPath},null,2)+'\n');
console.log(JSON.stringify({continents:data.regions.length,capitals:data.capitals.length,families:data.families.length,tribes:data.tribes.length,deities:data.deities.length,map:data.map.image,book:bookPath,atlas:atlasFolder+'/index.html'}));
