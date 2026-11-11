// Keep the archived prototype available explicitly; normal entry opens the live game.
const params=new URLSearchParams(location.search);
if(params.get('mock')==='1')void import('./battle-landscape-preview');
else{const url=new URL('battle-landscape.html',location.href);url.searchParams.set('battle',params.get('battle')==='infinite-test'?'infinite-test':'normal');url.searchParams.set('from','camp');location.replace(url.href);}
export {};
