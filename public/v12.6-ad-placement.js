(function cardcraftV126AdPlacement(){
  'use strict';
  if(window.__CARDCRAFT_V126_AD_PLACEMENT__)return;
  window.__CARDCRAFT_V126_AD_PLACEMENT__=true;

  let bypassMore=false;
  let bypassAi=false;
  let adBusy=false;

  function nativeAdsReady(){return Boolean(window.CARDCRAFT_NATIVE?.isNative&&window.CardcraftNativeAds?.available?.());}

  async function showRewardedForMore(){
    if(nativeAdsReady()){
      const result=await window.CardcraftNativeAds.showRewarded();
      if(!result?.granted)throw new Error('AD_NOT_GRANTED');
      return result;
    }
    // 웹 프리뷰에서는 앱 광고를 띄울 수 없으므로 기존 테스트 흐름처럼 짧은 개발용 카운트다운만 사용한다.
    return await new Promise(resolve=>{
      const overlay=document.createElement('div');
      overlay.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#0b0f19;display:flex;align-items:center;justify-content:center;padding:24px;color:#fff;font-family:Arial,"Noto Sans KR",sans-serif';
      overlay.innerHTML='<div style="text-align:center"><div style="font-size:11px;font-weight:800;letter-spacing:.15em;color:#fbbf24;margin-bottom:14px">REWARDED AD TEST</div><strong style="font-size:24px">다른 시안 보기</strong><p style="color:#cbd5e1;font-size:13px;line-height:1.6">앱에서는 이 위치에 보상형 광고가 표시됩니다.</p><div id="ccV126Count" style="font-size:52px;font-weight:900">3</div></div>';
      document.body.appendChild(overlay);
      let left=3;const count=overlay.querySelector('#ccV126Count');
      const timer=setInterval(()=>{left--;count.textContent=String(Math.max(0,left));if(left<=0){clearInterval(timer);overlay.remove();resolve({granted:true,test:true,webFallback:true});}},1000);
    });
  }

  function replayClickWithoutId(button,kind){
    const originalId=button.id;
    if(kind==='more')bypassMore=true;else bypassAi=true;
    button.id='';
    try{button.click();}
    finally{
      button.id=originalId;
      queueMicrotask(()=>{if(kind==='more')bypassMore=false;else bypassAi=false;});
    }
  }

  // 이 리스너는 monetization.js보다 먼저 등록된다.
  // AI 버튼은 기존 광고 게이트를 우회해서 바로 실행한다.
  document.addEventListener('click',event=>{
    const ai=event.target.closest?.('#v10AiRun');
    if(!ai||bypassAi)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    replayClickWithoutId(ai,'ai');
  },true);

  // 최초 추천 5개는 무료. 새로운 추천 5개를 요청할 때만 Rewarded 1회.
  document.addEventListener('click',async event=>{
    const more=event.target.closest?.('#regenerateBtn');
    if(!more||bypassMore)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if(adBusy)return;
    adBusy=true;
    const old=more.textContent;
    more.disabled=true;
    more.textContent='광고 준비 중…';
    try{
      await showRewardedForMore();
      more.textContent='새 시안 불러오는 중…';
      replayClickWithoutId(more,'more');
    }catch(error){
      console.error('Cardcraft rewarded gate failed',error);
      window.showToast?.(/closed|cancel|not_granted/i.test(String(error?.message||''))?'광고를 끝까지 시청하면 다른 시안을 볼 수 있습니다.':'광고를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',5200);
    }finally{
      more.disabled=false;
      more.textContent=old;
      adBusy=false;
      setTimeout(syncLabels,0);
    }
  },true);

  function syncLabels(){
    const btn=document.getElementById('regenerateBtn');
    if(btn&&!adBusy)btn.textContent=state?.side==='back'?'▶ 광고 보고 다른 뒷면 시안 보기':'▶ 광고 보고 다른 앞면 시안 보기';
    const ai=document.getElementById('v10AiRun');
    if(ai)ai.textContent='✦ AI 디자인 4안 생성';
    const note=document.querySelector('.v10-ai-note');
    if(note)note.textContent='AI 생성은 별도 광고 없이 사용할 수 있습니다. 다른 추천 시안을 추가로 볼 때 보상형 광고가 표시됩니다.';
  }

  const observer=new MutationObserver(()=>requestAnimationFrame(syncLabels));
  observer.observe(document.body,{childList:true,subtree:true});
  document.querySelectorAll('[data-side]').forEach(btn=>btn.addEventListener('click',()=>setTimeout(syncLabels,0)));
  syncLabels();

  console.info('Cardcraft V12.6 ad placement: rewarded gate moved to more recommendations');
})();
