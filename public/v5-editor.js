(function restoreCardcraftDetailEditor(){
  'use strict';

  const FONT_OPTIONS=[
    ['Noto Sans KR','Noto Sans KR'],['Noto Serif KR','Noto Serif KR'],['IBM Plex Sans KR','IBM Plex Sans KR'],
    ['Nanum Gothic','Nanum Gothic'],['Nanum Myeongjo','Nanum Myeongjo'],['Gowun Dodum','Gowun Dodum'],['Gowun Batang','Gowun Batang'],
    ['Hahmlet','Hahmlet'],['Montserrat','Montserrat'],['Poppins','Poppins'],['Raleway','Raleway'],['Oswald','Oswald'],
    ['Space Grotesk','Space Grotesk'],['Playfair Display','Playfair Display'],['Cormorant Garamond','Cormorant Garamond'],['Cinzel','Cinzel']
  ];

  if(typeof state==='undefined' || typeof renderDynamic!=='function') return;

  state.custom.logoPosX=Number(state.custom.logoPosX)||0;
  state.custom.logoPosY=Number(state.custom.logoPosY)||0;
  state.custom.masterFont=state.custom.masterFont||'';

  const originalLogoSvg=logoSvg;
  logoSvg=function(x,y,size,color,bg,anchor='center'){
    const dx=Number(state.custom.logoPosX)||0;
    const dy=Number(state.custom.logoPosY)||0;
    return originalLogoSvg(x+dx,y+dy,size,color,bg,anchor);
  };

  const originalCategoryFont=categoryFont;
  categoryFont=function(template){
    if(state.custom.masterFont){
      const f=state.custom.masterFont;
      return `'${f}', 'Noto Sans KR', 'Malgun Gothic', Arial, sans-serif`;
    }
    return originalCategoryFont(template);
  };

  const host=document.querySelector('.quick-customizer');
  if(!host) return;

  const fontOptions=FONT_OPTIONS.map(([value,label])=>`<option value="${value}">${label}</option>`).join('');
  const panel=document.createElement('section');
  panel.className='v5-detail-controls';
  panel.innerHTML=`
    <div class="v5-detail-head">
      <div><span class="section-label">DETAIL EDIT</span><strong>세부 편집</strong></div>
      <button type="button" class="v5-reset-detail">편집값 초기화</button>
    </div>
    <div class="v5-detail-grid">
      <label><span>전체 폰트</span><select id="v5MasterFont"><option value="">템플릿 기본 폰트</option>${fontOptions}</select></label>
      <label><span>로고 가로 위치 <b id="v5LogoXValue">0</b></span><input id="v5LogoX" type="range" min="-260" max="260" step="5"></label>
      <label><span>로고 세로 위치 <b id="v5LogoYValue">0</b></span><input id="v5LogoY" type="range" min="-180" max="180" step="5"></label>
    </div>`;

  const style=document.createElement('style');
  style.textContent=`
    .v5-detail-controls{margin-top:12px;border:1px solid #e4e7ec;border-radius:11px;padding:13px;background:#fff}
    .v5-detail-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
    .v5-detail-head strong{display:block;margin-top:3px;font-size:12px;color:#101828}
    .v5-reset-detail{border:1px solid #d0d5dd;background:#fff;border-radius:7px;height:28px;padding:0 9px;font-size:9px;font-weight:700;color:#667085}
    .v5-detail-grid{display:grid;grid-template-columns:1.15fr 1fr 1fr;gap:9px}
    .v5-detail-grid label{border:1px solid #eaecf0;border-radius:8px;padding:9px;background:#f9fafb;min-width:0}
    .v5-detail-grid label>span{display:flex;justify-content:space-between;margin-bottom:7px;font-size:9px;font-weight:700;color:#475467}
    .v5-detail-grid label b{font-weight:800;color:#101828}
    .v5-detail-grid select{width:100%;height:30px;border:1px solid #d0d5dd;border-radius:7px;background:#fff;padding:0 7px;font-size:10px;color:#344054}
    .v5-detail-grid input[type=range]{width:100%;accent-color:#111827}
    @media(max-width:820px){.v5-detail-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);
  host.insertAdjacentElement('afterend',panel);

  const fontEl=document.getElementById('v5MasterFont');
  const xEl=document.getElementById('v5LogoX');
  const yEl=document.getElementById('v5LogoY');
  const xVal=document.getElementById('v5LogoXValue');
  const yVal=document.getElementById('v5LogoYValue');

  function sync(){
    fontEl.value=state.custom.masterFont||'';
    xEl.value=String(Number(state.custom.logoPosX)||0);
    yEl.value=String(Number(state.custom.logoPosY)||0);
    xVal.textContent=String(Number(state.custom.logoPosX)||0);
    yVal.textContent=String(Number(state.custom.logoPosY)||0);
  }
  function refresh(){
    persist();
    renderDynamic();
    if(typeof renderVariants==='function') renderVariants();
  }

  fontEl.addEventListener('change',()=>{state.custom.masterFont=fontEl.value;refresh();});
  xEl.addEventListener('input',()=>{state.custom.logoPosX=Number(xEl.value);xVal.textContent=xEl.value;refresh();});
  yEl.addEventListener('input',()=>{state.custom.logoPosY=Number(yEl.value);yVal.textContent=yEl.value;refresh();});
  panel.querySelector('.v5-reset-detail').addEventListener('click',()=>{
    state.custom.masterFont='';state.custom.logoPosX=0;state.custom.logoPosY=0;sync();refresh();
    if(typeof showToast==='function') showToast('로고 위치와 폰트 편집값을 초기화했습니다.');
  });

  sync();
  renderDynamic();
  if(typeof renderVariants==='function') renderVariants();
  console.info('Cardcraft detail editor restored');
})();