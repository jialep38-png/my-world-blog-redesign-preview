/* ============================================================
   follow-art motion.js — replication of the runtime behaviour
   - Lenis-style smooth scroll (optional, dependency-free)
   - sticky-layer parallax offset (the diagonal drift)
   - IntersectionObserver reveal driver
   - loading screen sequence

   No dependencies. ES module. ~4KB.
   ============================================================ */

/* ------------------------------------------------------------
   1. SMOOTH SCROLL (Lenis-compatible surface, no dependency)
      Mirrors the original class hooks so CSS keeps working:
      html.lenis, .lenis-smooth, .lenis-stopped
   ------------------------------------------------------------ */
export function createSmoothScroll({ lerp = 0.1, wheelMultiplier = 1 } = {}) {
  const root = document.documentElement;
  root.classList.add('lenis', 'lenis-smooth');

  let current = window.scrollY;
  let target = window.scrollY;
  let rafId = null;
  let stopped = false;

  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  const limit = () => document.body.scrollHeight - window.innerHeight;

  function onWheel(e) {
    if (stopped) return;
    target = clamp(target + e.deltaY * wheelMultiplier, 0, limit());
    e.preventDefault();
    start();
  }

  function tick() {
    current += (target - current) * lerp;
    if (Math.abs(target - current) < 0.05) {
      current = target;
      window.scrollTo(0, current);
      rafId = null;
      return;
    }
    window.scrollTo(0, current);
    rafId = requestAnimationFrame(tick);
  }

  function start() {
    if (rafId == null) rafId = requestAnimationFrame(tick);
  }

  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('scroll', () => {
    if (rafId == null) { current = target = window.scrollY; }
  }, { passive: true });

  return {
    stop() { stopped = true; root.classList.add('lenis-stopped'); },
    start2() { stopped = false; root.classList.remove('lenis-stopped'); },
    scrollTo(y, opts = {}) { target = clamp(y, 0, limit()); current = opts.immediate ? target : current; start(); },
    destroy() { window.removeEventListener('wheel', onWheel); if (rafId) cancelAnimationFrame(rafId); }
  };
}

/* ------------------------------------------------------------
   2. STICKY-LAYER DRIFT
      Reproduces the injected inline transform seen live:
        top: -75.67px; transform: translateX(8.611%) rotate(15deg)
      Each sticky layer rotates/translates a little as its section
      is scrolled through, producing the "deck of cards" depth.
   ------------------------------------------------------------ */
export function initLayerDrift({
  selector = '.section__layer--sticky',
  maxShift = 90,          // px of vertical travel
  translateX = 8.611,     // % — matches live site
  rotate = 15             // deg — matches live site
} = {}) {
  const layers = [...document.querySelectorAll(selector)].map(el => ({
    el,
    section: el.closest('.section') || el.parentElement
  }));

  let ticking = false;

  function update() {
    const vh = window.innerHeight;
    for (const { el, section } of layers) {
      const rect = section.getBoundingClientRect();
      // 0 when the section top is at viewport bottom, 1 when it reaches the top
      const p = Math.min(Math.max(1 - rect.top / vh, 0), 1);
      // ease so motion settles rather than tracking linearly
      const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;

      const shift = Math.sin(Math.PI * e) * maxShift * 0.5;
      el.style.top = `${shift.toFixed(2)}px`;

      if (el.classList.contains('section__layer--offset')) {
        const k = Math.sin(Math.PI * e);
        el.style.transform =
          `translateX(${(translateX * k).toFixed(3)}%) rotate(${(rotate * k).toFixed(3)}deg)`;
        el.style.transformOrigin = '0% 0%';
      }
    }
    ticking = false;
  }

  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();

  return { update, destroy() { window.removeEventListener('scroll', onScroll); } };
}

/* ------------------------------------------------------------
   3. REVEAL DRIVER
      Adds .is-revealed on the section currently owning the
      viewport, which fires every CSS transition in motion.css.
   ------------------------------------------------------------ */
export function initReveals({
  selector = '[data-reveal]',
  threshold = 0.25,
  once = true
} = {}) {
  const nodes = [...document.querySelectorAll(selector)];
  if (!nodes.length) return { destroy() {} };

  const seen = new WeakSet();

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        seen.add(entry.target);
        if (once) io.unobserve(entry.target);
      } else if (!once && !seen.has(entry.target)) {
        entry.target.classList.remove('is-revealed');
      }
    }
  }, { threshold, rootMargin: '0px 0px -10% 0px' });

  nodes.forEach(n => io.observe(n));
  return { destroy() { io.disconnect(); } };
}

/* ------------------------------------------------------------
   4. UNDERLINE SWEEP on hover
      .underline elements fill from the left via clip-path.
   ------------------------------------------------------------ */
export function initUnderlines(selector = '.underline') {
  const nodes = [...document.querySelectorAll(selector)];
  for (const el of nodes) {
    const parentLink = el.closest('a, button') || el;
    parentLink.addEventListener('mouseenter', () => el.classList.add('is-shown'));
    parentLink.addEventListener('mouseleave', () => el.classList.remove('is-shown'));
    parentLink.addEventListener('focus', () => el.classList.add('is-shown'));
    parentLink.addEventListener('blur', () => el.classList.remove('is-shown'));
  }
  return { count: nodes.length };
}

/* ------------------------------------------------------------
   5. LOADING SCREEN
      Holds the overlay for one full pulse cycle, then reveals.
   ------------------------------------------------------------ */
export function initLoadingScreen(selector = '.loading-screen', holdMs = 1600) {
  const el = document.querySelector(selector);
  if (!el) return { done: Promise.resolve() };

  const done = new Promise(resolve => {
    const finish = () => {
      el.classList.add('is-done');
      document.querySelectorAll('#opening [data-reveal], #site-header').forEach(n => n.classList.add('is-revealed'));
      setTimeout(() => { el.style.display = 'none'; resolve(); }, 400);
    };
    const started = performance.now();
    const wait = () => {
      const left = holdMs - (performance.now() - started);
      if (left > 0) setTimeout(wait, left);
      else requestAnimationFrame(finish);
    };
    if (document.readyState === 'complete') wait();
    else window.addEventListener('load', wait, { once: true });
  });

  return { done };
}

/* ------------------------------------------------------------
   6. BOOTSTRAP — call once from your app
   ------------------------------------------------------------ */
export function bootFollowArtMotion({ smoothScroll = true } = {}) {
  const instances = [];
  const loading = initLoadingScreen();

  loading.done.then(() => {
    instances.push(initLayerDrift());
    instances.push(initReveals());
    initUnderlines();
  });

  if (smoothScroll) {
    // only enable on fine-pointer devices; touch scrolling is already native-smooth
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      createSmoothScroll({ lerp: 0.1 });
    }
  }

  return { loading, instances, destroy() { instances.forEach(i => i.destroy && i.destroy()); } };
}
