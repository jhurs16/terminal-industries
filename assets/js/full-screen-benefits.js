document.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(ScrollTrigger);

  // ============================================================================
  // CONFIGURATION
  // ============================================================================
  const CONFIG = {
    desktopBreakpoint: 1024,
    notchOffsetDesktop: 40,
    notchOffsetMobile: 20,
    counterAnimationDuration: 0.6, // Faster counter updates
    progressBarDuration: 0.2 // Smoother progress bar
  };

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  const state = {
    wrapper: document.querySelector(".fullscreen-features__wrapper"),
    stickyWrapper: document.querySelector(".fullscreen-features__wrapper .sticky__wrapper"),
    stickyLayouts: Array.from(document.querySelectorAll(".fullscreen-features__wrapper .sticky-layout")),
    currentIndex: -1,
    previousIndex: -1,
    scrollProgress: 0,
    counterValue: 0,
    isDesktop: window.innerWidth >= CONFIG.desktopBreakpoint,
    scrollTriggers: [],
    activeVideos: new Set() // Track playing videos to prevent duplicates
  };

  const itemsCount = state.stickyLayouts.length;

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

  const lerp = (start, end, t) => start + (end - start) * t;

  // Improved easing function for smoother transitions
  const customEase = (progress) => {
    const floored = Math.floor(progress);
    const decimal = progress - floored;
    if (decimal < 0.5) return floored; // Hold longer before transition
    // Smoother easing for the transition
    const t = (decimal - 0.5) / 0.5; // normalize to 0-1
    return floored + (t * t * (3 - 2 * t)); // smoothstep easing
  };

  // ============================================================================
  // VIDEO CONTROLS
  // ============================================================================

  const playVideos = (index) => {
    const layout = state.stickyLayouts[index];
    if (!layout || state.activeVideos.has(index)) return;

    const videos = layout.querySelectorAll("video");
    videos.forEach(video => {
      if (video.paused) {
        video.currentTime = 0;
        video.play().catch(err => console.log("Video autoplay prevented:", err));
      }
    });
    state.activeVideos.add(index);
  };

  const pauseVideos = (index) => {
    const layout = state.stickyLayouts[index];
    if (!layout) return;

    const videos = layout.querySelectorAll("video");
    videos.forEach(video => {
      if (!video.paused) {
        video.pause();
      }
    });
    state.activeVideos.delete(index);
  };

  // ============================================================================
  // TEXT ANIMATIONS
  // ============================================================================

  const animateTextIn = (layout, delay = 0) => {
    const preTitle = layout.querySelector(".pre-title");
    const title = layout.querySelector(".title");
    const content = layout.querySelector(".content__paragraph");
    const strongElements = layout.querySelectorAll("strong");

    const timeline = gsap.timeline({ delay });

    // Animate text elements with better stagger
    timeline.fromTo(
      [preTitle, title, content],
      { opacity: 0, y: 30 },
      { 
        opacity: 1, 
        y: 0, 
        duration: 0.7, 
        stagger: 0.08,
        ease: "power3.out"
      }
    );

    // Animate strong elements with color transition
    strongElements.forEach((el, i) => {
      gsap.delayedCall(delay + i * 0.15 + 0.25, () => {
        el.classList.add("show");
      });
    });
  };

  const animateTextOut = (layout) => {
    const preTitle = layout.querySelector(".pre-title");
    const title = layout.querySelector(".title");
    const content = layout.querySelector(".content__paragraph");
    const strongElements = layout.querySelectorAll("strong");

    gsap.to([preTitle, title, content], {
      opacity: 0,
      y: -20,
      duration: 0.25,
      ease: "power2.in"
    });

    strongElements.forEach(el => el.classList.remove("show"));
  };

  // ============================================================================
  // LAYOUT VISIBILITY
  // ============================================================================

  const updateLayoutVisibility = (index, show) => {
    const layout = state.stickyLayouts[index];
    if (!layout) return;

    const bottomLayout = layout.querySelector(".bottom-layout");
    const notchWrapper = layout.querySelector(".notch__wrapper");

    if (show) {
      gsap.set(layout, { pointerEvents: "auto" });
      layout.classList.add("pointer");
      if (notchWrapper) notchWrapper.classList.add("show");
      if (bottomLayout) {
        bottomLayout.classList.add("show");
        animateTextIn(layout, 0.15);
      }
      playVideos(index);
    } else {
      gsap.set(layout, { pointerEvents: "none" });
      layout.classList.remove("pointer");
      if (bottomLayout) {
        bottomLayout.classList.remove("show");
        animateTextOut(layout);
      }
      pauseVideos(index);
    }
  };

  // ============================================================================
  // PROGRESS BAR & COUNTER - FIXED SYNC
  // ============================================================================

  const updateProgressBar = (itemProgress) => {
    const progressBar = document.querySelector(".fullscreen-features__wrapper .progress-bar .progress");
    const counter = document.querySelector(".fullscreen-features__wrapper .counter");
    const progressBarWrapper = document.querySelector(".fullscreen-features__wrapper .progress-bar");
    
    if (!progressBar) return;

    // Normalize progress: 0 to 1 across all items
    const normalizedProgress = clamp(itemProgress / (itemsCount - 1), 0, 1);
    
    // Scale progress bar from 7% to 100%
    const scaleY = lerp(0.07, 1, normalizedProgress);
    gsap.to(progressBar, {
      scaleY: scaleY,
      duration: CONFIG.progressBarDuration,
      ease: "power2.out",
      overwrite: true
    });

    // Sync counter position with progress bar
    if (counter && progressBarWrapper) {
      const height = progressBarWrapper.offsetHeight || 193;
      const translateY = height * scaleY;
      
      gsap.to(counter, {
        y: translateY,
        duration: CONFIG.progressBarDuration,
        ease: "power2.out",
        overwrite: true
      });
    }
  };

  const updateCounter = (value) => {
    // Prevent duplicate animations
    gsap.killTweensOf(state, "counterValue");
    
    gsap.to(state, {
      counterValue: value,
      duration: CONFIG.counterAnimationDuration,
      ease: "power2.out",
      onUpdate: () => {
        updateOdometerDigits(state.counterValue);
      },
      overwrite: true
    });
  };

  // ============================================================================
  // ODOMETER COUNTER ANIMATION - FIXED
  // ============================================================================

  const updateOdometerDigits = (value) => {
    const digitColumns = document.querySelectorAll(".fullscreen-features__wrapper .digit-column");
    if (!digitColumns.length) return;

    // Round and pad to 2 digits (01, 02, 03)
    const currentValue = Math.max(1, Math.round(value)); // Minimum 1, maximum itemsCount
    const digits = String(currentValue).padStart(2, "0").split("");

    digitColumns.forEach((column, index) => {
      const digitStack = column.querySelector(".digit-stack");
      if (!digitStack) return;

      const targetDigit = parseInt(digits[index]);
      const digitHeight = column.offsetHeight || 26;
      
      const translateY = -targetDigit * digitHeight;
      
      gsap.to(digitStack, {
        y: translateY,
        duration: CONFIG.counterAnimationDuration,
        ease: "power2.out",
        overwrite: true
      });
    });
  };

  // ============================================================================
  // NOTCH ANIMATIONS
  // ============================================================================

  const updateNotchProgress = (easedProgress) => {
    state.stickyLayouts.forEach((layout, i) => {
      const imageLayout = layout.querySelector(".image-layout");
      const overlay = layout.querySelector(".overlay");
      
      if (!imageLayout) return;

      // Calculate notch progress for this item (0 to 1)
      const notchProgress = clamp(easedProgress - i, 0, 1);
      
      // Update CSS variable
      imageLayout.style.setProperty("--notch-progress", notchProgress);

      // Update overlay opacity (desktop only)
      if (state.isDesktop && overlay) {
        gsap.to(overlay, {
          opacity: 1 - notchProgress,
          duration: 0.1,
          overwrite: true
        });
      }
    });
  };

  // ============================================================================
  // INDEX MANAGEMENT
  // ============================================================================

  const updateCurrentIndex = (newIndex) => {
    if (newIndex === state.currentIndex) return;

    state.previousIndex = state.currentIndex;
    state.currentIndex = newIndex;

    // Handle visibility changes
    if (state.isDesktop) {
      // Desktop: only show current
      state.stickyLayouts.forEach((_, i) => {
        updateLayoutVisibility(i, i === newIndex);
      });
    } else {
      // Mobile: show all up to current
      state.stickyLayouts.forEach((_, i) => {
        updateLayoutVisibility(i, i <= newIndex);
      });
    }
  };

  // ============================================================================
  // SCROLL TRIGGERS
  // ============================================================================

  const initDesktopScroll = () => {
    if (!state.wrapper || itemsCount === 0) return;

    const scrollTrigger = ScrollTrigger.create({
      trigger: state.wrapper,
      start: "top top",
      end: "bottom bottom",
      pin: state.stickyWrapper,
      scrub: 0.5, // Slight smoothing for better sync
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const progress = self.progress;
        state.scrollProgress = progress;

        if (progress === 0) {
          updateCurrentIndex(0);
          updateNotchProgress(0);
          updateProgressBar(0);
          updateCounter(1);
          return;
        }

        // Calculate progress across all items
        // Map 0-1 scroll to 0-(itemsCount-1) item progress
        const rawProgress = progress * itemsCount - 0.5;
        const easedProgress = customEase(rawProgress + 0.5);
        
        // Clamp to valid range
        const clampedProgress = clamp(easedProgress, 0, itemsCount - 1);
        
        // Update current index (which item is active)
        const newIndex = Math.floor(clampedProgress + 0.5);
        updateCurrentIndex(clamp(newIndex, 0, itemsCount - 1));

        // Update notch animations
        updateNotchProgress(clampedProgress);

        // Update progress bar and counter - SYNCED
        updateProgressBar(clampedProgress);
        updateCounter(clampedProgress + 1); // Counter: 1, 2, 3
      }
    });

    state.scrollTriggers.push(scrollTrigger);
  };

  const initMobileScroll = () => {
    if (!state.wrapper || itemsCount === 0) return;

    const scrollTrigger = ScrollTrigger.create({
      trigger: state.wrapper,
      start: "top 50%",
      end: "bottom 50%",
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const progress = self.progress;
        state.scrollProgress = progress;

        if (progress < 0.05) {
          updateCurrentIndex(-1);
          return;
        }

        // Calculate index based on progress
        const adjustedProgress = (progress - 0.05) / 0.95;
        const newIndex = Math.min(
          Math.floor(adjustedProgress * itemsCount),
          itemsCount - 1
        );

        updateCurrentIndex(newIndex);
      }
    });

    state.scrollTriggers.push(scrollTrigger);
  };

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  const init = () => {
    if (!state.wrapper || itemsCount === 0) {
      console.warn("Terminal scroll: wrapper or items not found");
      return;
    }

    // Set initial state
    state.isDesktop = window.innerWidth >= CONFIG.desktopBreakpoint;

    // CRITICAL: Hide all layouts initially to prevent overlap
    state.stickyLayouts.forEach((layout, i) => {
      const bottomLayout = layout.querySelector(".bottom-layout");
      if (i !== 0) {
        gsap.set(layout, { pointerEvents: "none" });
        layout.classList.remove("pointer");
        if (bottomLayout) {
          bottomLayout.classList.remove("show");
          gsap.set([
            bottomLayout.querySelector(".pre-title"),
            bottomLayout.querySelector(".title"),
            bottomLayout.querySelector(".content__paragraph")
          ], { opacity: 0 });
        }
      }
    });

    // Initialize based on viewport
    const mm = gsap.matchMedia();
    
    mm.add({
      isDesktop: `(min-width: ${CONFIG.desktopBreakpoint}px)`,
      isMobile: `(max-width: ${CONFIG.desktopBreakpoint - 1}px)`
    }, (context) => {
      const { isDesktop } = context.conditions;

      // Clear existing triggers
      state.scrollTriggers.forEach(st => st.kill());
      state.scrollTriggers = [];

      // Reset state
      state.currentIndex = -1;
      state.isDesktop = isDesktop;
      state.activeVideos.clear();

      // Kill any ongoing animations
      gsap.killTweensOf(state);

      // Initialize scroll behavior
      if (isDesktop) {
        initDesktopScroll();
        // Show ONLY first item after initialization
        gsap.delayedCall(0.05, () => {
          // Force hide all except first
          state.stickyLayouts.forEach((layout, i) => {
            if (i !== 0) {
              gsap.set(layout, { pointerEvents: "none" });
              layout.classList.remove("pointer");
              const bottomLayout = layout.querySelector(".bottom-layout");
              if (bottomLayout) bottomLayout.classList.remove("show");
            }
          });
          
          // Then show first
          updateCurrentIndex(0);
          updateCounter(1);
          updateProgressBar(0);
        });
      } else {
        initMobileScroll();
      }

      return () => {
        // Cleanup function
        state.scrollTriggers.forEach(st => st.kill());
        state.activeVideos.clear();
      };
    });
  };

  // ============================================================================
  // START
  // ============================================================================

  init();

  // Optimized resize handler with debounce
  let resizeTimer;
  const handleResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const wasDesktop = state.isDesktop;
      state.isDesktop = window.innerWidth >= CONFIG.desktopBreakpoint;
      
      // Only refresh if viewport type changed
      if (wasDesktop !== state.isDesktop) {
        ScrollTrigger.refresh();
      }
    }, 250);
  };

  window.addEventListener("resize", handleResize);
  
  // Cleanup on page unload
  window.addEventListener("beforeunload", () => {
    state.scrollTriggers.forEach(st => st.kill());
    state.activeVideos.clear();
  });
});