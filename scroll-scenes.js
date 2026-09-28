/* Scroll chapters and source-backed notes. No simulated operational data. */
(() => {
  'use strict';
  const $=(s,scope=document)=>scope.querySelector(s),$$=(s,scope=document)=>Array.from(scope.querySelectorAll(s));
  const I=window.JournalI18n,T=(en,zh)=>I.choose(en,zh),clamp=v=>Math.max(0,Math.min(1,v));
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),wide=matchMedia('(min-width: 801px)');
  const root=document.documentElement,systems=$('#systems'),stage=$('.systems-stage'),tabs=$('.systems-tabs'),dock=$('.chapter-dock');
  const notes=[
    {
      title:['A quieter paper feed.','让论文信息流安静一点。'],tab:['Paper radar','论文雷达'],meta:['PROJECT NOTE · MAY 2026','项目记录 · 2026.05'],stack:'Python / arXiv / SMTP',
      deck:['A daily discovery workflow: collect candidates, translate their abstracts, then choose what deserves a closer read.','每天收集候选论文，生成中文摘要，再挑出值得精读的几篇。'],
      steps:[
        {code:'01 / arXiv',label:['Discover','发现'],detail:['Retrieve papers by arXiv category. Keyword follow and ignore rules make the incoming feed more relevant.','按 arXiv 分类获取论文，用关键词关注与忽略规则缩小信息范围。']},
        {code:'02 / OpenAI API',label:['Translate','翻译'],detail:['Generate Chinese titles and abstracts so the first reading decision takes less effort. Return to the paper for close reading.','生成中文标题与摘要，降低第一轮筛选的成本。进入精读时，再回到论文原文。']},
        {code:'03 / SMTP + Web',label:['Deliver','送达'],detail:['Send HTML recommendations by email. The project notes also describe scheduled runs, a Web API and a page for daily results.','通过邮件发送 HTML 推荐；项目记录还包括定时任务、Web API 与每日结果页面。']}
      ],
      takeaway:['Turn a busy information feed into a short reading queue.','把输出收成一份值得继续读的短清单。'],
      href:'https://2006038.xyz/projects/arxiv-reader-paper-radar/',status:['In progress in the May project note','5 月项目记录：开发中']
    },
    {
      title:['A window into local tools.','给本机工具开一扇窗。'],tab:['Local tools','本机工具'],meta:['PROJECT NOTE · MAY 2026','项目记录 · 2026.05'],stack:'Node.js / WebSocket / PWA',
      deck:['Webcoding keeps execution on the computer and puts sessions, configuration and interaction in the browser.','Webcoding 让任务继续在本机执行，把会话、配置与交互放进浏览器。'],
      steps:[
        {code:'01 / Browser',label:['Control','操作'],detail:['Use a browser or mobile entry point to switch sessions, resume a conversation and review its history.','从浏览器或移动端切换会话、续接对话、查看历史，让入口更容易到达。']},
        {code:'02 / Local bridge',label:['Connect','连接'],detail:['A Node.js service, WebSocket connection and local API bridge connect the Web interface to the machine’s toolchain.','通过 Node.js 服务、WebSocket 连接与本地 API 桥接，把网页操作连接到本机工具链。']},
        {code:'03 / CLI agents',label:['Execute','执行'],detail:['Claude Code or Codex runs locally. Background tasks and notifications help keep longer work manageable away from the terminal.','Claude Code 或 Codex 在本机运行。后台任务与通知，让离开终端后的长任务也有入口可查。']}
      ],
      takeaway:['Make starting, resuming, checking and recovering a session predictable.','把启动、续接、查看与恢复这几条路径做顺。'],
      href:'https://2006038.xyz/projects/webcoding-cli-agent-workbench/',status:['In progress in the May project note','5 月项目记录：开发中']
    },
    {
      title:['An answer with a trail.','让答案有迹可循。'],tab:['Evidence','证据检索'],meta:['ARCHITECTURE STUDY · MAR 2026','架构学习笔记 · 2026.03'],stack:'Agentic RAG / narrarc',
      deck:['A study of narrarc: rebuild conversation history into useful structure, then make each answer traceable to its evidence.','学习 narrarc 的架构：先把聊天历史整理成可推理的结构，再让答案能回到具体证据。'],
      steps:[
        {code:'01 / Build',label:['Structure','结构化'],detail:['Group messages in time, identify topic nodes and anchors, then connect related nodes into semantic threads.','按时间聚合消息，形成话题节点与锚点，再把相关节点串成语义线程。']},
        {code:'02 / Q1 → Q5',label:['Retrieve','检索'],detail:['Parse intent, recall anchors, expand context, organise narrative stages, then format the answer with evidence.','解析意图、召回锚点、扩展上下文、组织叙事阶段，最后输出带证据的答案。']},
        {code:'03 / Evidence',label:['Trace back','回溯'],detail:['Keep conclusions connected to message-level sources. Separate training and test material when evaluating the retrieval workflow.','把结论连接到消息级来源。评估检索流程时，区分调参与测试材料。']}
      ],
      takeaway:['Give the reader a path from the conclusion back to the original message.','从结论回到原始消息，应该有一条可走的路。'],
      href:'https://2006038.xyz/archive/narrarc-agentic-rag-architecture-note/',status:['Architecture reading note','架构阅读笔记']
    }
  ];
  const chapters=[
    ['#start',['Opening','开场']],['#journal',['Journal','随笔']],['#work',['Work','作品']],
    ['#systems',['Working notes','工作笔记']],['#collection',['Collection','收藏']],['#end-note',['Colophon','页尾']]
  ];
  let selected=0,stepSelections=[0,0,0],panels=[],revision=0,chapter=0,metrics={},lastAuto=-1,ignoreAuto=false;
  const animations=new Set();
  function animate(el,frames,options){
    const a=el.animate(frames,{duration:700,easing:'cubic-bezier(.16,1,.3,1)',...options});animations.add(a);
    a.finished.catch(()=>{}).finally(()=>animations.delete(a));return a;
  }
  function render(){
    revision++;animations.forEach(a=>a.cancel());animations.clear();
    $('.systems-heading h2').innerHTML=T('Under the<br><em>surface.</em>','往里，<br><em>再看一层。</em>');
    $('.systems-heading .meta').textContent=T('03 / WORKING NOTES','03 / 工作笔记');
    $('.systems-heading p').textContent=T('Three systems, a few useful decisions. Open a step to see what happens inside.','三条技术线索，几处值得留下的取舍。点开流程，看看里面发生了什么。');
    $('.systems-bottom>span:first-child').textContent=T('SCROLL TO TURN · OR CHOOSE A NOTE','滚动翻阅 · 也可直接选择');
    $('.systems-bottom>span:last-child').textContent=T('FROM THE PROJECTS & READING ARCHIVE','整理自项目记录与阅读笔记');
    if(!wide.matches||reduced.matches)$('.systems-bottom>span:first-child').textContent=T('CHOOSE A NOTE · OPEN A STEP','选择笔记 · 点开流程');
    $('.collection-label').textContent=T('04 / COLLECTION','04 / 收藏');
    tabs.setAttribute('aria-label',T('Working notes','工作笔记'));
    tabs.innerHTML=notes.map((note,i)=>`<button id="system-tab-${i}" role="tab" aria-controls="system-panel-${i}" aria-selected="${i===selected}" tabindex="${i===selected?0:-1}" data-system="${i}"><small>0${i+1}</small><span>${T(...note.tab)}</span></button>`).join('');
    stage.innerHTML=notes.map((note,i)=>`<article id="system-panel-${i}" class="system-panel" role="tabpanel" aria-labelledby="system-tab-${i}" ${i===selected?'':'hidden'}><div class="system-top"><span>${T(...note.meta)}</span><code>${note.stack}</code></div><h3>${T(...note.title)}</h3><p class="system-deck">${T(...note.deck)}</p><div class="system-flow" role="group" aria-label="${T('Explore the workflow','探索流程')}">${note.steps.map((step,j)=>`<button class="flow-step" type="button" data-step="${j}" aria-controls="system-detail-${i}" aria-pressed="${stepSelections[i]===j}"><small>${step.code}</small><span>${T(...step.label)}</span></button>`).join('')}</div><div class="system-detail" id="system-detail-${i}" aria-live="polite"><span>${T('DETAIL','细节')} / 0${stepSelections[i]+1}</span><p>${T(...note.steps[stepSelections[i]].detail)}</p></div><div class="system-foot"><p>${T(...note.takeaway)}</p><a href="${note.href}">${T('Read the source note ↗','阅读原文 ↗')}</a></div><span class="sr-only">${T(...note.status)}</span></article>`).join('');
    panels=$$('.system-panel');
    $$('[data-system]').forEach(button=>button.addEventListener('click',()=>selectNote(Number(button.dataset.system),true)));
    panels.forEach((panel,i)=>$$('[data-step]',panel).forEach(button=>button.addEventListener('click',()=>{
      const step=Number(button.dataset.step);stepSelections[i]=step;
      $$('[data-step]',panel).forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.step)===step)));
      $('.system-detail>span',panel).textContent=`${T('DETAIL','细节')} / 0${step+1}`;
      const text=$('.system-detail p',panel);text.textContent=T(...notes[i].steps[step].detail);
      if(!reduced.matches)animate(text,[{opacity:0,transform:'translateY(9px)'},{opacity:1,transform:'none'}],{duration:350});
    })));
    dock.setAttribute('aria-label',T('Home chapters','首页章节'));
    $('[data-chapter-prev]').setAttribute('aria-label',T('Previous chapter','上一章'));
    $('[data-chapter-next]').setAttribute('aria-label',T('Next chapter','下一章'));
    updateDock();measure();window.dispatchEvent(new Event('layoutchange'));prepareEntrances();
  }
  async function selectNote(index,fromControl=false){
    if(index===selected)return;
    const myRevision=++revision,previous=panels[selected],next=panels[index],direction=index>selected?1:-1;
    selected=index;
    animations.forEach(a=>a.cancel());animations.clear();
    panels.forEach((panel,i)=>{panel.hidden=i!==index;panel.inert=i!==index;});
    $$('[data-system]').forEach((button,i)=>{button.setAttribute('aria-selected',String(i===index));button.tabIndex=i===index?0:-1;});
    if(previous.contains(document.activeElement))$(`[data-system="${index}"]`).focus({preventScroll:true});
    if(fromControl&&metrics.pinned){
      ignoreAuto=true;
      // Direct selection changes the page immediately, then aligns the scroll chapter.
      window.scrollTo({top:metrics.systemTop+metrics.systemRange*(index/2),behavior:'instant'});
      lastAuto=index;ignoreAuto=false;
    }
    if(reduced.matches)return;
    const incoming=animate(next,[{opacity:0,transform:`translateX(${direction*28}px) rotateY(${direction*13}deg)`},{opacity:1,transform:'translateX(0) rotateY(0deg)'}],{duration:740});
    if(metrics.pinned){
      previous.hidden=false;previous.inert=true;previous.style.zIndex='2';next.style.zIndex='1';
      const outgoing=animate(previous,[{opacity:1,transform:'translateX(0) rotateY(0deg)'},{opacity:0,transform:`translateX(${-direction*55}px) rotateY(${-direction*24}deg)`}],{duration:470,easing:'cubic-bezier(.55,0,.2,1)'});
      await outgoing.finished.catch(()=>{});
      if(myRevision===revision){previous.hidden=true;previous.style.zIndex='';next.style.zIndex='';}
    }
    await incoming.finished.catch(()=>{});
  }
  tabs.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))return;
    event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?2:(selected+(event.key==='ArrowRight'||event.key==='ArrowDown'?1:2))%3;
    selectNote(next,true);$(`[data-system="${next}"]`).focus({preventScroll:true});
  });
  function absoluteTop(el){let top=0;while(el){top+=el.offsetTop;el=el.offsetParent;}return top;}
  function measure(){
    root.classList.add('scene-ready');
    root.style.setProperty('--hero-height',`${$('.hero').offsetHeight}px`);
    const pinned=wide.matches&&innerHeight>=800&&!reduced.matches;
    root.classList.toggle('systems-pinned',pinned);
    tabs.setAttribute('aria-orientation',wide.matches?'vertical':'horizontal');
    $('.systems-bottom>span:first-child').textContent=pinned?T('SCROLL TO TURN · OR CHOOSE A NOTE','滚动翻阅 · 也可直接选择'):T('CHOOSE A NOTE · OPEN A STEP','选择笔记 · 点开流程');
    metrics={pinned,h:innerHeight,heroHeight:$('.hero').offsetHeight,journalTop:absoluteTop($('#journal')),systemTop:absoluteTop(systems),systemRange:Math.max(1,systems.offsetHeight-$('.systems-sticky').offsetHeight),footerTop:absoluteTop($('#end-note')),chapters:chapters.map(([s])=>absoluteTop($(s))),reading:$$('.reading-prose h2').map(el=>({el,top:absoluteTop(el)}))};
    lastAuto=-1;
  }
  function updateDock(){
    $('.chapter-position>span').textContent=T(...chapters[chapter][1]);$('.chapter-position>small').textContent=`0${chapter} / 05`;
    $('[data-chapter-prev]').disabled=chapter===0;$('[data-chapter-next]').disabled=chapter===chapters.length-1;
  }
  function turnChapter(direction){
    const index=Math.max(0,Math.min(chapters.length-1,chapter+direction)),[selector,label]=chapters[index];
    window.JournalMotion.turnToElement($(selector),T(...label));
  }
  $('[data-chapter-prev]').addEventListener('click',()=>turnChapter(-1));$('[data-chapter-next]').addEventListener('click',()=>turnChapter(1));
  function paint(){
    if(document.body.dataset.view==='reading'){
      let active=metrics.reading?.[0]?.el;
      metrics.reading?.forEach(({el,top})=>{if(scrollY+innerHeight*.3>=top)active=el;});
      $$('.reading-grid aside a').forEach(a=>{if(active&&a.hash===`#${active.id}`)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
    }
    if(document.body.dataset.view!=='home')return;
    if(!metrics.chapters)return;
    let next=0;metrics.chapters.forEach((top,i)=>{if(scrollY+innerHeight*.32>=top)next=i;});
    if(next!==chapter){chapter=next;updateDock();}
    const hide=scrollY<70||scrollY+innerHeight*.78>metrics.footerTop;
    dock.dataset.hidden=String(hide);dock.inert=hide;
    dock.style.setProperty('--chapter-progress',clamp(scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight)));
    const p=clamp(scrollY/Math.max(1,metrics.heroHeight));
    if(metrics.pinned){
      $('.hero').style.transform=`scale(${1-p*.055}) translateY(${-p*12}px)`;
      const entry=clamp((innerHeight-(metrics.journalTop-scrollY))/innerHeight);
      $('#journal').style.transform=`perspective(1600px) rotateX(${(1-entry)*4}deg)`;
      $('#journal').style.setProperty('--page-radius',`${(1-entry)*26}px`);
      $('#journal').style.setProperty('--edge-progress',String(clamp(entry*1.4)));
      const progress=clamp((scrollY-metrics.systemTop)/metrics.systemRange);
      systems.style.setProperty('--system-progress',progress);
      const auto=Math.min(2,Math.floor(progress*3));
      if(!ignoreAuto&&scrollY>=metrics.systemTop-innerHeight*.1&&scrollY<=metrics.systemTop+metrics.systemRange+innerHeight*.3&&auto!==lastAuto){lastAuto=auto;selectNote(auto);}
    }else{
      $('.hero').style.transform='';$('#journal').style.transform='';systems.style.setProperty('--system-progress',String(selected/2));
    }
  }
  const entrances=new WeakMap();
  const entranceObserver=new IntersectionObserver(items=>items.forEach(entry=>{
    const el=entry.target;
    if(!entry.isIntersecting){entrances.set(el,false);return;}
    if(reduced.matches||entrances.get(el))return;
    entrances.set(el,true);
    const index=Number(el.dataset.entranceIndex||0),reading=el.closest('.reading-prose');
    animate(el,[{opacity:.12,transform:`translate3d(0,${reading?18:35}px,0) rotateX(${reading?0:5}deg)`},{opacity:1,transform:'translate3d(0,0,0) rotateX(0deg)'}],{duration:reading?600:850,delay:Math.min(index%3*65,130)});
  }),{threshold:.12,rootMargin:'0px 0px -5% 0px'});
  function prepareEntrances(){
    $$('.journal-row,.work-art,.object-card,.project-entry,.about-text>p,.reading-prose>*,.inner-footer,.systems-heading,.footer-signature,.footer-top,.collection-selector button,.selected-object').forEach((el,i)=>{el.dataset.entranceIndex=String(i);entranceObserver.observe(el);});
  }
  reduced.addEventListener('change',()=>{if(reduced.matches){animations.forEach(a=>a.cancel());animations.clear();panels.forEach((panel,i)=>panel.hidden=i!==selected);}measure();paint();});
  wide.addEventListener('change',measure);
  addEventListener('languagechange',render);
  window.JournalScenes={measure,paint};
  render();
})();
