const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.site-nav');

menuButton?.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Abrir menu' : 'Fechar menu');
  navigation?.classList.toggle('is-open', !isOpen);
});

navigation?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  navigation.classList.remove('is-open');
  menuButton?.setAttribute('aria-expanded', 'false');
  menuButton?.setAttribute('aria-label', 'Abrir menu');
}));

document.querySelector('#year').textContent = new Date().getFullYear();

// If the ERP dashboard capture is missing, try its invoice view before the visual fallback.
document.querySelectorAll('.project-image img[data-fallback]').forEach((image) => {
  image.addEventListener('error', () => {
    const wrapper = image.closest('.project-image');
    if (!image.dataset.fallbackTried) {
      image.dataset.fallbackTried = 'true';
      image.src = image.dataset.fallback;
      wrapper.href = image.dataset.fallback;
      return;
    }
    wrapper.classList.add('has-image-error');
    wrapper.removeAttribute('href');
  });
});

// Reveal content as it approaches the viewport, with an accessible no-motion fallback.
const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: .12 });
  revealItems.forEach((item) => {
    item.classList.add('reveal-pending');
    revealObserver.observe(item);
  });
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

// Hero scene: the Java GLB is the centerpiece, with lightweight orbit accents.
const canvas = document.querySelector('#hero-canvas');
const heroVisual = document.querySelector('.hero-visual');
const statusLabel = document.querySelector('#visual-status');
const rotationReadout = heroVisual?.querySelectorAll('.label-code b');
const modelUrl = new URL('../java_logo.glb', import.meta.url);
let sceneObserver;

async function mountHeroScene() {
  if (!canvas || canvas.dataset.loaded || !heroVisual) return;
  canvas.dataset.loaded = 'true';
  if (!('WebGLRenderingContext' in window)) {
    statusLabel.textContent = 'CSS FALLBACK';
    return;
  }

  try {
    const THREE = await import('three');
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: innerWidth > 650, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 650 ? 1.15 : 1.6));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, .1, 80);
    camera.position.set(0, .08, 5.25);
    const world = new THREE.Group();
    scene.add(world);

    const coffeeMark = new THREE.Group();
    world.add(coffeeMark);

    // Particles now live in the independent, pointer-reactive Canvas 2D field.
    const orbit = new THREE.Mesh(new THREE.TorusGeometry(1.8, .006, 4, 120), new THREE.MeshBasicMaterial({ color: 0x56b9cf, transparent: true, opacity: .38 }));
    orbit.rotation.set(1.18, .1, -.38);
    world.add(orbit);
    const orbitAccent = new THREE.Mesh(new THREE.TorusGeometry(2.14, .004, 4, 120), new THREE.MeshBasicMaterial({ color: 0xa9f842, transparent: true, opacity: .24 }));
    orbitAccent.rotation.set(.83, -.24, .58);
    world.add(orbitAccent);
    scene.add(new THREE.HemisphereLight(0xe2faff, 0x14283b, 1.65));
    const keyLight = new THREE.DirectionalLight(0xd6f8ff, 2.2);
    keyLight.position.set(-2, 3, 4);
    scene.add(keyLight);
    const warmLight = new THREE.PointLight(0xffa14d, 1.25, 5);
    warmLight.position.set(1.5, 1.8, 2.5);
    scene.add(warmLight);

    let importedModel = null;
    let mixer = null;
    statusLabel.textContent = 'GLB MODEL · LOADING';

    async function loadJavaModel() {
      try {
        const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
        const gltf = await new GLTFLoader().loadAsync(modelUrl.href);
        const nextModel = gltf.scene;
        const bounds = new THREE.Box3().setFromObject(nextModel);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        const scale = 2.65 / Math.max(size.y, size.x, size.z, .001);
        nextModel.scale.setScalar(scale);
        nextModel.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
        coffeeMark.add(nextModel);
        importedModel = nextModel;
        if (gltf.animations.length) {
          mixer = new THREE.AnimationMixer(nextModel);
          gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
        }
        statusLabel.textContent = 'JAVA MODEL · READY';
      } catch {
        statusLabel.textContent = 'GLB MODEL · UNAVAILABLE';
      }
    }

    const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
    let reducedMotion = motionPreference.matches;
    let inView = true;
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const updatePointer = (event) => {
      const bounds = heroVisual.getBoundingClientRect();
      pointer.targetX = ((event.clientX - bounds.left) / bounds.width - .5) * .48;
      pointer.targetY = ((event.clientY - bounds.top) / bounds.height - .5) * .35;
      if (rotationReadout?.length === 2) {
        rotationReadout[0].textContent = `${pointer.targetX >= 0 ? '+' : ''}${pointer.targetX.toFixed(2)}`;
        rotationReadout[1].textContent = `${pointer.targetY >= 0 ? '+' : ''}${pointer.targetY.toFixed(2)}`;
      }
    };
    heroVisual.addEventListener('pointermove', updatePointer, { passive: true });
    heroVisual.addEventListener('pointerleave', () => { pointer.targetX = 0; pointer.targetY = 0; }, { passive: true });
    const resize = () => {
      const { width, height } = heroVisual.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      if (reducedMotion) renderer.render(scene, camera);
    };
    new ResizeObserver(resize).observe(heroVisual);
    resize();

    let elapsed = 0;
    let lastTime = 0;
    let frameId = null;
    const render = (now = performance.now()) => {
      frameId = null;
      if (document.hidden || !inView) return;
      const delta = lastTime ? Math.min((now - lastTime) / 1000, .05) : 0;
      lastTime = now;
      if (!reducedMotion) elapsed += delta;
      if (!reducedMotion) {
        pointer.x += (pointer.targetX - pointer.x) * .035;
        pointer.y += (pointer.targetY - pointer.y) * .035;
        world.rotation.y = elapsed * .045 + pointer.x * .23;
        world.rotation.x = pointer.y * .17;
        coffeeMark.rotation.y = -world.rotation.y * .55;
        coffeeMark.rotation.x = -world.rotation.x * .45;
        if (importedModel) importedModel.position.y += (Math.sin(elapsed * .8) * .035 - importedModel.position.y) * .025;
        if (mixer) mixer.update(delta);
        orbit.rotation.z += .021 * delta;
        orbitAccent.rotation.z -= .0132 * delta;
      }
      renderer.render(scene, camera);
      if (!reducedMotion && !document.hidden) frameId = requestAnimationFrame(render);
    };
    canvas.classList.add('is-ready');
    render();
    loadJavaModel();
    const syncPlayback = () => {
      if (frameId !== null) cancelAnimationFrame(frameId);
      frameId = null;
      lastTime = 0;
      if (!document.hidden && inView) render();
    };
    document.addEventListener('visibilitychange', syncPlayback);
    motionPreference.addEventListener('change', () => {
      reducedMotion = motionPreference.matches;
      syncPlayback();
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting;
        syncPlayback();
      }).observe(heroVisual);
    }
    sceneObserver?.disconnect();
  } catch (error) {
    statusLabel.textContent = 'CSS FALLBACK';
    console.info('3D hero unavailable; keeping the lightweight visual fallback.', error);
  }
}

if ('IntersectionObserver' in window && heroVisual) {
  sceneObserver = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) mountHeroScene();
  }, { rootMargin: '150px' });
  sceneObserver.observe(heroVisual);
} else {
  mountHeroScene();
}
