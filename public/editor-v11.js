(function cardcraftEditorV11(){
  'use strict';

  const boot=()=>{
    if(document.getElementById('cardcraftFinalEditorV11')) return;
    if(typeof state==='undefined'||typeof renderDynamic!=='function'||typeof renderVariants!=='function'||typeof persist!=='function'||typeof logoSvg!=='function'||typeof categoryFont!=='function'){
      setTimeout(boot,120);return;
    }

    state.custom.logoPosX=Number(state.custom.logoPosX)||0;
    state.custom.logoPosY=Number(state.custom.logoPosY)||0;
    state.custom.masterFont=state.custom.masterFont||'';

    if(!window.__CARDCRAFT_EDITOR_V11_PATCHED__){
      window.__CARDCRAFT_EDITOR_V11_PATCHED__=true;
      const baseLogoSvg=logoSvg;
      logoSvg=function(x,y,size,color,bg,anchor='center'){
        return baseLogoSvg(
          x+(Number(state.custom.logoPosX)||0),
          y+(Number(state.custom.logoPosY)||0),
          size,color,bg,anchor
        );
      };
      const baseCategoryFont=categoryFont;
      categoryFont=function(template){
        const chosen=state.custom.masterFont;
        return chosen?`'${chosen}', 'Noto Sans KR', 'Malgun Gothic', Arial, sans-serif`:baseCategoryFont(template);
      };
    }

    const fonts=['Noto Sans KR','Noto Serif KR','IBM Plex Sans KR','Nanum Gothic','Nanum Myeongjo','Gowun Dodum','Gowun Batang','Hahmlet','Montserrat','Poppins','Raleway','Oswald','Space Grotesk','Playfair Display','Cormorant Garamond','Cinzel','Bodoni Moda','DM Serif Display'];
    const panel=document.createElement('section');
    panel.id='cardcraftFinalEditorV11';
    panel.className='cc-final-editor';
    panel.innerHTML=`
      <div class="cc-final-head">
        <div><span class="section-label">04 · FINAL EDIT</span><h3>최종 편집</h3><p>선택한 시안의 로고 위치와 서체를 직접 조정합니다.</p></div>
        <button type="button" id="ccFinalReset">편집값 초기화</button>
      </div>
      <div class="cc-final-grid">
        <label class="cc-font-control"><span>전체 폰트</span><select id="ccMasterFont"><option value="">템플릿 기본 폰트</option>${fonts.map(f=>`<option value="${f}">${f}</option>`).join('')}</select></label>
        <label><span>로고 좌우 <b id="ccLogoXValue">0</b></span><input id="ccLogoX" type="range" min="-300" max="300" step="5"></label>
        <label><span>로고 상하 <b id="ccLogoYValue">0</b></span><input id="ccLogoY" type="range" min="-220" max="220" step="5"></label>
        <label><span>로고 크기 <b id="ccLogoScaleValue">150%</b></span><input id="ccLogoScale" type="range" min="0.35" max="9" step="0.05"></label>
      </div>`;

    const style=document.createElement('style');
    style.textContent=`
      .cc-final-editor{margin-top:14px;padding:16px;border:1px solid #d0d5dd;border-radius:12px;background:#fff;box-shadow:0 1px 2px rgba(16,24,40,.04)}
      .cc-final-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:13px}.cc-final-head h3{margin:4px 0 2px;font-size:15px}.cc-final-head p{margin:0;color:#98a2b3;font-size:10px}.cc-final-head button{height:30px;border:1px solid #d0d5dd;border-radius:7px;background:#fff;padding:0 10px;font-size:9px;font-weight:700;color:#667085}
      .cc-final-grid{display:grid;grid-template-columns:1.25fr 1fr 1fr 1fr;gap:9px}.cc-final-grid label{display:block;border:1px solid #eaecf0;border-radius:9px;background:#f9fafb;padding:10px;min-width:0}.cc-final-grid label>span{display:flex;justify-content:space-between;gap:8px;margin-bottom:7px;font-size:9px;font-weight:700;color:#475467}.cc-final-grid b{font-weight:800;color:#101828}.cc-final-grid select{width:100%;height:31px;border:1px solid #d0d5dd;border-radius:7px;background:#fff;padding:0 7px;font-size:10px;color:#344054}.cc-final-grid input[type=range]{width:100%;accent-color:#111827}
      @media(max-width:900px){.cc-final-grid{grid-template-columns:1fr 1fr}}@media(max-width:560px){.cc-final-head{display:block}.cc-final-head button{margin-top:10px}.cc-final-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);

    const stage=document.querySelector('.main-stage');
    const variants=document.querySelector('.variants-section');
    if(stage) stage.appendChild(panel); else if(variants) variants.insertAdjacentElement('beforebegin',panel); else document.querySelector('main')?.appendChild(panel);

    const fontEl=document.getElementById('ccMasterFont');
    const xEl=document.getElementById('ccLogoX');
    const yEl=document.getElementById('ccLogoY');
    const scaleEl=document.getElementById('ccLogoScale');
    const xVal=document.getElementById('ccLogoXValue');
    const yVal=document.getElementById('ccLogoYValue');
    const scaleVal=document.getElementById('ccLogoScaleValue');

    const sync=()=>{
      fontEl.value=state.custom.masterFont||'';
      xEl.value=String(Number(state.custom.logoPosX)||0);
      yEl.value=String(Number(state.custom.logoPosY)||0);
      scaleEl.value=String(Number(state.custom.logoScale)||1.5);
      xVal.textContent=xEl.value;yVal.textContent=yEl.value;scaleVal.textContent=`${Math.round(Number(scaleEl.value)*100)}%`;
    };
    const refresh=()=>{persist();renderDynamic();renderVariants();};

    fontEl.addEventListener('change',()=>{state.custom.masterFont=fontEl.value;refresh();});
    xEl.addEventListener('input',()=>{state.custom.logoPosX=Number(xEl.value);xVal.textContent=xEl.value;refresh();});
    yEl.addEventListener('input',()=>{state.custom.logoPosY=Number(yEl.value);yVal.textContent=yEl.value;refresh();});
    scaleEl.addEventListener('input',()=>{state.custom.logoScale=Number(scaleEl.value);scaleVal.textContent=`${Math.round(Number(scaleEl.value)*100)}%`;const old=document.getElementById('logoScale');if(old){old.value=scaleEl.value;const out=document.getElementById('logoScaleValue');if(out)out.textContent=scaleVal.textContent;}refresh();});
    document.getElementById('ccFinalReset').addEventListener('click',()=>{state.custom.masterFont='';state.custom.logoPosX=0;state.custom.logoPosY=0;state.custom.logoScale=1.5;sync();refresh();if(typeof showToast==='function')showToast('최종 편집값을 초기화했습니다.');});
    sync();refresh();
    console.info('Cardcraft Final Editor V11 active');
  };
  boot();
})();
