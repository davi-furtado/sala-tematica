(() => {
  'use strict';

  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const N = 26;
  const STEP_DEG = 360 / N;
  const A_UPPER = 65, Z_UPPER = 90, A_LOWER = 97, Z_LOWER = 122;
  const OUTER_RADIUS = 148;
  const INNER_RADIUS = 100;

  // ---------- cifra de César ----------

  function shiftText(text, n) {
    const norm = ((n % N) + N) % N;
    let out = '';
    for (const ch of text) {
      const code = ch.charCodeAt(0);
      if (code >= A_UPPER && code <= Z_UPPER) {
        out += String.fromCharCode(((code - A_UPPER + norm) % N) + A_UPPER);
      } else if (code >= A_LOWER && code <= Z_LOWER) {
        out += String.fromCharCode(((code - A_LOWER + norm) % N) + A_LOWER);
      } else {
        out += ch;
      }
    }
    return out;
  }

  function hasNonLetterNonSpace(text) {
    for (const ch of text) {
      const code = ch.charCodeAt(0);
      const isUpper = code >= A_UPPER && code <= Z_UPPER;
      const isLower = code >= A_LOWER && code <= Z_LOWER;
      if (!isUpper && !isLower && ch !== ' ') return true;
    }
    return false;
  }

  // ---------- elementos ----------

  const wheelEl = document.getElementById('wheel');
  const ringOuter = document.getElementById('ring-outer');
  const ringInner = document.getElementById('ring-inner');
  const wheelCenterValue = document.getElementById('wheel-center-value');
  const wheelCenterLabel = document.querySelector('.wheel-center-label');

  const shiftValueEl = document.getElementById('shift-value');
  const btnShiftUp = document.getElementById('btn-shift-up');
  const btnShiftDown = document.getElementById('btn-shift-down');

  const tabCifrar = document.getElementById('tab-cifrar');
  const tabDecifrar = document.getElementById('tab-decifrar');
  const panelCifrar = document.getElementById('panel-cifrar');
  const panelDecifrar = document.getElementById('panel-decifrar');

  const inputPlain = document.getElementById('input-plain');
  const outputCipher = document.getElementById('output-cipher');
  const btnCopy = document.getElementById('btn-copy');

  const inputCipher = document.getElementById('input-cipher');
  const outputDecipher = document.getElementById('output-decipher');
  const btnShowAll = document.getElementById('btn-show-all');
  const allShiftsWrap = document.getElementById('all-shifts-wrap');
  const allShiftsBody = document.getElementById('all-shifts-body');

  const noteNonLetter = document.getElementById('note-nonletter');

  // ---------- construção da roda ----------

  let outerLabels = [];
  let innerLabels = [];

  function buildRing(container, radius) {
    const labels = [];
    for (let i = 0; i < N; i++) {
      const angleDeg = i * STEP_DEG;

      const slot = document.createElement('div');
      slot.className = 'letter-slot';
      slot.style.transform = `rotate(${angleDeg}deg) translateY(${-radius}px)`;

      const label = document.createElement('div');
      label.className = 'letter-label';
      label.textContent = ALPHABET[i];
      label.style.transform = `rotate(${-angleDeg}deg)`;

      slot.appendChild(label);
      container.appendChild(slot);
      labels.push(label);
    }
    return labels;
  }

  function updateInnerRotation(shift) {
    // negativo: girar o disco em sentido horário aumenta o deslocamento,
    // e cada letra usa a mesma variável pra permanecer na vertical
    const shiftDeg = -shift * STEP_DEG;
    ringInner.style.setProperty('--shift-deg', `${shiftDeg}deg`);
    innerLabels.forEach((label, i) => {
      const angleDeg = i * STEP_DEG;
      label.style.transform = `rotate(${-angleDeg - shiftDeg}deg)`;
    });
  }

  // ---------- estado do deslocamento ----------

  let currentShift = 0;
  let hoveringOuterIndex = null;

  function setShift(newShift) {
    currentShift = ((newShift % N) + N) % N;
    shiftValueEl.textContent = String(currentShift);
    updateInnerRotation(currentShift);
    if (hoveringOuterIndex === null) {
      wheelCenterValue.textContent = String(currentShift);
    } else {
      updateCenterMapping(hoveringOuterIndex);
    }
    updateOutputs();
  }

  function updateCenterMapping(outerIndex) {
    const cipherIndex = (outerIndex + currentShift) % N;
    wheelCenterLabel.textContent = '';
    wheelCenterValue.textContent = `${ALPHABET[outerIndex]} → ${ALPHABET[cipherIndex]}`;
  }

  function clearCenterMapping() {
    wheelCenterLabel.textContent = 'deslocamento';
    wheelCenterValue.textContent = String(currentShift);
  }

  // ---------- hover/toque nas letras do anel externo ----------

  function highlightPair(outerIndex) {
    outerLabels.forEach((label) => label.classList.remove('highlight'));
    innerLabels.forEach((label) => label.classList.remove('highlight'));
    if (outerIndex === null) return;
    const cipherIndex = (outerIndex + currentShift) % N;
    outerLabels[outerIndex].classList.add('highlight');
    innerLabels[cipherIndex].classList.add('highlight');
  }

  function onOuterEnter(index) {
    hoveringOuterIndex = index;
    highlightPair(index);
    updateCenterMapping(index);
  }

  function onOuterLeave() {
    hoveringOuterIndex = null;
    highlightPair(null);
    clearCenterMapping();
  }

  // ---------- arraste (mouse e toque) ----------

  let isDragging = false;
  let lastPointerAngle = 0;
  let accumulatedRingRotation = 0;

  function getEventPoint(e) {
    if (e.touches && e.touches.length) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }

  function pointerAngle(x, y) {
    const rect = wheelEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = x - cx;
    const dy = y - cy;
    return Math.atan2(dx, -dy) * (180 / Math.PI); // 0 = topo, sentido horário positivo
  }

  function wrapDelta(deg) {
    let d = deg % 360;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    return d;
  }

  function onDragStart(e) {
    isDragging = true;
    wheelEl.classList.add('dragging');
    const p = getEventPoint(e);
    lastPointerAngle = pointerAngle(p.x, p.y);
    accumulatedRingRotation = -currentShift * STEP_DEG;
    if (e.cancelable) e.preventDefault();
  }

  function onDragMove(e) {
    if (!isDragging) return;
    const p = getEventPoint(e);
    const angle = pointerAngle(p.x, p.y);
    const delta = wrapDelta(angle - lastPointerAngle);
    accumulatedRingRotation += delta;
    lastPointerAngle = angle;

    const candidateShift = Math.round(-accumulatedRingRotation / STEP_DEG);
    const normalized = ((candidateShift % N) + N) % N;
    if (normalized !== currentShift) {
      setShift(normalized);
    }
    if (e.cancelable) e.preventDefault();
  }

  function onDragEnd() {
    isDragging = false;
    wheelEl.classList.remove('dragging');
  }

  wheelEl.addEventListener('mousedown', onDragStart);
  window.addEventListener('mousemove', onDragMove);
  window.addEventListener('mouseup', onDragEnd);

  wheelEl.addEventListener('touchstart', onDragStart, { passive: false });
  window.addEventListener('touchmove', onDragMove, { passive: false });
  window.addEventListener('touchend', onDragEnd);
  window.addEventListener('touchcancel', onDragEnd);

  // ---------- botões +1 / -1 ----------

  btnShiftUp.addEventListener('click', () => setShift(currentShift + 1));
  btnShiftDown.addEventListener('click', () => setShift(currentShift - 1));

  // ---------- abas (Cifrar / Decifrar) ----------

  const tabs = [
    { tab: tabCifrar, panel: panelCifrar },
    { tab: tabDecifrar, panel: panelDecifrar },
  ];

  function activateTab(index) {
    tabs.forEach(({ tab, panel }, i) => {
      const active = i === index;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      panel.hidden = !active;
    });
  }

  tabCifrar.addEventListener('click', () => activateTab(0));
  tabDecifrar.addEventListener('click', () => activateTab(1));

  // ---------- saídas ao vivo ----------

  let nonLetterNoteShown = false;

  function checkNonLetterNote() {
    if (nonLetterNoteShown) return;
    if (hasNonLetterNonSpace(inputPlain.value) || hasNonLetterNonSpace(inputCipher.value)) {
      nonLetterNoteShown = true;
      noteNonLetter.hidden = false;
    }
  }

  function updateOutputs() {
    outputCipher.textContent = shiftText(inputPlain.value, currentShift);
    outputDecipher.textContent = shiftText(inputCipher.value, -currentShift);
    checkNonLetterNote();
    if (!allShiftsWrap.hidden) {
      renderAllShiftsTable();
    }
  }

  inputPlain.addEventListener('input', updateOutputs);
  inputCipher.addEventListener('input', updateOutputs);

  // ---------- copiar texto cifrado ----------

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      // silencioso: cópia é uma conveniência, não uma função crítica
    }
    document.body.removeChild(ta);
  }

  function showCopiedFeedback() {
    const original = btnCopy.textContent;
    btnCopy.textContent = 'Copiado!';
    btnCopy.classList.add('copied');
    setTimeout(() => {
      btnCopy.textContent = original;
      btnCopy.classList.remove('copied');
    }, 1200);
  }

  btnCopy.addEventListener('click', () => {
    const text = outputCipher.textContent;
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(showCopiedFeedback).catch(() => {
        fallbackCopy(text);
        showCopiedFeedback();
      });
    } else {
      fallbackCopy(text);
      showCopiedFeedback();
    }
  });

  // ---------- as 26 possibilidades ----------

  function renderAllShiftsTable() {
    allShiftsBody.innerHTML = '';
    const rows = [];
    for (let s = 0; s < N; s++) {
      const tr = document.createElement('tr');

      const tdShift = document.createElement('td');
      tdShift.className = 'shift-cell';
      tdShift.textContent = String(s);

      const tdResult = document.createElement('td');
      tdResult.className = 'result-cell';
      tdResult.textContent = shiftText(inputCipher.value, -s);

      tr.appendChild(tdShift);
      tr.appendChild(tdResult);
      rows.push(tr);
    }
    allShiftsBody.append(...rows);
  }

  btnShowAll.addEventListener('click', () => {
    const willShow = allShiftsWrap.hidden;
    allShiftsWrap.hidden = !willShow;
    btnShowAll.textContent = willShow ? 'Esconder as 26 possibilidades' : 'Mostrar as 26 possibilidades';
    if (willShow) renderAllShiftsTable();
  });

  // ---------- inicialização ----------

  outerLabels = buildRing(ringOuter, OUTER_RADIUS);
  innerLabels = buildRing(ringInner, INNER_RADIUS);

  outerLabels.forEach((label, i) => {
    label.addEventListener('mouseenter', () => onOuterEnter(i));
    label.addEventListener('mouseleave', onOuterLeave);
    label.addEventListener('touchstart', () => {
      onOuterEnter(i);
    }, { passive: true });
  });

  setShift(0);
  updateOutputs();
})();
