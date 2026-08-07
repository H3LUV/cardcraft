const FAMILIES=['minimal','institution','dual','bands','editorial','premium','travel','bold','split'];
const DIRECTIONS=['matched','refined','premium','contrast'];
const ORIENTATIONS=['horizontal','vertical'];
const POSITIONS=['top-right','bottom-right','bottom-left'];
const FONTS=['Noto Sans KR','Noto Serif KR','IBM Plex Sans KR','Gowun Dodum','Gowun Batang','Hahmlet','Nanum Gothic','Nanum Myeongjo','Black Han Sans','Do Hyeon','Jua','Gugi','Song Myung','Diphylleia','Bagel Fat One','Nanum Pen Script','Nanum Brush Script','Gaegu','Hi Melody','Single Day','Yeon Sung','East Sea Dokdo','Montserrat','Poppins','Raleway','Oswald','Space Grotesk','Bebas Neue','Archivo','Inter','Playfair Display','Cormorant Garamond','Cinzel','Bodoni Moda','DM Serif Display','Libre Baskerville','Caveat','Great Vibes','Dancing Script','Sacramento'];
const HEX=/^#[0-9a-f]{6}$/i;
const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers}});

function cors(request,env){
  const configured=String(env.ALLOWED_ORIGIN||'*').trim();
  const origin=request.headers.get('Origin')||'';
  const allow=configured==='*'?'*':configured.split(',').map(v=>v.trim()).includes(origin)?origin:configured.split(',')[0];
  return{'Access-Control-Allow-Origin':allow||'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'};
}
function safeString(v,max=300){return String(v??'').trim().slice(0,max);}
function pick(v,allowed,fallback){return allowed.includes(v)?v:fallback;}
function num(v,min,max,fallback){const n=Number(v);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback;}
function color(v,fallback){return HEX.test(String(v||''))?String(v).toLowerCase():fallback;}
function font(v,fallback){return FONTS.includes(v)?v:fallback;}
function bool(v){return v===true;}
function cleanInput(body){
  const business=body?.business||{},current=body?.current||{},profile=body?.localLogoAnalysis||{};
  const images=Array.isArray(body?.images)?body.images.slice(0,2).filter(x=>x&&['primary_logo','secondary_logo'].includes(x.role)&&typeof x.dataUrl==='string'&&/^data:image\/(png|jpeg|jpg|webp);base64,/i.test(x.dataUrl)&&x.dataUrl.length<1600000).map(x=>({role:x.role,dataUrl:x.dataUrl})):[];
  return{
    prompt:safeString(body?.prompt,800),mixOrientation:body?.mixOrientation!==false,
    business:{company:safeString(business.company,100),name:safeString(business.name,80),title:safeString(business.title,100),slogan:safeString(business.slogan,160),industry:safeString(business.industry,60),hasAddress:bool(business.hasAddress),hasWebsite:bool(business.hasWebsite),contactDensity:num(business.contactDensity,0,4,0)},
    current:{orientation:pick(current.orientation,ORIENTATIONS,'horizontal'),designFamily:pick(current.designFamily,[...FAMILIES,'auto'],'auto'),brandDirection:pick(current.brandDirection,DIRECTIONS,'matched'),palette:{primary:color(current.palette?.primary,'#2563eb'),secondary:color(current.palette?.secondary,'#0f766e'),accent:color(current.palette?.accent,'#f59e0b'),background:color(current.palette?.background,'#ffffff'),text:color(current.palette?.text,'#101828')},hasPrimaryLogo:bool(current.hasPrimaryLogo),hasSecondaryLogo:bool(current.hasSecondaryLogo)},
    localLogoAnalysis:{colors:Array.isArray(profile.colors)?profile.colors.filter(v=>HEX.test(v)).slice(0,4):[],shape:safeString(profile.shape,50),tags:Array.isArray(profile.tags)?profile.tags.map(v=>safeString(v,30)).slice(0,6):[],colorfulness:num(profile.colorfulness,0,100,0),brightness:num(profile.brightness,0,100,0),recommendedFamily:pick(profile.recommendedFamily,[...FAMILIES,''],'')},images
  };
}

