window.CARDCRAFT_MONETIZATION = {
  mode: 'demo', // web payment mode only; Android app uses Google Play Billing
  premiumPrice: 1900,
  currency: 'KRW',
  paymentProvider: 'portone-v2',
  rewardedAdProvider: 'google-ad-manager',

  products: {
    png: {
      product: 'png-download',
      androidProductId: 'cardcraft_export_png',
      price: 1900,
      label: '고해상도 PNG'
    },
    source: {
      product: 'vector-source',
      androidProductId: 'cardcraft_export_source',
      price: 3900,
      label: '편집용 벡터 원본'
    }
  },

  endpoints: {
    session: '/api/session',
    createOrder: '/api/payments/orders',
    completePayment: '/api/payments/complete',
    verifyReward: '/api/rewards/verify'
  },

  portOne: {
    storeId: '',
    channelKey: ''
  },

  // 웹 프리뷰용 보상형 테스트 지면. Android 앱은 네이티브 AdMob Rewarded를 우선 사용한다.
  rewardedAd: {
    adUnitPath: '/22639388115/rewarded_web_example'
  },

  adminLoginUrl: '/admin/login',
  demoAdminCode: 'CARDCRAFT-DEMO'
};

(() => {
  if (!document.querySelector('link[data-cardcraft-monetization]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './monetization.css?v=12.1';
    link.dataset.cardcraftMonetization = '1';
    document.head.appendChild(link);
  }
  if (!document.querySelector('script[data-cardcraft-monetization]')) {
    const script = document.createElement('script');
    script.src = './monetization.js?v=12.1';
    script.defer = true;
    script.dataset.cardcraftMonetization = '1';
    script.onload = () => {
      if (!document.querySelector('script[data-cardcraft-v11-commerce]')) {
        const patch = document.createElement('script');
        patch.src = './v11-commerce-patch.js?v=12.1';
        patch.dataset.cardcraftV11Commerce = '1';
        document.body.appendChild(patch);
      }
    };
    document.head.appendChild(script);
  }
})();
