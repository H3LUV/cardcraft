window.CARDCRAFT_MONETIZATION = {
  mode: 'demo', // 'demo' | 'live'
  premiumPrice: 1900,
  currency: 'KRW',
  paidUnlockHours: 24,
  paymentProvider: 'portone-v2',
  rewardedAdProvider: 'google-ad-manager',

  // 일반 사용자는 로그인하지 않습니다. 운영 환경에서는 아래 API가 주문·결제를 검증합니다.
  endpoints: {
    session: '/api/session',
    createOrder: '/api/payments/orders',
    completePayment: '/api/payments/complete',
    verifyReward: '/api/rewards/verify'
  },

  // 포트원 Store ID와 Channel Key는 브라우저에 노출 가능한 식별자입니다.
  // 실제 값을 입력하기 전에는 demo 모드로 두세요. API Secret은 절대 이 파일에 넣지 않습니다.
  portOne: {
    storeId: '',
    channelKey: ''
  },

  // Google Ad Manager 웹 보상형 광고 지면 경로.
  // 예: /1234567/cardcraft_rewarded
  rewardedAd: {
    adUnitPath: ''
  },

  // 운영 관리자 로그인 주소. Cloudflare Access로 보호된 경로를 연결합니다.
  adminLoginUrl: '/admin/login',

  // 데모 ZIP에서만 사용하는 관리자 테스트 코드입니다. live 모드에서는 완전히 무시됩니다.
  demoAdminCode: 'CARDCRAFT-DEMO'
};

// 수익화 UI는 기존 Cardcraft 본체와 분리해 로드합니다.
(() => {
  if (!document.querySelector('link[data-cardcraft-monetization]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './monetization.css?v=10.1';
    link.dataset.cardcraftMonetization = '1';
    document.head.appendChild(link);
  }
  if (!document.querySelector('script[data-cardcraft-monetization]')) {
    const script = document.createElement('script');
    script.src = './monetization.js?v=10.1';
    script.defer = true;
    script.dataset.cardcraftMonetization = '1';
    document.head.appendChild(script);
  }
})();
