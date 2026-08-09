(function cardcraftNativeAppBridge(){
  'use strict';
  const cap=window.Capacitor;
  const platform=cap?.getPlatform?.()||'';
  const isNative=platform==='android'||platform==='ios'||cap?.isNativePlatform?.()===true;
  window.CARDCRAFT_NATIVE={isNative,platform};
  if(!isNative)return;

  const invoke=(plugin,method,options={})=>{
    if(typeof cap?.nativePromise!=='function')return Promise.reject(new Error('CAPACITOR_NATIVE_BRIDGE_UNAVAILABLE'));
    return cap.nativePromise(plugin,method,options);
  };

  window.CardcraftNativeAds={
    mode:'google-test',
    available:()=>typeof cap?.nativePromise==='function',
    prepareRewarded:()=>invoke('CardcraftAds','prepareRewarded',{}),
    status:()=>invoke('CardcraftAds','adStatus',{}),
    showRewarded:()=>invoke('CardcraftAds','showRewarded',{})
  };

  window.CardcraftNativeBilling={
    available:()=>typeof cap?.nativePromise==='function',
    purchase:productId=>invoke('CardcraftBilling','purchase',{productId:String(productId||'')})
  };

  function bytesToBase64(bytes){
    let binary='';
    const chunk=0x8000;
    for(let i=0;i<bytes.length;i+=chunk){binary+=String.fromCharCode(...bytes.subarray(i,Math.min(i+chunk,bytes.length)));}
    return btoa(binary);
  }
  window.CardcraftNativeFiles={
    available:()=>typeof cap?.nativePromise==='function',
    async saveBlob(blob,name){
      const bytes=new Uint8Array(await blob.arrayBuffer());
      return invoke('CardcraftFiles','save',{name:String(name||'cardcraft-file'),mimeType:blob.type||'application/octet-stream',base64:bytesToBase64(bytes)});
    }
  };

  // 앱이 열린 직후 테스트 Rewarded를 미리 준비한다. 실패해도 앱 자체는 계속 동작한다.
  setTimeout(()=>{
    window.CardcraftNativeAds.prepareRewarded().then(result=>{
      window.CARDCRAFT_NATIVE_AD_STATUS={ok:true,...result};
      console.info('Cardcraft rewarded test ad ready',result);
    }).catch(error=>{
      window.CARDCRAFT_NATIVE_AD_STATUS={ok:false,error:String(error?.message||error)};
      console.warn('Cardcraft rewarded test ad warmup failed',error);
    });
  },700);

  // 기존 웹 export의 blob 다운로드를 Android Downloads/Cardcraft 저장으로 연결한다.
  const blobUrls=new Map();
  const nativeCreateObjectURL=URL.createObjectURL.bind(URL);
  const nativeRevokeObjectURL=URL.revokeObjectURL.bind(URL);
  URL.createObjectURL=function(value){const url=nativeCreateObjectURL(value);if(value instanceof Blob)blobUrls.set(url,value);return url;};
  URL.revokeObjectURL=function(url){blobUrls.delete(url);return nativeRevokeObjectURL(url);};
  const anchorClick=HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click=function(){
    const blob=blobUrls.get(this.href);
    if(blob&&this.download&&window.CardcraftNativeFiles.available()){
      window.CardcraftNativeFiles.saveBlob(blob,this.download).catch(error=>console.error('Cardcraft native download failed',error));
      return;
    }
    return anchorClick.call(this);
  };

  document.documentElement.classList.add('cardcraft-native-app');
  console.info('Cardcraft native bridge active',platform);
})();
