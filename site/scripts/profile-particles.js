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
    '#526672', '#697f89', '#82929a', '#a36a4f', '#bd603a',
    '#d86839', '#f0804b', '#ffaf7e', '#ffe0c8',
  ];
  const ALPHA_LEVELS = 8;
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
  let pulseSpeeds;
  let lanes;
  let toneIndex;
  let alphaIndex;
  let drawOrder;
  let drawCounts;
  let drawStarts;
  let mosaic;
  let mosaicX = 0;
  let mosaicY = 0;
  let mosaicWidth = 0;
  let mosaicHeight = 0;
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

  function buildMosaic(pixels, imageWidth, imageHeight) {
    mosaic = document.createElement('canvas');
    mosaic.width = imageWidth;
    mosaic.height = imageHeight;
    const mosaicContext = mosaic.getContext('2d');
    const pixelAt = (x, y) => {
      const px = clamp(Math.round(x), 0, imageWidth - 1);
      const py = clamp(Math.round(y), 0, imageHeight - 1);
      const offset = (py * imageWidth + px) * 4;
      return [pixels[offset], pixels[offset + 1], pixels[offset + 2]];
    };
    const brightness = (color) => (color[0] * 0.2126 + color[1] * 0.7152 + color[2] * 0.0722) / 255;
    const minSize = Math.max(7, Math.round(imageWidth / 105));
    const rootSize = minSize * 5;
    // These regions follow the eyes, nose and lips in about-portrait.jpg.
    // Normalized positions keep the detail aligned at every canvas size.
    const featureZones = [
      [0.375, 0.43, 0.12, 0.072],
      [0.645, 0.44, 0.12, 0.072],
      [0.505, 0.605, 0.115, 0.125],
      [0.505, 0.7, 0.15, 0.07],
    ];
    const isFeature = (x, y) => featureZones.some(([cx, cy, rx, ry]) => {
      const dx = (x / imageWidth - cx) / rx;
      const dy = (y / imageHeight - cy) / ry;
      return dx * dx + dy * dy < 1;
    });
    const touchesFeature = (x, y, blockWidth, blockHeight) => featureZones.some(([cx, cy, rx, ry]) => {
      const closestX = clamp(cx * imageWidth, x, x + blockWidth);
      const closestY = clamp(cy * imageHeight, y, y + blockHeight);
      const dx = (closestX / imageWidth - cx) / rx;
      const dy = (closestY / imageHeight - cy) / ry;
      return dx * dx + dy * dy < 1;
    });

    function drawBlock(x, y, blockWidth, blockHeight) {
      const feature = isFeature(x + blockWidth / 2, y + blockHeight / 2);
      const nearFeature = feature || touchesFeature(x, y, blockWidth, blockHeight);
      const colors = [
        pixelAt(x + blockWidth * 0.25, y + blockHeight * 0.25),
        pixelAt(x + blockWidth * 0.75, y + blockHeight * 0.25),
        pixelAt(x + blockWidth * 0.25, y + blockHeight * 0.75),
        pixelAt(x + blockWidth * 0.75, y + blockHeight * 0.75),
        pixelAt(x + blockWidth * 0.5, y + blockHeight * 0.5),
      ];
      const levels = colors.map(brightness);
      const warmth = colors.map((color) => color[0] - color[2]);
      const detail = Math.max(...levels) - Math.min(...levels);
      const colorEdge = Math.max(...warmth) - Math.min(...warmth);

      // Broad planes stay intact; eyes, hair strands and the face boundary
      // split into smaller blocks instead of becoming an even pixel grid.
      const smallestBlock = nearFeature ? minSize * 0.45 : minSize;
      if (blockWidth > smallestBlock * 1.5 && blockHeight > smallestBlock * 1.5
        && (nearFeature || detail > 0.07 || colorEdge > 18)) {
        const halfWidth = Math.ceil(blockWidth / 2);
        const halfHeight = Math.ceil(blockHeight / 2);
        drawBlock(x, y, halfWidth, halfHeight);
        drawBlock(x + halfWidth, y, blockWidth - halfWidth, halfHeight);
        drawBlock(x, y + halfHeight, halfWidth, blockHeight - halfHeight);
        drawBlock(x + halfWidth, y + halfHeight, blockWidth - halfWidth, blockHeight - halfHeight);
        return;
      }

      const average = [0, 1, 2].map((channel) =>
        colors.reduce((sum, color) => sum + color[channel], 0) / colors.length);
      const warm = clamp((average[0] - average[2] + 8) / 30, 0, 1);
      const light = brightness(average);
      if (!feature && warm < 0.18 && light < 0.24) return;

      const bands = feature ? 14 : 10;
      const band = Math.round(light * bands) / bands;
      const shade = clamp((band + 0.035) / (light + 0.035), 0.82, 1.18);
      const lift = warm * (1 - light);
      let red = clamp(Math.round(average[0] * shade * 1.14 + lift * 55), 0, 255);
      let green = clamp(Math.round(average[1] * shade * 1.08 + lift * 42), 0, 255);
      let blue = clamp(Math.round(average[2] * shade + lift * 38), 0, 255);
      if (!feature && warm > 0.26 && light < 0.18) {
        red = Math.max(red, 68 + warm * 28);
        green = Math.max(green, 51 + warm * 21);
        blue = Math.max(blue, 48 + warm * 19);
      }
      if (feature) {
        const contrast = light < 0.25 ? 0.72 : light > 0.47 ? 1.1 : 1;
        red = Math.max(25, Math.min(255, red * contrast));
        green = Math.max(29, Math.min(255, green * contrast));
        blue = Math.max(33, Math.min(255, blue * contrast));
      }
      mosaicContext.fillStyle = `rgba(${red}, ${green}, ${blue}, ${feature ? 0.94 : 0.5 + warm * 0.42})`;
      const inset = feature
        ? Math.min(0.65, blockWidth * 0.09)
        : Math.min(1.35, Math.max(0.85, blockWidth * 0.075));
      mosaicContext.fillRect(x + inset, y + inset, blockWidth - inset * 2, blockHeight - inset * 2);
    }

    for (let y = 0; y < imageHeight; y += rootSize) {
      for (let x = 0; x < imageWidth; x += rootSize) {
        drawBlock(x, y, Math.min(rootSize, imageWidth - x), Math.min(rootSize, imageHeight - y));
      }
    }

    // Fine strokes in the facial regions make eyelids, the nose bridge and
    // lip crease read clearly over the larger geometric planes.
    function drawContour(x, y, step, feature) {
      const left = pixelAt(x - step, y);
      const right = pixelAt(x + step, y);
      const top = pixelAt(x, y - step);
      const bottom = pixelAt(x, y + step);
      const gx = brightness(right) - brightness(left);
      const gy = brightness(bottom) - brightness(top);
      const strength = Math.hypot(gx, gy);
      const center = pixelAt(x, y);
      const warm = center[0] > center[2] + 4;
      if (strength < (feature ? 0.055 : warm ? 0.105 : 0.18)) return;
      const length = step * clamp(strength * (feature ? 3.4 : 2.4), 0.45, 0.95);
      const angle = Math.atan2(gy, gx) + Math.PI / 2;
      if (feature) {
        mosaicContext.strokeStyle = brightness(center) < 0.25
          ? 'rgba(20, 27, 35, 0.88)'
          : `rgba(255, 214, 180, ${clamp(strength * 1.7, 0.4, 0.85)})`;
      } else {
        mosaicContext.strokeStyle = warm
          ? `rgba(255, 190, 145, ${clamp(strength * 1.5, 0.26, 0.68)})`
          : `rgba(145, 175, 188, ${clamp(strength, 0.2, 0.45)})`;
      }
      mosaicContext.lineWidth = feature ? 1.1 : Math.max(1, minSize * 0.18);
      mosaicContext.beginPath();
      mosaicContext.moveTo(x - Math.cos(angle) * length / 2, y - Math.sin(angle) * length / 2);
      mosaicContext.lineTo(x + Math.cos(angle) * length / 2, y + Math.sin(angle) * length / 2);
      mosaicContext.stroke();
    }

    const edgeStep = minSize;
    for (let y = edgeStep; y < imageHeight - edgeStep; y += edgeStep) {
      for (let x = edgeStep; x < imageWidth - edgeStep; x += edgeStep) {
        if (!isFeature(x, y)) drawContour(x, y, edgeStep, false);
      }
    }
    const fineStep = Math.max(3, Math.round(minSize * 0.45));
    for (const [cx, cy, rx, ry] of featureZones) {
      const left = Math.max(fineStep, Math.floor((cx - rx) * imageWidth));
      const right = Math.min(imageWidth - fineStep, Math.ceil((cx + rx) * imageWidth));
      const top = Math.max(fineStep, Math.floor((cy - ry) * imageHeight));
      const bottom = Math.min(imageHeight - fineStep, Math.ceil((cy + ry) * imageHeight));
      for (let y = top; y < bottom; y += fineStep) {
        for (let x = left; x < right; x += fineStep) {
          if (isFeature(x, y)) drawContour(x, y, fineStep, true);
        }
      }
    }
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
    buildMosaic(pixels, sampleWidth, sampleHeight);

    count = compact
      ? Math.min(5500, Math.round(width * height / 85))
      : Math.min(15000, Math.round(width * height / 78));
    count = Math.max(compact ? 3200 : 7000, count);
    count = Math.max(compact ? 850 : 2400, count);
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
    pulseSpeeds = new Float32Array(count);
    lanes = new Uint8Array(count);
    toneIndex = new Uint8Array(count);
    alphaIndex = new Uint8Array(count);
    drawOrder = new Int32Array(count);
    drawCounts = new Int32Array(tones.length * ALPHA_LEVELS);
    drawStarts = new Int32Array(tones.length * ALPHA_LEVELS);

    const originX = compact ? (width - sampleWidth) / 2 : width * 0.46;
    const originY = compact ? Math.max(40, height * 0.05) : (height - sampleHeight) * 0.38;
    mosaicX = originX;
    mosaicY = originY;
    mosaicWidth = sampleWidth;
    mosaicHeight = sampleHeight;
    const centerX = originX + sampleWidth / 2;
    const centerY = originY + sampleHeight / 2;
    portraitCenterX = centerX;
    portraitCenterY = centerY;
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
      pulseSpeeds[index] = 1.35 + random() * 1.9;
      lanes[index] = (random() * 12) | 0;

      const warmBoost = clamp((red - blue - 4) / 75, 0, 1) * 0.34;
      const contrastLuminance = clamp((luminance - 0.02) * 1.52 + warmBoost + edge * 0.14, 0, 1);
      const selectedTone = clamp(
        Math.round(contrastLuminance * (tones.length - 1)),
        0,
        tones.length - 1
      );
      toneIndex[index] = selectedTone;
    }

    startedAt = performance.now();
    hero.classList.add('is-particle-ready');
  }

  function update(now) {
    const centerX = portraitCenterX;
    const centerY = portraitCenterY;
    const breath = breathScale(now);

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
    const settled = smootherstep(clamp((now - startedAt) / 4100, 0, 1));
    const breath = breathScale(now);
    ctx.save();
    ctx.globalAlpha = 0.84 * smootherstep(clamp((now - startedAt) / 2000, 0, 1));
    ctx.translate(portraitCenterX, portraitCenterY);
    ctx.scale(breath, breath);
    ctx.drawImage(mosaic, mosaicX - portraitCenterX, mosaicY - portraitCenterY, mosaicWidth, mosaicHeight);
    ctx.restore();
    drawCounts.fill(0);

    // Each dot pulses on its own phase. Quantized alpha buckets keep the
    // Canvas state changes bounded while letting settled parts of the face
    // fade in and out independently.
    for (let index = 0; index < count; index++) {
      const wave = (Math.sin(now * 0.001 * pulseSpeeds[index] + phases[index]) + 1) * 0.5;
      const pulse = 0.58 + wave * 0.42;
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