const conceptSchema={
  type:'object',additionalProperties:false,
  properties:{
    id:{type:'string'},title:{type:'string'},subtitle:{type:'string'},rationale:{type:'string'},orientation:{type:'string',enum:ORIENTATIONS},family:{type:'string',enum:FAMILIES},brandDirection:{type:'string',enum:DIRECTIONS},confidence:{type:'number',minimum:0,maximum:100},
    palette:{type:'object',additionalProperties:false,properties:{primary:{type:'string'},secondary:{type:'string'},accent:{type:'string'},background:{type:'string'},text:{type:'string'},secondaryText:{type:'string'}},required:['primary','secondary','accent','background','text','secondaryText']},
    typography:{type:'object',additionalProperties:false,properties:{company:{type:'string',enum:FONTS},name:{type:'string',enum:FONTS},title:{type:'string',enum:FONTS},contact:{type:'string',enum:FONTS},address:{type:'string',enum:FONTS},slogan:{type:'string',enum:FONTS}},required:['company','name','title','contact','address','slogan']},
    logos:{type:'object',additionalProperties:false,properties:{showSecondary:{type:'boolean'},secondaryPosition:{type:'string',enum:POSITIONS},secondaryScale:{type:'number',minimum:.35,maximum:3}},required:['showSecondary','secondaryPosition','secondaryScale']},
    tags:{type:'array',items:{type:'string'},minItems:3,maxItems:4}
  },
  required:['id','title','subtitle','rationale','orientation','family','brandDirection','confidence','palette','typography','logos','tags']
};
const outputSchema={
  type:'object',additionalProperties:false,
  properties:{
    analysis:{type:'object',additionalProperties:false,properties:{brandSummary:{type:'string'},strategy:{type:'string'},logoObservations:{type:'array',items:{type:'string'},minItems:2,maxItems:5}},required:['brandSummary','strategy','logoObservations']},
    concepts:{type:'array',items:conceptSchema,minItems:4,maxItems:4}
  },required:['analysis','concepts']
};

