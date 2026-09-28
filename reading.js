/* The reading room uses the author's existing, dated posts. */
(() => {
  'use strict';
  const posts=window.JournalPosts, $=(s,root=document)=>root.querySelector(s);
  const T=(en,zh)=>window.JournalI18n.choose(en,zh);
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let active='';
  function route(){
    const [path,query='']=location.hash.replace(/^#\//,'').split('?');
    const slug=path.startsWith('reading/')?path.slice(8):posts[0].slug;
    return {slug,section:new URLSearchParams(query).get('section')||(location.hash.startsWith('#reading-')?location.hash.slice(1):null)};
  }
  function render(){
    const {slug}=route(),post=posts.find(p=>p.slug===slug)||posts[0],index=posts.indexOf(post);
    active=post.slug;
    const header=$('.reading-header'),aside=$('.reading-grid aside'),body=$('.reading-prose');
    header.innerHTML=`<a href="#/essay" class="quiet-link">${T('← Journal','← 随笔')}</a><div class="reading-meta"><span>${post.date.replaceAll('-','.')} / ${T(post.type.toUpperCase(),post.type==='building'?'构建':'笔记')}</span><span>${T(`ABOUT ${post.minutes} MIN · ORIGINAL IN CHINESE`,`约 ${post.minutes} 分钟 · 原文`)}</span></div><h1>${escape(T(post.en,post.zh))}</h1><p class="reading-deck">${escape(T(post.summaryEn,post.summary))}</p><div class="reading-byline"><span>JI_FENG / 霁风</span><a href="${post.source}">${T('Original archive ↗','原站归档 ↗')}</a></div>`;
    aside.innerHTML=`<span class="meta">${T('ON THIS PAGE','本文目录')}</span>${post.headings.map((h,i)=>`<a href="#/reading/${post.slug}?section=${h.id}" data-reading-anchor="${h.id}"><small>${String(i+1).padStart(2,'0')}</small><span>${escape(h.text)}</span></a>`).join('')}<span class="reading-toc-foot">${T('A NOTE TO RETURN TO.','留给以后，再读一遍。')}</span>`;
    aside.setAttribute('aria-label',T('On this page','本文目录'));
    body.innerHTML=post.html;
    let foot=$('.reading-neighbours');
    if(!foot){foot=document.createElement('nav');foot.className='reading-neighbours';$('.reading-view').append(foot);}
    foot.setAttribute('aria-label',T('Continue reading','继续阅读'));
    const previous=posts[(index+posts.length-1)%posts.length],next=posts[(index+1)%posts.length];
    foot.innerHTML=`<a href="#/reading/${previous.slug}"><span>${T('PREVIOUS NOTE','上一篇')}</span><strong>${escape(T(previous.en,previous.zh))}</strong><i>↖</i></a><a href="#/reading/${next.slug}"><span>${T('NEXT NOTE','下一篇')}</span><strong>${escape(T(next.en,next.zh))}</strong><i>↗</i></a>`;
    document.title=`${T(post.en,post.zh)} / Ji_Feng`;
    window.dispatchEvent(new Event('contentchange'));
  }
  function target(){const id=route().section;return id?document.getElementById(id):null;}
  function sync(){const post=posts.find(p=>p.slug===active);if(post)document.title=`${T(post.en,post.zh)} / Ji_Feng`;}
  addEventListener('languagechange',()=>{if(document.body.dataset.view==='reading')render();});
  window.JournalReader={render,route,target,sync,get key(){return active;}};

  // A paper preview follows focus as well as the pointer; the link still opens directly.
  const preview=document.createElement('a');preview.className='journal-preview';
  $('.home-journal .section-copy').append(preview);
  let previewIndex=0,previewAnimation;
  const picks=[posts[0],posts[5],posts[3]];
  function previewPost(index,animate=true){
    previewIndex=index;const post=picks[index];preview.href=`#/reading/${post.slug}`;
    preview.innerHTML=`<div class="preview-sheet"><span class="preview-folio">${String(index+1).padStart(2,'0')} / 03</span><span class="preview-category">${T('FROM THE NOTEBOOK','从笔记里')}</span><strong>${escape(T(post.en,post.zh))}</strong><p>${escape(T(post.summaryEn,post.summary))}</p><span class="preview-read">${T('Read this note','读这一篇')} <i>↗</i></span></div>`;
    document.querySelectorAll('[data-journal="home"] .journal-row').forEach((row,i)=>row.dataset.selected=String(i===index));
    previewAnimation?.cancel();
    if(animate&&!matchMedia('(prefers-reduced-motion:reduce)').matches)previewAnimation=$('.preview-sheet',preview).animate([{opacity:0,transform:'translateY(15px) rotate(-2deg)'},{opacity:1,transform:'translateY(0) rotate(0deg)'}],{duration:460,easing:'cubic-bezier(.16,1,.3,1)'});
  }
  function bindPreview(){
    document.querySelectorAll('[data-journal="home"] .journal-row').forEach((row,i)=>{
      row.addEventListener('pointerenter',()=>previewPost(i));row.addEventListener('focus',()=>previewPost(i));
    });previewPost(previewIndex,false);
  }
  addEventListener('languagechange',()=>previewPost(previewIndex,false));
  addEventListener('DOMContentLoaded',bindPreview,{once:true});
})();
