const topbar=document.querySelector('.topbar');
const onScroll=()=>{ topbar.classList.toggle('solid', window.scrollY>60); };
window.addEventListener('scroll',onScroll); onScroll();
const menuBtn=document.querySelector('.menu-btn'), fullnav=document.querySelector('.fullnav');
menuBtn.addEventListener('click',()=>{ const o=fullnav.classList.toggle('open'); menuBtn.setAttribute('aria-expanded',o); });
fullnav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>fullnav.classList.remove('open')));
const els=document.querySelectorAll('.reveal');
if('IntersectionObserver' in window){ const io=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} }),{threshold:.12}); els.forEach(el=>io.observe(el)); }
else els.forEach(el=>el.classList.add('in'));


document.querySelectorAll('.bl-filter button').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('.bl-filter button').forEach(x=>x.setAttribute('aria-pressed','false'));
  b.setAttribute('aria-pressed','true'); const f=b.dataset.f; let n=0;
  document.querySelectorAll('#bl-grid .bl-card').forEach((c,i)=>{ const show=f==='all'||c.dataset.cat===f; c.hidden=!show; if(show)n++; c.classList.toggle('featured', f==='all'&&i===0); });
  document.getElementById('bl-empty').hidden=n>0;
}));