function systemPrompt(){return `You are Cardcraft's senior brand identity and business-card art director.
Generate exactly four distinct, production-usable business-card design specifications. Do not generate an image. Return only the required structured JSON.
Rules:
- Never change, translate, correct, or invent the user's company name, person name, title, contact details, or slogan.
- Analyze supplied logos for visual weight, aspect ratio, color personality, institutional versus commercial tone, and whether two logos should be visually equal or hierarchical.
- Use only the permitted enum values and fonts in the schema.
- Each concept must be materially different in hierarchy, orientation or family; do not return four palette-only variations.
- Keep legibility appropriate for a 90x50mm or 50x90mm business card.
- If a secondary logo exists, at least two concepts should use it. If it does not exist, showSecondary must be false.
- If mixOrientation is true, include at least one horizontal and one vertical concept.
- Colors must be six-digit hex strings. Ensure adequate text/background contrast.
- Korean body/contact information should use Korean-capable fonts. Decorative Latin fonts may be used for company/slogan only when suitable.
- The result will be rendered by a deterministic SVG engine, so select the closest supported design family rather than describing unsupported artwork.`;}
function userText(input){return JSON.stringify({request:input.prompt||'Create varied, professional business-card concepts.',mixOrientation:input.mixOrientation,business:{company:input.business.company,industry:input.business.industry,slogan:input.business.slogan,hasPersonName:!!input.business.name,hasTitle:!!input.business.title,hasAddress:input.business.hasAddress,hasWebsite:input.business.hasWebsite,contactDensity:input.business.contactDensity},currentDesign:input.current,localLogoAnalysis:input.localLogoAnalysis,availableDesignFamilies:FAMILIES,secondaryLogoAvailable:input.current.hasSecondaryLogo},null,2);}
function outputText(data){
  return (data?.candidates?.[0]?.content?.parts||[]).map(part=>typeof part?.text==='string'?part.text:'').join('').trim();
}
function parseDataUrl(dataUrl){
  const match=/^data:(image\/(?:png|jpeg|jpg|webp));base64,([a-z0-9+/=]+)$/i.exec(String(dataUrl||''));
  if(!match)return null;
  return{mimeType:match[1].toLowerCase().replace('image/jpg','image/jpeg'),data:match[2]};
}
function parseJsonText(text){
  const clean=String(text||'').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
  try{return JSON.parse(clean);}catch{throw new Error('INVALID_AI_JSON');}
}
function cleanConcept(raw,index,input){
  const c=input.current,p=c.palette||{},fallbackFonts={company:'Montserrat',name:'Noto Sans KR',title:'Montserrat',contact:'IBM Plex Sans KR',address:'Noto Sans KR',slogan:'Cormorant Garamond'};
  return{id:safeString(raw?.id,60)||`ai-${Date.now()}-${index}`,title:safeString(raw?.title,40)||`AI 디자인 ${index+1}`,subtitle:safeString(raw?.subtitle,80)||'브랜드 맞춤 시안',rationale:safeString(raw?.rationale,300),orientation:pick(raw?.orientation,ORIENTATIONS,c.orientation),family:pick(raw?.family,FAMILIES,'minimal'),brandDirection:pick(raw?.brandDirection,DIRECTIONS,'matched'),confidence:Math.round(num(raw?.confidence,0,100,80)),palette:{primary:color(raw?.palette?.primary,p.primary),secondary:color(raw?.palette?.secondary,p.secondary),accent:color(raw?.palette?.accent,p.accent),background:color(raw?.palette?.background,p.background),text:color(raw?.palette?.text,p.text),secondaryText:color(raw?.palette?.secondaryText,'#667085')},typography:{company:font(raw?.typography?.company,fallbackFonts.company),name:font(raw?.typography?.name,fallbackFonts.name),title:font(raw?.typography?.title,fallbackFonts.title),contact:font(raw?.typography?.contact,fallbackFonts.contact),address:font(raw?.typography?.address,fallbackFonts.address),slogan:font(raw?.typography?.slogan,fallbackFonts.slogan)},logos:{showSecondary:input.current.hasSecondaryLogo&&bool(raw?.logos?.showSecondary),secondaryPosition:pick(raw?.logos?.secondaryPosition,POSITIONS,'top-right'),secondaryScale:num(raw?.logos?.secondaryScale,.35,3,1)},tags:Array.isArray(raw?.tags)?raw.tags.map(v=>safeString(v,18)).filter(Boolean).slice(0,4):['AI','브랜드','명함']};
}
function demo(input){
  const colors=input.localLogoAnalysis.colors.length?input.localLogoAnalysis.colors:[input.current.palette.primary,input.current.palette.secondary,input.current.palette.accent];
  const orientation=input.mixOrientation?['horizontal','vertical','horizontal','vertical']:[input.current.orientation,input.current.orientation,input.current.orientation,input.current.orientation];
  const family=input.current.hasSecondaryLogo?['dual','institution','travel','premium']:['minimal','travel','premium','bold'];
  const pairs=[['Montserrat','Noto Sans KR','Space Grotesk','IBM Plex Sans KR','Noto Sans KR','Cormorant Garamond'],['Noto Sans KR','Hahmlet','Montserrat','IBM Plex Sans KR','Noto Sans KR','Noto Serif KR'],['Cinzel','Hahmlet','Cormorant Garamond','Montserrat','Noto Sans KR','Playfair Display'],['Bebas Neue','Black Han Sans','Space Grotesk','IBM Plex Sans KR','Gowun Dodum','Dancing Script']];
  const titles=['브랜드 밸런스','공식성과 가독성','프리미엄 에디션','컬러 임팩트'];
  return{mode:'demo',model:'local-demo',analysis:{brandSummary:`${input.business.company||'브랜드'}의 현재 로고와 정보량을 기준으로 구성했습니다.`,strategy:'로고 중심, 기관형, 프리미엄, 대담형을 비교할 수 있도록 네 방향으로 분리했습니다.',logoObservations:[input.localLogoAnalysis.shape||'로고 비율 분석',...(input.localLogoAnalysis.tags||[]).slice(0,3)]},concepts:titles.map((title,i)=>cleanConcept({id:`demo-${Date.now()}-${i}`,title,subtitle:['로고 중심 균형형','기관·관광청 정보형','절제된 고급형','강한 브랜드 표현'][i],rationale:['메인 로고와 이름의 우선순위를 균형 있게 잡았습니다.','연락처를 빠르게 읽을 수 있도록 공식적인 그리드를 적용했습니다.','색을 절제하고 여백과 세리프 서체를 사용했습니다.','대표색과 보색 대비를 사용해 기억에 남는 인상을 만듭니다.'][i],orientation:orientation[i],family:family[i],brandDirection:['matched','refined','premium','contrast'][i],confidence:88-i*3,palette:{primary:colors[0]||'#2563eb',secondary:colors[1]||'#0f766e',accent:colors[2]||'#f59e0b',background:i===2?'#f7f0e4':i===3?'#111827':'#ffffff',text:i===3?'#ffffff':'#101828',secondaryText:i===3?'#cbd5e1':'#667085'},typography:{company:pairs[i][0],name:pairs[i][1],title:pairs[i][2],contact:pairs[i][3],address:pairs[i][4],slogan:pairs[i][5]},logos:{showSecondary:input.current.hasSecondaryLogo,secondaryPosition:i%2?'bottom-right':'top-right',secondaryScale:i===0?1.05:.85},tags:[family[i],orientation[i],['균형','가독성','고급','대담'][i]]},i,input))};
}

