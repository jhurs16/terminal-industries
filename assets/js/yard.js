// ============================================
// BACKGROUND CANVAS ANIMATION
// ============================================

// Configuration
const GRID_CONFIG = {
  DOT_SIZE: 3,
  CELL_SIZE: 48,
  PADDING: 13,
  get SPACING() {
    return this.DOT_SIZE + this.CELL_SIZE + 2 * this.PADDING;
  }
};

const COLORS = {
  dark: { line: 'rgb(75, 75, 75)', rect: 'rgb(132, 132, 132)' },
  green: { line: 'rgb(38, 80, 29)', rect: 'rgb(105, 166, 16)' },
  white: { line: 'rgb(222, 222, 222)', rect: 'rgb(173, 173, 173)' }
};

// State
const canvasState = {
  canvas: null,
  ctx: null,
  wrapper: null,
  maskCanvas: null,
  maskCtx: null,
  width: 0,
  height: 0,
  cols: 0,
  rows: 0,
  dots: [],
  lines: [],
  theme: 'green',
  mode: 'pulse',
  animationFrame: null,
  startTime: Date.now()
};

function initBackgroundCanvas(canvasId, wrapperId) {
  canvasState.canvas = document.getElementById(canvasId);
  canvasState.wrapper = document.getElementById(wrapperId);
  canvasState.ctx = canvasState.canvas.getContext('2d');
  
  canvasState.maskCanvas = document.createElement('canvas');
  canvasState.maskCtx = canvasState.maskCanvas.getContext('2d');
  
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  animateCanvas();
}

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvasState.wrapper.getBoundingClientRect();
  
  canvasState.canvas.width = rect.width * dpr;
  canvasState.canvas.height = rect.height * dpr;
  canvasState.canvas.style.width = rect.width + 'px';
  canvasState.canvas.style.height = rect.height + 'px';
  canvasState.ctx.scale(dpr, dpr);
  
  canvasState.maskCanvas.width = rect.width * dpr;
  canvasState.maskCanvas.height = rect.height * dpr;
  canvasState.maskCtx.scale(dpr, dpr);
  
  canvasState.width = rect.width;
  canvasState.height = rect.height;
  canvasState.cols = Math.ceil(canvasState.width / GRID_CONFIG.SPACING);
  canvasState.rows = Math.ceil(canvasState.height / GRID_CONFIG.SPACING);
  
  calculateGrid();
}

function calculateGrid() {
  const offsetX = (canvasState.width % GRID_CONFIG.SPACING) * 0.5;
  const offsetY = (canvasState.height % GRID_CONFIG.SPACING) * 0.5;
  
  // Calculate dots
  canvasState.dots = [];
  for (let row = 0; row < canvasState.rows; row++) {
    for (let col = 0; col < canvasState.cols; col++) {
      const x = col * GRID_CONFIG.SPACING + GRID_CONFIG.DOT_SIZE * 0.5 + offsetX;
      const y = row * GRID_CONFIG.SPACING + GRID_CONFIG.DOT_SIZE * 0.5 + offsetY;
      canvasState.dots.push({ x, y, size: GRID_CONFIG.DOT_SIZE });
    }
  }
  
  // Calculate lines
  canvasState.lines = [];
  for (let row = 0; row < canvasState.rows; row++) {
    for (let col = 0; col < canvasState.cols; col++) {
      const x = col * GRID_CONFIG.SPACING + GRID_CONFIG.DOT_SIZE * 0.5 + offsetX;
      const y = row * GRID_CONFIG.SPACING + GRID_CONFIG.DOT_SIZE * 0.5 + offsetY;
      
      // Horizontal line
      if (col < canvasState.cols - 1) {
        const x1 = x + GRID_CONFIG.PADDING + GRID_CONFIG.DOT_SIZE * 0.5;
        const x2 = x + GRID_CONFIG.CELL_SIZE + GRID_CONFIG.PADDING + GRID_CONFIG.DOT_SIZE * 0.5;
        canvasState.lines.push({ x: x1, y, w: x2 - x1, h: 1 });
      }
      
      // Vertical line
      if (row < canvasState.rows - 1) {
        const y1 = y + GRID_CONFIG.DOT_SIZE * 0.5 + GRID_CONFIG.PADDING;
        const y2 = y + GRID_CONFIG.DOT_SIZE * 0.5 + GRID_CONFIG.CELL_SIZE + GRID_CONFIG.PADDING;
        canvasState.lines.push({ x, y: y1, w: 1, h: y2 - y1 });
      }
    }
  }
}

