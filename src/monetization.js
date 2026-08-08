const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers}});
const paymentLiveFrom=env=>String(env.CARDCRAFT_MONETIZATION_MODE||'demo').toLowerCase()==='live'&&!!env.PORTONE_API_SECRET;
const adLiveFrom=env=>String(env.CARDCRAFT_REWARDED_AD_LIVE||'false').toLowerCase()==='true';

const productCatalog=env=>({
  'png-download':{id:'png-download',name:'Cardcraft 고해상도 PNG 다운로드',amount:Math.max(100,Number(env.CARDCRAFT_PNG_PRICE||env.CARDCRAFT_DOWNLOAD_PRICE)||1900),currency:'KRW',androidProductId:'cardcraft_export_png'},
  'vector-source':{id:'vector-source',name:'Cardcraft 편집용 벡터 원본 패키지',amount:Math.max(100,Number(env.CARDCRAFT_SOURCE_PRICE)||3900),currency:'KRW',androidProductId:'cardcraft_export_source'}
});
function resolveProduct(id,env){const products=productCatalog(env);return products[String(id||'png-download').trim()]||null;}
function randomId(prefix='cc'){
  const id=globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}_${id.replace(/-/g,'')}`;
}
async function readJson(request){try{return await request.json();}catch{return null;}}
async function verifyPortOne(paymentId,env){
  const response=await fetch(`https://api.portone.io/payments/${encodeURIComponent(paymentId)}`,{headers:{Authorization:`PortOne ${env.PORTONE_API_SECRET}`,'Content-Type':'application/json'}});
  let data={};try{data=await response.json();}catch{}
  if(!response.ok)throw new Error(data?.message||`PORTONE_${response.status}`);
  return data;
}

export async function handleMonetizationRequest(request,env,headers={}){
  const pathname=new URL(request.url).pathname;
  if(!pathname.startsWith('/api/session')&&!pathname.startsWith('/api/payments/')&&!pathname.startsWith('/api/rewards/'))return null;

  if(pathname==='/api/session'){
    if(request.method!=='GET')return json({error:'METHOD_NOT_ALLOWED'},405,headers);
    const paymentLive=paymentLiveFrom(env),adLive=adLiveFrom(env),products=productCatalog(env);
    return json({ok:true,mode:paymentLive&&adLive?'live':paymentLive||adLive?'mixed':'demo',price:products['png-download'].amount,currency:'KRW',paymentLive,adLive,products},200,headers);
  }

  if(pathname==='/api/payments/orders'){
    if(request.method!=='POST')return json({error:'METHOD_NOT_ALLOWED'},405,headers);
    const body=await readJson(request);if(!body)return json({error:'INVALID_JSON'},400,headers);
    const product=resolveProduct(body.product,env);if(!product)return json({error:'INVALID_PRODUCT'},400,headers);
    return json({ok:true,paymentId:randomId('cardcraft'),product:product.id,orderName:product.name,amount:product.amount,currency:product.currency,androidProductId:product.androidProductId},200,headers);
  }

  if(pathname==='/api/payments/complete'){
    if(request.method!=='POST')return json({error:'METHOD_NOT_ALLOWED'},405,headers);
    const body=await readJson(request),paymentId=String(body?.paymentId||'').trim(),product=resolveProduct(body?.product,env);
    if(!paymentId)return json({error:'PAYMENT_ID_REQUIRED'},400,headers);
    if(!product)return json({error:'INVALID_PRODUCT'},400,headers);
    if(!paymentLiveFrom(env))return json({ok:true,granted:true,mode:'demo',paymentId,product:product.id},200,headers);
    try{
      const payment=await verifyPortOne(paymentId,env),paidAmount=Number(payment?.amount?.total??payment?.amount?.paid??0),expected=product.amount;
      if(payment?.status!=='PAID')return json({error:'PAYMENT_NOT_PAID',status:payment?.status||'UNKNOWN'},409,headers);
      if(paidAmount!==expected)return json({error:'PAYMENT_AMOUNT_MISMATCH',expected,paidAmount,product:product.id},409,headers);
      return json({ok:true,granted:true,mode:'live',paymentId,product:product.id},200,headers);
    }catch(error){
      console.error('Cardcraft payment verification failed',error);
      return json({error:'PAYMENT_VERIFY_FAILED',message:String(error?.message||'verification failed').slice(0,160)},502,headers);
    }
  }

  if(pathname==='/api/rewards/verify'){
    if(request.method!=='POST')return json({error:'METHOD_NOT_ALLOWED'},405,headers);
    return json({ok:true,granted:true,verification:'web-client-reward-event'},200,headers);
  }
  return null;
}
