import { initLayerDrift, initReveals, initUnderlines, initLoadingScreen } from './follow/motion.js?v=9';

/* FOLLOW.ART's recovered motion functions drive the personal blog's own content. */
const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
const posts=window.JournalPosts||[];
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const T=(en,zh)=>lang==='zh'?zh:en;
let lang='en',view='home',activePost='',filter='all',journalIndex=0,planetIndex=0,busy=false,queuedHash='',homeScroll=0;
const picks=['reconnect-blog-content-notes','narrarc-agentic-rag-architecture-note','genericagent-wechat-reliability'].map(slug=>posts.find(post=>post.slug===slug));
const featureSteps={
  'reconnect-blog-content-notes':{en:['WRITE','ROUTE','RETURN'],zh:['写下','归档','回看']},
  'narrarc-agentic-rag-architecture-note':{en:['QUERY','TRACE','CITE'],zh:['提问','追溯','引用']},
  'genericagent-wechat-reliability':{en:['RECEIVE','GENERATE','SEND'],zh:['接收','生成','发送']}
};
const planets=[
  {slug:'yesterday-today',en:'Yesterday, today',zh:'昨天，今天'},
  {slug:'crossover',en:'Deleted a hundred times',zh:'删了一百遍'},
  {slug:'poem',en:'If longing were a poem',zh:'思念若是一首诗'},
  {slug:'rain-finale',en:'Rain finale',zh:'雨终曲'},
  {slug:'jielan',en:'Jie Lan',zh:'芥兰'}
];
const archive=[
  {slug:'daily-opportunity-radar-2026-05-12',en:'Opportunity radar',zh:'每日需求与产品机会雷达',date:'2026.05.12',type:'notes',external:true},
  ...posts.map(post=>({...post,date:post.date.replaceAll('-','.'),external:false}))
];

