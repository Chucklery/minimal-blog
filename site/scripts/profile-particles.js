// 将照片实时重组为有景深、呼吸感和指针反馈的粒子肖像。
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
  // Keep shadow particles cool and distinct from the near-black backdrop;
  // compress the photo's dark range so hair and face contours remain visible.
  const tones = [
    '#344955', '#526875', '#74818a', '#936047', '#b55732',
    '#d86839', '#f0804b', '#ffaf7e', '#ffe0c8',
  ];
  const pointer = { x: -10000, y: -10000, active: false };
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
  let phases;
  let lanes;
  let toneIndex;
  let toneBuckets;

  const random = () => {
    seed += 0x6d2b79f5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const smootherstep = (value) => value * value * value * (value * (value * 6 - 15) + 10);

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

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

    count = compact
      ? Math.min(6500, Math.round(width * height / 85))
      : Math.min(18000, Math.round(width * height / 78));
    count = Math.max(compact ? 3200 : 7000, count);
    seed = (Math.imul(width | 0, 73856093) ^ Math.imul(height | 0, 19349663)) >>> 0;

    tx = new Float32Array(count);
    ty = new Float32Array(count);
    sx = new Float32Array(count);
    sy = new Float32Array(count);
    px = new Float32Array(count);
    py = new Float32Array(count);
    ox = new Float32Array(count);
    oy = new Float32Array(count);
    sizes = new Float32Array(count);
    phases = new Float32Array(count);
    lanes = new Uint8Array(count);
    toneIndex = new Uint8Array(count);
    toneBuckets = Array.from({ length: tones.length }, () => []);

    const originX = compact ? (width - sampleWidth) / 2 : width * 0.46;
    const originY = compact ? Math.max(40, height * 0.05) : (height - sampleHeight) * 0.38;
    const centerX = originX + sampleWidth / 2;
    const centerY = originY + sampleHeight / 2;
    const reach = Math.max(width, height) * 0.76;

    for (let index = 0; index < count; index++) {
      let localX = 0;
      let localY = 0;
      let luminance = 0;
      let red = 0;
      let green = 0;
      let blue = 0;
      let edge = 0;
      let warmth = 0;

      for (let attempt = 0; attempt < 160; attempt++) {
        localX = Math.floor(random() * sampleWidth);
        localY = Math.floor(random() * sampleHeight);
        const pixel = (localY * sampleWidth + localX) * 4;
        red = pixels[pixel];
        green = pixels[pixel + 1];
        blue = pixels[pixel + 2];
        luminance = (red * 0.2126 + green * 0.7152 + blue * 0.0722) / 255;

        const left = Math.max(0, localX - 1);
        const right = Math.min(sampleWidth - 1, localX + 1);
        const top = Math.max(0, localY - 1);
        const bottom = Math.min(sampleHeight - 1, localY + 1);
        const lumaAt = (x, y) => {
          const neighbor = (y * sampleWidth + x) * 4;
          return pixels[neighbor] * 0.2126 + pixels[neighbor + 1] * 0.7152 + pixels[neighbor + 2] * 0.0722;
        };
        edge = clamp((Math.abs(lumaAt(right, localY) - lumaAt(left, localY)) + Math.abs(lumaAt(localX, bottom) - lumaAt(localX, top))) / 255 * 2.2, 0, 1);
        warmth = clamp((red - blue - 4) / 75, 0, 1);

        const nx = (localX / sampleWidth - 0.5) * 2;
        const ny = (localY / sampleHeight - 0.5) * 2;
        const vignette = clamp(1 - Math.pow(Math.hypot(nx * 0.84, ny * 0.96), 3), 0, 1);
        // Favor warm hair/skin and local strands while suppressing the cool,
        // low-contrast background. This tightens the portrait silhouette.
        const coolShadowPenalty = blue > red * 1.18 && luminance < 0.48 ? 0.38 : 1;
        const density = vignette
          * (0.035 + luminance * 0.58 + warmth * 0.8 + edge * 0.25)
          * coolShadowPenalty;
        if (random() < density) break;
      }

      tx[index] = originX + localX;
      ty[index] = originY + localY;

      const angle = random() * TAU;
      const radius = reach * (0.64 + random() * 0.62);
      sx[index] = centerX + Math.cos(angle) * radius;
      sy[index] = centerY + Math.sin(angle) * radius;
      px[index] = sx[index];
      py[index] = sy[index];
      sizes[index] = 1.05 + random() * 1.75;
      phases[index] = random() * TAU;
      lanes[index] = (random() * 12) | 0;

      const warmBoost = clamp((red - blue - 4) / 75, 0, 1) * 0.34;
      const contrastLuminance = clamp((luminance - 0.02) * 1.52 + warmBoost + edge * 0.14, 0, 1);
      const selectedTone = clamp(
        Math.round(contrastLuminance * (tones.length - 1)),
        0,
        tones.length - 1
      );
      toneIndex[index] = selectedTone;
      toneBuckets[selectedTone].push(index);
    }

    startedAt = performance.now();
    hero.classList.add('is-particle-ready');
  }

  function update(now) {
    const centerX = width < 760 ? width / 2 : width * 0.72;
    const centerY = height * 0.46;
    const breath = 1 + Math.sin(now * 0.00042) * 0.018;

    for (let index = 0; index < count; index++) {
      const delay = lanes[index] * 58;
      const progress = clamp((now - startedAt - delay) / 3400, 0, 1);
      const eased = smootherstep(progress);
      const orbit = (1 - eased) * (TAU * 1.12);
      const relX = sx[index] - centerX;
      const relY = sy[index] - centerY;
      const rotatedX = relX * Math.cos(orbit) - relY * Math.sin(orbit);
      const rotatedY = relX * Math.sin(orbit) + relY * Math.cos(orbit);
      const startX = centerX + rotatedX;
      const startY = centerY + rotatedY * (0.72 + eased * 0.28);
      const targetX = centerX + (tx[index] - centerX) * breath;
      const targetY = centerY + (ty[index] - centerY) * breath;
      const drift = Math.sin(now * 0.00055 + phases[index]) * 1.8 * eased;
      const baseX = startX + (targetX - startX) * eased + drift;
      const baseY = startY + (targetY - startY) * eased + Math.cos(now * 0.00041 + phases[index]) * 1.4 * eased;

      const dx = pointer.x - baseX;
      const dy = pointer.y - baseY;
      const distanceSquared = dx * dx + dy * dy;
      let desiredX = 0;
      let desiredY = 0;
      const radius = 112;
      if (pointer.active && distanceSquared > 1 && distanceSquared < radius * radius) {
        const distance = Math.sqrt(distanceSquared);
        const force = (radius - distance) / radius;
        desiredX = -(dx / distance) * force * 29;
        desiredY = -(dy / distance) * force * 29;
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
    const entrance = clamp((now - startedAt) / 2600, 0, 1);

    for (let tone = 0; tone < toneBuckets.length; tone++) {
      ctx.fillStyle = tones[tone];
      const bucket = toneBuckets[tone];
      for (let item = 0; item < bucket.length; item++) {
        const index = bucket[item];
        const shimmer = 0.82 + (Math.sin(now * 0.0014 + phases[index]) + 1) * 0.13;
        const size = sizes[index] * shimmer * (0.58 + entrance * 0.42);
        ctx.fillRect(px[index], py[index], size, size);
      }
    }
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
