const WORKER_CODE = `
        (function() {
            "use strict";
            self.addEventListener("message", async s => {
                switch (s.data.type) {
                case "frames":
                    {
                        const {frames: e} = s.data.payload;
                        const t = await Promise.all(e.map(async a => ({
                            blob: await (await fetch(a)).blob(),
                            frame: a
                        })));
                        self.postMessage({
                            type: "blobs",
                            payload: {
                                blobs: t
                            }
                        })
                    }
                }
            })
        })();
        `;

        // Register GSAP plugins
        gsap.registerPlugin(ScrollTrigger, SplitText);

        // ============================================
        // MAIN APP
        // ============================================
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        const loading = document.getElementById('loading');
        const scrollIndicator = document.getElementById('scrollIndicator');
        const indicatorInner = document.getElementById('indicatorInner');

        // Text elements
        const titles = [
            document.getElementById('title1'),
            document.getElementById('title2'),
            document.getElementById('title3')
        ];

        // Frame configuration
        let images = [];
        let currentFrame = 0;
        let isDesktop = window.innerWidth >= 1024;

        // Set canvas size
        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resizeCanvas();
        window.addEventListener('resize', () => {
            resizeCanvas();
            const wasDesktop = isDesktop;
            isDesktop = window.innerWidth >= 1024;
            if (wasDesktop !== isDesktop) {
                // Reload frames if device type changed
                location.reload();
            }
        });

        // Generate frame URLs helper
        // function generateFrames(urlTemplate, count, startIndex = 0) {
        //     const urls = [];
        //     for (let i = startIndex; i < startIndex + count; i++) {
        //         urls.push(urlTemplate.replace('{index}', i));
        //     }
        //     return urls;
        // }
        function generateFrames(urlTemplate, count, startIndex = 0) {
            const urls = [];
            for (let i = startIndex; i < startIndex + count; i++) {
                // Pad the number to 4 digits with leading zeros
                const paddedIndex = i.toString().padStart(4, '0');
                urls.push(urlTemplate.replace('{index}', paddedIndex));
            }
            return urls;
        }
        // Get appropriate frames based on device
        // const desktopFrames = generateFrames(
        //     "https://terminal-industries.com/static/frames/home/desktop/webp/hero_anim_desktop_60_{index}.webp",
        //     410,
        //     0
        // );
        
        const desktopFrames = generateFrames(
            "_{index}.webp",
            301,
            1  
        );

        const mobileFrames = generateFrames(
            "./images/hero-desktop-webp/HERO_{index}.webp",
            301,
            1
        );

        const frameURLs = isDesktop ? desktopFrames : mobileFrames;
        const FRAME_COUNT = frameURLs.length;

        // Initialize Web Worker
        const blob = new Blob([WORKER_CODE], { type: 'application/javascript' });
        const worker = new Worker(URL.createObjectURL(blob));

        worker.onmessage = function(e) {
            if (e.data.type === 'blobs') {
                const blobs = e.data.payload.blobs;
                loadImages(blobs);
            }
        };

        // Load images from blobs
        async function loadImages(blobs) {
            const loadPromises = blobs.map((item, index) => {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => {
                        images[index] = img;
                        resolve();
                    };
                    img.src = URL.createObjectURL(item.blob);
                });
            });

            await Promise.all(loadPromises);
            
            // Hide loading with GSAP
            gsap.to(loading, {
                opacity: 0,
                duration: 0.5,
                onComplete: () => {
                    loading.style.display = 'none';
                }
            });
            
            updateFrame(0);
            animateIndicator();
            
            // Set initial visibility
            gsap.set('.homepage-scroll-content', { autoAlpha: 1 });
        }

        // Start loading frames
        worker.postMessage({
            type: 'frames',
            payload: { frames: frameURLs }
        });

        // Split text into characters using GSAP SplitText
        const titleSplits = titles.map(title => {
            return new SplitText(title, {
                type: "chars",
                charsClass: "char"
            });
        });

        const titleChars = titleSplits.map(split => split.chars);

        // Update canvas frame
        function updateFrame(index) {
            if (images[index]) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(images[index], 0, 0, canvas.width, canvas.height);
            }
        }

        // Update text animation based on progress
        function updateTextAnimation(progress) {
            const adjustedProgress = progress - 0.03;
            const titleIndex = Math.floor(adjustedProgress * 3);
            const titleProgress = (adjustedProgress * 3) - titleIndex;

            // Reset all characters
            titleChars.forEach((chars, index) => {
                if (index !== titleIndex) {
                    chars.forEach(char => {
                        gsap.set(char, { opacity: 0, color: '#abff02' });
                    });
                }
            });

            // Animate current title
            if (titleChars[titleIndex]) {
                const chars = titleChars[titleIndex];
                const fadeInEnd = 0.5;
                const fadeOutStart = 0.6;
                
                const fadeInProgress = Math.min(titleProgress / fadeInEnd, 1);
                const fadeOutProgress = Math.max(0, (titleProgress - fadeOutStart) / (1 - fadeOutStart));

                chars.forEach((char, i) => {
                    const charRatio = i / chars.length;
                    const nextCharRatio = (i + 1) / chars.length;
                    
                    // Fade in calculation
                    const fadeInCharProgress = (fadeInProgress - charRatio) / (nextCharRatio - charRatio);
                    const fadeInEased = gsap.parseEase('power2.out')(Math.max(0, Math.min(1, fadeInCharProgress)));
                    
                    // Fade out calculation
                    const fadeOutCharProgress = (fadeOutProgress - charRatio) / (nextCharRatio - charRatio);
                    const fadeOutEased = gsap.parseEase('power2.in')(Math.max(0, Math.min(1, fadeOutCharProgress)));
                    
                    const opacity = fadeInEased * (1 - fadeOutEased);
                    const color = fadeInCharProgress < 1 ? '#abff02' : '#ffffff';
                    
                    gsap.set(char, { opacity, color });
                });
            }
        }

        // Initialize GSAP ScrollTrigger for frame sequence
        let scrollProgress = 0;

        ScrollTrigger.create({
            trigger: '.video-sequence-scroll',
            start: 'top top',
            end: 'bottom bottom',
            scrub: true,
            onUpdate: (self) => {
                scrollProgress = self.progress;
                
                // Update frame
                const frameIndex = Math.min(
                    Math.floor(self.progress * FRAME_COUNT),
                    FRAME_COUNT - 1
                );
                if (frameIndex !== currentFrame && images[frameIndex]) {
                    currentFrame = frameIndex;
                    updateFrame(frameIndex);
                }

                // Update text animation
                updateTextAnimation(self.progress);
            }
        });

        // Scroll indicator fade out animation
        ScrollTrigger.create({
            start: 'top top',
            end: 'top+=500',
            scrub: true,
            onEnter: () => gsap.to(scrollIndicator, { opacity: 1, duration: 0.3 }),
            onEnterBack: () => gsap.to(scrollIndicator, { opacity: 1, duration: 0.3 }),
            onLeave: () => gsap.to(scrollIndicator, { opacity: 0, duration: 0.3 })
        });

        // Scroll indicator animation loop
        function animateIndicator() {
            const maxHeight = 27;
            const innerHeight = 12;
            const moveDistance = maxHeight - innerHeight;

            const tl = gsap.timeline({
                repeat: -1,
                repeatDelay: 0.3
            });

            tl.to(indicatorInner, {
                y: moveDistance,
                duration: 1.2,
                ease: 'expo.out'
            });
            
            tl.to(indicatorInner, {
                y: 0,
                duration: 1.2,
                ease: 'expo.out'
            });
        }

        animateIndicator();


        // 2nd section 
        function animateTextOnScroll(targetSelector, triggerSelector, options = {}) {
            const element = document.querySelector(targetSelector);
            const trigger = document.querySelector(triggerSelector);
            
            if (!element || !trigger) return;
            
            const {
                startColor = "#abff02",    // Lime green
                endColor = "#052424"       // Dark green
            } = options;
            
            // Split text into words and characters (matching their implementation)
            const split = new SplitText(element, {
                type: "words, chars",
                tag: "span",
                charsClass: "--char"
            });
            
            // Get characters inside <strong> (matching their selector)
            const chars = Array.from(element.querySelectorAll("#animated-text strong .--char"));
            
            if (!chars.length) return;
            
            // Get ALL characters for final state
            const allChars = Array.from(element.querySelectorAll("#animated-text .--char"));
            
            // Create timeline with ScrollTrigger (exact match to their code)
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: trigger,
                    start: "top 40%",
                    markers: false
                }
            });
            
            // First animation: light gray → lime green
            tl.to(chars, {
                color: startColor,
                duration: 0.4,
                stagger: 0.05,
                ease: "power2.inOut"
            }, 0)
            // Second animation: lime green → dark green (overlaps at 0.25s)
            .to(chars, {
                color: endColor,
                duration: 0.5,
                stagger: 0.05,
                ease: "power2.inOut"
            }, 0.25)
            // Final state: all text becomes black
            .to(allChars, {
                color: "#052424",
                duration: 0.3,
                ease: "power2.inOut"
            }, "+=0.2");
        }

        // Initialize animation when DOM is ready
        document.addEventListener("DOMContentLoaded", () => {
            animateTextOnScroll("#animated-text", "#trigger-section");
        });