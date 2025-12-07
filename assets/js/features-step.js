// ===== SVG MASK GENERATOR =====
const round = (n) => Math.round(n * 100) / 100;

function generateNotchPath(width, height, notchConfig) {
    const { position = 0.5, size = 0.4, offset = 30, radius = 8, notchWidth = 0.9 } = notchConfig;

    // Calculate notch points
    const margin = (1 - notchWidth) * width * 0.25;
    const notchStart = width * (position - size * 0.5) - margin;
    const notchEnd = width * (position + size * 0.5) + margin;
    const notchDepth = offset;

    // Create path with rounded corners
    const path = `
        M 0,0
        L 0,${height}
        L ${notchStart},${height}
        A ${radius},${radius} 0 0 1 ${notchStart + margin},${height - notchDepth}
        L ${notchEnd - margin},${height - notchDepth}
        A ${radius},${radius} 0 0 1 ${notchEnd},${height}
        L ${width},${height}
        L ${width},0
        Z
    `;

    return path.trim().replace(/\s+/g, ' ');
}

function updateSVGMask(svgElement, width, height, notchConfig) {
    svgElement.setAttribute('width', width);
    svgElement.setAttribute('height', height);
    svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);

    const path = svgElement.querySelector('.features-steps clipPath path');
    if (path) {
        path.setAttribute('d', generateNotchPath(width, height, notchConfig));
    }
}

