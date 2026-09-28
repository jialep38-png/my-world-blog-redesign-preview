/* Shared navigation and deliberately limited motion for the independent study. */
(() => {
  'use strict';
  const $=(s,scope=document)=>scope.querySelector(s), $$=(s,scope=document)=>Array.from(scope.querySelectorAll(s));
  const clamp=(v)=>Math.max(0,Math.min(1,v)), mix=(a,b,p)=>a+(b-a)*p;
  const smooth=p=>{p=clamp(p);return p*p*(3-2*p);};
  const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),wide=matchMedia('(min-width: 801px)'),fine=matchMedia('(pointer: fine)');
  const body=document.body, root=document.documentElement, pages=$$('[data-page]');
  const hero=$('.hero'),journey=$('.work-journey'),track=$('.work-track'),slides=$$('.work-slide'),bridge=$('.bridge'),cloud=$('.constellation');
  const menu=$('#site-menu'),menuButton=$('.menu-toggle'),main=$('#main-content'),wipe=$('.page-wipe'),intro=$('.intro');
  const titles={home:'A small world',essay:'Journal',projects:'Selected work',planets:'Little worlds',about:'About',reading:'Reconnecting the blog'};
  let current='home',switching=false,queued=null,introBusy=false,metrics={},activeChapter=-1,dirty=true,lastY=-1;
  let heroVisible=true,cloudVisible=false,raf=0,lastFrame=0,staticPainted=false;
  let pointer={x:0,y:0},targetPointer={x:0,y:0};
  const planets=[
    ['yesterday-today','昨天，今天','Yesterday, today','想靠近的距离，也被温柔地保存。'],
    ['crossover','删了一百遍','Deleted a hundred times','删去的瞬间，在下一张里回来。'],
    ['poem','思念若是一首诗','If longing were a poem','水流了很远，那一页还没说完。'],
    ['rain-finale','雨终曲','Rain finale','终曲被按停，记忆仍在雨里。'],
    ['jielan','芥兰','Jie Lan','绕着日常，慢慢看一圈。']
  ];
  const entries=[
    ['Opportunity radar','每日需求与产品机会雷达｜2026-05-12 个性化修正版','2026.05.12','notes','daily-opportunity-radar-2026-05-12'],
    ['Reconnecting the blog','把博客重新接上线：一次内容整理小记','2026.05.10','building','reconnect-blog-content-notes'],
    ['From ideas to small systems','三月底到五月初：把零散想法做成可运行的小系统','2026.05.10','building','spring-2026-systems-recap'],
    ['Working with AI, thoughtfully','AI 协作开发学习笔记：从调研到交付的工作流','2026.03.03','notes','ai-collaboration-engineering-workflow-note']
  ];
  const asset=slug=>`assets/planets/${slug}/cover.webp`;
  $$('[data-journal]').forEach(list=>{
    const selected=list.dataset.journal==='home'?entries.slice(0,3):entries;
    selected.forEach(([title,native,date,type,slug])=>{
      const link=document.createElement('a');link.className='journal-row';link.dataset.type=type;
      link.href=slug==='reconnect-blog-content-notes'?'#/reading':`https://2006038.xyz/archive/${slug}/`;
      link.innerHTML=`<div><div class="row-meta"><span>${date}</span><span>${type.toUpperCase()}</span></div><h3>${title}</h3><p class="native-title" lang="zh-CN">${native}</p></div><span class="row-arrow" aria-hidden="true">↗</span>`;
      list.append(link);
    });
  });
  $$('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
    $$('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    let count=0;
    $$('.journal-full .journal-row').forEach(row=>{row.hidden=button.dataset.filter!=='all' && row.dataset.type!==button.dataset.filter;if(!row.hidden)count++;});
    $('[data-entry-count]').textContent=`0${count} ENTRIES`;
    $('#route-status').textContent=`${count} journal entries shown`;
  }));
  [0,2,3].forEach(index=>{
    const [slug,native,title]=planets[index],link=document.createElement('a');
    link.href='#/planets';link.className='object-card';link.dataset.object=String(index);
    link.innerHTML=`<div class="object-image"><img src="${asset(slug)}" width="1600" height="1600" alt="${native}小星球" loading="lazy"></div><div class="object-caption-row"><h3>${title}</h3><span>0${index+1} ↗</span></div><p lang="zh-CN">${native}</p>`;
    $('[data-gallery]').append(link);
  });
  let objectRevision=0;
  async function selectObject(index,animate=true) {
    const revision=++objectRevision,[slug,native,,description]=planets[index],figure=$('.selected-object');
    $$('[data-select-object]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.selectObject)===index)));
    if(animate&&!reduced.matches){figure.classList.add('changing');await delay(200);}
    if(revision!==objectRevision)return;
    const img=$('.selected-image img');img.src=asset(slug);img.alt=`${native} — 小星球`;
    $('[data-object-description]').textContent=description;$('[data-object-link]').href=`https://2006038.xyz/planets/${slug}/`;
    await Promise.race([img.decode().catch(()=>{}),delay(1500)]);
    if(revision===objectRevision){figure.classList.remove('changing');$('#route-status').textContent=`Selected ${native}`;}
  }
  planets.forEach(([,native,title],i)=>{
    const button=document.createElement('button');button.type='button';button.dataset.selectObject=String(i);button.setAttribute('aria-pressed',String(i===0));
    button.innerHTML=`<small>0${i+1}</small><span><strong>${title}</strong><em lang="zh-CN">${native}</em></span><i aria-hidden="true"></i>`;
    button.addEventListener('click',()=>selectObject(i));$('.collection-selector').append(button);
  });
  $$('[data-object]').forEach(link=>link.addEventListener('click',()=>selectObject(Number(link.dataset.object),false)));

  function clearTrail() {$$('.trail-image').forEach(img=>img.remove());}
  function closeMenu(focus=false) {
    menu.hidden=true;menuButton.setAttribute('aria-expanded','false');body.classList.remove('menu-open');main.inert=false;
    if(focus)menuButton.focus();
  }
  menuButton.addEventListener('click',()=>{
    if(!menu.hidden){closeMenu(true);return;}
    menu.hidden=false;menuButton.setAttribute('aria-expanded','true');body.classList.add('menu-open');main.inert=true;clearTrail();$('nav a',menu).focus();
  });
  document.addEventListener('keydown',event=>{
    if(menu.hidden)return;
    if(event.key==='Escape'){closeMenu(true);return;}
    if(event.key==='Tab'){
      const focusable=[$('.brand'),...$$('.main-nav a').filter(a=>a.getClientRects().length),menuButton,...$$('a,button',menu)];
      const first=focusable[0],last=focusable.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
  });
  function routeName(){if(location.hash.startsWith('#reading-'))return 'reading';const name=location.hash.replace(/^#\//,'');return Object.hasOwn(titles,name)?name:null;}
  function setView(name) {
    current=name;hero.classList.remove('reveal');pages.forEach(p=>p.hidden=p.dataset.page!==name);body.dataset.view=name;
    document.title=`Ji_Feng — ${titles[name]}`;
    $$('[data-route]').forEach(a=>{if(a.dataset.route===(name==='reading'?'essay':name))a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    const color={home:'#e9e8e2',essay:'#eeece6',projects:'#dce0d7',planets:'#28332e',about:'#dfded5',reading:'#eeece6'};
    $('meta[name="theme-color"]').content=color[name];window.scrollTo({top:0,behavior:'instant'});measure();
    $('#route-status').textContent=`${titles[name]}`;
  }
  async function navigate(name) {
    if(switching){queued=name;return;}
    closeMenu();if(current===name){window.scrollTo({top:0,behavior:reduced.matches?'instant':'smooth'});return;}
    switching=true;clearTrail();
    try{
      if(!reduced.matches){wipe.className='page-wipe covering';await delay(500);}
      setView(name);
      if(!reduced.matches){wipe.className='page-wipe uncovering';await delay(540);}
      main.focus({preventScroll:true});
    }finally{wipe.className='page-wipe';switching=false;if(queued&&queued!==current){const next=queued;queued=null;navigate(next);}else queued=null;}
  }
  addEventListener('hashchange',async()=>{
    const name=routeName();
    if(location.hash.startsWith('#reading-')){
      const anchor=location.hash;
      if(current!=='reading'){await navigate('reading');$(anchor)?.scrollIntoView({behavior:'instant'});}
    }else if(name)navigate(name);
  });
  document.addEventListener('click',event=>{
    const route=event.target.closest('a[href^="#/"]');
    if(route&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey){
      closeMenu();if(route.hash===location.hash){event.preventDefault();navigate(route.hash.slice(2));}
    }
  });
  $$('[data-scroll]').forEach(a=>a.addEventListener('click',event=>{event.preventDefault();$(a.hash).scrollIntoView({behavior:reduced.matches?'instant':'smooth'});}));
  $('[data-top]').addEventListener('click',()=>window.scrollTo({top:0,behavior:reduced.matches?'instant':'smooth'}));
  async function playIntro(){
    closeMenu();if(introBusy||switching||reduced.matches)return;introBusy=true;intro.hidden=false;intro.classList.remove('leaving');
    try{
      await Promise.all([Promise.race([document.fonts.ready,delay(1800)]),delay(900)]);
      intro.classList.add('leaving');
      if(current==='home'){hero.classList.remove('reveal');requestAnimationFrame(()=>hero.classList.add('reveal'));setTimeout(()=>hero.classList.remove('reveal'),1600);}
      await delay(680);
    }finally{intro.hidden=true;intro.classList.remove('leaving');introBusy=false;}
  }
  $('[data-replay]').addEventListener('click',playIntro);
  const sculpture=window.JournalArt.createSculpture($('#sculpture'));
  const dust=window.JournalArt.createDust($('#particle-field'));
  const threads=[];
  for(let i=0;i<22;i++){const path=document.createElementNS('http://www.w3.org/2000/svg','path');$('.thread-field').append(path);threads.push(path);}
  function measure(){
    const motion=wide.matches&&!reduced.matches;root.classList.toggle('motion-ready',motion);
    const top=el=>el.getBoundingClientRect().top+scrollY,h=innerHeight;
    metrics={motion,h,workTop:top(journey),workRange:Math.max(1,journey.offsetHeight-$('.work-sticky').offsetHeight),workWidth:$('.work-window').clientWidth,bridgeTop:top(bridge),bridgeRange:Math.max(1,bridge.offsetHeight-$('.bridge-sticky').offsetHeight),cloudTop:top(cloud),cloudRange:Math.max(1,cloud.offsetHeight-$('.constellation-sticky').offsetHeight)};
    if(!motion){track.style.transform='';slides.forEach(s=>{s.inert=false;s.removeAttribute('aria-hidden');});}
    sculpture.resize();dust.resize();staticPainted=false;dirty=true;activeChapter=-1;
  }
  $$('[data-chapter]').forEach(button=>button.addEventListener('click',()=>window.scrollTo({top:metrics.workTop+metrics.workRange*Number(button.dataset.chapter),behavior:reduced.matches?'instant':'smooth'})));
  function paintScroll(){
    if(current==='reading'){
      const range=document.documentElement.scrollHeight-innerHeight;
      $('.reading-progress i').style.transform=`scaleX(${range>0?clamp(scrollY/range):1})`;
    }
    if(current!=='home')return;
    if(metrics.motion){
      const p=clamp((scrollY-metrics.workTop)/metrics.workRange),index=Math.round(p);
      track.style.transform=`translateX(${-p*metrics.workWidth}px)`;
      $('.work-rail span').style.transform=`scaleX(${p})`;$('.work-rail i').style.left=`${p*100}%`;
      if(index!==activeChapter){
        activeChapter=index;const marker=$('.index-marker');marker.style.transform=`translateY(${index*45}px)`;marker.classList.remove('moving');void marker.offsetWidth;marker.classList.add('moving');
        $$('[data-chapter]').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
        slides.forEach((s,i)=>{s.inert=i!==index;s.setAttribute('aria-hidden',String(i!==index));});
      }
    }
    const p=reduced.matches?1:clamp((scrollY-metrics.bridgeTop)/metrics.bridgeRange),gather=smooth(p/.8),fill=smooth((p-.28)/.7);
    $('.bridge-surface').style.transform=`translateY(${(1-fill)*100}%)`;
    $('.bridge-caption').style.color=fill>.5?'#adb8a6':'#697560';$('.bridge-caption').style.opacity=String(1-smooth((p-.75)/.25));
    threads.forEach((path,i)=>{const side=i%2?1:-1,y=-100+Math.floor(i/2)*65;const x=side<0?-50:1490,endX=mix(side<0?1490:-50,720,gather),endY=mix(y+100,420,gather);path.setAttribute('d',`M${x} ${y} C${720+side*450} ${y+100},${720-side*440*(1-gather)} ${mix(y-90,420,gather)},${endX} ${endY}`);});
    const cp=clamp((scrollY-metrics.cloudTop)/metrics.cloudRange);$('[data-particle-label]').textContent=cp>.28&&cp<.72?'FRAGMENTS / 02':'FORM / 01';
  }
  function frame(time){
    if(document.hidden){raf=0;return;}
    raf=requestAnimationFrame(frame);
    if(time-lastFrame<32)return;lastFrame=time;
    if(dirty||scrollY!==lastY){paintScroll();lastY=scrollY;dirty=false;}
    if(current!=='home')return;
    pointer.x=mix(pointer.x,targetPointer.x,.07);pointer.y=mix(pointer.y,targetPointer.y,.07);
    if(reduced.matches){if(!staticPainted){sculpture.paint(0,{x:0,y:0},true);dust.paint(0,0,true);staticPainted=true;}return;}
    if(heroVisible)sculpture.paint(time,pointer,false);
    if(cloudVisible)dust.paint(time,clamp((scrollY-metrics.cloudTop)/metrics.cloudRange),false);
  }
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.target===hero)heroVisible=entry.isIntersecting;else cloudVisible=entry.isIntersecting;}),{rootMargin:'100px'});
  observer.observe(hero);observer.observe(cloud);
  $('.hero-object').addEventListener('pointermove',e=>{if(reduced.matches||!fine.matches)return;const box=e.currentTarget.getBoundingClientRect();targetPointer={x:(e.clientX-box.left)/box.width-.5,y:(e.clientY-box.top)/box.height-.5};});
  $('.hero-object').addEventListener('pointerleave',()=>targetPointer={x:0,y:0});
  let lastTrail=0,trailIndex=0,lastPoint={x:0,y:0};
  document.addEventListener('pointermove',event=>{
    if(reduced.matches||!fine.matches||!wide.matches||current!=='home'||!menu.hidden)return;
    const target=event.target;
    if(!target.closest('.trail-zone')||target.closest('a,button,p,.meta,.quiet,.footer-bottom')){clearTrail();return;}
    const now=performance.now();if(now-lastTrail<200||Math.hypot(event.clientX-lastPoint.x,event.clientY-lastPoint.y)<90)return;
    lastTrail=now;lastPoint={x:event.clientX,y:event.clientY};const img=new Image();img.src=asset(planets[trailIndex++%5][0]);img.alt='';img.className='trail-image';img.style.left=`${event.clientX}px`;img.style.top=`${event.clientY}px`;img.style.setProperty('--rotate',`${(trailIndex%5-2)*5}deg`);body.append(img);setTimeout(()=>img.remove(),950);const all=$$('.trail-image');if(all.length>3)all[0].remove();
  },{passive:true});
  addEventListener('scroll',()=>{dirty=true;clearTrail();},{passive:true});
  addEventListener('resize',measure,{passive:true});wide.addEventListener('change',measure);
  reduced.addEventListener('change',()=>{intro.hidden=true;clearTrail();targetPointer={x:0,y:0};measure();});
  document.fonts.ready.then(measure);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else if(!raf){dirty=true;raf=requestAnimationFrame(frame);}});
  setView(routeName()||'home');
  if(location.hash.startsWith('#reading-')) requestAnimationFrame(()=>$(location.hash)?.scrollIntoView({behavior:'instant'}));
  let seen=false;try{seen=sessionStorage.getItem('ji-feng-study-03')==='seen';sessionStorage.setItem('ji-feng-study-03','seen');}catch{}
  if(!seen)playIntro();
  raf=requestAnimationFrame(frame);
})();
