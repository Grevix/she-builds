/**
 * SHE BUILDS — UNDER CONSTRUCTION PAGE (in-the-making.js)
 *
 * Requirements:
 * 1. Progress bar begins at 0% on page load.
 * 2. Progressively and smoothly increases over 8-12 seconds to 100%.
 * 3. Stops at 100% and stays filled.
 * 4. Never resets, loops backwards, navigates away, or opens modals.
 * 5. Respects prefers-reduced-motion (instantly completes without animation).
 * 6. Clean timestamp-based RAF loop with graceful timer cleanup.
 * 7. Supports URL parameters:
 *    - ?settled=1 -> immediately displays 100%
 *    - ?progress=XX -> displays fixed percentage (e.g. ?progress=72) for test verification
 */

(function () {
  'use strict';

  const params = new URLSearchParams(window.location.search);
  const isSettled = params.get('settled') === '1';
  const customProgress = params.get('progress');
  const prefersReducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const bar = document.getElementById('constructionProgressBar');
  const fill = document.getElementById('constructionProgressFill');

  if (!bar || !fill) return;

  function updateProgress(pct) {
    const clamped = Math.max(0, Math.min(100, pct));
    fill.style.width = clamped + '%';
    bar.setAttribute('aria-valuenow', Math.round(clamped).toString());
  }

  // Handle deterministic testing / static override states
  if (customProgress !== null && !isNaN(parseFloat(customProgress))) {
    updateProgress(parseFloat(customProgress));
    return;
  }

  if (isSettled || prefersReducedMotion) {
    updateProgress(100);
    return;
  }

  // Animation configuration
  // 10 seconds total duration with an organic editorial easing curve
  const DURATION_MS = 10000;
  const START_DELAY_MS = 250;
  let startTime = null;
  let rafId = null;

  // Gentle progressive easing: steady progress with subtle variation matching real loading
  function progressCurve(t) {
    // t from 0 to 1
    // Smooth cubic ease out with slight front-loaded velocity
    return 1 - Math.pow(1 - t, 2.4);
  }

  function frame(timestamp) {
    if (!startTime) startTime = timestamp + START_DELAY_MS;

    const elapsed = timestamp - startTime;

    if (elapsed <= 0) {
      updateProgress(0);
      rafId = requestAnimationFrame(frame);
      return;
    }

    const t = Math.min(1, elapsed / DURATION_MS);
    const progressPercent = progressCurve(t) * 100;

    updateProgress(progressPercent);

    if (t < 1) {
      rafId = requestAnimationFrame(frame);
    } else {
      // Reached 100%: lock at 100% and cleanly stop loop
      updateProgress(100);
      rafId = null;
    }
  }

  // Start smooth loading loop
  rafId = requestAnimationFrame(frame);

  // Clean up on page unload
  window.addEventListener('beforeunload', function () {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  });
})();
