// Cross Flicker Animation
function initCrossFlicker(element) {
    const vertical = element.querySelector('.vertical');
    const horizontal = element.querySelector('.horizontal');
    
    if (typeof gsap === 'undefined') {
        console.warn('GSAP is required for animations');
        return null;
    }

    // Create timeline with random delay
    const timeline = gsap.timeline({
        repeat: -1,
        delay: Math.random() * 2
    });

    // Vertical animations
    timeline.to(vertical, {
        scaleY: 0,
        duration: 2.5,
        ease: "expo.inOut"
    }, 0);

    timeline.to(vertical, {
        scaleY: 1,
        duration: 2.5,
        ease: "expo.inOut"
    }, 2.5);

    // Horizontal animations
    timeline.to(horizontal, {
        scaleX: 0,
        duration: 2.5,
        ease: "expo.inOut"
    }, 0);

    timeline.to(horizontal, {
        scaleX: 1,
        duration: 2.5,
        ease: "expo.inOut"
    }, 2.5);

    // Handle responsive behavior
    function handleResize() {
        if (!timeline || !horizontal) return;
        
        const isLarge = window.innerWidth >= 1024;
        if (!isLarge && horizontal.clientWidth === 0) {
            timeline.pause();
        } else {
            timeline.resume();
        }
    }

    handleResize();
    window.addEventListener('resize', handleResize);

    return timeline;
}

// Logo Grid Animation
function initLogoGrid(element) {
    const images = element.querySelectorAll('.image');
    
    if (typeof gsap === 'undefined') {
        console.warn('GSAP is required for animations');
        return;
    }

    // Scroll-triggered fade-in animation
    const timeline = gsap.timeline({
        ease: "expo.out",
        duration: 2.4,
        scrollTrigger: {
            trigger: element,
            start: "20% 50%",
            toggleActions: "play none none reverse"
        }
    });

    images.forEach((image, index) => {
        timeline.fromTo(image, 
            { opacity: 0.3 },
            { opacity: 1 },
            0 + index * 0.1
        );
    });

    return timeline;
}

// Border Hover - Mouse Following Effect
function initBorderHover(wrapperElement) {
    const border = wrapperElement.querySelector('.border-holder');
    const bgGradient = wrapperElement.querySelector('.background-gradient');
    
    if (!border || !bgGradient) return;
    
    let wrapperRect = null;
    let scrollY = window.pageYOffset || document.documentElement.scrollTop;
    
    // Get initial position
    function updateWrapperPosition() {
        if (!wrapperElement) return;
        wrapperRect = wrapperElement.getBoundingClientRect();
        wrapperRect.y = wrapperRect.y + scrollY;
    }
    
    // Update on load
    updateWrapperPosition();
    
    // Track mouse movement
    function handleMouseMove(e) {
        if (!wrapperRect || !border || !bgGradient) return;
        
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        const offsetX = mouseX - wrapperRect.x;
        const offsetY = mouseY + scrollY - wrapperRect.y;
        
        const transformValue = `translate3d(calc(${Math.round(offsetX * 10) / 10}px - 50%), calc(${Math.round(offsetY * 10) / 10}px - 50%), 0)`;
        
        border.style.transform = transformValue;
        bgGradient.style.transform = transformValue;
    }
    
    // Track scroll
    function handleScroll() {
        scrollY = window.pageYOffset || document.documentElement.scrollTop;
        updateWrapperPosition();
    }
    
    // Track resize
    function handleResize() {
        updateWrapperPosition();
    }
    
    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    
    // Cleanup function (optional, if you need it later)
    return function cleanup() {
        document.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleResize);
    };
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all cross flickers
    const crossFlickers = document.querySelectorAll('.cross-flicker__wrapper');
    crossFlickers.forEach(function(el) {
        initCrossFlicker(el);
    });

    // Initialize all border hovers (mouse following gradients)
    const borderWrappers = document.querySelectorAll('.border__wrapper');
    borderWrappers.forEach(function(el) {
        initBorderHover(el);
    });

    // Initialize logo grid (fade-in on scroll)
    const logoGridWrapper = document.querySelector('.logo-grid-wrapper');
    if (logoGridWrapper) {
        initLogoGrid(logoGridWrapper);
    }
});
        