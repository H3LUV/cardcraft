import app from './index.js';
import { handleMonetizationRequest } from './monetization.js';

function cors(request,env){
  const configured=String(env.ALLOWED_ORIGIN||'*').trim();
  const origin=request.headers.get('Origin')||'';
  const allow=configured==='*'?'*':configured.split(',').map(v=>v.trim()).includes(origin)?origin:configured.split(',')[0];
  return{'Access-Control-Allow-Origin':allow||'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'};
}

export default {
  async fetch(request,env,ctx){
    const headers=cors(request,env);
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
    const monetization=await handleMonetizationRequest(request,env,headers);
    if(monetization)return monetization;
    return app.fetch(request,env,ctx);
  }
};
