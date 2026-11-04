const topbar=document.querySelector('.topbar');
const onScroll=()=>{ topbar.classList.toggle('solid', window.scrollY>60); };
window.addEventListener('scroll',onScroll); onScroll();
const menuBtn=document.querySelector('.menu-btn'), fullnav=document.querySelector('.fullnav');
menuBtn.addEventListener('click',()=>{ const o=fullnav.classList.toggle('open'); menuBtn.setAttribute('aria-expanded',o); });
fullnav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>fullnav.classList.remove('open')));
const agenda=document.getElementById('lp-agenda');
const revealEls=document.querySelectorAll('.reveal');
if('IntersectionObserver' in window){
  const io=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} }),{threshold:.15});
  revealEls.forEach(el=>io.observe(el));
  if(agenda){ const ia=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ setTimeout(()=>agenda.classList.add('struck'),500); ia.disconnect(); } }),{threshold:.6}); ia.observe(agenda); }
} else { revealEls.forEach(el=>el.classList.add('in')); if(agenda) agenda.classList.add('struck'); }
const reel=document.getElementById('lp-reel');
document.querySelector('.lp-prev').addEventListener('click',()=>reel.scrollBy({left:-320,behavior:'smooth'}));
document.querySelector('.lp-next').addEventListener('click',()=>reel.scrollBy({left:320,behavior:'smooth'}));
document.querySelectorAll('.lp-filter button').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('.lp-filter button').forEach(x=>x.setAttribute('aria-pressed','false'));
  b.setAttribute('aria-pressed','true');
  const f=b.dataset.f;
  reel.querySelectorAll('.lp-suite').forEach(s=>{ s.hidden = !(f==='all' || s.dataset.type===f); });
  reel.scrollTo({left:0,behavior:'smooth'});
}));
const sticky=document.getElementById('lp-sticky');
const hero=document.querySelector('.lp-hero'), fin=document.querySelector('.final-cta');
const upd=()=>{ const past=hero.getBoundingClientRect().bottom<0; const atEnd=fin.getBoundingClientRect().top<window.innerHeight; sticky.classList.toggle('show', past && !atEnd); };
window.addEventListener('scroll',upd,{passive:true}); upd();