function setCanvasTheme(theme) {
  canvasState.theme = theme;
  canvasState.wrapper.className = `bg-canvas__wrapper ${theme}`;
}

function setCanvasMode(mode) {
  canvasState.mode = mode;
}

function createPulseMask(time) {
  const maskSize = 15;
  canvasState.maskCanvas.width = maskSize;
  canvasState.maskCanvas.height = maskSize;
  
  const ctx = canvasState.maskCtx;
  const imageData = ctx.createImageData(maskSize, maskSize);
  const data = imageData.data;
  
  const aspectRatio = canvasState.width / canvasState.height;
  const centerX = maskSize * 0.5;
  const centerY = maskSize * 0.5;
  
  for (let y = 0; y < maskSize; y++) {
    for (let x = 0; x < maskSize; x++) {
      const dx = Math.abs(x - centerX) * aspectRatio;
      const dy = Math.abs(y - centerY);
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      const wave = (Math.sin(distance / maskSize * Math.PI * 5 - time * 2) + 1) / 2;
      const alpha = Math.floor(Math.pow(wave, 2) * 255);
      
      const index = (y * maskSize + x) * 4;
      data[index] = 255;
      data[index + 1] = 255;
      data[index + 2] = 255;
      data[index + 3] = alpha;
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}

function createWaveMask(time) {
  const maskSize = 15;
  canvasState.maskCanvas.width = maskSize;
  canvasState.maskCanvas.height = maskSize;
  
  const ctx = canvasState.maskCtx;
  const imageData = ctx.createImageData(maskSize, maskSize);
  const data = imageData.data;
  
  const aspectRatio = canvasState.width / canvasState.height;
  const numWaves = 3;
  
  // Clear alpha
  for (let i = 3; i < data.length; i += 4) {
    data[i] = 0;
  }
  
  for (let w = 0; w < numWaves; w++) {
    const waveX = Math.cos(time + w * 0.6) * maskSize * 0.2 + maskSize * 0.5;
    const waveY = Math.sin(time + w * 0.6) * maskSize * 0.35 + maskSize * 0.5;
    const radius = maskSize * 0.55;
    
    for (let y = 0; y < maskSize; y++) {
      for (let x = 0; x < maskSize; x++) {
        const dx = Math.abs(x - waveX) * aspectRatio;
        const dy = Math.abs(y - waveY);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const falloff = Math.max(0, 1 - distance / radius);
        const alpha = Math.floor(falloff * 255);
        
        const index = (y * maskSize + x) * 4;
        data[index] = 255;
        data[index + 1] = 255;
        data[index + 2] = 255;
        data[index + 3] = Math.min(data[index + 3] + alpha, 255);
      }
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}

function drawWithMask(elements, type) {
  const color = COLORS[canvasState.theme] || COLORS.green;
  
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvasState.width;
  tempCanvas.height = canvasState.height;
  const tempCtx = tempCanvas.getContext('2d');
  
  tempCtx.fillStyle = type === 'dots' ? color.rect : color.line;
  elements.forEach(el => {
    if (type === 'dots') {
      tempCtx.fillRect(el.x - el.size * 0.5, el.y - el.size * 0.5, el.size, el.size);
    } else {
      tempCtx.fillRect(el.x, el.y, el.w, el.h);
    }
  });
  
  tempCtx.globalCompositeOperation = 'destination-in';
  tempCtx.drawImage(canvasState.maskCanvas, 0, 0, canvasState.width, canvasState.height);
  
  canvasState.ctx.drawImage(tempCanvas, 0, 0);
}

function animateCanvas() {
  const elapsed = (Date.now() - canvasState.startTime) / 1000;
  
  canvasState.ctx.clearRect(0, 0, canvasState.width, canvasState.height);
  
  if (canvasState.mode === 'pulse') {
    createPulseMask(elapsed * 1.8);
  } else if (canvasState.mode === 'wave') {
    createWaveMask(elapsed);
  }
  
  drawWithMask(canvasState.dots, 'dots');
  drawWithMask(canvasState.lines, 'lines');
  
  canvasState.animationFrame = requestAnimationFrame(animateCanvas);
}

function destroyCanvas() {
  if (canvasState.animationFrame) {
    cancelAnimationFrame(canvasState.animationFrame);
  }
}

// ============================================
// LOX SCROLL ANIMATION
// ============================================

gsap.registerPlugin(ScrollTrigger);

const LOX_CONFIG = {
  FULL_TEXT: "Logistic & Operational Excellence",
  SCROLL_THRESHOLD: 0.99,
  MOBILE_BREAKPOINT: 768
};

const loxState = {
  currentTheme: "green",
  isDesktop: window.innerWidth >= LOX_CONFIG.MOBILE_BREAKPOINT,
  letterPositions: [
    { from: {x:0, y:0, width:0, height:0}, to: {x:0, y:0, width:0, height:0} },
    { from: {x:0, y:0, width:0, height:0}, to: {x:0, y:0, width:0, height:0} },
    { from: {x:0, y:0, width:0, height:0}, to: {x:0, y:0, width:0, height:0} }
  ],
  container: null,
  h2: null,
  animatedLetters: null,
  targetLetters: null,
  superscript: null,
  originalLetterEls: []
};

function initLOXAnimation() {
  loxState.container = document.getElementById('yos-section');
  loxState.h2 = document.getElementById('main-heading');
  loxState.animatedLetters = document.querySelectorAll('#animated-yos .anchor-letter');
  loxState.targetLetters = document.querySelectorAll('.anchor-to .anchor-letter');
  loxState.superscript = document.querySelector('#animated-yos .superscript');
  
  buildHeading();
  
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      calculatePositions();
      createScrollAnimation();
    });
  });
}