async function rateLimit(request,env){
  const limit=Math.max(1,Number(env.AI_DAILY_LIMIT)||20);if(!limit||typeof caches==='undefined'||!caches.default)return null;
  const ip=request.headers.get('CF-Connecting-IP')||'unknown',day=new Date().toISOString().slice(0,10),key=new Request(`https://cardcraft-rate.local/${encodeURIComponent(ip)}/${day}`),cache=caches.default,hit=await cache.match(key);let count=0;if(hit)count=Number(await hit.text())||0;if(count>=limit)return{count,limit};
  await cache.put(key,new Response(String(count+1),{headers:{'Cache-Control':'max-age=86400'}}));return null;
}
async function callGemini(input,env){
  const model=env.AI_MODEL||'gemini-3.5-flash-lite';
  const parts=[{text:`${systemPrompt()}\n\nCardcraft input:\n${userText(input)}`}];
  for(const image of input.images){
    const parsed=parseDataUrl(image.dataUrl);if(!parsed)continue;
    parts.push({text:image.role==='primary_logo'?'Primary logo image:':'Secondary or partner logo image:'});
    parts.push({inline_data:{mime_type:parsed.mimeType,data:parsed.data}});
  }
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),50000);
  try{
    const endpoint=`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    const res=await fetch(endpoint,{method:'POST',headers:{'x-goog-api-key':env.GEMINI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({contents:[{role:'user',parts}],generationConfig:{responseMimeType:'application/json',responseJsonSchema:outputSchema,maxOutputTokens:2800}}),signal:controller.signal});
    const data=await res.json();
    if(!res.ok)throw new Error(data?.error?.message||`GEMINI_${res.status}`);
    const text=outputText(data);if(!text){const reason=data?.candidates?.[0]?.finishReason||data?.promptFeedback?.blockReason||'EMPTY_AI_OUTPUT';throw new Error(reason);}
    const parsed=parseJsonText(text);
    const concepts=(parsed.concepts||[]).slice(0,4).map((v,i)=>cleanConcept(v,i,input));if(concepts.length!==4)throw new Error('AI_CONCEPT_COUNT');
    const meta=data.usageMetadata||{};
    const usage={prompt_tokens:Number(meta.promptTokenCount)||0,completion_tokens:Number(meta.candidatesTokenCount)||0,total_tokens:Number(meta.totalTokenCount)||((Number(meta.promptTokenCount)||0)+(Number(meta.candidatesTokenCount)||0))};
    return{mode:'live',provider:'gemini',model,analysis:{brandSummary:safeString(parsed.analysis?.brandSummary,300),strategy:safeString(parsed.analysis?.strategy,400),logoObservations:Array.isArray(parsed.analysis?.logoObservations)?parsed.analysis.logoObservations.map(v=>safeString(v,120)).slice(0,5):[]},concepts,usage,requestId:res.headers.get('x-request-id')||res.headers.get('x-goog-request-id')||null};
  }finally{clearTimeout(timer);}
}

export default{
  async fetch(request,env){
    const url=new URL(request.url),headers=cors(request,env);
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
    if(url.pathname==='/api/ai/status')return json({ok:true,mode:env.GEMINI_API_KEY&&String(env.AI_DEMO_MODE).toLowerCase()!=='true'?'live':'demo',provider:'gemini',model:env.AI_MODEL||'gemini-3.5-flash-lite'},200,headers);
    if(url.pathname==='/api/ai/design'){
      if(request.method!=='POST')return json({error:'METHOD_NOT_ALLOWED'},405,headers);
      const length=Number(request.headers.get('Content-Length')||0);if(length>3600000)return json({error:'REQUEST_TOO_LARGE'},413,headers);
      let body;try{body=await request.json();}catch{return json({error:'INVALID_JSON'},400,headers);}
      const input=cleanInput(body);
      const demoMode=String(env.AI_DEMO_MODE).toLowerCase()==='true'||!env.GEMINI_API_KEY;
      if(demoMode)return json(demo(input),200,headers);
      const blocked=await rateLimit(request,env);if(blocked)return json({error:'DAILY_LIMIT_REACHED',limit:blocked.limit},429,headers);
      try{return json(await callGemini(input,env),200,headers);}catch(error){console.error('AI design error',error);return json({error:'AI_DESIGN_FAILED',message:safeString(error?.message,180)},502,headers);}
    }
    if(url.pathname==='/health')return json({ok:true,service:'cardcraft',mode:env.GEMINI_API_KEY&&String(env.AI_DEMO_MODE).toLowerCase()!=='true'?'live':'demo',provider:'gemini',model:env.AI_MODEL||'gemini-3.5-flash-lite'},200,headers);
    return env.ASSETS.fetch(request);
  }
};
