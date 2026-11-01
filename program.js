/**
 * SHE BUILDS — PROGRAM PAGE INTERACTIONS & ANIMATIONS (program.js)
 * 1. Top-to-Bottom PROGRAM Heading Entrance Control
 * 2. Interactive Retro Windows (Independent Close & Reopen Utility Dock, Non-Resizable)
 * 3. SHE BUILDS.exe Monochrome Pixel-Art Butterfly with Subtle Pixel-Level Hover Animation
 * 4. Program.txt Interactive Line Hover & Click Feedback
 * 5. progress.exe 0% -> 72% Progressive Segmented Red Fill Animation (Pauses/Resumes on Close/Reopen)
 */

(function () {
  'use strict';

  const params = new URLSearchParams(window.location.search);
  const isSettledMode = params.get('settled') === '1';
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ==========================================================================
     1. PROGRAM Heading Entrance State
     ========================================================================== */
  function initHeroHeading() {
    const titleEl = document.getElementById('programHeroTitle');
    const leftInfoEl = document.querySelector('.hero-left-info');
    if (isSettledMode || prefersReducedMotion) {
      if (titleEl) titleEl.classList.add('is-settled');
      if (leftInfoEl) leftInfoEl.classList.add('is-settled');
    }
  }

  /* ==========================================================================
     2. SHE BUILDS.exe Monochrome Pixel-Art Butterfly (Crisp Pixel Grid + Hover Flutter)
     ========================================================================== */
  function initPixelButterfly() {
    const stage = document.getElementById('pixelButterflyStage');
    if (!stage) return;

    // 78 × 37 pixel-art coordinate grid matching the reference SHE BUILDS.exe window:
    // Clean symmetrical black pixel butterfly outline (center X = 39) + 4 pixel crosses/stars.
    const WING_SYMMETRIC_PIXELS = [
      // Antennae (curving up and outward from head at y=11..15)
      [1, 14], [1, 13], [2, 12], [3, 11], [4, 11],
      // Upper Forewing Leading Edge (sweeping up-outward from thorax to apex dx=16, y=9)
      [1, 16], [2, 15], [3, 14], [4, 13], [5, 12], [6, 12], [7, 11], [8, 11],
      [9, 10], [10, 10], [11, 9], [12, 9], [13, 9], [14, 9], [15, 9], [16, 10],
      // Upper Forewing Double-Pixel Tip & Outer Margin
      [15, 10], [16, 11], [15, 11], [15, 12], [14, 13], [14, 14],
      [13, 15], [13, 16], [12, 17], [12, 18], [11, 19], [10, 20], [9, 20],
      // Lower Hindwing Outer Margin (sweeping down from waist dx=9, y=21 to bottom lobe dx=6, y=29)
      [10, 21], [11, 22], [11, 23], [11, 24], [11, 25], [10, 26], [10, 27],
      [9, 28], [8, 29], [7, 29], [6, 29], [5, 28], [4, 27], [3, 25], [2, 23], [1, 21],
      // Double-pixel accent on lower hindwing rim
      [10, 24], [9, 27], [7, 28]
    ];

    // Central body/thorax spine pixels at x = 39
    const BODY_SPINE_Y = [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];

    // Four pixel alignment crosses/sparkles around the butterfly (matching reference screenshot)
    const PIXEL_STARS = [
      // 1. Upper-left small pixel cross (x=15, y=8)
      {
        cx: 15, cy: 8,
        pixels: [[15, 8], [15, 7], [15, 9], [14, 8], [16, 8]]
      },
      // 2. Lower-left pixel sparkle cross (x=13, y=27)
      {
        cx: 13, cy: 27,
        pixels: [
          [13, 27], [13, 25], [13, 26], [13, 28], [13, 29],
          [11, 27], [12, 27], [14, 27], [15, 27]
        ]
      },
      // 3. Upper-right larger 4-point pixel star (x=61, y=10)
      {
        cx: 61, cy: 10,
        pixels: [
          [61, 10], [61, 6], [61, 7], [61, 8], [61, 9], [61, 11], [61, 12], [61, 13], [61, 14],
          [57, 10], [58, 10], [59, 10], [60, 10], [62, 10], [63, 10], [64, 10], [65, 10],
          [60, 9], [62, 9], [60, 11], [62, 11]
        ]
      },
      // 4. Lower-right small pixel cross (x=55, y=29)
      {
        cx: 55, cy: 29,
        pixels: [[55, 29], [55, 28], [55, 30], [54, 29], [56, 29]]
      }
    ];

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 78 37');
    svg.setAttribute('shape-rendering', 'crispEdges');
    svg.setAttribute('class', 'pixel-butterfly-canvas');
    svg.setAttribute('aria-label', 'Monochrome pixel-art butterfly');

    const wingPixelEls = [];
    const starGroupEls = [];

    function addPixelRect(parent, x, y, fill = '#151515') {
      const rect = document.createElementNS(svgNS, 'rect');
      rect.setAttribute('x', String(x));
      rect.setAttribute('y', String(y));
      rect.setAttribute('width', '1.05');
      rect.setAttribute('height', '1.05');
      rect.setAttribute('fill', fill);
      parent.appendChild(rect);
      return rect;
    }

    // Build central body spine
    const bodyGroup = document.createElementNS(svgNS, 'g');
    BODY_SPINE_Y.forEach((y) => addPixelRect(bodyGroup, 39, y, '#151515'));
    svg.appendChild(bodyGroup);

    // Build left and right wing pixels with metadata for subtle pixel-level hover animation
    const wingsGroup = document.createElementNS(svgNS, 'g');
    WING_SYMMETRIC_PIXELS.forEach(([dx, y]) => {
      const isAntenna = y <= 14 && dx <= 5;
      const leftX = 39 - dx;
      const rightX = 39 + dx;

      const leftRect = addPixelRect(wingsGroup, leftX, y, '#151515');
      const rightRect = addPixelRect(wingsGroup, rightX, y, '#151515');

      wingPixelEls.push({
        el: leftRect,
        baseX: leftX,
        baseY: y,
        dx: -dx,
        absDx: dx,
        isAntenna
      });
      wingPixelEls.push({
        el: rightRect,
        baseX: rightX,
        baseY: y,
        dx: dx,
        absDx: dx,
        isAntenna
      });
    });
    svg.appendChild(wingsGroup);

    // Build the 4 surrounding pixel crosses/stars
    PIXEL_STARS.forEach((star) => {
      const g = document.createElementNS(svgNS, 'g');
      star.pixels.forEach(([px, py]) => addPixelRect(g, px, py, '#151515'));
      svg.appendChild(g);
      starGroupEls.push({ g, cx: star.cx, cy: star.cy });
    });

    // Replace canvas placeholder with our razor-sharp pixel-grid SVG
    stage.innerHTML = '';
    stage.appendChild(svg);

    // Subtle pixel-level hover flutter interaction (snaps cleanly by integer pixel steps, then resolves back)
    let flutterTimer = null;
    let flutterStep = 0;

    // 4 restrained pixel-shift frames that gently contract the wings by 1–2 pixel blocks and resolve back to 0
    const PIXEL_FLUTTER_STEPS = [
      { compress: 0.14, lift: -1, starShift: 1 },
      { compress: 0.24, lift: 0, starShift: 0 },
      { compress: 0.12, lift: 1, starShift: -1 },
      { compress: 0.0, lift: 0, starShift: 0 }
    ];

    function applyPixelFlutterFrame(frame) {
      for (let i = 0; i < wingPixelEls.length; i++) {
        const p = wingPixelEls[i];
        if (p.isAntenna) {
          const antY = p.baseY + (frame.compress > 0 ? -1 : 0);
          p.el.setAttribute('y', String(antY));
          continue;
        }
        // Shift wing pixels inward toward center X=39 by discrete integer pixel units
        const inwardShift = Math.round(p.absDx * frame.compress) * Math.sign(p.dx);
        const verticalShift = p.absDx >= 10 ? frame.lift : 0;
        p.el.setAttribute('x', String(p.baseX - inwardShift));
        p.el.setAttribute('y', String(p.baseY + verticalShift));
      }

      for (let i = 0; i < starGroupEls.length; i++) {
        const s = starGroupEls[i];
        const dy = (i % 2 === 0 ? 1 : -1) * frame.starShift;
        s.g.setAttribute('transform', dy !== 0 ? `translate(0, ${dy})` : '');
      }
    }

    function triggerPixelFlutter() {
      if (prefersReducedMotion || flutterTimer) return;
      flutterStep = 0;
      applyPixelFlutterFrame(PIXEL_FLUTTER_STEPS[0]);

      flutterTimer = setInterval(() => {
        flutterStep++;
        if (flutterStep >= PIXEL_FLUTTER_STEPS.length) {
          clearInterval(flutterTimer);
          flutterTimer = null;
          applyPixelFlutterFrame({ compress: 0, lift: 0, starShift: 0 });
        } else {
          applyPixelFlutterFrame(PIXEL_FLUTTER_STEPS[flutterStep]);
        }
      }, 115);
    }

    stage.addEventListener('mouseenter', triggerPixelFlutter);
    stage.addEventListener('click', triggerPixelFlutter);
  }

  /* ==========================================================================
     3. Program.txt Interactive Lines (Hover & Click Response Inside Window)
     ========================================================================== */
  function initProgramTxtWindow() {
    const lines = Array.from(document.querySelectorAll('.program-txt-line'));
    if (!lines.length) return;

    function selectLine(lineEl) {
      const alreadySelected = lineEl.classList.contains('is-selected');
      lines.forEach((l) => l.classList.remove('is-selected'));
      if (!alreadySelected) {
        lineEl.classList.add('is-selected');
      }
    }

    lines.forEach((lineEl) => {
      lineEl.addEventListener('click', (e) => {
        e.stopPropagation();
        selectLine(lineEl);
      });

      lineEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          selectLine(lineEl);
        }
      });
    });
  }

  /* ==========================================================================
     4. progress.exe Progressive 0% -> 72% Red Segmented Fill Animation
        - Starts at 0% on load, fills smoothly to 72% over ~4.5s, holds at 72%
        - Pauses if closed mid-fill and resumes from current % when reopened
     ========================================================================== */
  const progressController = {
    currentPct: 0,
    targetPct: 72,
    isPaused: false,
    isCompleted: false,
    rafId: null,
    lastTimestamp: null,
    durationMs: 4500, // 4.5 seconds from 0% to 72%

    init() {
      this.wellEl = document.getElementById('progressBarWell');
      this.labelEl = document.getElementById('progressPctLabel');
      this.segFills = Array.from(document.querySelectorAll('#progressSegments .prog-seg-fill'));

      if (!this.wellEl || !this.labelEl || !this.segFills.length) return;

      if (isSettledMode || prefersReducedMotion) {
        this.setProgress(this.targetPct);
        this.isCompleted = true;
        return;
      }

      // Start at 0% on initial load
      this.setProgress(0);

      // Begin progressive fill after progress.exe enters the scene (400ms)
      setTimeout(() => {
        this.startLoop();
      }, 400);
    },

    setProgress(pct) {
      const clamped = Math.max(0, Math.min(this.targetPct, pct));
      this.currentPct = clamped;
      const displayInt = Math.round(clamped);

      this.labelEl.textContent = `${displayInt}%`;
      this.wellEl.setAttribute('aria-valuenow', String(displayInt));

      // Fill the 10 classic Windows segmented blocks progressively from left to right
      // At 72%, 7 full red segments are illuminated (matching the 7/10 blocks in the reference screenshot)
      for (let i = 0; i < this.segFills.length; i++) {
        const threshold = (i + 1) * 10 - 2; // lights up segments 1..7 smoothly as pct reaches 8%, 18%, ..., 68%
        const segFillPct = clamped >= threshold ? 100 : 0;
        this.segFills[i].style.width = `${segFillPct}%`;
      }
    },

    startLoop() {
      if (this.isCompleted || this.rafId) return;
      this.isPaused = false;
      this.lastTimestamp = null;

      const step = (now) => {
        if (this.isPaused || this.isCompleted) {
          this.rafId = null;
          return;
        }
        if (this.lastTimestamp === null) {
          this.lastTimestamp = now;
        }
        const dt = now - this.lastTimestamp;
        this.lastTimestamp = now;

        // Subtle ease-out velocity as it approaches 72%
        const remainingRatio = Math.max(0.28, 1 - (this.currentPct / (this.targetPct * 1.15)));
        const deltaPct = (dt / this.durationMs) * this.targetPct * (0.65 + 0.55 * remainingRatio);
        const nextPct = this.currentPct + deltaPct;

        if (nextPct >= this.targetPct) {
          this.setProgress(this.targetPct);
          this.isCompleted = true;
          this.rafId = null;
          return;
        }

        this.setProgress(nextPct);
        this.rafId = requestAnimationFrame(step);
      };

      this.rafId = requestAnimationFrame(step);
    },

    pause() {
      this.isPaused = true;
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    },

    resume() {
      if (!this.isCompleted) {
        this.startLoop();
      }
    }
  };

  /* ==========================================================================
     5. Independent Retro Window Closing & Reopening Management
     ========================================================================== */
  function initWindowManagement() {
    const windows = Array.from(document.querySelectorAll('.retro-window'));
    const dock = document.getElementById('retroReopenDock');
    const dockButtons = document.getElementById('dockButtons');
    if (!windows.length || !dock || !dockButtons) return;

    // Track visibility state of each window: 'she-builds', 'program-txt', 'progress-exe'
    const windowState = new Map();
    windows.forEach((winEl) => {
      const id = winEl.getAttribute('data-window-id');
      const title = winEl.getAttribute('data-window-title');
      windowState.set(id, { id, title, el: winEl, isOpen: true });
    });

    function renderReopenDock() {
      dockButtons.innerHTML = '';
      let closedCount = 0;

      windowState.forEach((state) => {
        if (!state.isOpen) {
          closedCount++;
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'dock-reopen-btn';
          btn.textContent = `+ ${state.title}`;
          btn.setAttribute('aria-label', `Reopen ${state.title}`);
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            reopenWindow(state.id);
          });
          dockButtons.appendChild(btn);
        }
      });

      if (closedCount > 0) {
        dock.classList.remove('is-hidden');
      } else {
        dock.classList.add('is-hidden');
      }
    }

    function closeWindow(id) {
      const state = windowState.get(id);
      if (!state || !state.isOpen) return;
      state.isOpen = false;
      state.el.classList.add('is-closed');
      state.el.setAttribute('aria-hidden', 'true');

      if (id === 'progress-exe') {
        progressController.pause();
      }

      renderReopenDock();
    }

    function reopenWindow(id) {
      const state = windowState.get(id);
      if (!state || state.isOpen) return;
      state.isOpen = true;
      state.el.classList.remove('is-closed');
      state.el.setAttribute('aria-hidden', 'false');

      if (id === 'progress-exe') {
        progressController.resume();
      }

      renderReopenDock();
    }

    // Attach close/minimize handlers with event-bubbling prevention
    const closeBtns = Array.from(document.querySelectorAll('[data-action="close"]'));
    closeBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const targetId = btn.getAttribute('data-target');
        closeWindow(targetId);
      });
    });

    // Bring clicked window slightly forward in z-order among the 3 windows without moving it
    let topZ = 32;
    windows.forEach((winEl) => {
      winEl.addEventListener('mousedown', () => {
        topZ++;
        winEl.style.zIndex = String(topZ);
      });
    });
  }

  /* ==========================================================================
     Initialize All Program Page Modules
     ========================================================================== */
  function initProgramPage() {
    initHeroHeading();
    initPixelButterfly();
    initProgramTxtWindow();
    progressController.init();
    initWindowManagement();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProgramPage);
  } else {
    initProgramPage();
  }
})();
