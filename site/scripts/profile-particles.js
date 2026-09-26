// 从照片的颜色与局部轮廓采样，用粒子重组肖像和五官。
(() => {
  const canvas = document.querySelector('[data-profile-particles]');
  const hero = document.querySelector('[data-profile-hero]');
  if (!canvas || !hero || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) {
    hero.classList.add('is-particle-fallback');
    return;
  }
  const source = new Image();
  source.decoding = 'async';
  source.src = canvas.dataset.source;

  const TAU = Math.PI * 2;
  // Lift the source photo's darkest colors enough to read on the black canvas.
  const tones = [
    '#4a5c67', '#647780', '#87959b', '#b1b6b2',
    '#493b37', '#64483c', '#80503e', '#9e5b42', '#bd6a48',
    '#d67a50', '#ea8c5d', '#f6a171', '#ffb78a', '#ffd0a9', '#ffe0c5',
  ];
  const ALPHA_LEVELS = 8;
  const pointer = { x: -10000, y: -10000, active: false };
  const laneEase = new Float32Array(12);
  const laneCos = new Float32Array(12);
  const laneSin = new Float32Array(12);
  let width = 0;
  let height = 0;
  let dpr = 1;
  let count = 0;
  let startedAt = 0;
  let frame = 0;
  let resizeFrame = 0;
  let seed = 1;

  let tx;
  let ty;
  let sx;
  let sy;
  let px;
  let py;
  let ox;
  let oy;
  let sizes;
  let scatterX;
  let scatterY;
  let detailFlags;
  let phases;
  let pulseSpeeds;
  let lanes;
  let toneIndex;
  let alphaIndex;
  let drawOrder;
  let drawCounts;
  let drawStarts;
  let portraitCenterX = 0;
  let portraitCenterY = 0;

  const random = () => {
    seed += 0x6d2b79f5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const smootherstep = (value) => value * value * value * (value * (value * 6 - 15) + 10);
  const breathScale = (now) => 1 + Math.sin(now * 0.00068) * 0.055;

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // Feature zones match the portrait and receive more edge particles.
  const featureZones = [
    [0.375, 0.43, 0.12, 0.072],
    [0.645, 0.44, 0.12, 0.072],
    [0.505, 0.605, 0.115, 0.125],
    [0.505, 0.7, 0.15, 0.07],
  ];
  const featureAt = (x, y, imageWidth, imageHeight) => {
    for (let index = featureZones.length - 1; index >= 0; index--) {
      const [cx, cy, rx, ry] = featureZones[index];
      const dx = (x / imageWidth - cx) / rx;
      const dy = (y / imageHeight - cy) / ry;
      if (dx * dx + dy * dy < 1) return index;
    }
    return -1;
  };

  function samplePortrait() {
    const compact = width < 760;
    const sampleWidth = Math.max(280, Math.round(compact ? width * 0.98 : Math.min(width * 0.61, height * 0.93)));
    const sampleHeight = Math.round(sampleWidth * (source.naturalHeight / source.naturalWidth));
    const offscreen = document.createElement('canvas');
    offscreen.width = sampleWidth;
    offscreen.height = sampleHeight;
    const offctx = offscreen.getContext('2d', { willReadFrequently: true });
    offctx.drawImage(source, 0, 0, sampleWidth, sampleHeight);
    const pixels = offctx.getImageData(0, 0, sampleWidth, sampleHeight).data;
    const lumaAt = (x, y) => {
      const px = clamp(x, 0, sampleWidth - 1);
      const py = clamp(y, 0, sampleHeight - 1);
      const pixel = (py * sampleWidth + px) * 4;
      return pixels[pixel] * 0.2126 + pixels[pixel + 1] * 0.7152 + pixels[pixel + 2] * 0.0722;
    };
    const edgeAt = (x, y, step) => (
      Math.abs(lumaAt(x + step, y) - lumaAt(x - step, y))
      + Math.abs(lumaAt(x, y + step) - lumaAt(x, y - step))
    ) / 255;
    const gridStep = compact ? 2 : 3;
    const pools = [[], [], [], [], [], []];
    // Feature outlines, lit features, dark features, other edges, skin, hair.

    // A loose grid covers the portrait outside the facial details.
    for (let y = gridStep; y < sampleHeight - gridStep; y += gridStep) {
      for (let x = gridStep; x < sampleWidth - gridStep; x += gridStep) {
        const pixel = (y * sampleWidth + x) * 4;
        const red = pixels[pixel];
        const green = pixels[pixel + 1];
        const blue = pixels[pixel + 2];
        const light = (red * 0.2126 + green * 0.7152 + blue * 0.0722) / 255;
        if (featureAt(x, y, sampleWidth, sampleHeight) >= 0) continue;
        if (red <= blue + 3 && light < 0.26) continue;
        const edge = edgeAt(x, y, gridStep);
        if (edge > 0.16) pools[3].push([x, y]);
        else if (light > 0.22 && red > blue + 10) pools[4].push([x, y]);
        else pools[5].push([x, y]);
      }
    }

    // A finer grid follows the actual eye, nose and lip pixels. Dark pupils
    // and creases get few tiny dots; their lit boundaries stay densely drawn.
    const fineStep = compact ? 1 : 2;
    for (let zone = 0; zone < featureZones.length; zone++) {
      const [cx, cy, rx, ry] = featureZones[zone];
      const left = Math.max(fineStep, Math.floor((cx - rx) * sampleWidth));
      const right = Math.min(sampleWidth - fineStep, Math.ceil((cx + rx) * sampleWidth));
      const top = Math.max(fineStep, Math.floor((cy - ry) * sampleHeight));
      const bottom = Math.min(sampleHeight - fineStep, Math.ceil((cy + ry) * sampleHeight));
      for (let y = top; y < bottom; y += fineStep) {
        for (let x = left; x < right; x += fineStep) {
          if (featureAt(x, y, sampleWidth, sampleHeight) !== zone) continue;
          const pixel = (y * sampleWidth + x) * 4;
          const red = pixels[pixel];
          const green = pixels[pixel + 1];
          const blue = pixels[pixel + 2];
          const light = (red * 0.2126 + green * 0.7152 + blue * 0.0722) / 255;
          const darkLimit = zone === 3 ? 0.44 : zone === 2 ? 0.28 : 0.25;
          if (light < darkLimit) pools[2].push([x, y]);
          else if (edgeAt(x, y, fineStep) > 0.075) pools[0].push([x, y]);
          else pools[1].push([x, y]);
        }
      }
    }

    count = Math.round(Math.max(
      compact ? 5000 : 10000,
      Math.min(compact ? 8000 : 24000, Math.round(width * height / (compact ? 44 : 55)))
    ) * 0.9);
    seed = (Math.imul(width | 0, 73856093) ^ Math.imul(height | 0, 19349663)) >>> 0;
    for (const pool of pools) {
      for (let index = pool.length - 1; index > 0; index--) {
        const other = (random() * (index + 1)) | 0;
        [pool[index], pool[other]] = [pool[other], pool[index]];
      }
    }
    const cursors = [0, 0, 0, 0, 0, 0];
    const featureOutlineEnd = Math.round(count * 0.1);
    const featureLightEnd = Math.round(count * 0.25);
    const featureDarkEnd = Math.round(count * 0.28);
    const edgeEnd = Math.round(count * 0.43);
    const faceEnd = Math.round(count * 0.81);

    tx = new Float32Array(count);
    ty = new Float32Array(count);
    sx = new Float32Array(count);
    sy = new Float32Array(count);
    px = new Float32Array(count);
    py = new Float32Array(count);
    ox = new Float32Array(count);
    oy = new Float32Array(count);
    sizes = new Float32Array(count);
    scatterX = new Float32Array(count);
    scatterY = new Float32Array(count);
    detailFlags = new Uint8Array(count);
    phases = new Float32Array(count);
    pulseSpeeds = new Float32Array(count);
    lanes = new Uint8Array(count);
    toneIndex = new Uint8Array(count);
    alphaIndex = new Uint8Array(count);
    drawOrder = new Int32Array(count);
    drawCounts = new Int32Array(tones.length * ALPHA_LEVELS);
    drawStarts = new Int32Array(tones.length * ALPHA_LEVELS);

    const originX = compact ? (width - sampleWidth) / 2 : width * 0.46;
    const originY = compact ? Math.max(40, height * 0.05) : (height - sampleHeight) * 0.38;
    const centerX = originX + sampleWidth / 2;
    const centerY = originY + sampleHeight / 2;
    portraitCenterX = centerX;
    portraitCenterY = centerY;
    const reach = Math.max(width, height) * 0.76;

    for (let index = 0; index < count; index++) {
      let type = index < featureOutlineEnd ? 0
        : index < featureLightEnd ? 1
          : index < featureDarkEnd ? 2
            : index < edgeEnd ? 3
              : index < faceEnd ? 4 : 5;
      if (!pools[type].length) type = pools.findIndex((pool) => pool.length);
      const pool = pools[type];
      const candidate = pool[cursors[type]++ % pool.length];
      const jitter = type < 3 ? 0.18 : 0.4;
      const localX = clamp(Math.round(candidate[0] + (random() - 0.5) * gridStep * jitter), 0, sampleWidth - 1);
      const localY = clamp(Math.round(candidate[1] + (random() - 0.5) * gridStep * jitter), 0, sampleHeight - 1);
      const pixel = (localY * sampleWidth + localX) * 4;
      const red = pixels[pixel];
      const green = pixels[pixel + 1];
      const blue = pixels[pixel + 2];
      const light = (red * 0.2126 + green * 0.7152 + blue * 0.0722) / 255;
      const warm = red > blue + 8;

      detailFlags[index] = type < 3 ? 2 : type === 3 ? 1 : 0;
      tx[index] = originX + localX;
      ty[index] = originY + localY;

      const angle = random() * TAU;
      const radius = reach * (0.64 + random() * 0.62);
      sx[index] = centerX + Math.cos(angle) * radius;
      sy[index] = centerY + Math.sin(angle) * radius;
      px[index] = sx[index];
      py[index] = sy[index];
      sizes[index] = type === 0 ? 1.25 + random() * 0.7
        : type === 1 ? 1.65 + random() * 0.8
          : type === 2 ? 0.85 + random() * 0.55
            : type === 3 ? 1.7 + random()
              : 2.35 + random() * 1.4;
      const scatterAngle = Math.atan2(localY - sampleHeight / 2, localX - sampleWidth / 2)
        + (random() - 0.5) * 1.1;
      const scatterDistance = detailFlags[index] === 2
        ? 0.45 + random() * 0.65
        : detailFlags[index] === 1
          ? 0.9 + random() * 1.1
          : 1.4 + random() * 2;
      scatterX[index] = Math.cos(scatterAngle) * scatterDistance;
      scatterY[index] = Math.sin(scatterAngle) * scatterDistance;
      phases[index] = random() * TAU;
      pulseSpeeds[index] = 1.35 + random() * 1.9;
      lanes[index] = (random() * 12) | 0;
      const sampledTone = warm
        ? 4 + Math.round(clamp((light - 0.02) * 1.2, 0, 1) * 10)
        : Math.round(clamp(light * 2.2, 0, 1) * 3);
      toneIndex[index] = type === 0 && warm ? Math.min(tones.length - 1, sampledTone + 1) : sampledTone;
    }

    startedAt = performance.now();
    hero.classList.add('is-particle-ready');
  }

  function update(now) {
    const centerX = portraitCenterX;
    const centerY = portraitCenterY;
    const breath = breathScale(now);
    const dispersion = smootherstep(clamp((breath - 1) / 0.055, 0, 1));
    for (let lane = 0; lane < laneEase.length; lane++) {
      const progress = clamp((now - startedAt - lane * 30) / 1900, 0, 1);
      const eased = smootherstep(progress);
      const orbit = (1 - eased) * (TAU * 1.12);
      laneEase[lane] = eased;
      laneCos[lane] = Math.cos(orbit);
      laneSin[lane] = Math.sin(orbit);
    }

    for (let index = 0; index < count; index++) {
      const lane = lanes[index];
      const eased = laneEase[lane];
      const relX = sx[index] - centerX;
      const relY = sy[index] - centerY;
      const rotatedX = relX * laneCos[lane] - relY * laneSin[lane];
      const rotatedY = relX * laneSin[lane] + relY * laneCos[lane];
      const startX = centerX + rotatedX;
      const startY = centerY + rotatedY * (0.72 + eased * 0.28);
      const targetX = centerX + (tx[index] - centerX) * breath;
      const targetY = centerY + (ty[index] - centerY) * breath;
      const drift = Math.sin(now * 0.00055 + phases[index]) * (detailFlags[index] ? 0.4 : 1.35) * eased;
      const baseX = startX + (targetX - startX) * eased + drift
        + scatterX[index] * dispersion * eased;
      const baseY = startY + (targetY - startY) * eased
        + Math.cos(now * 0.00041 + phases[index]) * (detailFlags[index] ? 0.35 : 1.1) * eased
        + scatterY[index] * dispersion * eased;

      const dx = pointer.x - baseX;
      const dy = pointer.y - baseY;
      const distanceSquared = dx * dx + dy * dy;
      let desiredX = 0;
      let desiredY = 0;
      const radius = 112;
      if (pointer.active && distanceSquared > 1 && distanceSquared < radius * radius) {
        const distance = Math.sqrt(distanceSquared);
        const force = (radius - distance) / radius;
        const displacement = detailFlags[index] === 2 ? 3 : detailFlags[index] ? 10 : 29;
        desiredX = -(dx / distance) * force * displacement;
        desiredY = -(dy / distance) * force * displacement;
      }

      ox[index] += (desiredX - ox[index]) * (pointer.active ? 0.2 : 0.1);
      oy[index] += (desiredY - oy[index]) * (pointer.active ? 0.2 : 0.1);
      px[index] = baseX + ox[index];
      py[index] = baseY + oy[index];
    }
  }

  function draw(now) {
    ctx.fillStyle = '#05090d';
    ctx.fillRect(0, 0, width, height);
    const entrance = clamp((now - startedAt) / 1600, 0, 1);
    const settled = smootherstep(clamp((now - startedAt) / 2500, 0, 1));
    drawCounts.fill(0);

    // Each dot pulses on its own phase. Quantized alpha buckets keep the
    // Canvas state changes bounded while letting settled parts of the face
    // fade in and out independently.
    for (let index = 0; index < count; index++) {
      const wave = (Math.sin(now * 0.001 * pulseSpeeds[index] + phases[index]) + 1) * 0.5;
      const pulse = detailFlags[index] ? 0.9 + wave * 0.1 : 0.78 + wave * 0.22;
      const opacity = 1 - settled + pulse * settled;
      const level = Math.round(opacity * (ALPHA_LEVELS - 1));
      alphaIndex[index] = level;
      drawCounts[toneIndex[index] * ALPHA_LEVELS + level]++;
    }

    let offset = 0;
    for (let bucket = 0; bucket < drawCounts.length; bucket++) {
      drawStarts[bucket] = offset;
      offset += drawCounts[bucket];
    }
    for (let index = 0; index < count; index++) {
      const bucket = toneIndex[index] * ALPHA_LEVELS + alphaIndex[index];
      drawOrder[drawStarts[bucket]++] = index;
    }

    let from = 0;
    for (let bucket = 0; bucket < drawCounts.length; bucket++) {
      const to = drawStarts[bucket];
      if (to === from) continue;
      const tone = (bucket / ALPHA_LEVELS) | 0;
      const alpha = (bucket % ALPHA_LEVELS) / (ALPHA_LEVELS - 1);
      ctx.fillStyle = tones[tone];
      ctx.globalAlpha = alpha;
      ctx.beginPath();

      for (let cursor = from; cursor < to; cursor++) {
        const index = drawOrder[cursor];
        const shimmer = 0.78 + alphaIndex[index] / (ALPHA_LEVELS - 1) * 0.3;
        const radius = sizes[index] * shimmer * (0.58 + entrance * 0.42) / 2;
        ctx.moveTo(px[index] + radius, py[index]);
        ctx.arc(px[index], py[index], radius, 0, TAU);
      }
      ctx.fill();
      from = to;
    }
    ctx.globalAlpha = 1;
  }

  function loop(now) {
    update(now);
    draw(now);
    frame = document.hidden ? 0 : requestAnimationFrame(loop);
  }

  function start() {
    resize();
    samplePortrait();
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(loop);
  }

  hero.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse' && !pointer.active) return;
    const bounds = canvas.getBoundingClientRect();
    pointer.x = event.clientX - bounds.left;
    pointer.y = event.clientY - bounds.top;
    pointer.active = true;
  }, { passive: true });

  hero.addEventListener('pointerdown', (event) => {
    const bounds = canvas.getBoundingClientRect();
    pointer.x = event.clientX - bounds.left;
    pointer.y = event.clientY - bounds.top;
    pointer.active = true;
  }, { passive: true });

  hero.addEventListener('pointerleave', () => {
    pointer.active = false;
    pointer.x = pointer.y = -10000;
  }, { passive: true });

  addEventListener('pointerup', (event) => {
    if (event.pointerType !== 'mouse') pointer.active = false;
  }, { passive: true });

  addEventListener('resize', () => {
    // Mobile browsers often fire resize while the address bar expands or
    // collapses during scrolling. The hero's width stays fixed, so rebuilding
    // every particle on those height-only changes causes a visible restart.
    if (width < 760 && canvas.clientWidth === width) return;
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(start);
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else if (!frame && count) {
      frame = requestAnimationFrame(loop);
    }
  });

  if (source.complete && source.naturalWidth) start();
  else source.addEventListener('load', start, { once: true });
  source.addEventListener('error', () => hero.classList.add('is-particle-fallback'), { once: true });
})();
