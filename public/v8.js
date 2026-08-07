(function cardcraftV8FloatingPreview(){
  const sourceStage=document.querySelector('.main-stage');
  const sourceCard=document.getElementById('mainCard');
  const sourceTitle=document.getElementById('previewTitle');
  if(!sourceStage||!sourceCard)return;

  const dock=document.createElement('aside');
  dock.className='v8-floating-preview';
  dock.id='v8FloatingPreview';
  dock.hidden=true;
  dock.setAttribute('aria-label','고정 라이브 미리보기');
  dock.innerHTML=`
    <div class="v8-floating-head">
      <div class="v8-floating-title"><span>LIVE PREVIEW</span><strong id="v8FloatingTitle">현재 시안</strong></div>
      <div class="v8-floating-sides" aria-label="명함 면 선택">
        <button type="button" data-v8-side="front">앞면</button>
        <button type="button" data-v8-side="back">뒷면</button>
      </div>
      <button class="v8-floating-icon" id="v8CollapsePreview" type="button" aria-label="미리보기 접기" title="미리보기 접기">−</button>
    </div>
    <div class="v8-floating-body">
      <div class="v8-floating-card" id="v8FloatingCard"></div>
      <div class="v8-floating-foot"><span>수정 결과가<br>실시간 반영됩니다</span><button type="button" id="v8GoToPreview">원본 보기 ↑</button></div>
    </div>`;
  document.body.appendChild(dock);

  const mirror=dock.querySelector('#v8FloatingCard');
  const dockTitle=dock.querySelector('#v8FloatingTitle');
  const collapseButton=dock.querySelector('#v8CollapsePreview');
  const goButton=dock.querySelector('#v8GoToPreview');
  const sideButtons=[...dock.querySelectorAll('[data-v8-side]')];
  let sourceVisible=true;
  let passedSource=false;
  let collapsed=false;
  let frame=0;

  function currentSide(){
    const active=document.querySelector('[data-side].active');
    return active?.dataset.side||window.state?.side||'front';
  }

  function sync(){
    cancelAnimationFrame(frame);
    frame=requestAnimationFrame(()=>{
      mirror.innerHTML=sourceCard.innerHTML;
      dockTitle.textContent=sourceTitle?.textContent||'현재 시안';
      const side=currentSide();
      sideButtons.forEach(button=>button.classList.toggle('active',button.dataset.v8Side===side));
    });
  }

  function setDockVisible(show){
    if(show){
      dock.hidden=false;
      requestAnimationFrame(()=>dock.classList.add('is-visible'));
      document.body.classList.add('v8-preview-open');
      document.body.classList.toggle('v8-preview-collapsed',collapsed);
      sync();
    }else{
      dock.classList.remove('is-visible');
      document.body.classList.remove('v8-preview-open','v8-preview-collapsed');
      window.setTimeout(()=>{if(!dock.classList.contains('is-visible'))dock.hidden=true;},210);
    }
  }

  function evaluate(){
    const rect=sourceStage.getBoundingClientRect();
    const headerOffset=document.body.classList.contains('v7-admin')?126:82;
    passedSource=rect.bottom<headerOffset;
    setDockVisible(!sourceVisible&&passedSource);
  }

  const observer=new IntersectionObserver(entries=>{
    sourceVisible=entries[0]?.isIntersecting??true;
    evaluate();
  },{root:null,threshold:.08});
  observer.observe(sourceStage);

  const mutationObserver=new MutationObserver(sync);
  mutationObserver.observe(sourceCard,{childList:true,subtree:true,attributes:true,characterData:true});
  if(sourceTitle)mutationObserver.observe(sourceTitle,{childList:true,subtree:true,characterData:true});

  window.addEventListener('scroll',evaluate,{passive:true});
  window.addEventListener('resize',()=>{evaluate();sync();},{passive:true});

  sideButtons.forEach(button=>button.addEventListener('click',()=>{
    const sourceButton=document.querySelector(`[data-side="${button.dataset.v8Side}"]`);
    if(sourceButton&&!sourceButton.classList.contains('active'))sourceButton.click();
    window.setTimeout(sync,0);
  }));

  collapseButton.addEventListener('click',()=>{
    collapsed=!collapsed;
    dock.classList.toggle('is-collapsed',collapsed);
    collapseButton.textContent=collapsed?'▣':'−';
    collapseButton.setAttribute('aria-label',collapsed?'미리보기 펼치기':'미리보기 접기');
    collapseButton.title=collapsed?'미리보기 펼치기':'미리보기 접기';
    document.body.classList.toggle('v8-preview-collapsed',collapsed);
  });

  goButton.addEventListener('click',()=>{
    sourceStage.scrollIntoView({behavior:'smooth',block:'start'});
  });

  sync();
  evaluate();
  console.info('Cardcraft V8 floating preview active');
})();
