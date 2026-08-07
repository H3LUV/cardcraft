(function cardcraftEditorV12(){
  'use strict';

  const FONTS=['Noto Sans KR','Noto Serif KR','IBM Plex Sans KR','Nanum Gothic','Nanum Myeongjo','Gowun Dodum','Gowun Batang','Hahmlet','Montserrat','Poppins','Raleway','Oswald','Space Grotesk','Playfair Display','Cormorant Garamond','Cinzel','Bodoni Moda','DM Serif Display'];
  const FIELDS=[
    ['company','회사명'],['name','이름'],['title','직함'],['phone','전화번호'],
    ['email','이메일'],['website','웹사이트'],['address','주소'],['slogan','슬로건']
  ];
  const DEFAULT_STYLE={font:'',bold:false,italic:false,underline:false,color:''};

  const boot=()=>{
    if(typeof state==='undefined'||typeof renderDynamic!=='function'||typeof renderVariants!=='function'||typeof persist!=='function'||typeof renderCard!=='function'||typeof logoSvg!=='function'){
      setTimeout(boot,120);return;
    }
    if(document.getElementById('cardcraftFinalEditorV12'))return;

    document.querySelectorAll('.v5-detail-controls,#cardcraftFinalEditorV11,.cc-final-editor').forEach(el=>el.remove());

    state.custom.logoPosX=Number(state.custom.logoPosX)||0;
    state.custom.logoPosY=Number(state.custom.logoPosY)||0;
    state.custom.textStyles=state.custom.textStyles||{};
    FIELDS.forEach(([key])=>state.custom.textStyles[key]={...DEFAULT_STYLE,...(state.custom.textStyles[key]||{})});

    if(!window.__CARDCRAFT_EDITOR_V12_PATCHED__){
      window.__CARDCRAFT_EDITOR_V12_PATCHED__=true;

      const baseLogoSvg=logoSvg;
      logoSvg=function(x,y,size,color,bg,anchor='center'){
        const dx=Number(state.custom.logoPosX)||0;
        const dy=Number(state.custom.logoPosY)||0;
        const scale=Math.max(.35,Math.min(9,Number(state.custom.logoScale)||1.5));
        const maxW=anchor==='hero'?860:760;
        const maxH=anchor==='hero'?500:400;
        const renderW=Math.min(maxW,size*scale*1.45);
        const renderH=Math.min(maxH,size*scale);
        const offsetX=(size-renderW)/2;
        const offsetY=(size-renderH)/2;
        const desiredRenderX=x+dx+offsetX;
        const desiredRenderY=y+dy+offsetY;
        const safeRenderX=Math.max(0,Math.min(960-renderW,desiredRenderX));
        const safeRenderY=Math.max(0,Math.min(560-renderH,desiredRenderY));
        const safeX=safeRenderX-offsetX;
        const safeY=safeRenderY-offsetY;
        return `<svg x="0" y="0" width="960" height="560" viewBox="0 0 960 560" overflow="hidden">${baseLogoSvg(safeX,safeY,size,color,bg,anchor)}</svg>`;
      };

      const baseRenderCard=renderCard;
      const rxEscape=s=>String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
      const addAttr=(attrs,name,value)=>{
        const re=new RegExp(`\\s${name}=("[^"]*"|'[^']*')`,'i');
        const pair=` ${name}="${String(value).replace(/"/g,'&quot;')}"`;
        return re.test(attrs)?attrs.replace(re,pair):attrs+pair;
      };
      const styleText=(svg,key)=>{
        const raw=state.data&&state.data[key];
        const s=state.custom.textStyles&&state.custom.textStyles[key];
        if(!raw||!s)return svg;
        const escaped=typeof escapeXml==='function'?escapeXml(raw):String(raw);
        if(!escaped)return svg;
        const re=new RegExp(`<text([^>]*)>${rxEscape(escaped)}<\\/text>`,'g');
        return svg.replace(re,(full,attrs)=>{
          let a=attrs;
          if(s.font)a=addAttr(a,'font-family',`'${s.font}', 'Noto Sans KR', 'Malgun Gothic', Arial, sans-serif`);
          if(s.bold)a=addAttr(a,'font-weight','800');
          if(s.italic)a=addAttr(a,'font-style','italic');
          if(s.underline)a=addAttr(a,'text-decoration','underline');
          if(s.color)a=addAttr(a,'fill',s.color);
          return `<text${a}>${escaped}</text>`;
        });
      };
      renderCard=function(template,side='front',mini=false){
        let svg=baseRenderCard(template,side,mini);
        FIELDS.forEach(([key])=>{svg=styleText(svg,key);});
        return svg;
      };
    }

    const fontsHtml=`<option value="">템플릿 기본</option>${FONTS.map(f=>`<option value="${f}">${f}</option>`).join('')}`;
    const rows=FIELDS.map(([key,label])=>`
      <div class="cc12-text-row" data-text-row="${key}">
        <strong>${label}</strong>
        <select data-style-font="${key}" aria-label="${label} 폰트">${fontsHtml}</select>
        <div class="cc12-format-buttons">
          <button type="button" data-style-toggle="bold" data-style-key="${key}" title="굵게"><b>B</b></button>
          <button type="button" data-style-toggle="italic" data-style-key="${key}" title="기울임"><i>I</i></button>
          <button type="button" data-style-toggle="underline" data-style-key="${key}" title="밑줄"><u>U</u></button>
        </div>
        <label class="cc12-color"><input type="color" data-style-color="${key}" aria-label="${label} 색상"><span>색상</span></label>
        <button type="button" class="cc12-row-reset" data-style-reset="${key}" title="이 항목 초기화">↺</button>
      </div>`).join('');

    const panel=document.createElement('section');
    panel.id='cardcraftFinalEditorV12';
    panel.className='cc12-editor';
    panel.innerHTML=`
      <div class="cc12-head">
        <div><span class="section-label">04 · FINAL EDIT</span><h3>최종 편집</h3><p>텍스트 항목별 서체·스타일과 로고 위치를 각각 조정합니다.</p></div>
        <button type="button" id="cc12ResetAll">전체 편집 초기화</button>
      </div>
      <div class="cc12-block">
        <div class="cc12-block-title"><strong>텍스트 편집</strong><span>각 항목을 독립적으로 설정</span></div>
        <div class="cc12-text-list">${rows}</div>
      </div>
      <div class="cc12-block">
        <div class="cc12-block-title"><strong>로고 편집</strong><span>명함 경계 안에서만 이동·확대됩니다</span></div>
        <div class="cc12-logo-grid">
          <label><span>좌우 <b id="cc12LogoXValue">0</b></span><input id="cc12LogoX" type="range" min="-300" max="300" step="5"></label>
          <label><span>상하 <b id="cc12LogoYValue">0</b></span><input id="cc12LogoY" type="range" min="-220" max="220" step="5"></label>
          <label><span>크기 <b id="cc12LogoScaleValue">150%</b></span><input id="cc12LogoScale" type="range" min="0.35" max="9" step="0.05"></label>
        </div>
      </div>`;

    const style=document.createElement('style');
    style.textContent=`
      .cc12-editor{margin-top:14px;padding:17px;border:1px solid #d0d5dd;border-radius:12px;background:#fff;box-shadow:0 1px 2px rgba(16,24,40,.04)}
      .cc12-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:14px}.cc12-head h3{margin:4px 0 2px;font-size:15px}.cc12-head p{margin:0;color:#98a2b3;font-size:10px}.cc12-head>button{height:31px;border:1px solid #d0d5dd;border-radius:7px;background:#fff;padding:0 10px;font-size:9px;font-weight:700;color:#667085}
      .cc12-block{border-top:1px solid #eaecf0;padding-top:13px;margin-top:13px}.cc12-block-title{display:flex;align-items:baseline;gap:8px;margin-bottom:9px}.cc12-block-title strong{font-size:11px;color:#101828}.cc12-block-title span{font-size:9px;color:#98a2b3}
      .cc12-text-list{display:flex;flex-direction:column;gap:6px}.cc12-text-row{display:grid;grid-template-columns:70px minmax(150px,1.5fr) auto 84px 30px;gap:7px;align-items:center;padding:7px 8px;border:1px solid #eaecf0;border-radius:8px;background:#f9fafb}.cc12-text-row>strong{font-size:9px;color:#344054}.cc12-text-row select{height:30px;border:1px solid #d0d5dd;border-radius:7px;background:#fff;padding:0 7px;font-size:10px;color:#344054;min-width:0}.cc12-format-buttons{display:flex;gap:3px}.cc12-format-buttons button,.cc12-row-reset{width:30px;height:30px;border:1px solid #d0d5dd;border-radius:6px;background:#fff;color:#667085;font-size:11px}.cc12-format-buttons button.active{background:#101828;border-color:#101828;color:#fff}.cc12-color{height:30px;display:flex;align-items:center;gap:5px;padding:3px 6px;border:1px solid #d0d5dd;border-radius:7px;background:#fff;cursor:pointer}.cc12-color input{width:22px;height:22px;border:0;padding:0;background:none}.cc12-color span{font-size:9px;color:#667085}.cc12-row-reset{font-size:13px}
      .cc12-logo-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.cc12-logo-grid label{display:block;border:1px solid #eaecf0;border-radius:8px;padding:9px;background:#f9fafb}.cc12-logo-grid label>span{display:flex;justify-content:space-between;margin-bottom:7px;font-size:9px;font-weight:700;color:#475467}.cc12-logo-grid input[type=range]{width:100%;accent-color:#111827}
      @media(max-width:850px){.cc12-text-row{grid-template-columns:64px 1fr auto 78px 30px}}@media(max-width:650px){.cc12-head{display:block}.cc12-head>button{margin-top:9px}.cc12-text-row{grid-template-columns:1fr 1fr}.cc12-text-row>strong{grid-column:1/-1}.cc12-row-reset{justify-self:end}.cc12-logo-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);

    const stage=document.querySelector('.main-stage');
    if(stage)stage.appendChild(panel);else document.querySelector('main')?.appendChild(panel);

    const refresh=()=>{persist();renderDynamic();renderVariants();};
    const sync=()=>{
      FIELDS.forEach(([key])=>{
        const s=state.custom.textStyles[key];
        const select=panel.querySelector(`[data-style-font="${key}"]`);if(select)select.value=s.font||'';
        const color=panel.querySelector(`[data-style-color="${key}"]`);if(color)color.value=s.color||'#111827';
        panel.querySelectorAll(`[data-style-key="${key}"]`).forEach(btn=>btn.classList.toggle('active',!!s[btn.dataset.styleToggle]));
      });
      const x=document.getElementById('cc12LogoX'),y=document.getElementById('cc12LogoY'),z=document.getElementById('cc12LogoScale');
      x.value=String(Number(state.custom.logoPosX)||0);y.value=String(Number(state.custom.logoPosY)||0);z.value=String(Number(state.custom.logoScale)||1.5);
      document.getElementById('cc12LogoXValue').textContent=x.value;document.getElementById('cc12LogoYValue').textContent=y.value;document.getElementById('cc12LogoScaleValue').textContent=`${Math.round(Number(z.value)*100)}%`;
    };

    panel.addEventListener('change',e=>{
      const fontKey=e.target.dataset.styleFont,colorKey=e.target.dataset.styleColor;
      if(fontKey){state.custom.textStyles[fontKey].font=e.target.value;refresh();}
      if(colorKey){state.custom.textStyles[colorKey].color=e.target.value;refresh();}
    });
    panel.addEventListener('input',e=>{
      const colorKey=e.target.dataset.styleColor;if(colorKey){state.custom.textStyles[colorKey].color=e.target.value;refresh();}
    });
    panel.addEventListener('click',e=>{
      const toggle=e.target.closest('[data-style-toggle]');
      if(toggle){const key=toggle.dataset.styleKey,prop=toggle.dataset.styleToggle;state.custom.textStyles[key][prop]=!state.custom.textStyles[key][prop];toggle.classList.toggle('active',state.custom.textStyles[key][prop]);refresh();return;}
      const reset=e.target.closest('[data-style-reset]');
      if(reset){state.custom.textStyles[reset.dataset.styleReset]={...DEFAULT_STYLE};sync();refresh();}
    });

    const xEl=document.getElementById('cc12LogoX'),yEl=document.getElementById('cc12LogoY'),scaleEl=document.getElementById('cc12LogoScale');
    xEl.addEventListener('input',()=>{state.custom.logoPosX=Number(xEl.value);document.getElementById('cc12LogoXValue').textContent=xEl.value;refresh();});
    yEl.addEventListener('input',()=>{state.custom.logoPosY=Number(yEl.value);document.getElementById('cc12LogoYValue').textContent=yEl.value;refresh();});
    scaleEl.addEventListener('input',()=>{state.custom.logoScale=Number(scaleEl.value);document.getElementById('cc12LogoScaleValue').textContent=`${Math.round(Number(scaleEl.value)*100)}%`;const old=document.getElementById('logoScale');if(old)old.value=scaleEl.value;refresh();});

    document.getElementById('cc12ResetAll').addEventListener('click',()=>{
      FIELDS.forEach(([key])=>state.custom.textStyles[key]={...DEFAULT_STYLE});state.custom.logoPosX=0;state.custom.logoPosY=0;state.custom.logoScale=1.5;sync();refresh();if(typeof showToast==='function')showToast('텍스트와 로고 편집값을 모두 초기화했습니다.');
    });

    sync();refresh();
    console.info('Cardcraft Final Editor V12 active');
  };
  boot();
})();