// ===== COMPLETE FEATURES STEPS SCRIPT =====
(function () {
    gsap.registerPlugin(ScrollTrigger);

    // ===== STATE =====
    const state = {
        currentIndex: 0,
        digitHeight: 0,
        isDesktop: window.innerWidth >= 1024
    };

    // ===== DOM ELEMENTS =====
    const elements = {
        container: document.querySelector('.features-steps'),
        inner: document.querySelector('.features-steps .inner'),
        header: document.querySelector('.features-steps .header'),
        scrollItems: document.querySelector('.features-steps .scroll-items-list'),
        items: Array.from(document.querySelectorAll('.features-steps .scroll-item')),
        images: Array.from(document.querySelectorAll('.features-steps .image')),
        videos: Array.from(document.querySelectorAll('.features-steps video')),
        mobileCounters: Array.from(document.querySelectorAll('.features-steps .counter__mobile')),
        digitStacks: Array.from(document.querySelectorAll('.features-steps .digit-stack')),
        prevBtn: document.querySelector('.features-steps .buttons .button:first-child'),
        nextBtn: document.querySelector('.features-steps .buttons .button:last-child'),
        svgMask: document.querySelector('.features-steps .svg-mask'),
        svgElement: document.querySelector('.features-steps .svg-mask svg')
    };

    const totalItems = elements.items.length;

    // Notch configuration
    const notchConfig = {
        position: 0.5,
        size: 0.4,
        offset: 30,
        radius: 8,
        notchWidth: 0.9
    };

    // ===== TEXT ANIMATION FUNCTION =====
    function animateTextOnScroll(item, index) {
        const paragraph = item.querySelector('p');
        if (!paragraph) return;

        const text = paragraph.textContent;
        const words = text.split(' ');

        paragraph.innerHTML = words.map(word => {
            const chars = word.split('').map(char =>
                `<span class="split-chars">${char}</span>`
            ).join('');
            return `<span class="word">${chars}</span>`;
        }).join(' ');

        const chars = paragraph.querySelectorAll('.split-chars');

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: item,
                start: 'top 70%',
                end: 'bottom 30%',
                toggleActions: 'play none none reverse'
            }
        });

        tl.to(chars, {
            color: '#abff02',
            duration: 0.4,
            stagger: 0.015,
            ease: 'power2.inOut'
        }, 0)
            .to(chars, {
                color: '#052424',
                duration: 0.5,
                stagger: 0.015,
                ease: 'power2.inOut'
            }, 0.25);
    }

    // ===== MOBILE TEXT ANIMATION =====
    function setupMobileTextAnimation(item, index) {
        const paragraph = item.querySelector('p');
        if (!paragraph) return;

        const text = paragraph.textContent;
        const chars = text.split('');

        paragraph.innerHTML = chars.map((char, i) => {
            if (char === ' ') return ' ';
            return `<span class="split-chars" style="--v-delay:${i * 0.014}s">${char}</span>`;
        }).join('');
    }

    // ===== SPLIT TEXT =====
    function splitTextIntoChars() {
        if (state.isDesktop) {
            elements.items.forEach((item, index) => {
                animateTextOnScroll(item, index);
            });
        } else {
            elements.items.forEach((item, index) => {
                setupMobileTextAnimation(item, index);
            });
        }
    }

    // ===== DIGIT HEIGHT =====
    function measureDigitHeight() {
        const firstDigit = elements.container.querySelector('.digit');
        if (firstDigit) {
            state.digitHeight = firstDigit.offsetHeight;
        }
    }

    // ===== COUNTER UPDATE =====
    function updateCounter(value) {
        const paddedValue = String(value).padStart(2, '0');
        const digits = paddedValue.split('').map(d => parseInt(d));

        elements.digitStacks.forEach((stack, index) => {
            const digit = digits[index];
            const translateY = digit * state.digitHeight;
            stack.style.transform = `translateY(${-translateY}px)`;
        });
    }

    // ===== UPDATE DISPLAY =====
    function updateDisplay() {
        elements.inner.style.setProperty('--current-item', state.currentIndex);

        elements.items.forEach((item, i) => {
            item.classList.toggle('show', i === state.currentIndex);
        });

        elements.images.forEach((img, i) => {
            img.classList.toggle('is-visible', i <= state.currentIndex);
        });

        elements.mobileCounters.forEach((counter, i) => {
            counter.classList.toggle('show', i === state.currentIndex);
        });

        if (elements.prevBtn) elements.prevBtn.disabled = state.currentIndex === 0;
        if (elements.nextBtn) elements.nextBtn.disabled = state.currentIndex === totalItems - 1;

        updateCounter(state.currentIndex + 1);
        playCurrentVideo();
    }

    // ===== SET INDEX =====
    function setIndex(index) {
        const clampedIndex = Math.max(0, Math.min(index, totalItems - 1));

        if (state.currentIndex !== clampedIndex) {
            state.currentIndex = clampedIndex;
            updateDisplay();
        }
    }

    // ===== VIDEO MANAGEMENT =====
    function playCurrentVideo() {
        elements.videos.forEach((video, index) => {
            if (index === state.currentIndex) {
                video.currentTime = 0;
                video.play().catch(() => { });
            } else {
                video.pause();
            }
        });
    }

    function setupAutoPlayVideos() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.play().catch(() => { });
                } else {
                    entry.target.pause();
                }
            });
        }, { threshold: 0.5 });

        elements.videos.forEach(video => observer.observe(video));
    }

    // ===== NAVIGATION =====
    function navigate(direction) {
        const newIndex = state.currentIndex + direction;
        if (newIndex >= 0 && newIndex < totalItems) {
            setIndex(newIndex);

            if (!state.isDesktop && elements.scrollItems) {
                elements.scrollItems.scrollTo({
                    left: elements.scrollItems.offsetWidth * newIndex * 0.85,
                    behavior: 'smooth'
                });
            }
        }
    }

    // ===== DESKTOP SCROLL =====
    function setupDesktopScroll() {
        elements.items.forEach((item, index) => {
            ScrollTrigger.create({
                trigger: item,
                start: 'top 60%',
                end: 'bottom 40%',
                onEnter: () => setIndex(index),
                onEnterBack: () => setIndex(index)
            });
        });

        // Animate SVG mask notch on scroll
        if (elements.svgMask && elements.container) {
            ScrollTrigger.create({
                trigger: elements.container,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 0.5,
                onUpdate: (self) => {
                    const progress = self.progress;
                    notchConfig.position = 0.3 + (progress * 0.4);

                    if (elements.svgElement && elements.svgMask) {
                        updateSVGMask(
                            elements.svgElement,
                            elements.svgMask.offsetWidth,
                            elements.svgMask.offsetHeight,
                            notchConfig
                        );
                    }
                }
            });
        }
    }

    // ===== MOBILE SCROLL =====
    function handleMobileScroll() {
        const scrollLeft = elements.scrollItems.scrollLeft;
        const itemWidth = elements.scrollItems.offsetWidth * 0.85;
        const newIndex = Math.round(scrollLeft / itemWidth);
        setIndex(newIndex);
    }

    // ===== EVENT LISTENERS =====
    function setupEventListeners() {
        if (elements.prevBtn) {
            elements.prevBtn.addEventListener('click', () => navigate(-1));
        }
        if (elements.nextBtn) {
            elements.nextBtn.addEventListener('click', () => navigate(1));
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') navigate(-1);
            if (e.key === 'ArrowRight') navigate(1);
        });

        if (!state.isDesktop && elements.scrollItems) {
            elements.scrollItems.addEventListener('scroll', handleMobileScroll);
        }

        window.addEventListener('resize', handleResize);
    }

    function handleResize() {
        const wasDesktop = state.isDesktop;
        state.isDesktop = window.innerWidth >= 1024;

        if (wasDesktop !== state.isDesktop) {
            ScrollTrigger.refresh();
            splitTextIntoChars();

            if (state.isDesktop) {
                setupDesktopScroll();
            }
        }

        measureDigitHeight();

        // Update SVG mask dimensions
        if (elements.svgElement && elements.svgMask) {
            updateSVGMask(
                elements.svgElement,
                elements.svgMask.offsetWidth,
                elements.svgMask.offsetHeight,
                notchConfig
            );
        }
    }

    // ===== INITIALIZATION =====
    function init() {
        splitTextIntoChars();
        measureDigitHeight();
        setupEventListeners();

        if (state.isDesktop) {
            setupDesktopScroll();
        }

        updateCounter(1);
        setupAutoPlayVideos();
        updateDisplay();

        // Initialize SVG mask
        if (elements.svgElement && elements.svgMask) {
            updateSVGMask(
                elements.svgElement,
                elements.svgMask.offsetWidth,
                elements.svgMask.offsetHeight,
                notchConfig
            );
        }
    }

    // ===== START =====
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
