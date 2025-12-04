/*****************************************************
 * 1. Prevent Scroll Until Frames Load
 *****************************************************/
document.body.style.overflow = "hidden";   // Lock scroll

/*****************************************************
 * 2. Web Worker Loader
 *****************************************************/
const WORKER_CODE = `
(function () {
    "use strict";
    self.addEventListener("message", async (s) => {
        if (s.data.type === "frames") {
            const { frames } = s.data.payload;
            const loaded = await Promise.all(
                frames.map(async (f) => ({
                    blob: await (await fetch(f)).blob(),
                    frame: f
                }))
            );
            self.postMessage({ type: "blobs", payload: { blobs: loaded } });
        }
    });
})();
`;

gsap.registerPlugin(ScrollTrigger, SplitText);

/*****************************************************
 * 3. DOM ELEMENTS
 *****************************************************/
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const loading = document.getElementById("loading");
const scrollIndicator = document.getElementById("scrollIndicator");
const indicatorInner = document.getElementById("indicatorInner");

const titles = [
    document.getElementById("title1"),
    document.getElementById("title2"),
    document.getElementById("title3"),
];

/*****************************************************
 * 4. Canvas Resize
 *****************************************************/
let isDesktop = window.innerWidth >= 1024;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

/*****************************************************
 * 5. Generate Frame URLs
 *****************************************************/
function generateFrames(template, count, start = 0) {
    const arr = [];
    for (let i = start; i < start + count; i++) {
        arr.push(template.replace("{index}", i.toString().padStart(4, "0")));
    }
    return arr;
}

const base = window.location.origin;

const desktopFrames = generateFrames(
    `${base}/assets/images/hero-desktop-webp/HERO_{index}_converted.webp`,
    301,
    1
);

const mobileFrames = generateFrames(
    `${base}/assets/images/hero-mobile-webp/HERO MW_{index}_converted.webp`,
    301,
    1
);

const frameURLs = isDesktop ? desktopFrames : mobileFrames;
const FRAME_COUNT = frameURLs.length;

/*****************************************************
 * 6. Load Frames Through Web Worker
 *****************************************************/
let images = [];

const blob = new Blob([WORKER_CODE], { type: "application/javascript" });
const worker = new Worker(URL.createObjectURL(blob));

worker.onmessage = (e) => {
    if (e.data.type === "blobs") loadImages(e.data.payload.blobs);
};

worker.postMessage({ type: "frames", payload: { frames: frameURLs } });

async function loadImages(blobs) {
    const promises = blobs.map((item, idx) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                images[idx] = img;
                resolve();
            };
            img.src = URL.createObjectURL(item.blob);
        });
    });

    await Promise.all(promises);

    // Fade out loader
    gsap.to(loading, {
        opacity: 0,
        duration: 0.5,
        onComplete: () => (loading.style.display = "none"),
    });

    // Unlock scroll
    document.body.style.overflow = "auto";

    updateFrame(0);
    animateIndicator();
}

/*****************************************************
 * 7. Draw Canvas Frame
 *****************************************************/
function updateFrame(i) {
    if (images[i]) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(images[i], 0, 0, canvas.width, canvas.height);
    }
}

/*****************************************************
 * 8. TEXT SPLIT
 *****************************************************/
const titleSplits = titles.map(
    (t) => new SplitText(t, { type: "chars", charsClass: "char" })
);
const titleChars = titleSplits.map((s) => s.chars);

/*****************************************************
 * 9. PERFECT SCROLL-SYNCED TEXT ANIMATION
 *****************************************************/
function updateTextAnimation(progress) {
    const total = titleChars.length;
    const mapped = progress * total;

    const activeIndex = Math.floor(mapped);
    const localProgress = mapped - activeIndex;

    titleChars.forEach((chars, idx) => {
        const active = idx === activeIndex;

        chars.forEach((char, i) => {
            if (!active) {
                gsap.set(char, { opacity: 0, color: "#abff02" });
                return;
            }

            const ratio = i / chars.length;
            const opacity = gsap.utils.clamp(0, 1, (localProgress - ratio) * 4);
            const color = opacity < 1 ? "#abff02" : "#ffffff";

            gsap.set(char, { opacity, color });
        });
    });
}

/*****************************************************
 * 10. ScrollTrigger — Frame + Text Sync
 *****************************************************/
let currentFrame = 0;

ScrollTrigger.create({
    trigger: ".video-sequence-scroll",
    start: "top top",
    end: "bottom bottom",
    scrub: true,

    onUpdate: (self) => {
        const idx = Math.min(Math.floor(self.progress * FRAME_COUNT), FRAME_COUNT - 1);

        if (idx !== currentFrame && images[idx]) {
            currentFrame = idx;
            updateFrame(idx);
        }

        updateTextAnimation(self.progress);
    },
});

/*****************************************************
 * 11. Scroll Indicator Animation
 *****************************************************/
function animateIndicator() {
    const maxH = 27;
    const innerH = 12;
    const dist = maxH - innerH;

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.3 });

    tl.to(indicatorInner, {
        y: dist,
        duration: 1.2,
        ease: "expo.out",
    }).to(indicatorInner, {
        y: 0,
        duration: 1.2,
        ease: "expo.out",
    });
}
