(function cardcraftV11ProductionFoundation(){
  'use strict';
  if(typeof state==='undefined'||typeof LIBRARY==='undefined'||typeof renderCard!=='function')return;

  const PRODUCTS={
    png:{key:'png',webProduct:'png-download',androidProductId:'cardcraft_export_png',label:'고해상도 PNG',price:1900},
    source:{key:'source',webProduct:'vector-source',androidProductId:'cardcraft_export_source',label:'편집용 벡터 원본',price:3900}
  };
  const CARD_SPECS={
    'kr-90x50':{id:'kr-90x50',label:'90 × 50 mm · 표준',finishedW:90,finishedH:50,bleed:3,status:'ready'},
    'credit-86x54':{id:'credit-86x54',label:'86 × 54 mm · 카드형',finishedW:86,finishedH:54,bleed:3,status:'beta'},
    'slim-90x45':{id:'slim-90x45',label:'90 × 45 mm · 슬림',finishedW:90,finishedH:45,bleed:3,status:'beta'},
    'square-55x55':{id:'square-55x55',label:'55 × 55 mm · 정사각',finishedW:55,finishedH:55,bleed:3,status:'planned'}
  };
  const THEMES=[
    {key:'brand',label:'Brand'},
    {key:'ink',label:'Ink'},
    {key:'midnight',label:'Midnight'},
    {key:'paper',label:'Paper'},
    {key:'frost',label:'Frost'},
    {key:'soft',label:'Soft'},
    {key:'contrast',label:'Contrast'},
    {key:'warm',label:'Warm'},
    {key:'cool',label:'Cool'},
    {key:'mono',label:'Mono'}
  ];

  Object.assign(DEFAULT_CUSTOM,{cardSpec:'kr-90x50',cornerStyle:'square',cornerRadiusMm:4});
  state.custom={cardSpec:'kr-90x50',cornerStyle:'square',cornerRadiusMm:4,...state.custom};
  if(!CARD_SPECS[state.custom.cardSpec]||CARD_SPECS[state.custom.cardSpec].status==='planned')state.custom.cardSpec='kr-90x50';

  function hexRgb(hex){const v=String(hex||'#2563eb').replace('#','');const n=parseInt(v.length===3?v.split('').map(c=>c+c).join(''):v,16);return[(n>>16)&255,(n>>8)&255,n&255];}
  function rgbHex(rgb){return '#'+rgb.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');}
  function mix(a,b,t){const A=hexRgb(a),B=hexRgb(b);return rgbHex(A.map((v,i)=>v+(B[i]-v)*t));}
  function themePalette(key,base){
    const p=base||'#2563eb';
    if(key==='ink')return{primary:mix(p,'#111827',.72),background:'#ffffff',text:'#111827'};
    if(key==='midnight')return{primary:mix(p,'#8b5cf6',.22),background:'#0f172a',text:'#f8fafc'};
    if(key==='paper')return{primary:mix(p,'#8a5a33',.30),background:'#f7f1e7',text:'#2f2a24'};
    if(key==='frost')return{primary:mix(p,'#38bdf8',.24),background:'#f8fbff',text:'#1e293b'};
    if(key==='soft')return{primary:mix(p,'#ffffff',.26),background:'#ffffff',text:'#334155'};
    if(key==='contrast')return{primary:mix(p,'#000000',.18),background:'#ffffff',text:'#0b0f19'};
    if(key==='warm')return{primary:mix(p,'#c2410c',.42),background:'#fffaf5',text:'#3f2d25'};
    if(key==='cool')return{primary:mix(p,'#1d4ed8',.42),background:'#f8fafc',text:'#172554'};
    if(key==='mono')return{primary:'#111827',background:'#ffffff',text:'#111827'};
    return{primary:p,background:state.custom.background||'#ffffff',text:state.custom.text||'#111827'};
  }

  // 100개의 구조적 베이스 × 10개의 아트디렉션 = 1,000개 카탈로그.
  const baseTemplates=[...LIBRARY];
  baseTemplates.forEach(t=>{t.themeKey=t.themeKey||'brand';t.themeLabel=t.themeLabel||'Brand';});
  if(LIBRARY.length===baseTemplates.length){
    for(const base of baseTemplates){
      for(const theme of THEMES.slice(1)){
        LIBRARY.push({...base,id:`${base.id}-${theme.key}`,label:`${base.label} · ${theme.label}`,themeKey:theme.key,themeLabel:theme.label,baseId:base.id,description:`${base.description} · ${theme.label} 아트디렉션`});
      }
    }
  }

  const originalRenderCard=renderCard;
  function currentSpec(){return CARD_SPECS[state.custom.cardSpec]||CARD_SPECS['kr-90x50'];}
  function outerSvg(innerSvg,spec,template,side,mini,showGuides){
    const targetW=(spec.finishedW+spec.bleed*2)*10,targetH=(spec.finishedH+spec.bleed*2)*10;
    const inner=String(innerSvg).replace(/^<svg[^>]*>/i,'').replace(/<\/svg>\s*$/i,'');
    const trimX=spec.bleed*10,trimY=spec.bleed*10,trimW=spec.finishedW*10,trimH=spec.finishedH*10,safe=30;
    const rx=state.custom.cornerStyle==='rounded'?(Number(state.custom.cornerRadiusMm)||4)*10:0;
    const guides=showGuides&&!mini?`<g id="PRINT_GUIDES" pointer-events="none"><rect x="${trimX}" y="${trimY}" width="${trimW}" height="${trimH}" rx="${rx}" fill="none" stroke="#ef4444" stroke-dasharray="9 7" opacity=".58"/><rect x="${trimX+safe}" y="${trimY+safe}" width="${Math.max(1,trimW-safe*2)}" height="${Math.max(1,trimH-safe*2)}" rx="${Math.max(0,rx-safe)}" fill="none" stroke="#3b82f6" stroke-dasharray="7 7" opacity=".48"/></g>`:'';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${targetW} ${targetH}" role="img" aria-label="${escapeXml(template.label)} ${spec.finishedW}x${spec.finishedH}mm ${side==='front'?'앞면':'뒷면'}"><svg x="0" y="0" width="${targetW}" height="${targetH}" viewBox="0 0 960 560" preserveAspectRatio="xMidYMid slice">${inner}</svg>${guides}</svg>`;
  }
  renderCard=function(template,side='front',mini=false){
    const saved={primary:state.custom.primary,background:state.custom.background,text:state.custom.text,showGuides:state.custom.showGuides};
    const palette=themePalette(template?.themeKey||'brand',saved.primary);
    state.custom.primary=palette.primary;state.custom.background=palette.background;state.custom.text=palette.text;state.custom.showGuides=false;
    let svg='';
    try{svg=originalRenderCard(template,side,mini);}finally{state.custom.primary=saved.primary;state.custom.background=saved.background;state.custom.text=saved.text;state.custom.showGuides=saved.showGuides;}
    return outerSvg(svg,currentSpec(),template,side,mini,!!saved.showGuides);
  };
  window.renderCard=renderCard;

  const originalRenderDynamic=typeof renderDynamic==='function'?renderDynamic:null;
  function syncSpecUi(){
    const spec=currentSpec(),dpi=Number(state.custom.exportDpi)||600;
    document.body.classList.toggle('cc-v11-rounded',state.custom.cornerStyle==='rounded');
    const h=document.querySelector('.measurement.horizontal span'),v=document.querySelector('.measurement.vertical span');if(h)h.textContent=`${spec.finishedW} mm`;if(v)v.textContent=`${spec.finishedH} mm`;
    const cap=document.querySelector('.stage-caption span:first-child');if(cap)cap.innerHTML=`<i class="bleed-dot"></i>완성 ${spec.finishedW} × ${spec.finishedH}mm · 도련 포함 ${spec.finishedW+spec.bleed*2} × ${spec.finishedH+spec.bleed*2}mm`;
    const meta=document.getElementById('exportMeta');if(meta){const pxW=Math.round((spec.finishedW+spec.bleed*2)/25.4*dpi),pxH=Math.round((spec.finishedH+spec.bleed*2)/25.4*dpi);meta.textContent=`${dpi}dpi · ${pxW} × ${pxH}px`;}
    const specEl=document.getElementById('ccV11Spec');if(specEl)specEl.value=spec.id;
    document.querySelectorAll('[data-cc-corner]').forEach(b=>b.classList.toggle('active',b.dataset.ccCorner===state.custom.cornerStyle));
  }
  if(originalRenderDynamic){renderDynamic=function(){originalRenderDynamic();syncSpecUi();};window.renderDynamic=renderDynamic;}

  const host=document.querySelector('.quick-customizer');
  if(host){
    const panel=document.createElement('section');panel.className='cc-v11-spec';
    panel.innerHTML=`<div class="cc-v11-spec-head"><div><span class="section-label">PRINT FORMAT</span><strong>명함 규격 · 모서리</strong></div><span class="cc-v11-count">1,000 DESIGNS</span></div><div class="cc-v11-spec-grid"><label class="cc-v11-field"><span>완성 규격</span><select id="ccV11Spec">${Object.values(CARD_SPECS).map(s=>`<option value="${s.id}" ${s.status==='planned'?'disabled':''}>${s.label}${s.status==='beta'?' · BETA':s.status==='planned'?' · 준비중':''}</option>`).join('')}</select></label><div class="cc-v11-field"><span>모서리</span><div class="cc-v11-corners"><button type="button" data-cc-corner="square">각진형</button><button type="button" data-cc-corner="rounded">둥근형</button></div></div></div><p class="cc-v11-note">도련 3mm와 안전영역을 자동 계산합니다. 55×55mm 정사각형은 전용 레이아웃이 필요한 관계로 다음 확장 단계에서 활성화합니다.</p>`;
    host.insertAdjacentElement('afterend',panel);
    panel.querySelector('#ccV11Spec').addEventListener('change',e=>{state.custom.cardSpec=e.target.value;persist();renderDynamic();if(typeof renderVariants==='function')renderVariants();showToast?.(`${currentSpec().finishedW} × ${currentSpec().finishedH}mm 규격을 적용했습니다.`);});
    panel.querySelectorAll('[data-cc-corner]').forEach(btn=>btn.addEventListener('click',()=>{state.custom.cornerStyle=btn.dataset.ccCorner;persist();syncSpecUi();renderDynamic();if(typeof renderVariants==='function')renderVariants();showToast?.(state.custom.cornerStyle==='rounded'?'둥근 모서리를 적용했습니다.':'각진 모서리를 적용했습니다.');}));
  }

  // 1,000개의 SVG를 한 번에 DOM에 넣지 않도록 템플릿 브라우저를 60개 단위로 페이지 처리.
  let libraryPage=1;const PAGE_SIZE=60;
  if(typeof renderTemplateLibrary==='function'){
    renderTemplateLibrary=function(){
      const tabs=document.getElementById('templateTabs'),grid=document.getElementById('templateLibraryGrid');if(!tabs||!grid)return;
      const counts=Object.fromEntries(Object.keys(STYLE_META).map(k=>[k,k==='all'?LIBRARY.length:LIBRARY.filter(t=>t.category===k).length]));
      tabs.innerHTML=Object.entries(STYLE_META).map(([key,item])=>`<button class="${templateLibraryCategory===key?'active':''}" data-library-category="${key}">${item.name}<small>${counts[key]||0}</small></button>`).join('');
      const pool=templateLibraryCategory==='all'?LIBRARY:LIBRARY.filter(t=>t.category===templateLibraryCategory),visible=pool.slice(0,libraryPage*PAGE_SIZE);
      grid.innerHTML=visible.map(t=>`<button class="template-library-card ${state.selectedId===t.id?'selected':''}" data-library-template="${t.id}"><div class="template-library-preview">${renderCard(t,'front',true)}</div><div><span>${STYLE_META[t.category]?.name||t.category} · ${String(t.layout+1).padStart(2,'0')} · ${t.themeLabel||'Brand'}</span><strong>${t.label}</strong><small>${t.description}</small></div></button>`).join('')+(visible.length<pool.length?`<button class="template-library-card cc-v11-more" id="ccV11More" type="button"><div><strong>더 보기</strong><small>${visible.length} / ${pool.length}</small></div></button>`:'');
      tabs.querySelectorAll('[data-library-category]').forEach(btn=>btn.addEventListener('click',()=>{templateLibraryCategory=btn.dataset.libraryCategory;libraryPage=1;renderTemplateLibrary();}));
      grid.querySelectorAll('[data-library-template]').forEach(btn=>btn.addEventListener('click',()=>{state.selectedId=btn.dataset.libraryTemplate;state.activeStep=3;persist();renderDynamic();renderVariants();renderSteps();closeTemplateLibrary();}));
      document.getElementById('ccV11More')?.addEventListener('click',()=>{libraryPage++;renderTemplateLibrary();});
    };
    window.renderTemplateLibrary=renderTemplateLibrary;
  }

  function downloadBlob(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1600);}
  function physicalSvg(side){
    const spec=currentSpec(),template=selectedTemplate();let svg=renderCard(template,side,false);
    const w=spec.finishedW+spec.bleed*2,h=spec.finishedH+spec.bleed*2,rx=state.custom.cornerStyle==='rounded'?(Number(state.custom.cornerRadiusMm)||4)*10:0,trim=spec.bleed*10;
    const meta=`<metadata>Cardcraft editable vector; finished=${spec.finishedW}x${spec.finishedH}mm; bleed=${spec.bleed}mm; corner=${state.custom.cornerStyle}; side=${side}; template=${template.id}</metadata>`;
    const cut=`<g id="CUT_GUIDE" style="display:none"><rect x="${trim}" y="${trim}" width="${spec.finishedW*10}" height="${spec.finishedH*10}" rx="${rx}" fill="none" stroke="#ff00ff" stroke-width="1"/></g>`;
    svg=svg.replace('<svg xmlns="http://www.w3.org/2000/svg"',`<svg xmlns="http://www.w3.org/2000/svg" width="${w}mm" height="${h}mm"`).replace(/>(?=<svg|<metadata)/,`>${meta}`).replace('</svg>',`${cut}</svg>`);
    return svg;
  }
  async function pngBytes(side){const spec=currentSpec(),dpi=Number(state.custom.exportDpi)||600,svg=renderCard(selectedTemplate(),side,false),w=Math.round((spec.finishedW+spec.bleed*2)/25.4*dpi),h=Math.round((spec.finishedH+spec.bleed*2)/25.4*dpi),blob=await svgToPng(svg,w,h);return new Uint8Array(await blob.arrayBuffer());}
  function crc32(bytes){let c=0xffffffff;for(const b of bytes){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;}
  function u16(v){const a=new Uint8Array(2),d=new DataView(a.buffer);d.setUint16(0,v,true);return a;}function u32(v){const a=new Uint8Array(4),d=new DataView(a.buffer);d.setUint32(0,v>>>0,true);return a;}
  function zipStore(files){
    const enc=new TextEncoder(),locals=[],centrals=[];let offset=0;
    for(const file of files){const name=enc.encode(file.name),data=file.data instanceof Uint8Array?file.data:enc.encode(String(file.data)),crc=crc32(data),local=new Blob([u32(0x04034b50),u16(20),u16(0x0800),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),name,data]);locals.push(local);const central=new Blob([u32(0x02014b50),u16(20),u16(20),u16(0x0800),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),name]);centrals.push(central);offset+=local.size;}
    const centralSize=centrals.reduce((s,b)=>s+b.size,0),end=new Blob([u32(0x06054b50),u16(0),u16(0),u16(files.length),u16(files.length),u32(centralSize),u32(offset),u16(0)]);return new Blob([...locals,...centrals,end],{type:'application/zip'});
  }
  async function exportVectorPackage(){
    const spec=currentSpec(),template=selectedTemplate(),prefix=`cardcraft-${template.id}-${spec.finishedW}x${spec.finishedH}`;
    showToast?.('편집용 원본 패키지를 만들고 있습니다.',3500);
    const [frontPng,backPng]=await Promise.all([pngBytes('front'),pngBytes('back')]);
    const readme=`CARDCRAFT EDITABLE SOURCE\n\nFinished size: ${spec.finishedW} x ${spec.finishedH} mm\nBleed: ${spec.bleed} mm\nCorner: ${state.custom.cornerStyle}\nTemplate: ${template.id}\n\nFILES\n- front.svg / back.svg : Adobe Illustrator 등 벡터 편집 프로그램에서 수정 가능한 원본\n- front.png / back.png : ${state.custom.exportDpi||600}dpi 완성 이미지\n\nNOTE\n텍스트는 편집 가능 상태로 유지됩니다. 사용한 폰트가 컴퓨터에 설치되어 있지 않으면 대체 폰트로 표시될 수 있습니다. SVG 내부의 CUT_GUIDE는 숨김 상태로 포함됩니다.\n`;
    const zip=zipStore([{name:'front.svg',data:physicalSvg('front')},{name:'back.svg',data:physicalSvg('back')},{name:'front.png',data:frontPng},{name:'back.png',data:backPng},{name:'README.txt',data:readme}]);
    downloadBlob(zip,`${prefix}-editable-source.zip`);showToast?.('편집용 벡터 원본 패키지를 만들었습니다.',4200);
  }
  window.CardcraftExports={...(window.CardcraftExports||{}),exportVectorPackage,physicalSvg};

  // 실제 물리 규격 기준으로 PNG 픽셀 수를 계산하도록 기존 내보내기 오류를 교정.
  exportPng=async function(){try{const spec=currentSpec(),t=selectedTemplate(),dpi=Number(state.custom.exportDpi)||600,w=Math.round((spec.finishedW+spec.bleed*2)/25.4*dpi),h=Math.round((spec.finishedH+spec.bleed*2)/25.4*dpi),svg=renderCard(t,state.side),blob=await svgToPng(svg,w,h);downloadBlob(blob,`cardcraft-${t.id}-${state.side}-${spec.finishedW}x${spec.finishedH}-${dpi}dpi.png`);showToast('PNG 파일을 만들었습니다.');}catch(e){console.error(e);showToast('PNG 생성에 실패했습니다.');}};
  window.exportPng=exportPng;

  async function fetchJson(url,options={}){const r=await fetch(url,{...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});let d={};try{d=await r.json();}catch{}if(!r.ok)throw new Error(d?.message||d?.error||`HTTP_${r.status}`);return d;}
  async function purchaseSource(){
    const native=window.CardcraftNativeBilling;
    if(native?.purchase){const result=await native.purchase(PRODUCTS.source.androidProductId);if(result?.granted||result?.purchased)return exportVectorPackage();throw new Error('PURCHASE_NOT_GRANTED');}
    const cfg=window.CARDCRAFT_MONETIZATION||{},session=await fetchJson(cfg.endpoints?.session||'/api/session',{method:'GET'}).catch(()=>({paymentLive:false}));
    if(!session.paymentLive||!cfg.portOne?.storeId||!cfg.portOne?.channelKey||!window.PortOne?.requestPayment){await new Promise(r=>setTimeout(r,650));return exportVectorPackage();}
    const order=await fetchJson(cfg.endpoints?.createOrder||'/api/payments/orders',{method:'POST',body:JSON.stringify({product:PRODUCTS.source.webProduct})});
    const response=await window.PortOne.requestPayment({storeId:cfg.portOne.storeId,channelKey:cfg.portOne.channelKey,paymentId:order.paymentId,orderName:order.orderName,totalAmount:Number(order.amount)||PRODUCTS.source.price,currency:order.currency||'KRW',payMethod:'CARD'});if(response?.code)throw new Error(response.message||'PAYMENT_CANCELLED');
    const verified=await fetchJson(cfg.endpoints?.completePayment||'/api/payments/complete',{method:'POST',body:JSON.stringify({paymentId:response.paymentId||order.paymentId,product:PRODUCTS.source.webProduct})});if(!verified.granted)throw new Error('PAYMENT_NOT_VERIFIED');return exportVectorPackage();
  }
  window.CardcraftCommerce={products:PRODUCTS,purchaseSource};

  const paywall=document.getElementById('ccPaywall'),grid=document.getElementById('ccChoiceGrid'),kicker=document.getElementById('ccKicker');
  if(paywall&&grid&&!document.getElementById('ccSourceChoice')){
    const button=document.createElement('button');button.className='cc-choice cc-source-choice';button.type='button';button.id='ccSourceChoice';button.innerHTML=`<span class="cc-choice-icon">◇</span><span class="cc-choice-copy"><strong>편집용 벡터 원본</strong><span>Illustrator에서 수정 가능한 SVG 원본 + 앞·뒷면 PNG</span></span><span class="cc-choice-price">₩3,900</span>`;grid.appendChild(button);
    const sync=()=>button.hidden=(kicker?.textContent||'').trim()!=='DOWNLOAD';new MutationObserver(sync).observe(kicker,{childList:true,subtree:true,characterData:true});sync();
    button.addEventListener('click',async()=>{button.disabled=true;const old=button.querySelector('.cc-choice-price').textContent;button.querySelector('.cc-choice-price').textContent='처리 중';try{await purchaseSource();paywall.classList.remove('is-open');paywall.setAttribute('aria-hidden','true');document.body.style.overflow='';}catch(e){console.error(e);showToast?.(/cancel/i.test(e.message)?'결제가 취소되었습니다.':'원본 파일 결제를 완료하지 못했습니다.',4200);}finally{button.disabled=false;button.querySelector('.cc-choice-price').textContent=old;}});
  }

  // 화면의 기존 100개 표기를 실제 카탈로그 규모에 맞춤.
  document.querySelectorAll('.hero-stat span').forEach(el=>{if(/100 TEMPLATE/.test(el.textContent))el.textContent='1,000 TEMPLATE LIBRARY · PRINT READY';});
  const vh=document.getElementById('variantHeading');if(vh)vh.textContent='1,000개 디자인 중 추천 시안 5개';
  document.querySelector('.variants-heading p')?.replaceChildren(document.createTextNode('100개 구조 베이스와 10개 아트디렉션으로 구성한 1,000개 디자인 풀에서 5개씩 추천합니다.'));
  const libBtn=document.getElementById('libraryBtn');if(libBtn)libBtn.textContent='▦ 전체 1,000개 보기';
  const regen=document.getElementById('regenerateBtn');if(regen)regen.textContent='↻ 1,000개에서 다시 추천';
  const modalTitle=document.querySelector('#templateModal .section-label');if(modalTitle)modalTitle.textContent='1,000 TEMPLATE LIBRARY';
  const modalP=document.querySelector('#templateModalTitle + p');if(modalP)modalP.textContent='추천 5개 외에 1,000개 시안을 카테고리별로 나눠 직접 선택할 수 있습니다.';
  syncSpecUi();
  if(typeof renderDynamic==='function')renderDynamic();
  if(typeof renderVariants==='function')renderVariants();
  console.info('Cardcraft V11 production foundation active', {templates:LIBRARY.length,products:PRODUCTS,spec:currentSpec().id});
})();
