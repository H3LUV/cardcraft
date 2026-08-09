(function cardcraftV125AdTestFallback(){
  'use strict';

  function boot(){
    if(!window.CARDCRAFT_NATIVE?.isNative){return;}
    if(!window.CardcraftNativeAds?.showRewarded){setTimeout(boot,120);return;}
    if(window.__CARDCRAFT_V125_AD_TEST__)return;
    window.__CARDCRAFT_V125_AD_TEST__=true;

    const originalShow=window.CardcraftNativeAds.showRewarded.bind(window.CardcraftNativeAds);

    function fallbackRewarded(error){
      console.warn('Google rewarded test ad unavailable; using Cardcraft internal test fallback',error);
      return new Promise(resolve=>{
        const overlay=document.createElement('div');
        overlay.id='ccV125FallbackAd';
        overlay.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#0b0f19;display:flex;align-items:center;justify-content:center;padding:24px;color:#fff;font-family:Arial,"Noto Sans KR",sans-serif';
        overlay.innerHTML=`<div style="width:min(92vw,420px);text-align:center"><div style="font-size:11px;font-weight:800;letter-spacing:.16em;color:#fbbf24;margin-bottom:16px">TEST REWARDED FALLBACK</div><div style="font-size:24px;font-weight:900;margin-bottom:10px">AI 생성 테스트 광고</div><p style="margin:0 auto 28px;color:#cbd5e1;font-size:13px;line-height:1.65">Google 테스트 광고를 불러오지 못해 개발용 테스트 화면으로 전환했습니다.<br>카운트다운이 끝나면 AI 디자인 생성이 계속됩니다.</p><div id="ccV125FallbackCount" style="font-size:56px;font-weight:900;font-variant-numeric:tabular-nums">5</div><div style="margin-top:18px;font-size:11px;color:#64748b">이 화면은 출시 빌드에서는 사용하지 않습니다.</div></div>`;
        document.body.appendChild(overlay);
        let left=5;
        const count=overlay.querySelector('#ccV125FallbackCount');
        const timer=setInterval(()=>{
          left-=1;
          count.textContent=String(Math.max(0,left));
          if(left<=0){
            clearInterval(timer);
            overlay.remove();
            resolve({granted:true,test:true,fallback:true,reason:String(error?.message||error||'AD_UNAVAILABLE')});
          }
        },1000);
      });
    }

    window.CardcraftNativeAds.showRewarded=async()=>{
      try{return await originalShow();}
      catch(error){
        if(window.CardcraftNativeAds.mode==='google-test')return fallbackRewarded(error);
        throw error;
      }
    };

    console.info('Cardcraft V12.5 rewarded test fallback active');
  }

  boot();
})();
