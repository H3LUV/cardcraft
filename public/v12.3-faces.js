(function cardcraftV123Faces(){
  'use strict';

  const BACK_FIELDS=[
    ['company','회사명 / 브랜드명'],['name','이름'],['department','부서명'],['title','직함 / 직책'],
    ['phone','전화번호'],['email','이메일'],['website','웹사이트 / SNS'],['address','주소'],['slogan','슬로건 / 기타 문구']
  ];
  const FONT_OPTIONS=[
    ['','템플릿 기본'],['Noto Sans KR','Noto Sans KR'],['Noto Serif KR','Noto Serif KR'],['IBM Plex Sans KR','IBM Plex Sans KR'],
    ['Nanum Gothic','나눔고딕'],['Nanum Myeongjo','나눔명조'],['Gowun Dodum','고운돋움'],['Gowun Batang','고운바탕'],['Hahmlet','함렛'],
    ['Montserrat','Montserrat'],['Poppins','Poppins'],['Raleway','Raleway'],['Oswald','Oswald'],['Space Grotesk','Space Grotesk'],
    ['Playfair Display','Playfair Display'],['Cormorant Garamond','Cormorant Garamond'],['Cinzel','Cinzel'],['Bodoni Moda','Bodoni Moda'],['DM Serif Display','DM Serif Display']
  ];
  const STYLE_KEYS=['minimal','classic','modern','creative','casual'];
  const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const escapeXml=s=>String(s??'').replace(/[<>&'\"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','\"':'&quot;'}[c]));

  function boot(){
    if(typeof state==='undefined'||typeof renderCard!=='function'||typeof persist!=='function'||!Array.isArray(LIBRARY)||!document.getElementById('formGrid')){
      setTimeout(boot,100);return;
    }
    // Wait until the V12.2 patch has installed its back-side controls/render wrapper.
    if(!document.getElementById('ccBackTextPanel')){setTimeout(boot,100);return;}
    if(window.__CARDCRAFT_V123_FACES__)return;
    window.__CARDCRAFT_V123_FACES__=true;

    ensureState();
    replaceBackInputUi();
    installIndependentBackStyleUi();
    installRenderPatch();
    installSideHooks();
    syncFaceUi();
  }

  function ensureState(){
    state.custom=state.custom||{};
    state.custom.backData={
      company:'',name:'',department:'',title:'',phone:'',email:'',website:'',address:'',slogan:'',
      ...(state.custom.backData||{})
    };
    state.custom.backFieldFonts={...(state.custom.backFieldFonts||{})};
    if(typeof state.custom.backStyleLinked!=='boolean')state.custom.backStyleLinked=true;
    if(typeof state.custom.backTemplateId!=='string')state.custom.backTemplateId='';
    if(typeof state.custom.backCategory!=='string')state.custom.backCategory='';
  }

  function saveAndRender(){
    try{persist();}catch(_){ }
    try{renderDynamic();}catch(_){ }
    try{renderVariants();}catch(_){ }
    requestAnimationFrame(syncFaceUi);
  }

  function fontOptions(selected=''){
    return FONT_OPTIONS.map(([v,l])=>`<option value="${escapeHtml(v)}" ${v===selected?'selected':''}>${escapeHtml(l)}</option>`).join('');
  }

  function replaceBackInputUi(){
    document.getElementById('ccBackTextPanel')?.remove();
    if(document.getElementById('ccBackInputPanel'))return;
    const form=document.getElementById('formGrid');
    const panel=document.createElement('section');
    panel.id='ccBackInputPanel';
    panel.className='cc13-back-input';
    panel.innerHTML=`
      <div class="cc13-back-head">
        <div><span class="section-label">BACK SIDE · OPTIONAL</span><strong>뒷면 텍스트 입력</strong><p>뒷면은 모든 항목이 선택 입력입니다. 비워 둔 항목은 명함에 표시하지 않습니다.</p></div>
        <div class="cc13-back-actions"><button type="button" id="cc13CopyFront">앞면 정보 불러오기</button><button type="button" id="cc13ClearBack">전체 비우기</button></div>
      </div>
      <div class="cc13-back-grid">${BACK_FIELDS.map(([key,label])=>`
        <label class="cc13-back-field ${key==='address'?'span-2':''}">
          <span>${escapeHtml(label)} <em>선택</em></span>
          <input type="text" data-back-field="${key}" value="${escapeHtml(state.custom.backData[key]||'')}" placeholder="입력하지 않으면 표시 안 함">
          <div class="cc13-back-font"><span>폰트</span><select data-back-font="${key}">${fontOptions(state.custom.backFieldFonts[key]||'')}</select></div>
        </label>`).join('')}</div>`;
    form.insertAdjacentElement('afterend',panel);

    panel.querySelectorAll('[data-back-field]').forEach(input=>input.addEventListener('input',e=>{
      state.custom.backData[e.target.dataset.backField]=e.target.value;
      saveAndRender();
    }));
    panel.querySelectorAll('[data-back-font]').forEach(select=>select.addEventListener('change',e=>{
      const key=e.target.dataset.backFont,font=e.target.value;
      state.custom.backFieldFonts[key]=font;
      const face=state.custom.faceEdits?.back;
      if(face?.textStyles?.[key])face.textStyles[key].font=font;
      saveAndRender();
    }));
    panel.querySelector('#cc13CopyFront').addEventListener('click',()=>{
      BACK_FIELDS.forEach(([key])=>{state.custom.backData[key]=String(state.data?.[key]||'');});
      syncBackInputs();saveAndRender();
      window.showToast?.('앞면 정보를 뒷면 선택 입력으로 불러왔습니다.');
    });
    panel.querySelector('#cc13ClearBack').addEventListener('click',()=>{
      BACK_FIELDS.forEach(([key])=>{state.custom.backData[key]='';});
      syncBackInputs();saveAndRender();
      window.showToast?.('뒷면 텍스트를 모두 비웠습니다.');
    });
  }

  function syncBackInputs(){
    const panel=document.getElementById('ccBackInputPanel');if(!panel)return;
    panel.querySelectorAll('[data-back-field]').forEach(input=>input.value=state.custom.backData[input.dataset.backField]||'');
    panel.querySelectorAll('[data-back-font]').forEach(select=>select.value=state.custom.backFieldFonts[select.dataset.backFont]||'');
  }

  function frontTemplate(){
    try{return typeof selectedTemplate==='function'?selectedTemplate():LIBRARY.find(t=>t.id===state.selectedId)||LIBRARY[0];}
    catch(_){return LIBRARY.find(t=>t.id===state.selectedId)||LIBRARY[0];}
  }
  function backTemplate(){
    if(state.custom.backStyleLinked)return frontTemplate();
    return LIBRARY.find(t=>t.id===state.custom.backTemplateId)||frontTemplate();
  }
  function styleName(key){return (typeof STYLE_META!=='undefined'&&STYLE_META[key]?.name)||({minimal:'미니멀',classic:'클래식',modern:'모던',creative:'크리에이티브',casual:'캐주얼'}[key]||key);}
  function setBackStyleCategory(category){
    if(category==='match'||category==='all'){
      state.custom.backStyleLinked=true;state.custom.backCategory='';state.custom.backTemplateId='';
    }else{
      const front=frontTemplate(),theme=front?.themeKey||'brand',layout=front?.layout;
      const matched=LIBRARY.find(t=>t.category===category&&t.layout===layout&&(t.themeKey||'brand')===theme)
        ||LIBRARY.find(t=>t.category===category&&(t.themeKey||'brand')===theme)
        ||LIBRARY.find(t=>t.category===category);
      if(matched){state.custom.backStyleLinked=false;state.custom.backCategory=category;state.custom.backTemplateId=matched.id;}
    }
    saveAndRender();
  }

  function installIndependentBackStyleUi(){
    if(document.getElementById('cc13BackStylePanel'))return;
    const styles=document.querySelector('.styles-panel');if(!styles)return;
    const panel=document.createElement('section');
    panel.id='cc13BackStylePanel';panel.className='cc13-back-style';
    panel.innerHTML=`
      <div class="cc13-style-head"><span class="section-label">BACK SIDE STYLE</span><strong>뒷면 스타일</strong><p>처음에는 앞면 디자인과 자동으로 맞춥니다. 원하면 뒷면만 다른 스타일을 선택할 수 있습니다.</p></div>
      <button type="button" class="cc13-match" data-back-style="match">↔ 앞면과 동일하게 유지</button>
      <div class="cc13-style-buttons">${STYLE_KEYS.map(k=>`<button type="button" data-back-style="${k}">${escapeHtml(styleName(k))}</button>`).join('')}</div>
      <label class="cc13-exact"><span>뒷면 세부 디자인</span><select id="cc13BackTemplate"></select></label>
      <button type="button" class="cc13-library" id="cc13BackLibrary">▦ 전체 1,000개에서 뒷면 디자인 선택</button>`;
    styles.appendChild(panel);
    panel.querySelectorAll('[data-back-style]').forEach(btn=>btn.addEventListener('click',()=>setBackStyleCategory(btn.dataset.backStyle)));
    panel.querySelector('#cc13BackTemplate').addEventListener('change',e=>{
      const t=LIBRARY.find(x=>x.id===e.target.value);if(!t)return;
      state.custom.backStyleLinked=false;state.custom.backTemplateId=t.id;state.custom.backCategory=t.category;saveAndRender();
    });
    panel.querySelector('#cc13BackLibrary').addEventListener('click',()=>{
      document.getElementById('libraryBtn')?.click();
      setTimeout(syncLibraryHeading,0);
    });

    // Existing style cards become face-aware: on the back side they set only the back style.
    document.addEventListener('click',event=>{
      const btn=event.target.closest?.('.style-card[data-style]');
      if(!btn||state.side!=='back')return;
      event.preventDefault();event.stopImmediatePropagation();
      setBackStyleCategory(btn.dataset.style);
    },true);

    // The existing 1,000-template browser can independently choose a back template.
    document.addEventListener('click',event=>{
      const btn=event.target.closest?.('[data-library-template]');
      if(!btn||state.side!=='back')return;
      event.preventDefault();event.stopImmediatePropagation();
      const t=LIBRARY.find(x=>x.id===btn.dataset.libraryTemplate);if(!t)return;
      state.custom.backStyleLinked=false;state.custom.backTemplateId=t.id;state.custom.backCategory=t.category;
      try{persist();}catch(_){ }
      try{closeTemplateLibrary();}catch(_){document.getElementById('templateModal')?.setAttribute('hidden','');}
      try{renderDynamic();}catch(_){ }
      requestAnimationFrame(syncFaceUi);
      window.showToast?.(`뒷면 디자인을 ${t.label}(으)로 변경했습니다.`);
    },true);

    document.getElementById('libraryBtn')?.addEventListener('click',()=>setTimeout(syncLibraryHeading,0),true);
    const list=document.getElementById('styleList');
    if(list)new MutationObserver(()=>requestAnimationFrame(syncStyleCards)).observe(list,{childList:true});
  }

  function syncLibraryHeading(){
    if(state.side!=='back')return;
    const title=document.getElementById('templateModalTitle');if(title)title.textContent='뒷면 디자인 선택';
    const p=title?.parentElement?.querySelector('p');if(p)p.textContent='선택한 디자인은 뒷면에만 적용됩니다. 앞면 디자인은 유지됩니다.';
  }

  function syncBackTemplateSelect(){
    const select=document.getElementById('cc13BackTemplate');if(!select)return;
    const current=backTemplate(),category=state.custom.backStyleLinked?(current?.category||'minimal'):(state.custom.backCategory||current?.category||'minimal');
    const pool=LIBRARY.filter(t=>t.category===category);
    select.innerHTML=pool.map(t=>`<option value="${escapeHtml(t.id)}" ${t.id===current?.id?'selected':''}>${escapeHtml(t.label)}</option>`).join('');
    select.disabled=state.custom.backStyleLinked;
  }

  function syncStyleCards(){
    const back=state.side==='back',current=backTemplate();
    document.querySelectorAll('.style-card[data-style]').forEach(btn=>{
      if(!back)return;
      const key=btn.dataset.style;
      const selected=state.custom.backStyleLinked?(key==='all'||key===frontTemplate()?.category):(key===state.custom.backCategory||key===current?.category);
      btn.classList.toggle('selected',selected);
    });
    const heading=document.querySelector('.styles-panel .panel-heading h2');
    if(heading)heading.textContent=back?'뒷면은 어떤 인상으로 만들까요?':'어떤 인상을 원하세요?';
  }

  function syncBackStylePanel(){
    const panel=document.getElementById('cc13BackStylePanel');if(!panel)return;
    panel.classList.toggle('is-visible',state.side==='back');
    panel.querySelectorAll('[data-back-style]').forEach(btn=>{
      const key=btn.dataset.backStyle;
      btn.classList.toggle('active',key==='match'?state.custom.backStyleLinked:(!state.custom.backStyleLinked&&backTemplate()?.category===key));
    });
    syncBackTemplateSelect();
  }

  function parseBox(svg){const m=String(svg).match(/viewBox=["']0\s+0\s+([0-9.]+)\s+([0-9.]+)["']/i);return m?{w:Number(m[1]),h:Number(m[2])}:{w:960,h:560};}
  function faceStyle(key){return state.custom.faceEdits?.back?.textStyles?.[key]||{};}
  function backFont(key){return state.custom.backFieldFonts?.[key]||faceStyle(key).font||'Noto Sans KR';}
  function textColor(svg,key){
    const chosen=faceStyle(key).color;if(chosen)return chosen;
    const rect=String(svg).match(/<rect[^>]*fill=["'](#[0-9a-fA-F]{6})["'][^>]*>/i),hex=rect?.[1]||'#ffffff';
    const n=parseInt(hex.slice(1),16),r=(n>>16)&255,g=(n>>8)&255,b=n&255;
    return (.2126*r+.7152*g+.0722*b)<135?'#ffffff':'#111827';
  }
  function removeOldBackText(svg){return String(svg).replace(/<g[^>]*id=["']BACK_SELECTED_TEXT["'][^>]*>[\s\S]*?<\/g>/gi,'');}
  function customBackText(svg){
    const entries=BACK_FIELDS.map(([key])=>[key,String(state.custom.backData?.[key]||'').trim()]).filter(([,v])=>v);
    if(!entries.length)return removeOldBackText(svg);
    svg=removeOldBackText(svg);
    const box=parseBox(svg),align=state.custom.align||'left',anchor=align==='center'?'middle':align==='right'?'end':'start';
    const pad=Math.max(36,Math.min(box.w,box.h)*.07),x=align==='center'?box.w/2:align==='right'?box.w-pad:pad;
    const gap=Math.max(24,Math.min(box.w,box.h)*.052),total=(entries.length-1)*gap,start=Math.max(pad,box.h-pad-total);
    const baseSizes={company:22,name:26,department:16,title:16,phone:15,email:15,website:15,address:14,slogan:14};
    const layer=entries.map(([key,value],i)=>{
      const style=faceStyle(key),pct=Math.max(60,Math.min(180,Number(style.size)||100)),size=(baseSizes[key]||15)*pct/100;
      const weight=style.bold?'800':(key==='company'||key==='name'?'800':key==='department'||key==='title'?'600':'500');
      const italic=style.italic?' font-style="italic"':'',underline=style.underline?' text-decoration="underline"':'';
      return `<text id="BACK_${key.toUpperCase()}" x="${x}" y="${start+i*gap}" text-anchor="${anchor}" font-family="'${escapeXml(backFont(key))}', 'Noto Sans KR', 'Malgun Gothic', Arial, sans-serif" font-size="${size.toFixed(2)}" font-weight="${weight}"${italic}${underline} fill="${textColor(svg,key)}">${escapeXml(value)}</text>`;
    }).join('');
    return svg.replace(/<\/svg>\s*$/,`<g id="BACK_SELECTED_TEXT">${layer}</g></svg>`);
  }

  function installRenderPatch(){
    if(window.__CARDCRAFT_V123_RENDER__)return;
    window.__CARDCRAFT_V123_RENDER__=true;
    const baseRender=renderCard;
    renderCard=function(template,side='front',mini=false){
      side=side==='back'?'back':'front';
      if(side==='front')return baseRender(template,side,mini);
      ensureState();
      const chosen=state.custom.backStyleLinked?template:backTemplate();
      const oldData={};
      const keys=['company','name','department','title','phone','email','website','address','slogan','industry'];
      keys.forEach(k=>oldData[k]=state.data?.[k]);
      const oldSelected=Array.isArray(state.custom.backTextFields)?[...state.custom.backTextFields]:[];
      const enabled=[];
      try{
        BACK_FIELDS.forEach(([key])=>{state.data[key]=state.custom.backData[key]||'';if(String(state.custom.backData[key]||'').trim())enabled.push(key);});
        state.data.industry='';
        state.custom.backTextFields=enabled;
        let svg=baseRender(chosen,side,mini);
        return customBackText(svg);
      }finally{
        keys.forEach(k=>state.data[k]=oldData[k]);
        state.custom.backTextFields=oldSelected;
      }
    };
    window.renderCard=renderCard;
  }

  function syncEditorRows(){
    const editor=document.getElementById('cardcraftFinalEditorV12');if(!editor)return;
    const back=state.side==='back';
    editor.querySelectorAll('[data-text-row]').forEach(row=>{
      if(!back){row.hidden=false;return;}
      const key=row.dataset.textRow;
      row.hidden=!String(state.custom.backData?.[key]||'').trim();
    });
    const title=editor.querySelector('.cc12-block-title span');
    if(back&&title)title.textContent='뒷면 입력에서 사용한 텍스트만 세부 조정합니다.';
  }

  function syncFaceUi(){
    ensureState();
    const back=state.side==='back';
    document.getElementById('ccBackInputPanel')?.classList.toggle('is-visible',back);
    syncBackInputs();syncBackStylePanel();syncStyleCards();syncEditorRows();
    if(back){
      const title=document.getElementById('previewTitle'),t=backTemplate();if(title&&t)title.textContent=`뒷면 · ${t.label}`;
    }
  }

  function installSideHooks(){
    document.querySelectorAll('[data-side]').forEach(btn=>btn.addEventListener('click',()=>setTimeout(syncFaceUi,0)));
    const main=document.getElementById('mainCard');if(main)new MutationObserver(()=>requestAnimationFrame(syncFaceUi)).observe(main,{childList:true});
  }

  boot();
})();
