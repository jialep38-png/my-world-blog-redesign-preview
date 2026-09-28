/* Interface copy. Article excerpts retain their original language. */
(() => {
  'use strict';
  let language = 'en';
  try { if (localStorage.getItem('ji-feng-language') === 'zh') language = 'zh'; } catch {}
  const copy = [
    ['.skip-link', '跳到正文'],
    ['.main-nav a[data-route="essay"]', '随笔'],
    ['.main-nav a[data-route="projects"]', '作品'],
    ['.main-nav a[data-route="planets"]', '收藏'],
    ['.main-nav a[data-route="about"]', '关于'],
    ['.menu-toggle>span', '目录'],
    ['.menu-heading>span:first-child', '小圈目录'],
    ['.site-menu nav a:nth-child(1)>span', '首页'],
    ['.site-menu nav a:nth-child(2)>span', '随笔'],
    ['.site-menu nav a:nth-child(3)>span', '作品'],
    ['.site-menu nav a:nth-child(4)>span', '收藏'],
    ['.site-menu nav a:nth-child(5)>span', '关于'],
    ['.menu-bottom a:first-child', '归档 ↗'],
    ['[data-replay]', '重播开场 ↺'],
    ['.intro-note', '一方小世界，慢慢展开。'],
    ['.intro-status', '正在展开'],
    ['.intro-type', '一方小圈。<em>自在生长。</em>'],
    ['.turn-foot', '<i></i>JI_FENG / 个人笔记'],
    ['.hero-copy>.meta', '<i class="square"></i> 霁风的个人空间'],
    ['#hero-title', '一方<br><em>小世界。</em>'],
    ['.hero-description', '写一些字，做一些东西。<br>也留住一些日常。'],
    ['.hero-copy>.text-link', '往里看看 <span>↘</span>'],
    ['.object-coordinate', '形态 01 — 连续'],
    ['.object-caption', '移动鼠标，换一个角度'],
    ['.hero-foot>a', '向下探索 <span>↓</span>'],
    ['.hero-foot>.meta:last-child', '自由生长 / 持续更新'],
    ['.home-journal .section-top>.meta', '01 / 随笔'],
    ['.home-journal .quiet-link', '全部随笔 <span>↗</span>'],
    ['#journal-title', '边走，<br><em>边想。</em>'],
    ['.section-copy>p', '记录路上的一点想法。'],
    ['.work-top>.meta', '02 / 作品'],
    ['.work-top>.quiet-link', '全部作品 <span>↗</span>'],
    ['.index-label', '正在探索'],
    ['.work-slide:nth-child(1) h2', '少些寻找，<br><em>多些阅读。</em>'],
    ['.work-slide:nth-child(1) .work-description>p', '一个给自己的论文雷达。<br>筛选研究，也理清思路。'],
    ['.work-slide:nth-child(2) h2', '熟悉的工具，<br><em>新的窗口。</em>'],
    ['.work-slide:nth-child(2) .work-description>p', '在浏览器里，<br>继续本地的开发工作。'],
    ['.work-slide:nth-child(1) .art-corner', '01 — 研究工具'],
    ['.work-slide:nth-child(2) .art-corner', '02 — 本地工作台'],
    ['.work-bottom>span:first-child', '继续向前'],
    ['.bridge-caption', '总有一些，想留下来'],
    ['.collection-label', '03 / 收藏'],
    ['#collection-title', '微小事物，<br><em>绵长回响。</em>'],
    ['.constellation-copy>.text-link', '走进收藏 <span>↗</span>'],
    ['.cloud-foot>span:first-child', '音乐、记忆与小世界'],
    ['.collection-shelf .section-top>.meta', '收藏选集 / 3 OF 5'],
    ['.collection-shelf .quiet-link', '查看全部 <span>↗</span>'],
    ['.footer-top>span:first-child', '一本敞开的笔记。'],
    ['.footer-top>span:last-child', '谢谢你来。'],
    ['.footer-signature', '下次见。<span>↗</span>'],
    ['.footer-bottom a[href$="/archive/"]', '归档 ↗'],
    ['[data-top]', '回到顶部 ↑'],
    ['.journal-view .page-heading>.meta', '01 / 随笔'],
    ['.journal-view h1', '沿途，<br><em>记几笔。</em>'],
    ['.journal-view .page-heading>p', '观察、尝试，以及新学到的东西。'],
    ['[data-filter="all"]', '全部'],
    ['[data-filter="notes"]', '笔记'],
    ['[data-filter="building"]', '构建'],
    ['.journal-view .inner-footer>.meta', '笔记还在继续。'],
    ['.journal-view .inner-footer>a', '完整归档 <span>↗</span>'],
    ['.projects-view .page-heading>.meta', '02 / 作品'],
    ['.projects-view h1', '把想法，<br><em>做出来。</em>'],
    ['.projects-view .page-heading>p', '一些工具，一些实验。还在慢慢打磨。'],
    ['.project-entry:nth-child(1) .meta', '01 / 研究工具'],
    ['.project-entry:nth-child(1) p', '每日论文雷达，配上简明的研究摘要。'],
    ['.project-entry:nth-child(2) .meta', '02 / 本地工作台'],
    ['.project-entry:nth-child(2) p', '通向本地智能体工作流的浏览器窗口。'],
    ['.projects-view .inner-footer>.meta', '持续打磨中。'],
    ['.projects-view .inner-footer>a', '项目归档 <span>↗</span>'],
    ['.collection-heading>.meta', '03 / 物件与记忆'],
    ['.collection-heading h1', '小小<em>世界。</em>'],
    ['.collection-heading>p', '五首歌，换一种样子保存。'],
    ['[data-object-link]', '打开 3D 视图 ↗'],
    ['.collection-end>span:first-child', '认真收藏。'],
    ['.about-view .page-heading>.meta', '04 / 关于我'],
    ['.about-view h1', '你好，<br><em>我是霁风。</em>'],
    ['.about-text>p:nth-child(1)', '在互联网的一角，<br>留下做过、学过、珍惜过的事。'],
    ['.about-text>p:nth-child(2)', '有些文字已经想清楚了。<br>有些，只是一个开始。'],
    ['.about-links a:nth-child(2)', '更多关于我 ↗'],
    ['.about-view .inner-footer>.meta', '慢慢看，不着急。'],
    ['.about-view .inner-footer>a', '读读随笔 <span>↗</span>'],
    ['.reading-header>.quiet-link', '← 随笔'],
    ['.reading-header>.meta', '2026 年 5 月 10 日 / 构建'],
    ['.reading-header h1', '重新，<br><em>接上线。</em>'],
    ['.reading-grid aside>.meta', '本文目录'],
    ['a[href="#reading-open"]', '01 / 先把入口打开'],
    ['a[href="#reading-order"]', '02 / 给内容找个位置'],
    ['a[href="#reading-process"]', '03 / 把过程留下来'],
    ['.reading-prose>.text-link', '阅读全文 <span>↗</span>'],
    ['.preview-note', '设计预览 <span>05</span>'],
  ].map(([selector, zh]) => {
    const el = document.querySelector(selector);
    return { el, zh, en: el?.innerHTML };
  });
  const labels = [
    ['.brand','Ji Feng, home','霁风，首页'],
    ['.main-nav','Main navigation','主导航'],
    ['.site-menu nav','Site index','网站目录'],
    ['.journal-toolbar>div','Filter journal entries','筛选随笔'],
    ['.collection-selector','Choose an object','选择收藏'],
    ['.reading-grid aside','On this page','本文目录'],
    ['.work-journey','Selected work','精选作品'],
    ['.bridge','Transition to the collection','进入收藏'],
    ['[data-chapter="0"]','Project 01, arXiv Reader','作品 01，arXiv Reader'],
    ['[data-chapter="1"]','Project 02, Webcoding','作品 02，Webcoding'],
  ];
  function apply(notify = true) {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
    copy.forEach(({el,en,zh}) => { if(el) { el.innerHTML = language === 'zh' ? zh : en; if(el.matches('h1,h2')) el.removeAttribute('aria-label'); } });
    labels.forEach(([s,en,zh]) => document.querySelector(s)?.setAttribute('aria-label',language === 'zh' ? zh : en));
    document.querySelectorAll('[data-language]').forEach(button => {
      button.setAttribute('aria-pressed',String(button.dataset.language === language));
    });
    if(notify) window.dispatchEvent(new CustomEvent('languagechange',{detail:language}));
  }
  document.querySelectorAll('[data-language]').forEach(button => button.addEventListener('click',() => {
    if(language === button.dataset.language) return;
    language = button.dataset.language;
    try { localStorage.setItem('ji-feng-language',language); } catch {}
    apply();
  }));
  window.JournalI18n = { choose:(en,zh) => language === 'zh' ? zh : en, get language(){ return language; } };
  apply(false);
})();
