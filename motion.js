/* V4 choreography. Reference mappings and adaptations: MOTION-SOURCES.md. */
(() => {
  'use strict';
  const $=(s,scope=document)=>scope.querySelector(s), $$=(s,scope=document)=>Array.from(scope.querySelectorAll(s));
  const clamp=v=>Math.max(0,Math.min(1,v)), mix=(a,b,p)=>a+(b-a)*p;
  const smooth=p=>{p=clamp(p);return p*p*(3-2*p);};
  const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),wide=matchMedia('(min-width: 801px)'),fine=matchMedia('(pointer: fine)');
  const I=window.JournalI18n,T=(en,zh)=>I.choose(en,zh);
  const body=document.body,root=document.documentElement,pages=$$('[data-page]');
  const hero=$('.hero'),journey=$('.work-journey'),track=$('.work-track'),slides=$$('.work-slide'),bridge=$('.bridge'),cloud=$('.constellation');
  const menu=$('#site-menu'),menuButton=$('.menu-toggle'),main=$('#main-content'),wipe=$('.page-wipe'),intro=$('.intro');
  const titles={home:['A small world','一方小世界'],essay:['Journal','随笔'],projects:['Selected work','作品'],planets:['Little worlds','收藏'],about:['About','关于'],reading:['Reconnecting','重新接上线']};
  const colors={home:'#eeeae2',essay:'#eeece6',projects:'#dce0d7',planets:'#28332e',about:'#dfded5',reading:'#eeece6'};
  let current='home',switching=false,queued=null,introBusy=false,metrics={},activeChapter=-1,dirty=true,lastY=-1;
  let heroVisible=true,cloudVisible=false,raf=0,lastFrame=0,staticPainted=false,revealStarted=-10000;
  let pointer={x:0,y:0},targetPointer={x:0,y:0},selectedObject=0,filter='all';
  const planets=[
    ['yesterday-today','昨天，今天','Yesterday, today','想靠近的距离，也被温柔地保存。','A little distance, gently kept.'],
    ['crossover','删了一百遍','Deleted a hundred times','删去的瞬间，在下一张里回来。','An erased moment returns in the next frame.'],
    ['poem','思念若是一首诗','If longing were a poem','水流了很远，那一页还没说完。','The water moves on. The page remains open.'],
    ['rain-finale','雨终曲','Rain finale','终曲被按停，记忆仍在雨里。','The music pauses. The memory stays in the rain.'],
    ['jielan','芥兰','Jie Lan','绕着日常，慢慢看一圈。','A slow orbit around the everyday.']
  ];
  const entries=[
    ['Opportunity radar','每日需求与产品机会雷达','2026.05.12','notes','daily-opportunity-radar-2026-05-12','每日需求与产品机会雷达｜2026-05-12 个性化修正版'],
    ['Reconnecting the blog','把博客重新接上线','2026.05.10','building','reconnect-blog-content-notes','把博客重新接上线：一次内容整理小记'],
    ['From ideas to small systems','把零散想法做成小系统','2026.05.10','building','spring-2026-systems-recap','三月底到五月初：把零散想法做成可运行的小系统'],
    ['Working with AI, thoughtfully','与 AI 协作：从调研到交付','2026.03.03','notes','ai-collaboration-engineering-workflow-note','AI 协作开发学习笔记：从调研到交付的工作流']
  ];
  const asset=slug=>`assets/planets/${slug}/cover.webp`;
  const anim=(el,frames,options)=>el.animate(frames,{fill:'both',...options});
  const finished=a=>a.finished.catch(()=>{});

  // GoodFella's recovered DigitRoller: em-sized vertical stacks, right-to-left delay.
  // Three complete cycles fix the recovered fragment's out-of-range -20em target.
  function roller(el,digits){
    el.innerHTML=Array.from({length:digits},()=>'<span class="roller"><span class="roller-track">'+Array.from({length:30},(_,i)=>`<span>${i%10}</span>`).join('')+'</span></span>').join('');
    return(value,instant=false)=>{
      const text=String(value).padStart(digits,'0');el.dataset.value=text;
      $$('.roller-track',el).forEach((track,i)=>{
        track.style.transitionDuration=instant||reduced.matches?'0s':'';
        track.style.transitionDelay=instant?'0s':`${(digits-i-1)*.025}s`;
        track.style.transform=`translateY(${-20-Number(text[i])}em)`;
      });
    };
  }
  const introCount=roller($('.intro-count'),3),chapterCount=roller($('.work-counter'),2);chapterCount(1,true);
  $('.work-counter').insertAdjacentHTML('beforeend','<small>/ 02</small>');

  $$('[data-journal]').forEach(list=>{
    const selected=list.dataset.journal==='home'?entries.slice(0,3):entries;
    selected.forEach(([,native,date,type,slug],i)=>{
      const link=document.createElement('a');link.className='journal-row';link.dataset.type=type;link.dataset.entry=String(i);
      link.href=slug==='reconnect-blog-content-notes'?'#/reading':`https://2006038.xyz/archive/${slug}/`;
      link.innerHTML=`<div><div class="row-meta"><span>${date}</span><span data-entry-type></span></div><h3></h3><p class="native-title" lang="zh-CN">${native}</p></div><span class="row-arrow" aria-hidden="true">↗</span>`;list.append(link);
    });
  });
  function applyFilter(announce=false){
    $$('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===filter)));
    let count=0;$$('.journal-full .journal-row').forEach(row=>{row.hidden=filter!=='all'&&row.dataset.type!==filter;if(!row.hidden)count++;});
    $('[data-entry-count]').textContent=`0${count} ${T('ENTRIES','篇')}`;
    if(announce)$('#route-status').textContent=T(`${count} journal entries shown`,`已显示 ${count} 篇随笔`);
  }
  $$('[data-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.filter;applyFilter(true);}));
  [0,2,3].forEach(index=>{
    const [slug]=planets[index],link=document.createElement('a');link.href='#/planets';link.className='object-card';link.dataset.object=String(index);
    link.innerHTML=`<div class="object-image"><img src="${asset(slug)}" width="1600" height="1600" alt="" loading="lazy"></div><div class="object-caption-row"><h3></h3><span>0${index+1} ↗</span></div><p lang="zh-CN"></p>`;$('[data-gallery]').append(link);
  });
  let objectRevision=0;
  function objectCopy(){
    const [slug,native,title,zh,en]=planets[selectedObject];
    const img=$('.selected-image img');img.alt=T(`${title} — little world`,`${native} — 小星球`);
    $('[data-object-description]').textContent=T(en,zh);$('[data-object-description]').lang=T('en','zh-CN');
    $('[data-object-link]').href=`https://2006038.xyz/planets/${slug}/`;
    $$('[data-select-object]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.selectObject)===selectedObject)));
  }
  async function selectObject(index,animate=true){
    selectedObject=index;const revision=++objectRevision,figure=$('.selected-object');objectCopy();
    if(animate&&!reduced.matches){figure.classList.add('changing');await delay(320);}
    if(revision!==objectRevision)return;
    const img=$('.selected-image img');img.src=asset(planets[index][0]);
    await Promise.race([img.decode().catch(()=>{}),delay(1500)]);
    if(revision===objectRevision){figure.classList.remove('changing');$('#route-status').textContent=T(`Selected ${planets[index][2]}`,`已选择${planets[index][1]}`);}
  }
  planets.forEach((_,i)=>{
    const button=document.createElement('button');button.type='button';button.dataset.selectObject=String(i);
    button.innerHTML=`<small>0${i+1}</small><span><strong></strong><em lang="zh-CN"></em></span><i aria-hidden="true"></i>`;
    button.addEventListener('click',()=>selectObject(i));$('.collection-selector').append(button);
  });
  $$('[data-object]').forEach(link=>link.addEventListener('click',()=>selectObject(Number(link.dataset.object),false)));

  function dynamicCopy(){
    $$('[data-entry]').forEach(row=>{const [en,zh,,type,,native]=entries[Number(row.dataset.entry)];$('h3',row).textContent=T(en,zh);$('.native-title',row).textContent=native;$('[data-entry-type]',row).textContent=type==='notes'?T('NOTES','笔记'):T('BUILDING','构建');});
    $$('[data-object]').forEach(card=>{const [,native,title]=planets[Number(card.dataset.object)];$('h3',card).textContent=T(title,native);$('p',card).textContent=native;$('img',card).alt=T(title,`${native}小星球`);});
    $$('[data-select-object]').forEach(button=>{const [,native,title]=planets[Number(button.dataset.selectObject)];$('strong',button).textContent=T(title,native);$('em',button).textContent=native;});
    $$('.main-nav a').forEach(a=>{const label=a.textContent;a.replaceChildren();const span=document.createElement('span');span.className='nav-label';span.textContent=label;span.dataset.label=label;a.append(span);});
    document.title=`${T('Ji_Feng','霁风')} — ${T(...titles[current])}`;
    $('.cloud-stage').textContent=T('A form of remembering.','记忆的形状。');
    objectCopy();applyFilter();dirty=true;
  }

  // Bürocratik's character staggering, adapted to semantic native DOM and WAAPI.
  function titleReveal(el,wait=0){
    if(!el||reduced.matches)return;
    if(!el.querySelector('.reveal-char')){
      el.setAttribute('aria-label',el.textContent.replace(/\s+/g,' ').trim());
      const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
      nodes.forEach(node=>{
        const fragment=document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(word=>{
          if(!word.trim()){fragment.append(document.createTextNode(word));return;}
          const span=document.createElement('span');span.className='reveal-word';span.setAttribute('aria-hidden','true');
          Array.from(word).forEach(char=>{const c=document.createElement('span');c.className='reveal-char';c.textContent=char;span.append(c);});fragment.append(span);
        });node.replaceWith(fragment);
      });
    }
    $$('.reveal-char',el).forEach((char,i)=>{char.getAnimations().forEach(a=>a.cancel());const a=anim(char,[{transform:'translate3d(0,105%,0) rotateX(-55deg)',opacity:0},{transform:'translate3d(0,0,0) rotateX(0)',opacity:1}],{duration:950,delay:wait+i*18,easing:'cubic-bezier(.16,1,.3,1)'});finished(a).then(()=>a.cancel());});
  }
  function revealPage(name,wait=0){
    const view=pages.find(p=>p.dataset.page===name);titleReveal($('h1',view),wait);
    if(reduced.matches)return;
    const targets=$$('.page-heading>p,.collection-heading>p,.reading-header>p,.hero-description,.hero-copy>.text-link',view);
    targets.forEach((el,i)=>{const a=anim(el,[{opacity:0,transform:'translateY(18px)'},{opacity:1,transform:'none'}],{duration:800,delay:wait+180+i*80,easing:'cubic-bezier(.16,1,.3,1)'});finished(a).then(()=>a.cancel());});
  }
  const revealObserver=new IntersectionObserver(items=>items.forEach(entry=>{
    if(entry.isIntersecting&&current==='home'){titleReveal(entry.target);revealObserver.unobserve(entry.target);}
  }),{threshold:.25});
  function observeTitles(){ $$('.home-journal h2,.work-slide h2,.constellation h2').forEach(el=>revealObserver.observe(el)); }

  function clearTrail(){$$('.trail-image').forEach(img=>img.remove());}
  function closeMenu(focus=false){
    menu.getAnimations({subtree:true}).forEach(a=>a.cancel());menu.hidden=true;menuButton.setAttribute('aria-expanded','false');body.classList.remove('menu-open');main.inert=false;if(focus)menuButton.focus();
  }
  menuButton.addEventListener('click',()=>{
    if(!menu.hidden){closeMenu(true);return;}
    menu.hidden=false;menuButton.setAttribute('aria-expanded','true');body.classList.add('menu-open');main.inert=true;clearTrail();
    if(!reduced.matches){
      const a=anim(menu,[{clipPath:'inset(0 0 100% 0)'},{clipPath:'inset(0 0 0% 0)'}],{duration:650,easing:'cubic-bezier(.76,0,.24,1)'});finished(a).then(()=>a.cancel());
      $$('nav a>span',menu).forEach((el,i)=>{const a=anim(el,[{transform:'translateY(120%) rotate(4deg)'},{transform:'none'}],{duration:850,delay:160+i*55,easing:'cubic-bezier(.16,1,.3,1)'});finished(a).then(()=>a.cancel());});
    }
    $('nav a',menu).focus({preventScroll:true});
  });
  document.addEventListener('keydown',event=>{
    if(menu.hidden)return;if(event.key==='Escape'){closeMenu(true);return;}
    if(event.key==='Tab'){
      const focusable=[$('.brand'),...$$('.main-nav a').filter(a=>a.getClientRects().length),...$$('[data-language]'),menuButton,...$$('a,button',menu)];
      const first=focusable[0],last=focusable.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
  });
  function routeName(){if(location.hash.startsWith('#reading-'))return 'reading';const name=location.hash.replace(/^#\//,'');return Object.hasOwn(titles,name)?name:null;}
  function setView(name){
    current=name;pages.forEach(p=>p.hidden=p.dataset.page!==name);body.dataset.view=name;
    $$('[data-route]').forEach(a=>{if(a.dataset.route===(name==='reading'?'essay':name))a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    $('meta[name="theme-color"]').content=colors[name];window.scrollTo({top:0,behavior:'instant'});dynamicCopy();measure();
    $('#route-status').textContent=T(...titles[name]);
  }
  const pageAnimations=[];
  async function turnPages(name,cover){
    wipe.classList.add('active');wipe.style.setProperty('--turn-color',colors[name]);wipe.style.setProperty('--turn-ink',name==='planets'?'#eeeae2':'#292b27');
    $('.turn-label strong').textContent=T(...titles[name]);$('.turn-label small').textContent=`0${Object.keys(titles).indexOf(name)}`;
    const sheets=$$('.turn-sheet');
    const jobs=sheets.map((sheet,i)=>{
      const frames=cover?[{transform:'translate3d(0,115%,0) rotate(-8deg) rotateX(-12deg)'},{transform:'translate3d(0,0,0) rotate(0deg) rotateX(0deg)'}]:[{transform:'translate3d(0,0,0) rotate(0deg) rotateX(0deg)'},{transform:'translate3d(0,-115%,0) rotate(7deg) rotateX(10deg)'}];
      const a=anim(sheet,frames,{duration:cover?630:720,delay:cover?i*60:(2-i)*45,easing:cover?'cubic-bezier(.76,0,.24,1)':'cubic-bezier(.65,0,.2,1)'});pageAnimations.push(a);return finished(a);
    });
    await Promise.all(jobs);
  }
  async function navigate(name){
    if(switching){queued=name;return;}
    closeMenu();if(current===name){if(location.hash.startsWith('#reading-'))$(location.hash)?.scrollIntoView({behavior:reduced.matches?'instant':'smooth'});else window.scrollTo({top:0,behavior:reduced.matches?'instant':'smooth'});return;}
    switching=true;clearTrail();main.inert=true;
    try{
      if(!reduced.matches)await turnPages(name,true);
      setView(name);
      if(name==='home')revealStarted=performance.now();
      if(!reduced.matches){revealPage(name,300);await turnPages(name,false);}
      main.focus({preventScroll:true});
      if(current==='reading'&&location.hash.startsWith('#reading-'))$(location.hash)?.scrollIntoView({behavior:'instant'});
    }finally{
      pageAnimations.splice(0).forEach(a=>a.cancel());wipe.classList.remove('active');switching=false;main.inert=false;
      if(queued&&queued!==current){const next=queued;queued=null;navigate(next);}else queued=null;
    }
  }
  addEventListener('hashchange',()=>{const name=routeName();if(name)navigate(name);});
  document.addEventListener('click',event=>{const route=event.target.closest('a[href^="#/"]');if(route&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey){closeMenu();if(route.hash===location.hash){event.preventDefault();navigate(route.hash.slice(2));}}});
  $$('[data-scroll]').forEach(a=>a.addEventListener('click',event=>{event.preventDefault();$(a.hash).scrollIntoView({behavior:reduced.matches?'instant':'smooth'});}));
  $('[data-top]').addEventListener('click',()=>window.scrollTo({top:0,behavior:reduced.matches?'instant':'smooth'}));

  // AVA's media-ready gate, progress line, exponential count, upward exit.
  async function playIntro(){
    closeMenu();if(introBusy||switching||reduced.matches)return;
    introBusy=true;intro.hidden=false;body.classList.add('loading');main.inert=true;$('.site-header').inert=true;introCount(0,true);intro.style.setProperty('--load',0);
    try{
      await Promise.all([Promise.race([document.fonts.ready,delay(2500)]),new Promise(resolve=>{
        const start=performance.now();function tick(time){const p=clamp((time-start)/2050),progress=(Math.pow(14,p)-1)/13;introCount(Math.round(progress*100));intro.style.setProperty('--load',progress);if(p<1&&!reduced.matches)requestAnimationFrame(tick);else resolve();}requestAnimationFrame(tick);
      })]);
      introCount(100);intro.style.setProperty('--load',1);await delay(140);
      if(reduced.matches)return;
      revealStarted=performance.now();revealPage(current,200);
      const a=anim(intro,[{transform:'translateY(0)'},{transform:'translateY(-102%)'}],{duration:1050,easing:'cubic-bezier(.76,0,.24,1)'});await finished(a);a.cancel();
    }finally{intro.hidden=true;introBusy=false;body.classList.remove('loading');main.inert=false;$('.site-header').inert=false;}
  }
  $('[data-replay]').addEventListener('click',playIntro);
  const sculpture=window.JournalArt.createSculpture($('#sculpture'));
  const dust=window.createJournalParticles($('#particle-field'));
  const threads=[];for(let i=0;i<22;i++){const path=document.createElementNS('http://www.w3.org/2000/svg','path');$('.thread-field').append(path);threads.push(path);}
  function measure(){
    const motion=wide.matches&&!reduced.matches;root.classList.toggle('motion-ready',motion);
    $('.object-caption').textContent=wide.matches&&fine.matches?T('MOVE TO CHANGE PERSPECTIVE','移动鼠标，换一个角度'):T('SCROLL TO CHANGE PERSPECTIVE','向下，换个角度');
    const top=el=>el.getBoundingClientRect().top+scrollY,h=innerHeight;
    metrics={motion,h,heroHeight:hero.offsetHeight,workTop:top(journey),workRange:Math.max(1,journey.offsetHeight-$('.work-sticky').offsetHeight),workWidth:$('.work-window').clientWidth,bridgeTop:top(bridge),bridgeRange:Math.max(1,bridge.offsetHeight-$('.bridge-sticky').offsetHeight),cloudTop:top(cloud),cloudRange:Math.max(1,cloud.offsetHeight-$('.constellation-sticky').offsetHeight)};
    if(!motion){track.style.transform='';slides.forEach(s=>{s.inert=false;s.removeAttribute('aria-hidden');});}
    sculpture.resize();dust.resize();staticPainted=false;dirty=true;activeChapter=-1;
  }
  $$('[data-chapter]').forEach(button=>button.addEventListener('click',()=>window.scrollTo({top:metrics.workTop+metrics.workRange*Number(button.dataset.chapter),behavior:reduced.matches?'instant':'smooth'})));
  function paintScroll(){
    if(current==='reading'){const range=root.scrollHeight-innerHeight;$('.reading-progress i').style.transform=`scaleX(${range>0?clamp(scrollY/range):1})`;}
    if(current!=='home')return;
    if(metrics.motion){
      const p=clamp((scrollY-metrics.workTop)/metrics.workRange),index=Math.round(p);
      track.style.transform=`translateX(${-p*metrics.workWidth}px)`;
      $('.work-rail span').style.transform=`scaleX(${p})`;$('.work-rail i').style.left=`${p*100}%`;
      // Bürocratik: the asset moves on its own axis inside the horizontal container.
      slides.forEach((slide,i)=>{const local=p-i;$('.paper-stack,.terminal-window',slide).style.translate=`${local*75}px ${Math.abs(local)*12}px`;$('.work-description',slide).style.translate=`${local*25}px 0`;});
      if(index!==activeChapter){activeChapter=index;chapterCount(index+1);const marker=$('.index-marker');marker.style.transform=`translateY(${index*45}px)`;marker.classList.remove('moving');void marker.offsetWidth;marker.classList.add('moving');$$('[data-chapter]').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));slides.forEach((s,i)=>{s.inert=i!==index;s.setAttribute('aria-hidden',String(i!==index));});}
    }else slides.forEach(slide=>{$('.paper-stack,.terminal-window',slide).style.translate='';$('.work-description',slide).style.translate='';});
    const p=reduced.matches?1:clamp((scrollY-metrics.bridgeTop)/metrics.bridgeRange),gather=smooth(p/.8),fill=smooth((p-.28)/.7);
    $('.bridge-surface').style.transform=`translateY(${(1-fill)*100}%)`;$('.bridge-caption').style.color=fill>.5?'#adb8a6':'#697560';$('.bridge-caption').style.opacity=String(1-smooth((p-.75)/.25));
    threads.forEach((path,i)=>{const side=i%2?1:-1,y=-100+Math.floor(i/2)*65,x=side<0?-50:1490,endX=mix(side<0?1490:-50,720,gather),endY=mix(y+100,420,gather);path.setAttribute('d',`M${x} ${y} C${720+side*450} ${y+100},${720-side*440*(1-gather)} ${mix(y-90,420,gather)},${endX} ${endY}`);});
    const cp=clamp((scrollY-metrics.cloudTop)/metrics.cloudRange),stage=cp<.25?0:cp<.75?1:2;
    $('[data-particle-label]').textContent=[T('FORM / 01','成形 / 01'),T('FRAGMENTS / 02','散开 / 02'),T('REFORM / 03','重组 / 03')][stage];$('.cloud-index').textContent=`0${stage+1}`;
    $('.constellation-copy').style.opacity=reduced.matches?'1':String(1-Math.sin(Math.PI*cp)**2*.18);
  }
  function frame(time){
    if(document.hidden){raf=0;return;}raf=requestAnimationFrame(frame);if(time-lastFrame<14)return;lastFrame=time;
    if(dirty||scrollY!==lastY){paintScroll();lastY=scrollY;dirty=false;}
    if(current!=='home')return;
    pointer.x=mix(pointer.x,targetPointer.x,.075);pointer.y=mix(pointer.y,targetPointer.y,.075);
    if(reduced.matches){if(!staticPainted){sculpture.reveal(1);sculpture.paint(0,{x:0,y:0},true);dust.paint(0,0,true);staticPainted=true;}return;}
    if(heroVisible){sculpture.reveal(smooth((time-revealStarted)/1900));sculpture.paint(time,pointer,false,clamp(scrollY/Math.max(1,metrics.heroHeight)));}
    if(cloudVisible)dust.paint(time,clamp((scrollY-metrics.cloudTop)/metrics.cloudRange),false);
  }
  const observer=new IntersectionObserver(items=>items.forEach(entry=>{if(entry.target===hero)heroVisible=entry.isIntersecting;else cloudVisible=entry.isIntersecting;}),{rootMargin:'100px'});observer.observe(hero);observer.observe(cloud);
  hero.addEventListener('pointermove',e=>{if(reduced.matches||!fine.matches)return;const box=hero.getBoundingClientRect();targetPointer={x:(e.clientX-box.left)/box.width-.5,y:(e.clientY-box.top)/box.height-.5};});hero.addEventListener('pointerleave',()=>targetPointer={x:0,y:0});
  let lastTrail=0,trailIndex=0,lastPoint={x:0,y:0};
  document.addEventListener('pointermove',event=>{
    if(reduced.matches||!fine.matches||!wide.matches||current!=='home'||!menu.hidden)return;
    const target=event.target;if(!target.closest('.trail-zone')||target.closest('a,button,p,.meta,.quiet,.footer-bottom')){clearTrail();return;}
    const now=performance.now(),dx=event.clientX-lastPoint.x,dy=event.clientY-lastPoint.y;if(now-lastTrail<115||Math.hypot(dx,dy)<75)return;
    lastTrail=now;lastPoint={x:event.clientX,y:event.clientY};const img=new Image();img.src=asset(planets[trailIndex++%5][0]);img.alt='';img.className='trail-image';img.style.left=`${event.clientX}px`;img.style.top=`${event.clientY}px`;img.style.setProperty('--rotate',`${(trailIndex%5-2)*7}deg`);img.style.setProperty('--dx',`${-dx*.25}px`);img.style.setProperty('--dy',`${-dy*.25}px`);body.append(img);setTimeout(()=>img.remove(),1200);const all=$$('.trail-image');if(all.length>5)all[0].remove();
  },{passive:true});
  addEventListener('scroll',()=>{dirty=true;clearTrail();},{passive:true});addEventListener('resize',measure,{passive:true});wide.addEventListener('change',measure);
  reduced.addEventListener('change',()=>{if(reduced.matches){intro.getAnimations().forEach(a=>a.finish());pageAnimations.forEach(a=>{try{a.finish();}catch{}});$$('.reveal-char').forEach(el=>el.getAnimations().forEach(a=>a.cancel()));}clearTrail();targetPointer={x:0,y:0};measure();});
  addEventListener('languagechange',()=>{dynamicCopy();observeTitles();measure();$('#route-status').textContent=T('Language changed to English','已切换为中文');document.fonts.ready.then(measure);});
  document.fonts.ready.then(measure);document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else if(!raf){dirty=true;raf=requestAnimationFrame(frame);}});
  setView(routeName()||'home');observeTitles();
  if(location.hash.startsWith('#reading-'))requestAnimationFrame(()=>$(location.hash)?.scrollIntoView({behavior:'instant'}));
  let seen=false;try{seen=sessionStorage.getItem('ji-feng-study-04')==='seen';sessionStorage.setItem('ji-feng-study-04','seen');}catch{}
  if(!seen)playIntro();else{revealStarted=performance.now()-900;revealPage(current);}
  raf=requestAnimationFrame(frame);
})();
