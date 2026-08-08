window.CARDCRAFT_MONETIZATION = {
  mode: 'demo', // payment mode only; rewarded ads can run live independently
  premiumPrice: 1900,
  currency: 'KRW',
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
  // 실제 값을 입력하기 전에는 결제만 demo 모드로 유지합니다. API Secret은 절대 이 파일에 넣지 않습니다.
  portOne: {
    storeId: '',
    channelKey: ''
  },

  // Google Ad Manager 웹 보상형 광고 지면 경로.
  // 현재는 Google 공식 rewarded web 테스트 지면입니다.
  // 수익형 전환 시 이 값만 우리 Ad Manager의 /<network-code>/<ad-unit> 경로로 교체합니다.
  rewardedAd: {
    adUnitPath: '/22639388115/rewarded_web_example'
  },

  adminLoginUrl: '/admin/login',
  demoAdminCode: 'CARDCRAFT-DEMO'
};

// 광고는 디자인 생성, 결제는 최종 PNG 다운로드에만 적용합니다.
(() => {
  if (!document.querySelector('link[data-cardcraft-monetization]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './monetization.css?v=10.3';
    link.dataset.cardcraftMonetization = '1';
    document.head.appendChild(link);
  }
  if (!document.querySelector('script[data-cardcraft-monetization]')) {
    const script = document.createElement('script');
    script.src = './monetization.js?v=10.3';
    script.defer = true;
    script.dataset.cardcraftMonetization = '1';
    document.head.appendChild(script);
  }
})();
