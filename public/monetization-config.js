window.CARDCRAFT_MONETIZATION = {
  mode: 'demo', // web payment mode only; Android app will use Google Play Billing
  premiumPrice: 1900, // backward compatibility for the existing PNG gate
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

  // 웹 버전의 결제 식별자. Android 앱에서는 Google Play Billing으로 교체합니다.
  portOne: {
    storeId: '',
    channelKey: ''
  },

  // 웹 테스트용 Google Ad Manager rewarded inventory.
  // Android 앱에서는 AdMob Rewarded로 교체합니다.
  rewardedAd: {
    adUnitPath: '/22639388115/rewarded_web_example'
  },

  adminLoginUrl: '/admin/login',
  demoAdminCode: 'CARDCRAFT-DEMO'
};

// 현재 웹 프리뷰: 광고는 AI 디자인 생성, 결제는 파일 내보내기에 적용합니다.
(() => {
  if (!document.querySelector('link[data-cardcraft-monetization]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './monetization.css?v=11.0';
    link.dataset.cardcraftMonetization = '1';
    document.head.appendChild(link);
  }
  if (!document.querySelector('script[data-cardcraft-monetization]')) {
    const script = document.createElement('script');
    script.src = './monetization.js?v=11.0';
    script.defer = true;
    script.dataset.cardcraftMonetization = '1';
    script.onload = () => {
      if (!document.querySelector('script[data-cardcraft-v11-commerce]')) {
        const patch = document.createElement('script');
        patch.src = './v11-commerce-patch.js?v=11.0';
        patch.dataset.cardcraftV11Commerce = '1';
        document.body.appendChild(patch);
      }
    };
    document.head.appendChild(script);
  }
})();
