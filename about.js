/**
 * SHE BUILDS — GREVIX About Page
 * 60 FPS GPU-Composited Sideways In-Flight Multi-Tone ASCII Butterfly
 * - Zero DOM re-parsing / zero style-recalc lag (builds DOM once, animates GPU transforms & opacity)
 * - Anchored in central HUD target: thorax/body/antennae stay centered while wings flap around the thorax hinge
 * - 3D perspective wing-beat kinematics (scaleX foreshortening + skewY sweep + spanwise wave)
 * - Continuous localized wing-tip airflow particle stream
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. Sideways Flying Multi-Tone ASCII Butterfly Blueprint (26 rows × 43 cols)
        Tone codes:
          'w' = bright white (#FFFFFF)
          'p' = pale pink (#FFB8D2)
          'c' = crimson (#A80642)
          'd' = deep magenta (#78032C)
          'k' = dark crimson-black (#4B021B)
     ========================================================================== */

  const BASE_ROWS = [
    //0123456789012345678901234567890123456789012
    String.raw`                 * .+.                     `, // 00: Forewing apex tip particles
    String.raw`               +/%X#****+.                 `, // 01: Forewing upper apex
    String.raw`          *  .:%XX#+==**%*.                `, // 02: Forewing upper curve
    String.raw`           * .:%XX|#*:**:*%*.              `, // 03: Forewing upper cell
    String.raw`             *+Y*%#*:*::=%**.              `, // 04: Forewing upper-mid cell
    String.raw`        *     :%X%*%*:**%%%*+\             `, // 05: Double leading edge begins
    String.raw`              .YZ*%**:*%%:%**\             `, // 06: Forewing dark marginal band + double edge
    String.raw`  *   +    .  :X%##*%:.:&%#:\.        #    `, // 07: Forewing mid + upper antenna # tip
    String.raw`     *  .  .  .X%***%:::\\::\:.      /  #* `, // 08: Forewing double edge + second antenna #* tip
    String.raw`      . * * *.Y%%:%|:'==\.\:\.      /  /*  `, // 09: Sweeping mid particle trail + dual antennae
    String.raw`            *.;%#*%*::::\,\#\      /  /    `, // 10: Dual antennae converging
    String.raw`              *...%X%#===::\\|\   / /      `, // 11: Forewing lower vein + antennae
    String.raw`              ***:%X*&**::::*.\\ //        `, // 12: Wing cleft notch + antennae base
    String.raw`                  /**%%%%*#=:#:\\|//##*    `, // 13: Thorax & head join
    String.raw`                 ./X%=%x*====\.'+%%#/#"    `, // 14: Upper hindwing & thorax
    String.raw`        *+.    .:/xx%*======\'*==::%##     `, // 15: Hindwing main vein
    String.raw`           *.   %Xx/*=====^'  ._-::/#/     `, // 16: Hindwing central cell
    String.raw`        ..:.:.#**|*===1....=-:.#"/#A       `, // 17: Hindwing median vein
    String.raw`    *. :++::+:&==|*==/,*^*/%##/ /#         `, // 18: Hindwing lower vein + long particle stream
    String.raw`  *  *  .     &**%|=:'/(':%##/  8          `, // 19: Hindwing scalloped cell + abdomen
    String.raw` *          .**X%1/#:://%*%#"  '           `, // 20: Lower abdomen tip
    String.raw`      .*.  .  %X%:%#*%##/'                 `, // 21: Hindwing lower lobe
    String.raw`**     .*.*..:7,%***&##/                   `, // 22: Hindwing trailing lobe + outer particles
    String.raw`          * *..#'*+887'                    `, // 23: Hindwing bottom tip
    String.raw`            * .*                           `, // 24: Lower trailing particles
    String.raw`             +                             `  // 25: Bottom-most particle
  ];

  const BASE_COLORS = [
    //0123456789012345678901234567890123456789012
    "                 w cdc                     ", // 00
    "               wdkkwwwwwpc                 ", // 01
    "          w  cdkkkwpwwwkwwc                ", // 02
    "           w cdkkkwwpwdwdwwc               ", // 03
    "             wwkwkwwpwddpdwwc              ", // 04
    "        w     dkkwkwpwkdkdwpw              ", // 05
    "              ckkwkwwkpkdcdwww             ", // 06
    "  w   w    c  dkkwwwkdcckdwpwc        w    ", // 07
    "     w  c  c  ckkwwwkdppwpppwpw      w  ww ", // 08
    "      c w w wckkdckdcpwwwcwpwc      w  ww  ", // 09
    "            wcdkwkwpcppwcwwww      w  w    ", // 10
    "              wccckkkwwwwppwpww   w w      ", // 11
    "              wwwpkkwkwwppppwcww ww        ", // 12
    "                  dwwkkkkwkwpwpwwwwwwww    ", // 13
    "                 cdkkpkdwwwwwwcpwddwwwp    ", // 14
    "        wwc    cdkdduwwwwwwwwpwwwppwww     ", // 15
    "           wc   dkddwwwwwwpc  cppppwww     ", // 16
    "        cppcpckwwpwwwwwccccwppcwpwww       ", // 17
    "    wc pwwppwpkwwpwwwpcwpwpdwww ww         ", // 18
    "  w  w  p     kwwdpwppwpppdwww  w          ", // 19
    " w          cwwkdddwpwwdwdwp   p           ", // 20
    "      cwc  c  dkdpdwwdwwwp                 ", // 21
    "wp     wcwccddckwwwkwww                    ", // 22
    "          w wcpwpwpdddc                    ", // 23
    "            w cw                           ", // 24
    "             w                             "  // 25
  ];

  // Row anatomical column boundaries: [wingStartCol, wingEndCol]
  // Columns < wingStartCol are trailing airflow particles.
  // Columns in [wingStartCol, wingEndCol) form the flapping wing hinged at wingEndCol.
  // Columns >= wingEndCol form the anchored body/thorax/abdomen/antennae.
  const ROW_BOUNDS = [
    [23, 23], // 00: particles only
    [15, 27], // 01: forewing apex
    [13, 28], // 02: forewing upper
    [13, 29], // 03
    [14, 29], // 04
    [14, 29], // 05 (col 29 is far-wing '\')
    [14, 29], // 06
    [14, 29], // 07
    [14, 29], // 08
    [13, 29], // 09
    [13, 29], // 10
    [14, 30], // 11
    [14, 31], // 12: wing cleft notch
    [18, 32], // 13: thorax join (32..39 is '\\|//##*')
    [17, 32], // 14: upper hindwing (32..39 is '+%%#/#"')
    [15, 33], // 15: hindwing main vein (33..38 is '::%##')
    [16, 33], // 16: hindwing central cell (33..38 is '::/#/')
    [14, 32], // 17: hindwing median vein (32..36 is '#"/#A')
    [14, 30], // 18: hindwing lower vein (30..34 is ' /#')
    [14, 29], // 19: hindwing scalloped cell (29..32 is '  8')
    [12, 28], // 20: lower hindwing (28..32 is '  \'')
    [14, 27], // 21: hindwing lower lobe
    [13, 25], // 22: hindwing trailing lobe
    [13, 23], // 23: hindwing bottom tip
    [25, 25], // 24: particles only
    [25, 25]  // 25: particles only
  ];

  function escapeHtml(ch) {
    if (ch === '&') return '&amp;';
    if (ch === '<') return '&lt;';
    if (ch === '>') return '&gt;';
    if (ch === '"') return '&quot;';
    return ch;
  }

  function renderColoredSlice(rowChars, rowCols, startCol, endCol) {
    let html = '';
    let activeCol = null;
    let buf = '';

    const flush = () => {
      if (!buf) return;
      if (activeCol && activeCol !== ' ') {
        html += `<span class="c-${activeCol}">${buf}</span>`;
      } else {
        html += buf;
      }
      buf = '';
    };

    for (let c = startCol; c < endCol; c++) {
      const ch = c < rowChars.length ? rowChars[c] : ' ';
      let col = c < rowCols.length ? rowCols[c] : ' ';
      if (col === 'u') col = 'k';
      const effCol = ch === ' ' ? ' ' : (col === ' ' ? 'w' : col);
      if (effCol !== activeCol) {
        flush();
        activeCol = effCol;
      }
      buf += escapeHtml(ch);
    }
    flush();
    return html;
  }

  function buildButterflyDOM(container) {
    const htmlRows = [];

    for (let r = 0; r < BASE_ROWS.length; r++) {
      const rowChars = BASE_ROWS[r];
      const rowCols = BASE_COLORS[r];
      const len = Math.max(rowChars.length, rowCols.length);
      const [wingStart, wingEnd] = ROW_BOUNDS[r];

      let rowHtml = `<span class="bf-row" data-r="${r}">`;

      // 1. Left Particle Trail Region (cols 0 .. wingStart - 1)
      const pEnd = Math.min(len, wingStart);
      for (let c = 0; c < pEnd; c++) {
        const ch = c < rowChars.length ? rowChars[c] : ' ';
        let col = c < rowCols.length ? rowCols[c] : 'w';
        if (col === ' ' || col === 'u') col = 'w';
        if (ch !== ' ') {
          rowHtml += `<span class="bf-particle c-${col}" data-r="${r}" data-c="${c}">${escapeHtml(ch)}</span>`;
        } else {
          rowHtml += ' ';
        }
      }

      // 2. Main Flapping Wing Region (cols wingStart .. wingEnd - 1), hinged on the right at wingEnd
      if (wingEnd > wingStart && wingStart < len) {
        const wEnd = Math.min(len, wingEnd);
        const wingInner = renderColoredSlice(rowChars, rowCols, wingStart, wEnd);
        rowHtml += `<span class="bf-wing" data-r="${r}">${wingInner}</span>`;
      }

      // 3. Right Region: Far-Wing Leading Edge + Thorax/Body/Abdomen + Antennae (cols wingEnd .. len)
      if (wingEnd < len) {
        // On rows 5..10, col 29..31 has the far-wing leading edge '\' before the antennae on col 34+
        if (r >= 5 && r <= 10) {
          const farEnd = Math.min(len, 33);
          const farInner = renderColoredSlice(rowChars, rowCols, wingEnd, farEnd);
          rowHtml += `<span class="bf-far-wing" data-r="${r}">${farInner}</span>`;
          if (farEnd < len) {
            const antInner = renderColoredSlice(rowChars, rowCols, farEnd, len);
            rowHtml += `<span class="bf-body" data-r="${r}" data-part="antenna">${antInner}</span>`;
          }
        } else {
          const bodyInner = renderColoredSlice(rowChars, rowCols, wingEnd, len);
          const partType = r <= 12 ? 'antenna' : 'body';
          rowHtml += `<span class="bf-body" data-r="${r}" data-part="${partType}">${bodyInner}</span>`;
        }
      }

      rowHtml += `</span>`;
      htmlRows.push(rowHtml);
    }

    container.innerHTML = htmlRows.join('');

    // Cache DOM references once for zero-allocation 60fps animation
    const wingEls = Array.from(container.querySelectorAll('.bf-wing')).map((el) => {
      const r = parseInt(el.getAttribute('data-r'), 10);
      const isForewing = r <= 13;
      // Vertical distance from the mid-wing thorax waist (r = 13)
      const verticalSpan = isForewing ? (13 - r) / 12.0 : -(r - 13) / 10.0;
      return { el, r, isForewing, verticalSpan };
    });

    const farWingEls = Array.from(container.querySelectorAll('.bf-far-wing')).map((el) => {
      const r = parseInt(el.getAttribute('data-r'), 10);
      return { el, r, verticalSpan: (13 - r) / 12.0 };
    });

    const bodyEls = Array.from(container.querySelectorAll('.bf-body')).map((el) => {
      const r = parseInt(el.getAttribute('data-r'), 10);
      const part = el.getAttribute('data-part');
      return { el, r, isAntenna: part === 'antenna' };
    });

    const particleEls = Array.from(container.querySelectorAll('.bf-particle')).map((el, idx) => {
      const r = parseInt(el.getAttribute('data-r'), 10);
      const c = parseInt(el.getAttribute('data-c'), 10);
      const seed = ((r * 19 + c * 37 + idx * 13) % 100) / 100;
      return {
        el,
        r,
        c,
        seed,
        phaseOffset: (idx * 0.17 + seed) % 1.0,
        speed: 0.42 + seed * 0.32,
        ampY: 0.45 + seed * 0.55
      };
    });

    return { wingEls, farWingEls, bodyEls, particleEls };
  }

  // Asymmetric organic butterfly wing-beat waveform in [-1, +1]
  // Brisk, energetic downstroke and graceful, buoyant upstroke recovery
  function wingStrokeWave(theta) {
    const primary = Math.sin(theta);
    const secondHarmonic = 0.24 * Math.sin(2 * theta - 0.55);
    return Math.max(-1, Math.min(1, primary + secondHarmonic));
  }

  function initAsciiButterfly() {
    const container = document.getElementById('asciiButterfly');
    if (!container) return;

    const { wingEls, farWingEls, bodyEls, particleEls } = buildButterflyDOM(container);

    const params = new URLSearchParams(window.location.search);
    const forcedFrame = params.get('frame');
    const forcedTime = params.get('t');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function updateKinematics(timeMs) {
      // ~1.6 Hz natural butterfly wing-beat rhythm
      const omega = timeMs * 0.0102;

      // Subtle aerodynamic body counter-hover (anchored in place: ±1.4px vertical counter-pulse)
      const hoverY = Math.sin(omega - 0.45) * 1.4;
      const hoverX = Math.cos(omega * 0.5) * 0.45;

      // 1. Update Main Flapping Wings (hinged at right edge -> thorax)
      for (let i = 0; i < wingEls.length; i++) {
        const w = wingEls[i];
        const absSpan = Math.abs(w.verticalSpan);
        // Hindwing trails forewing slightly; outer wing tips trail inner wing flexibly
        const phaseLag = (w.isForewing ? 0.0 : -0.36) - absSpan * 0.48;
        const stroke = wingStrokeWave(omega + phaseLag);

        // 3D perspective wing-beat compression around the right-hand thorax hinge:
        // On downstroke (stroke -> -1), the wing sweeps forward toward the viewer so its
        // horizontal silhouette foreshortens smoothly to ~76%; on upstroke (stroke -> +1),
        // it opens wide to ~104%.
        const scaleX = 0.90 + 0.14 * stroke * (0.45 + 0.55 * absSpan);

        // Vertical wing-beat sweep & membrane twist (skewY + dy around the thorax hinge)
        const skewDeg = -stroke * w.verticalSpan * 7.2;
        const dy = hoverY - stroke * w.verticalSpan * 5.4;

        w.el.style.transform =
          `translate3d(${hoverX.toFixed(2)}px, ${dy.toFixed(2)}px, 0) scaleX(${scaleX.toFixed(3)}) skewY(${skewDeg.toFixed(2)}deg)`;
      }

      // 2. Update Far Forewing Leading Edge (scissors in counter-phase for 3D perspective depth)
      for (let i = 0; i < farWingEls.length; i++) {
        const fw = farWingEls[i];
        const stroke = wingStrokeWave(omega + 0.65 - fw.verticalSpan * 0.4);
        const dx = hoverX + (1.0 - stroke) * 2.1;
        const dy = hoverY - stroke * fw.verticalSpan * 3.8;
        const skewDeg = stroke * 4.5;
        fw.el.style.transform =
          `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) skewY(${skewDeg.toFixed(2)}deg)`;
      }

      // 3. Update Anchored Body & Delicate Antennae on the Right
      for (let i = 0; i < bodyEls.length; i++) {
        const b = bodyEls[i];
        if (b.isAntenna) {
          const tipFactor = (13 - b.r) / 6.0;
          const flexX = hoverX + Math.sin(omega - tipFactor * 1.1) * tipFactor * 1.3;
          const flexY = hoverY + Math.cos(omega - tipFactor * 0.9) * tipFactor * 1.5;
          b.el.style.transform = `translate3d(${flexX.toFixed(2)}px, ${flexY.toFixed(2)}px, 0)`;
        } else {
          b.el.style.transform = `translate3d(${hoverX.toFixed(2)}px, ${hoverY.toFixed(2)}px, 0)`;
        }
      }

      // 4. Update Continuous Wing-Tip Airflow Particles (streaming locally off the left wing edge)
      for (let i = 0; i < particleEls.length; i++) {
        const p = particleEls[i];
        // Continuous lifecycle u in [0, 1)
        const u = ((timeMs * 0.00052 * p.speed) + p.phaseOffset) % 1.0;

        // Smooth fade-in as particle leaves the wing edge, smooth fade-out at wake tail
        const alpha = u < 0.20
          ? (u / 0.20)
          : Math.pow(1.0 - (u - 0.20) / 0.80, 1.3);

        // Local backward drift (-16px max so particles stay within the HUD target frame)
        const driftX = -u * 15.5;
        // Gentle vortex wave driven by the wing downwash
        const vortexY =
          Math.sin(omega - u * 4.0 + p.seed * 6.28) * (3.2 * p.ampY) +
          hoverY * (1.0 - u * 0.5);

        p.el.style.transform = `translate3d(${driftX.toFixed(2)}px, ${vortexY.toFixed(2)}px, 0)`;
        p.el.style.opacity = Math.max(0.08, Math.min(1.0, alpha)).toFixed(2);
      }
    }

    // Deterministic screenshot hooks (?frame=0|1|2 or ?t=ms)
    if (forcedTime !== null) {
      updateKinematics(parseFloat(forcedTime) || 0);
      return;
    }

    if (forcedFrame !== null) {
      const idx = parseInt(forcedFrame, 10) || 0;
      if (idx === 0) {
        // Frame 0: Reference rest pose for exact 1:1 static comparison
        return;
      }
      const presetTimes = [0, 260, 440, 170];
      updateKinematics(presetTimes[idx % presetTimes.length]);
      return;
    }

    if (reducedMotion) {
      return;
    }

    // Locked 60-120 FPS hardware-accelerated requestAnimationFrame loop
    let startTime = null;
    function tick(now) {
      if (startTime === null) startTime = now;
      updateKinematics(now - startTime);
      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  /* ==========================================================================
     3. ABOUT GREVIX Heading Kinetic Reveal + Cyber-ASCII Decode Animation
     ========================================================================== */
  function initAboutHeadingAnimation() {
    const heading = document.querySelector('.about-heading');
    if (!heading) return;

    const params = new URLSearchParams(window.location.search);
    if (params.get('frame') !== null || params.get('t') !== null) {
      return;
    }

    const lines = Array.from(heading.querySelectorAll('span'));
    if (!lines.length) return;

    const charEls = [];
    let globalIdx = 0;

    lines.forEach((lineEl) => {
      const text = lineEl.textContent.trim();
      lineEl.classList.add('about-heading-line');
      lineEl.textContent = '';

      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        const wrap = document.createElement('span');
        wrap.className = 'about-char-wrap';

        const span = document.createElement('span');
        span.className = 'about-char';
        span.style.setProperty('--char-i', String(globalIdx));
        span.dataset.target = ch;
        span.textContent = ch;

        wrap.appendChild(span);
        lineEl.appendChild(wrap);
        charEls.push(span);
        globalIdx++;
      }
    });

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const ASCII_GLYPHS = ['#', '%', '*', 'X', '/', '+', '=', '&', ':'];

    function runAsciiDecode(staggerMs, durationMs) {
      charEls.forEach((el, idx) => {
        const targetChar = el.dataset.target;
        const startDelay = idx * staggerMs;
        let ticks = 0;
        const maxTicks = Math.max(4, Math.round(durationMs / 45));

        setTimeout(() => {
          el.classList.add('is-decoding');
          const timer = setInterval(() => {
            ticks++;
            if (ticks >= maxTicks) {
              clearInterval(timer);
              el.textContent = targetChar;
              el.classList.remove('is-decoding');
            } else {
              el.textContent = ASCII_GLYPHS[(idx + ticks * 3) % ASCII_GLYPHS.length];
            }
          }, 45);
        }, startDelay);
      });
    }

    // Initial entrance decode on page load
    runAsciiDecode(55, 360);

    // Interactive re-decode on hover (with cooldown so it never stutters)
    let canTrigger = false;
    setTimeout(() => { canTrigger = true; }, 1100);

    heading.addEventListener('mouseenter', () => {
      if (!canTrigger) return;
      canTrigger = false;
      runAsciiDecode(35, 240);
      setTimeout(() => { canTrigger = true; }, 750);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initAsciiButterfly();
      initAboutHeadingAnimation();
    });
  } else {
    initAsciiButterfly();
    initAboutHeadingAnimation();
  }
})();
