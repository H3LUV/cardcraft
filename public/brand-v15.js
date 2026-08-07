(function cardcraftH3WorksBrand(){
  'use strict';

  const PLANE_SVG = `<svg viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M5 29.5 66 6 43 66 33.5 39.5 5 29.5Z" fill="#FFB514"/><path d="M5 29.5 66 6 26.5 35.7 5 29.5Z" fill="#FFD35A"/><path d="M33.5 39.5 66 6 27 49.5 17 62 31 53.5 33.5 39.5Z" fill="#F59E0B"/><path d="M33.5 39.5 66 6 39.2 44.2 33.5 39.5Z" fill="#FFF4C2"/></svg>`;
  const PLANE_DATA_URL = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(PLANE_SVG)}`;

  const LEGACY_SAMPLE = {
    company: 'NORTH & CO.',
    name: ['김남우','홍길동'],
    email: 'namu@northandco.kr',
    website: 'northandco.kr'
  };

  const H3_SAMPLE = {
    company: 'H3 WORKS',
    name: '홍길동',
    title: 'CREATIVE DIRECTOR',
    phone: '010 1234 5678',
    email: 'hello@h3works.co.kr',
    address: '서울특별시 중구 세종대로 110',
    website: 'h3works.co.kr',
    slogan: 'Make. Play. Explore.',
    industry: '디자인 · 콘텐츠 · 테크'
  };

  function installBrandStyles(){
    if(document.getElementById('cardcraft-h3works-brand-style')) return;
    const style=document.createElement('style');
    style.id='cardcraft-h3works-brand-style';
    style.textContent=`
      .brand-lockup.cc-h3-brand{display:flex;align-items:center;gap:11px;min-width:max-content}
      .cc-h3-mark{width:48px;height:48px;display:grid;place-items:center;flex:0 0 auto}
      .cc-h3-mark svg{width:100%;height:100%;display:block}
      .cc-h3-copy{display:flex;align-items:center;gap:14px}
      .cc-h3-product{display:flex;flex-direction:column;line-height:1}
      .cc-h3-product strong{font-size:24px;letter-spacing:-.7px;color:#101828;font-weight:850}
      .cc-h3-product span{margin-top:5px;font-size:8.5px;letter-spacing:2px;color:#667085;font-weight:800}
      .cc-h3-by{padding-left:14px;border-left:1px solid #d0d5dd;font-size:10px;color:#667085;white-space:nowrap}
      .cc-h3-by strong{font-size:10px;color:#475467;font-weight:800;letter-spacing:.2px}
      @media(max-width:720px){
        .cc-h3-mark{width:39px;height:39px}.cc-h3-product strong{font-size:19px}.cc-h3-product span{font-size:7px;letter-spacing:1.4px}.cc-h3-copy{gap:9px}.cc-h3-by{padding-left:9px;font-size:8px}.cc-h3-by strong{font-size:8px}
      }
      @media(max-width:520px){.cc-h3-by{display:none}}
    `;
    document.head.appendChild(style);
  }

  function renderHeaderBrand(){
    installBrandStyles();
    const lockup=document.querySelector('.brand-lockup');
    if(!lockup) return;
    lockup.classList.add('cc-h3-brand');
    lockup.innerHTML=`<div class="cc-h3-mark">${PLANE_SVG}</div><div class="cc-h3-copy"><div class="cc-h3-product"><strong>Cardcraft</strong><span>BUSINESS CARD STUDIO</span></div><div class="cc-h3-by">by <strong>H3 WORKS</strong></div></div>`;
  }

  function isLegacySample(d){
    if(!d) return false;
    return d.company===LEGACY_SAMPLE.company || (LEGACY_SAMPLE.name.includes(d.name) && d.email===LEGACY_SAMPLE.email && d.website===LEGACY_SAMPLE.website);
  }

  function applySampleBrand(forceLegacyOnly=true){
    if(typeof state==='undefined' || !state.data){ setTimeout(()=>applySampleBrand(forceLegacyOnly),100); return; }
    const d=state.data;
    if(forceLegacyOnly && !isLegacySample(d)) return;

    Object.assign(d,H3_SAMPLE);
    if(!d.logoDataUrl || isLegacySample(d)){
      d.logoDataUrl=PLANE_DATA_URL;
      d.logoFileName='h3works-plane.svg';
    }
    // If this is the built-in sample, use the H3 WORKS mark as its default logo.
    if(forceLegacyOnly || !d.logoDataUrl){
      d.logoDataUrl=PLANE_DATA_URL;
      d.logoFileName='h3works-plane.svg';
    }
    if(typeof persist==='function') persist();
    if(typeof renderAll==='function') renderAll();
  }

  function updateFooter(){
    const footer=document.querySelector('footer');
    if(!footer) return;
    const first=footer.querySelector('span');
    if(first) first.textContent='CARDCRAFT · BY H3 WORKS · AI DESIGN COPILOT';
  }

  function boot(){
    renderHeaderBrand();
    updateFooter();
    applySampleBrand(true);

    const reset=document.getElementById('resetBtn');
    if(reset && !reset.dataset.h3BrandReset){
      reset.dataset.h3BrandReset='true';
      reset.addEventListener('click',()=>setTimeout(()=>applySampleBrand(true),0));
    }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
