window.CARDCRAFT_AI = {
  mode: 'auto', // 'auto' | 'demo' | 'live'
  endpoint: '/api/ai/design',
  statusEndpoint: '/api/ai/status',
  provider: 'gemini',
  conceptsPerRequest: 4,
  requestTimeoutMs: 45000,
  sendLogoByDefault: true
};

/*
 * V10 layout bridge
 *
 * The AI copilot returns semantic design families (minimal, premium, travel,
 * editorial, etc.), while the legacy renderer draws from Cardcraft's 100
 * concrete templates. V10 originally previewed every AI concept through the
 * single currently-selected template, which made materially different Gemini
 * concepts look almost identical. This bridge maps each AI concept to a real,
 * distinct template and applies that template together with the AI palette.
 */
window.addEventListener('load', () => {
  const results = document.getElementById('v10AiResults');
  if (!results || typeof LIBRARY === 'undefined' || typeof renderCard !== 'function') return;

  const FAMILY_CATEGORY = {
    minimal: 'minimal',
    institution: 'classic',
    dual: 'classic',
    bands: 'modern',
    editorial: 'creative',
    premium: 'classic',
    travel: 'creative',
    bold: 'modern',
    split: 'modern'
  };

  const FAMILY_LAYOUTS = {
    minimal: [0, 5, 12, 18, 2],
    institution: [7, 9, 15, 1, 12],
    dual: [9, 1, 6, 17, 10],
    bands: [10, 15, 3, 11, 17],
    editorial: [11, 14, 8, 18, 16],
    premium: [7, 18, 5, 12, 15],
    travel: [16, 4, 6, 17, 13],
    bold: [14, 6, 17, 3, 10],
    split: [1, 9, 6, 17, 11]
  };

  const hash = value => {
    let h = 2166136261;
    for (const ch of String(value || '')) {
      h ^= ch.charCodeAt(0);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };

  const templateFor = (concept, index = 0) => {
    const family = concept?.family || 'minimal';
    const category = FAMILY_CATEGORY[family] || 'minimal';
    const layouts = FAMILY_LAYOUTS[family] || FAMILY_LAYOUTS.minimal;
    const generationSalt = hash(`${concept?.id || ''}|${concept?.title || ''}|${concept?.rationale || ''}`);
    const offset = generationSalt % layouts.length;
    const layout = layouts[(index + offset) % layouts.length];
    return LIBRARY.find(t => t.category === category && t.layout === layout)
      || LIBRARY.find(t => t.category === category)
      || LIBRARY[0];
  };

  const conceptCustom = concept => ({
    orientation: concept?.orientation || state.custom.orientation || 'horizontal',
    designFamily: concept?.family || 'minimal',
    brandDirection: concept?.brandDirection || 'matched',
    primary: concept?.palette?.primary || state.custom.primary,
    secondaryColor: concept?.palette?.secondary || state.custom.secondaryColor || '#0f766e',
    accentColor: concept?.palette?.accent || state.custom.accentColor || '#f59e0b',
    background: concept?.palette?.background || state.custom.background || '#ffffff',
    text: concept?.palette?.text || state.custom.text || '#101828',
    secondaryText: concept?.palette?.secondaryText || state.custom.secondaryText || '#667085',
    forceBackground: true,
    fontCompany: concept?.typography?.company || state.custom.fontCompany,
    fontName: concept?.typography?.name || state.custom.fontName,
    fontTitle: concept?.typography?.title || state.custom.fontTitle,
    fontContact: concept?.typography?.contact || state.custom.fontContact,
    fontAddress: concept?.typography?.address || state.custom.fontAddress,
    fontSlogan: concept?.typography?.slogan || state.custom.fontSlogan,
    showSecondaryLogo: !!concept?.logos?.showSecondary && !!state.data.secondaryLogoDataUrl,
    secondaryLogoPosition: concept?.logos?.secondaryPosition || 'top-right',
    secondaryLogoScale: Number(concept?.logos?.secondaryScale) || 1
  });

  const currentConcepts = () => Array.isArray(state?.custom?.aiConcepts) ? state.custom.aiConcepts : [];

  function repaintConceptPreviews() {
    const concepts = currentConcepts();
    if (!concepts.length) return;
    const cards = [...results.querySelectorAll('[data-ai-concept]')];
    cards.forEach((card, index) => {
      const id = card.getAttribute('data-ai-concept');
      const concept = concepts.find(c => String(c.id) === String(id)) || concepts[index];
      if (!concept) return;
      const host = card.querySelector('.v10-concept-preview');
      if (!host) return;
      const template = templateFor(concept, index);
      const custom = conceptCustom(concept);
      const oldCustom = {};
      Object.keys(custom).forEach(key => oldCustom[key] = state.custom[key]);
      try {
        Object.assign(state.custom, custom);
        host.innerHTML = renderCard(template, 'front', true);
        host.dataset.templateId = template.id;
        host.title = `${template.label} · ${concept.family || 'minimal'}`;
      } finally {
        Object.assign(state.custom, oldCustom);
      }
    });
  }

  let repaintTimer = 0;
  const scheduleRepaint = () => {
    clearTimeout(repaintTimer);
    repaintTimer = setTimeout(repaintConceptPreviews, 30);
  };

  new MutationObserver(scheduleRepaint).observe(results, { childList: true, subtree: true });

  results.addEventListener('click', event => {
    const button = event.target.closest('[data-ai-apply]');
    if (!button) return;

    const concepts = currentConcepts();
    const index = Math.max(0, concepts.findIndex(c => String(c.id) === String(button.dataset.aiApply)));
    const concept = concepts[index];
    if (!concept) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const template = templateFor(concept, index);
    Object.assign(state.custom, conceptCustom(concept));
    state.custom.aiSelectedId = concept.id;
    state.selectedId = template.id;
    state.category = template.category;
    state.activeStep = 4;
    state.recommendationSeed = (Date.now() % 1000000) + index * 7919;

    if (typeof buildRecommendations === 'function') {
      buildRecommendations();
      state.selectedId = template.id;
    }
    if (typeof persist === 'function') persist();
    if (typeof renderAll === 'function') renderAll();
    if (typeof showToast === 'function') {
      showToast(`AI 제안 '${concept.title || '디자인'}'을 ${template.label} 레이아웃으로 적용했습니다.`, 4800);
    }
    scheduleRepaint();
  }, true);

  scheduleRepaint();
  console.info('Cardcraft V10 distinct-layout bridge active');
});

// Cache-busted final editor loader. This uses a new asset path so stale 404s
// from the earlier editor bundle cannot suppress the final-edit controls.
(() => {
  const id='cardcraft-editor-v11-loader';
  if(document.getElementById(id)) return;
  const script=document.createElement('script');
  script.id=id;
  script.src='/editor-v11.js?v=20260807-1131';
  script.async=false;
  document.head.appendChild(script);
})();
