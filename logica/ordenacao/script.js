(() => {
  'use strict';

  // ---------- algoritmos (geradores: cada yield é um passo visível) ----------

  function* bubbleSort(arr) {
    const n = arr.length;
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - 1 - i; j++) {
        yield { type: 'compare', indices: [j, j + 1] };
        if (arr[j] > arr[j + 1]) {
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          yield { type: 'swap', indices: [j, j + 1] };
        }
      }
      yield { type: 'sorted', index: n - 1 - i };
    }
    yield { type: 'sorted', index: 0 };
  }

  function* selectionSort(arr) {
    const n = arr.length;
    for (let i = 0; i < n - 1; i++) {
      let minIdx = i;
      for (let j = i + 1; j < n; j++) {
        yield { type: 'compare', indices: [minIdx, j] };
        if (arr[j] < arr[minIdx]) {
          minIdx = j;
        }
      }
      if (minIdx !== i) {
        [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
        yield { type: 'swap', indices: [i, minIdx] };
      }
      yield { type: 'sorted', index: i };
    }
    yield { type: 'sorted', index: n - 1 };
  }

  function* insertionSort(arr) {
    const n = arr.length;
    for (let i = 1; i < n; i++) {
      let j = i;
      while (j > 0) {
        yield { type: 'compare', indices: [j - 1, j] };
        if (arr[j - 1] > arr[j]) {
          [arr[j - 1], arr[j]] = [arr[j], arr[j - 1]];
          yield { type: 'swap', indices: [j - 1, j] };
          j--;
        } else {
          break;
        }
      }
    }
    // na inserção, um índice só fica definitivo quando tudo termina
    // (um valor futuro ainda pode empurrar qualquer posição)
  }

  function* partition(arr, lo, hi) {
    const pivot = arr[hi];
    let i = lo - 1;
    for (let j = lo; j < hi; j++) {
      yield { type: 'compare', indices: [j, hi] };
      if (arr[j] < pivot) {
        i++;
        if (i !== j) {
          [arr[i], arr[j]] = [arr[j], arr[i]];
          yield { type: 'swap', indices: [i, j] };
        }
      }
    }
    if (i + 1 !== hi) {
      [arr[i + 1], arr[hi]] = [arr[hi], arr[i + 1]];
      yield { type: 'swap', indices: [i + 1, hi] };
    }
    return i + 1;
  }

  function* quickSort(arr, lo = 0, hi = arr.length - 1) {
    if (lo < hi) {
      const p = yield* partition(arr, lo, hi);
      yield { type: 'sorted', index: p };
      yield* quickSort(arr, lo, p - 1);
      yield* quickSort(arr, p + 1, hi);
    } else if (lo === hi) {
      yield { type: 'sorted', index: lo };
    }
  }

  const ALGORITHMS = {
    bubble: {
      label: 'Bubble Sort',
      desc: 'Bubble Sort: compara vizinhos e troca se estiverem fora de ordem.',
      run: bubbleSort,
    },
    selection: {
      label: 'Seleção',
      desc: 'Seleção: procura o menor valor restante e troca pra posição certa.',
      run: selectionSort,
    },
    insertion: {
      label: 'Inserção',
      desc: 'Inserção: pega cada valor e o insere na posição certa entre os já ordenados.',
      run: insertionSort,
    },
    quick: {
      label: 'Quick Sort',
      desc: 'Quick Sort: escolhe um pivô e separa menores à esquerda, maiores à direita.',
      run: quickSort,
    },
  };

  // ---------- geração do array compartilhado ----------

  function generateArray() {
    const count = 20 + Math.floor(Math.random() * 11); // 20..30
    const arr = Array.from({ length: count }, (_, i) => i + 1);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // ---------- elementos ----------

  function buildPanel(letter) {
    return {
      select: document.getElementById(`select-${letter}`),
      descEl: document.getElementById(`desc-${letter}`),
      compEl: document.getElementById(`comp-${letter}`),
      swapEl: document.getElementById(`swap-${letter}`),
      barsContainer: document.getElementById(`bars-${letter}`),
      badgeEl: document.getElementById(`badge-${letter}`),
      badgeStatsEl: document.querySelector(`#badge-${letter} .finish-stats`),
      container: document.getElementById(`panel-${letter}`),
      bars: [],
      data: [],
      maxValue: 1,
      comparisons: 0,
      swaps: 0,
      activeIndices: [],
      finished: false,
      elapsed: null,
    };
  }

  const panelA = buildPanel('a');
  const panelB = buildPanel('b');
  const panels = [panelA, panelB];

  const btnShuffle = document.getElementById('btn-shuffle');
  const btnStart = document.getElementById('btn-start');
  const sliderSpeed = document.getElementById('slider-speed');

  // ---------- estado da corrida ----------

  let baseArray = generateArray();
  let raceId = 0;
  let raceStartTime = 0;
  let finishOrder = [];

  function getDelay() {
    const v = Number(sliderSpeed.value); // 0..100
    return Math.round(260 - (v / 100) * 252); // ~260ms (devagar) .. ~8ms (rápido)
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ---------- construção visual ----------

  function buildBars(panel) {
    panel.barsContainer.innerHTML = '';
    panel.bars = panel.data.map((value) => {
      const bar = document.createElement('div');
      bar.className = 'bar';
      bar.style.height = `${(value / panel.maxValue) * 100}%`;
      panel.barsContainer.appendChild(bar);
      return bar;
    });
  }

  function updateBarHeight(panel, index) {
    const value = panel.data[index];
    panel.bars[index].style.height = `${(value / panel.maxValue) * 100}%`;
  }

  function setActive(panel, indices) {
    panel.activeIndices.forEach((i) => {
      if (!indices.includes(i)) {
        panel.bars[i].classList.remove('active');
      }
    });
    indices.forEach((i) => {
      if (!panel.bars[i].classList.contains('sorted')) {
        panel.bars[i].classList.add('active');
      }
    });
    panel.activeIndices = indices.slice();
  }

  function markSorted(panel, index) {
    const bar = panel.bars[index];
    bar.classList.add('sorted');
    bar.classList.remove('active');
    panel.activeIndices = panel.activeIndices.filter((i) => i !== index);
  }

  function updateDescription(panel) {
    panel.descEl.textContent = ALGORITHMS[panel.select.value].desc;
  }

  function formatElapsed(ms) {
    return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(2)}s`;
  }

  // ---------- reset ----------

  function resetPanelsVisual() {
    finishOrder = [];
    panels.forEach((panel) => {
      panel.data = baseArray.slice();
      panel.maxValue = baseArray.length;
      panel.comparisons = 0;
      panel.swaps = 0;
      panel.compEl.textContent = '0';
      panel.swapEl.textContent = '0';
      panel.activeIndices = [];
      panel.finished = false;
      panel.elapsed = null;
      panel.badgeEl.hidden = true;
      panel.container.classList.remove('winner');
      buildBars(panel);
    });
  }

  function resetRace() {
    raceId++; // invalida qualquer loop em andamento
    resetPanelsVisual();
  }

  function shuffle() {
    raceId++; // invalida qualquer loop em andamento
    baseArray = generateArray();
    resetPanelsVisual();
  }

  // ---------- execução ----------

  function processEvent(panel, event) {
    switch (event.type) {
      case 'compare':
        panel.comparisons++;
        panel.compEl.textContent = String(panel.comparisons);
        setActive(panel, event.indices);
        break;
      case 'swap':
        panel.swaps++;
        panel.swapEl.textContent = String(panel.swaps);
        updateBarHeight(panel, event.indices[0]);
        updateBarHeight(panel, event.indices[1]);
        setActive(panel, event.indices);
        break;
      case 'sorted':
        markSorted(panel, event.index);
        break;
    }
  }

  function finishPanel(panel) {
    panel.finished = true;
    panel.bars.forEach((bar) => {
      bar.classList.remove('active');
      bar.classList.add('sorted');
    });
    panel.activeIndices = [];

    panel.elapsed = performance.now() - raceStartTime;
    panel.badgeEl.hidden = false;
    panel.badgeStatsEl.textContent =
      `${panel.comparisons} comparações · ${panel.swaps} trocas · ${formatElapsed(panel.elapsed)}`;

    finishOrder.push(panel);
    if (finishOrder.length === 2) {
      finishOrder[0].container.classList.add('winner');
    }
  }

  async function runPanel(panel, myRaceId) {
    const generator = ALGORITHMS[panel.select.value].run(panel.data);

    while (true) {
      if (myRaceId !== raceId) return;

      const { value, done } = generator.next();
      if (done) break;

      processEvent(panel, value);

      if (myRaceId !== raceId) return;
      await sleep(getDelay());
    }

    if (myRaceId !== raceId) return;
    finishPanel(panel);
  }

  function startRace() {
    raceId++;
    const myRaceId = raceId;
    resetPanelsVisual();
    raceStartTime = performance.now();
    runPanel(panelA, myRaceId);
    runPanel(panelB, myRaceId);
  }

  // ---------- eventos ----------

  btnShuffle.addEventListener('click', shuffle);
  btnStart.addEventListener('click', startRace);

  panelA.select.addEventListener('change', () => {
    updateDescription(panelA);
    resetRace();
  });
  panelB.select.addEventListener('change', () => {
    updateDescription(panelB);
    resetRace();
  });

  // ---------- inicialização ----------

  updateDescription(panelA);
  updateDescription(panelB);
  resetPanelsVisual();
})();
