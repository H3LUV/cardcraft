(function cardcraftV124StyleParity(){
  'use strict';

  function boot(){
    if(typeof state==='undefined'||typeof STYLE_META==='undefined'||!document.getElementById('styleList')){
      setTimeout(boot,100);return;
    }
    if(window.__CARDCRAFT_V124_STYLE_PARITY__)return;
    window.__CARDCRAFT_V124_STYLE_PARITY__=true;

    if(STYLE_META.all){
      STYLE_META.all.description='1,000개 디자인에서 업종 맞춤 추천';
      STYLE_META.all.eyebrow='SMART MIX';
      STYLE_META.all.name='전체 추천';
    }

    const originalAll={
      name:STYLE_META.all?.name||'전체 추천',
      eyebrow:STYLE_META.all?.eyebrow||'SMART MIX',
      description:STYLE_META.all?.description||'1,000개 디자인에서 업종 맞춤 추천'
    };

    function replaceLegacyCounts(root=document){
      const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
      const nodes=[];
      while(walker.nextNode())nodes.push(walker.currentNode);
      nodes.forEach(node=>{
        const before=node.nodeValue||'';
        const after=before
          .replace(/100개\s*라이브러리/g,'1,000개 라이브러리')
          .replace(/100개\s*디자인/g,'1,000개 디자인')
          .replace(/전체\s*100개\s*보기/g,'전체 1,000개 보기');
        if(after!==before)node.nodeValue=after;
      });
    }

    function syncAllStyleCard(){
      const back=state.side==='back';
      const card=document.querySelector('.style-card[data-style="all"]');
      if(!card)return;
      const eyebrow=card.querySelector('.style-copy small');
      const title=card.querySelector('.style-copy strong');
      const desc=card.querySelector('.style-copy em');
      if(back){
        if(eyebrow)eyebrow.textContent='MATCH FRONT';
        if(title)title.textContent='앞면과 동일';
        if(desc)desc.textContent='앞면에서 선택한 스타일과 자동으로 맞춥니다';
      }else{
        if(eyebrow)eyebrow.textContent=originalAll.eyebrow;
        if(title)title.textContent=originalAll.name;
        if(desc)desc.textContent=originalAll.description;
      }
    }

    function syncStyleUi(){
      const back=state.side==='back';
      document.documentElement.classList.toggle('cc-v124-back-style',back);

      const heading=document.querySelector('.styles-panel .panel-heading h2');
      if(heading)heading.textContent=back?'뒷면 스타일 선택':'앞면 스타일 선택';

      const label=document.querySelector('.styles-panel .panel-heading .section-label');
      if(label)label.textContent=back?'02 · BACK STYLE':'02 · FRONT STYLE';

      const lib=document.getElementById('libraryBtn');
      if(lib)lib.textContent=`▦ ${back?'뒷면':'앞면'} 전체 1,000개 보기`;

      const regen=document.getElementById('regenerateBtn');
      if(regen)regen.textContent=back?'↻ 뒷면 다시 추천':'↻ 앞면 다시 추천';

      const variantHeading=document.getElementById('variantHeading');
      if(variantHeading)variantHeading.textContent=back?'뒷면 1,000개 디자인 중 추천 시안 5개':'앞면 1,000개 디자인 중 추천 시안 5개';

      const variantP=document.querySelector('.variants-heading p');
      if(variantP)variantP.textContent=back
        ?'기본은 앞면 스타일과 자동으로 맞추며, 원하면 동일한 1,000개 디자인 풀에서 뒷면 스타일을 별도로 선택할 수 있습니다.'
        :'동일한 1,000개 디자인 풀에서 업종과 브랜드에 맞는 앞면 시안을 추천합니다.';

      const modalLabel=document.querySelector('#templateModal .section-label');
      if(modalLabel)modalLabel.textContent='1,000 TEMPLATE LIBRARY';

      syncAllStyleCard();
      replaceLegacyCounts(document.body);
    }

    // V12.3에서 별도로 만든 두 번째 스타일 선택 UI는 제거하고,
    // 앞면/뒷면 모두 기존 STYLE 카드 + 동일 라이브러리 버튼을 사용한다.
    const duplicate=document.getElementById('cc13BackStylePanel');
    if(duplicate)duplicate.classList.add('cc-v124-parity-hidden');

    document.querySelectorAll('[data-side]').forEach(btn=>btn.addEventListener('click',()=>setTimeout(syncStyleUi,0)));
    document.getElementById('libraryBtn')?.addEventListener('click',()=>setTimeout(syncStyleUi,0),true);

    const styleList=document.getElementById('styleList');
    if(styleList)new MutationObserver(()=>requestAnimationFrame(syncStyleUi)).observe(styleList,{childList:true,subtree:true});

    const modal=document.getElementById('templateModal');
    if(modal)new MutationObserver(()=>requestAnimationFrame(syncStyleUi)).observe(modal,{attributes:true,childList:true,subtree:true});

    // renderAll/renderStyles가 UI를 다시 그려도 앞·뒷면 표현을 동일하게 유지한다.
    const observer=new MutationObserver(()=>requestAnimationFrame(syncStyleUi));
    observer.observe(document.body,{childList:true,subtree:true});

    syncStyleUi();
    console.info('Cardcraft V12.4 front/back style parity active');
  }

  boot();
})();
