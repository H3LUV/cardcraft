(function cardcraftEditorV12(){
  'use strict';

  const FONTS=['Noto Sans KR','Noto Serif KR','IBM Plex Sans KR','Nanum Gothic','Nanum Myeongjo','Gowun Dodum','Gowun Batang','Hahmlet','Montserrat','Poppins','Raleway','Oswald','Space Grotesk','Playfair Display','Cormorant Garamond','Cinzel','Bodoni Moda','DM Serif Display'];
  const FIELDS=[['company','회사명'],['name','이름'],['title','직함'],['phone','전화번호'],['email','이메일'],['website','웹사이트'],['address','주소'],['slogan','슬로건']];
  const DEFAULT_STYLE={font:'',bold:false,italic:false,underline:false,color:''};
  const blankStyles=()=>Object.fromEntries(FIELDS.map(([key])=>[key,{...DEFAULT_STYLE}]));
  const blankFace=()=>({logoPosX:0,logoPosY:0,logoScale:1.5,textStyles:blankStyles()});

  const boot=()=>{
    if(typeof state==='undefined'||typeof renderDynamic!=='function'||typeof renderVariants!=='function'||typeof persist!=='function'||typeof renderCard!=='function'||typeof logoSvg!=='function'){
      setTimeout(boot,120);return;
    }
    if(document.getElementById('cardcraftFinalEditorV12'))return;

    document.querySelectorAll('.v5-detail-controls,#cardcraftFinalEditorV11,.cc-final-editor').forEach(el=>el.remove());

    // Migrate the existing single-face edits to front once, then keep both faces independent.
    if(!state.custom.faceEdits){
      const migratedFront=blankFace();
      migratedFront.logoPosX=Number(state.custom.logoPosX)||0;
      migratedFront.logoPosY=Number(state.custom.logoPosY)||0;
      migratedFront.logoScale=Number(state.custom.logoScale)||1.5;
      const legacyStyles=state.custom.textStyles||{};
      FIELDS.forEach(([key])=>migratedFront.textStyles[key]={...DEFAULT_STYLE,...(legacyStyles[key]||{})});
      state.custom.faceEdits={front:migratedFront,back:blankFace()};
    }
    ['front','back'].forEach(side=>{
      state.custom.faceEdits[side]={...blankFace(),...(state.custom.faceEdits[side]||{})};
      state.custom.faceEdits[side].textStyles={...blankStyles(),...(state.custom.faceEdits[side].textStyles||{})};
      FIELDS.forEach(([key])=>state.custom.faceEdits[side].textStyles[key]={...DEFAULT_STYLE,...(state.custom.faceEdits[side].textStyles[key]||{})});
    });

    const faceFor=side=>state.custom.faceEdits[side==='back'?'back':'front'];

    if(!window.__CARDCRAFT_EDITOR_V12_PATCHED__){
      window.__CARDCRAFT_EDITOR_V12_PATCHED__=true;
      const baseLogoSvg=logoSvg;
      const baseRenderCard=renderCard;
      let activeRenderSide='front';

      // Any legacy editor wrapper still sees zero global offsets; V12 owns face-specific offsets.
      logoSvg=function(x,y,size,color,bg,anchor='center'){
        const face=faceFor(activeRenderSide);
        const dx=Number(face.logoPosX)||0;
        const dy=Number(face.logoPosY)||0;
        const scale=Math.max(.35,Math.min(9,Number(face.logoScale)||1.5));
        const maxW=anchor==='hero'?860:760,maxH=anchor==='hero'?500:400;
        const renderW=Math.min(maxW,size*scale*1.45),renderH=Math.min(maxH,size*scale);
        const offsetX=(size-renderW)/2,offsetY=(size-renderH)/2;
        const desiredX=x+dx+offsetX,desiredY=y+dy+offsetY;
        const safeRenderX=Math.max(0,Math.min(960-renderW,desiredX));
        const safeRenderY=Math.max(0,Math.min(560-renderH,desiredY));
        const safeX=safeRenderX-offsetX,safeY=safeRenderY-offsetY;
        const oldX=state.custom.logoPosX,oldY=state.custom.logoPosY,oldScale=state.custom.logoScale;
        state.custom.logoPosX=0;state.custom.logoPosY=0;state.custom.logoScale=scale;
        try{return `<svg x="0" y="0" width="960" height="560" viewBox="0 0 960 560" overflow="hidden">${baseLogoSvg(safeX,safeY,size,color,bg,anchor)}</svg>`;}
        finally{state.custom.logoPosX=oldX;state.custom.logoPosY=oldY;state.custom.logoScale=oldScale;}
      };

      const rxEscape=s=>String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
      const addAttr=(attrs,name,value)=>{
        const re=new RegExp(`\\s${name}=("[^"]*"|'[^']*')`,'i');
        const pair=` ${name}="${String(value).replace(/"/g,'&quot;')}"`;
        return re.test(attrs)?attrs.replace(re,pair):attrs+pair;
      };
      const styleText=(svg,key,styles)=>{
        const raw=state.data&&state.data[key],s=styles&&styles[key];
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
        activeRenderSide=side==='back'?'back':'front';
        const face=faceFor(activeRenderSide);
        const oldScale=state.custom.logoScale,oldX=state.custom.logoPosX,oldY=state.custom.logoPosY;
        state.custom.logoScale=face.logoScale;state.custom.logoPosX=0;state.custom.logoPosY=0;
        let svg;
        try{svg=baseRenderCard(template,side,mini);}finally{state.custom.logoScale=oldScale;state.custom.logoPosX=oldX;state.custom.logoPosY=oldY;}
        FIELDS.forEach(([key])=>{svg=styleText(svg,key,face.textStyles);});
        return svg;
      };
    }

    const fontsHtml=`<option value="">템플릿 기본</option>${FONTS.map(f=>`<option value="${f}">${f}</option>`).join('')}`;
    const rows=FIELDS.map(([key,label])=>`<div class="cc12-text-row" data-text-row="${key}"><strong>${label}</strong><select data-style-font="${key}" aria-label="${label} 폰트">${fontsHtml}</select><div class="cc12-format-buttons"><button type="button" data-style-toggle="bold" data-style-key="${key}" title="굵게"><b>B</b></button><button type="button" data-style-toggle="italic" data-style-key="${key}" title="기울임"><i>I</i></button><button type="button" data-style-toggle="underline" data-style-key="${key}" title="밑줄"><u>U</u></button></div><label class="cc12-color"><input type="color" data-style-color="${key}" aria-label="${label} 색상"><span>색상</span></label><button type="button" class="cc12-row-reset" data-style-reset="${key}" title="이 항목 초기화">↺</button></div>`).join('');

    const panel=document.createElement('section');
    panel.id='cardcraftFinalEditorV12';panel.className='cc12-editor';
    panel.innerHTML=`<div class="cc12-head"><div><span class="section-label">04 · FINAL EDIT</span><h3>최종 편집</h3><p><strong id="cc12SideLabel">앞면</strong>을 편집 중입니다. 앞면과 뒷면 설정은 서로 독립적으로 저장됩니다.</p></div><button type="button" id="cc12ResetAll">현재 면 편집 초기화</button></div><div class="cc12-face-tabs"><button type="button" data-edit-side="front">앞면 편집</button><button type="button" data-edit-side="back">뒷면 편집</button></div><div class="cc12-block"><div class="cc12-block-title"><strong>텍스트 편집</strong><span>현재 면의 각 항목을 독립 설정</span></div><div class="cc12-text-list">${rows}</div></div><div class="cc12-block"><div class="cc12-block-title"><strong>로고 편집</strong><span>현재 면 전용 · 명함 경계 안에서만 이동·확대</span></div><div class="cc12-logo-grid"><label><span>좌우 <b id="cc12LogoXValue">0</b></span><input id="cc12LogoX" type="range" min="-300" max="300" step="5"></label><label><span>상하 <b id="cc12LogoYValue">0</b></span><input id="cc12LogoY" type="range" min="-220" max="220" step="5"></label><label><span>크기 <b id="cc12LogoScaleValue">150%</b></span><input id="cc12LogoScale" type="range" min="0.35" max="9" step="0.05"></label></div></div>`;

    const style=document.createElement('style');style.textContent=`.cc12-editor{margin-top:14px;padding:17px;border:1px solid #d0d5dd;border-radius:12px;background:#fff}.cc12-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.cc12-head h3{margin:4px 0 2px;font-size:15px}.cc12-head p{margin:0;color:#98a2b3;font-size:10px}.cc12-head>button{height:31px;border:1px solid #d0d5dd;border-radius:7px;background:#fff;padding:0 10px;font-size:9px;font-weight:700;color:#667085}.cc12-face-tabs{display:flex;gap:6px;margin:13px 0}.cc12-face-tabs button{flex:1;height:34px;border:1px solid #d0d5dd;border-radius:8px;background:#f9fafb;font-size:10px;font-weight:800;color:#667085}.cc12-face-tabs button.active{background:#101828;color:#fff;border-color:#101828}.cc12-block{border-top:1px solid #eaecf0;padding-top:13px;margin-top:13px}.cc12-block-title{display:flex;gap:8px;align-items:baseline;margin-bottom:9px}.cc12-block-title strong{font-size:11px}.cc12-block-title span{font-size:9px;color:#98a2b3}.cc12-text-list{display:flex;flex-direction:column;gap:6px}.cc12-text-row{display:grid;grid-template-columns:70px minmax(150px,1.5fr) auto 84px 30px;gap:7px;align-items:center;padding:7px 8px;border:1px solid #eaecf0;border-radius:8px;background:#f9fafb}.cc12-text-row>strong{font-size:9px}.cc12-text-row select{height:30px;border:1px solid #d0d5dd;border-radius:7px;background:#fff;padding:0 7px;font-size:10px}.cc12-format-buttons{display:flex;gap:3px}.cc12-format-buttons button,.cc12-row-reset{width:30px;height:30px;border:1px solid #d0d5dd;border-radius:6px;background:#fff;color:#667085}.cc12-format-buttons button.active{background:#101828;color:#fff}.cc12-color{height:30px;display:flex;align-items:center;gap:5px;padding:3px 6px;border:1px solid #d0d5dd;border-radius:7px;background:#fff}.cc12-color input{width:22px;height:22px;border:0;padding:0}.cc12-color span{font-size:9px;color:#667085}.cc12-logo-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.cc12-logo-grid label{border:1px solid #eaecf0;border-radius:8px;padding:9px;background:#f9fafb}.cc12-logo-grid label>span{display:flex;justify-content:space-between;margin-bottom:7px;font-size:9px;font-weight:700}.cc12-logo-grid input[type=range]{width:100%}@media(max-width:650px){.cc12-head{display:block}.cc12-head>button{margin-top:9px}.cc12-text-row{grid-template-columns:1fr 1fr}.cc12-text-row>strong{grid-column:1/-1}.cc12-logo-grid{grid-template-columns:1fr}}`;
    document.head.appendChild(style);
    document.querySelector('.main-stage')?.appendChild(panel);

    const currentSide=()=>state.side==='back'?'back':'front';
    const currentFace=()=>faceFor(currentSide());
    const refresh=()=>{persist();renderDynamic();renderVariants();};
    const sync=()=>{
      const side=currentSide(),face=currentFace();
      document.getElementById('cc12SideLabel').textContent=side==='back'?'뒷면':'앞면';
      panel.querySelectorAll('[data-edit-side]').forEach(b=>b.classList.toggle('active',b.dataset.editSide===side));
      FIELDS.forEach(([key])=>{const s=face.textStyles[key];const select=panel.querySelector(`[data-style-font="${key}"]`);if(select)select.value=s.font||'';const color=panel.querySelector(`[data-style-color="${key}"]`);if(color)color.value=s.color||'#111827';panel.querySelectorAll(`[data-style-key="${key}"]`).forEach(btn=>btn.classList.toggle('active',!!s[btn.dataset.styleToggle]));});
      const x=document.getElementById('cc12LogoX'),y=document.getElementById('cc12LogoY'),z=document.getElementById('cc12LogoScale');x.value=face.logoPosX;y.value=face.logoPosY;z.value=face.logoScale;document.getElementById('cc12LogoXValue').textContent=x.value;document.getElementById('cc12LogoYValue').textContent=y.value;document.getElementById('cc12LogoScaleValue').textContent=`${Math.round(Number(z.value)*100)}%`;
    };

    panel.addEventListener('click',e=>{
      const sideBtn=e.target.closest('[data-edit-side]');if(sideBtn){state.side=sideBtn.dataset.editSide;persist();renderDynamic();sync();return;}
      const toggle=e.target.closest('[data-style-toggle]');if(toggle){const f=currentFace(),key=toggle.dataset.styleKey,prop=toggle.dataset.styleToggle;f.textStyles[key][prop]=!f.textStyles[key][prop];sync();refresh();return;}
      const reset=e.target.closest('[data-style-reset]');if(reset){currentFace().textStyles[reset.dataset.styleReset]={...DEFAULT_STYLE};sync();refresh();}
    });
    panel.addEventListener('change',e=>{const f=currentFace(),fontKey=e.target.dataset.styleFont,colorKey=e.target.dataset.styleColor;if(fontKey){f.textStyles[fontKey].font=e.target.value;refresh();}if(colorKey){f.textStyles[colorKey].color=e.target.value;refresh();}});
    panel.addEventListener('input',e=>{const f=currentFace(),colorKey=e.target.dataset.styleColor;if(colorKey){f.textStyles[colorKey].color=e.target.value;refresh();}});
    const xEl=document.getElementById('cc12LogoX'),yEl=document.getElementById('cc12LogoY'),scaleEl=document.getElementById('cc12LogoScale');
    xEl.addEventListener('input',()=>{currentFace().logoPosX=Number(xEl.value);document.getElementById('cc12LogoXValue').textContent=xEl.value;refresh();});
    yEl.addEventListener('input',()=>{currentFace().logoPosY=Number(yEl.value);document.getElementById('cc12LogoYValue').textContent=yEl.value;refresh();});
    scaleEl.addEventListener('input',()=>{currentFace().logoScale=Number(scaleEl.value);document.getElementById('cc12LogoScaleValue').textContent=`${Math.round(Number(scaleEl.value)*100)}%`;refresh();});
    document.getElementById('cc12ResetAll').addEventListener('click',()=>{state.custom.faceEdits[currentSide()]=blankFace();sync();refresh();if(typeof showToast==='function')showToast(`${currentSide()==='back'?'뒷면':'앞면'} 편집값을 초기화했습니다.`);});

    // Keep the editor synchronized when the existing preview front/back buttons are used.
    document.querySelectorAll('[data-side]').forEach(btn=>btn.addEventListener('click',()=>setTimeout(sync,0)));
    sync();refresh();
    console.info('Cardcraft Final Editor V12 dual-face mode active');
  };
  boot();
})();
