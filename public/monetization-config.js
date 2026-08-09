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
    link.href = './monetization.css?v=12.6.1';
    link.dataset.cardcraftMonetization = '1';
    document.head.appendChild(link);
  }

  const loadMonetization = () => {
    if (document.querySelector('script[data-cardcraft-monetization]')) return;
    const script = document.createElement('script');
    script.src = './monetization.js?v=12.6.1';
    script.defer = true;
    script.dataset.cardcraftMonetization = '1';
    script.onload = () => {
      if (!document.querySelector('script[data-cardcraft-v11-commerce]')) {
        const patch = document.createElement('script');
        patch.src = './v11-commerce-patch.js?v=12.6.1';
        patch.dataset.cardcraftV11Commerce = '1';
        document.body.appendChild(patch);
      }
    };
    document.head.appendChild(script);
  };

  if (!document.querySelector('script[data-cardcraft-v126-ad-placement]')) {
    const placement = document.createElement('script');
    placement.src = './v12.6-ad-placement.js?v=12.6.1';
    placement.async = false;
    placement.dataset.cardcraftV126AdPlacement = '1';
    placement.onload = loadMonetization;
    placement.onerror = loadMonetization;
    document.head.appendChild(placement);
  } else {
    loadMonetization();
  }

  if (!document.querySelector('link[data-cardcraft-v122-fixes]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './v12.2-fixes.css?v=12.6.1';
    link.dataset.cardcraftV122Fixes = '1';
    document.head.appendChild(link);
  }
  if (!document.querySelector('script[data-cardcraft-v122-fixes]')) {
    const fixes = document.createElement('script');
    fixes.src = './v12.2-fixes.js?v=12.6.1';
    fixes.async = false;
    fixes.dataset.cardcraftV122Fixes = '1';
    document.head.appendChild(fixes);
  }

  if (!document.querySelector('link[data-cardcraft-v123-faces]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './v12.3-faces.css?v=12.6.1';
    link.dataset.cardcraftV123Faces = '1';
    document.head.appendChild(link);
  }
  if (!document.querySelector('script[data-cardcraft-v123-faces]')) {
    const faces = document.createElement('script');
    faces.src = './v12.3-faces.js?v=12.6.1';
    faces.async = false;
    faces.dataset.cardcraftV123Faces = '1';
    document.head.appendChild(faces);
  }

  if (!document.querySelector('link[data-cardcraft-v124-parity]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './v12.4-style-parity.css?v=12.6.1';
    link.dataset.cardcraftV124Parity = '1';
    document.head.appendChild(link);
  }
  if (!document.querySelector('script[data-cardcraft-v124-parity]')) {
    const parity = document.createElement('script');
    parity.src = './v12.4-style-parity.js?v=12.6.1';
    parity.async = false;
    parity.dataset.cardcraftV124Parity = '1';
    document.head.appendChild(parity);
  }

  if (!document.querySelector('script[data-cardcraft-v125-adtest]')) {
    const adTest = document.createElement('script');
    adTest.src = './v12.5-ad-test.js?v=12.6.1';
    adTest.async = false;
    adTest.dataset.cardcraftV125Adtest = '1';
    document.head.appendChild(adTest);
  }
})();
