(() => {
  'use strict';

  const STORAGE_KEY = 'invite-app-state-v1';

  const els = {
    appBar: document.getElementById('appBar'),
    hideBtn: document.getElementById('hideBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    closeBtn: document.getElementById('closeBtn'),

    eventPhoto: document.getElementById('eventPhoto'),
    eventName: document.getElementById('eventName'),
    personName: document.getElementById('personName'),
    profilePhoto: document.getElementById('profilePhoto'),
    qrImage: document.getElementById('qrImage'),

    sheetOverlay: document.getElementById('sheetOverlay'),
    sheet: document.getElementById('sheet'),
    closeSheetBtn: document.getElementById('closeSheetBtn'),
    saveSheetBtn: document.getElementById('saveSheetBtn'),

    profileUpload: document.getElementById('profileUpload'),
    eventUpload: document.getElementById('eventUpload'),
    profilePreview: document.getElementById('profilePreview'),
    eventPreview: document.getElementById('eventPreview'),
    eventNameInput: document.getElementById('eventNameInput'),
    personNameInput: document.getElementById('personNameInput'),

    carouselTrack: document.getElementById('carouselTrack'),
    carouselViewport: document.getElementById('carouselViewport'),
    dots: Array.from(document.querySelectorAll('.dot')),
  };

  const DEFAULT_AVATAR = 'profile.png';
  const DEFAULT_EVENT_PHOTO = 'event.png';

  let state = {
    eventName: 'Fairs bro fairs',
    personName: 'Josh is da real goat',
    eventPhoto: DEFAULT_EVENT_PHOTO,
    profilePhoto: DEFAULT_AVATAR,
  };

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        state = Object.assign(state, parsed);
      }
    } catch (e) {
      /* ignore corrupted storage */
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* storage full or unavailable; ignore */
    }
  }

  function applyState() {
    els.eventName.textContent = state.eventName;
    els.personName.textContent = state.personName;
    els.eventPhoto.src = state.eventPhoto;
    els.profilePhoto.src = state.profilePhoto;
    els.profilePhoto.hidden = false;
    els.eventPhoto.classList.toggle('reference-photo', false);
    els.profilePreview.classList.toggle('reference-profile', false);
    els.eventPreview.classList.toggle('reference-event', false);
  }

  // Use the supplied reference's exact QR artwork; no random replacement pattern.
  function buildQrPattern() {
    const rows = ["1111111000000100110000111001101111111", "1000001000110101101000010001001000001", "1011101001100010110000011010101011101", "1011101000011110100100000111101011101", "1011101000001011000001110110101011101", "1000001011011100001111100011101000001", "1111111010101010101010101010101111111", "0000000000101100011011011001100000000", "1001011011001011010111111010010100000", "0100010000011101011011011010000001001", "0101001110010000110100000010011001011", "0011010100111001000111101100010110010", "1001001101101110110010000101011101101", "1111010000100100000010000110010101001", "0010011100100110000001011100111110111", "1010100101010100000000011100111000001", "1111101011101100000000000010111000101", "1011100110011000000000111001110111111", "0010101010011101100001000010011010101", "0011000100101010001001001011110010100", "1100101100010010001001010111101101001", "0011110101111111110011000110110000101", "1110001110001100100001100110100110101", "1010110001001100000101101110100000000", "1011001011100010100011011100101100100", "0110000000011101100101101011001001000", "1010011011101110100000011010011101101", "0100110011000111011111100101000101011", "1111001010011001100111111001111110101", "0000000011111001110101001101100010010", "1111111000010010010010001001101010011", "1000001010010000010001011010100010101", "1011101001101101010110000100111110101", "1011101010101000110011111110000110100", "1011101000010010100100100100110011111", "1000001000101001100111100110110000000", "1111111010101101110000001001101000111"];
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 702 704');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.innerHTML = `<defs><clipPath id="fixed-finders"><rect x="28" y="26" width="130" height="127"/><rect x="552" y="26" width="123" height="127"/><rect x="28" y="551" width="130" height="128"/></clipPath></defs><rect width="702" height="704" fill="#fff"/><image href="qr.svg" width="702" height="704" clip-path="url(#fixed-finders)"/>`;
    const connections = document.createElementNS(ns, 'g');
    connections.setAttribute('stroke', '#000');
    connections.setAttribute('stroke-width', '2.5');
    connections.setAttribute('stroke-linecap', 'round');
    svg.appendChild(connections);
    const cells = [];
    const grid = new Map();
    for (let y = 0; y < 37; y++) {
      for (let x = 0; x < 37; x++) {
        // Preserve the finder squares and their quiet margins.
        if ((x < 8 && y < 8) || (x > 28 && y < 8) || (x < 8 && y > 28)) continue;
        const circle = document.createElementNS(ns, 'circle');
        circle.setAttribute('cx', (38 + x * 17.4).toFixed(1));
        circle.setAttribute('cy', (37 + y * 17.5).toFixed(1));
        circle.setAttribute('r', '7.8');
        circle.setAttribute('fill', '#000');
        const covered = Math.hypot(38 + x * 17.4 - 356, 37 + y * 17.5 - 352) < 83;
        const active = covered ? (x * 13 + y * 7 + x * y) % 11 < 6 : rows[y][x] === '1';
        circle.style.visibility = active ? 'visible' : 'hidden';
        const cell = { circle, active, x, y };
        cells.push(cell);
        grid.set(`${x},${y}`, cell);
        svg.appendChild(circle);
      }
    }
    function updateConnections() {
      const lines = document.createDocumentFragment();
      for (const cell of cells) {
        if (!cell.active) continue;
        for (const [dx, dy] of [[1, 0], [0, 1]]) {
          const neighbor = grid.get(`${cell.x + dx},${cell.y + dy}`);
          if (!neighbor?.active) continue;
          // Keep both isolated dots and connected clusters like the reference.
          if ((cell.x * 7 + cell.y * 11 + dx * 3) % 5 > 1) continue;
          const line = document.createElementNS(ns, 'line');
          line.setAttribute('x1', cell.circle.getAttribute('cx'));
          line.setAttribute('y1', cell.circle.getAttribute('cy'));
          line.setAttribute('x2', neighbor.circle.getAttribute('cx'));
          line.setAttribute('y2', neighbor.circle.getAttribute('cy'));
          lines.appendChild(line);
        }
      }
      connections.replaceChildren(lines);
    }
    updateConnections();
    els.qrImage.style.backgroundImage = 'none';
    els.qrImage.replaceChildren(svg);
    // Swap occupied and empty grid positions to retain identical dot density.
    window.setInterval(() => {
      if (document.hidden) return;
      const on = cells.filter(cell => cell.active);
      const off = cells.filter(cell => !cell.active);
      const swaps = Math.min(65, on.length, off.length);
      for (let i = 0; i < swaps; i++) {
        const oldDot = on.splice(Math.floor(Math.random() * on.length), 1)[0];
        const newDot = off.splice(Math.floor(Math.random() * off.length), 1)[0];
        oldDot.active = false;
        newDot.active = true;
        oldDot.circle.style.visibility = 'hidden';
        newDot.circle.style.visibility = 'visible';
      }
      updateConnections();
    }, 1000);
  }
  const moreBtn = document.getElementById('moreBtn');
  const actionsMenu = document.getElementById('actionsMenu');
  function closeMenu() {
    actionsMenu.hidden = true;
    moreBtn.setAttribute('aria-expanded', 'false');
  }
  moreBtn.addEventListener('click', () => {
    actionsMenu.hidden = !actionsMenu.hidden;
    moreBtn.setAttribute('aria-expanded', String(!actionsMenu.hidden));
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.app-bar')) closeMenu();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeMenu(); closeSheet(); }
  });

  // Safari browser chrome is controlled by Safari; standalone launch omits it.
  const browserHelp = document.getElementById('browserHelp');
  const browserHelpText = document.getElementById('browserHelpText');
  const installInstructions = browserHelpText.textContent;
  els.hideBtn.addEventListener('click', () => {
    closeMenu();
    const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
    browserHelpText.textContent = standalone
      ? 'You’re already viewing this invite without Safari’s toolbar.'
      : installInstructions;
    browserHelp.showModal();
  });
  els.closeBtn.addEventListener('click', () => {
    // No real navigation target in this standalone demo; just a visual affordance.
  });

  // ---------- Settings sheet ----------
  function openSheet() {
    closeMenu();
    els.profilePreview.src = state.profilePhoto;
    els.eventPreview.src = state.eventPhoto;
    els.eventNameInput.value = state.eventName;
    els.personNameInput.value = state.personName;
    els.sheetOverlay.classList.add('open');
  }

  function closeSheet() {
    els.sheetOverlay.classList.remove('open');
  }

  els.settingsBtn.addEventListener('click', openSheet);
  els.closeSheetBtn.addEventListener('click', closeSheet);
  els.sheetOverlay.addEventListener('click', (e) => {
    if (e.target === els.sheetOverlay) closeSheet();
  });

  function readFileAsDataUrl(file, onLoad) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onLoad(reader.result);
    reader.readAsDataURL(file);
  }

  els.profileUpload.addEventListener('change', (e) => {
    readFileAsDataUrl(e.target.files[0], (url) => {
      els.profilePreview.src = url;
    });
  });

  els.eventUpload.addEventListener('change', (e) => {
    readFileAsDataUrl(e.target.files[0], (url) => {
      els.eventPreview.src = url;
    });
  });

  els.saveSheetBtn.addEventListener('click', () => {
    state.eventName = els.eventNameInput.value.trim() || state.eventName;
    state.personName = els.personNameInput.value.trim() || state.personName;
    state.profilePhoto = els.profilePreview.getAttribute('src');
    state.eventPhoto = els.eventPreview.getAttribute('src');
    applyState();
    saveState();
    closeSheet();
  });

  // ---------- Swipeable carousel ----------
  const SLIDE_COUNT = 2;
  let currentSlide = 0; // start on the first (QR) slide
  let startX = 0;
  let startY = 0;
  let currentTranslate = 0;
  let dragging = false;
  let lockedAxis = null;

  function viewportWidth() {
    const slides = els.carouselTrack.querySelectorAll('.slide');
    return slides[1].offsetLeft - slides[0].offsetLeft;
  }

  function setTrackTransform(px, animate) {
    els.carouselTrack.style.transition = animate ? '' : 'none';
    els.carouselTrack.style.transform = `translateX(${px}px)`;
  }

  function goToSlide(index, animate = true) {
    currentSlide = Math.max(0, Math.min(SLIDE_COUNT - 1, index));
    const px = -currentSlide * viewportWidth();
    setTrackTransform(px, animate);
    els.dots.forEach((dot, i) => dot.classList.toggle('active', i === currentSlide));
  }

  function onPointerDown(clientX, clientY) {
    lastDx = 0;
    dragging = true;
    lockedAxis = null;
    startX = clientX;
    startY = clientY;
    currentTranslate = -currentSlide * viewportWidth();
    setTrackTransform(currentTranslate, false);
  }

  function onPointerMove(clientX, clientY) {
    if (!dragging) return null;
    const dx = clientX - startX;
    const dy = clientY - startY;
    if (lockedAxis === null) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return null;
      lockedAxis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    }
    if (lockedAxis !== 'x') return null;
    setTrackTransform(currentTranslate + dx, false);
    return dx;
  }

  function onPointerUp(dx) {
    if (!dragging) return;
    dragging = false;
    if (lockedAxis === 'x' && dx !== null && dx !== undefined) {
      const threshold = viewportWidth() * 0.18;
      if (dx < -threshold) goToSlide(currentSlide + 1);
      else if (dx > threshold) goToSlide(currentSlide - 1);
      else goToSlide(currentSlide);
    } else {
      goToSlide(currentSlide);
    }
    lockedAxis = null;
  }

  // Touch events
  let lastDx = 0;
  els.carouselViewport.addEventListener(
    'touchstart',
    (e) => {
      const t = e.touches[0];
      onPointerDown(t.clientX, t.clientY);
    },
    { passive: true }
  );

  els.carouselViewport.addEventListener(
    'touchmove',
    (e) => {
      const t = e.touches[0];
      const dx = onPointerMove(t.clientX, t.clientY);
      if (dx !== null) lastDx = dx;
      if (lockedAxis === 'x') e.preventDefault();
    },
    { passive: false }
  );

  els.carouselViewport.addEventListener('touchend', () => onPointerUp(lastDx));
  els.carouselViewport.addEventListener('touchcancel', () => onPointerUp(lastDx));

  // Mouse events (desktop preview support)
  let mouseDown = false;
  els.carouselViewport.addEventListener('mousedown', (e) => {
    mouseDown = true;
    onPointerDown(e.clientX, e.clientY);
  });
  window.addEventListener('mousemove', (e) => {
    if (!mouseDown) return;
    const dx = onPointerMove(e.clientX, e.clientY);
    if (dx !== null) lastDx = dx;
  });
  window.addEventListener('mouseup', () => {
    if (!mouseDown) return;
    mouseDown = false;
    onPointerUp(lastDx);
  });

  els.dots.forEach((dot) => {
    dot.addEventListener('click', () => goToSlide(parseInt(dot.dataset.index, 10)));
  });

  window.addEventListener('resize', () => goToSlide(currentSlide, false));

  // ---------- Init ----------
  loadState();
  applyState();
  buildQrPattern();
  goToSlide(currentSlide, false);
})();
