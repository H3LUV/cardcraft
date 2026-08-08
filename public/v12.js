(function cardcraftV12CatalogAndFormats(){
  'use strict';
  if(typeof state==='undefined'||typeof LIBRARY==='undefined'||typeof renderCard!=='function')return;

  const SPECS={
    'kr-90x50':{id:'kr-90x50',label:'90 × 50 mm · 표준',w:90,h:50,bleed:3},
    'credit-86x54':{id:'credit-86x54',label:'86 × 54 mm · 카드형',w:86,h:54,bleed:3},
    'slim-90x45':{id:'slim-90x45',label:'90 × 45 mm · 슬림',w:90,h:45,bleed:3},
    'square-55x55':{id:'square-55x55',label:'55 × 55 mm · 정사각',w:55,h:55,bleed:3}
  };
  const THEMES=[
    {key:'brand',label:'Brand'},
    {key:'midnight',label:'Midnight'},
    {key:'paper',label:'Paper'},
    {key:'warm',label:'Warm'},
    {key:'cool',label:'Cool'}
  ];
  const COMPOSITIONS=[
    {key:'core',label:'Core'},
    {key:'studio',label:'Studio'}
  ];
  const INDUSTRIES={
    all:{label:'전체'},
    corporate:{label:'기업·영업'},
    professional:{label:'법률·세무'},
    medical:{label:'병원·의료'},
    realestate:{label:'부동산'},
    beauty:{label:'뷰티·패션'},
    food:{label:'카페·식음료'},
    tech:{label:'IT·스타트업'},
    travel:{label:'여행·레저'},
    education:{label:'교육'},
    creative:{label:'디자인·크리에이터'},
    personal:{label:'개인·프리랜서'}
  };

  const v11Render=renderCard;
  const baseTemplates=LIBRARY.filter(t=>!t.baseId&&(t.themeKey==='brand'||!t.themeKey)).slice(0,100).map(t=>({...t}));
  if(baseTemplates.length<80){console.warn('Cardcraft V12: base catalog not ready');return;}

  function tagsFor(base){
    const byCategory={
      minimal:['corporate','professional','medical','education','personal'],
      classic:['professional','corporate','medical','realestate','education'],
      modern:['tech','corporate','realestate','travel','personal'],
      creative:['creative','beauty','food','travel','personal'],
      casual:['food','beauty','education','travel','personal']
    };
    const list=[...(byCategory[base.category]||['corporate','personal'])];
    const extra=['corporate','professional','medical','realestate','beauty','food','tech','travel','education','creative','personal'][Number(base.layout||0)%11];
    if(!list.includes(extra))list.push(extra);
    return list;
  }

  const catalog=[];
  for(const base of baseTemplates){
    for(const composition of COMPOSITIONS){
      for(const theme of THEMES){
        catalog.push({...base,
          id:`${base.id}-${composition.key}-${theme.key}`,
          baseId:base.id,
          baseLabel:base.label,
          label:`${base.label} · ${composition.label} · ${theme.label}`,
          compositionKey:composition.key,
          compositionLabel:composition.label,
          themeKey:theme.key,
          themeLabel:theme.label,
          industryTags:tagsFor(base),
          description:`${base.description} · ${composition.label} 구성 · ${theme.label} 아트디렉션`
        });
      }
    }
  }
  LIBRARY.splice(0,LIBRARY.length,...catalog);

  const specSelect=document.getElementById('ccV11Spec');
  if(specSelect){
    [...specSelect.options].forEach(option=>{
      if(option.value==='square-55x55'){option.disabled=false;option.textContent=SPECS['square-55x55'].label;}
      else if(SPECS[option.value])option.textContent=SPECS[option.value].label;
    });
  }
  try{
    const saved=JSON.parse(localStorage.getItem(typeof STORAGE_KEY==='string'?STORAGE_KEY:'cardcraft-static-v4')||'null');
    if(saved?.custom?.cardSpec==='square-55x55')state.custom.cardSpec='square-55x55';
  }catch(_){ }
  if(!SPECS[state.custom.cardSpec])state.custom.cardSpec='kr-90x50';
  state.custom.cornerRadiusMm=Math.max(2,Math.min(8,Number(state.custom.cornerRadiusMm)||4));

  function mixHex(a,b,t){
    const parse=h=>{const v=String(h||'#000000').replace('#','');const n=parseInt(v.length===3?v.split('').map(c=>c+c).join(''):v,16);return[(n>>16)&255,(n>>8)&255,n&255];};
    const A=parse(a),B=parse(b);return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('');
  }
  function paletteFor(template){
    const p=state.custom.primary||'#2563eb',key=template?.themeKey||'brand';
    if(key==='midnight')return{primary:mixHex(p,'#7c3aed',.25),bg:'#0f172a',fg:'#f8fafc',muted:'#cbd5e1'};
    if(key==='paper')return{primary:mixHex(p,'#8a5a33',.32),bg:'#f7f1e7',fg:'#292524',muted:'#78716c'};
    if(key==='warm')return{primary:mixHex(p,'#c2410c',.44),bg:'#fffaf5',fg:'#3f2d25',muted:'#8b6f63'};
    if(key==='cool')return{primary:mixHex(p,'#1d4ed8',.40),bg:'#f8fafc',fg:'#172554',muted:'#64748b'};
    return{primary:p,bg:state.custom.background||'#ffffff',fg:state.custom.text||'#111827',muted:'#667085'};
  }
  function esc(v=''){return typeof escapeXml==='function'?escapeXml(v):String(v).replace(/[<>&'\"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','\"':'&quot;'}[c]));}
  function currentSpec(){return SPECS[state.custom.cardSpec]||SPECS['kr-90x50'];}
  function svgLogo(x,y,w,h,palette,round=14){
    const data=state.data||{};
    if(data.logoDataUrl)return `<image id="LOGO_PRIMARY" href="${data.logoDataUrl}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>`;
    const initial=esc((data.company||'C').trim().slice(0,1).toUpperCase()||'C');
    const s=Math.min(w,h);return `<g id="LOGO_PRIMARY"><rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${round}" fill="${palette.primary}"/><text x="${x+s/2}" y="${y+s*.69}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="800" font-size="${s*.52}" fill="${palette.bg}">${initial}</text></g>`;
  }
  function secondaryLogo(x,y,w,h){
    const src=state.data?.secondaryLogoDataUrl;if(!src)return'';
    return `<image id="LOGO_SECONDARY" href="${src}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>`;
  }
  function textEl(id,x,y,text,size,weight,color,anchor='start',font='Arial, sans-serif',extra=''){
    if(!text)return'';
    return `<text id="${id}" x="${x}" y="${y}" font-family="${font}" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}" ${extra}>${esc(text)}</text>`;
  }
  function contacts(x,y,gap,size,color,anchor='start',max=4){
    const d=state.data||{},rows=[d.phone,d.email,d.website,d.address].filter(Boolean).slice(0,max);
    return `<g id="CONTACTS">${rows.map((v,i)=>textEl(`CONTACT_${i+1}`,x,y+i*gap,v,size,500,color,anchor)).join('')}</g>`;
  }
  function clipId(template,side){return `clip-${String(template.id).replace(/[^a-z0-9_-]/gi,'')}-${side}`;}

  function responsiveBody(template,side,spec,pal){
    const d=state.data||{},W=(spec.w+spec.bleed*2)*10,H=(spec.h+spec.bleed*2)*10,B=spec.bleed*10;
    const x0=B,y0=B,w=spec.w*10,h=spec.h*10,min=Math.min(w,h),pad=Math.max(28,min*.075);
    const left=x0+pad,right=x0+w-pad,top=y0+pad,bottom=y0+h-pad,cx=x0+w/2,cy=y0+h/2;
    const font=typeof categoryFont==='function'?categoryFont(template):'Arial, sans-serif';
    const pattern=((Number(template.layout)||0)+(template.compositionKey==='studio'?7:0))%12;
    const small=Math.max(14,min*.034),body=Math.max(16,min*.040),title=Math.max(18,min*.046),name=Math.max(30,min*.082),company=Math.max(19,min*.050);
    const logo=Math.max(70,Math.min(min*.29,150));
    const faint=pal.primary+'22',soft=pal.primary+'14';
    if(side==='back'){
      const back=pattern%5;
      if(back===0)return `${svgLogo(cx-logo/2,cy-logo*.70,logo,logo,pal)}${textEl('COMPANY',cx,cy+logo*.64,d.company,company,800,pal.fg,'middle',font)}${textEl('SLOGAN',cx,cy+logo*.95,d.slogan||d.industry,small,500,pal.muted,'middle',font)}`;
      if(back===1)return `<rect x="${x0}" y="${y0}" width="${w*.34}" height="${h}" fill="${pal.primary}"/>${svgLogo(left,cy-logo/2,logo,logo,{...pal,primary:pal.bg,bg:pal.primary})}${textEl('COMPANY',x0+w*.42,cy-15,d.company,name*.75,800,pal.fg,'start',font)}${textEl('SLOGAN',x0+w*.42,cy+30,d.slogan||d.industry,body,500,pal.muted,'start',font)}`;
      if(back===2)return `<rect x="${left}" y="${top}" width="${right-left}" height="${bottom-top}" rx="${Math.max(16,min*.06)}" fill="${soft}" stroke="${faint}"/>${svgLogo(cx-logo/2,top+pad*.6,logo,logo,pal)}${textEl('COMPANY',cx,bottom-pad*.95,d.company,company,800,pal.fg,'middle',font)}`;
      if(back===3)return `<circle cx="${right}" cy="${top}" r="${min*.34}" fill="${faint}"/><circle cx="${right}" cy="${top}" r="${min*.20}" fill="${soft}"/>${textEl('COMPANY',left,cy-10,d.company,name*.86,800,pal.fg,'start',font)}${textEl('SLOGAN',left,cy+35,d.slogan||d.industry,body,500,pal.muted,'start',font)}${secondaryLogo(right-logo*.75,bottom-logo*.35,logo*.75,logo*.35)}`;
      return `<path d="M${x0} ${y0+h*.72} L${x0+w} ${y0+h*.45} L${x0+w} ${y0+h} L${x0} ${y0+h}Z" fill="${pal.primary}" opacity=".95"/>${svgLogo(cx-logo/2,top+pad*.25,logo,logo,pal)}${textEl('COMPANY',cx,top+logo+pad*1.2,d.company,company,800,pal.fg,'middle',font)}`;
    }

    if(pattern===0)return `${svgLogo(left,top,logo,logo,pal)}${textEl('COMPANY',left+logo+pad*.7,top+company,d.company,company,800,pal.fg,'start',font)}${textEl('NAME',left,bottom-name*1.55,d.name,name,800,pal.fg,'start',font)}${textEl('TITLE',left,bottom-name*.78,d.title,title,600,pal.primary,'start',font)}${contacts(right,bottom-body*3.0,body*1.45,body,pal.muted,'end',3)}`;
    if(pattern===1)return `<rect x="${x0}" y="${y0}" width="${w*.32}" height="${h}" fill="${pal.primary}"/>${svgLogo(left,top,logo,logo,{...pal,primary:pal.bg,bg:pal.primary})}${textEl('NAME',x0+w*.40,top+name,d.name,name,800,pal.fg,'start',font)}${textEl('TITLE',x0+w*.40,top+name+title*1.5,d.title,title,600,pal.primary,'start',font)}${contacts(x0+w*.40,bottom-body*3.0,body*1.5,body,pal.muted,'start',3)}`;
    if(pattern===2)return `${textEl('COMPANY',cx,top+company,d.company,company,800,pal.primary,'middle',font)}${svgLogo(cx-logo/2,cy-logo*.72,logo,logo,pal)}${textEl('NAME',cx,cy+logo*.62,d.name,name*.85,800,pal.fg,'middle',font)}${textEl('TITLE',cx,cy+logo*.95,d.title,title,500,pal.muted,'middle',font)}${contacts(cx,bottom-body*2.1,body*1.4,body,pal.muted,'middle',2)}`;
    if(pattern===3)return `<path d="M${x0} ${y0} L${x0+w*.38} ${y0} L${x0+w*.68} ${y0+h} L${x0+w*.30} ${y0+h}Z" fill="${faint}"/><path d="M${x0+w*.84} ${y0} L${x0+w} ${y0} L${x0+w} ${y0+h} L${x0+w*.64} ${y0+h}Z" fill="${pal.primary}"/>${svgLogo(left,top,logo,logo,pal)}${textEl('NAME',left,cy+name*.3,d.name,name,800,pal.fg,'start',font)}${textEl('TITLE',left,cy+name*.9,d.title,title,600,pal.primary,'start',font)}${contacts(right-pad*.2,bottom-body*3.3,body*1.45,body,pal.muted,'end',3)}`;
    if(pattern===4)return `<rect x="${left}" y="${top}" width="${right-left}" height="${bottom-top}" rx="${Math.max(12,min*.035)}" fill="none" stroke="${pal.primary}" stroke-width="2"/>${textEl('COMPANY',left+pad*.55,top+company*1.6,d.company,company,800,pal.primary,'start',font)}${textEl('NAME',left+pad*.55,cy,d.name,name,800,pal.fg,'start',font)}${textEl('TITLE',left+pad*.55,cy+title*1.7,d.title,title,500,pal.muted,'start',font)}${contacts(right-pad*.55,bottom-body*3.2,body*1.45,body,pal.muted,'end',3)}`;
    if(pattern===5)return `${textEl('COMPANY',left,top+company,d.company,company,700,pal.primary,'start',font)}${textEl('NAME',left,cy+name*.1,d.name,name*1.18,900,pal.fg,'start',font)}${textEl('TITLE',left,cy+name*.86,d.title,title,600,pal.muted,'start',font)}<rect x="${left}" y="${bottom-body*.70}" width="${Math.min(w*.42,330)}" height="5" rx="3" fill="${pal.primary}"/>${contacts(right,bottom-body*3.0,body*1.45,body,pal.muted,'end',3)}`;
    if(pattern===6)return `<circle cx="${left+logo*.56}" cy="${cy}" r="${logo*.72}" fill="${soft}"/>${svgLogo(left,cy-logo/2,logo,logo,pal)}${textEl('COMPANY',left+logo*1.45,top+company,d.company,company,800,pal.primary,'start',font)}${textEl('NAME',left+logo*1.45,cy,d.name,name,800,pal.fg,'start',font)}${textEl('TITLE',left+logo*1.45,cy+title*1.6,d.title,title,500,pal.muted,'start',font)}${contacts(left+logo*1.45,bottom-body*2.5,body*1.35,body,pal.muted,'start',2)}`;
    if(pattern===7)return `<line x1="${cx}" y1="${top}" x2="${cx}" y2="${bottom}" stroke="${faint}" stroke-width="2"/>${svgLogo(left,top,logo,logo,pal)}${textEl('COMPANY',left,top+logo+company*.8,d.company,company,800,pal.primary,'start',font)}${textEl('NAME',cx+pad,top+name,d.name,name,800,pal.fg,'start',font)}${textEl('TITLE',cx+pad,top+name+title*1.5,d.title,title,500,pal.muted,'start',font)}${contacts(cx+pad,bottom-body*3.2,body*1.45,body,pal.muted,'start',3)}`;
    if(pattern===8)return `<rect x="${left}" y="${top}" width="${Math.max(45,min*.10)}" height="${bottom-top}" rx="${Math.max(14,min*.04)}" fill="${pal.primary}"/>${textEl('COMPANY',left+Math.max(45,min*.10)+pad*.6,top+company,d.company,company,800,pal.primary,'start',font)}${textEl('NAME',left+Math.max(45,min*.10)+pad*.6,cy,d.name,name,800,pal.fg,'start',font)}${textEl('TITLE',left+Math.max(45,min*.10)+pad*.6,cy+title*1.7,d.title,title,500,pal.muted,'start',font)}${contacts(right,bottom-body*3.0,body*1.45,body,pal.muted,'end',3)}`;
    if(pattern===9)return `<rect x="${right-min*.22}" y="${top}" width="${min*.22}" height="${min*.22}" rx="${min*.06}" fill="${pal.primary}"/><circle cx="${right-min*.11}" cy="${top+min*.11}" r="${min*.035}" fill="${pal.bg}"/>${textEl('COMPANY',left,top+company,d.company,company,800,pal.primary,'start',font)}${textEl('NAME',left,cy,d.name,name,800,pal.fg,'start',font)}${textEl('TITLE',left,cy+title*1.7,d.title,title,500,pal.muted,'start',font)}${contacts(left,bottom-body*3.0,body*1.45,body,pal.muted,'start',3)}`;
    if(pattern===10)return `<rect x="${x0}" y="${y0+h*.68}" width="${w}" height="${h*.32}" fill="${pal.primary}"/>${svgLogo(left,top,logo,logo,pal)}${textEl('NAME',left+logo+pad*.7,top+name,d.name,name,800,pal.fg,'start',font)}${textEl('TITLE',left+logo+pad*.7,top+name+title*1.5,d.title,title,500,pal.muted,'start',font)}${contacts(left,bottom-body*2.0,body*1.4,body,pal.bg,'start',3)}`;
    return `<text x="${left}" y="${top+company}" font-family="${font}" font-size="${company}" font-weight="800" fill="${pal.primary}">${esc(d.company)}</text><text x="${left}" y="${cy}" font-family="${font}" font-size="${name*1.05}" font-weight="900" fill="${pal.fg}">${esc(d.name)}</text><text x="${right}" y="${cy+title*.15}" text-anchor="end" font-family="${font}" font-size="${title}" font-weight="600" fill="${pal.primary}">${esc(d.title)}</text><line x1="${left}" y1="${cy+name*.52}" x2="${right}" y2="${cy+name*.52}" stroke="${faint}" stroke-width="2"/>${contacts(left,bottom-body*2.5,body*1.4,body,pal.muted,'start',2)}${secondaryLogo(right-logo*.75,bottom-logo*.35,logo*.75,logo*.35)}`;
  }

  function responsiveSvg(template,side='front',mini=false){
    const spec=currentSpec(),pal=paletteFor(template),W=(spec.w+spec.bleed*2)*10,H=(spec.h+spec.bleed*2)*10,B=spec.bleed*10,rx=state.custom.cornerStyle==='rounded'?state.custom.cornerRadiusMm*10:0,clip=clipId(template,side);
    const body=responsiveBody(template,side,spec,pal);
    const guides=state.custom.showGuides&&!mini?`<g id="PRINT_GUIDES" pointer-events="none"><rect x="${B}" y="${B}" width="${spec.w*10}" height="${spec.h*10}" rx="${rx}" fill="none" stroke="#ef4444" stroke-dasharray="8 6" opacity=".62"/><rect x="${B+30}" y="${B+30}" width="${Math.max(1,spec.w*10-60)}" height="${Math.max(1,spec.h*10-60)}" rx="${Math.max(0,rx-30)}" fill="none" stroke="#3b82f6" stroke-dasharray="7 6" opacity=".52"/></g>`:'';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(template.label)} ${spec.w}x${spec.h}mm ${side==='front'?'앞면':'뒷면'}"><defs><clipPath id="${clip}"><rect x="0" y="0" width="${W}" height="${H}"/></clipPath></defs><g id="ARTWORK" clip-path="url(#${clip})"><rect id="BACKGROUND" width="${W}" height="${H}" fill="${pal.bg}"/>${body}</g>${guides}</svg>`;
  }

  renderCard=function(template,side='front',mini=false){
    const spec=currentSpec();
    if(spec.id==='kr-90x50'&&template?.compositionKey==='core')return v11Render(template,side,mini);
    return responsiveSvg(template,side,mini);
  };
  window.renderCard=renderCard;

  function detectIndustry(){
    const s=`${state.data?.industry||''} ${state.data?.company||''}`.toLowerCase();
    if(/법률|변호|세무|회계|노무|컨설팅/.test(s))return'professional';
    if(/병원|의원|의료|치과|약국|한의/.test(s))return'medical';
    if(/부동산|공인중개|분양|건설|인테리어/.test(s))return'realestate';
    if(/미용|뷰티|네일|헤어|패션|화장품/.test(s))return'beauty';
    if(/카페|커피|식당|요리|베이커리|푸드|레스토랑/.test(s))return'food';
    if(/it|테크|개발|소프트웨어|스타트업|ai|인공지능/.test(s))return'tech';
    if(/여행|관광|호텔|레저|항공|투어/.test(s))return'travel';
    if(/교육|학원|학교|강사|교수/.test(s))return'education';
    if(/디자인|사진|영상|콘텐츠|미디어|광고|크리에이터/.test(s))return'creative';
    if(/프리랜서|개인|작가|아티스트/.test(s))return'personal';
    return'corporate';
  }

  const oldBuildRecommendations=typeof buildRecommendations==='function'?buildRecommendations:null;
  buildRecommendations=function(){
    const rand=typeof mulberry32==='function'?mulberry32(Number(state.recommendationSeed)||1):Math.random;
    const industry=detectIndustry(),preferred=typeof preferredCategories==='function'?preferredCategories():[];
    let pool=state.category==='all'?[...LIBRARY]:LIBRARY.filter(t=>t.category===state.category);
    pool=pool.map(t=>({t,score:rand()+(t.industryTags?.includes(industry)?.58:0)+(preferred.includes(t.category)?.32:0)+(t.compositionKey==='studio'?.06:0)})).sort((a,b)=>b.score-a.score).map(x=>x.t);
    const chosen=[],seenBase=new Set(),categoryCount={};
    for(const t of pool){
      if(seenBase.has(t.baseId)&&chosen.length<4)continue;
      if(state.category==='all'&&(categoryCount[t.category]||0)>=2)continue;
      chosen.push(t);seenBase.add(t.baseId);categoryCount[t.category]=(categoryCount[t.category]||0)+1;
      if(chosen.length===5)break;
    }
    state.recommendedIds=chosen.map(t=>t.id);state.selectedId=chosen[0]?.id||LIBRARY[0].id;
  };
  if(!oldBuildRecommendations)console.warn('Cardcraft V12: recommendation engine fallback active');

  state.recommendedIds=[];buildRecommendations();persist?.();

  let industryFilter='all',libraryPage=1;const PAGE_SIZE=48;
  renderTemplateLibrary=function(){
    const tabs=document.getElementById('templateTabs'),grid=document.getElementById('templateLibraryGrid');if(!tabs||!grid)return;
    const counts=Object.fromEntries(Object.keys(STYLE_META).map(k=>[k,k==='all'?LIBRARY.length:LIBRARY.filter(t=>t.category===k).length]));
    tabs.innerHTML=Object.entries(STYLE_META).map(([key,item])=>`<button class="${templateLibraryCategory===key?'active':''}" data-library-category="${key}">${item.name}<small>${counts[key]||0}</small></button>`).join('');
    let filter=document.getElementById('ccV12IndustryFilter');
    if(!filter){filter=document.createElement('nav');filter.id='ccV12IndustryFilter';filter.className='cc-v12-industry';grid.insertAdjacentElement('beforebegin',filter);}
    filter.innerHTML=Object.entries(INDUSTRIES).map(([key,item])=>`<button type="button" class="${industryFilter===key?'active':''}" data-industry="${key}">${item.label}</button>`).join('');
    let pool=templateLibraryCategory==='all'?[...LIBRARY]:LIBRARY.filter(t=>t.category===templateLibraryCategory);
    if(industryFilter!=='all')pool=pool.filter(t=>t.industryTags?.includes(industryFilter));
    const visible=pool.slice(0,libraryPage*PAGE_SIZE);
    grid.innerHTML=visible.map(t=>`<button class="template-library-card ${state.selectedId===t.id?'selected':''}" data-library-template="${t.id}"><div class="template-library-preview">${renderCard(t,'front',true)}</div><div><span>${STYLE_META[t.category]?.name||t.category} · ${t.compositionLabel} · ${t.themeLabel}</span><strong>${t.baseLabel}</strong><small>${t.description}</small></div></button>`).join('')+(visible.length<pool.length?`<button class="template-library-card cc-v11-more" id="ccV12More" type="button"><div><strong>더 보기</strong><small>${visible.length} / ${pool.length}</small></div></button>`:'')+(!pool.length?'<div class="cc-v12-empty">이 조건에 맞는 디자인이 없습니다.</div>':'');
    tabs.querySelectorAll('[data-library-category]').forEach(btn=>btn.addEventListener('click',()=>{templateLibraryCategory=btn.dataset.libraryCategory;libraryPage=1;renderTemplateLibrary();}));
    filter.querySelectorAll('[data-industry]').forEach(btn=>btn.addEventListener('click',()=>{industryFilter=btn.dataset.industry;libraryPage=1;renderTemplateLibrary();}));
    grid.querySelectorAll('[data-library-template]').forEach(btn=>btn.addEventListener('click',()=>{state.selectedId=btn.dataset.libraryTemplate;state.activeStep=3;persist?.();renderDynamic?.();renderVariants?.();renderSteps?.();closeTemplateLibrary?.();}));
    document.getElementById('ccV12More')?.addEventListener('click',()=>{libraryPage++;renderTemplateLibrary();});
  };
  window.renderTemplateLibrary=renderTemplateLibrary;

  const formatPanel=document.querySelector('.cc-v11-spec');
  if(formatPanel&&!document.getElementById('ccV12Radius')){
    const radius=document.createElement('div');radius.className='cc-v12-radius';radius.id='ccV12Radius';
    radius.innerHTML='<span>둥근 모서리 반경</span><div><button type="button" data-radius="2">2mm</button><button type="button" data-radius="4">4mm</button><button type="button" data-radius="6">6mm</button></div>';
    formatPanel.appendChild(radius);
    radius.querySelectorAll('[data-radius]').forEach(btn=>btn.addEventListener('click',()=>{state.custom.cornerStyle='rounded';state.custom.cornerRadiusMm=Number(btn.dataset.radius);persist?.();syncUi();renderDynamic?.();renderVariants?.();showToast?.(`둥근 모서리 ${btn.dataset.radius}mm를 적용했습니다.`);}));
  }

  function syncUi(){
    const spec=currentSpec();
    if(specSelect)specSelect.value=spec.id;
    document.querySelectorAll('#ccV12Radius [data-radius]').forEach(b=>b.classList.toggle('active',Number(b.dataset.radius)===Number(state.custom.cornerRadiusMm)));
    document.getElementById('ccV12Radius')?.classList.toggle('is-visible',state.custom.cornerStyle==='rounded');
    const count=document.querySelector('.cc-v11-count');if(count)count.textContent='1,000 · 200 STRUCTURES';
    const save=document.getElementById('saveBtn');if(save)save.textContent='▣ 작업 저장';
    const exp=document.getElementById('exportBtn');if(exp)exp.textContent='↓ 다운로드 옵션';
  }
  document.querySelectorAll('[data-cc-corner]').forEach(btn=>btn.addEventListener('click',()=>requestAnimationFrame(syncUi)));
  specSelect?.addEventListener('change',()=>requestAnimationFrame(()=>{syncUi();renderDynamic?.();renderVariants?.();}));

  document.querySelectorAll('.hero-stat span').forEach(el=>el.textContent='1,000 TEMPLATE LIBRARY · 200 STRUCTURES');
  const vh=document.getElementById('variantHeading');if(vh)vh.textContent='1,000개 디자인 중 추천 시안 5개';
  const vp=document.querySelector('.variants-heading p');if(vp)vp.textContent='200개 구조 베이스와 5개 아트디렉션을 조합한 1,000개 디자인에서 업종에 맞춰 추천합니다.';
  const modalP=document.querySelector('#templateModalTitle + p');if(modalP)modalP.textContent='스타일과 업종을 함께 선택해 1,000개 디자인을 탐색할 수 있습니다.';
  const footer=document.querySelector('footer span:first-child');if(footer)footer.textContent='CARDCRAFT V12 · 1,000 DESIGNS · 200 STRUCTURES · EDITABLE VECTOR EXPORT';

  syncUi();renderDynamic?.();renderVariants?.();
  console.info('Cardcraft V12 catalog and format engine active',{templates:LIBRARY.length,structures:200,spec:currentSpec().id});
})();