function buildHeading() {
  const words = LOX_CONFIG.FULL_TEXT.split(" ");
  loxState.h2.innerHTML = '';
  
  words.forEach((word, wordIdx) => {
    const wordWrapper = document.createElement('span');
    wordWrapper.className = 'heading__word-wrapper';
    wordWrapper.setAttribute('aria-hidden', 'true');
    
    word.split('').forEach(letter => {
      const letterSpan = document.createElement('span');
      letterSpan.textContent = letter;
      wordWrapper.appendChild(letterSpan);
    });
    
    if (wordIdx + 1 !== words.length) {
      const space = document.createElement('span');
      space.textContent = '\u00A0';
      wordWrapper.appendChild(space);
    }
    
    loxState.h2.appendChild(wordWrapper);
  });
}

function calculatePositions() {
  const wordWrappers = loxState.h2.querySelectorAll('.heading__word-wrapper');
  loxState.originalLetterEls = [];
  
  // Get L from "LOGISTIC", O from "OPERATIONAL", X from "EXCELLENCE"
  if (wordWrappers.length >= 4) {
    // L from first word "LOGISTIC"
    const firstLetter = wordWrappers[0].querySelector('span');
    if (firstLetter) loxState.originalLetterEls.push(firstLetter);
    
    // O from third word "OPERATIONAL" (index 2, skip "&" which is index 1)
    const thirdWord = wordWrappers[2];
    if (thirdWord) {
      const oLetter = thirdWord.querySelector('span');
      if (oLetter) loxState.originalLetterEls.push(oLetter);
    }
    
    // X from fourth word "EXCELLENCE" (index 3)
    const fourthWord = wordWrappers[3];
    if (fourthWord) {
      const letters = fourthWord.querySelectorAll('span');
      // X is the 2nd letter in EXCELLENCE (E-X-C-E-L-L-E-N-C-E)
      if (letters[1]) loxState.originalLetterEls.push(letters[1]);
    }
  }

  for (let i = 0; i < loxState.animatedLetters.length; i++) {
    const original = loxState.originalLetterEls[i];
    if (!original) continue;

    const target = loxState.targetLetters[i];
    const fromRect = original.getBoundingClientRect();
    const toRect = target.getBoundingClientRect();

    loxState.letterPositions[i].from = fromRect;
    loxState.letterPositions[i].to = toRect;

    const animated = loxState.animatedLetters[i];
    
    if (loxState.currentTheme === 'green') {
      gsap.set(animated, {
        x: fromRect.x + fromRect.width * 0.5 - toRect.x - toRect.width * 0.5,
        y: fromRect.y + fromRect.height * 0.5 - toRect.y - toRect.height * 0.5,
        scale: fromRect.height / toRect.height
      });
    }
    
    animated.style.opacity = '1';
    if (loxState.isDesktop) {
      original.classList.add('hide');
    }
  }
}

