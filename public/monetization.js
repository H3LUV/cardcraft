(function cardcraftMonetization(){
  'use strict';

  const cfg={
    mode:'demo',premiumPrice:1900,currency:'KRW',paidUnlockHours:24,
    endpoints:{session:'/api/session',createOrder:'/api/payments/orders',completePayment:'/api/payments/complete'},
    portOne:{storeId:'',channelKey:''},rewardedAd:{adUnitPath:''},
    ...(window.CARDCRAFT_MONETIZATION||{})
  };
  cfg.endpoints={session:'/api/session',createOrder:'/api/payments/orders',completePayment:'/api/payments/complete',...(window.CARDCRAFT_MONETIZATION?.endpoints||{})};
  cfg.portOne={storeId:'',channelKey:'',...(window.CARDCRAFT_MONETIZATION?.portOne||{})};
  cfg.rewardedAd={adUnitPath:'',...(window.CARDCRAFT_MONETIZATION?.rewardedAd||{})};

  const PASS_KEY='cardcraft-download-pass-v1';
  const exportBtn=document.getElementById('exportBtn');
  if(!exportBtn)return;

  const money=new Intl.NumberFormat('ko-KR');
  const originalLabel=exportBtn.textContent;
  let session={mode:cfg.mode,price:Number(cfg.premiumPrice)||1900,currency:cfg.currency||'KRW',paymentLive:false,adLive:false};
  let opened=false,busy=false;

  const modal=document.createElement('div');
  modal.className='cc-paywall';
  modal.id='ccPaywall';
  modal.setAttribute('aria-hidden','true');
  modal.innerHTML=`
    <section class="cc-paywall-card" role="dialog" aria-modal="true" aria-labelledby="ccPaywallTitle">
      <header class="cc-paywall-head">
        <div><span class="cc-paywall-kicker">DOWNLOAD</span><h2 id="ccPaywallTitle">완성한 명함을 다운로드할까요?</h2><p>광고 1회를 보고 무료로 받거나, 다운로드 패스를 구매할 수 있습니다.</p></div>
        <button class="cc-paywall-close" type="button" data-cc-close aria-label="닫기">×</button>
      </header>
      <div class="cc-paywall-body">
        <div class="cc-download-meta"><span>현재 파일</span><strong id="ccDownloadMeta">PNG · 고해상도</strong></div>
        <div class="cc-choice-grid" id="ccChoiceGrid">
          <button class="cc-choice" type="button" id="ccAdChoice">
            <span class="cc-choice-icon">▶</span><span class="cc-choice-copy"><strong>광고 보고 무료 다운로드</strong><span>보상형 광고 1회 시청 후 현재 PNG를 바로 저장합니다.</span></span><span class="cc-choice-price free">무료</span>
          </button>
          <button class="cc-choice recommended" type="button" id="ccPayChoice">
            <span class="cc-choice-icon">↓</span><span class="cc-choice-copy"><strong>다운로드 패스</strong><span>${Number(cfg.paidUnlockHours)||24}시간 동안 광고 없이 PNG를 자유롭게 다운로드합니다.</span></span><span class="cc-choice-price" id="ccPrice">₩${money.format(Number(cfg.premiumPrice)||1900)}</span>
          </button>
        </div>
        <div class="cc-demo-flag">현재 테스트 모드입니다. 광고와 결제는 실제 과금 없이 흐름만 확인합니다.</div>
        <div class="cc-progress" id="ccProgress"><div class="cc-progress-ring"></div><h3 id="ccProgressTitle">처리 중입니다</h3><p id="ccProgressText">잠시만 기다려 주세요.</p></div>
        <div class="cc-ad-stage" id="ccAdStage"><div class="cc-ad-shell"><div class="cc-ad-demo"><span>REWARDED AD</span><strong>광고 테스트 재생 중</strong><p>실제 광고 계정 연결 전에는 5초 테스트 화면으로 동작합니다.</p><div class="cc-ad-count" id="ccAdCount">5초</div></div></div><div class="cc-ad-foot">광고가 끝까지 재생되면 다운로드가 시작됩니다.</div></div>
        <div class="cc-pass-success" id="ccSuccess"><i>✓</i><h3 id="ccSuccessTitle">다운로드 준비 완료</h3><p id="ccSuccessText">파일을 저장합니다.</p><button class="cc-success-button" type="button" id="ccSuccessButton">PNG 다운로드</button></div>
        <div class="cc-error" id="ccError"></div>
        <p class="cc-paywall-note">결제 승인은 서버에서 다시 확인합니다. 결제 실패·취소 시에는 다운로드 패스가 활성화되지 않습니다.</p>
      </div>
    </section>`;
  document.body.appendChild(modal);

  const topbarActions=document.querySelector('.topbar-actions');
  const badge=document.createElement('div');
  badge.className='cc-access-badge';
  badge.innerHTML='<i></i><span>무료 다운로드</span>';
  if(topbarActions)topbarActions.insertBefore(badge,topbarActions.firstChild);

  const closeBtns=[...modal.querySelectorAll('[data-cc-close]')],choiceGrid=modal.querySelector('#ccChoiceGrid'),progress=modal.querySelector('#ccProgress'),progressTitle=modal.querySelector('#ccProgressTitle'),progressText=modal.querySelector('#ccProgressText'),adStage=modal.querySelector('#ccAdStage'),adCount=modal.querySelector('#ccAdCount'),success=modal.querySelector('#ccSuccess'),successTitle=modal.querySelector('#ccSuccessTitle'),successText=modal.querySelector('#ccSuccessText'),successBtn=modal.querySelector('#ccSuccessButton'),errorBox=modal.querySelector('#ccError'),priceEl=modal.querySelector('#ccPrice'),metaEl=modal.querySelector('#ccDownloadMeta');

  function getPass(){
    try{const value=JSON.parse(localStorage.getItem(PASS_KEY)||'null');return value&&Number(value.until)>Date.now()?value:null;}catch{return null;}
  }
  function setPass(hours){
    const until=Date.now()+Math.max(1,Number(hours)||24)*3600000;
    try{localStorage.setItem(PASS_KEY,JSON.stringify({until,source:'payment'}));}catch{}
    updateBadge();
    return until;
  }
  function updateBadge(){
    const pass=getPass();
    if(!pass){badge.classList.remove('is-paid');badge.querySelector('span').textContent='무료 다운로드';return;}
    const hours=Math.max(1,Math.ceil((pass.until-Date.now())/3600000));
    badge.classList.add('is-paid');badge.querySelector('span').textContent=`다운로드 패스 · ${hours}시간`;
  }
  function resetViews(){choiceGrid.hidden=false;progress.classList.remove('is-active');adStage.classList.remove('is-active');success.classList.remove('is-active');errorBox.classList.remove('is-active');errorBox.textContent='';busy=false;}
  function openModal(){
    if(getPass()){runExport();return;}
    resetViews();
    const dpi=Number(window.state?.custom?.exportDpi)||600;
    metaEl.textContent=`PNG · ${dpi}dpi`;
    modal.classList.toggle('is-demo',session.mode!=='live');
    priceEl.textContent=`₩${money.format(Number(session.price)||Number(cfg.premiumPrice)||1900)}`;
    modal.classList.add('is-open');modal.setAttribute('aria-hidden','false');opened=true;document.body.style.overflow='hidden';
  }
  function closeModal(){if(busy)return;modal.classList.remove('is-open');modal.setAttribute('aria-hidden','true');opened=false;document.body.style.overflow='';}
  function showProgress(title,text){choiceGrid.hidden=true;adStage.classList.remove('is-active');success.classList.remove('is-active');errorBox.classList.remove('is-active');progressTitle.textContent=title;progressText.textContent=text;progress.classList.add('is-active');}
  function showError(message){busy=false;progress.classList.remove('is-active');adStage.classList.remove('is-active');errorBox.textContent=message;errorBox.classList.add('is-active');choiceGrid.hidden=false;}
  function showSuccess(title,text){busy=false;choiceGrid.hidden=true;progress.classList.remove('is-active');adStage.classList.remove('is-active');errorBox.classList.remove('is-active');successTitle.textContent=title;successText.textContent=text;success.classList.add('is-active');}
  async function runExport(){
    try{
      exportBtn.disabled=true;exportBtn.textContent='PNG 만드는 중…';
      if(typeof window.exportPng!=='function')throw new Error('EXPORT_NOT_AVAILABLE');
      await window.exportPng();
    }catch(e){console.error(e);window.showToast?.('PNG 생성에 실패했습니다.');}
    finally{exportBtn.disabled=false;exportBtn.textContent=originalLabel;}
  }

  async function fetchJson(url,options={}){
    const res=await fetch(url,{...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});
    let data={};try{data=await res.json();}catch{}
    if(!res.ok)throw new Error(data?.message||data?.error||`HTTP_${res.status}`);
    return data;
  }

  async function loadSession(){
    try{
      const data=await fetchJson(cfg.endpoints.session,{method:'GET'});
      session={...session,...data};
    }catch{}
    modal.classList.toggle('is-demo',session.mode!=='live');
    updateBadge();
  }

  function demoAd(){
    busy=true;choiceGrid.hidden=true;progress.classList.remove('is-active');adStage.classList.add('is-active');
    let left=5;adCount.textContent=`${left}초`;
    const timer=setInterval(()=>{left-=1;adCount.textContent=left>0?`${left}초`:'완료';if(left<=0){clearInterval(timer);busy=false;showSuccess('광고 시청 완료','현재 PNG 1회를 무료로 다운로드할 수 있습니다.');}},1000);
  }

  function loadGpt(){
    if(window.googletag?.cmd)return Promise.resolve(window.googletag);
    return new Promise((resolve,reject)=>{
      const existing=document.querySelector('script[data-cc-gpt]');
      if(existing){existing.addEventListener('load',()=>resolve(window.googletag),{once:true});existing.addEventListener('error',reject,{once:true});return;}
      window.googletag=window.googletag||{cmd:[]};
      const s=document.createElement('script');s.async=true;s.src='https://securepubads.g.doubleclick.net/tag/js/gpt.js';s.dataset.ccGpt='1';s.onload=()=>resolve(window.googletag);s.onerror=reject;document.head.appendChild(s);
    });
  }

  async function liveRewardedAd(){
    const path=cfg.rewardedAd?.adUnitPath;
    if(!path){showError('보상형 광고 지면이 아직 연결되지 않았습니다. 결제 다운로드를 이용해 주세요.');return;}
    busy=true;showProgress('광고를 준비하고 있습니다','광고 재고를 확인하는 중입니다.');
    try{
      await loadGpt();
      await new Promise((resolve,reject)=>{
        const gt=window.googletag;let settled=false,slot=null;
        const finish=(fn,value)=>{if(settled)return;settled=true;try{if(slot)gt.destroySlots([slot]);}catch{}fn(value);};
        gt.cmd.push(()=>{
          slot=gt.defineOutOfPageSlot(path,gt.enums.OutOfPageFormat.REWARDED);
          if(!slot)return finish(reject,new Error('REWARDED_UNSUPPORTED'));
          slot.addService(gt.pubads());
          gt.pubads().addEventListener('rewardedSlotReady',event=>{if(event.slot!==slot)return;progress.classList.remove('is-active');event.makeRewardedVisible();});
          gt.pubads().addEventListener('rewardedSlotGranted',event=>{if(event.slot!==slot)return;finish(resolve,true);});
          gt.pubads().addEventListener('rewardedSlotClosed',event=>{if(event.slot!==slot)return;setTimeout(()=>finish(reject,new Error('AD_CLOSED')),0);});
          gt.enableServices();gt.display(slot);
        });
        setTimeout(()=>finish(reject,new Error('AD_TIMEOUT')),15000);
      });
      busy=false;showSuccess('광고 시청 완료','현재 PNG 1회를 무료로 다운로드할 수 있습니다.');
    }catch(e){console.error(e);showError(e.message==='AD_CLOSED'?'광고가 끝나기 전에 닫혔습니다.':'현재 재생 가능한 광고가 없습니다. 잠시 후 다시 시도해 주세요.');}
  }

  async function handleAd(){
    if(busy)return;
    if(session.mode!=='live'||!session.adLive)return demoAd();
    return liveRewardedAd();
  }

  function makePaymentId(){return `cardcraft_${Date.now()}_${Math.random().toString(36).slice(2,10)}`;}
  async function demoPayment(){
    busy=true;showProgress('결제 테스트 진행 중','실제 결제는 발생하지 않습니다.');
    await new Promise(r=>setTimeout(r,1100));
    const until=setPass(cfg.paidUnlockHours||24);busy=false;showSuccess('다운로드 패스 활성화',`${new Date(until).toLocaleString('ko-KR')}까지 광고 없이 다운로드할 수 있습니다.`);
  }

  async function livePayment(){
    if(!window.PortOne?.requestPayment){showError('결제 모듈을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.');return;}
    if(!cfg.portOne?.storeId||!cfg.portOne?.channelKey){showError('결제 채널이 아직 연결되지 않았습니다.');return;}
    busy=true;showProgress('결제를 준비하고 있습니다','안전한 결제창을 여는 중입니다.');
    try{
      const order=await fetchJson(cfg.endpoints.createOrder,{method:'POST',body:JSON.stringify({product:'download-pass'})});
      progress.classList.remove('is-active');
      const response=await window.PortOne.requestPayment({
        storeId:cfg.portOne.storeId,
        channelKey:cfg.portOne.channelKey,
        paymentId:order.paymentId||makePaymentId(),
        orderName:order.orderName||'Cardcraft 다운로드 패스',
        totalAmount:Number(order.amount)||Number(session.price)||1900,
        currency:order.currency||'KRW',
        payMethod:'CARD'
      });
      if(response?.code)throw new Error(response.message||'PAYMENT_CANCELLED');
      showProgress('결제를 확인하고 있습니다','결제사 승인 결과를 서버에서 다시 확인합니다.');
      const verified=await fetchJson(cfg.endpoints.completePayment,{method:'POST',body:JSON.stringify({paymentId:response.paymentId||order.paymentId})});
      if(!verified.granted)throw new Error('PAYMENT_NOT_VERIFIED');
      const until=setPass(verified.unlockHours||cfg.paidUnlockHours||24);busy=false;showSuccess('결제가 완료되었습니다',`${new Date(until).toLocaleString('ko-KR')}까지 광고 없이 다운로드할 수 있습니다.`);
    }catch(e){console.error(e);showError(/cancel/i.test(e.message)?'결제가 취소되었습니다.':'결제를 완료하지 못했습니다. 결제 내역이 있다면 잠시 후 다시 확인해 주세요.');}
  }

  async function handlePay(){
    if(busy)return;
    if(session.mode!=='live'||!session.paymentLive)return demoPayment();
    return livePayment();
  }

  exportBtn.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();openModal();},true);
  modal.querySelector('#ccAdChoice').addEventListener('click',handleAd);
  modal.querySelector('#ccPayChoice').addEventListener('click',handlePay);
  closeBtns.forEach(btn=>btn.addEventListener('click',closeModal));
  modal.addEventListener('click',event=>{if(event.target===modal)closeModal();});
  successBtn.addEventListener('click',async()=>{closeModal();await runExport();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&opened)closeModal();});

  window.CardcraftMonetization={open:openModal,refreshSession:loadSession,getPass};
  updateBadge();loadSession();
})();
