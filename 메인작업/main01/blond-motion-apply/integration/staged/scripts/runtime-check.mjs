import {createServer} from 'vite';
const root=new URL('../',import.meta.url).pathname.replace(/^\/(\w:)/,'$1');
for(const layout of ['portrait','landscape']){globalThis.location=new URL(layout==='landscape'?'http://test/battle-landscape.html':'http://test/index.html');const s=await createServer({root:decodeURI(root),configFile:false,logLevel:'error',server:{middlewareMode:true,watch:null,hmr:false}});try{const {checkRuntimeMotion}=await s.ssrLoadModule('/tests/runtime-motion.check.ts');const r=checkRuntimeMotion();console.log(layout,r.length,'PASS');}finally{await s.close();}}
