const DEFAULT_DATA = {
  company: 'NORTH & CO.', name: '김남우', title: 'BRAND DIRECTOR', phone: '010 1234 5678',
  email: 'namu@northandco.kr', address: '서울특별시 중구 세종대로 110', website: 'northandco.kr',
  slogan: 'Make every first impression count.', industry: '여행 · 라이프스타일', logoDataUrl: '', logoFileName: ''
};
const DEFAULT_CUSTOM = {
  primary:'#2563eb', background:'#ffffff', text:'#111827', fontScale:1, spacing:1,
  logoScale:1.5, align:'left', showGuides:false, exportDpi:600
};
const STYLE_META = {
  all:{name:'전체 추천',eyebrow:'SMART MIX',description:'100개 라이브러리에서 업종 맞춤 추천',color:'#101828'},
  minimal:{name:'미니멀',eyebrow:'QUIET & CLEAR',description:'넓은 여백과 정교한 타이포',color:'#334155'},
  classic:{name:'클래식',eyebrow:'FORMAL & TRUSTED',description:'신뢰감 있는 정돈된 인상',color:'#7c2d12'},
  modern:{name:'모던',eyebrow:'BOLD & SHARP',description:'강한 대비와 구조적 레이아웃',color:'#4338ca'},
  creative:{name:'크리에이티브',eyebrow:'EDITORIAL & UNIQUE',description:'시선을 끄는 편집 디자인',color:'#be185d'},
  casual:{name:'캐주얼',eyebrow:'FRIENDLY & BRIGHT',description:'부드럽고 친근한 브랜드 무드',color:'#047857'}
};
const TEMPLATE_NAMES = {
  minimal:['Quiet Grid','Pure Line','Whitespace','Mono Mark','Essential','Silent Frame','Fine Margin','Clear Type','Linear Note','Nordic Blank','Soft Rule','Paper Air','Calm Axis','Mono Index','Open Space','Tidy Stack','White Signal','Small Detail','Bare Studio','Precise Point'],
  classic:['Signature','Heritage','Executive','Fine Rule','Prestige','Maison Serif','Old Money','Diplomat','Royal Ledger','Trust Seal','Archive Gold','Boardroom','Legacy Mark','Formal Crest','Ivory Line','Chairman','Grand Letter','Private Office','Institution','Timeless Name'],
  modern:['Split Frame','Block Type','Signal Bar','Edge Code','Bold Axis','Neo Grid','Black Shift','Tech Panel','Hard Contrast','Future Line','Data Block','Electric Cut','Urban Stack','Modular ID','Digital Stripe','Sharp Corner','Vector Field','Night System','Chrome Type','Command Card'],
  creative:['Editorial','Offset Type','Studio Cut','Color Field','Artboard','Magazine Fold','Crop Mark','Poster Name','Abstract Orbit','Gallery Label','Typographic Wave','Cutout Shape','Ink Collision','Creative Bureau','Diagonal Story','Memphis Note','Layered Paper','Art Director','Visual Essay','Studio Experiment'],
  casual:['Soft Corner','Friendly Dot','Warm Stripe','Hello Card','Easy Brand','Sunny Note','Round Talk','Playful Patch','Mint Label','Peach Studio','Smile Line','Bubble Type','Weekend Card','Cozy Grid','Happy Stamp','Gentle Wave','Everyday Brand','Soft Badge','Color Picnic','Nice To Meet']
};
const LAYOUT_DESCRIPTIONS = [
  '세로 포인트 라인과 정돈된 정보 구조','브랜드 블록과 개인 정보를 분리한 구성','원형 그래픽과 넓은 여백의 조합','상단 헤더가 강한 인상을 만드는 구조','유연한 곡선으로 브랜드 무드를 강조',
  '중앙 로고와 하단 정보의 균형','대각 분할을 활용한 역동적 구성','이중 프레임으로 완성도를 높인 구성','대형 이니셜을 배경 그래픽으로 활용','두 개 열로 정보를 명확하게 분류',
  '하단 컬러 밴드로 시선을 고정','세로 라벨을 활용한 편집형 구성','모서리 브래킷으로 정밀한 인상','라운드 정보 태그를 활용한 친근한 구성','큰 타이포와 작은 정보를 대비',
  '이중 스트라이프로 리듬을 만든 구성','겹친 도형으로 깊이감을 만든 구성','격자형 색면으로 모던한 인상','중앙 정렬 타이포 중심의 절제된 구성','로고를 크게 보여주는 브랜드 우선 구성'
];
const FIELD_CONFIG = [
  ['company','회사명 / 브랜드명',true],['name','이름',true],['title','직함 / 직책'],['phone','전화번호',true],
  ['email','이메일'],['website','웹사이트 / SNS'],['address','주소',false,'span-2'],['industry','업종 / 분야'],['slogan','슬로건 / 기타 문구']
];
const STORAGE_KEY = 'cardcraft-static-v4';
const PDFJS_SOURCES = [
  {module:'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs',worker:'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs'},
  {module:'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs',worker:'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs'}
];
const LIBRARY = Object.entries(TEMPLATE_NAMES).flatMap(([category,names]) => names.map((label,layout) => ({
  id:`${category}-${String(layout+1).padStart(2,'0')}`, category, label, layout,
  description:LAYOUT_DESCRIPTIONS[layout]
})));
let state = {
  data:{...DEFAULT_DATA}, custom:{...DEFAULT_CUSTOM}, category:'all', selectedId:'minimal-01', side:'front',
  activeStep:1, recommendationSeed:Date.now()%1000000, recommendedIds:[]
};

