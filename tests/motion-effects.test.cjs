const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

// Exercise the lifecycle without a GPU, CDN, or third-party test dependencies.
function setup({ reduced = false, fine = true, canvasAvailable = true } = {}) {
  class Target {
    constructor() { this.listeners = new Map(); }
    addEventListener(type, callback, options = {}) {
      const list = this.listeners.get(type) || new Set();
      list.add(callback);
      this.listeners.set(type, list);
      options.signal?.addEventListener('abort', () => list.delete(callback), { once: true });
    }
    emit(type, data = {}) { this.listeners.get(type)?.forEach(callback => callback(data)); }
  }
  const elements = [];
  let pointsDrawn = 0;
  const drawnPoints = [];
  class Element extends Target {
    constructor(tag) {
      super();
      this.tagName = tag;
      const classes = new Set();
      this.classList = {
        add: c => classes.add(c), remove: c => classes.delete(c), contains: c => classes.has(c),
        toggle: (c, enabled) => enabled ? classes.add(c) : classes.delete(c)
      };
      this.style = { setProperty() {}, removeProperty() {} };
    }
    setAttribute() {}
    closest(selector) { return selector.split(',').map(s => s.trim()).includes(this.tagName) ? this : null; }
    remove() { elements.splice(elements.indexOf(this), 1); }
    getContext() {
      if (!canvasAvailable) return null;
      return { setTransform() {}, clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {},
        fillRect(x, y) {
          assert.ok(Number.isFinite(x) && Number.isFinite(y));
          if (drawnPoints.length < 2) drawnPoints.push([x, y]);
          pointsDrawn++;
        } };
    }
  }
  const preferences = [Object.assign(new Target(), { matches: reduced }), Object.assign(new Target(), { matches: fine })];
  const document = Object.assign(new Target(), {
    hidden: false, documentElement: new Element('html'),
    body: { prepend: e => elements.push(e), append: (...e) => elements.push(...e) },
    createElement: tag => new Element(tag), querySelectorAll: () => []
  });
  const window = Object.assign(new Target(), { scrollY: 0 });
  const frames = new Map();
  let frameId = 0;
  const sandbox = { document, window, Element, AbortController,
    innerWidth: 1920, innerHeight: 1080, devicePixelRatio: 3,
    matchMedia: q => preferences[q.includes('reduced') ? 0 : 1],
    getComputedStyle: () => ({ getPropertyValue: () => '#bcff3b' }),
    requestAnimationFrame: fn => { frames.set(++frameId, fn); return frameId; },
    cancelAnimationFrame: id => frames.delete(id)
  };
  vm.runInNewContext(readFileSync(require.resolve('../assets/js/motion-effects.js'), 'utf8'), sandbox);
  return { document, window, elements, frames, preferences, Element,
    tick(time) { const scheduled = [...frames.values()]; frames.clear(); scheduled.forEach(fn => fn(time)); },
    scrollTo(y) { window.scrollY = y; window.emit('scroll'); },
    drawnPoints,
    get pointsDrawn() { return pointsDrawn; }
  };
}

test('reduced motion removes all layers and frames; repeated preference changes do not duplicate them', () => {
  const app = setup({ reduced: true });
  assert.equal(app.elements.length, 0);
  assert.equal(app.frames.size, 0);
  for (let i = 0; i < 3; i++) {
    app.preferences[0].matches = false;
    app.preferences[0].emit('change');
    assert.equal(app.elements.length, 3);
    assert.equal(app.frames.size, 1);
    app.preferences[0].matches = true;
    app.preferences[0].emit('change');
    assert.equal(app.elements.length, 0);
    assert.equal(app.frames.size, 0);
  }
});

test('touch has only the particle field, capped at 420 points and pixel ratio 1', () => {
  const app = setup({ fine: false });
  assert.equal(app.elements.length, 1);
  assert.equal(app.elements[0].width, 1920);
  app.tick(16); app.tick(50);
  assert.equal(app.pointsDrawn, 420);
});

test('hidden pages cancel animation and resume exactly one loop', () => {
  const app = setup();
  app.document.hidden = true;
  app.document.emit('visibilitychange');
  assert.equal(app.frames.size, 0);
  app.document.hidden = false;
  app.document.emit('visibilitychange');
  app.document.emit('visibilitychange');
  assert.equal(app.frames.size, 1);
  app.tick(100);
  assert.equal(app.frames.size, 1);
});

test('scroll changes particle phase and adds a damped directional impulse', () => {
  const app = setup({ fine: false });
  app.tick(16); app.tick(50);
  const before = app.drawnPoints[0];
  app.drawnPoints.length = 0;
  app.scrollTo(720);
  app.tick(66); app.tick(100);
  const after = app.drawnPoints[0];
  assert.notDeepEqual(after, before);
  assert.ok(Math.abs(after[1] - before[1]) > 1);
});

test('mouse activates cursor; keyboard and editable fields restore native pointer', () => {
  const app = setup();
  const event = { pointerType: 'mouse', clientX: 400, clientY: 300, target: new app.Element('a') };
  app.window.emit('pointermove', event);
  assert.ok(app.document.documentElement.classList.contains('has-motion-cursor'));
  const cursor = app.elements.find(e => e.className === 'motion-cursor');
  assert.ok(cursor.classList.contains('is-interactive'));
  for (let t = 16; t < 300; t += 16) app.tick(t);
  assert.match(cursor.style.transform, /400px, 300px/);
  app.window.emit('keydown', { key: 'Tab' });
  assert.ok(!app.document.documentElement.classList.contains('has-motion-cursor'));
  app.window.emit('pointermove', event);
  app.window.emit('pointermove', { ...event, target: new app.Element('input') });
  assert.ok(!app.document.documentElement.classList.contains('has-motion-cursor'));
});

test('unavailable Canvas leaves native UI untouched', () => {
  const app = setup({ canvasAvailable: false });
  assert.equal(app.elements.length, 0);
  assert.equal(app.frames.size, 0);
  assert.ok(!app.document.documentElement.classList.contains('has-motion-cursor'));
});
