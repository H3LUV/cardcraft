(function cardcraftEditorV14Extras(){
  'use strict';

  const EXTRA_FONTS = [
    ['Gothic A1','한글 · 고딕'],['Black Han Sans','한글 · 굵은 제목'],['Do Hyeon','한글 · 제목'],['Jua','한글 · 친근'],['Sunflower','한글 · 부드러움'],['Song Myung','한글 · 명조'],
    ['Nanum Pen Script','한글 · 손글씨'],['Nanum Brush Script','한글 · 붓글씨'],['Gaegu','한글 · 손글씨'],['Gamja Flower','한글 · 손글씨'],['Hi Melody','한글 · 손글씨'],['Poor Story','한글 · 손글씨'],['Yeon Sung','한글 · 손글씨'],['Cute Font','한글 · 캐주얼'],['East Sea Dokdo','한글 · 개성'],['Gugi','한글 · 디스플레이'],
    ['Inter','영문 · 산세리프'],['Roboto','영문 · 산세리프'],['Lato','영문 · 산세리프'],['Open Sans','영문 · 산세리프'],['Manrope','영문 · 모던'],['Outfit','영문 · 모던'],['Sora','영문 · 모던'],['Urbanist','영문 · 모던'],['Figtree','영문 · 모던'],['League Spartan','영문 · 볼드'],['Josefin Sans','영문 · 기하학'],['Quicksand','영문 · 라운드'],
    ['Merriweather','영문 · 세리프'],['Lora','영문 · 세리프'],['EB Garamond','영문 · 세리프'],['Libre Baskerville','영문 · 세리프'],['Libre Bodoni','영문 · 럭셔리'],['Abril Fatface','영문 · 디스플레이'],['Bebas Neue','영문 · 디스플레이'],['Anton','영문 · 디스플레이'],['Archivo Black','영문 · 디스플레이'],['Pacifico','영문 · 스크립트']
  ];

  const loadedFonts = new Set();
  function loadFont(name){
    if(!name || loadedFonts.has(name)) return;
    loadedFonts.add(name);
    const id='cc-font-'+name.toLowerCase().replace(/[^a-z0-9가-힣]+/g,'-');
    if(document.getElementById(id)) return;
    const link=document.createElement('link');
    link.id=id;
    link.rel='stylesheet';
    link.href='https://fonts.googleapis.com/css2?family='+encodeURIComponent(name).replace(/%20/g,'+')+'&display=swap';
    document.head.appendChild(link);
  }

  function extendFontSelects(panel){
    panel.querySelectorAll('select[data-style-font]').forEach(select=>{
      if(select.dataset.v14Fonts==='true') return;
      select.dataset.v14Fonts='true';
      const existing=new Set([...select.options].map(o=>o.value));
      const ko=document.createElement('optgroup'); ko.label='추가 한글 폰트';
      const en=document.createElement('optgroup'); en.label='추가 영문 폰트';
      EXTRA_FONTS.forEach(([name,label])=>{
        if(existing.has(name)) return;
        const option=document.createElement('option');
        option.value=name; option.textContent=name+' · '+label.split(' · ').pop();
        (label.startsWith('한글')?ko:en).appendChild(option);
      });
      if(ko.children.length) select.appendChild(ko);
      if(en.children.length) select.appendChild(en);
      select.addEventListener('change',()=>{ if(select.value) loadFont(select.value); });
    });

    const faces=window.state?.custom?.faceEdits;
    if(faces){
      ['front','back'].forEach(side=>{
        const styles=faces[side]?.textStyles||{};
        Object.values(styles).forEach(s=>{ if(s?.font) loadFont(s.font); });
      });
    }
  }

  function fileToDataUrl(file){
    return new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onload=()=>resolve(String(reader.result||''));
      reader.onerror=()=>reject(reader.error||new Error('파일을 읽을 수 없습니다.'));
      reader.readAsDataURL(file);
    });
  }

  function boot(){
    const panel=document.getElementById('cardcraftFinalEditorV12');
    if(!panel || typeof state==='undefined' || typeof renderCard!=='function' || typeof persist!=='function' || typeof renderDynamic!=='function'){
      setTimeout(boot,150); return;
    }
    if(panel.dataset.v14Extras==='true') return;
    panel.dataset.v14Extras='true';

    extendFontSelects(panel);

    if(!state.data.secondaryLogoDataUrl) state.data.secondaryLogoDataUrl='';
    if(!state.data.secondaryLogoFileName) state.data.secondaryLogoFileName='';
    if(!state.custom.faceEdits) state.custom.faceEdits={front:{},back:{}};
    ['front','back'].forEach(side=>{
      const face=state.custom.faceEdits[side]||(state.custom.faceEdits[side]={});
      face.secondaryLogo={
        enabled:false,x:700,y:390,scale:1,
        ...(face.secondaryLogo||{})
      };
    });

    const logoBlock=document.createElement('div');
    logoBlock.className='cc14-secondary-block cc12-block';
    logoBlock.innerHTML=`
      <div class="cc12-block-title"><strong>보조 로고</strong><span>협력사·브랜드·파트너 로고를 현재 면에 별도로 배치</span></div>
      <div class="cc14-secondary-upload">
        <div class="cc14-secondary-preview" id="cc14SecondaryPreview">2ND LOGO</div>
        <div class="cc14-secondary-meta"><strong id="cc14SecondaryName">보조 로고 없음</strong><span>PNG · JPG · WebP · SVG</span></div>
        <button type="button" id="cc14SecondaryChoose">파일 선택</button>
        <button type="button" id="cc14SecondaryRemove">삭제</button>
        <input type="file" id="cc14SecondaryInput" accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml" hidden>
      </div>
      <div class="cc14-secondary-controls">
        <label class="cc14-show"><span>현재 면에 표시</span><input type="checkbox" id="cc14SecondaryEnabled"></label>
        <label><span>좌우 <b id="cc14SecondaryXValue">0</b></span><input id="cc14SecondaryX" type="range" min="0" max="860" step="5"></label>
        <label><span>상하 <b id="cc14SecondaryYValue">0</b></span><input id="cc14SecondaryY" type="range" min="0" max="500" step="5"></label>
        <label><span>크기 <b id="cc14SecondaryScaleValue">100%</b></span><input id="cc14SecondaryScale" type="range" min="0.25" max="3" step="0.05"></label>
      </div>`;

    panel.appendChild(logoBlock);

    const style=document.createElement('style');
    style.textContent=`
      .cc14-secondary-upload{display:grid;grid-template-columns:62px minmax(140px,1fr) auto auto;gap:8px;align-items:center;padding:10px;border:1px solid #eaecf0;border-radius:9px;background:#f9fafb}.cc14-secondary-preview{width:56px;height:42px;border:1px dashed #cfd4dc;border-radius:7px;background:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden;font-size:8px;font-weight:800;color:#98a2b3}.cc14-secondary-preview img{max-width:100%;max-height:100%;object-fit:contain}.cc14-secondary-meta{display:flex;flex-direction:column;min-width:0}.cc14-secondary-meta strong{font-size:10px;color:#344054;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cc14-secondary-meta span{font-size:8px;color:#98a2b3;margin-top:2px}.cc14-secondary-upload button{height:30px;padding:0 9px;border:1px solid #d0d5dd;border-radius:7px;background:#fff;font-size:9px;font-weight:700;color:#475467}.cc14-secondary-controls{display:grid;grid-template-columns:.8fr 1fr 1fr 1fr;gap:9px;margin-top:9px}.cc14-secondary-controls label{border:1px solid #eaecf0;border-radius:8px;padding:9px;background:#f9fafb}.cc14-secondary-controls label>span{display:flex;justify-content:space-between;margin-bottom:7px;font-size:9px;font-weight:700;color:#475467}.cc14-secondary-controls input[type=range]{width:100%}.cc14-show{display:flex!important;align-items:center;justify-content:space-between;gap:8px}.cc14-show span{margin:0!important}.cc14-show input{width:18px;height:18px}@media(max-width:700px){.cc14-secondary-upload{grid-template-columns:56px 1fr}.cc14-secondary-controls{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);

    const currentSide=()=>state.side==='back'?'back':'front';
    const currentCfg=()=>state.custom.faceEdits[currentSide()].secondaryLogo;
    const refresh=()=>{persist();renderDynamic();if(typeof renderVariants==='function')renderVariants();};

    const originalRenderCard=renderCard;
    renderCard=function(template,side='front',mini=false){
      let svg=originalRenderCard(template,side,mini);
      const face=state.custom.faceEdits?.[side==='back'?'back':'front'];
      const cfg=face?.secondaryLogo;
      const href=state.data.secondaryLogoDataUrl;
      if(!cfg?.enabled || !href) return svg;
      const scale=Math.max(.25,Math.min(3,Number(cfg.scale)||1));
      const w=Math.min(360,140*scale),h=Math.min(220,100*scale);
      const x=Math.max(0,Math.min(960-w,Number(cfg.x)||0));
      const y=Math.max(0,Math.min(560-h,Number(cfg.y)||0));
      const image=`<image data-secondary-logo="true" href="${href}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>`;
      const close=svg.lastIndexOf('</svg>');
      return close>=0?svg.slice(0,close)+image+svg.slice(close):svg+image;
    };

    const preview=document.getElementById('cc14SecondaryPreview');
    const nameEl=document.getElementById('cc14SecondaryName');
    const enabled=document.getElementById('cc14SecondaryEnabled');
    const xEl=document.getElementById('cc14SecondaryX');
    const yEl=document.getElementById('cc14SecondaryY');
    const scaleEl=document.getElementById('cc14SecondaryScale');
    const xVal=document.getElementById('cc14SecondaryXValue');
    const yVal=document.getElementById('cc14SecondaryYValue');
    const scaleVal=document.getElementById('cc14SecondaryScaleValue');
    const input=document.getElementById('cc14SecondaryInput');

    function sync(){
      const cfg=currentCfg();
      enabled.checked=!!cfg.enabled;
      xEl.value=String(Number(cfg.x)||0); yEl.value=String(Number(cfg.y)||0); scaleEl.value=String(Number(cfg.scale)||1);
      xVal.textContent=xEl.value; yVal.textContent=yEl.value; scaleVal.textContent=Math.round(Number(scaleEl.value)*100)+'%';
      nameEl.textContent=state.data.secondaryLogoFileName||'보조 로고 없음';
      preview.innerHTML=state.data.secondaryLogoDataUrl?`<img src="${state.data.secondaryLogoDataUrl}" alt="보조 로고 미리보기">`:'2ND LOGO';
    }

    document.getElementById('cc14SecondaryChoose').addEventListener('click',()=>input.click());
    document.getElementById('cc14SecondaryRemove').addEventListener('click',()=>{
      state.data.secondaryLogoDataUrl='';state.data.secondaryLogoFileName='';
      ['front','back'].forEach(side=>state.custom.faceEdits[side].secondaryLogo.enabled=false);
      sync();refresh();
      if(typeof showToast==='function')showToast('보조 로고를 삭제했습니다.');
    });
    input.addEventListener('change',async()=>{
      const file=input.files?.[0]; if(!file)return;
      try{
        state.data.secondaryLogoDataUrl=await fileToDataUrl(file);
        state.data.secondaryLogoFileName=file.name;
        currentCfg().enabled=true;
        sync();refresh();
        if(typeof showToast==='function')showToast('보조 로고를 추가했습니다.');
      }catch(err){ if(typeof showToast==='function')showToast('보조 로고 파일을 읽지 못했습니다.'); }
      input.value='';
    });
    enabled.addEventListener('change',()=>{currentCfg().enabled=enabled.checked;refresh();});
    xEl.addEventListener('input',()=>{currentCfg().x=Number(xEl.value);xVal.textContent=xEl.value;refresh();});
    yEl.addEventListener('input',()=>{currentCfg().y=Number(yEl.value);yVal.textContent=yEl.value;refresh();});
    scaleEl.addEventListener('input',()=>{currentCfg().scale=Number(scaleEl.value);scaleVal.textContent=Math.round(Number(scaleEl.value)*100)+'%';refresh();});

    document.querySelectorAll('.segmented [data-side],[data-edit-side]').forEach(btn=>btn.addEventListener('click',()=>setTimeout(sync,0)));
    new MutationObserver(()=>{extendFontSelects(panel);}).observe(panel,{childList:true,subtree:true});

    sync();refresh();
    console.info('Cardcraft V14 font library + secondary logo active');
  }

  boot();
})();
