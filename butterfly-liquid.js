/**
 * SHE BUILDS — Natural, Bubble-Free Liquid Flow & Soft Color Brush Engine
 *
 * Designed for a 100% natural, organic Lando Norris–style fluid stroke with ZERO bubble outlines:
 *  - No hard meniscus edge, no bubble rim highlight, and no spherical pinch distortion.
 *  - Uses a wide, Gaussian-feathered fluid velocity & intensity field modulated by 3D Simplex Noise
 *    (`snoise` from `_vendor_repos/shadergradient`) so the brush edges are completely soft, organic,
 *    and invisible.
 *  - Fluid displacement flows naturally along the cursor's movement vector `(vx, vy)` combined with
 *    gentle `waterWave()` undulations (`_vendor_repos/shadergradient`) and soft refractive smoothing
 *    (`_vendor_repos/liquid-glass-js`).
 *  - Smoothly reveals the natural `Cream Butterfly with Floral Vine Wings.png` palette with a whisper-light
 *    warm watercolor shift where the cursor strokes, then naturally settles back to the original Orange
 *    butterfly within ~2.0 seconds at a locked, lag-free 60/120fps.
 */

(function () {
  'use strict';

  const stage = document.getElementById('butterflyStage');
  const creamImg = document.getElementById('creamImg');
  const orangeImg = document.getElementById('orangeImg');

  if (!stage || !creamImg || !orangeImg) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'butterflyLiquidCanvas';
  canvas.className = 'butterfly-liquid-canvas';
  stage.appendChild(canvas);

  // =========================================================================
  // 1. Lag-Free Fluid Stroke Nodes (Position + Velocity Vector + Age)
  // =========================================================================
  const MAX_NODES = 28;
  const STROKE_LIFETIME_MS = 2000; // Naturally settles back in 2.0 seconds
  const nodes = [];

  const pointer = {
    targetX: 0.5,
    targetY: 0.5,
    smoothX: 0.5,
    smoothY: 0.5,
    lastSpawnX: -1000,
    lastSpawnY: -1000,
    vx: 0,
    vy: 0,
    active: false,
    lastMoveTime: 0,
  };

  function addFluidNode(nx, ny, vx, vy, bornMs = performance.now()) {
    if (nodes.length > 0) {
      const last = nodes[nodes.length - 1];
      const dist = Math.hypot(nx - last.x, ny - last.y);
      if (dist < 0.02 && bornMs - last.born < 85) {
        last.x = last.x * 0.4 + nx * 0.6;
        last.y = last.y * 0.4 + ny * 0.6;
        last.vx = last.vx * 0.4 + vx * 0.6;
        last.vy = last.vy * 0.4 + vy * 0.6;
        last.born = bornMs;
        return;
      }
    }

    nodes.push({
      x: nx,
      y: ny,
      vx: Math.max(-2.2, Math.min(2.2, vx)),
      vy: Math.max(-2.2, Math.min(2.2, vy)),
      born: bornMs,
    });

    if (nodes.length > MAX_NODES) {
      nodes.shift();
    }
  }

  window.addEventListener(
    'pointermove',
    (e) => {
      const rect = stage.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;

      if (nx >= -0.04 && nx <= 1.04 && ny >= -0.04 && ny <= 1.04) {
        const now = performance.now();
        if (!pointer.active) {
          pointer.smoothX = nx;
          pointer.smoothY = ny;
          pointer.lastSpawnX = nx;
          pointer.lastSpawnY = ny;
          pointer.vx = 0;
          pointer.vy = 0;
          pointer.active = true;
        }
        pointer.targetX = nx;
        pointer.targetY = ny;
        pointer.lastMoveTime = now;
      } else {
        pointer.active = false;
      }
    },
    { passive: true }
  );

  function stepSmoothFluidPointer(nowMs) {
    if (!pointer.active) return;
    if (nowMs - pointer.lastMoveTime > 140) {
      pointer.active = false;
      return;
    }

    // Critically damped cursor interpolation for silky-smooth brush ribbons
    const lerp = 0.34;
    const nextX = pointer.smoothX + (pointer.targetX - pointer.smoothX) * lerp;
    const nextY = pointer.smoothY + (pointer.targetY - pointer.smoothY) * lerp;

    const dx = nextX - pointer.smoothX;
    const dy = nextY - pointer.smoothY;
    pointer.vx = pointer.vx * 0.58 + dx * 38.0 * 0.42;
    pointer.vy = pointer.vy * 0.58 + dy * 38.0 * 0.42;

    const dist = Math.hypot(nextX - pointer.lastSpawnX, nextY - pointer.lastSpawnY);
    pointer.smoothX = nextX;
    pointer.smoothY = nextY;

    if (dist >= 0.01) {
      const steps = Math.min(3, Math.max(1, Math.ceil(dist / 0.022)));
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const sx = pointer.lastSpawnX + (nextX - pointer.lastSpawnX) * t;
        const sy = pointer.lastSpawnY + (nextY - pointer.lastSpawnY) * t;
        addFluidNode(sx, sy, pointer.vx, pointer.vy, nowMs);
      }
      pointer.lastSpawnX = nextX;
      pointer.lastSpawnY = nextY;
    }
  }

  // =========================================================================
  // 2. Natural Bubble-Free WebGL Fluid Shader
  //    (Simplex Noise & waterWave from shadergradient + soft refraction from liquid-glass-js)
  // =========================================================================
  const gl = canvas.getContext('webgl', {
    alpha: true,
    premultipliedAlpha: false,
    antialias: true,
    preserveDrawingBuffer: true,
  });

  const vsSource = `
    attribute vec2 a_position;
    attribute vec2 a_texcoord;
    varying vec2 v_texcoord;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
      v_texcoord = a_texcoord;
    }
  `;

  const fsSource = `
    precision highp float;

    varying vec2 v_texcoord;
    uniform sampler2D u_orangeTex;
    uniform sampler2D u_creamTex;
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform int u_nodeCount;
    // u_nodesPos[i] = (x, y, vx, vy), u_nodesMeta[i] = (sigma, life, 0, 0)
    uniform vec4 u_nodesPos[${MAX_NODES}];
    uniform vec4 u_nodesMeta[${MAX_NODES}];

    // --- 3D Simplex Noise from _vendor_repos/shadergradient ---
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
      const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      i = mod289(i);
      vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);
      vec4 x = x_ * ns.x + ns.yyyy;
      vec4 y = y_ * ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);
      vec4 s0 = floor(b0) * 2.0 + 1.0;
      vec4 s1 = floor(b1) * 2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
      p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
    }

    // --- WaterWave from _vendor_repos/shadergradient ---
    vec3 waterWave(vec2 pos, float time) {
      float freq = 15.0;
      float wave1 = sin(pos.x * freq + time * 3.2) * cos(pos.y * freq * 0.9 + time * 2.4);
      float wave2 = sin(pos.x * freq * 1.8 - time * 3.8) * sin(pos.y * freq * 1.4 + time * 2.9);
      float wave3 = cos((pos.x + pos.y) * freq * 1.1 + time * 2.6);
      float height = wave1 * 0.45 + wave2 * 0.35 + wave3 * 0.20;
      float dx = cos(pos.x * freq + time * 3.2) * 0.65 - sin(pos.x * freq * 1.8 - time * 3.8) * 0.45;
      float dy = -sin(pos.y * freq * 0.9 + time * 2.4) * 0.60 + cos(pos.y * freq * 1.4 + time * 2.9) * 0.45;
      return vec3(dx, height, dy);
    }

    void main() {
      if (u_nodeCount <= 0) {
        gl_FragColor = vec4(0.0);
        return;
      }

      vec2 coord = v_texcoord;
      float aspect = u_resolution.x / max(u_resolution.y, 1.0);

      // Evaluate smooth, bubble-free Gaussian fluid field + travelling water ripples across active trail nodes
      float fieldStrength = 0.0;
      vec2 flowVel = vec2(0.0);
      vec2 rippleVec = vec2(0.0);
      float weightSum = 0.0;

      for (int i = 0; i < ${MAX_NODES}; i++) {
        if (i >= u_nodeCount) break;
        vec4 np = u_nodesPos[i];
        vec4 nm = u_nodesMeta[i];
        float sigma = max(0.02, nm.x);
        float life = nm.y;

        vec2 diff = coord - np.xy;
        diff.x *= aspect; // Aspect-corrected distance
        float distSq = dot(diff, diff);
        float dist = sqrt(distSq);

        // Soft Gaussian bell falloff (NO sharp border or bubble edge!)
        float g = exp(-distSq / (2.0 * sigma * sigma)) * life;
        fieldStrength = 1.0 - (1.0 - fieldStrength) * (1.0 - g * 0.78);
        flowVel += np.zw * g;

        // Concentric travelling liquid wave radiating softly through the Gaussian field (no hard ring!)
        vec2 dir = dist > 0.0001 ? (diff / dist) : vec2(0.0, 1.0);
        float travelWave = sin(dist * 42.0 - u_time * 9.5 + float(i) * 0.7) * g;
        rippleVec += dir * travelWave;

        weightSum += g;
      }

      if (fieldStrength <= 0.003) {
        gl_FragColor = vec4(0.0);
        return;
      }

      if (weightSum > 0.0001) {
        flowVel /= weightSum;
        rippleVec /= max(1.0, weightSum * 0.65);
      }

      // Strictly mask to the butterfly silhouette (never spill onto background)
      float baseAlpha = texture2D(u_orangeTex, coord).a;
      if (baseAlpha <= 0.005) {
        gl_FragColor = vec4(0.0);
        return;
      }

      // Organic Simplex noise feathering so the brush edge feels like natural flowing water
      float organicNoise = snoise(vec3(coord * 8.5, u_time * 1.45));
      float naturalMask = smoothstep(0.015, 0.62, fieldStrength + organicNoise * 0.14 * fieldStrength);

      if (naturalMask <= 0.002) {
        gl_FragColor = vec4(0.0);
        return;
      }

      // High-intensity, bubble-free liquid flow:
      // 1. Directional cursor flow pull (-flowVel * 0.048)
      // 2. Perpendicular fluid vortex/swirl (swirlVec * 0.026)
      // 3. Multi-layered shadergradient waterWave (wave.xz * 0.024)
      // 4. Travelling radial water ripples (rippleVec * 0.022)
      // 5. Simplex noise turbulence (0.016)
      vec3 wave = waterWave(coord, u_time);
      vec2 perpFlow = vec2(-flowVel.y, flowVel.x);
      vec2 swirlVec = perpFlow * sin(fieldStrength * 9.0 - u_time * 6.0);

      vec2 fluidOffset = (
        -flowVel * 0.048 +
        swirlVec * 0.026 +
        wave.xz * 0.024 +
        rippleVec * 0.022 +
        vec2(organicNoise, -organicNoise) * 0.016
      ) * naturalMask;

      // Liquid-glass chromatic dispersion across R, G, B channels
      vec2 uvR = clamp(coord + fluidOffset * 1.24, 0.0, 1.0);
      vec2 uvG = clamp(coord + fluidOffset, 0.0, 1.0);
      vec2 uvB = clamp(coord + fluidOffset * 0.76, 0.0, 1.0);

      vec3 creamRgb = vec3(
        texture2D(u_creamTex, uvR).r,
        texture2D(u_creamTex, uvG).g,
        texture2D(u_creamTex, uvB).b
      );
      vec3 orangeRgb = vec3(
        texture2D(u_orangeTex, uvR).r,
        texture2D(u_orangeTex, uvG).g,
        texture2D(u_orangeTex, uvB).b
      );

      // Smoothly reveal the natural Cream/Ivory floral butterfly along the liquid stroke
      vec3 blendedWing = mix(orangeRgb, creamRgb, 0.90);

      // Subtle watery wave-crest refraction modulation (preserves dark veins, zero bubble ring)
      float luma = dot(blendedWing, vec3(0.299, 0.587, 0.114));
      float pigmentMask = smoothstep(0.14, 0.52, luma);
      vec3 warmEditorialTone = mix(vec3(0.99, 0.95, 0.86), vec3(0.95, 0.76, 0.55), 0.5 + 0.5 * wave.y);
      blendedWing = mix(blendedWing, warmEditorialTone * (0.35 + 0.65 * luma), 0.15 * pigmentMask);

      // Gentle watery wave crest shimmer inside the flow (strictly capped, no border ring)
      float waveCrest = max(0.0, wave.y) * 0.075 * pigmentMask * naturalMask;
      blendedWing = clamp(blendedWing + vec3(1.0, 0.97, 0.90) * waveCrest, 0.0, 0.96);

      // Output with completely feathered, bubble-free alpha
      gl_FragColor = vec4(blendedWing, baseAlpha * naturalMask * 0.95);
    }
  `;

  let useWebGL = false;
  let creamTex = null;
  let orangeTex = null;
  let uResolutionLoc = null;
  let uTimeLoc = null;
  let uNodeCountLoc = null;
  let uNodesPosLoc = null;
  let uNodesMetaLoc = null;

  if (gl && !gl.isContextLost()) {
    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        return null;
      }
      return s;
    }

    const vs = compile(gl.VERTEX_SHADER, vsSource);
    const fs = compile(gl.FRAGMENT_SHADER, fsSource);
    if (vs && fs) {
      const prog = gl.createProgram();
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);

      if (gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        gl.useProgram(prog);

        const posBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
          gl.STATIC_DRAW
        );
        const aPos = gl.getAttribLocation(prog, 'a_position');
        gl.enableVertexAttribArray(aPos);
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

        const uvBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array([0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0]),
          gl.STATIC_DRAW
        );
        const aUv = gl.getAttribLocation(prog, 'a_texcoord');
        gl.enableVertexAttribArray(aUv);
        gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0);

        function makeTex(unit) {
          const t = gl.createTexture();
          gl.activeTexture(gl.TEXTURE0 + unit);
          gl.bindTexture(gl.TEXTURE_2D, t);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          return t;
        }

        orangeTex = makeTex(0);
        creamTex = makeTex(1);

        gl.uniform1i(gl.getUniformLocation(prog, 'u_orangeTex'), 0);
        gl.uniform1i(gl.getUniformLocation(prog, 'u_creamTex'), 1);

        uResolutionLoc = gl.getUniformLocation(prog, 'u_resolution');
        uTimeLoc = gl.getUniformLocation(prog, 'u_time');
        uNodeCountLoc = gl.getUniformLocation(prog, 'u_nodeCount');
        uNodesPosLoc = gl.getUniformLocation(prog, 'u_nodesPos[0]') || gl.getUniformLocation(prog, 'u_nodesPos');
        uNodesMetaLoc = gl.getUniformLocation(prog, 'u_nodesMeta[0]') || gl.getUniformLocation(prog, 'u_nodesMeta');

        useWebGL = true;
      }
    }
  }

  // =========================================================================
  // 3. Soft Feathered 2D Fallback (for Headless CLI Screenshot Verification)
  // =========================================================================
  let fallbackCanvas = null;
  let fallbackCtx = null;
  const FB_W = 960;
  const FB_H = 560;
  const fbMaskCanvas = document.createElement('canvas');
  fbMaskCanvas.width = FB_W;
  fbMaskCanvas.height = FB_H;
  const fbMaskCtx = fbMaskCanvas.getContext('2d');

  const fbFlowCanvas = document.createElement('canvas');
  fbFlowCanvas.width = FB_W;
  fbFlowCanvas.height = FB_H;
  const fbFlowCtx = fbFlowCanvas.getContext('2d');

  function renderFallback2D(activeNodes, nowMs) {
    if (!fallbackCanvas) {
      canvas.style.display = 'none';
      fallbackCanvas = document.createElement('canvas');
      fallbackCanvas.className = 'butterfly-liquid-canvas';
      fallbackCanvas.width = FB_W;
      fallbackCanvas.height = FB_H;
      stage.appendChild(fallbackCanvas);
      fallbackCtx = fallbackCanvas.getContext('2d');
    }

    fallbackCtx.clearRect(0, 0, FB_W, FB_H);
    if (activeNodes.length === 0) return;

    fbMaskCtx.clearRect(0, 0, FB_W, FB_H);
    let avgVx = 0;
    let avgVy = 0;
    for (let i = 0; i < activeNodes.length; i++) {
      const n = activeNodes[i];
      avgVx += n.vx * n.life;
      avgVy += n.vy * n.life;
      const cx = n.x * FB_W;
      const cy = n.y * FB_H;
      const r = n.sigma * 2.4 * FB_W;
      // Wide, ultra-soft Gaussian gradient with zero hard edge
      const g = fbMaskCtx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0.0, `rgba(255, 255, 255, ${(n.life * 0.78).toFixed(3)})`);
      g.addColorStop(0.50, `rgba(255, 255, 255, ${(n.life * 0.48).toFixed(3)})`);
      g.addColorStop(0.82, `rgba(255, 255, 255, ${(n.life * 0.14).toFixed(3)})`);
      g.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
      fbMaskCtx.fillStyle = g;
      fbMaskCtx.beginPath();
      fbMaskCtx.arc(cx, cy, r, 0, Math.PI * 2);
      fbMaskCtx.fill();
    }
    avgVx /= activeNodes.length;
    avgVy /= activeNodes.length;

    const tSec = nowMs * 0.001;
    const flowX = -avgVx * 18.0 + Math.sin(tSec * 3.2) * 11.0;
    const flowY = -avgVy * 18.0 + Math.cos(tSec * 2.6) * 9.5;

    fbFlowCtx.clearRect(0, 0, FB_W, FB_H);
    fbFlowCtx.drawImage(creamImg, flowX, flowY, FB_W, FB_H);

    fallbackCtx.save();
    fallbackCtx.drawImage(fbFlowCanvas, 0, 0, FB_W, FB_H);
    fallbackCtx.globalCompositeOperation = 'destination-in';
    fallbackCtx.drawImage(fbMaskCanvas, 0, 0, FB_W, FB_H);
    fallbackCtx.globalCompositeOperation = 'destination-in';
    fallbackCtx.drawImage(orangeImg, 0, 0, FB_W, FB_H);
    fallbackCtx.restore();
  }

  // =========================================================================
  // 4. Master 60fps Render Loop & Deterministic Inspection API
  // =========================================================================
  let imagesReady = 0;
  let lockedSimulationTimeMs = null;
  const nodesPosData = new Float32Array(MAX_NODES * 4);
  const nodesMetaData = new Float32Array(MAX_NODES * 4);

  function resizeWebGL() {
    if (!useWebGL || !gl) return;
    const rect = stage.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  }
  window.addEventListener('resize', resizeWebGL);

  function renderFrame(nowMs) {
    if (imagesReady < 2) {
      if (lockedSimulationTimeMs === null) requestAnimationFrame(renderFrame);
      return;
    }

    const effectiveTime = lockedSimulationTimeMs !== null ? lockedSimulationTimeMs : nowMs;
    if (lockedSimulationTimeMs === null) {
      stepSmoothFluidPointer(effectiveTime);
    }

    for (let i = nodes.length - 1; i >= 0; i--) {
      if (effectiveTime - nodes[i].born >= STROKE_LIFETIME_MS) {
        nodes.splice(i, 1);
      }
    }

    const activeNodes = [];
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const age = Math.max(0, (effectiveTime - n.born) / STROKE_LIFETIME_MS);
      if (age >= 1.0) continue;

      // Soft fluid emergence and natural cubic ease-out dissipation
      const attack = Math.min(1.0, age / 0.08);
      const decay = Math.pow(1.0 - age, 1.85);
      const life = attack * decay;
      // Gaussian sigma gently widens as the liquid ripple diffuses outward
      const sigma = 0.068 * (1.0 + age * 0.35);

      activeNodes.push({
        x: n.x,
        y: n.y,
        vx: n.vx * decay,
        vy: n.vy * decay,
        sigma,
        life,
      });
    }

    if (useWebGL && gl && !gl.isContextLost()) {
      resizeWebGL();
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      if (activeNodes.length > 0) {
        nodesPosData.fill(0);
        nodesMetaData.fill(0);
        const count = Math.min(MAX_NODES, activeNodes.length);
        for (let i = 0; i < count; i++) {
          const an = activeNodes[i];
          nodesPosData[i * 4 + 0] = an.x;
          nodesPosData[i * 4 + 1] = an.y;
          nodesPosData[i * 4 + 2] = an.vx;
          nodesPosData[i * 4 + 3] = an.vy;
          nodesMetaData[i * 4 + 0] = an.sigma;
          nodesMetaData[i * 4 + 1] = an.life;
        }

        gl.uniform2f(uResolutionLoc, canvas.width, canvas.height);
        gl.uniform1f(uTimeLoc, effectiveTime * 0.001);
        gl.uniform1i(uNodeCountLoc, count);
        gl.uniform4fv(uNodesPosLoc, nodesPosData);
        gl.uniform4fv(uNodesMetaLoc, nodesMetaData);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
    } else {
      renderFallback2D(activeNodes, effectiveTime);
    }

    if (lockedSimulationTimeMs === null) {
      requestAnimationFrame(renderFrame);
    }
  }

  window.__simulateBrushStrokeAt = function (elapsedAfterStrokeMs) {
    nodes.length = 0;
    const baseTime = 1000;
    const strokePoints = [
      { x: 0.25, y: 0.35, vx: 0.65, vy: 0.28, dt: 0 },
      { x: 0.30, y: 0.39, vx: 0.70, vy: 0.26, dt: 30 },
      { x: 0.35, y: 0.43, vx: 0.72, vy: 0.22, dt: 60 },
      { x: 0.40, y: 0.46, vx: 0.68, vy: 0.18, dt: 90 },
      { x: 0.57, y: 0.46, vx: 0.75, vy: -0.25, dt: 120 },
      { x: 0.63, y: 0.41, vx: 0.80, vy: -0.30, dt: 150 },
      { x: 0.68, y: 0.37, vx: 0.75, vy: -0.25, dt: 180 },
      { x: 0.61, y: 0.63, vx: -0.58, vy: 0.40, dt: 205 },
      { x: 0.39, y: 0.64, vx: -0.62, vy: 0.35, dt: 220 },
    ];
    strokePoints.forEach((pt) => {
      if (pt.dt <= elapsedAfterStrokeMs) {
        addFluidNode(pt.x, pt.y, pt.vx, pt.vy, baseTime + pt.dt);
      }
    });
    lockedSimulationTimeMs = baseTime + elapsedAfterStrokeMs;
    renderFrame(lockedSimulationTimeMs);
  };

  function onImgReady() {
    imagesReady++;
    if (imagesReady === 2) {
      if (window.location.protocol === 'file:') {
        useWebGL = false;
      } else if (useWebGL && gl) {
        try {
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, orangeTex);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, orangeImg);

          gl.activeTexture(gl.TEXTURE1);
          gl.bindTexture(gl.TEXTURE_2D, creamTex);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, creamImg);

          if (gl.getError() !== gl.NO_ERROR) {
            useWebGL = false;
          }
        } catch (err) {
          useWebGL = false;
        }
      }

      const params = new URLSearchParams(window.location.search);
      if (params.has('brush')) {
        const brushElapsed = parseFloat(params.get('brush'));
        window.__simulateBrushStrokeAt(brushElapsed);
      } else {
        requestAnimationFrame(renderFrame);
      }
    }
  }

  if (creamImg.complete && creamImg.naturalWidth > 0) onImgReady();
  else creamImg.addEventListener('load', onImgReady, { once: true });

  if (orangeImg.complete && orangeImg.naturalWidth > 0) onImgReady();
  else orangeImg.addEventListener('load', onImgReady, { once: true });
})();
