window.CARDCRAFT_AI = {
  mode: 'auto', // 'auto' | 'demo' | 'live'
  endpoint: '/api/ai/design',
  statusEndpoint: '/api/ai/status',
  provider: 'gemini',
  conceptsPerRequest: 4,
  requestTimeoutMs: 45000,
  sendLogoByDefault: true
};
