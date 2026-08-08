(function cardcraftV11CommercePatch(){
  'use strict';
  let observer=null,timer=null;
  function cleanup(){if(observer)observer.disconnect();if(timer)clearInterval(timer);observer=null;timer=null;}
  function install(){
    const paywall=document.getElementById('ccPaywall'),grid=document.getElementById('ccChoiceGrid'),kicker=document.getElementById('ccKicker');
    if(!paywall||!grid||!kicker||!window.CardcraftCommerce)return false;
    if(document.getElementById('ccSourceChoice')){cleanup();return true;}
    const button=document.createElement('button');
    button.className='cc-choice cc-source-choice';button.type='button';button.id='ccSourceChoice';
    button.innerHTML='<span class="cc-choice-icon">◇</span><span class="cc-choice-copy"><strong>편집용 벡터 원본</strong><span>Illustrator에서 수정 가능한 SVG 원본 + 앞·뒷면 PNG</span></span><span class="cc-choice-price">₩3,900</span>';
    grid.appendChild(button);
    const sync=()=>{button.hidden=(kicker.textContent||'').trim()!=='DOWNLOAD';};
    new MutationObserver(sync).observe(kicker,{childList:true,subtree:true,characterData:true});sync();
    button.addEventListener('click',async()=>{
      if(button.disabled)return;button.disabled=true;const price=button.querySelector('.cc-choice-price'),old=price.textContent;price.textContent='처리 중';
      try{await window.CardcraftCommerce.purchaseSource();paywall.classList.remove('is-open');paywall.setAttribute('aria-hidden','true');document.body.style.overflow='';}
      catch(error){console.error(error);if(typeof showToast==='function')showToast(/cancel/i.test(String(error?.message||''))?'결제가 취소되었습니다.':'원본 파일 결제를 완료하지 못했습니다.',4200);}
      finally{button.disabled=false;price.textContent=old;}
    });
    cleanup();return true;
  }
  if(install())return;
  observer=new MutationObserver(install);observer.observe(document.documentElement,{childList:true,subtree:true});
  timer=setInterval(install,250);
  window.setTimeout(()=>cleanup(),12000);
})();
