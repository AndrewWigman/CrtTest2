(function () {
    let raf, t = 0, root, scan, glitchUntil = 0, nextGlitchAt = 0;

    // tune here
    const WOBBLE_PX = 0.6;       // normal side-to-side amplitude (px)
    const WOBBLE_HZ = 0.25;      // wobble speed (cycles/sec)
    const CURVY_AMP = 0.0012;   // tiny modulation of Y curvature
    const BULGE_BASE = 0.0016;   // very subtle bulge
    const BULGE_AMP = 0.0003;   // tiny breathing tied to wobble

    // glitch tuning
    const GLITCH_MIN_MS = 6000;  // min time between glitches
    const GLITCH_MAX_MS = 22000; // max time between glitches
    const GLITCH_MS = 140;   // duration of a violent spike
    const GLITCH_SHIFT = 10;    // px lateral slam during glitch
    const GLITCH_CURVY = 0.02;  // big temporary curvature spike
    const GLITCH_BULGE = 0.006; // temporary stronger bulge

    function scheduleNextGlitch(now) {
        nextGlitchAt = now + (GLITCH_MIN_MS + Math.random() * (GLITCH_MAX_MS - GLITCH_MIN_MS));
    }

    function step(now) {
        t += 0.016; // ~60fps increment

        if (root) {
            // decide if we enter/leave glitch
            if (!glitchUntil && now >= nextGlitchAt) {
                glitchUntil = now + GLITCH_MS;
            }
            if (glitchUntil && now > glitchUntil) {
                glitchUntil = 0;
                scheduleNextGlitch(now);
            }

            if (!glitchUntil) {
                // NORMAL subtle wobble (side-to-side)
                const sx = Math.sin(t * 2 * Math.PI * WOBBLE_HZ);
                root.style.setProperty("--crt-shift-x", (sx * WOBBLE_PX).toFixed(2) + "px");
                root.style.setProperty("--crt-curv-y", (0.010 + CURVY_AMP * sx).toFixed(4));
                root.style.setProperty("--crt-curv-x", "0.010"); // keep X steady
                const b = BULGE_BASE + BULGE_AMP * Math.sin(t * 2 * Math.PI * (WOBBLE_HZ * 0.6));
                root.style.setProperty("--crt-bulge", b.toFixed(4));
            } else {
                // VIOLENT GLITCH: big lateral slam + curvature/bulge spike
                const dir = Math.random() < 0.5 ? -1 : 1;
                root.style.setProperty("--crt-shift-x", (dir * GLITCH_SHIFT) + "px");
                root.style.setProperty("--crt-curv-y", GLITCH_CURVY.toFixed(4));
                root.style.setProperty("--crt-curv-x", "0.012");
                root.style.setProperty("--crt-bulge", GLITCH_BULGE.toFixed(4));

                // punchy scanline bursts during glitch
                if (scan) {
                    const h = root.clientHeight || window.innerHeight;
                    for (let i = 0; i < 3; i++) {
                        const y = Math.floor(Math.random() * h);
                        setTimeout(() => {
                            scan.style.top = y + "px";
                            scan.style.opacity = 1;
                            setTimeout(() => scan.style.opacity = 0, 60);
                        }, i * 18);
                    }
                }
            }
        }

        // occasional random scanline even outside glitches
        if (!glitchUntil && scan && Math.random() < 0.007) {
            const h = root ? root.clientHeight : window.innerHeight;
            scan.style.top = Math.floor(Math.random() * h) + "px";
            scan.style.opacity = 1;
            setTimeout(() => scan.style.opacity = 0, 80);
        }

        raf = requestAnimationFrame(step);
    }

    function init() {
        root = document.querySelector(".crt-screen");
        if (!root) return;
        scan = root.querySelector(".crt-scanline");
        if (!scan) {
            scan = document.createElement("div");
            scan.className = "crt-scanline";
            root.appendChild(scan);
        }
        cancelAnimationFrame(raf);
        scheduleNextGlitch(performance.now());
        step(performance.now());
    }

    window.addEventListener("DOMContentLoaded", init);
    window.addEventListener("focus", init);
    window.addEventListener("blur", () => cancelAnimationFrame(raf));
})();