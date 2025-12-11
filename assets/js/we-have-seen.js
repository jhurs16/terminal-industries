
// Quote Section - Parallax Effect
function initQuoteParallax(element) {
    const imageWrapper = element.querySelector('.image-wrapper');

    if (!imageWrapper) return;

    if (typeof gsap === 'undefined') {
        console.warn('GSAP is required for animations');
        return;
    }

    // Set initial position
    gsap.set(imageWrapper, {
        yPercent: -15
    });

    // Create parallax scroll effect
    gsap.to(imageWrapper, {
        yPercent: 15,
        ease: "none",
        scrollTrigger: {
            trigger: element,
            start: "top bottom",
            end: "bottom top",
            scrub: true
        }
    });
}

// Initialize Quote sections
function initQuoteSections() {
    const quoteSections = document.querySelectorAll('.notch-section__wrapper');

    quoteSections.forEach(function (section) {
        const quoteContent = section.querySelector('.big-image-content');
        if (quoteContent) {
            initQuoteParallax(quoteContent);
        }
    });
}

// Complete initialization
document.addEventListener('DOMContentLoaded', function () {
    // Initialize all cross flickers
    const crossFlickers = document.querySelectorAll('.cross-flicker__wrapper');
    crossFlickers.forEach(function (el) {
        initCrossFlicker(el);
    });

    // Initialize all border hovers (mouse following gradients)
    const borderWrappers = document.querySelectorAll('.border__wrapper');
    borderWrappers.forEach(function (el) {
        initBorderHover(el);
    });

    // Initialize logo grid (fade-in on scroll)
    const logoGridWrapper = document.querySelector('.logo-grid-wrapper');
    if (logoGridWrapper) {
        initLogoGrid(logoGridWrapper);
    }

    // Initialize quote sections (parallax effect)
    initQuoteSections();
});
