(() => {
  'use strict';

  // ---------- constantes (edite aqui) ----------

  const KB = 1024;
  const MB = KB * 1024;
  const GB = MB * 1024;
  const TB = GB * 1024;
  const PB = TB * 1024;
  const EB = PB * 1024;
  const BITS_PER_BYTE = 8;

  const MEDIA = [
    { id: 'floppy', label: 'Disquete', article: 'Um', capacity: 1.44 * MB, icon: 'floppy' },
    { id: 'cd', label: 'CD', article: 'Um', capacity: 700 * MB, icon: 'disc' },
    { id: 'dvd', label: 'DVD', article: 'Um', capacity: 4.7 * GB, icon: 'disc' },
    { id: 'pendrive', label: 'Pen drive', article: 'Um', capacity: 32 * GB, icon: 'usb' },
    { id: 'hd', label: 'HD externo', article: 'Um', capacity: 1 * TB, icon: 'hdd' },
    { id: 'cloud', label: 'Nuvem', article: 'A', capacity: Infinity, icon: 'infinity' },
  ];

  const CONTENT_TYPES = [
    { id: 'photo', label: 'fotos', singular: 'foto', gender: 'f', size: 5 * MB, icon: 'photo' },
    { id: 'song', label: 'músicas', singular: 'música', gender: 'f', size: 4 * MB, icon: 'music' },
    { id: 'shortvideo', label: 'vídeos curtos', singular: 'vídeo curto', gender: 'm', size: 200 * MB, icon: 'shortvideo' },
    { id: 'movie', label: 'filmes em HD', singular: 'filme em HD', gender: 'm', size: 4 * GB, icon: 'movie' },
  ];

  const MAX_ICONS = 180;       // quantos ícones no máximo renderizamos de fato
  const TOTAL_ANIM_MS = 1200;  // duração total da cascata, mesmo com muitos ícones
  const MAX_STAGGER_MS = 50;   // atraso máximo entre um ícone e o próximo

  // ---------- ícones (SVG inline, sem dependência externa) ----------

  const MEDIA_ICONS = {
    floppy: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="8" y="8" width="32" height="32" rx="2"/><rect x="16" y="8" width="16" height="10"/><rect x="20" y="11" width="4" height="4" fill="currentColor" stroke="none"/><rect x="13" y="24" width="22" height="12" rx="1"/></svg>`,
    disc: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><circle cx="24" cy="24" r="16"/><circle cx="24" cy="24" r="4"/></svg>`,
    usb: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="14" y="12" width="20" height="26" rx="4"/><rect x="20" y="4" width="8" height="10" rx="1"/></svg>`,
    hdd: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="6" y="15" width="36" height="20" rx="4"/><circle cx="14" cy="25" r="2" fill="currentColor" stroke="none"/><line x1="20" y1="25" x2="36" y2="25"/></svg>`,
  };

  const CONTENT_ICONS = {
    photo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
    music: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
    shortvideo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polygon points="10 8 16 12 10 16 10 8"/></svg>`,
    movie: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8l2-4h3l-2 4z"/><path d="M9 8l2-4h3l-2 4z"/><path d="M15 8l2-4h3l-2 4z"/><rect x="3" y="8" width="18" height="12" rx="1"/></svg>`,
  };

  // ---------- cálculos ----------

  function calcQuantity(media, contentType) {
    if (media.capacity === Infinity) return Infinity;
    return Math.floor(media.capacity / contentType.size);
  }

  function niceRoundDown(n) {
    if (n < 100) return Math.floor(n / 10) * 10;
    const digits = Math.floor(Math.log10(n));
    const magnitude = Math.pow(10, digits - 1);
    return Math.floor(n / magnitude) * magnitude;
  }

  function formatNumber(n) {
    return n.toLocaleString('pt-BR');
  }

  function buildSentence(media, contentType, quantity) {
    if (quantity === Infinity) {
      return `${media.article} ${media.label} guarda quantas ${contentType.label} você quiser.`;
    }
    if (quantity === 0) {
      const rawPercent = (media.capacity / contentType.size) * 100;
      const roundedPercent = Math.round(rawPercent);
      const percentText = roundedPercent < 1 ? 'menos de 1%' : `${roundedPercent}%`;
      const article = contentType.gender === 'f' ? 'uma' : 'um';
      const whole = contentType.gender === 'f' ? 'inteira' : 'inteiro';
      const pronoun = contentType.gender === 'f' ? 'dela' : 'dele';
      return `${media.article} ${media.label} nem guarda ${article} ${contentType.singular} ${whole} — cabem só ${percentText} ${pronoun}.`;
    }
    const label = quantity === 1 ? contentType.singular : contentType.label;
    return `${media.article} ${media.label} guarda aproximadamente ${formatNumber(quantity)} ${label}.`;
  }

  function buildOverlayText(contentType, quantity) {
    if (quantity === Infinity) {
      return `${contentType.label}: quantas você quiser`;
    }
    return `mais de ${formatNumber(niceRoundDown(quantity))} ${contentType.label}`;
  }

  // ---------- elementos ----------

  const mediaCardsEl = document.getElementById('media-cards');
  const contentTabsEl = document.getElementById('content-tabs');
  const fillContainer = document.getElementById('fill-container');
  const fillOverlay = document.getElementById('fill-overlay');
  const fillSentence = document.getElementById('fill-sentence');
  const funFact = document.getElementById('fun-fact');
  const scaleTableBody = document.getElementById('scale-table-body');

  // ---------- construção dos cartões de mídia ----------

  const mediaButtons = [];

  MEDIA.forEach((media, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'media-card';
    btn.setAttribute('role', 'option');
    btn.setAttribute('aria-selected', 'false');
    btn.tabIndex = index === 0 ? 0 : -1;

    const iconWrap = document.createElement('div');
    if (media.icon === 'infinity') {
      iconWrap.className = 'media-card-infinity';
      iconWrap.textContent = '∞';
    } else {
      iconWrap.className = 'media-card-icon';
      iconWrap.innerHTML = MEDIA_ICONS[media.icon];
    }

    const label = document.createElement('span');
    label.className = 'media-card-label';
    label.textContent = media.label;

    const capacity = document.createElement('span');
    capacity.className = 'media-card-capacity';
    capacity.textContent = media.capacity === Infinity ? 'sob demanda' : formatCapacity(media.capacity);

    btn.appendChild(iconWrap);
    btn.appendChild(label);
    btn.appendChild(capacity);

    btn.addEventListener('click', () => selectMedia(index));
    mediaCardsEl.appendChild(btn);
    mediaButtons.push(btn);
  });

  function formatCapacity(bytes) {
    if (bytes >= TB) return `${(bytes / TB).toFixed(bytes % TB === 0 ? 0 : 1)} TB`;
    if (bytes >= GB) return `${(bytes / GB).toFixed(bytes % GB === 0 ? 0 : 1)} GB`;
    if (bytes >= MB) return `${(bytes / MB).toFixed(bytes % MB === 0 ? 0 : 2)} MB`;
    return `${(bytes / KB).toFixed(0)} KB`;
  }

  mediaCardsEl.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = e.key === 'ArrowRight'
      ? (currentMediaIndex + 1) % MEDIA.length
      : (currentMediaIndex - 1 + MEDIA.length) % MEDIA.length;
    mediaButtons[next].focus();
    selectMedia(next);
  });

  // ---------- construção das abas de conteúdo ----------

  const contentButtons = [];

  CONTENT_TYPES.forEach((ct, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'content-tab';
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', 'false');

    const icon = document.createElement('span');
    icon.innerHTML = CONTENT_ICONS[ct.icon];

    const label = document.createElement('span');
    label.textContent = ct.label;

    btn.appendChild(icon);
    btn.appendChild(label);
    btn.addEventListener('click', () => selectContent(index));
    contentTabsEl.appendChild(btn);
    contentButtons.push(btn);
  });

  // ---------- estado ----------

  let currentMediaIndex = 0;
  let currentContentIndex = 0;

  function selectMedia(index) {
    currentMediaIndex = index;
    mediaButtons.forEach((btn, i) => {
      const active = i === index;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', String(active));
      btn.tabIndex = active ? 0 : -1;
    });
    renderFill();
  }

  function selectContent(index) {
    currentContentIndex = index;
    contentButtons.forEach((btn, i) => {
      const active = i === index;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', String(active));
    });
    renderFill();
  }

  // ---------- preenchimento animado ----------

  function renderFill() {
    const media = MEDIA[currentMediaIndex];
    const contentType = CONTENT_TYPES[currentContentIndex];
    const quantity = calcQuantity(media, contentType);

    fillContainer.innerHTML = '';
    fillOverlay.hidden = true;

    fillSentence.textContent = buildSentence(media, contentType, quantity);

    if (quantity === 0) return;

    const renderCount = quantity === Infinity ? MAX_ICONS : Math.min(quantity, MAX_ICONS);
    const staggerMs = Math.min(MAX_STAGGER_MS, TOTAL_ANIM_MS / renderCount);

    const icons = [];
    for (let i = 0; i < renderCount; i++) {
      const icon = document.createElement('div');
      icon.className = 'fill-icon';
      icon.innerHTML = CONTENT_ICONS[contentType.icon];
      icon.style.animationDelay = `${Math.round(i * staggerMs)}ms`;
      icons.push(icon);
    }
    fillContainer.append(...icons);

    if (quantity === Infinity || quantity > MAX_ICONS) {
      fillOverlay.textContent = buildOverlayText(contentType, quantity);
      fillOverlay.hidden = false;
    }
  }

  // ---------- fato extra fixo ----------

  function renderFunFact() {
    const floppy = MEDIA.find((m) => m.id === 'floppy');
    const floppiesPerGB = Math.round(GB / floppy.capacity);
    funFact.textContent = `Para guardar 1 GB, você precisaria de aproximadamente ${formatNumber(floppiesPerGB)} disquetes.`;
  }

  // ---------- painel de escala de dados ----------

  function renderScaleTable() {
    const scale = [
      { unit: '1 bit', equivalent: '0 ou 1 — a menor unidade' },
      { unit: '1 byte', equivalent: `${BITS_PER_BYTE} bits` },
      { unit: '1 KB', equivalent: `${formatNumber(KB)} bytes` },
      { unit: '1 MB', equivalent: `${formatNumber(MB / KB)} KB` },
      { unit: '1 GB', equivalent: `${formatNumber(GB / MB)} MB` },
      { unit: '1 TB', equivalent: `${formatNumber(TB / GB)} GB` },
      { unit: '1 PB', equivalent: `${formatNumber(PB / TB)} TB` },
      { unit: '1 EB', equivalent: `${formatNumber(EB / PB)} PB` },
    ];

    const rows = scale.map(({ unit, equivalent }) => {
      const tr = document.createElement('tr');

      const tdUnit = document.createElement('td');
      tdUnit.className = 'unit-cell';
      tdUnit.textContent = unit;

      const tdEquivalent = document.createElement('td');
      tdEquivalent.className = 'equivalent-cell';
      tdEquivalent.textContent = equivalent;

      tr.appendChild(tdUnit);
      tr.appendChild(tdEquivalent);
      return tr;
    });

    scaleTableBody.append(...rows);
  }

  // ---------- inicialização ----------

  selectMedia(0);
  selectContent(0);
  renderFunFact();
  renderScaleTable();
})();
