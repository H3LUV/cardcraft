(function cardcraftV122ProductionFixes(){
  'use strict';

  const FONT_OPTIONS=[
    ['','템플릿 기본'],['Noto Sans KR','Noto Sans KR'],['Noto Serif KR','Noto Serif KR'],['IBM Plex Sans KR','IBM Plex Sans KR'],
    ['Nanum Gothic','나눔고딕'],['Nanum Myeongjo','나눔명조'],['Gowun Dodum','고운돋움'],['Gowun Batang','고운바탕'],['Hahmlet','함렛'],
    ['Montserrat','Montserrat'],['Poppins','Poppins'],['Raleway','Raleway'],['Oswald','Oswald'],['Space Grotesk','Space Grotesk'],
    ['Playfair Display','Playfair Display'],['Cormorant Garamond','Cormorant Garamond'],['Cinzel','Cinzel'],['Bodoni Moda','Bodoni Moda'],['DM Serif Display','DM Serif Display']
  ];
  const FIELD_LABELS={company:'회사명 / 브랜드명',name:'이름',department:'부서명',title:'직함 / 직책',phone:'전화번호',email:'이메일',website:'웹사이트 / SNS',address:'주소',industry:'업종 / 분야',slogan:'슬로건 / 기타 문구'};
  const BACK_FIELDS=['company','name','department','title','phone','email','website','address','slogan'];
  const XML_ESCAPE=s=>String(s??'').replace(/[<>&'\"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','\"':'&quot;'}[c]));
  const RX_ESCAPE=s=>String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const ROLE_KEYS=new Set(['department','title']);
  let renderPatched=false;

  function fontsHtml(selected=''){
    return FONT_OPTIONS.map(([value,label])=>`<option value="${value}" ${String(value)===String(selected)?'selected':''}>${label}</option>`).join('');
  }
  function ensureState(){
    if(typeof state==='undefined')return false;
    state.data=state.data||{};
    if(typeof state.data.department!=='string')state.data.department='';
    state.custom=state.custom||{};
    state.custom.fieldFonts={...(state.custom.fieldFonts||{})};
    if(!Array.isArray(state.custom.backTextFields))state.custom.backTextFields=[];
    return true;
  }
  function face(side='front'){
    const f=state.custom?.faceEdits?.[side];
    return f&&typeof f==='object'?f:null;
  }
  function roleText(){return [state.data.department,state.data.title].filter(Boolean).join(' · ');}
  function selectedFont(key,side='front'){
    const role=ROLE_KEYS.has(key);
    const ff=state.custom.fieldFonts||{};
    const faceStyle=face(side)?.textStyles||{};
    if(role)return ff.department||ff.title||faceStyle.department?.font||faceStyle.title?.font||'';
    return ff[key]||faceStyle[key]?.font||'';
  }
  function setFontState(key,font){
    if(ROLE_KEYS.has(key)){
      state.custom.fieldFonts.department=font;
      state.custom.fieldFonts.title=font;
      const f=face('front');
      if(f?.textStyles?.title)f.textStyles.title.font=font;
      if(f?.textStyles?.department)f.textStyles.department.font=font;
    }else{
      state.custom.fieldFonts[key]=font;
      const f=face('front');if(f?.textStyles?.[key])f.textStyles[key].font=font;
    }
  }
  function persistAndRender(){
    try{if(typeof persist==='function')persist();}catch(_){ }
    try{if(typeof renderDynamic==='function')renderDynamic();}catch(_){ }
    try{if(typeof renderVariants==='function')renderVariants();}catch(_){ }
  }

  function enhanceForm(){
    if(!ensureState())return;
    const grid=document.getElementById('formGrid');if(!grid)return;
    if(!grid.querySelector('[data-field="department"]')){
      const titleInput=grid.querySelector('[data-field="title"]');
      const titleLabel=titleInput?.closest('label.field');
      const label=document.createElement('label');
      label.className='field cc-department-field';
      label.innerHTML=`<span>부서명</span><input data-field="department" value="${XML_ESCAPE(state.data.department||'')}" placeholder="예: 해외사업부">`;
      if(titleLabel)titleLabel.insertAdjacentElement('beforebegin',label);else grid.appendChild(label);
      label.querySelector('input').addEventListener('input',e=>{state.data.department=e.target.value;state.activeStep=1;persistAndRender();});
    }
    grid.querySelectorAll('label.field').forEach(label=>{
      const input=label.querySelector('[data-field]');if(!input)return;
      const key=input.dataset.field;if(!FIELD_LABELS[key])return;
      let row=label.querySelector('.cc-inline-font');
      if(!row){
        row=document.createElement('div');row.className='cc-inline-font';
        row.innerHTML=`<span>폰트</span><select data-input-font="${key}" aria-label="${FIELD_LABELS[key]} 폰트">${fontsHtml(selectedFont(key))}</select>`;
        label.appendChild(row);
        row.querySelector('select').addEventListener('change',e=>{
          setFontState(key,e.target.value);
          if(ROLE_KEYS.has(key))grid.querySelectorAll('[data-input-font="department"],[data-input-font="title"]').forEach(s=>s.value=e.target.value);
          persistAndRender();
        });
      }else{
        const select=row.querySelector('select');if(select)select.value=selectedFont(key);
      }
    });
  }

  function installFormObserver(){
    const grid=document.getElementById('formGrid');if(!grid)return;
    let scheduled=false;
    new MutationObserver(()=>{
      if(scheduled)return;scheduled=true;
      requestAnimationFrame(()=>{scheduled=false;enhanceForm();});
    }).observe(grid,{childList:true,subtree:false});
  }

  function installBackPanel(){
    if(document.getElementById('ccBackTextPanel'))return;
    const target=document.querySelector('.quick-customizer')||document.querySelector('.card-stage');if(!target)return;
    const panel=document.createElement('section');
    panel.id='ccBackTextPanel';panel.className='cc-back-text-panel';
    panel.innerHTML=`<div class="cc-back-head"><div><span class="section-label">BACK SIDE TEXT</span><strong>뒷면에 넣을 텍스트</strong><p>뒷면은 기본적으로 텍스트 없이 생성됩니다. 필요한 항목만 직접 선택하세요.</p></div><button type="button" id="ccBackClear">전체 해제</button></div><div class="cc-back-options">${BACK_FIELDS.map(key=>`<label><input type="checkbox" value="${key}"><span>${FIELD_LABELS[key]}</span></label>`).join('')}</div>`;
    target.insertAdjacentElement('afterend',panel);
    panel.querySelectorAll('input[type="checkbox"]').forEach(cb=>cb.addEventListener('change',()=>{
      state.custom.backTextFields=[...panel.querySelectorAll('input:checked')].map(el=>el.value);
      persistAndRender();
    }));
    panel.querySelector('#ccBackClear').addEventListener('click',()=>{state.custom.backTextFields=[];panel.querySelectorAll('input').forEach(el=>el.checked=false);persistAndRender();});
    syncBackPanel();
    document.querySelectorAll('[data-side]').forEach(btn=>btn.addEventListener('click',()=>setTimeout(syncBackPanel,0)));
  }
  function syncBackPanel(){
    const panel=document.getElementById('ccBackTextPanel');if(!panel)return;
    panel.classList.toggle('is-visible',state.side==='back');
    const selected=new Set(state.custom.backTextFields||[]);
    panel.querySelectorAll('input[type="checkbox"]').forEach(cb=>cb.checked=selected.has(cb.value));
  }

  function setAttr(attrs,name,value){
    const re=new RegExp(`\\s${name}=("[^"]*"|'[^']*')`,'i');
    const pair=` ${name}="${String(value).replace(/"/g,'&quot;')}"`;
    return re.test(attrs)?attrs.replace(re,pair):attrs+pair;
  }
  function applyFontByValue(svg,value,font){
    if(!value||!font)return svg;
    const escaped=XML_ESCAPE(value);if(!escaped)return svg;
    const re=new RegExp(`<text([^>]*)>${RX_ESCAPE(escaped)}<\\/text>`,'g');
    return svg.replace(re,(full,attrs)=>`<text${setAttr(attrs,'font-family',`'${font}', 'Noto Sans KR', 'Malgun Gothic', Arial, sans-serif`)}>${escaped}</text>`);
  }
  function applyFrontFonts(svg){
    const data=state.data||{};
    const role=roleText();
    const values={company:data.company,name:data.name,title:role,phone:data.phone,email:data.email,website:data.website,address:data.address,industry:data.industry,slogan:data.slogan};
    Object.entries(values).forEach(([key,value])=>{svg=applyFontByValue(svg,value,selectedFont(key==='title'?'department':key,'front'));});
    return svg;
  }
  function removeTextValue(svg,value){
    if(!value)return svg;const escaped=XML_ESCAPE(value);if(!escaped)return svg;
    const re=new RegExp(`<text[^>]*>${RX_ESCAPE(escaped)}<\\/text>`,'g');return svg.replace(re,'');
  }
  function stripAutomaticBackText(svg){
    const d=state.data||{};
    const values=[d.company,d.name,d.department,d.title,roleText(),d.phone,d.email,d.website,d.address,d.slogan,d.industry].filter(Boolean);
    for(const value of [...new Set(values)])svg=removeTextValue(svg,value);
    return svg;
  }
  function parseViewBox(svg){const m=svg.match(/viewBox=["']0\s+0\s+([0-9.]+)\s+([0-9.]+)["']/i);return m?{w:Number(m[1]),h:Number(m[2])}:{w:960,h:560};}
  function bgColor(svg){const m=svg.match(/<rect[^>]*(?:width=["'](?:100%|[0-9.]+)["'])[^>]*fill=["'](#[0-9a-fA-F]{6})["']/i)||svg.match(/<rect[^>]*fill=["'](#[0-9a-fA-F]{6})["'][^>]*>/i);return m?.[1]||'#ffffff';}
  function contrast(hex){const v=String(hex).replace('#','');if(!/^[0-9a-f]{6}$/i.test(v))return '#111827';const n=parseInt(v,16),r=(n>>16)&255,g=(n>>8)&255,b=n&255;return (.2126*r+.7152*g+.0722*b)<135?'#ffffff':'#111827';}
  function backLine(key,value,index,x,y,color,anchor){
    if(!value)return'';
    const fonts=selectedFont(key,'back')||selectedFont(key,'front')||'Noto Sans KR';
    const sizes={company:22,name:26,department:16,title:16,phone:15,email:15,website:15,address:14,slogan:14};
    const weights={company:800,name:800,department:600,title:600,phone:500,email:500,website:500,address:500,slogan:500};
    return `<text id="BACK_${key.toUpperCase()}" x="${x}" y="${y}" text-anchor="${anchor}" font-family="'${fonts}', 'Noto Sans KR', 'Malgun Gothic', Arial, sans-serif" font-size="${sizes[key]||15}" font-weight="${weights[key]||500}" fill="${color}">${XML_ESCAPE(value)}</text>`;
  }
  function addSelectedBackText(svg){
    const selected=state.custom.backTextFields||[];if(!selected.length)return svg;
    const d=state.data||{},box=parseViewBox(svg),bg=bgColor(svg),color=contrast(bg),pad=Math.max(34,Math.min(box.w,box.h)*.065);
    const align=state.custom.align||'left',anchor=align==='center'?'middle':align==='right'?'end':'start',x=align==='center'?box.w/2:align==='right'?box.w-pad:pad;
    const vals={company:d.company,name:d.name,department:d.department,title:d.title,phone:d.phone,email:d.email,website:d.website,address:d.address,slogan:d.slogan};
    const lines=selected.map(key=>[key,vals[key]]).filter(([,v])=>v);
    if(!lines.length)return svg;
    const gap=Math.max(21,Math.min(box.w,box.h)*.047),total=(lines.length-1)*gap,start=Math.max(pad,box.h-pad-total);
    const layer=`<g id="BACK_SELECTED_TEXT">${lines.map(([key,v],i)=>backLine(key,v,i,x,start+i*gap,color,anchor)).join('')}</g>`;
    return svg.replace(/<\/svg>\s*$/,`${layer}</svg>`);
  }

  function currentLogoFace(side){return face(side)||{logoScale:Number(state.custom.logoScale)||1.5,logoPosX:0,logoPosY:0};}
  function applyLogoEdits(svg,side){
    const f=currentLogoFace(side),scale=Math.max(.35,Math.min(9,Number(f.logoScale)||1.5)),factor=scale/1.5,dx=Number(f.logoPosX)||0,dy=Number(f.logoPosY)||0;
    // V12 dedicated-format renderer uses an identifiable image node when a logo file is supplied.
    svg=svg.replace(/<image([^>]*\sid=["']LOGO_PRIMARY["'][^>]*)\/>/g,(full,attrs)=>{
      const val=name=>{const m=attrs.match(new RegExp(`\\s${name}=["']([0-9.-]+)["']`,'i'));return m?Number(m[1]):null;};
      const x=val('x'),y=val('y'),w=val('width'),h=val('height');if([x,y,w,h].some(v=>v===null||!Number.isFinite(v)))return full;
      const nw=w*factor,nh=h*factor,nx=x+(w-nw)/2+dx,ny=y+(h-nh)/2+dy;
      let a=attrs;a=setAttr(a,'x',nx.toFixed(2));a=setAttr(a,'y',ny.toFixed(2));a=setAttr(a,'width',nw.toFixed(2));a=setAttr(a,'height',nh.toFixed(2));return `<image${a}/>`;
    });
    // Generated placeholder logos are grouped; transform the group around its first rect center.
    svg=svg.replace(/<g([^>]*\sid=["']LOGO_PRIMARY["'][^>]*)>([\s\S]*?)<\/g>/g,(full,attrs,inner)=>{
      const rect=inner.match(/<rect[^>]*x=["']([0-9.-]+)["'][^>]*y=["']([0-9.-]+)["'][^>]*width=["']([0-9.-]+)["'][^>]*height=["']([0-9.-]+)["'][^>]*>/i);
      if(!rect)return full;const x=Number(rect[1]),y=Number(rect[2]),w=Number(rect[3]),h=Number(rect[4]),cx=x+w/2,cy=y+h/2;
      const transform=`translate(${dx} ${dy}) translate(${cx} ${cy}) scale(${factor.toFixed(4)}) translate(${-cx} ${-cy})`;
      return `<g${setAttr(attrs,'transform',transform)}>${inner}</g>`;
    });
    return svg;
  }

  function installRenderPatch(){
    if(renderPatched||typeof renderCard!=='function')return;
    renderPatched=true;
    const baseRender=renderCard;
    renderCard=function(template,side='front',mini=false){
      side=side==='back'?'back':'front';
      const originalTitle=state.data.title;
      if(side==='front'&&state.data.department)state.data.title=roleText();
      let svg='';
      try{svg=baseRender(template,side,mini);}finally{state.data.title=originalTitle;}
      if(side==='front')svg=applyFrontFonts(svg);
      else{svg=stripAutomaticBackText(svg);svg=addSelectedBackText(svg);}
      svg=applyLogoEdits(svg,side);
      return svg;
    };
    window.renderCard=renderCard;
    persistAndRender();
  }

  function hookLogoControls(){
    const bind=el=>{
      if(!el||el.dataset.ccV122Bound)return;el.dataset.ccV122Bound='1';
      el.addEventListener('input',()=>{
        const side=state.side==='back'?'back':'front',f=face(side);if(f)f.logoScale=Number(el.value)||1.5;
        state.custom.logoScale=Number(el.value)||1.5;persistAndRender();
      },true);
    };
    bind(document.getElementById('logoScale'));bind(document.getElementById('cc12LogoScale'));
  }
  function syncInputFontsFromEditor(){
    document.addEventListener('change',e=>{
      const select=e.target.closest?.('[data-style-font]');if(!select)return;
      const key=select.dataset.styleFont;if(!key)return;
      if(ROLE_KEYS.has(key)){state.custom.fieldFonts.department=select.value;state.custom.fieldFonts.title=select.value;}else state.custom.fieldFonts[key]=select.value;
      document.querySelectorAll(`[data-input-font="${key}"]`).forEach(s=>s.value=select.value);
      if(ROLE_KEYS.has(key))document.querySelectorAll('[data-input-font="department"],[data-input-font="title"]').forEach(s=>s.value=select.value);
      try{if(typeof persist==='function')persist();}catch(_){ }
    },true);
  }

  function boot(){
    if(!ensureState()||typeof renderDynamic!=='function'||typeof renderCard!=='function'){setTimeout(boot,100);return;}
    enhanceForm();installFormObserver();installBackPanel();syncInputFontsFromEditor();hookLogoControls();
    // editor-v12 loads dynamically; wrap after it has installed so these fixes remain the final renderer.
    let tries=0;
    const waitEditor=setInterval(()=>{
      tries++;
      hookLogoControls();enhanceForm();syncBackPanel();
      if(window.__CARDCRAFT_EDITOR_V12_PATCHED__||tries>40){clearInterval(waitEditor);installRenderPatch();hookLogoControls();}
    },100);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
