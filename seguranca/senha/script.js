(() => {
  'use strict';

  const SYMBOLS = "!@#$%^&*()-_=+[]{}:;\"'.,<>/?\\|`~";
  const SYMBOL_SET = new Set(SYMBOLS.split(''));
  const TERMINAL_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789' + SYMBOLS;

  // espelham os valores de --red/--green do theme.css, só pra interpolação numérica
  const RED_RGB = [200, 25, 30];
  const GREEN_RGB = [50, 160, 65];

  const SECONDS_PER_YEAR = 365.25 * 24 * 3600;
  const AGE_OF_UNIVERSE_YEARS = 13.8e9;
  const ATTEMPTS_PER_SECOND = 1e9;

  const EXAMPLE_WEAK = '123456';
  const EXAMPLE_STRONG = 'T7#mKq9!vLx';

  // senhas que aparecem no topo de listas de vazamentos reais (NordPass, Have I Been Pwned)
  // ano após ano — inclui variações que tecnicamente cumprem os 5 critérios técnicos,
  // pra mostrar que "força" por regra de caractere não basta. Ordem = ranking aproximado.
  const COMMON_PASSWORDS_LIST = [
    '123456', '123456789', '12345678', '12345', '1234567', '1234567890', '1234',
    '111111', '123123', '000000', '112233', '1q2w3e4r', '1qaz2wsx', 'qazwsx', 'zaq12wsx',
    'qwerty', 'qwerty123', 'qwertyuiop', 'asdfghjkl', 'asdf1234', 'zxcvbnm',
    'password', 'password1', 'password123', 'passw0rd', 'p@ssw0rd', 'p@ssword',
    'letmein', 'letmein1', 'welcome', 'welcome1', 'admin', 'admin123', 'administrador',
    'iloveyou', 'iloveyou1', 'abc123', 'trustno1', 'hello', 'freedom', 'whatever',
    'monkey', 'dragon', 'master', 'football', 'baseball', 'princess', 'sunshine',
    'shadow', 'michael', 'jennifer', 'superman', 'batman', 'hunter2', 'changeme',
    'guest', 'root', 'toor', 'default', 'temp1234', 'chocolate', 'soccer', 'jordan23',
    'senha', 'senha123', 'minhasenha', 'brasil', 'brasil123', '123mudar', 'mudar123',
    'vasco', 'flamengo', 'palmeiras', 'corinthians', 'deus', 'jesus', 'amor', 'amor123',
    'eutamo', 'gato123', 'cachorro', 'a1b2c3d4', 'qwerty1234',
    'password123!', 'p@ssw0rd123', 'admin@123', 'senha@123', 'brasil@123',
  ];
  const COMMON_PASSWORDS = new Set(COMMON_PASSWORDS_LIST);

  function isCommonPassword(pw) {
    return COMMON_PASSWORDS.has(pw.toLowerCase());
  }

  // ---------- elementos ----------

  const input = document.getElementById('input-senha');
  const btnWeak = document.getElementById('btn-fraca');
  const btnStrong = document.getElementById('btn-forte');
  const btnClear = document.getElementById('btn-limpar');

  const strengthLabel = document.getElementById('strength-label');
  const strengthFill = document.getElementById('strength-fill');
  const commonWarning = document.getElementById('common-warning');
  const checkItems = {
    length: document.querySelector('.check-item[data-check="length"]'),
    upper: document.querySelector('.check-item[data-check="upper"]'),
    lower: document.querySelector('.check-item[data-check="lower"]'),
    digit: document.querySelector('.check-item[data-check="digit"]'),
    symbol: document.querySelector('.check-item[data-check="symbol"]'),
  };

  const terminal = document.getElementById('terminal');
  const crackTimeValue = document.getElementById('crack-time-value');

  // ---------- análise da senha ----------

  function analyzePassword(pw) {
    const length = pw.length;
    const hasUpper = /[A-Z]/.test(pw);
    const hasLower = /[a-z]/.test(pw);
    const hasDigit = /[0-9]/.test(pw);
    let hasSymbol = false;
    for (const ch of pw) {
      if (SYMBOL_SET.has(ch)) {
        hasSymbol = true;
        break;
      }
    }
    const hasMinLength = length >= 8;
    const criteriaMet = [hasMinLength, hasUpper, hasLower, hasDigit, hasSymbol].filter(Boolean).length;
    const lengthFactor = Math.min(length / 16, 1);
    const score = length === 0 ? 0 : (criteriaMet / 5) * 0.8 + lengthFactor * 0.2;

    let alphabetSize = 0;
    if (hasLower) alphabetSize += 26;
    if (hasUpper) alphabetSize += 26;
    if (hasDigit) alphabetSize += 10;
    if (hasSymbol) alphabetSize += SYMBOLS.length;

    return {
      length, hasUpper, hasLower, hasDigit, hasSymbol, hasMinLength,
      criteriaMet, score, alphabetSize,
    };
  }

  function lerpColor(a, b, t) {
    const r = Math.round(a[0] + (b[0] - a[0]) * t);
    const g = Math.round(a[1] + (b[1] - a[1]) * t);
    const bl = Math.round(a[2] + (b[2] - a[2]) * t);
    return `rgb(${r}, ${g}, ${bl})`;
  }

  function strengthLabelFor(score) {
    if (score < 0.25) return 'Fraca';
    if (score < 0.5) return 'Razoável';
    if (score < 0.8) return 'Forte';
    return 'Muito forte';
  }

  function formatCrackTime(seconds) {
    if (!isFinite(seconds)) return 'mais tempo que a idade do universo';

    const years = seconds / SECONDS_PER_YEAR;
    if (years > AGE_OF_UNIVERSE_YEARS) return 'mais tempo que a idade do universo';

    if (seconds < 1) return 'menos de 1 segundo';
    if (seconds < 60) return `${Math.round(seconds)} segundos`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} minutos`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)} horas`;
    if (seconds < SECONDS_PER_YEAR) return `${Math.round(seconds / 86400)} dias`;
    if (years < 100) return `${Math.round(years)} anos`;

    const centuries = Math.round(years / 100);
    return `${centuries.toLocaleString('pt-BR')} séculos`;
  }

  // ---------- atualização visual ----------

  let currentScore = 0;

  function updateUI() {
    const pw = input.value;
    const info = analyzePassword(pw);
    currentScore = info.score;

    checkItems.length.classList.toggle('met', info.hasMinLength);
    checkItems.upper.classList.toggle('met', info.hasUpper);
    checkItems.lower.classList.toggle('met', info.hasLower);
    checkItems.digit.classList.toggle('met', info.hasDigit);
    checkItems.symbol.classList.toggle('met', info.hasSymbol);

    if (pw.length === 0) {
      strengthLabel.textContent = '—';
      strengthFill.style.width = '0%';
      strengthFill.style.backgroundColor = '';
    } else {
      strengthLabel.textContent = strengthLabelFor(info.score);
      strengthFill.style.width = `${Math.round(info.score * 100)}%`;
      strengthFill.style.backgroundColor = lerpColor(RED_RGB, GREEN_RGB, info.score);
    }

    const isCommon = pw.length > 0 && isCommonPassword(pw);
    commonWarning.hidden = !isCommon;

    if (pw.length === 0) {
      crackTimeValue.textContent = 'digite uma senha';
      crackTimeValue.classList.remove('alert');
    } else if (isCommon) {
      crackTimeValue.textContent = 'instantâneo — está em listas de senhas vazadas';
      crackTimeValue.classList.add('alert');
    } else if (info.alphabetSize === 0) {
      crackTimeValue.textContent = 'digite uma senha';
      crackTimeValue.classList.remove('alert');
    } else {
      const combinations = Math.pow(info.alphabetSize, info.length);
      const seconds = combinations / ATTEMPTS_PER_SECOND;
      crackTimeValue.textContent = formatCrackTime(seconds);
      crackTimeValue.classList.remove('alert');
    }
  }

  input.addEventListener('input', updateUI);

  btnWeak.addEventListener('click', () => {
    input.value = EXAMPLE_WEAK;
    updateUI();
    input.focus();
  });

  btnStrong.addEventListener('click', () => {
    input.value = EXAMPLE_STRONG;
    updateUI();
    input.focus();
  });

  btnClear.addEventListener('click', () => {
    input.value = '';
    updateUI();
    input.focus();
  });

  // ---------- terminal de "ataque" (dramatização visual) ----------

  const TERMINAL_LINES = 11;
  const MIN_LINE_LEN = 10;
  const MAX_LINE_LEN = 22;

  function randomTerminalString(len) {
    let out = '';
    for (let i = 0; i < len; i++) {
      out += TERMINAL_CHARS[Math.floor(Math.random() * TERMINAL_CHARS.length)];
    }
    return out;
  }

  function renderTerminalFrame() {
    const lines = [];
    for (let i = 0; i < TERMINAL_LINES; i++) {
      const len = MIN_LINE_LEN + Math.floor(Math.random() * (MAX_LINE_LEN - MIN_LINE_LEN));
      lines.push(`> tentando ${randomTerminalString(len)} ... negado`);
    }
    terminal.textContent = lines.join('\n');
  }

  function getTerminalDelay() {
    // score 0 -> ~35ms (bem rápido); score 1 -> ~1400ms (quase travado)
    const eased = Math.pow(currentScore, 1.6);
    return Math.round(35 + eased * (1400 - 35));
  }

  function scheduleTerminalTick() {
    setTimeout(() => {
      renderTerminalFrame();
      scheduleTerminalTick();
    }, getTerminalDelay());
  }

  // ---------- tabela de referência ---------- //

  function buildCommonTable() {
    const tbody = document.getElementById('common-table-body');
    const rows = COMMON_PASSWORDS_LIST.map((pw, index) => {
      const tr = document.createElement('tr');

      const tdRank = document.createElement('td');
      tdRank.className = 'rank-cell';
      tdRank.textContent = String(index + 1);

      const tdPassword = document.createElement('td');
      tdPassword.className = 'password-cell';
      tdPassword.textContent = pw;

      tr.appendChild(tdRank);
      tr.appendChild(tdPassword);
      return tr;
    });
    tbody.append(...rows);
  }

  // ---------- inicialização ----------

  updateUI();
  renderTerminalFrame();
  scheduleTerminalTick();
  buildCommonTable();
})();
