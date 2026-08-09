(function cardcraftV127RewardedMore(){
  'use strict';

  function boot(){
    const actions=document.querySelector('.variant-actions');
    const legacy=document.getElementById('regenerateBtn')||document.getElementById('ccLegacyRegenerate');
    if(!actions||!legacy){setTimeout(boot,80);return;}
    if(window.__CARDCRAFT_V127_REWARDED_MORE__)return;
    window.__CARDCRAFT_V127_REWARDED_MORE__=true;

    // 기존 추천 버튼은 app.js의 직접 click listener만 남기고 사용자 UI에서는 감춘다.
    legacy.id='ccLegacyRegenerate';
    legacy.hidden=true;
    legacy.style.display='none';

    // 광고 CTA는 별도 DOM으로 직접 만든다. 다른 버전의 UI 동기화 코드가 이 버튼을 덮어쓸 수 없다.
    let rewardBtn=document.getElementById('ccRewardedMoreBtn');
    if(!rewardBtn){
      rewardBtn=document.createElement('button');
      rewardBtn.type='button';
      rewardBtn.id='ccRewardedMoreBtn';
      rewardBtn.className='btn primary cc-rewarded-more-btn';
      rewardBtn.style.cssText='min-height:44px;padding:0 18px;font-weight:800;white-space:normal;line-height:1.25;box-shadow:0 6px 18px rgba(37,99,235,.18)';
      actions.appendChild(rewardBtn);
    }

    // AI 버튼은 원래 direct listener를 그대로 유지하면서 monetization.js의 #v10AiRun 광고 캡처 대상에서는 제외한다.
    const aiBtn=document.getElementById('v10AiRun');
    if(aiBtn){
      aiBtn.id='v10AiRunFree';
      aiBtn.textContent='✦ AI 디자인 4안 생성';
    }
    const aiNote=document.querySelector('.v10-ai-note');
    if(aiNote)aiNote.textContent='AI 디자인 생성은 광고 없이 사용할 수 있습니다. 추가 추천 시안을 볼 때만 보상형 광고가 표시됩니다.';

    // 설치된 APK가 수정본인지 화면에서 바로 확인할 수 있게 버전을 표시한다.
    let versionBadge=document.getElementById('ccV127VersionBadge');
    if(!versionBadge){
      versionBadge=document.createElement('span');
      versionBadge.id='ccV127VersionBadge';
      versionBadge.textContent='V12.7 TEST';
      versionBadge.style.cssText='display:inline-flex;align-items:center;height:22px;padding:0 8px;border-radius:999px;background:#101828;color:#fff;font-size:9px;font-weight:800;letter-spacing:.05em;margin-left:8px';
      document.querySelector('.variants-heading .section-label')?.appendChild(versionBadge);
    }

    let busy=false;

    function sideLabel(){return (typeof state!=='undefined'&&state.side==='back')?'뒷면':'앞면';}
    function syncLabel(){
      if(busy)return;
      rewardBtn.textContent=`▶ 광고 보고 다른 ${sideLabel()} 시안 5개 보기`;
      rewardBtn.setAttribute('aria-label',`광고를 보고 다른 ${sideLabel()} 시안 5개 보기`);
    }

    async function devFallback(){
      return await new Promise(resolve=>{
        const overlay=document.createElement('div');
        overlay.id='ccV127RewardFallback';
        overlay.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#0b0f19;display:flex;align-items:center;justify-content:center;padding:24px;color:#fff;font-family:Arial,"Noto Sans KR",sans-serif';
        overlay.innerHTML='<div style="width:min(92vw,420px);text-align:center"><div style="font-size:11px;font-weight:800;letter-spacing:.16em;color:#fbbf24;margin-bottom:16px">REWARDED AD TEST</div><div style="font-size:24px;font-weight:900;margin-bottom:10px">다른 시안 5개 보기</div><p style="margin:0 auto 24px;color:#cbd5e1;font-size:13px;line-height:1.65">Google 테스트 광고를 불러오지 못해 개발용 광고 화면을 표시합니다.</p><div id="ccV127RewardCount" style="font-size:56px;font-weight:900">5</div><div style="margin-top:18px;font-size:11px;color:#64748b">테스트 빌드 전용</div></div>';
        document.body.appendChild(overlay);
        let left=5;
        const count=overlay.querySelector('#ccV127RewardCount');
        const timer=setInterval(()=>{left-=1;count.textContent=String(Math.max(0,left));if(left<=0){clearInterval(timer);overlay.remove();resolve({granted:true,test:true,fallback:true});}},1000);
      });
    }

    async function showRewarded(){
      if(window.CARDCRAFT_NATIVE?.isNative&&window.CardcraftNativeAds?.available?.()){
        try{
          const result=await window.CardcraftNativeAds.showRewarded();
          if(result?.granted)return result;
          throw new Error('AD_NOT_GRANTED');
        }catch(error){
          console.warn('Rewarded test ad failed; falling back to internal test screen',error);
          return await devFallback();
        }
      }
      return await devFallback();
    }

    rewardBtn.addEventListener('click',async()=>{
      if(busy)return;
      busy=true;rewardBtn.disabled=true;rewardBtn.textContent='광고 준비 중…';
      try{
        const reward=await showRewarded();
        if(!reward?.granted)throw new Error('AD_NOT_GRANTED');
        rewardBtn.textContent='새 시안 5개 불러오는 중…';
        legacy.click();
        window.showToast?.('새로운 추천 시안 5개를 불러왔습니다.',3600);
      }catch(error){
        console.error('Rewarded more-design flow failed',error);
        window.showToast?.('광고 시청이 완료되지 않아 시안을 변경하지 않았습니다.',4200);
      }finally{
        busy=false;rewardBtn.disabled=false;setTimeout(syncLabel,0);
      }
    });

    document.querySelectorAll('[data-side]').forEach(btn=>btn.addEventListener('click',()=>setTimeout(syncLabel,0)));
    syncLabel();
    document.documentElement.dataset.cardcraftVersion='12.7';
    console.info('Cardcraft V12.7 fixed rewarded-more CTA active');
  }

  boot();
})();