function escapeXml(value=''){ return String(value).replace(/[<>&'\"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','\"':'&quot;'}[c])); }
function shade(hex,percent){
  const v=(hex||'#000000').replace('#',''); const n=parseInt(v.length===3?v.split('').map(c=>c+c).join(''):v,16); const a=Math.round(2.55*percent);
  const r=Math.max(0,Math.min(255,(n>>16)+a)),g=Math.max(0,Math.min(255,((n>>8)&255)+a)),b=Math.max(0,Math.min(255,(n&255)+a));
  return '#'+(0x1000000+r*0x10000+g*0x100+b).toString(16).slice(1);
}
function rgba(hex,alpha){ const v=hex.replace('#',''); const n=parseInt(v.length===3?v.split('').map(c=>c+c).join(''):v,16); return `rgba(${n>>16},${(n>>8)&255},${n&255},${alpha})`; }
function mulberry32(seed){ return function(){ let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;}; }
function preferredCategories(){
  const s=`${state.data.industry} ${state.data.company}`.toLowerCase();
  if(/법률|회계|세무|금융|컨설팅|병원|의료|교육/.test(s)) return ['classic','minimal'];
  if(/여행|관광|콘텐츠|미디어|디자인|사진|영상|광고/.test(s)) return ['creative','modern','casual'];
  if(/it|테크|개발|소프트웨어|스타트업|ai|인공지능/.test(s)) return ['modern','minimal'];
  if(/카페|공방|꽃|뷰티|패션|식당|베이커리|라이프/.test(s)) return ['casual','creative'];
  return ['minimal','modern','classic'];
}
function buildRecommendations(){
  const rand=mulberry32(Number(state.recommendationSeed)||1);
  let pool=state.category==='all'?[...LIBRARY]:LIBRARY.filter(t=>t.category===state.category);
  const preferred=preferredCategories();
  pool=pool.map(t=>({t,score:rand()+(state.category==='all'&&preferred.includes(t.category)?.42:0)})).sort((a,b)=>b.score-a.score).map(x=>x.t);
  const selected=[]; const counts={};
  for(const t of pool){
    if(state.category==='all' && (counts[t.category]||0)>=2) continue;
    selected.push(t);counts[t.category]=(counts[t.category]||0)+1;
    if(selected.length===5)break;
  }
  state.recommendedIds=selected.map(t=>t.id); state.selectedId=selected[0]?.id||LIBRARY[0].id;
}
function ensureRecommendations(){
  const valid=Array.isArray(state.recommendedIds)&&state.recommendedIds.length===5&&state.recommendedIds.every(id=>LIBRARY.some(t=>t.id===id));
  if(!valid) buildRecommendations();
}
function makeTemplates(){ ensureRecommendations(); return state.recommendedIds.map(id=>LIBRARY.find(t=>t.id===id)).filter(Boolean); }
function selectedTemplate(){ return LIBRARY.find(t=>t.id===state.selectedId)||makeTemplates()[0]||LIBRARY[0]; }
function isDarkTemplate(t){ return t.category==='modern'?[0,1,3,6,8,11,14,17,19].includes(t.layout):t.category==='creative'?[6,8,11,14,16].includes(t.layout):t.category==='classic'?[7,10,15,18].includes(t.layout):false; }
function categoryFont(t){
  if(t.category==='classic') return 'Georgia, NanumSquare, Malgun Gothic, serif';
  if(t.category==='creative') return 'Arial Black, NanumSquare, Malgun Gothic, sans-serif';
  return 'NanumSquare, Malgun Gothic, Arial, sans-serif';
}
function logoSvg(x,y,size,color,bg,anchor='center'){
  const scale=Math.max(.35,Math.min(9,Number(state.custom.logoScale)||1.5));
  const maxW=anchor==='hero'?860:760,maxH=anchor==='hero'?500:400;
  const renderW=Math.min(maxW,size*scale*1.45),renderH=Math.min(maxH,size*scale);
  const renderX=x+(size-renderW)/2,renderY=y+(size-renderH)/2;
  if(state.data.logoDataUrl) return `<image href="${state.data.logoDataUrl}" x="${renderX}" y="${renderY}" width="${renderW}" height="${renderH}" preserveAspectRatio="xMidYMid meet"/>`;
  const ch=escapeXml((state.data.company.trim()[0]||'C').toUpperCase()),cx=x+size/2,cy=y+size/2,base=Math.min(size*3.2,size*scale);
  return `<g transform="translate(${cx} ${cy}) scale(${base/size}) translate(${-size/2} ${-size/2})"><rect width="${size}" height="${size}" rx="${size*.2}" fill="${color}"/><text x="${size/2}" y="${size*.68}" text-anchor="middle" font-family="NanumSquare, Malgun Gothic, Arial, sans-serif" font-weight="800" font-size="${size*.52}" fill="${bg}">${ch}</text></g>`;
}
function contactRows(x,y,align='left',gap=34,muted='#64748b',fs=1,values=null){
  const anchor=align==='left'?'start':align==='center'?'middle':'end'; const list=values||[state.data.phone,state.data.email,state.data.website,state.data.address];
  return `<g font-family="NanumSquare, Malgun Gothic, Arial, sans-serif" font-size="${18*fs}" fill="${muted}" text-anchor="${anchor}">${list.map((v,i)=>v?`<text x="${x}" y="${y+(gap*state.custom.spacing)*i}">${escapeXml(v)}</text>`:'').join('')}</g>`;
}
function contactInline(y,color,fs=1){ const d=state.data; return `<g font-family="NanumSquare, Malgun Gothic, Arial, sans-serif" font-size="${16*fs}" fill="${color}"><text x="72" y="${y}">${escapeXml(d.phone)}</text><text x="350" y="${y}">${escapeXml(d.email)}</text><text x="878" y="${y}" text-anchor="end">${escapeXml(d.website)}</text></g>`; }
function pill(x,y,text,fill,color){ if(!text)return''; const width=Math.max(120,Math.min(310,36+String(text).length*18));return `<rect x="${x}" y="${y-25}" width="${width}" height="42" rx="21" fill="${fill}"/><text x="${x+18}" y="${y+3}" font-family="NanumSquare, Malgun Gothic, Arial, sans-serif" font-size="16" fill="${color}">${escapeXml(text)}</text>`; }
function decorForCategory(t,primary){
  if(t.category==='minimal') return `<circle cx="900" cy="70" r="5" fill="${primary}"/>`;
  if(t.category==='classic') return `<path d="M72 50 H888" stroke="${rgba(primary,.35)}"/><path d="M72 510 H888" stroke="${rgba(primary,.35)}"/>`;
  if(t.category==='modern') return `<rect x="895" width="65" height="560" fill="${rgba(primary,.18)}"/>`;
  if(t.category==='creative') return `<circle cx="890" cy="90" r="42" fill="none" stroke="${rgba(primary,.55)}" stroke-width="7"/>`;
  return `<circle cx="890" cy="70" r="34" fill="${rgba(primary,.18)}"/><circle cx="840" cy="34" r="10" fill="${rgba(primary,.45)}"/>`;
}
function renderBack(template,w,h,primary,font,fg,bg){
  const d=state.data, muted=isDarkTemplate(template)?rgba(fg,.66):'#667085', slogan=d.slogan||d.industry||d.company;
  const variants=[
    `${logoSvg(365,140,230,primary,bg,'hero')}<text x="480" y="430" text-anchor="middle" font-family="${font}" font-size="30" font-weight="800" fill="${fg}">${escapeXml(d.company)}</text>`,
    `<rect x="70" y="80" width="820" height="400" rx="22" fill="${rgba(primary,.08)}"/>${logoSvg(375,105,210,primary,bg,'hero')}<text x="480" y="400" text-anchor="middle" font-family="${font}" font-size="22" fill="${muted}">${escapeXml(slogan)}</text>`,
    `<rect x="0" width="310" height="560" fill="${primary}"/>${logoSvg(70,155,170,bg,primary,'hero')}<text x="370" y="245" font-family="${font}" font-size="38" font-weight="800" fill="${fg}">${escapeXml(d.company)}</text><text x="370" y="300" font-family="${font}" font-size="18" fill="${muted}">${escapeXml(slogan)}</text>`,
    `<circle cx="480" cy="280" r="145" fill="${rgba(primary,.08)}"/>${logoSvg(355,155,250,primary,bg,'hero')}`,
    `<rect x="70" y="74" width="6" height="412" fill="${primary}"/><text x="115" y="235" font-family="${font}" font-size="45" font-weight="800" fill="${fg}">${escapeXml(d.company)}</text><text x="118" y="300" font-family="${font}" font-size="19" fill="${muted}">${escapeXml(slogan)}</text>`
  ];
  return variants[template.layout%variants.length];
}
function renderFront(template,w,h,primary,font,fg,bg){
  const d=state.data, muted=isDarkTemplate(template)?rgba(fg,.67):'#667085', fs=state.custom.fontScale, a=state.custom.align||'left';
  const ax=a==='left'?72:a==='center'?480:888, anchor=a==='left'?'start':a==='center'?'middle':'end';
  const name=`<text x="${ax}" y="245" text-anchor="${anchor}" font-family="${font}" font-size="${38*fs}" font-weight="800" fill="${fg}">${escapeXml(d.name)}</text>`;
  const title=`<text x="${ax}" y="280" text-anchor="${anchor}" font-family="${font}" font-size="${17*fs}" font-weight="700" letter-spacing="1.4" fill="${muted}">${escapeXml(d.title)}</text>`;
  const common=`${name}${title}${contactRows(ax,355,a,32,muted,fs)}${decorForCategory(template,primary)}`;
  const L=template.layout%20;
  if(L===0)return `<rect x="0" y="0" width="16" height="560" fill="${primary}"/>${logoSvg(70,62,100,primary,bg)}${common}`;
  if(L===1)return `<rect x="0" y="0" width="310" height="560" fill="${rgba(primary,.1)}"/>${logoSvg(90,170,130,primary,bg)}<text x="90" y="350" font-family="${font}" font-size="23" font-weight="800" fill="${fg}">${escapeXml(d.company)}</text>${name}${title}${contactRows(500,355,'left',32,muted,fs)}`;
  if(L===2)return `<circle cx="810" cy="95" r="155" fill="${rgba(primary,.09)}"/>${logoSvg(70,62,95,primary,bg)}${common}`;
  if(L===3)return `<rect width="960" height="112" fill="${primary}"/>${logoSvg(70,26,60,bg,primary)}<text x="154" y="68" font-family="${font}" font-size="22" font-weight="800" fill="${bg}">${escapeXml(d.company)}</text>${name}${title}${contactRows(ax,365,a,32,muted,fs)}`;
  if(L===4)return `<path d="M610 0 C760 100 730 400 960 560 L960 0Z" fill="${rgba(primary,.13)}"/>${logoSvg(70,62,95,primary,bg)}${common}`;
  if(L===5)return `${logoSvg(385,55,190,primary,bg,'hero')}<text x="480" y="330" text-anchor="middle" font-family="${font}" font-size="34" font-weight="800" fill="${fg}">${escapeXml(d.name)}</text><text x="480" y="366" text-anchor="middle" font-family="${font}" font-size="17" fill="${muted}">${escapeXml(d.title)}</text>${contactRows(480,425,'center',30,muted,fs,[d.phone,d.email,d.website])}`;
  if(L===6)return `<path d="M0 0 H390 L240 560 H0Z" fill="${primary}"/>${logoSvg(86,115,160,bg,primary,'hero')}<text x="450" y="220" font-family="${font}" font-size="40" font-weight="800" fill="${fg}">${escapeXml(d.name)}</text><text x="450" y="262" font-family="${font}" font-size="17" fill="${muted}">${escapeXml(d.title)}</text>${contactRows(450,340,'left',32,muted,fs)}`;
  if(L===7)return `<rect x="48" y="48" width="864" height="464" fill="none" stroke="${rgba(primary,.35)}" stroke-width="2"/><rect x="62" y="62" width="836" height="436" fill="none" stroke="${rgba(primary,.12)}"/>${logoSvg(82,84,82,primary,bg)}${common}`;
  if(L===8)return `<text x="870" y="355" text-anchor="end" font-family="${font}" font-size="330" font-weight="900" fill="${rgba(primary,.07)}">${escapeXml((d.company[0]||'C').toUpperCase())}</text>${logoSvg(70,62,92,primary,bg)}${common}`;
  if(L===9)return `<line x1="480" y1="70" x2="480" y2="490" stroke="${rgba(primary,.2)}"/>${logoSvg(90,130,160,primary,bg,'hero')}<text x="90" y="345" font-family="${font}" font-size="24" font-weight="800" fill="${fg}">${escapeXml(d.company)}</text><text x="540" y="200" font-family="${font}" font-size="40" font-weight="800" fill="${fg}">${escapeXml(d.name)}</text><text x="540" y="242" font-family="${font}" font-size="17" fill="${muted}">${escapeXml(d.title)}</text>${contactRows(540,330,'left',32,muted,fs)}`;
  if(L===10)return `<rect x="0" y="458" width="960" height="102" fill="${primary}"/>${logoSvg(70,62,95,primary,bg)}${name}${title}${contactRows(ax,345,a,30,muted,fs,[d.phone,d.email,d.website])}<text x="72" y="518" font-family="${font}" font-size="17" fill="${bg}">${escapeXml(d.address)}</text>`;
  if(L===11)return `<rect x="0" y="0" width="76" height="560" fill="${primary}"/><text x="50" y="485" transform="rotate(-90 50 485)" font-family="${font}" font-size="18" font-weight="800" fill="${bg}">${escapeXml(d.company)}</text>${name}${title}${contactRows(ax,355,a,32,muted,fs)}`;
  if(L===12)return `<path d="M70 115v-45h45 M845 70h45v45 M70 445v45h45 M845 490h45v-45" fill="none" stroke="${primary}" stroke-width="3"/>${logoSvg(72,72,85,primary,bg)}${common}`;
  if(L===13)return `${logoSvg(70,62,90,primary,bg)}${pill(70,205,d.industry,rgba(primary,.12),primary)}${name}${title}${contactRows(ax,360,a,31,muted,fs)}`;
  if(L===14)return `<text x="70" y="185" font-family="${font}" font-size="72" font-weight="900" fill="${fg}">${escapeXml(d.name)}</text><text x="74" y="232" font-family="${font}" font-size="18" fill="${muted}">${escapeXml(d.title)}</text><rect x="72" y="285" width="90" height="7" rx="3" fill="${primary}"/>${contactRows(72,370,'left',30,muted,fs)}`;
  if(L===15)return `<rect x="0" y="0" width="960" height="18" fill="${primary}"/><rect x="0" y="32" width="960" height="6" fill="${rgba(primary,.32)}"/>${logoSvg(70,80,92,primary,bg)}${common}`;
  if(L===16)return `<circle cx="780" cy="135" r="170" fill="${rgba(primary,.09)}"/><circle cx="855" cy="220" r="110" fill="${rgba(primary,.12)}"/>${logoSvg(70,62,95,primary,bg)}${common}`;
  if(L===17)return `<rect x="0" y="0" width="300" height="280" fill="${primary}"/><rect x="300" y="280" width="660" height="280" fill="${rgba(primary,.08)}"/>${logoSvg(85,72,130,bg,primary,'hero')}<text x="360" y="205" font-family="${font}" font-size="42" font-weight="800" fill="${fg}">${escapeXml(d.name)}</text><text x="360" y="250" font-family="${font}" font-size="17" fill="${muted}">${escapeXml(d.title)}</text>${contactRows(360,350,'left',32,muted,fs)}`;
  if(L===18)return `${logoSvg(385,62,190,primary,bg,'hero')}<text x="480" y="320" text-anchor="middle" font-family="${font}" font-size="39" font-weight="800" fill="${fg}">${escapeXml(d.name)}</text><text x="480" y="360" text-anchor="middle" font-family="${font}" font-size="17" fill="${muted}">${escapeXml(d.title)}</text>${contactRows(480,420,'center',28,muted,fs,[d.phone,d.email,d.website])}`;
  return `${logoSvg(55,55,250,primary,bg,'hero')}<text x="355" y="205" font-family="${font}" font-size="35" font-weight="800" fill="${fg}">${escapeXml(d.name)}</text><text x="355" y="245" font-family="${font}" font-size="17" fill="${muted}">${escapeXml(d.title)}</text>${contactRows(355,330,'left',30,muted,fs)}`;
}
function renderCard(template,side='front',mini=false){
  const w=960,h=560,primary=state.custom.primary||STYLE_META[template.category].color,bg=state.custom.background||'#ffffff';
  const dark=isDarkTemplate(template), baseBg=dark?'#101828':bg, fg=dark?'#ffffff':state.custom.text||'#111827',font=categoryFont(template);
  const body=side==='back'?renderBack(template,w,h,primary,font,fg,baseBg):renderFront(template,w,h,primary,font,fg,baseBg);
  const guides=state.custom.showGuides&&!mini?`<rect x="28" y="28" width="904" height="504" fill="none" stroke="#ef4444" stroke-dasharray="9 7" opacity=".55"/><rect x="55" y="55" width="850" height="450" fill="none" stroke="#3b82f6" stroke-dasharray="7 7" opacity=".45"/>`:'';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${escapeXml(template.label)} 명함 ${side==='front'?'앞면':'뒷면'}"><rect width="960" height="560" fill="${baseBg}"/>${body}${guides}</svg>`;
}
function renderForm(){
  document.getElementById('formGrid').innerHTML=FIELD_CONFIG.map(([key,label,required,cls])=>`<label class="field ${cls||''}"><span>${label}${required?'<b>*</b>':''}</span><input data-field="${key}" value="${escapeXml(state.data[key]||'')}"></label>`).join('');
  document.querySelectorAll('[data-field]').forEach(el=>el.addEventListener('input',e=>{state.data[e.target.dataset.field]=e.target.value;state.activeStep=1;persist();renderDynamic();renderVariants();renderSteps();}));
}
function renderStyles(){
  const host=document.getElementById('styleList');host.innerHTML=Object.entries(STYLE_META).map(([key,s])=>`<button class="style-card ${state.category===key?'selected':''}" data-style="${key}"><div class="style-swatch" style="background:${s.color}"><i></i><i></i><i></i></div><div class="style-copy"><small>${s.eyebrow}</small><strong>${s.name}</strong><em>${s.description}</em></div><span class="radio">✓</span></button>`).join('');
  host.querySelectorAll('[data-style]').forEach(btn=>btn.addEventListener('click',()=>{state.category=btn.dataset.style;state.recommendationSeed=(Number(state.recommendationSeed)+3571)%1000000;buildRecommendations();state.activeStep=2;persist();renderAll();}));
}
function renderVariants(){
  const host=document.getElementById('variantGrid'),templates=makeTemplates();
  document.getElementById('variantHeading').textContent=`100개 디자인 중 ${STYLE_META[state.category].name} 추천 5개`;
  host.innerHTML=templates.map((t,i)=>`<button class="variant-card ${state.selectedId===t.id?'selected':''}" data-template="${t.id}"><span class="variant-number">${String(i+1).padStart(2,'0')}</span><div class="mini-card">${renderCard(t,'front',true)}</div><div class="variant-meta"><div><strong>${t.label}</strong><small>${t.description}</small></div><i>→</i></div></button>`).join('');
  host.querySelectorAll('[data-template]').forEach(btn=>btn.addEventListener('click',()=>{state.selectedId=btn.dataset.template;state.activeStep=3;persist();renderDynamic();renderVariants();renderSteps();}));
}
function renderDynamic(){
  const template=selectedTemplate();
  document.getElementById('mainCard').innerHTML=renderCard(template,state.side);
  document.getElementById('previewTitle').textContent=template.label;
  document.querySelectorAll('[data-side]').forEach(b=>b.classList.toggle('active',b.dataset.side===state.side));
  document.querySelectorAll('[data-align]').forEach(b=>b.classList.toggle('active',b.dataset.align===state.custom.align));
  document.getElementById('primaryColor').value=state.custom.primary;document.getElementById('primaryHex').value=state.custom.primary.toUpperCase();
  document.getElementById('fontScale').value=state.custom.fontScale;document.getElementById('fontScaleValue').textContent=`${Math.round(state.custom.fontScale*100)}%`;
  document.getElementById('spacing').value=state.custom.spacing;document.getElementById('spacingValue').textContent=`${Math.round(state.custom.spacing*100)}%`;
  document.getElementById('logoScale').value=state.custom.logoScale;document.getElementById('logoScaleValue').textContent=`${Math.round(state.custom.logoScale*100)}%`;
  document.getElementById('guideToggle').checked=!!state.custom.showGuides;document.getElementById('exportDpi').value=String(state.custom.exportDpi||600);
  const dpi=Number(state.custom.exportDpi)||600,pxW=Math.round(96/25.4*dpi),pxH=Math.round(56/25.4*dpi);document.getElementById('exportMeta').textContent=`${dpi}dpi · ${pxW} × ${pxH}px`;
  [['palettePrimary','palettePrimarySwatch','primary'],['paletteBg','paletteBgSwatch','background'],['paletteText','paletteTextSwatch','text']].forEach(([input,swatch,key])=>{document.getElementById(input).value=state.custom[key];document.getElementById(swatch).style.background=state.custom[key];});
  const preview=document.getElementById('logoPreview'); preview.innerHTML=state.data.logoDataUrl?`<img src="${state.data.logoDataUrl}" alt="업로드한 로고">`:'▧';
  const hint=document.getElementById('logoHint');if(hint&&!document.querySelector('.logo-drop.processing'))hint.textContent=state.data.logoFileName?`${state.data.logoFileName} · 배경·여백 자동 제거됨`:'PNG, JPG, SVG, AI(PDF 호환), PDF · 20MB 이하';
  renderCompletion();
}
function renderSteps(){ document.querySelectorAll('.step').forEach(btn=>{const step=Number(btn.dataset.step);btn.classList.toggle('active',step===state.activeStep);btn.classList.toggle('done',step<state.activeStep);}); }
function renderCompletion(){ const required=['company','name','phone'],optional=['email','website','address','industry','slogan'];const req=required.filter(k=>state.data[k].trim()).length/required.length,opt=optional.filter(k=>state.data[k].trim()).length/optional.length;const p=Math.round(55*req+30*opt+(state.data.logoDataUrl?15:0));document.getElementById('completionText').textContent=`${p}%`;document.getElementById('completionBar').style.width=`${p}%`; }
function persist(){ try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch(e){} }
function renderAll(){ renderForm();renderStyles();renderVariants();renderDynamic();renderSteps(); }
function showToast(message,duration=2600){ const el=document.getElementById('toast');el.querySelector('span').textContent=message;el.hidden=false;clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>el.hidden=true,duration); }
function normalizeHex(v){ v=(v||'').trim();if(!v.startsWith('#'))v='#'+v;return /^#[0-9a-f]{6}$/i.test(v)?v.toLowerCase():null; }
function svgToPng(svg,width,height){return new Promise((resolve,reject)=>{const blob=new Blob([svg],{type:'image/svg+xml'}),url=URL.createObjectURL(blob),img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=width;c.height=height;const ctx=c.getContext('2d');ctx.drawImage(img,0,0,width,height);URL.revokeObjectURL(url);c.toBlob(b=>b?resolve(b):reject(new Error('PNG')),'image/png');};img.onerror=reject;img.src=url;});}
async function exportPng(){try{const t=selectedTemplate(),dpi=Number(state.custom.exportDpi)||600,scale=dpi/72,svg=renderCard(t,state.side),blob=await svgToPng(svg,Math.round(960*scale),Math.round(560*scale)),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`cardcraft-${t.id}-${state.side}-${dpi}dpi.png`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);showToast('PNG 파일을 만들었습니다.');}catch(e){showToast('PNG 생성에 실패했습니다.');}}
function withTimeout(promise,ms,code){return Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error(code)),ms))]);}
async function loadPdfJs(){for(const src of PDFJS_SOURCES){try{const pdfjs=await withTimeout(import(src.module),9000,'PDFJS_TIMEOUT');pdfjs.GlobalWorkerOptions.workerSrc=src.worker;return pdfjs;}catch(e){}}throw new Error('PDFJS_LOAD');}
async function dataUrlToImage(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src;});}
async function trimLogoDataUrl(src,removeBackground=true){const img=await dataUrlToImage(src),max=1500,scale=Math.min(1,max/Math.max(img.naturalWidth||img.width,img.naturalHeight||img.height)),w=Math.max(1,Math.round((img.naturalWidth||img.width)*scale)),h=Math.max(1,Math.round((img.naturalHeight||img.height)*scale)),cv=document.createElement('canvas');cv.width=w;cv.height=h;const ctx=cv.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,w,h);const data=ctx.getImageData(0,0,w,h),p=data.data;let minX=w,minY=h,maxX=-1,maxY=-1;for(let y=0;y<h;y++){for(let x=0;x<w;x++){const i=(y*w+x)*4,r=p[i],g=p[i+1],b=p[i+2],a=p[i+3];if(removeBackground&&a>0&&r>244&&g>244&&b>244)p[i+3]=0;const aa=p[i+3];if(aa>12){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}}}ctx.putImageData(data,0,0);if(maxX<0)return src;const pad=Math.round(Math.max(maxX-minX,maxY-minY)*.035),sx=Math.max(0,minX-pad),sy=Math.max(0,minY-pad),sw=Math.min(w-sx,maxX-minX+1+pad*2),sh=Math.min(h-sy,maxY-minY+1+pad*2),out=document.createElement('canvas');out.width=Math.max(1,sw);out.height=Math.max(1,sh);out.getContext('2d').drawImage(cv,sx,sy,sw,sh,0,0,sw,sh);return out.toDataURL('image/png');}
async function renderPdfLogo(file){const pdfjs=await loadPdfJs(),buffer=await file.arrayBuffer(),pdf=await withTimeout(pdfjs.getDocument({data:buffer}).promise,15000,'PDFJS_TIMEOUT'),page=await pdf.getPage(1),base=page.getViewport({scale:1}),scale=Math.min(3,1400/Math.max(base.width,base.height)),viewport=page.getViewport({scale}),canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);await withTimeout(page.render({canvasContext:canvas.getContext('2d'),viewport,background:'rgba(255,255,255,0)'}).promise,18000,'PDF_RENDER_TIMEOUT');return canvas.toDataURL('image/png');}
async function processLogoFile(file,removeBackground=true){const ext=(file.name.split('.').pop()||'').toLowerCase();if(file.size>20*1024*1024)throw new Error('SIZE');if(ext==='ai'||ext==='pdf')return trimLogoDataUrl(await renderPdfLogo(file),removeBackground);if(!file.type.startsWith('image/')&&!['svg','png','jpg','jpeg','webp','gif'].includes(ext))throw new Error('TYPE');const src=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file);});return trimLogoDataUrl(src,removeBackground);}
function extractColor(src){const img=new Image();img.onload=()=>{const cv=document.createElement('canvas');cv.width=60;cv.height=60;const ctx=cv.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,60,60);const p=ctx.getImageData(0,0,60,60).data;let r=0,g=0,b=0,n=0;for(let i=0;i<p.length;i+=16){const[pr,pg,pb,pa]=[p[i],p[i+1],p[i+2],p[i+3]],max=Math.max(pr,pg,pb),min=Math.min(pr,pg,pb);if(pa<120||max>244||max-min<18||max<36)continue;r+=pr;g+=pg;b+=pb;n++;}if(n){state.custom.primary='#'+[r/n,g/n,b/n].map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');persist();renderDynamic();renderVariants();showToast('로고에서 브랜드 컬러를 추출했습니다.');}};img.src=src;}

let templateLibraryCategory='all';
function renderTemplateLibrary(){const tabs=document.getElementById('templateTabs'),grid=document.getElementById('templateLibraryGrid');tabs.innerHTML=Object.entries(STYLE_META).map(([key,item])=>`<button class="${templateLibraryCategory===key?'active':''}" data-library-category="${key}">${item.name}<small>${key==='all'?100:20}</small></button>`).join('');const pool=templateLibraryCategory==='all'?LIBRARY:LIBRARY.filter(t=>t.category===templateLibraryCategory);grid.innerHTML=pool.map(t=>`<button class="template-library-card ${state.selectedId===t.id?'selected':''}" data-library-template="${t.id}"><div class="template-library-preview">${renderCard(t,'front',true)}</div><div><span>${STYLE_META[t.category].name} · ${String(t.layout+1).padStart(2,'0')}</span><strong>${t.label}</strong><small>${t.description}</small></div></button>`).join('');tabs.querySelectorAll('[data-library-category]').forEach(btn=>btn.addEventListener('click',()=>{templateLibraryCategory=btn.dataset.libraryCategory;renderTemplateLibrary();}));grid.querySelectorAll('[data-library-template]').forEach(btn=>btn.addEventListener('click',()=>{state.selectedId=btn.dataset.libraryTemplate;state.activeStep=3;persist();renderDynamic();renderVariants();renderSteps();closeTemplateLibrary();}));}
function openTemplateLibrary(){const modal=document.getElementById('templateModal');modal.hidden=false;document.body.style.overflow='hidden';renderTemplateLibrary();}
function closeTemplateLibrary(){const modal=document.getElementById('templateModal');modal.hidden=true;document.body.style.overflow='';}

(function init(){
  try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||localStorage.getItem('cardcraft-mvp-static-v2'));if(saved)state={...state,...saved,data:{...DEFAULT_DATA,...saved.data},custom:{...DEFAULT_CUSTOM,...saved.custom}};if(Number(state.custom.logoScale)<=1)state.custom.logoScale=1.5;}catch(e){}
  ensureRecommendations();renderAll();
  document.getElementById('stepper').addEventListener('click',e=>{const btn=e.target.closest('[data-step]');if(btn){state.activeStep=Number(btn.dataset.step);persist();renderSteps();}});
  document.querySelectorAll('[data-side]').forEach(btn=>btn.addEventListener('click',()=>{state.side=btn.dataset.side;persist();renderDynamic();}));
  document.querySelectorAll('[data-align]').forEach(btn=>btn.addEventListener('click',()=>{state.custom.align=btn.dataset.align;state.activeStep=4;persist();renderDynamic();renderVariants();renderSteps();}));
  document.getElementById('primaryColor').addEventListener('input',e=>{state.custom.primary=e.target.value;persist();renderDynamic();renderVariants();});
  document.getElementById('primaryHex').addEventListener('change',e=>{const v=normalizeHex(e.target.value);if(v){state.custom.primary=v;persist();renderDynamic();renderVariants();}else e.target.value=state.custom.primary.toUpperCase();});
  document.getElementById('fontScale').addEventListener('input',e=>{state.custom.fontScale=Number(e.target.value);state.activeStep=4;persist();renderDynamic();renderVariants();renderSteps();});
  document.getElementById('spacing').addEventListener('input',e=>{state.custom.spacing=Number(e.target.value);state.activeStep=4;persist();renderDynamic();renderVariants();renderSteps();});
  document.getElementById('logoScale').addEventListener('input',e=>{state.custom.logoScale=Number(e.target.value);state.activeStep=4;persist();renderDynamic();renderVariants();renderSteps();});
  document.getElementById('exportDpi').addEventListener('change',e=>{state.custom.exportDpi=Number(e.target.value);persist();renderDynamic();});
  document.getElementById('guideToggle').addEventListener('change',e=>{state.custom.showGuides=e.target.checked;persist();renderDynamic();});
  [['palettePrimary','primary'],['paletteBg','background'],['paletteText','text']].forEach(([id,key])=>document.getElementById(id).addEventListener('input',e=>{state.custom[key]=e.target.value;persist();renderDynamic();renderVariants();}));

  const logoUploadButton=document.getElementById('logoUploadButton'),logoUploadPanel=document.getElementById('logoUploadPanel');
  const logoInputs={image:document.getElementById('logoInput'),vector:document.getElementById('logoVectorInput'),all:document.getElementById('logoAllInput')};
  const closeUploadMenu=()=>{logoUploadPanel.hidden=true;logoUploadButton.setAttribute('aria-expanded','false');};
  logoUploadButton.addEventListener('click',e=>{e.stopPropagation();const opening=logoUploadPanel.hidden;logoUploadPanel.hidden=!opening;logoUploadButton.setAttribute('aria-expanded',String(opening));});
  document.querySelectorAll('[data-logo-picker]').forEach(btn=>btn.addEventListener('click',()=>{closeUploadMenu();logoInputs[btn.dataset.logoPicker].click();}));
  document.addEventListener('click',e=>{if(!e.target.closest('.logo-upload-menu'))closeUploadMenu();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeUploadMenu();closeTemplateLibrary();}});
  async function applyLogoFile(f){if(!f)return;const hint=document.getElementById('logoHint'),drop=document.querySelector('.logo-drop');try{drop.classList.add('processing');hint.textContent='로고 분석·배경 제거 중…';showToast(f.name.toLowerCase().endsWith('.ai')?'AI 로고를 변환하고 있습니다.':'로고 배경과 여백을 자동 정리하고 있습니다.',5000);const result=await processLogoFile(f,true);state.data.logoDataUrl=result;state.data.logoFileName=f.name;persist();renderDynamic();renderVariants();extractColor(result);logoUploadButton.firstChild.textContent='↑ 다른 파일 ';showToast(`${f.name} 로고를 적용했습니다.`);}catch(err){if(err.message==='PDF_COMPAT_REQUIRED')showToast('이 AI 파일에는 PDF 호환 정보가 없습니다. Illustrator에서 “PDF 호환 파일 만들기”를 켜고 다시 저장하세요.',7000);else if(err.message==='SIZE')showToast('로고 파일은 20MB 이하만 업로드할 수 있습니다.',5000);else if(err.message==='TYPE')showToast('PNG, JPG, SVG, AI 또는 PDF 파일을 사용하세요.',5000);else if(['PDFJS_TIMEOUT','PDFJS_LOAD','PDF_RENDER_TIMEOUT'].includes(err.message))showToast('AI 변환 모듈을 불러오지 못했습니다. 네트워크를 확인한 뒤 다시 시도하세요.',7000);else showToast('로고를 읽지 못했습니다. AI 파일은 PDF 호환 저장이 필요합니다.',6500);}finally{drop.classList.remove('processing');hint.textContent=state.data.logoFileName?`${state.data.logoFileName} · 배경·여백 자동 제거됨`:'PNG, JPG, SVG, AI(PDF 호환), PDF · 20MB 이하';}}
  Object.values(logoInputs).forEach(input=>input.addEventListener('change',async e=>{const f=e.target.files&&e.target.files[0];await applyLogoFile(f);e.target.value='';}));
  const logoDrop=document.querySelector('.logo-drop');['dragenter','dragover'].forEach(type=>logoDrop.addEventListener(type,e=>{e.preventDefault();logoDrop.classList.add('processing');}));['dragleave','drop'].forEach(type=>logoDrop.addEventListener(type,e=>{e.preventDefault();logoDrop.classList.remove('processing');}));logoDrop.addEventListener('drop',async e=>{const f=e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files[0];await applyLogoFile(f);});
  document.getElementById('removeLogoBg').addEventListener('click',async()=>{closeUploadMenu();if(!state.data.logoDataUrl){showToast('먼저 로고 파일을 올려주세요.');return;}try{logoDrop.classList.add('processing');state.data.logoDataUrl=await trimLogoDataUrl(state.data.logoDataUrl,true);persist();renderDynamic();renderVariants();showToast('현재 로고의 외곽 배경을 투명 처리했습니다.',4200);}finally{logoDrop.classList.remove('processing');}});
  document.getElementById('libraryBtn').addEventListener('click',openTemplateLibrary);document.querySelectorAll('[data-template-close]').forEach(btn=>btn.addEventListener('click',closeTemplateLibrary));
  document.getElementById('regenerateBtn').addEventListener('click',()=>{state.recommendationSeed=(Number(state.recommendationSeed)+7919)%1000000;buildRecommendations();persist();renderVariants();renderDynamic();showToast('100개 디자인 라이브러리에서 새로운 5개를 추천했습니다.');});
  document.getElementById('saveBtn').addEventListener('click',()=>{persist();showToast('현재 프로젝트를 브라우저에 저장했습니다.');});
  document.getElementById('resetBtn').addEventListener('click',()=>{state={data:{...DEFAULT_DATA},custom:{...DEFAULT_CUSTOM},category:'all',selectedId:'minimal-01',side:'front',activeStep:1,recommendationSeed:Date.now()%1000000,recommendedIds:[]};try{localStorage.removeItem(STORAGE_KEY);}catch(e){}buildRecommendations();renderAll();showToast('초기 상태로 되돌렸습니다.');});
  document.getElementById('exportBtn').addEventListener('click',exportPng);
})();
