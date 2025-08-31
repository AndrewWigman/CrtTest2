// wwwroot/crt.js
(function () {
    let raf, t = 0, root, scan, glitchUntil = 0, nextGlitchAt = 0;

    // --- tuning ---
    const WOBBLE_PX = 0.4;     // subtler lateral wobble (px)
    const WOBBLE_HZ = 0.25;    // wobble speed (Hz)
    const CURVY_AMP = 0.0010;  // tiny Y curvature modulation
    const BULGE_BASE = 0.0016; // subtle bulge
    const BULGE_AMP = 0.0003;  // tiny breathing

    //const GLITCH_MIN_MS = 6000, GLITCH_MAX_MS = 22000;

    const GLITCH_MIN_MS = 3000, GLITCH_MAX_MS = 15000;
    const GLITCH_MS = 140, GLITCH_SHIFT = 13;      // violent slam
    const GLITCH_CURVY = 0.02, GLITCH_BULGE = 0.008;

    function scheduleNextGlitch(now) {
        nextGlitchAt = now + GLITCH_MIN_MS + Math.random() * (GLITCH_MAX_MS - GLITCH_MIN_MS);
    }

    function ensureScanline() {
        scan = root.querySelector(".crt-scanline");
        if (!scan) {
            scan = document.createElement("div");
            scan.className = "crt-scanline";
            root.appendChild(scan);
        }
    }

    function loop(now) {
        t += 0.016;

        if (root) {
            // glitch window
            if (!glitchUntil && now >= nextGlitchAt) glitchUntil = now + GLITCH_MS;
            if (glitchUntil && now > glitchUntil) { glitchUntil = 0; scheduleNextGlitch(now); }

            if (!glitchUntil) {
                // normal subtle wobble
                const sx = Math.sin(t * 2 * Math.PI * WOBBLE_HZ);
                root.style.setProperty("--crt-shift-x", (sx * WOBBLE_PX).toFixed(2) + "px");
                root.style.setProperty("--crt-curv-y", (0.010 + CURVY_AMP * sx).toFixed(4));
                root.style.setProperty("--crt-curv-x", "0.010");
                const b = BULGE_BASE + BULGE_AMP * Math.sin(t * 2 * Math.PI * (WOBBLE_HZ * 0.6));
                root.style.setProperty("--crt-bulge", b.toFixed(4));
            } else {
                // violent spike
                const dir = Math.random() < 0.5 ? -1 : 1;
                root.style.setProperty("--crt-shift-x", (dir * GLITCH_SHIFT) + "px");
                root.style.setProperty("--crt-curv-y", GLITCH_CURVY.toFixed(4));
                root.style.setProperty("--crt-curv-x", "0.012");
                root.style.setProperty("--crt-bulge", GLITCH_BULGE.toFixed(4));

                // quick scanline bursts
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

        // occasional random scanline outside glitches
        if (!glitchUntil && scan && Math.random() < 0.007) {
            const h = root ? root.clientHeight : window.innerHeight;
            scan.style.top = Math.floor(Math.random() * h) + "px";
            scan.style.opacity = 1;
            setTimeout(() => scan.style.opacity = 0, 80);
        }

        raf = requestAnimationFrame(loop);
    }

    function start() {
        root = document.querySelector(".crt-screen");
        if (!root) return false;
        ensureScanline();
        cancelAnimationFrame(raf);
        scheduleNextGlitch(performance.now());
        loop(performance.now());
        return true;
    }

    // Wait until Blazor has rendered <div class="crt-screen">
    function startWhenReady() {
        if (start()) return; // already there

        const obs = new MutationObserver((_muts, observer) => {
            if (start()) observer.disconnect();
        });
        obs.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", startWhenReady);
    } else {
        startWhenReady();
    }
})();
