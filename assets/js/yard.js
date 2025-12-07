 
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
// YOS SCROLL ANIMATION
// ============================================

gsap.registerPlugin(ScrollTrigger);

const YOS_CONFIG = {
  FULL_TEXT: "Yard Operating System.",
  SCROLL_THRESHOLD: 0.99,
  MOBILE_BREAKPOINT: 768
};

const yosState = {
  currentTheme: "green",
  isDesktop: window.innerWidth >= YOS_CONFIG.MOBILE_BREAKPOINT,
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

function initYOSAnimation() {
  yosState.container = document.getElementById('yos-section');
  yosState.h2 = document.getElementById('main-heading');
  yosState.animatedLetters = document.querySelectorAll('#animated-yos .anchor-letter');
  yosState.targetLetters = document.querySelectorAll('.anchor-to .anchor-letter');
  yosState.superscript = document.querySelector('#animated-yos .superscript');
  
  buildHeading();
  
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      calculatePositions();
      createScrollAnimation();
    });
  });
}

function buildHeading() {
  const words = YOS_CONFIG.FULL_TEXT.split(" ");
  yosState.h2.innerHTML = '';
  
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
    
    yosState.h2.appendChild(wordWrapper);
  });
}

function calculatePositions() {
  const wordWrappers = yosState.h2.querySelectorAll('.heading__word-wrapper');
  yosState.originalLetterEls = [];
  
  wordWrappers.forEach(wrapper => {
    const firstLetter = wrapper.querySelector('span');
    if (firstLetter) yosState.originalLetterEls.push(firstLetter);
  });

  for (let i = 0; i < yosState.animatedLetters.length; i++) {
    const original = yosState.originalLetterEls[i];
    if (!original) continue;

    const target = yosState.targetLetters[i];
    const fromRect = original.getBoundingClientRect();
    const toRect = target.getBoundingClientRect();

    yosState.letterPositions[i].from = fromRect;
    yosState.letterPositions[i].to = toRect;

    const animated = yosState.animatedLetters[i];
    
    if (yosState.currentTheme === 'green') {
      gsap.set(animated, {
        x: fromRect.x + fromRect.width * 0.5 - toRect.x - toRect.width * 0.5,
        y: fromRect.y + fromRect.height * 0.5 - toRect.y - toRect.height * 0.5,
        scale: fromRect.height / toRect.height
      });
    }
    
    animated.style.opacity = '1';
    /* original.classList.add('hide'); */
    if (yosState.isDesktop) {
      original.classList.add('hide');
    }
  }
}

function createScrollAnimation() {
  const wordWrappers = yosState.h2.querySelectorAll('.heading__word-wrapper');
  
  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: yosState.container,
      start: 'top top',
      end: '90% bottom',
      scrub: true,
      onUpdate: (self) => {
        if (self.progress >= YOS_CONFIG.SCROLL_THRESHOLD && yosState.currentTheme !== 'white') {
          yosState.currentTheme = 'white';
          yosState.container.classList.remove('green');
          yosState.container.classList.add('white');
          yosState.superscript.classList.add('show');
          setCanvasTheme('white');
          setCanvasMode('wave');
        } else if (self.progress < YOS_CONFIG.SCROLL_THRESHOLD && yosState.currentTheme !== 'green') {
          yosState.currentTheme = 'green';
          yosState.container.classList.remove('white');
          yosState.container.classList.add('green');
          yosState.superscript.classList.remove('show');
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

  // Phase 2: Animate YOS letters
  if (yosState.isDesktop) {
    yosState.letterPositions.forEach((pos, i) => {
      const animated = yosState.animatedLetters[i];
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
    yosState.animatedLetters.forEach(letter => {
      gsap.set(letter, { x: 0, y: 0, scale: 1 });
    });
    
    timeline.fromTo(
      yosState.animatedLetters,
      { opacity: 0 },
      { opacity: 1, duration: 0.4, stagger: 0.1 },
      1
    );
    
    timeline.to(yosState.animatedLetters, { duration: 0.4 });
  }
}

function handleResize() {
  const wasDesktop = yosState.isDesktop;
  yosState.isDesktop = window.innerWidth >= YOS_CONFIG.MOBILE_BREAKPOINT;
  
  if (wasDesktop !== yosState.isDesktop) {
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
  initYOSAnimation();
  window.addEventListener('resize', handleResize);
}

// Auto-initialize
window.addEventListener('load', init);
if (document.readyState === 'complete') {
  init();
}
 