function setLanguage(next){
  lang=next;document.documentElement.lang=next==='zh'?'zh-CN':'en';
  $$('[data-en][data-zh]').forEach(el=>{
    if(el.hasAttribute('data-allow-break'))el.innerHTML=el.dataset[next];
    else el.textContent=el.dataset[next];
  });
  $$('[data-language]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.language===next)));
  try{localStorage.setItem('ji-feng-language',next);}catch{}
  renderJournal();renderPlanets();renderArchive();
  if(view==='reading'&&activePost){const y=scrollY;renderArticle(activePost);window.scrollTo({top:y,behavior:'instant'});}
  else if(view==='archive')document.title=T('Journal','随笔')+' / JI_FENG';
  else document.title=T('JI_FENG | A small world','霁风 | 一方小世界');
}

function renderJournal(){
  if(picks.some(post=>!post))return;
  $('#journal-card-slot').innerHTML=picks.map((post,index)=>{
    const name=escape(T(post.en,post.zh)),summary=escape(T(post.summaryEn,post.summary));
    const steps=T(featureSteps[post.slug].en,featureSteps[post.slug].zh).map(step=>`<em>${escape(step)}</em>`).join('');
    const place=index===journalIndex?'is-active':index===(journalIndex+2)%3?'is-before':'is-after';
    return `<a class="feature-card ${place}" href="#/reading/${post.slug}"><small>${post.date.replaceAll('-','.')} / ${T(post.type.toUpperCase(),post.type==='building'?'构建':'笔记')}</small><strong>${name}</strong><p>${summary}</p><figure class="feature-cover"><span class="feature-cover__steps">${steps}</span><i>${T('READ THE PROCESS','阅读过程')}</i></figure><b aria-hidden="true">↗</b></a>`;
  }).join('');
  $('#journal-index').textContent=`0${journalIndex+1} / 03`;
}
function moveJournal(direction){journalIndex=(journalIndex+direction+3)%3;renderJournal();}

function renderPlanets(){
  $('#collection-cards').innerHTML=planets.map((planet,index)=>{
    const relative=(index-planetIndex+planets.length)%planets.length;
    const place=['is-active','is-after','is-far-after','is-far-before','is-before'][relative];
    return `<a class="planet-card ${place}" href="https://2006038.xyz/planets/${planet.slug}/"><img src="assets/planets/${planet.slug}/cover.webp" alt="" width="1600" height="1600" loading="lazy"><footer><span>0${index+1} / 05<br><strong>${escape(T(planet.en,planet.zh))}</strong></span><b aria-hidden="true">↗</b></footer></a>`;
  }).join('');
  $('#collection-index').textContent=`0${planetIndex+1} / 05`;
}
function movePlanet(direction){planetIndex=(planetIndex+direction+planets.length)%planets.length;renderPlanets();}

function renderArchive(){
  $('#archive-list').innerHTML=archive.map((entry,index)=>{
    const title=escape(T(entry.en,entry.zh));
    const href=entry.external?`https://2006038.xyz/archive/${entry.slug}/`:`#/reading/${entry.slug}`;
    return `<a class="archive-row" data-type="${entry.type}" href="${href}" ${filter!=='all'&&filter!==entry.type?'hidden':''}><small>${String(index+1).padStart(2,'0')}<br>${entry.date}</small><strong>${title}</strong><span>${T(entry.type.toUpperCase(),entry.type==='building'?'构建':'笔记')}</span><b aria-hidden="true">↗</b></a>`;
  }).join('');
  $$('[data-filter]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.filter===filter)));
  $('#archive-count').textContent=`${String(archive.length).padStart(2,'0')} ${T('ENTRIES','篇记录')} / 2026`;
}

function renderArticle(slug){
  const post=posts.find(item=>item.slug===slug)||posts[0];if(!post)return;
  activePost=post.slug;
  const index=posts.indexOf(post);
  const tones=['pink','green','blue','pink','orange','green','blue','pink','green','orange'];
  $('#reader-view').dataset.tone=tones[index];document.body.dataset.color=tones[index];
  $('#reader-overline').textContent=`${String(index+1).padStart(2,'0')} / ${String(posts.length).padStart(2,'0')} · ${T('READING','阅读')}`;
  $('#reader-meta').innerHTML=`<span>${post.date.replaceAll('-','.')} / ${T(post.type.toUpperCase(),post.type==='building'?'构建':'笔记')}</span><span>${T(`ABOUT ${post.minutes} MIN · ORIGINAL IN CHINESE`,`约 ${post.minutes} 分钟 · 中文原文`)}</span>`;
  $('#reader-title').textContent=T(post.en,post.zh);
  $('#reader-deck').textContent=T(post.summaryEn,post.summary);
  $('#reader-original').href=post.source;
  $('#reader-body').innerHTML=post.html;
  $('#reader-toc').innerHTML=post.headings.map((heading,i)=>`<a href="#/reading/${post.slug}?section=${heading.id}" data-reading-anchor="${heading.id}"><small>${String(i+1).padStart(2,'0')}</small><span>${escape(heading.text)}</span></a>`).join('');
  const previous=posts[(index+posts.length-1)%posts.length],next=posts[(index+1)%posts.length];
  $('#reader-neighbours').innerHTML=`<a href="#/reading/${previous.slug}"><small>${T('PREVIOUS NOTE','上一篇')}</small><strong>${escape(T(previous.en,previous.zh))}</strong><b>↖</b></a><a href="#/reading/${next.slug}"><small>${T('NEXT NOTE','下一篇')}</small><strong>${escape(T(next.en,next.zh))}</strong><b>↗</b></a>`;
  document.title=`${T(post.en,post.zh)} / JI_FENG`;
  $('#route-status').textContent=T(`Reading ${post.en}`,`正在阅读${post.zh}`);
}

function parseRoute(hash){
  if(hash.startsWith('#/reading/')||hash==='#/reading'||hash.startsWith('#reading-')){
    const [path,query='']=hash.replace(/^#\//,'').split('?');
    const slug=path.startsWith('reading/')?path.slice(8):posts[0]?.slug;
    const section=new URLSearchParams(query).get('section')||(hash.startsWith('#reading-')?hash.slice(1):null);
    return {type:'reading',slug,section};
  }
  if(hash==='#/essay')return {type:'archive'};
  const section={'#/projects':'work','#/planets':'collection','#/about':'about','#journal':'journal','#work':'work','#collection':'collection','#about':'about'}[hash];
  return {type:'home',section};
}
function setVisible(type){
  view=type;document.body.dataset.view=type;
  $('#home-view').hidden=type!=='home';$('#archive-view').hidden=type!=='archive';$('#reader-view').hidden=type!=='reading';
  if(type==='archive')document.body.dataset.color='pink';
  if(type==='home')document.body.dataset.color='orange';
  $('#site-header').classList.add('is-revealed');
}
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function closeMenu(){
  const menu=$('#site-menu');if(menu.hidden)return;
  menu.hidden=true;$('#menu-toggle').setAttribute('aria-expanded','false');document.documentElement.style.overflow='';
}
async function performRoute(hash,initial=false){
  const target=parseRoute(hash),same=view===target.type&&(target.type!=='reading'||activePost===target.slug);
  if(busy){queuedHash=hash;return;}
  if(!initial&&same){
    if(target.type==='home'){
      if(target.section)document.getElementById(target.section)?.scrollIntoView({behavior:reduce.matches?'instant':'smooth'});
      else window.scrollTo({top:0,behavior:reduce.matches?'instant':'smooth'});
    }else if(target.type==='reading'){
      const el=target.section&&document.getElementById(target.section);
      if(el)el.scrollIntoView({behavior:reduce.matches?'instant':'smooth'});
      else window.scrollTo({top:0,behavior:reduce.matches?'instant':'smooth'});
    }else window.scrollTo({top:0,behavior:reduce.matches?'instant':'smooth'});
    return;
  }
  busy=true;closeMenu();
  const curtain=$('#route-curtain');
  if(!initial&&!reduce.matches){
    curtain.style.background=target.type==='reading'?'#c5939d':target.type==='archive'?'#c5939d':target.section==='collection'?'#8498ac':target.section==='work'?'#8e9487':'#f4793a';
    $('#curtain-label').textContent=target.type==='reading'?T('READING','阅读'):target.type==='archive'?T('JOURNAL','随笔'):target.section?target.section.toUpperCase():'JI_FENG';
    curtain.classList.remove('is-uncovering');void curtain.offsetHeight;curtain.classList.add('is-covering');await pause(750);
  }
  if(view==='home')homeScroll=scrollY;
  setVisible(target.type);
  if(target.type==='reading')renderArticle(target.slug);
  else if(target.type==='archive'){document.title=T('Journal','随笔')+' / JI_FENG';$('#route-status').textContent=T('Journal','随笔');}
  else {document.title=T('JI_FENG | A small world','霁风 | 一方小世界');$('#route-status').textContent=T('Home','首页');}
  window.scrollTo({top:0,behavior:'instant'});
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  if(target.type==='home'){
    if(target.section)document.getElementById(target.section)?.scrollIntoView({behavior:'instant'});
    else if(!initial&&homeScroll&&hash==='#/home')window.scrollTo({top:0,behavior:'instant'});
  }else if(target.type==='reading'&&target.section)document.getElementById(target.section)?.scrollIntoView({behavior:'instant'});
  if(!initial&&!reduce.matches){curtain.classList.add('is-uncovering');curtain.classList.remove('is-covering');await pause(780);curtain.classList.remove('is-uncovering');}
  updateHeaderColour();busy=false;
  if(queuedHash&&queuedHash!==hash){const next=queuedHash;queuedHash='';performRoute(next);}else queuedHash='';
}

function updateHeaderColour(){
  if(view!=='home')return;
  let colour='orange';
  $$('.scene').forEach(scene=>{const box=scene.getBoundingClientRect();if(box.top<=innerHeight*.2&&box.bottom>innerHeight*.2)colour=scene.dataset.color;});
  document.body.dataset.color=colour;
  $('meta[name="theme-color"]').content={'orange':'#f4793a','pink':'#c5939d','green':'#8e9487','blue':'#8498ac'}[colour];
}
function updateReaderTOC(){
  if(view!=='reading')return;
  let current=$('.reader-body h2,.reader-body h3')?.id;
  $$('.reader-body h2,.reader-body h3').forEach(heading=>{if(heading.getBoundingClientRect().top<innerHeight*.32)current=heading.id;});
  $$('#reader-toc a').forEach(link=>{if(link.dataset.readingAnchor===current)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
}
let scrollTick=false;
addEventListener('scroll',()=>{if(scrollTick)return;scrollTick=true;requestAnimationFrame(()=>{scrollTick=false;updateHeaderColour();updateReaderTOC();});},{passive:true});
addEventListener('resize',updateHeaderColour,{passive:true});
addEventListener('hashchange',()=>performRoute(location.hash));
document.addEventListener('click',event=>{
  const link=event.target.closest('a[href^="#/"]');
  if(link&&link.hash===location.hash){event.preventDefault();performRoute(location.hash);}
  if(link&&$('#site-menu').contains(link))closeMenu();
});
$$('[data-language]').forEach(button=>button.addEventListener('click',()=>setLanguage(button.dataset.language)));
$$('[data-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.filter;renderArchive();}));
$('#journal-prev').addEventListener('click',()=>moveJournal(-1));$('#journal-next').addEventListener('click',()=>moveJournal(1));
$('#collection-prev').addEventListener('click',()=>movePlanet(-1));$('#collection-next').addEventListener('click',()=>movePlanet(1));
$('#menu-toggle').addEventListener('click',()=>{const menu=$('#site-menu');menu.hidden=false;$('#menu-toggle').setAttribute('aria-expanded','true');document.documentElement.style.overflow='hidden';$('nav a',menu).focus({preventScroll:true});});
$('#menu-close').addEventListener('click',()=>{closeMenu();$('#menu-toggle').focus({preventScroll:true});});
addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('#site-menu').hidden){closeMenu();$('#menu-toggle').focus({preventScroll:true});}});
let startX=0;
$('#journal-stage').addEventListener('pointerdown',event=>{startX=event.clientX;});
$('#journal-stage').addEventListener('pointerup',event=>{if(Math.abs(event.clientX-startX)>60)moveJournal(event.clientX<startX?1:-1);});
$('#collection-cards').addEventListener('pointerdown',event=>{startX=event.clientX;});
$('#collection-cards').addEventListener('pointerup',event=>{if(Math.abs(event.clientX-startX)>60)movePlanet(event.clientX<startX?1:-1);});

try{lang=localStorage.getItem('ji-feng-language')==='zh'?'zh':'en';}catch{}
setLanguage(lang);
const initialRoute=parseRoute(location.hash);
if(initialRoute.type!=='home'||initialRoute.section)performRoute(location.hash,true);
else {setVisible('home');updateHeaderColour();}
const startMotion=()=>{initLayerDrift();initReveals();initUnderlines();};
let seen=false;try{seen=sessionStorage.getItem('ji-feng-follow-intro')==='seen';sessionStorage.setItem('ji-feng-follow-intro','seen');}catch{}
if(reduce.matches||seen){$('#loader').hidden=true;$('#opening .scene__layer').classList.add('is-revealed');$('#site-header').classList.add('is-revealed');startMotion();}
else initLoadingScreen('#loader',1200).done.then(startMotion);
