(() => {
  'use strict';

  const encoder = new TextEncoder();

  // ---------- Parte 1: nome -> bytes ----------

  const input = document.getElementById('input-nome');
  const linhas = document.getElementById('linhas');
  const btnReset = document.getElementById('btn-reset');

  const CHAR_STEP_MS = 260;   // intervalo entre o início da animação de cada caractere
  const BIT_STEP_MS = 22;     // intervalo entre acender cada LED dentro de um byte

  let debounceTimer = null;
  let renderToken = 0; // invalida animações pendentes de uma renderização anterior

  function bitsOfByte(byte) {
    const bits = [];
    for (let i = 7; i >= 0; i--) {
      bits.push((byte >> i) & 1);
    }
    return bits;
  }

  function buildByteRow(byte) {
    const row = document.createElement('div');
    row.className = 'byte-row';

    const ledsWrap = document.createElement('div');
    ledsWrap.className = 'leds';

    const ledEls = bitsOfByte(byte).map(() => {
      const led = document.createElement('span');
      led.className = 'led';
      ledsWrap.appendChild(led);
      return led;
    });

    const decEl = document.createElement('b');
    decEl.textContent = String(byte);

    const binEl = document.createElement('span');
    binEl.className = 'byte-bin';
    binEl.textContent = bitsOfByte(byte).join('');

    const meta = document.createElement('span');
    meta.className = 'byte-meta';
    meta.append(decEl, ' · ', binEl);

    row.appendChild(ledsWrap);
    row.appendChild(meta);

    return { row, ledEls };
  }

  function renderNome(value) {
    renderToken++;
    const myToken = renderToken;
    linhas.innerHTML = '';

    if (!value) return;

    const chars = Array.from(value);

    chars.forEach((ch, charIndex) => {
      const bytes = encoder.encode(ch);

      const block = document.createElement('div');
      block.className = 'char-block';

      const glyph = document.createElement('div');
      glyph.className = 'char-glyph';
      glyph.textContent = ch === ' ' ? '␠' : ch;
      block.appendChild(glyph);

      const bytesWrap = document.createElement('div');
      bytesWrap.className = 'char-bytes';
      block.appendChild(bytesWrap);

      const rows = [];
      bytes.forEach((byte) => {
        const { row, ledEls } = buildByteRow(byte);
        bytesWrap.appendChild(row);
        rows.push(ledEls);
      });

      if (bytes.length > 1) {
        const note = document.createElement('div');
        note.className = 'multibyte-note';
        note.textContent = `esse caractere usa ${bytes.length} bytes em UTF-8`;
        bytesWrap.appendChild(note);
      }

      linhas.appendChild(block);

      const charDelay = charIndex * CHAR_STEP_MS;
      let bitCounter = 0;

      rows.forEach((ledEls, byteIndex) => {
        const byte = bytes[byteIndex];
        ledEls.forEach((led, bitIndex) => {
          const delay = charDelay + bitCounter * BIT_STEP_MS;
          const bit = (byte >> (7 - bitIndex)) & 1;
          setTimeout(() => {
            if (myToken !== renderToken) return;
            if (bit) led.classList.add('on');
          }, delay);
          bitCounter++;
        });
      });
    });

    // rola até o final para acompanhar a digitação
    linhas.scrollTop = linhas.scrollHeight;
  }

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const value = input.value;
    debounceTimer = setTimeout(() => renderNome(value), 180);
  });

  btnReset.addEventListener('click', () => {
    clearTimeout(debounceTimer);
    input.value = '';
    renderNome('');
    input.focus();
  });

  // ---------- Parte 2: interruptores de bits ----------

  const switchesWrap = document.getElementById('switches');
  const readoutDec = document.getElementById('readout-dec');
  const readoutChar = document.getElementById('readout-char');

  const bitState = [0, 0, 0, 0, 0, 0, 0, 0]; // índice 0 = bit mais significativo

  function buildSwitches() {
    bitState.forEach((_, i) => {
      const power = 7 - i; // valor posicional do bit (128 ... 1)

      const el = document.createElement('div');
      el.className = 'switch';
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-pressed', 'false');

      const led = document.createElement('div');
      led.className = 'switch-led';

      const valueLabel = document.createElement('span');
      valueLabel.className = 'switch-bit-value';
      valueLabel.textContent = '0';

      const powerLabel = document.createElement('span');
      powerLabel.className = 'switch-power';
      powerLabel.textContent = String(2 ** power);

      el.appendChild(led);
      el.appendChild(valueLabel);
      el.appendChild(powerLabel);
      switchesWrap.appendChild(el);

      const toggle = () => {
        bitState[i] = bitState[i] ? 0 : 1;
        led.classList.toggle('on', !!bitState[i]);
        valueLabel.textContent = String(bitState[i]);
        el.setAttribute('aria-pressed', String(!!bitState[i]));
        updateReadout();
      };

      el.addEventListener('click', toggle);
      el.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          toggle();
        }
      });
    });
  }

  function updateReadout() {
    const byte = bitState.reduce((acc, bit) => (acc << 1) | bit, 0);
    readoutDec.textContent = String(byte);

    const printable = byte >= 32 && byte <= 126;
    if (printable) {
      readoutChar.textContent = `"${String.fromCharCode(byte)}"`;
      readoutChar.classList.remove('dim');
    } else {
      readoutChar.textContent = 'não imprimível';
      readoutChar.classList.add('dim');
    }
  }

  buildSwitches();
  updateReadout();

  // ---------- Parte 3: tabela de referência ---------- //

  const CHAR_LABELS = {
    32: 'espaço',
    34: '" (aspas)',
    39: "' (apóstrofo)",
  };

  function buildRefTable() {
    const tbody = document.getElementById('ref-table-body');
    const rows = [];

    for (let byte = 32; byte <= 126; byte++) {
      const tr = document.createElement('tr');

      const tdChar = document.createElement('td');
      tdChar.className = 'ref-char';
      tdChar.textContent = CHAR_LABELS[byte] || String.fromCharCode(byte);

      const tdDec = document.createElement('td');
      tdDec.className = 'ref-dec';
      tdDec.textContent = String(byte);

      const tdBin = document.createElement('td');
      tdBin.className = 'ref-bin';
      const bits = bitsOfByte(byte);
      tdBin.textContent = bits.join('');

      const tdLeds = document.createElement('td');
      const ledsMini = document.createElement('div');
      ledsMini.className = 'leds-mini';
      bits.forEach((bit) => {
        const led = document.createElement('span');
        led.className = 'led-mini' + (bit ? ' on' : '');
        ledsMini.appendChild(led);
      });
      tdLeds.appendChild(ledsMini);

      tr.appendChild(tdChar);
      tr.appendChild(tdDec);
      tr.appendChild(tdBin);
      tr.appendChild(tdLeds);
      rows.push(tr);
    }

    tbody.append(...rows);
  }

  buildRefTable();

  // ---------- abas ---------- //

  const tabs = [
    { tab: document.getElementById('tab-bits'), panel: document.getElementById('panel-bits') },
    { tab: document.getElementById('tab-nome'), panel: document.getElementById('panel-nome') },
    { tab: document.getElementById('tab-tabela'), panel: document.getElementById('panel-tabela') },
  ];

  function activateTab(index) {
    tabs.forEach(({ tab, panel }, i) => {
      const active = i === index;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      panel.hidden = !active;
    });
    if (tabs[index].panel === document.getElementById('panel-nome')) input.focus();
  }

  tabs.forEach(({ tab }, i) => {
    tab.addEventListener('click', () => activateTab(i));
    tab.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const next = e.key === 'ArrowRight'
          ? (i + 1) % tabs.length
          : (i - 1 + tabs.length) % tabs.length;
        tabs[next].tab.focus();
        activateTab(next);
      }
    });
  });
})();
