/**
 * SHE BUILDS — Mandatory Device Rotation Prompt
 * Robust cross-platform orientation management for iOS, Android, Tablets, Linux & Desktop.
 */

(function () {
  'use strict';

  var OVERLAY_ID = 'she-builds-rotate-overlay';

  function createOverlayHTML() {
    var overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', 'Screen Orientation Required');

    overlay.innerHTML =
      '<div class="rotate-container">' +
        '<div class="rotate-brand">' +
          '<span class="rotate-brand-she">SHE</span>' +
          '<span class="rotate-brand-builds">BUILDS</span>' +
        '</div>' +
        '<div class="rotate-graphic">' +
          '<svg class="rotate-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
            '<circle cx="50" cy="50" r="42" stroke="rgba(255, 255, 255, 0.15)" stroke-width="1.5" stroke-dasharray="3 3"/>' +
            '<path d="M 28 20 A 40 40 0 0 1 76 28" stroke="#E1035D" stroke-width="2.5" stroke-linecap="round"/>' +
            '<polygon points="76,22 82,30 72,32" fill="#E1035D"/>' +
            '<path d="M 72 80 A 40 40 0 0 1 24 72" stroke="#E1035D" stroke-width="2.5" stroke-linecap="round"/>' +
            '<polygon points="24,78 18,70 28,68" fill="#E1035D"/>' +
            '<g class="rotate-device-icon">' +
              '<rect x="36" y="22" width="28" height="56" rx="5" stroke="#FFFFFF" stroke-width="2" fill="rgba(14, 8, 12, 0.9)"/>' +
              '<line x1="45" y1="26" x2="55" y2="26" stroke="rgba(255, 255, 255, 0.7)" stroke-width="1.5" stroke-linecap="round"/>' +
              '<circle cx="50" cy="71" r="2.5" fill="#E1035D"/>' +
            '</g>' +
          '</svg>' +
        '</div>' +
        '<div class="rotate-meta">' +
          '<h2 class="rotate-title">ROTATE YOUR DEVICE</h2>' +
          '<p class="rotate-desc">' +
            'SHE BUILDS is crafted as an expansive editorial widescreen canvas. ' +
            'Please rotate your phone or tablet to landscape orientation to enter.' +
          '</p>' +
        '</div>' +
      '</div>';

    return overlay;
  }

  function initRotatePrompt() {
    // Check if element exists, otherwise inject it into the DOM
    var existing = document.getElementById(OVERLAY_ID);
    if (!existing) {
      var overlay = createOverlayHTML();
      if (document.body) {
        document.body.appendChild(overlay);
      } else {
        document.addEventListener('DOMContentLoaded', function () {
          document.body.appendChild(overlay);
        });
      }
    }

    function isPortraitMobile() {
      var w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
      var h = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

      // Check standard media query
      var mql = window.matchMedia ? window.matchMedia('(orientation: portrait)') : null;
      var isMqlPortrait = mql ? mql.matches : false;

      // Consider portrait if height > width or aspect-ratio <= 1.05 and max dimension is <= 1024
      var isNarrow = w <= 1024;
      var isTallerThanWide = h >= w;

      return isNarrow && (isMqlPortrait || isTallerThanWide);
    }

    function checkOrientation() {
      var inPortrait = isPortraitMobile();
      if (inPortrait) {
        document.documentElement.classList.add('force-portrait');
        if (document.body) document.body.classList.add('force-portrait');
      } else {
        document.documentElement.classList.remove('force-portrait');
        if (document.body) document.body.classList.remove('force-portrait');
      }
    }

    // Run immediately
    checkOrientation();

    // Listen to resize, orientationchange and media query changes
    window.addEventListener('resize', checkOrientation, { passive: true });
    window.addEventListener('orientationchange', checkOrientation, { passive: true });

    if (window.screen && window.screen.orientation) {
      try {
        window.screen.orientation.addEventListener('change', checkOrientation);
      } catch (e) {
        // Fallback silently if unsupported
      }
    }

    if (window.matchMedia) {
      try {
        var mql = window.matchMedia('(orientation: portrait)');
        if (mql.addEventListener) {
          mql.addEventListener('change', checkOrientation);
        } else if (mql.addListener) {
          mql.addListener(checkOrientation);
        }
      } catch (e) {
        // Ignore
      }
    }
  }

  // Auto-boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRotatePrompt);
  } else {
    initRotatePrompt();
  }
})();
