(function cardcraftNavigationV13(){
  'use strict';

  const boot=()=>{
    const stepper=document.getElementById('stepper');
    if(!stepper){setTimeout(boot,100);return;}
    if(stepper.dataset.navigationV13==='true')return;
    stepper.dataset.navigationV13='true';

    const style=document.createElement('style');
    style.textContent=`
      #stepper{position:sticky;top:80px;z-index:14;box-shadow:0 5px 18px rgba(16,24,40,.06)}
      .input-panel,.styles-panel,.variants-section,#cardcraftFinalEditorV12{scroll-margin-top:158px}
      .cc-nav-target{animation:ccNavPulse .85s ease-out}
      @keyframes ccNavPulse{0%{box-shadow:0 0 0 0 rgba(37,99,235,.28)}45%{box-shadow:0 0 0 5px rgba(37,99,235,.15)}100%{box-shadow:0 0 0 0 rgba(37,99,235,0)}}
      @media(max-width:820px){#stepper{top:72px;overflow-x:auto;grid-template-columns:repeat(4,minmax(150px,1fr));scrollbar-width:none}#stepper::-webkit-scrollbar{display:none}.input-panel,.styles-panel,.variants-section,#cardcraftFinalEditorV12{scroll-margin-top:148px}}
    `;
    document.head.appendChild(style);

    const targetFor=step=>{
      if(step===1)return document.querySelector('.input-panel');
      if(step===2)return document.querySelector('.styles-panel');
      if(step===3)return document.querySelector('.variants-section');
      if(step===4)return document.getElementById('cardcraftFinalEditorV12')||document.querySelector('.main-stage');
      return null;
    };

    const setActive=step=>{
      if(typeof state!=='undefined'){
        state.activeStep=step;
        if(typeof persist==='function')persist();
      }
      if(typeof renderSteps==='function')renderSteps();
      stepper.querySelectorAll('[data-step]').forEach(btn=>{
        const n=Number(btn.dataset.step);
        btn.classList.toggle('active',n===step);
        btn.classList.toggle('done',n<step);
        if(n===step)btn.setAttribute('aria-current','step');else btn.removeAttribute('aria-current');
      });
      const active=stepper.querySelector(`[data-step="${step}"]`);
      if(active&&active.scrollIntoView)active.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
    };

    const goTo=step=>{
      const target=targetFor(step);
      if(!target)return false;
      setActive(step);
      target.scrollIntoView({behavior:'smooth',block:'start'});
      target.classList.remove('cc-nav-target');
      void target.offsetWidth;
      target.classList.add('cc-nav-target');
      setTimeout(()=>target.classList.remove('cc-nav-target'),950);
      if(step===1){setTimeout(()=>target.querySelector('input:not([type="file"]),select,textarea')?.focus({preventScroll:true}),500);}
      return true;
    };

    stepper.addEventListener('click',event=>{
      const button=event.target.closest('[data-step]');
      if(!button)return;
      event.preventDefault();
      goTo(Number(button.dataset.step));
    },true);

    stepper.addEventListener('keydown',event=>{
      const current=event.target.closest('[data-step]');
      if(!current||!['ArrowLeft','ArrowRight'].includes(event.key))return;
      event.preventDefault();
      const buttons=[...stepper.querySelectorAll('[data-step]')];
      const index=buttons.indexOf(current);
      const next=event.key==='ArrowRight'?Math.min(buttons.length-1,index+1):Math.max(0,index-1);
      buttons[next].focus();
      goTo(Number(buttons[next].dataset.step));
    });

    // Keep the lower navigation stages in sync while the user scrolls.
    if('IntersectionObserver' in window){
      const observed=[3,4].map(step=>({step,target:targetFor(step)})).filter(x=>x.target);
      const observer=new IntersectionObserver(entries=>{
        const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
        if(!visible)return;
        const match=observed.find(x=>x.target===visible.target);
        if(match)setActive(match.step);
      },{rootMargin:'-145px 0px -50% 0px',threshold:[.12,.35,.6]});
      observed.forEach(x=>observer.observe(x.target));
    }

    const initial=(typeof state!=='undefined'&&Number(state.activeStep))||1;
    setActive(Math.max(1,Math.min(4,initial)));
    console.info('Cardcraft Navigation V13 active');
  };

  boot();
})();
