// Original fluid-motion treatment inspired by landonorris.com.
// Canvas 2D keeps these effects independent of Three.js and its CDN.
const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
const pointerQuery = matchMedia('(hover: hover) and (pointer: fine)');
let disposeEffects = () => {};

function mountEffects() {
  const controller = new AbortController();
  const options = { passive: true, signal: controller.signal };
  const field = document.createElement('canvas');
  field.className = 'particle-field';
  field.setAttribute('aria-hidden', 'true');
  const context = field.getContext('2d', { alpha: true });
  if (!context) return () => {};
  document.body.prepend(field);

  const finePointer = pointerQuery.matches;
  const trail = finePointer ? document.createElement('canvas') : null;
  const ink = trail?.getContext('2d', { alpha: true });
  const cursor = finePointer ? document.createElement('div') : null;
  if (trail && ink && cursor) {
    trail.className = 'cursor-trail';
    cursor.className = 'motion-cursor';
    trail.setAttribute('aria-hidden', 'true');
    cursor.setAttribute('aria-hidden', 'true');
    document.body.append(trail, cursor);
  }

  let width = 0;
  let height = 0;
  let particles = [];
  let frame = null;
  let previousTime = 0;
  let fieldTime = 0;
  let elapsed = 0;
  let pointerActive = false;
  let interactive = false;
  let cursorScale = 1;
  const scrollMotion = {
    target: window.scrollY || 0,
    current: window.scrollY || 0,
    last: window.scrollY || 0,
    impulse: 0
  };
  const pointer = { x: -1000, y: -1000 };
  const head = { x: -1000, y: -1000 };
  const tail = [];
  const root = document.documentElement;
  const accent = getComputedStyle(root).getPropertyValue('--lime').trim() || '#bcff3b';

  function resize() {
    width = innerWidth;
    height = innerHeight;
    const ratio = Math.min(devicePixelRatio || 1, finePointer ? 1.5 : 1);
    for (const [canvas, ctx] of [[field, context], [trail, ink]]) {
      if (!canvas || !ctx) continue;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    // Fixed maximum cost, with fewer points on small/touch devices.
    const count = Math.min(finePointer ? 1100 : 420, Math.round(width * height / 1150));
    particles = Array.from({ length: count }, (_, index) => ({
      u: Math.random(), lane: Math.random(), band: index % 3,
      size: .6 + Math.random() * 1.1, alpha: .16 + Math.random() * .42,
      depth: .45 + Math.random() * .9,
      offsetX: 0, offsetY: 0, vx: 0, vy: 0
    }));
    tail.length = 0;
  }

  function hidePointer() {
    pointerActive = false;
    cursor?.classList.remove('is-visible');
    root.classList.remove('has-motion-cursor');
  }

  function updatePointer(event) {
    if (event.pointerType !== 'mouse' || !finePointer || !ink) return;
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest('input, textarea, select, [contenteditable], iframe')) {
      hidePointer();
      return;
    }
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    if (!pointerActive) {
      head.x = pointer.x;
      head.y = pointer.y;
      tail.length = 0;
    }
    pointerActive = true;
    interactive = Boolean(target?.closest('a, button, [role="button"]'));
    cursor.classList.toggle('is-interactive', interactive);
    cursor.classList.add('is-visible');
    root.classList.add('has-motion-cursor');
  }

  function updateScroll() {
    const next = window.scrollY || 0;
    const change = Math.max(-140, Math.min(140, next - scrollMotion.last));
    scrollMotion.target = next;
    scrollMotion.last = next;
    scrollMotion.impulse += change * .22;
  }

  function drawField(delta) {
    context.clearRect(0, 0, width, height);
    context.fillStyle = accent;
    const radius = finePointer ? 145 : 0;
    const scrollPages = scrollMotion.current / Math.max(height, 1);
    const time = elapsed * .00007 + scrollPages * .72;
    const spring = delta / 16.667;
    const friction = Math.pow(.86, spring);
    for (const point of particles) {
      const u = (point.u + time * (.03 + point.band * .012)) % 1;
      const x = u * (width + 100) - 50;
      // Three ribbons form a flowing, layered field, not a connecting-line mesh.
      const wave = Math.sin(u * 5.6 + time * 1.35 + point.band * 1.9);
      const y = height * (.2 + point.band * .3) + wave * height * .13
        + Math.cos(u * 10 - time * .7 + point.band) * 22
        + (point.lane - .5) * (35 + 65 * (wave + 1))
        + Math.sin(scrollPages * 2.4 + point.lane * 6.28) * height * .055 * point.depth
        - scrollMotion.impulse * point.depth;
      if (pointerActive) {
        const dx = x + point.offsetX - pointer.x;
        const dy = y + point.offsetY - pointer.y;
        const distance = Math.hypot(dx, dy);
        if (distance < radius && distance > .1) {
          const force = (1 - distance / radius) * 1.6 * spring;
          point.vx += (dx / distance - dy / distance * .45) * force;
          point.vy += (dy / distance + dx / distance * .45) * force;
        }
      }
      point.vx = (point.vx - point.offsetX * .015 * spring) * friction;
      point.vy = (point.vy - point.offsetY * .015 * spring) * friction;
      point.offsetX += point.vx * spring;
      point.offsetY += point.vy * spring;
      // Fade near the edges and behind the text-heavy left half.
      context.globalAlpha = point.alpha * Math.sin(u * Math.PI) * (.38 + u * .62);
      context.fillRect(x + point.offsetX, y + point.offsetY, point.size, point.size);
    }
    context.globalAlpha = 1;
  }

  function drawCursor(now, delta) {
    if (!ink || !cursor) return;
    ink.clearRect(0, 0, width, height);
    const follow = 1 - Math.exp(-delta / 42);
    if (pointerActive) {
      head.x += (pointer.x - head.x) * follow;
      head.y += (pointer.y - head.y) * follow;
      cursorScale += ((interactive ? 3.4 : 1) - cursorScale) * follow;
      // The exact hit position stays clear while the ink follows with inertia.
      cursor.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) scale(${cursorScale})`;
      const last = tail[tail.length - 1];
      if (!last || Math.hypot(head.x - last.x, head.y - last.y) > 1.2) {
        tail.push({ x: head.x, y: head.y, born: now });
      }
    }
    while (tail.length && (now - tail[0].born > 460 || tail.length > 36)) tail.shift();
    ink.strokeStyle = accent;
    ink.lineCap = 'round';
    ink.lineJoin = 'round';
    for (let i = 1; i < tail.length; i += 1) {
      const a = tail[i - 1];
      const b = tail[i];
      const life = Math.max(0, 1 - (now - b.born) / 460);
      const taper = i / tail.length;
      ink.globalAlpha = life * (interactive ? .12 : .25);
      ink.lineWidth = Math.max(.5, 17 * life * taper);
      ink.beginPath();
      ink.moveTo(a.x, a.y);
      ink.lineTo(b.x, b.y);
      ink.stroke();
    }
    ink.globalAlpha = 1;
  }

  function render(now) {
    frame = null;
    if (document.hidden) return;
    const delta = previousTime ? Math.min(now - previousTime, 40) : 16.667;
    previousTime = now;
    elapsed += delta;
    const scrollFollow = 1 - Math.exp(-delta / 115);
    scrollMotion.current += (scrollMotion.target - scrollMotion.current) * scrollFollow;
    scrollMotion.impulse *= Math.exp(-delta / 175);
    fieldTime += delta;
    // Background at 30fps; pointer follows the display refresh rate.
    if (fieldTime >= 1000 / 30) {
      drawField(Math.min(fieldTime, 50));
      fieldTime = 0;
    }
    drawCursor(now, delta);
    frame = requestAnimationFrame(render);
  }

  function resume() {
    previousTime = 0;
    if (frame === null && !document.hidden) frame = requestAnimationFrame(render);
  }
  function pause() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    hidePointer();
    tail.length = 0;
    ink?.clearRect(0, 0, width, height);
  }

  window.addEventListener('resize', resize, options);
  window.addEventListener('pointermove', updatePointer, options);
  window.addEventListener('scroll', updateScroll, options);
  document.documentElement.addEventListener('pointerleave', hidePointer, options);
  window.addEventListener('blur', hidePointer, options);
  window.addEventListener('keydown', (event) => { if (event.key === 'Tab') hidePointer(); }, options);
  document.addEventListener('visibilitychange', () => document.hidden ? pause() : resume(), options);
  window.addEventListener('pagehide', pause, options);
  window.addEventListener('pageshow', resume, options);
  const cards = finePointer ? [...document.querySelectorAll('.project-card')] : [];
  const resetCard = (card) => {
    card.style.removeProperty('--tilt-x');
    card.style.removeProperty('--tilt-y');
  };
  cards.forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'mouse') return;
      const bounds = card.getBoundingClientRect();
      card.style.setProperty('--tilt-x', `${((event.clientX - bounds.left) / bounds.width - .5) * 3}deg`);
      card.style.setProperty('--tilt-y', `${-((event.clientY - bounds.top) / bounds.height - .5) * 3}deg`);
    }, options);
    card.addEventListener('pointerleave', () => resetCard(card), options);
  });
  resize();
  resume();

  return () => {
    pause();
    controller.abort();
    cards.forEach(resetCard);
    field.remove();
    trail?.remove();
    cursor?.remove();
  };
}

function syncEffects() {
  disposeEffects();
  disposeEffects = motionQuery.matches ? () => {} : mountEffects();
}

motionQuery.addEventListener('change', syncEffects);
pointerQuery.addEventListener('change', syncEffects);
syncEffects();
