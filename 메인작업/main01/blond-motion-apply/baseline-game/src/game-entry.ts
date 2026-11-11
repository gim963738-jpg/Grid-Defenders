import {campPageUrl,launchMode} from './campProgress';
const search=new URLSearchParams(location.search);
if(launchMode(location.search)||search.get('battle')==='manual'){
 if(launchMode(location.search))document.querySelector<HTMLElement>('#game-start')!.hidden=true;
 document.body.style.visibility='visible';
 void import('./main').catch(error=>{console.error(error);const p=document.createElement('p');p.textContent='전장을 불러오지 못했습니다. ';const a=document.createElement('a');a.href=campPageUrl(location.href);a.textContent='캠프로 돌아가기';p.append(a);document.body.prepend(p);});
}else location.replace(campPageUrl(location.href));
