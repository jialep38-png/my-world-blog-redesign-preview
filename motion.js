/* An isolated design prototype. Production content and routes remain in Astro. */
(() => {
  'use strict';
  const $ = (s, scope = document) => scope.querySelector(s);
  const $$ = (s, scope = document) => Array.from(scope.querySelectorAll(s));
  const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
  const mix = (a, b, n) => a + (b - a) * n;
  const smooth = n => { n = clamp(n); return n * n * (3 - 2 * n); };
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const wide = matchMedia('(min-width: 801px)');
  const fine = matchMedia('(pointer: fine)');
  const root = document.documentElement;
  const body = document.body;
  const pages = $$('[data-page]');
  const wipe = $('.page-wipe');
  const intro = $('.intro');
  const menu = $('#site-menu');
  const menuButton = $('.menu-toggle');
  const journey = $('.journey');
  const track = $('.journey-track');
  const chapters = $$('.chapter');
  const marker = $('.index-marker');
  const bridge = $('.bridge');
  const cloud = $('.constellation');
  const canvas = $('#particle-field');
  const ctx = canvas.getContext('2d');
  let current = 'home';
  let activeChapter = -1;
  let switching = false;
  let queuedRoute = null;
  let previousY = -1;
  let needsPaint = true;
  let cloudVisible = false;
  let stopped = false;
  let frameId = 0;
  let lastFrame = 0;
  let cloudProgress = 0;
  let metrics = {};
  const titles = {home:'首页',essay:'随笔',projects:'项目',planets:'小星球',about:'关于',reading:'把博客重新接上线'};
  const planets = [
    ['yesterday-today','昨天，今天','YESTERDAY, TODAY','想靠近的距离，也被温柔地保存。'],
    ['crossover','删了一百遍','DELETED A HUNDRED TIMES','删去的瞬间，在下一张里回来。'],
    ['poem','思念若是一首诗','IF LONGING WERE A POEM','水流了很远，那一页还没说完。'],
    ['rain-finale','雨终曲','RAIN FINALE','终曲被按停，记忆仍在雨里。'],
    ['jielan','芥兰','JIE LAN','绕着日常，慢慢看一圈。']
  ];
  const asset = slug => `assets/planets/${slug}/cover.webp`;
  $$('[data-gallery]').forEach(gallery => {
    planets.forEach(([slug,name,en,thought],index) => {
      const a = document.createElement('a');
      a.className = 'gallery-item';
      a.href = `https://2006038.xyz/planets/${slug}/`;
      a.innerHTML = `<span class="gallery-number">0${index + 1}</span><div class="image-wrap"><img src="${asset(slug)}" width="1600" height="1600" loading="lazy" alt="${name}小星球"></div><h3>${name}</h3><span class="eyebrow">${en} ↗</span>${gallery.dataset.gallery === 'full' ? `<p>${thought}</p>` : ''}`;
      gallery.append(a);
    });
  });
  $$('.page-wipe span').forEach((column,i) => column.style.setProperty('--i',i));

  function closeMenu(returnFocus = false) {
    menu.hidden = true;
    menuButton.setAttribute('aria-expanded','false');
    if (returnFocus) menuButton.focus();
  }
  menuButton.addEventListener('click', () => {
    const open = menu.hidden;
    menu.hidden = !open;
    menuButton.setAttribute('aria-expanded',String(open));
    if (open) $('a',menu).focus();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !menu.hidden) closeMenu(true);
    if (e.key === 'Tab' && !menu.hidden) {
      const items = [menuButton,...$$('a',menu)];
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  document.addEventListener('pointerdown',e => {
    if (!menu.hidden && !menu.contains(e.target) && !menuButton.contains(e.target)) closeMenu();
  });

  function routeName() {
    const name = location.hash.replace(/^#\//,'');
    return Object.hasOwn(titles,name) ? name : null;
  }
  function setView(name) {
    current = name;
    if (name === 'home') $('.hero').classList.remove('loaded');
    pages.forEach(p => { p.hidden = p.dataset.page !== name; });
    body.dataset.view = name;
    document.title = `${titles[name]} · 霁风的小圈 — 设计预览`;
    $$('[data-route]').forEach(a => {
      if (a.dataset.route === (name === 'reading' ? 'essay' : name)) a.setAttribute('aria-current','page');
      else a.removeAttribute('aria-current');
    });
    window.scrollTo({top:0,behavior:'instant'});
    measure();
    $('#route-status').textContent = `已切换到${titles[name]}`;
  }
  async function navigate(name) {
    if (switching) { queuedRoute = name; return; }
    if (current === name) { closeMenu(); return; }
    switching = true;
    closeMenu();
    $$('.trail-image').forEach(i=>i.remove());
    try {
      if (!reduced.matches) {
        wipe.className = 'page-wipe covering';
        await delay(620);
      }
      setView(name);
      if (!reduced.matches) {
        wipe.className = 'page-wipe uncovering';
        await delay(670);
      }
      $('#main-content').focus({preventScroll:true});
    } finally {
      wipe.className = 'page-wipe';
      switching = false;
      if (queuedRoute && queuedRoute !== current) {
        const next = queuedRoute; queuedRoute = null; navigate(next);
      } else queuedRoute = null;
    }
  }
  window.addEventListener('hashchange',() => { const name = routeName(); if (name) navigate(name); });
  document.addEventListener('click',e => {
    const link = e.target.closest('a[href^="#/"]');
    if (link && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
      if (link.hash === location.hash) { e.preventDefault(); closeMenu(); window.scrollTo({top:0,behavior:reduced.matches?'instant':'smooth'}); }
      else closeMenu();
    }
  });

  let introBusy = false;
  async function playIntro() {
    if (introBusy || switching) return;
    introBusy = true;
    if (reduced.matches) { introBusy = false; return; }
    intro.hidden = false;
    intro.classList.remove('leaving');
    try {
      const ready = Promise.all([
        $('.hero-art img').decode().catch(()=>{}),
        document.fonts.ready.catch(()=>{})
      ]);
      await Promise.all([Promise.race([ready,delay(2200)]),delay(850)]);
      intro.classList.add('leaving');
      if (current === 'home') {
        $('.hero').classList.remove('loaded');
        requestAnimationFrame(()=>{
          $('.hero').classList.add('loaded');
          setTimeout(()=>$('.hero').classList.remove('loaded'),1500);
        });
      }
      await delay(720);
    } finally {
      intro.hidden = true;
      intro.classList.remove('leaving');
      introBusy = false;
    }
  }
  $('#replay-intro').addEventListener('click',playIntro);

  function measure() {
    const motion = wide.matches && !reduced.matches;
    root.classList.toggle('motion-ready',motion);
    const top = el => el.getBoundingClientRect().top + scrollY;
    const h = window.innerHeight, w = document.documentElement.clientWidth;
    metrics = {
      w,h,motion,
      journeyTop:current === 'home' ? top(journey) : 0,
      journeyRange:Math.max(1,journey.offsetHeight - h),
      bridgeTop:current === 'home' ? top(bridge) : 0,
      bridgeRange:Math.max(1,bridge.offsetHeight - h),
      cloudTop:current === 'home' ? top(cloud) : 0,
      cloudRange:Math.max(1,cloud.offsetHeight - h),
      canvasW:$('.constellation-sticky').clientWidth || w,
      canvasH:$('.constellation-sticky').clientHeight || h
    };
    const dpr = Math.min(devicePixelRatio || 1,1.5);
    canvas.width = Math.round(metrics.canvasW * dpr);
    canvas.height = Math.round(metrics.canvasH * dpr);
    if (ctx) ctx.setTransform(dpr,0,0,dpr,0,0);
    delete canvas.dataset.staticDrawn;
    if (!motion) {
      track.style.transform = '';
      chapters.forEach(p=>{p.inert=false;p.removeAttribute('aria-hidden');});
    }
    activeChapter = -1;
    needsPaint = true;
  }
  window.addEventListener('resize',measure,{passive:true});
  wide.addEventListener('change',measure);
  reduced.addEventListener('change',()=>{ intro.hidden = true; measure(); });
  document.fonts.ready.then(measure);

  $$('[data-chapter]').forEach(button => button.addEventListener('click',()=>{
    const index = Number(button.dataset.chapter);
    window.scrollTo({top:metrics.journeyTop + metrics.journeyRange * index / 2,behavior:reduced.matches?'instant':'smooth'});
  }));
  $('[data-start-journey]').addEventListener('click',e=>{
    e.preventDefault();
    window.scrollTo({top:metrics.journeyTop,behavior:reduced.matches?'instant':'smooth'});
  });

  const svg = $('.thread-field');
  const threads = [];
  for (let i = 0; i < 36; i++) {
    const path = document.createElementNS('http://www.w3.org/2000/svg','path');
    svg.append(path); threads.push(path);
  }
  function paintBridge(p) {
    const gather = smooth((p - .02) / .76);
    const fill = smooth((p - .33) / .53);
    $('.bridge-color').style.transform = `translateY(${100 * (1 - fill)}%)`;
    $('.bridge-copy').style.color = fill > .56 ? 'var(--paper)' : 'var(--ink)';
    $('.bridge-copy').style.opacity = String(1 - smooth((p - .77) / .23));
    $('.bridge-node').style.transform = `translate(-50%,-50%) rotate(${p * 90}deg) scale(${1 + smooth((p-.78)/.22)*3})`;
    threads.forEach((path,i)=>{
      const side = i % 2 ? 1 : -1;
      const x = side < 0 ? -100 : 1540;
      const y = -200 + Math.floor(i / 2) * 65;
      const endX = mix(side < 0 ? 1540 : -100,720,gather);
      const endY = mix(y + 180,670,gather);
      const c1x = 720 + side * (500 - gather * 120);
      const c1y = y + 250;
      const c2x = 720 - side * (480 - gather * 480);
      const c2y = mix(y - 150,670,gather);
      path.setAttribute('d',`M ${x} ${y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${endX} ${endY}`);
    });
  }
  let seed = 20260927;
  function random() { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 4294967296; }
  const points = Array.from({length:9000},()=>({a:random()*Math.PI*2,b:random()*Math.PI*2,r:random(),x:random(),y:random(),size:.8+random()*1.3,shade:random()}));
  function paintCloud(time) {
    if (!ctx) return;
    const w = metrics.canvasW, h = metrics.canvasH;
    ctx.clearRect(0,0,w,h);
    const p = reduced.matches ? .95 : cloudProgress;
    const spread = Math.pow(Math.sin(Math.PI * clamp(p)),2);
    const mobile = !wide.matches;
    const cx = w * (mobile ? .56 : .69), cy = h * (mobile ? .66 : .52);
    const radius = Math.min(w * (mobile ? .53 : .29),h * .54);
    const t = reduced.matches ? .8 : time * .000075;
    const count = mobile ? 1800 : points.length;
    for (let i = 0; i < count; i++) {
      const point = points[i];
      const a = point.a + t;
      const band = radius * (.83 + .18 * Math.cos(point.b) + .085 * point.r);
      const tx = cx + Math.cos(a) * band + Math.sin(point.b) * radius * .1;
      const ty = cy + Math.sin(a) * band * .6 + Math.cos(point.b) * radius * .2;
      const drift = reduced.matches ? 0 : Math.sin(time * .00035 + point.b) * 9;
      const x = mix(tx,(point.x * 1.14 - .07) * w,spread) + drift * spread;
      const y = mix(ty,(point.y * 1.12 - .06) * h,spread);
      let alpha = .36 + point.r * .60;
      if (x < w * (mobile ? .9 : .48) && y < h * (mobile ? .58 : .77) && y > h * .25) alpha *= .15;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = point.shade > .91 ? '#ed512f' : point.shade > .72 ? '#b68b96' : '#eee4d8';
      const size = point.size * (mobile ? .85 : 1);
      ctx.fillRect(x,y,size,size);
    }
    ctx.globalAlpha = 1;
  }
  new IntersectionObserver(entries=>{cloudVisible=entries[0].isIntersecting;needsPaint=true;},{rootMargin:'120px'}).observe(cloud);

  function paintScroll() {
    const y = scrollY;
    if (current === 'home') {
      if (metrics.motion) {
        const progress = clamp((y - metrics.journeyTop) / metrics.journeyRange);
        track.style.transform = `translate3d(${-progress * (200 / 3)}%,0,0)`;
        $('.journey-rail span').style.transform = `scaleX(${progress})`;
        $('.journey-rail i').style.left = `calc(${progress * 100}% - ${progress * 9}px)`;
        const next = Math.round(progress * 2);
        if (next !== activeChapter) {
          activeChapter = next;
          marker.style.transform = `translateY(${next * 52}px)`;
          marker.classList.remove('moving');
          requestAnimationFrame(()=>marker.classList.add('moving'));
          $$('[data-chapter]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.chapter)===next)));
          chapters.forEach((panel,i)=>{panel.inert=i!==next;panel.setAttribute('aria-hidden',String(i!==next));});
        }
      }
      const b = clamp((y - metrics.bridgeTop + metrics.h * .3)/(metrics.bridgeRange + metrics.h*.3));
      paintBridge(reduced.matches ? 1 : b);
      cloudProgress = clamp((y - metrics.cloudTop) / metrics.cloudRange);
      const spread = Math.sin(cloudProgress * Math.PI);
      $('[data-particle-label]').textContent = spread > .65 ? '散开，漫游' : '聚成一个小圈';
    } else if (current === 'reading') {
      const total = Math.max(1,document.documentElement.scrollHeight - metrics.h);
      $('.reading-progress i').style.transform = `scaleX(${clamp(y / total)})`;
    }
    previousY = y;
    needsPaint = false;
  }
  function frame(time) {
    if (stopped) return;
    if (time - lastFrame > 30) {
      if (previousY !== scrollY || needsPaint) paintScroll();
      if (current === 'home' && cloudVisible) {
        if (!reduced.matches || previousY !== scrollY || needsPaint) paintCloud(time);
        else if (!canvas.dataset.staticDrawn) {paintCloud(time);canvas.dataset.staticDrawn='true';}
      }
      lastFrame = time;
    }
    frameId = requestAnimationFrame(frame);
  }
  document.addEventListener('visibilitychange',()=>{
    stopped=document.hidden;
    if(stopped)cancelAnimationFrame(frameId);
    else{needsPaint=true;frameId=requestAnimationFrame(frame);}
  });

  let pointer = {x:0,y:0,time:0,index:0};
  document.addEventListener('pointermove',e=>{
    if (!fine.matches || !wide.matches || reduced.matches || switching || !menu.hidden) return;
    const zone = e.target.closest('.trail-zone');
    if (!zone || e.target.closest('.quiet,a,button,nav,p,h1,h2,h3,figure,.hero-kicker,.hero-bottom,.footer-label,.footer-bottom')) {
      $$('.trail-image').forEach(image=>image.remove());
      return;
    }
    const now = performance.now();
    if (Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y)<90 || now-pointer.time<110) return;
    pointer = {x:e.clientX,y:e.clientY,time:now,index:pointer.index+1};
    const image = document.createElement('img');
    image.className='trail-image'; image.alt=''; image.setAttribute('aria-hidden','true');
    image.src=asset(planets[pointer.index % planets.length][0]);
    image.style.left=`${e.clientX}px`;image.style.top=`${e.clientY}px`;
    image.style.setProperty('--tilt',`${(pointer.index % 5 - 2)*7}deg`);
    body.append(image);
    while($$('.trail-image').length>6)$('.trail-image').remove();
    image.addEventListener('animationend',()=>image.remove(),{once:true});
  },{passive:true});

  setView(routeName() || 'home');
  measure();
  frameId=requestAnimationFrame(frame);
  let seen=false;
  try {seen=sessionStorage.getItem('jifeng-proposal-opened')==='yes';sessionStorage.setItem('jifeng-proposal-opened','yes');} catch {}
  if (!seen && current==='home' && !reduced.matches) playIntro();
})();