function createScrollAnimation() {
  const wordWrappers = loxState.h2.querySelectorAll('.heading__word-wrapper');
  
  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: loxState.container,
      start: 'top top',
      end: '90% bottom',
      scrub: true,
      onUpdate: (self) => {
        if (self.progress >= LOX_CONFIG.SCROLL_THRESHOLD && loxState.currentTheme !== 'white') {
          loxState.currentTheme = 'white';
          loxState.container.classList.remove('green');
          loxState.container.classList.add('white');
          loxState.superscript.classList.add('show');
          setCanvasTheme('white');
          setCanvasMode('wave');
        } else if (self.progress < LOX_CONFIG.SCROLL_THRESHOLD && loxState.currentTheme !== 'green') {
          loxState.currentTheme = 'green';
          loxState.container.classList.remove('white');
          loxState.container.classList.add('green');
          loxState.superscript.classList.remove('show');
          setCanvasTheme('green');
          setCanvasMode('pulse');
        }
      }
    }
  });

  // Phase 1: Fade out all letters
  wordWrappers.forEach(wrapper => {
    const letters = wrapper.querySelectorAll('span');
    timeline.fromTo(
      letters,
      { opacity: 1 },
      { opacity: 0, duration: 0.5, stagger: -0.05 },
      0
    );
  });

  // Phase 2: Animate LOX letters
  if (loxState.isDesktop) {
    loxState.letterPositions.forEach((pos, i) => {
      const animated = loxState.animatedLetters[i];
      const { from, to } = pos;
      
      timeline.fromTo(
        animated,
        {
          x: from.x + from.width * 0.5 - to.x - to.width * 0.5,
          y: from.y + from.height * 0.5 - to.y - to.height * 0.5,
          scale: from.height / to.height
        },
        {
          x: 0,
          y: 0,
          scale: 1,
          duration: 2,
          ease: 'power3.in'
        },
        1
      );
    });
  } else {
    loxState.animatedLetters.forEach(letter => {
      gsap.set(letter, { x: 0, y: 0, scale: 1 });
    });
    
    timeline.fromTo(
      loxState.animatedLetters,
      { opacity: 0 },
      { opacity: 1, duration: 0.4, stagger: 0.1 },
      1
    );
    
    timeline.to(loxState.animatedLetters, { duration: 0.4 });
  }
}

function handleResize() {
  const wasDesktop = loxState.isDesktop;
  loxState.isDesktop = window.innerWidth >= LOX_CONFIG.MOBILE_BREAKPOINT;
  
  if (wasDesktop !== loxState.isDesktop) {
    ScrollTrigger.getAll().forEach(st => st.kill());
    calculatePositions();
    createScrollAnimation();
  }
}

// ============================================
// INITIALIZATION
// ============================================

function init() {
  initBackgroundCanvas('main-canvas', 'bg-canvas');
  initLOXAnimation();
  window.addEventListener('resize', handleResize);
}

// Auto-initialize
window.addEventListener('load', init);
if (document.readyState === 'complete') {
  init();
}