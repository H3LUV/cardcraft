(function cardcraftV10AIDesignCopilot(){
  'use strict';

  const CONFIG={
    mode:'auto',endpoint:'/api/ai/design',statusEndpoint:'/api/ai/status',conceptsPerRequest:4,
    requestTimeoutMs:45000,sendLogoByDefault:true,...(window.CARDCRAFT_AI||{})
  };
  const ALLOWED_FAMILIES=['minimal','institution','dual','bands','editorial','premium','travel','bold','split'];
  const ALLOWED_DIRECTIONS=['matched','refined','premium','contrast'];
  const ALLOWED_FONTS=['Noto Sans KR','Noto Serif KR','IBM Plex Sans KR','Gowun Dodum','Gowun Batang','Hahmlet','Nanum Gothic','Nanum Myeongjo','Black Han Sans','Do Hyeon','Jua','Gugi','Song Myung','Diphylleia','Bagel Fat One','Nanum Pen Script','Nanum Brush Script','Gaegu','Hi Melody','Single Day','Yeon Sung','East Sea Dokdo','Montserrat','Poppins','Raleway','Oswald','Space Grotesk','Bebas Neue','Archivo','Inter','Playfair Display','Cormorant Garamond','Cinzel','Bodoni Moda','DM Serif Display','Libre Baskerville','Caveat','Great Vibes','Dancing Script','Sacramento'];
  const DEFAULT_AI_CUSTOM={aiPrompt:'',aiSendLogo:CONFIG.sendLogoByDefault,aiConcepts:[],aiAnalysis:null,aiMode:'checking',aiLastUsage:null,aiSelectedId:''};
  Object.assign(DEFAULT_CUSTOM,DEFAULT_AI_CUSTOM);
  state.custom={...DEFAULT_AI_CUSTOM,...state.custom};

  const section=document.createElement('section');
  section.className='v10-ai-studio';
  section.innerHTML=`
    <div class="v10-ai-heading">
      <div><span class="section-label">04 · AI DESIGN COPILOT</span><h2>AI가 브랜드 명함 방향을 설계합니다</h2><p>로고·업종·원하는 분위기를 읽고, Cardcraft가 편집 가능한 구조로 4개의 디자인 명세를 생성합니다.</p></div>
      <span class="v10-ai-badge" id="v10AiBadge">AI 연결 확인 중</span>
    </div>
    <div class="v10-ai-shell">
      <article class="v10-ai-panel">
        <div class="v10-ai-panel-title"><strong>디자인 요청</strong><small>자연어로 입력</small></div>
        <textarea class="v10-ai-prompt" id="v10AiPrompt" maxlength="800" placeholder="예: 두 개의 관광청 로고를 균형 있게 배치하고, 신뢰감 있는 기관형이지만 너무 딱딱하지 않게. 세로형 시안도 포함해 주세요."></textarea>
        <div class="v10-ai-chips" id="v10AiChips">
          <button type="button" class="v10-ai-chip" data-ai-prompt="신뢰감 있는 공공기관·관광청 스타일">기관·관광청</button>
          <button type="button" class="v10-ai-chip" data-ai-prompt="여행의 활기와 브랜드 컬러가 느껴지는 세련된 디자인">여행 브랜드</button>
          <button type="button" class="v10-ai-chip" data-ai-prompt="여백이 넓고 고급스러운 프리미엄 디자인">프리미엄</button>
          <button type="button" class="v10-ai-chip" data-ai-prompt="정보가 잘 읽히는 미니멀하고 현대적인 디자인">미니멀</button>
          <button type="button" class="v10-ai-chip" data-ai-prompt="강한 타이포그래피와 대담한 컬러 블록 디자인">대담하게</button>
        </div>
        <div class="v10-ai-options">
          <label class="v10-ai-check"><input type="checkbox" id="v10AiSendLogo"><span>메인·보조 로고 이미지를 AI 분석에 포함<br><small>LIVE 모드에서만 서버로 전송됩니다.</small></span></label>
          <label class="v10-ai-check"><input type="checkbox" id="v10AiMixOrientation" checked><span>가로형과 세로형을 섞어서 제안</span></label>
        </div>
        <button type="button" class="btn primary v10-ai-run" id="v10AiRun">✦ AI 디자인 4안 생성</button>
        <small class="v10-ai-note">API가 연결되지 않은 배포본에서는 데모 설계 엔진으로 동작합니다. LIVE 호출은 사용량에 따라 API 비용이 발생합니다.</small>
      </article>
      <article class="v10-ai-panel">
        <div class="v10-ai-panel-title"><strong>AI 디자인 제안</strong><small id="v10AiUsage">아직 생성하지 않음</small></div>
        <div class="v10-ai-summary" id="v10AiSummary"></div>
        <div class="v10-ai-results" id="v10AiResults"><div class="v10-ai-empty"><i>✦</i><strong>AI 디자인을 생성해 보세요</strong><span>결과는 이미지가 아니라 수정 가능한 레이아웃·색상·폰트 명세로 적용됩니다.</span></div></div>
      </article>
    </div>`;

  const v9Section=document.querySelector('.v9-brand-studio');
  const variants=document.querySelector('.variants-section');
  if(v9Section)v9Section.insertAdjacentElement('beforebegin',section);else if(variants)variants.insertAdjacentElement('afterend',section);
  const v9Label=document.querySelector('.v9-brand-studio .section-label');if(v9Label)v9Label.textContent='05 · BRAND DESIGN ENGINE';
  const remixLabel=document.querySelector('.v6-remix-section .section-label');if(remixLabel)remixLabel.textContent='06 · SMART REMIX';
  const detailLabel=document.querySelector('.v5-studio .section-label');if(detailLabel)detailLabel.textContent='07 · DETAIL STUDIO';

  const promptEl=document.getElementById('v10AiPrompt'),sendLogoEl=document.getElementById('v10AiSendLogo'),mixEl=document.getElementById('v10AiMixOrientation'),runBtn=document.getElementById('v10AiRun'),resultsEl=document.getElementById('v10AiResults'),badgeEl=document.getElementById('v10AiBadge'),summaryEl=document.getElementById('v10AiSummary'),usageEl=document.getElementById('v10AiUsage');
  promptEl.value=state.custom.aiPrompt||'';sendLogoEl.checked=state.custom.aiSendLogo!==false;

  const validHex=(v,fallback)=>/^#[0-9a-f]{6}$/i.test(String(v||''))?String(v).toLowerCase():fallback;
  const pick=(v,allowed,fallback)=>allowed.includes(v)?v:fallback;
  const font=(v,fallback)=>ALLOWED_FONTS.includes(v)?v:fallback;
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number(n)||min));
  const escHtml=v=>String(v??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));

  function normalizeConcept(raw,index){
    const base=state.custom;
    return{
      id:String(raw?.id||`ai-${Date.now()}-${index}`),
      title:String(raw?.title||`AI 디자인 ${index+1}`).slice(0,40),
      subtitle:String(raw?.subtitle||'브랜드 맞춤 시안').slice(0,80),
      rationale:String(raw?.rationale||'현재 브랜드 정보와 로고 톤을 반영한 디자인입니다.').slice(0,260),
      orientation:pick(raw?.orientation,['horizontal','vertical'],base.orientation||'horizontal'),
      family:pick(raw?.family,ALLOWED_FAMILIES,'minimal'),
      brandDirection:pick(raw?.brandDirection,ALLOWED_DIRECTIONS,'matched'),
      confidence:Math.round(clamp(raw?.confidence,0,100)),
      palette:{
        primary:validHex(raw?.palette?.primary,base.primary||'#2563eb'),secondary:validHex(raw?.palette?.secondary,base.secondaryColor||'#0f766e'),accent:validHex(raw?.palette?.accent,base.accentColor||'#f59e0b'),background:validHex(raw?.palette?.background,base.background||'#ffffff'),text:validHex(raw?.palette?.text,base.text||'#101828'),secondaryText:validHex(raw?.palette?.secondaryText,base.secondaryText||'#667085')
      },
      typography:{
        company:font(raw?.typography?.company,base.fontCompany||'Montserrat'),name:font(raw?.typography?.name,base.fontName||'Noto Sans KR'),title:font(raw?.typography?.title,base.fontTitle||'Montserrat'),contact:font(raw?.typography?.contact,base.fontContact||'IBM Plex Sans KR'),address:font(raw?.typography?.address,base.fontAddress||'Noto Sans KR'),slogan:font(raw?.typography?.slogan,base.fontSlogan||'Cormorant Garamond')
      },
      logos:{showSecondary:!!raw?.logos?.showSecondary,secondaryPosition:pick(raw?.logos?.secondaryPosition,['top-right','bottom-right','bottom-left'],'top-right'),secondaryScale:clamp(raw?.logos?.secondaryScale,.35,3)},
      tags:Array.isArray(raw?.tags)?raw.tags.slice(0,4).map(v=>String(v).slice(0,18)):[]
    };
  }

  function conceptCustom(concept){return{
    orientation:concept.orientation,designFamily:concept.family,brandDirection:concept.brandDirection,
    primary:concept.palette.primary,secondaryColor:concept.palette.secondary,accentColor:concept.palette.accent,
    background:concept.palette.background,text:concept.palette.text,secondaryText:concept.palette.secondaryText,forceBackground:true,
    fontCompany:concept.typography.company,fontName:concept.typography.name,fontTitle:concept.typography.title,fontContact:concept.typography.contact,fontAddress:concept.typography.address,fontSlogan:concept.typography.slogan,
    showSecondaryLogo:concept.logos.showSecondary&&!!state.data.secondaryLogoDataUrl,secondaryLogoPosition:concept.logos.secondaryPosition,secondaryLogoScale:concept.logos.secondaryScale
  };}

  function previewSvg(concept){
    const keys=Object.keys(conceptCustom(concept)),old={};keys.forEach(k=>old[k]=state.custom[k]);Object.assign(state.custom,conceptCustom(concept));
    let svg='';try{svg=renderCard(selectedTemplate(),state.side,true);}catch(e){}finally{Object.assign(state.custom,old);}return svg;
  }

  function renderConcepts(){
    const concepts=(state.custom.aiConcepts||[]).map(normalizeConcept);
    if(!concepts.length){resultsEl.innerHTML='<div class="v10-ai-empty"><i>✦</i><strong>AI 디자인을 생성해 보세요</strong><span>결과는 이미지가 아니라 수정 가능한 레이아웃·색상·폰트 명세로 적용됩니다.</span></div>';return;}
    resultsEl.innerHTML=concepts.map((c,i)=>`<article class="v10-concept ${state.custom.aiSelectedId===c.id?'active':''}" data-ai-concept="${escHtml(c.id)}"><div class="v10-concept-preview ${c.orientation==='vertical'?'portrait':''}">${previewSvg(c)}</div><div class="v10-concept-body"><div class="v10-concept-top"><div><h3>${escHtml(c.title)}</h3><div class="v10-concept-sub">${escHtml(c.subtitle)}</div></div><span class="v10-confidence">${c.confidence}%</span></div><p>${escHtml(c.rationale)}</p><div class="v10-palette">${Object.values(c.palette).slice(0,5).map(color=>`<i style="background:${color}" title="${color}"></i>`).join('')}</div><div class="v10-tags">${c.tags.map(tag=>`<span>${escHtml(tag)}</span>`).join('')}</div><button type="button" class="btn secondary" data-ai-apply="${escHtml(c.id)}">이 디자인 적용</button></div></article>`).join('');
  }

  function applyConcept(concept){
    Object.assign(state.custom,conceptCustom(concept));
    state.custom.aiSelectedId=concept.id;
    state.category=concept.family==='institution'?'trust':concept.family==='premium'?'premium':concept.family==='travel'?'vivid':concept.family==='bold'?'bold':'minimal';
    state.recommendationSeed=(Date.now()%1000000)+Math.round(concept.confidence||0);
    buildRecommendations();state.v6RecommendedIds=[...(state.recommendedIds||[])];persist();renderAll();renderConcepts();
    showToast(`AI 제안 '${concept.title}'을 적용했습니다. 색상·폰트·레이아웃을 계속 수정할 수 있습니다.`,4800);
  }

  async function rasterizeLogo(dataUrl){
    if(!dataUrl||!/^data:image\//.test(dataUrl))return'';
    return await new Promise(resolve=>{const img=new Image();img.onload=()=>{try{const max=640,ratio=Math.min(1,max/Math.max(img.naturalWidth||img.width,img.naturalHeight||img.height)),w=Math.max(1,Math.round((img.naturalWidth||img.width)*ratio)),h=Math.max(1,Math.round((img.naturalHeight||img.height)*ratio)),canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;canvas.getContext('2d').drawImage(img,0,0,w,h);resolve(canvas.toDataURL('image/png',.9));}catch(e){resolve('');}};img.onerror=()=>resolve('');img.src=dataUrl;});
  }

  function dataPayload(images){
    const d=state.data,p=state.custom.brandProfile||{};
    return{
      prompt:(promptEl.value||'').trim().slice(0,800),mixOrientation:!!mixEl.checked,
      business:{company:d.company||'',name:d.name||'',title:d.title||'',slogan:d.slogan||'',industry:state.category||'',hasAddress:!!d.address,hasWebsite:!!d.website,contactDensity:[d.phone,d.email,d.website,d.address].filter(Boolean).length},
      current:{orientation:state.custom.orientation,designFamily:state.custom.designFamily,brandDirection:state.custom.brandDirection,palette:{primary:state.custom.primary,secondary:state.custom.secondaryColor,accent:state.custom.accentColor,background:state.custom.background,text:state.custom.text},hasPrimaryLogo:!!d.logoDataUrl,hasSecondaryLogo:!!d.secondaryLogoDataUrl},
      localLogoAnalysis:{colors:p.colors||[],shape:p.shape||'',tags:p.tags||[],colorfulness:p.colorfulness||0,brightness:p.brightness||0,recommendedFamily:p.recommendedFamily||''},
      images
    };
  }

  function demoConcepts(payload){
    const p=state.custom.brandProfile||{},colors=p.colors?.length?p.colors:[state.custom.primary||'#2563eb',state.custom.secondaryColor||'#0f766e',state.custom.accentColor||'#f59e0b'];
    const orientations=payload.mixOrientation?['horizontal','vertical','horizontal','vertical']:[state.custom.orientation,state.custom.orientation,state.custom.orientation,state.custom.orientation];
    const families=payload.current.hasSecondaryLogo?['dual','institution','travel','premium']:['minimal','travel','premium','bold'];
    const fontSets=[['Montserrat','Noto Sans KR','Space Grotesk','IBM Plex Sans KR','Noto Sans KR','Cormorant Garamond'],['Noto Sans KR','Hahmlet','Montserrat','IBM Plex Sans KR','Noto Sans KR','Noto Serif KR'],['Cinzel','Hahmlet','Cormorant Garamond','Montserrat','Noto Sans KR','Playfair Display'],['Bebas Neue','Black Han Sans','Space Grotesk','IBM Plex Sans KR','Gowun Dodum','Dancing Script']];
    const titles=['브랜드 밸런스','공식성과 가독성','프리미엄 에디션','컬러 임팩트'];
    return{mode:'demo',analysis:{brandSummary:`${payload.business.company||'브랜드'}의 로고 톤과 정보 밀도를 반영했습니다.`,strategy:'로고 정체성을 유지하면서 서로 다른 정보 위계와 방향을 비교합니다.'},concepts:titles.map((title,i)=>({id:`demo-${Date.now()}-${i}`,title,subtitle:i===0?'로고 중심 균형형':i===1?'기관·관광청 정보형':i===2?'절제된 고급형':'강한 브랜드 표현',rationale:["메인 로고와 이름의 우선순위를 균형 있게 잡았습니다.","연락처를 빠르게 읽을 수 있도록 공식적인 그리드를 적용했습니다.","색을 절제하고 여백과 세리프 서체를 사용했습니다.","대표색과 보색 대비를 사용해 기억에 남는 인상을 만듭니다."][i],orientation:orientations[i],family:families[i],brandDirection:['matched','refined','premium','contrast'][i],confidence:88-i*3,palette:{primary:colors[0]||'#2563eb',secondary:colors[1]||'#0f766e',accent:colors[2]||'#f59e0b',background:i===2?'#f7f0e4':i===3?'#111827':'#ffffff',text:i===3?'#ffffff':'#101828',secondaryText:i===3?'#cbd5e1':'#667085'},typography:{company:fontSets[i][0],name:fontSets[i][1],title:fontSets[i][2],contact:fontSets[i][3],address:fontSets[i][4],slogan:fontSets[i][5]},logos:{showSecondary:payload.current.hasSecondaryLogo,secondaryPosition:i%2?'bottom-right':'top-right',secondaryScale:i===0?1.05:.85},tags:[families[i],orientations[i],['균형','가독성','고급','대담'][i]]}))};
  }

  async function requestAI(payload){
    if(CONFIG.mode==='demo')return demoConcepts(payload);
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),CONFIG.requestTimeoutMs);
    try{
      const response=await fetch(CONFIG.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
      if(!response.ok)throw new Error(`AI_HTTP_${response.status}`);
      return await response.json();
    }finally{clearTimeout(timer);}
  }

  async function runAI(){
    const old=runBtn.innerHTML;runBtn.disabled=true;runBtn.innerHTML='<span class="v10-loading"><i class="v10-spinner"></i>AI가 디자인 구조를 설계 중입니다</span>';
    resultsEl.innerHTML='<div class="v10-ai-empty"><div class="v10-loading"><i class="v10-spinner"></i><strong>로고와 브랜드 정보를 분석하고 있습니다</strong></div></div>';
    try{
      state.custom.aiPrompt=promptEl.value.trim();state.custom.aiSendLogo=sendLogoEl.checked;persist();
      const images=[];
      if(sendLogoEl.checked){const main=await rasterizeLogo(state.data.logoDataUrl),secondary=await rasterizeLogo(state.data.secondaryLogoDataUrl);if(main)images.push({role:'primary_logo',dataUrl:main});if(secondary)images.push({role:'secondary_logo',dataUrl:secondary});}
      const payload=dataPayload(images);let data;
      try{data=await requestAI(payload);}catch(err){if(CONFIG.mode==='live')throw err;data=demoConcepts(payload);data.fallbackReason=err.message;}
      const concepts=(data.concepts||[]).slice(0,CONFIG.conceptsPerRequest).map(normalizeConcept);
      if(!concepts.length)throw new Error('NO_CONCEPTS');
      state.custom.aiConcepts=concepts;state.custom.aiAnalysis=data.analysis||null;state.custom.aiMode=data.mode||data.provider||'live';state.custom.aiLastUsage=data.usage||null;state.custom.aiSelectedId='';persist();
      const summary=data.analysis||{};summaryEl.classList.add('visible');summaryEl.innerHTML=`<strong>${escHtml(summary.brandSummary||'브랜드 분석 완료')}</strong><p>${escHtml(summary.strategy||'서로 다른 디자인 방향 4개를 제안했습니다.')}</p>`;
      usageEl.textContent=data.usage?.total_tokens?`${data.model||'AI'} · ${Number(data.usage.total_tokens).toLocaleString()} tokens`:state.custom.aiMode==='demo'?'DEMO · API 비용 없음':'AI LIVE';
      renderConcepts();showToast(state.custom.aiMode==='demo'?'AI API 데모 결과를 생성했습니다. 실제 연결 후에는 로고 비전 분석을 사용합니다.':'AI가 4개의 편집 가능한 디자인 방향을 생성했습니다.',4800);
    }catch(err){resultsEl.innerHTML='<div class="v10-ai-empty"><i>!</i><strong>AI 디자인 생성에 실패했습니다</strong><span>API 연결과 사용 한도를 확인한 뒤 다시 시도해 주세요.</span></div>';showToast('AI 디자인 생성에 실패했습니다. API 연결 상태를 확인하세요.',5000);}
    finally{runBtn.disabled=false;runBtn.innerHTML=old;}
  }

  async function checkStatus(){
    if(CONFIG.mode==='demo'){setBadge('demo');return;}
    try{const r=await fetch(CONFIG.statusEndpoint,{headers:{Accept:'application/json'}});if(!r.ok)throw new Error();const d=await r.json();setBadge(d.mode==='live'?'live':'demo',d.model);}catch(e){setBadge(CONFIG.mode==='live'?'offline':'demo');}
  }
  function setBadge(mode,model=''){
    badgeEl.classList.toggle('live',mode==='live');badgeEl.textContent=mode==='live'?`AI LIVE · ${model||'GEMINI'}`:mode==='offline'?'AI API 연결 오류':'AI DEMO · LOCAL FALLBACK';
    state.custom.aiMode=mode;persist();
  }

  document.getElementById('v10AiChips').addEventListener('click',e=>{const chip=e.target.closest('[data-ai-prompt]');if(!chip)return;promptEl.value=promptEl.value.trim()?`${promptEl.value.trim()} · ${chip.dataset.aiPrompt}`:chip.dataset.aiPrompt;chip.classList.add('active');state.custom.aiPrompt=promptEl.value;persist();});
  promptEl.addEventListener('input',()=>{state.custom.aiPrompt=promptEl.value;persist();});sendLogoEl.addEventListener('change',()=>{state.custom.aiSendLogo=sendLogoEl.checked;persist();});runBtn.addEventListener('click',runAI);
  resultsEl.addEventListener('click',e=>{const btn=e.target.closest('[data-ai-apply]');if(!btn)return;const concept=(state.custom.aiConcepts||[]).map(normalizeConcept).find(c=>c.id===btn.dataset.aiApply);if(concept)applyConcept(concept);});

  const footer=document.querySelector('footer span');if(footer)footer.textContent='CARDCRAFT V10 · AI DESIGN COPILOT · BRAND DESIGN ENGINE';
  if(state.custom.aiAnalysis){summaryEl.classList.add('visible');summaryEl.innerHTML=`<strong>${escHtml(state.custom.aiAnalysis.brandSummary||'브랜드 분석 완료')}</strong><p>${escHtml(state.custom.aiAnalysis.strategy||'')}</p>`;}
  if(state.custom.aiLastUsage?.total_tokens)usageEl.textContent=`${Number(state.custom.aiLastUsage.total_tokens).toLocaleString()} tokens`;
  renderConcepts();checkStatus();
  console.info('Cardcraft V10 AI Design Copilot active');
})();
