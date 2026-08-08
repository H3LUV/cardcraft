(function cardcraftMonetization(){
  'use strict';

  const cfg={
    mode:'demo',premiumPrice:1900,currency:'KRW',
    endpoints:{session:'/api/session',createOrder:'/api/payments/orders',completePayment:'/api/payments/complete'},
    portOne:{storeId:'',channelKey:''},rewardedAd:{adUnitPath:''},
    ...(window.CARDCRAFT_MONETIZATION||{})
  };
  cfg.endpoints={session:'/api/session',createOrder:'/api/payments/orders',completePayment:'/api/payments/complete',...(window.CARDCRAFT_MONETIZATION?.endpoints||{})};
  cfg.portOne={storeId:'',channelKey:'',...(window.CARDCRAFT_MONETIZATION?.portOne||{})};
  cfg.rewardedAd={adUnitPath:'',...(window.CARDCRAFT_MONETIZATION?.rewardedAd||{})};

  const exportBtn=document.getElementById('exportBtn');
  if(!exportBtn)return;

  const money=new Intl.NumberFormat('ko-KR');
  const originalExportLabel=exportBtn.textContent;
  let session={mode:cfg.mode,price:Number(cfg.premiumPrice)||1900,currency:cfg.currency||'KRW',paymentLive:false,adLive:false};
  let opened=false,busy=false,gateMode='download',bypassDesign=false;

  const modal=document.createElement('div');
  modal.className='cc-paywall';
  modal.id='ccPaywall';
  modal.setAttribute('aria-hidden','true');
  modal.innerHTML=`
    <section class="cc-paywall-card" role="dialog" aria-modal="true" aria-labelledby="ccPaywallTitle">
      <header class="cc-paywall-head">
        <div><span class="cc-paywall-kicker" id="ccKicker">DOWNLOAD</span><h2 id="ccPaywallTitle">최종 명함 다운로드</h2><p id="ccPaywallDesc">결제 후 고해상도 PNG를 다운로드할 수 있습니다.</p></div>
        <button class="cc-paywall-close" type="button" data-cc-close aria-label="닫기">×</button>
      </header>
      <div class="cc-paywall-body">
        <div class="cc-download-meta"><span id="ccMetaLabel">현재 파일</span><strong id="ccDownloadMeta">PNG · 고해상도</strong></div>
        <div class="cc-choice-grid" id="ccChoiceGrid">
          <button class="cc-choice" type="button" id="ccPrimaryChoice">
            <span class="cc-choice-icon" id="ccChoiceIcon">↓</span>
            <span class="cc-choice-copy"><strong id="ccChoiceTitle">결제하고 다운로드</strong><span id="ccChoiceDesc">결제가 완료되면 현재 PNG를 바로 저장합니다.</span></span>
            <span class="cc-choice-price" id="ccChoicePrice">₩1,900</span>
          </button>
        </div>
        <div class="cc-demo-flag">현재 테스트 모드입니다. 광고와 결제는 실제 과금 없이 흐름만 확인합니다.</div>
        <div class="cc-progress" id="ccProgress"><div class="cc-progress-ring"></div><h3 id="ccProgressTitle">처리 중입니다</h3><p id="ccProgressText">잠시만 기다려 주세요.</p></div>
        <div class="cc-ad-stage" id="ccAdStage"><div class="cc-ad-shell"><div class="cc-ad-demo"><span>REWARDED AD</span><strong>광고 테스트 재생 중</strong><p>광고를 끝까지 보면 AI 디자인 생성이 시작됩니다.</p><div class="cc-ad-count" id="ccAdCount">5초</div></div></div><div class="cc-ad-foot">광고 완료 후 디자인 생성을 자동으로 이어갑니다.</div></div>
        <div class="cc-error" id="ccError"></div>
        <p class="cc-paywall-note" id="ccNote">결제 승인은 서버에서 다시 확인합니다. 결제 실패·취소 시 다운로드되지 않습니다.</p>
      </div>
    </section>`;
  document.body.appendChild(modal);

  const titleEl=modal.querySelector('#ccPaywallTitle'),descEl=modal.querySelector('#ccPaywallDesc'),kickerEl=modal.querySelector('#ccKicker'),metaLabel=modal.querySelector('#ccMetaLabel'),metaEl=modal.querySelector('#ccDownloadMeta'),choice=modal.querySelector('#ccPrimaryChoice'),choiceIcon=modal.querySelector('#ccChoiceIcon'),choiceTitle=modal.querySelector('#ccChoiceTitle'),choiceDesc=modal.querySelector('#ccChoiceDesc'),choicePrice=modal.querySelector('#ccChoicePrice'),choiceGrid=modal.querySelector('#ccChoiceGrid'),progress=modal.querySelector('#ccProgress'),progressTitle=modal.querySelector('#ccProgressTitle'),progressText=modal.querySelector('#ccProgressText'),adStage=modal.querySelector('#ccAdStage'),adCount=modal.querySelector('#ccAdCount'),errorBox=modal.querySelector('#ccError'),noteEl=modal.querySelector('#ccNote');

  function resetViews(){choiceGrid.hidden=false;progress.classList.remove('is-active');adStage.classList.remove('is-active');errorBox.classList.remove('is-active');errorBox.textContent='';busy=false;}
  function setGate(mode){
    gateMode=mode;resetViews();modal.classList.toggle('is-demo',session.mode!=='live');
    if(mode==='design'){
      kickerEl.textContent='AI DESIGN';titleEl.textContent='광고를 보고 디자인 생성';descEl.textContent='보상형 광고 1회를 완료하면 AI가 새로운 명함 디자인 4안을 생성합니다.';
      metaLabel.textContent='생성 방식';metaEl.textContent='AI 디자인 4안';choiceIcon.textContent='▶';choiceTitle.textContent='광고 보고 디자인 생성';choiceDesc.textContent='광고를 끝까지 시청하면 생성이 자동으로 시작됩니다.';choicePrice.textContent='무료';choicePrice.classList.add('free');noteEl.textContent='광고를 중간에 닫으면 디자인 생성은 시작되지 않습니다.';
    }else{
      kickerEl.textContent='DOWNLOAD';titleEl.textContent='최종 명함 다운로드';descEl.textContent='최종 파일 다운로드는 유료입니다. 결제가 완료되면 현재 고해상도 PNG를 저장합니다.';
      metaLabel.textContent='현재 파일';metaEl.textContent=`PNG · ${document.getElementById('exportDpi')?.value||600}dpi`;choiceIcon.textContent='↓';choiceTitle.textContent='결제하고 PNG 다운로드';choiceDesc.textContent='현재 선택한 명함 면을 고해상도 PNG로 저장합니다.';choicePrice.textContent=`₩${money.format(Number(session.price)||Number(cfg.premiumPrice)||1900)}`;choicePrice.classList.remove('free');noteEl.textContent='결제 승인은 서버에서 다시 확인합니다. 결제 실패·취소 시 다운로드되지 않습니다.';
    }
  }
  function openGate(mode){setGate(mode);modal.classList.add('is-open');modal.setAttribute('aria-hidden','false');opened=true;document.body.style.overflow='hidden';}
  function closeGate(force=false){if(busy&&!force)return;modal.classList.remove('is-open');modal.setAttribute('aria-hidden','true');opened=false;document.body.style.overflow='';}
  function showProgress(title,text){choiceGrid.hidden=true;adStage.classList.remove('is-active');errorBox.classList.remove('is-active');progressTitle.textContent=title;progressText.textContent=text;progress.classList.add('is-active');}
  function showError(message){busy=false;progress.classList.remove('is-active');adStage.classList.remove('is-active');errorBox.textContent=message;errorBox.classList.add('is-active');choiceGrid.hidden=false;}
  async function fetchJson(url,options={}){const res=await fetch(url,{...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});let data={};try{data=await res.json();}catch{}if(!res.ok)throw new Error(data?.message||data?.error||`HTTP_${res.status}`);return data;}
  async function loadSession(){try{session={...session,...await fetchJson(cfg.endpoints.session,{method:'GET'})};}catch{}modal.classList.toggle('is-demo',session.mode!=='live');}

  function triggerDesignGeneration(){
    const button=document.getElementById('v10AiRun');
    if(!button)return;
    bypassDesign=true;
    closeGate(true);
    requestAnimationFrame(()=>button.click());
  }
  async function runExport(){
    try{closeGate(true);exportBtn.disabled=true;exportBtn.textContent='PNG 만드는 중…';if(typeof window.exportPng!=='function')throw new Error('EXPORT_NOT_AVAILABLE');await window.exportPng();}
    catch(e){console.error(e);window.showToast?.('PNG 생성에 실패했습니다.');}
    finally{exportBtn.disabled=false;exportBtn.textContent=originalExportLabel;}
  }

  function demoAd(){
    busy=true;choiceGrid.hidden=true;progress.classList.remove('is-active');adStage.classList.add('is-active');let left=5;adCount.textContent=`${left}초`;
    const timer=setInterval(()=>{left-=1;adCount.textContent=left>0?`${left}초`:'완료';if(left<=0){clearInterval(timer);busy=false;triggerDesignGeneration();}},1000);
  }
  function loadGpt(){if(window.googletag?.cmd)return Promise.resolve(window.googletag);return new Promise((resolve,reject)=>{const existing=document.querySelector('script[data-cc-gpt]');if(existing){existing.addEventListener('load',()=>resolve(window.googletag),{once:true});existing.addEventListener('error',reject,{once:true});return;}window.googletag=window.googletag||{cmd:[]};const s=document.createElement('script');s.async=true;s.src='https://securepubads.g.doubleclick.net/tag/js/gpt.js';s.dataset.ccGpt='1';s.onload=()=>resolve(window.googletag);s.onerror=reject;document.head.appendChild(s);});}
  async function liveRewardedAd(){
    const path=cfg.rewardedAd?.adUnitPath;if(!path){showError('보상형 광고 지면이 아직 연결되지 않았습니다.');return;}
    busy=true;showProgress('광고를 준비하고 있습니다','광고 재고를 확인하는 중입니다.');
    try{
      await loadGpt();
      await new Promise((resolve,reject)=>{const gt=window.googletag;let settled=false,slot=null;const finish=(fn,value)=>{if(settled)return;settled=true;try{if(slot)gt.destroySlots([slot]);}catch{}fn(value);};gt.cmd.push(()=>{slot=gt.defineOutOfPageSlot(path,gt.enums.OutOfPageFormat.REWARDED);if(!slot)return finish(reject,new Error('REWARDED_UNSUPPORTED'));slot.addService(gt.pubads());gt.pubads().addEventListener('rewardedSlotReady',event=>{if(event.slot!==slot)return;progress.classList.remove('is-active');event.makeRewardedVisible();});gt.pubads().addEventListener('rewardedSlotGranted',event=>{if(event.slot!==slot)return;finish(resolve,true);});gt.pubads().addEventListener('rewardedSlotClosed',event=>{if(event.slot!==slot)return;setTimeout(()=>finish(reject,new Error('AD_CLOSED')),0);});gt.enableServices();gt.display(slot);});setTimeout(()=>finish(reject,new Error('AD_TIMEOUT')),15000);});
      busy=false;triggerDesignGeneration();
    }catch(e){console.error(e);showError(e.message==='AD_CLOSED'?'광고가 끝나기 전에 닫혔습니다.':'현재 재생 가능한 광고가 없습니다. 잠시 후 다시 시도해 주세요.');}
  }

  function makePaymentId(){return `cardcraft_${Date.now()}_${Math.random().toString(36).slice(2,10)}`;}
  async function demoPayment(){busy=true;showProgress('결제 테스트 진행 중','실제 결제는 발생하지 않습니다.');await new Promise(r=>setTimeout(r,1100));busy=false;await runExport();}
  async function livePayment(){
    if(!window.PortOne?.requestPayment){showError('결제 모듈을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.');return;}
    if(!cfg.portOne?.storeId||!cfg.portOne?.channelKey){showError('결제 채널이 아직 연결되지 않았습니다.');return;}
    busy=true;showProgress('결제를 준비하고 있습니다','안전한 결제창을 여는 중입니다.');
    try{
      const order=await fetchJson(cfg.endpoints.createOrder,{method:'POST',body:JSON.stringify({product:'png-download'})});progress.classList.remove('is-active');
      const response=await window.PortOne.requestPayment({storeId:cfg.portOne.storeId,channelKey:cfg.portOne.channelKey,paymentId:order.paymentId||makePaymentId(),orderName:order.orderName||'Cardcraft PNG 다운로드',totalAmount:Number(order.amount)||Number(session.price)||1900,currency:order.currency||'KRW',payMethod:'CARD'});
      if(response?.code)throw new Error(response.message||'PAYMENT_CANCELLED');
      showProgress('결제를 확인하고 있습니다','결제사 승인 결과를 서버에서 확인합니다.');
      const verified=await fetchJson(cfg.endpoints.completePayment,{method:'POST',body:JSON.stringify({paymentId:response.paymentId||order.paymentId})});if(!verified.granted)throw new Error('PAYMENT_NOT_VERIFIED');busy=false;await runExport();
    }catch(e){console.error(e);showError(/cancel/i.test(e.message)?'결제가 취소되었습니다.':'결제를 완료하지 못했습니다. 결제 내역이 있다면 잠시 후 다시 확인해 주세요.');}
  }

  async function handlePrimary(){if(busy)return;if(gateMode==='design'){return session.mode!=='live'||!session.adLive?demoAd():liveRewardedAd();}return session.mode!=='live'||!session.paymentLive?demoPayment():livePayment();}

  exportBtn.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();openGate('download');},true);
  document.addEventListener('click',event=>{const button=event.target.closest?.('#v10AiRun');if(!button)return;if(bypassDesign){bypassDesign=false;return;}event.preventDefault();event.stopImmediatePropagation();openGate('design');},true);
  choice.addEventListener('click',handlePrimary);
  modal.querySelectorAll('[data-cc-close]').forEach(btn=>btn.addEventListener('click',()=>closeGate()));
  modal.addEventListener('click',event=>{if(event.target===modal)closeGate();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&opened)closeGate();});

  window.CardcraftMonetization={openDownload:()=>openGate('download'),openDesign:()=>openGate('design'),refreshSession:loadSession};
  loadSession();
})();
