(function cardcraftV124StyleParity(){
  'use strict';

  const FACE_CATEGORIES=['minimal','classic','modern','creative','casual'];
  let syncing=false;

  function boot(){
    if(typeof state==='undefined'||typeof STYLE_META==='undefined'||typeof LIBRARY==='undefined'||LIBRARY.length<1000||!document.getElementById('styleList')){
      setTimeout(boot,120);return;
    }
    if(window.__CARDCRAFT_V124_STYLE_PARITY__)return;
    window.__CARDCRAFT_V124_STYLE_PARITY__=true;

    const total=LIBRARY.length;
    const counts=Object.fromEntries(FACE_CATEGORIES.map(key=>[key,LIBRARY.filter(t=>t.category===key).length]));

    if(STYLE_META.all){
      STYLE_META.all.description=`${total.toLocaleString('ko-KR')}개 디자인에서 업종 맞춤 추천`;
      STYLE_META.all.eyebrow='SMART MIX';
      STYLE_META.all.name='전체 추천';
    }
    FACE_CATEGORIES.forEach(key=>{
      if(STYLE_META[key])STYLE_META[key].description=`${(counts[key]||0).toLocaleString('ko-KR')}개 디자인`;
    });

    const originalAll={
      name:STYLE_META.all?.name||'전체 추천',
      eyebrow:STYLE_META.all?.eyebrow||'SMART MIX',
      description:STYLE_META.all?.description||`${total.toLocaleString('ko-KR')}개 디자인에서 업종 맞춤 추천`
    };

    function setText(el,value){if(el&&el.textContent!==value)el.textContent=value;}

    function ensureCountBadge(card,key){
      if(!card)return;
      let badge=card.querySelector('.cc-v124-style-count');
      if(!badge){badge=document.createElement('span');badge.className='cc-v124-style-count';card.appendChild(badge);}
      const count=key==='all'?total:(counts[key]||0);
      setText(badge,count.toLocaleString('ko-KR'));
    }

    function syncStyleCards(){
      const back=state.side==='back';
      document.querySelectorAll('.style-card[data-style]').forEach(card=>{
        const key=card.dataset.style;
        const eyebrow=card.querySelector('.style-copy small');
        const title=card.querySelector('.style-copy strong');
        const desc=card.querySelector('.style-copy em');
        ensureCountBadge(card,key);
        if(key==='all'){
          if(back){
            setText(eyebrow,'MATCH FRONT');
            setText(title,'앞면과 동일');
            setText(desc,`기본 연동 · 앞면에서 고른 디자인을 그대로 사용`);
          }else{
            setText(eyebrow,originalAll.eyebrow);
            setText(title,originalAll.name);
            setText(desc,originalAll.description);
          }
        }else if(STYLE_META[key]){
          setText(desc,`${(counts[key]||0).toLocaleString('ko-KR')}개 디자인`);
        }
      });
    }

    function syncStyleUi(){
      if(syncing)return;
      syncing=true;
      requestAnimationFrame(()=>{
        try{
          const back=state.side==='back';
          document.documentElement.classList.toggle('cc-v124-back-style',back);
          document.getElementById('cc13BackStylePanel')?.classList.add('cc-v124-parity-hidden');

          setText(document.querySelector('.styles-panel .panel-heading h2'),back?'뒷면 스타일 선택':'앞면 스타일 선택');
          setText(document.querySelector('.styles-panel .panel-heading .section-label'),back?'02 · BACK STYLE':'02 · FRONT STYLE');
          setText(document.getElementById('libraryBtn'),`▦ ${back?'뒷면':'앞면'} 전체 ${total.toLocaleString('ko-KR')}개 보기`);
          setText(document.getElementById('regenerateBtn'),back?'▶ 광고 보고 다른 뒷면 시안 보기':'▶ 광고 보고 다른 앞면 시안 보기');
          setText(document.getElementById('variantHeading'),`${back?'뒷면':'앞면'} ${total.toLocaleString('ko-KR')}개 디자인 중 추천 시안 5개`);
          setText(document.querySelector('.variants-heading p'),back
            ?`기본은 앞면과 같은 디자인입니다. 원하면 앞면과 동일한 ${total.toLocaleString('ko-KR')}개 디자인 풀에서 뒷면만 별도로 선택할 수 있습니다.`
            :`동일한 ${total.toLocaleString('ko-KR')}개 디자인 풀에서 업종과 브랜드에 맞는 앞면 시안을 추천합니다. 다른 추천 5개를 볼 때 보상형 광고 1회를 시청합니다.`);
          setText(document.querySelector('#templateModal .section-label'),'1,000 TEMPLATE LIBRARY');

          const modalTitle=document.getElementById('templateModalTitle');
          if(modalTitle&&document.getElementById('templateModal')?.hidden===false)setText(modalTitle,back?'뒷면 전체 디자인':'앞면 전체 디자인');
          const modalP=modalTitle?.parentElement?.querySelector('p');
          if(modalP&&document.getElementById('templateModal')?.hidden===false)setText(modalP,back
            ?`앞면과 동일한 ${total.toLocaleString('ko-KR')}개 디자인 풀에서 뒷면에만 적용할 시안을 선택합니다.`
            :`${total.toLocaleString('ko-KR')}개 디자인 풀에서 앞면 시안을 선택합니다.`);

          syncStyleCards();
        }finally{syncing=false;}
      });
    }

    if(typeof renderStyles==='function'&&!renderStyles.__ccV124Patched){
      const baseRenderStyles=renderStyles;
      const wrapped=function(){baseRenderStyles();syncStyleUi();};
      wrapped.__ccV124Patched=true;
      renderStyles=wrapped;
      window.renderStyles=wrapped;
    }

    document.querySelectorAll('[data-side]').forEach(btn=>btn.addEventListener('click',()=>setTimeout(syncStyleUi,0)));
    document.getElementById('libraryBtn')?.addEventListener('click',()=>setTimeout(syncStyleUi,0),true);
    document.getElementById('regenerateBtn')?.addEventListener('click',()=>setTimeout(syncStyleUi,0),true);

    const styleList=document.getElementById('styleList');
    if(styleList)new MutationObserver(syncStyleUi).observe(styleList,{childList:true});
    const modal=document.getElementById('templateModal');
    if(modal)new MutationObserver(syncStyleUi).observe(modal,{attributes:true,attributeFilter:['hidden']});

    syncStyleUi();
    console.info('Cardcraft V12.4 front/back style parity active',{total,counts});
  }

  boot();
})();
