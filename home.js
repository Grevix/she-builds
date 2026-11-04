/**
 * SHE BUILDS — Master Motion Orchestrator
 * High-precision typography mask reveal & organic butterfly asset transition.
 */

(function () {
  'use strict';

  // Elements
  const chars = document.querySelectorAll('.char-inner');
  const orangeLayer = document.getElementById('orangeLayer');
  const creamLayer = document.getElementById('creamLayer');
  const editorialHeader = document.querySelector('.editorial-header');
  const supportingCopy = document.querySelector('.supporting-copy');
  const heroCta = document.querySelector('.hero-cta');
  const timelineInspector = document.getElementById('timelineInspector');
  const inspSlider = document.getElementById('inspSlider');
  const inspTime = document.getElementById('inspTime');
  const btnPlayPause = document.getElementById('btnPlayPause');
  const btnReplay = document.getElementById('btnReplay');
  const frameTags = document.querySelectorAll('.frame-tag');

  // Check reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Mask state tracking
  const maskState = {
    progress: 0,
    feather: 16,
  };

  // Keep full-screen (100vw x 100vh) headline & butterfly proportions exact across all aspect ratios
  const REF_ASPECT = 547 / 303;
  function syncFullScreenLayout() {
    const vw = window.innerWidth || 1641;
    const vh = window.innerHeight || 909;
    const currentAspect = vw / vh;
    // Scale Y inversely with aspect ratio so vertical height of SHE BUILDS stays locked at 35.31vh
    // while horizontal width spans the full 90.68vw across the entire screen
    const aspectRatioFactor = REF_ASPECT / currentAspect;
    const scaleY = (0.9927 * aspectRatioFactor).toFixed(4);
    document.documentElement.style.setProperty('--hl-scale-y', scaleY);
  }
  syncFullScreenLayout();
  window.addEventListener('resize', syncFullScreenLayout);

  function updateButterflyMask(progress) {
    window.__butterflyIntroProgress = progress;
    if (!orangeLayer) return;
    
    // Smooth progressive expansion from body/floral embroidery across the wings
    // progress is 0.0 -> 1.0
    const stop1 = Math.max(0, (progress * 115) - maskState.feather);
    const stop2 = progress === 0 ? 0 : Math.min(140, (progress * 115) + maskState.feather);
    
    orangeLayer.style.setProperty('--reveal-stop1', `${stop1.toFixed(2)}%`);
    orangeLayer.style.setProperty('--reveal-stop2', `${stop2.toFixed(2)}%`);
  }

  // Initialize GSAP Master Timeline (Total duration: 3000 ms)
  const masterTimeline = gsap.timeline({
    paused: false,
    onUpdate: () => {
      const timeMs = Math.round(masterTimeline.time() * 1000);
      if (inspSlider) inspSlider.value = timeMs;
      if (inspTime) inspTime.textContent = `${timeMs} ms`;
    },
    onComplete: () => {
      if (btnPlayPause) btnPlayPause.textContent = '↺';
    }
  });

  if (prefersReducedMotion) {
    // Immediate clean settled state
    chars.forEach(c => gsap.set(c, { y: '0%' }));
    updateButterflyMask(1.0);
    gsap.set([editorialHeader, supportingCopy].filter(Boolean), { opacity: 1, y: 0 });
    return;
  }

  // =========================================================================
  // Master Choreography Sequence (0ms - 3000ms)
  // =========================================================================

  // Initial State Setup (t = 0)
  // Headline is strictly concealed below the overflow-hidden mask
  gsap.set(chars, { y: '112%', willChange: 'transform' });
  gsap.set(editorialHeader, { opacity: 0, y: -8 });
  gsap.set(supportingCopy, { opacity: 0, y: 10 });
  updateButterflyMask(0);

  // Phase 1: Quiet Opening (0ms - 500ms)
  // Header and quiet supporting content enter softly without competing with hero
  // Headline remains strictly concealed
  masterTimeline.to(
    editorialHeader,
    {
      opacity: 1,
      y: 0,
      duration: 0.65,
      ease: 'power2.out',
    },
    0.1
  );

  masterTimeline.to(
    supportingCopy,
    {
      opacity: 1,
      y: 0,
      duration: 0.75,
      ease: 'power2.out',
    },
    0.2
  );

  // Phase 2: Headline Emergence (500ms - 1900ms)
  // Gradual, majestic vertical upward reveal through nested overflow-hidden masks
  masterTimeline.to(
    chars,
    {
      y: '0%',
      duration: 1.35,
      stagger: {
        each: 0.038,
        from: 'start',
      },
      ease: 'power3.out', // Editorial deceleration curve: steady upward motion settling smoothly at baseline
    },
    0.5 // Reveal begins at 500 ms
  );

  // Phase 3: Butterfly Mask Transformation (1950ms - 2950ms)
  // Only begins after the headline has substantially emerged and settled
  // Progressive organic wing mask expands outward across the wings
  masterTimeline.to(
    maskState,
    {
      progress: 1.0,
      duration: 1.0,
      ease: 'power2.inOut',
      onUpdate: () => {
        updateButterflyMask(maskState.progress);
      },
    },
    1.95 // Starts at 1950 ms
  );

  // Phase 4: Final Settlement & Resting Frame (2950ms - 3000ms)
  // Ensure the master timeline settles at exactly 3.0s
  masterTimeline.to({}, { duration: 0.05 }, 2.95);

  // =========================================================================
  // Developer & Frame Inspection API (Accessible via Window)
  // =========================================================================
  window.__masterTimeline = masterTimeline;
  window.__seekToMs = function (ms) {
    masterTimeline.pause();
    masterTimeline.seek(ms / 1000, false);
    updateButterflyMask(maskState.progress);
    if (inspSlider) inspSlider.value = ms;
    if (inspTime) inspTime.textContent = `${Math.round(ms)} ms`;
  };

  // Check URL parameters for static frame inspection (e.g. ?t=1500)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('t')) {
    const targetMs = parseFloat(urlParams.get('t'));
    window.__seekToMs(targetMs);
  }

  // Timeline Scrubber Interactions
  if (inspSlider) {
    inspSlider.max = 3000;
    inspSlider.addEventListener('input', (e) => {
      window.__seekToMs(parseFloat(e.target.value));
      if (btnPlayPause) btnPlayPause.textContent = '▶';
    });
  }

  if (btnPlayPause) {
    btnPlayPause.addEventListener('click', () => {
      if (masterTimeline.paused()) {
        if (masterTimeline.progress() >= 1) masterTimeline.restart();
        else masterTimeline.play();
        btnPlayPause.textContent = '⏸';
      } else {
        masterTimeline.pause();
        btnPlayPause.textContent = '▶';
      }
    });
  }

  if (btnReplay) {
    btnReplay.addEventListener('click', () => {
      masterTimeline.restart();
      if (btnPlayPause) btnPlayPause.textContent = '⏸';
    });
  }

  frameTags.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTime = parseFloat(btn.dataset.t);
      window.__seekToMs(targetTime);
    });
  });

  // Toggle Inspector UI with 'D' key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'd' || e.key === 'D') {
      if (timelineInspector) {
        timelineInspector.classList.toggle('visible');
      }
    }
  });

  // =========================================================================
  // Universal Cross-Platform Rimuru Tempest Cursor Engine
  // High-fidelity custom cursors matching the SHE BUILDS aesthetic
  // =========================================================================
  const cursorSets = {
    normal: {
      prop: '--cursor-normal',
      fallback: 'auto',
      hx48: 0, hy48: 0, hx32: 0, hy32: 0,
    },
    link: {
      prop: '--cursor-link',
      fallback: 'pointer',
      hx48: 4, hy48: 0, hx32: 3, hy32: 0,
    },
    working: {
      prop: '--cursor-working',
      fallback: 'progress',
      hx48: 0, hy48: 0, hx32: 0, hy32: 0,
    },
  };

  // Set and preload native custom cursor frames
  Object.keys(cursorSets).forEach((type) => {
    const cfg = cursorSets[type];
    const val = `url('cursors/${type}_48_0.png') ${cfg.hx48} ${cfg.hy48}, url('cursors/${type}_32_0.png') ${cfg.hx32} ${cfg.hy32}, ${cfg.fallback}`;
    document.documentElement.style.setProperty(cfg.prop, val);
  });

})();
