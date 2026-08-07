(function positionFinalEditorLast(){
  'use strict';

  function moveEditorToBottom(){
    const main=document.querySelector('main');
    const editor=document.getElementById('cardcraftFinalEditorV12');
    if(!main||!editor)return false;

    // Keep FINAL EDIT as the true last workflow section inside <main>.
    if(editor.parentElement!==main || main.lastElementChild!==editor){
      main.appendChild(editor);
    }

    editor.classList.add('cc12-final-bottom');
    return true;
  }

  const style=document.createElement('style');
  style.textContent=`
    #cardcraftFinalEditorV12.cc12-final-bottom{
      margin-top:28px;
      margin-bottom:34px;
      width:100%;
    }
    #cardcraftFinalEditorV12.cc12-final-bottom::before{
      content:'';
      display:block;
      height:1px;
      margin:-16px 0 24px;
      background:linear-gradient(90deg,transparent,#d0d5dd 12%,#d0d5dd 88%,transparent);
    }
  `;
  document.head.appendChild(style);

  let tries=0;
  const timer=setInterval(()=>{
    tries++;
    if(moveEditorToBottom()||tries>80)clearInterval(timer);
  },100);

  // Other enhancement bundles may insert sections after initial load.
  // Re-assert FINAL EDIT as the last workflow step whenever <main> changes.
  const mainWait=setInterval(()=>{
    const main=document.querySelector('main');
    if(!main)return;
    clearInterval(mainWait);
    let queued=false;
    new MutationObserver(()=>{
      if(queued)return;
      queued=true;
      requestAnimationFrame(()=>{
        queued=false;
        moveEditorToBottom();
      });
    }).observe(main,{childList:true});
    moveEditorToBottom();
  },100);
})();
