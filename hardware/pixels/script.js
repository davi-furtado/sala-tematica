(() => {
  'use strict';

  const W = 480;
  const H = 360;

  // ---------- elementos ----------

  const screens = {
    start: document.getElementById('screen-start'),
    camera: document.getElementById('screen-camera'),
    result: document.getElementById('screen-result'),
  };

  const statusBanner = document.getElementById('status-banner');

  const btnCamera = document.getElementById('btn-camera');
  const btnExample = document.getElementById('btn-example');

  const video = document.getElementById('video');
  const btnCapture = document.getElementById('btn-capture');
  const btnUseExampleInstead = document.getElementById('btn-use-example-instead');
  const btnCancelCamera = document.getElementById('btn-cancel-camera');

  const privacyNoteResult = document.getElementById('privacy-note-result');
  const canvasPixel = document.getElementById('canvas-pixel');
  const pixelCtx = canvasPixel.getContext('2d');
  const slider = document.getElementById('slider-detail');
  const resolutionValue = document.getElementById('resolution-value');

  const swatch = document.getElementById('swatch');
  const infoHex = document.getElementById('info-hex');
  const infoHint = document.getElementById('info-hint');
  const channelEls = {
    r: { dec: document.getElementById('info-r-dec'), bin: document.getElementById('info-r-bin') },
    g: { dec: document.getElementById('info-g-dec'), bin: document.getElementById('info-g-bin') },
    b: { dec: document.getElementById('info-b-dec'), bin: document.getElementById('info-b-bin') },
  };

  const btnRetake = document.getElementById('btn-retake');
  const btnToggleSource = document.getElementById('btn-toggle-source');

  const canvasSource = document.getElementById('canvas-source');
  const sourceCtx = canvasSource.getContext('2d');
  canvasSource.width = W;
  canvasSource.height = H;

  const canvasTiny = document.getElementById('canvas-tiny');
  const tinyCtx = canvasTiny.getContext('2d', { willReadFrequently: true });

  // ---------- estado ----------

  let stream = null;
  let source = null; // 'camera' | 'example'
  let currentWB = 0;
  let currentHB = 0;

  function showScreen(name) {
    Object.entries(screens).forEach(([key, el]) => {
      el.hidden = key !== name;
    });
  }

  function showBanner(message) {
    statusBanner.textContent = message;
    statusBanner.hidden = false;
  }

  function hideBanner() {
    statusBanner.hidden = true;
  }

  // ---------- câmera ----------

  function stopCameraStream() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }
    video.srcObject = null;
  }

  async function requestCamera() {
    hideBanner();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showBanner('Este navegador não suporta câmera. Use a foto de exemplo abaixo — ela funciona igualzinho.');
      return;
    }

    stopCameraStream();

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      video.srcObject = stream;
      source = 'camera';
      showScreen('camera');
    } catch (err) {
      showBanner('Não foi possível acessar a câmera (permissão negada ou indisponível). Use a foto de exemplo abaixo — ela funciona igualzinho.');
    }
  }

  function capturePhoto() {
    if (!video.videoWidth || !video.videoHeight) return;

    const videoAspect = video.videoWidth / video.videoHeight;
    const targetAspect = W / H;

    let sx, sy, sw, sh;
    if (videoAspect > targetAspect) {
      sh = video.videoHeight;
      sw = sh * targetAspect;
      sy = 0;
      sx = (video.videoWidth - sw) / 2;
    } else {
      sw = video.videoWidth;
      sh = sw / targetAspect;
      sx = 0;
      sy = (video.videoHeight - sh) / 2;
    }

    // espelha a captura pra bater com a prévia (efeito espelho)
    sourceCtx.save();
    sourceCtx.translate(W, 0);
    sourceCtx.scale(-1, 1);
    sourceCtx.drawImage(video, sx, sy, sw, sh, 0, 0, W, H);
    sourceCtx.restore();

    stopCameraStream();
    source = 'camera';
    showResult();
  }

  // ---------- imagem de exemplo (paisagem desenhada, sem asset externo) ----------

  function drawExampleImage(ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, H * 0.7);
    sky.addColorStop(0, '#16213e');
    sky.addColorStop(0.55, '#a8536a');
    sky.addColorStop(1, '#f4a259');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    ctx.beginPath();
    ctx.fillStyle = '#ffd27a';
    ctx.arc(W * 0.74, H * 0.38, H * 0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#22406f';
    ctx.beginPath();
    ctx.moveTo(0, H * 0.62);
    ctx.lineTo(W * 0.15, H * 0.48);
    ctx.lineTo(W * 0.32, H * 0.58);
    ctx.lineTo(W * 0.5, H * 0.44);
    ctx.lineTo(W * 0.68, H * 0.56);
    ctx.lineTo(W * 0.85, H * 0.46);
    ctx.lineTo(W, H * 0.6);
    ctx.lineTo(W, H * 0.7);
    ctx.lineTo(0, H * 0.7);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#173425';
    ctx.beginPath();
    ctx.moveTo(0, H * 0.72);
    ctx.lineTo(W * 0.2, H * 0.6);
    ctx.lineTo(W * 0.4, H * 0.7);
    ctx.lineTo(W * 0.6, H * 0.58);
    ctx.lineTo(W * 0.8, H * 0.68);
    ctx.lineTo(W, H * 0.62);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();

    const water = ctx.createLinearGradient(0, H * 0.86, 0, H);
    water.addColorStop(0, '#0d1f1a');
    water.addColorStop(1, '#081310');
    ctx.fillStyle = water;
    ctx.fillRect(0, H * 0.86, W, H * 0.14);
  }

  function useExample() {
    hideBanner();
    stopCameraStream();
    drawExampleImage(sourceCtx);
    source = 'example';
    showResult();
  }

  // ---------- pixelização ----------

  function renderPixelated() {
    const wb = parseInt(slider.value, 10);
    const hb = Math.max(1, Math.round(wb * (H / W)));

    currentWB = wb;
    currentHB = hb;

    canvasTiny.width = wb;
    canvasTiny.height = hb;
    tinyCtx.imageSmoothingEnabled = true;
    tinyCtx.clearRect(0, 0, wb, hb);
    tinyCtx.drawImage(canvasSource, 0, 0, wb, hb);

    pixelCtx.imageSmoothingEnabled = false;
    pixelCtx.clearRect(0, 0, W, H);
    pixelCtx.drawImage(canvasTiny, 0, 0, wb, hb, 0, 0, W, H);

    resolutionValue.textContent = `${wb} x ${hb}`;
  }

  function showResult() {
    showScreen('result');
    privacyNoteResult.hidden = source !== 'camera';
    btnRetake.textContent = source === 'camera' ? 'Tirar outra foto' : 'Tirar uma foto';
    btnToggleSource.textContent = source === 'camera' ? 'Trocar pra foto de exemplo' : 'Trocar pra câmera';
    infoHint.hidden = false;
    infoHex.textContent = '—';
    swatch.style.background = '#1c1f21';
    Object.values(channelEls).forEach(({ dec, bin }) => {
      dec.textContent = '—';
      bin.textContent = '--------';
    });
    renderPixelated();
  }

  // ---------- leitura de cor ao passar o cursor ----------

  function toHex(n) {
    return n.toString(16).padStart(2, '0');
  }

  function toBinary8(n) {
    return n.toString(2).padStart(8, '0');
  }

  function readBlockAt(clientX, clientY) {
    const rect = canvasPixel.getBoundingClientRect();
    const xRatio = (clientX - rect.left) / rect.width;
    const yRatio = (clientY - rect.top) / rect.height;

    if (xRatio < 0 || xRatio >= 1 || yRatio < 0 || yRatio >= 1) return;

    const bx = Math.min(currentWB - 1, Math.floor(xRatio * currentWB));
    const by = Math.min(currentHB - 1, Math.floor(yRatio * currentHB));

    const [r, g, b] = tinyCtx.getImageData(bx, by, 1, 1).data;

    infoHint.hidden = true;
    swatch.style.background = `rgb(${r}, ${g}, ${b})`;

    channelEls.r.dec.textContent = String(r);
    channelEls.r.bin.textContent = toBinary8(r);
    channelEls.g.dec.textContent = String(g);
    channelEls.g.bin.textContent = toBinary8(g);
    channelEls.b.dec.textContent = String(b);
    channelEls.b.bin.textContent = toBinary8(b);

    infoHex.textContent = `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  }

  canvasPixel.addEventListener('mousemove', (e) => readBlockAt(e.clientX, e.clientY));
  canvasPixel.addEventListener('touchmove', (e) => {
    if (e.touches.length) {
      readBlockAt(e.touches[0].clientX, e.touches[0].clientY);
      e.preventDefault();
    }
  }, { passive: false });
  canvasPixel.addEventListener('touchstart', (e) => {
    if (e.touches.length) {
      readBlockAt(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  // ---------- eventos gerais ----------

  btnCamera.addEventListener('click', requestCamera);
  btnExample.addEventListener('click', useExample);

  btnCapture.addEventListener('click', capturePhoto);
  btnUseExampleInstead.addEventListener('click', useExample);
  btnCancelCamera.addEventListener('click', () => {
    stopCameraStream();
    source = null;
    showScreen('start');
  });

  btnRetake.addEventListener('click', requestCamera);
  btnToggleSource.addEventListener('click', () => {
    if (source === 'camera') {
      useExample();
    } else {
      requestCamera();
    }
  });

  slider.addEventListener('input', renderPixelated);

  window.addEventListener('beforeunload', stopCameraStream);
})();
