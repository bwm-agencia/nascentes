// Topbar solid state
// Availability bar
// ---------- Calendário de disponibilidade ----------
(function(){
  const MES=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const MES3=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  const SEM=['D','S','T','Q','Q','S','S'];
  const SEM3=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const pop=document.getElementById('cal-pop'), months=document.getElementById('cal-months');
  const fIn=document.getElementById('checkin-field'), fOut=document.getElementById('checkout-field');
  const hint=document.getElementById('cal-hint'), sum=document.getElementById('cal-summary'), msg=document.getElementById('avail-msg');
  const today=new Date(); today.setHours(0,0,0,0);
  let ci=null, co=null, view=new Date(today.getFullYear(), today.getMonth(), 1), picking='in';
  const same=(a,b)=>a&&b&&a.getTime()===b.getTime();
  const nights=()=>ci&&co?Math.round((co-ci)/864e5):0;
  const longF=d=>`${SEM3[d.getDay()]}, ${String(d.getDate()).padStart(2,'0')} ${MES3[d.getMonth()]} ${d.getFullYear()}`;
  const brF=d=>`${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  const nMonths=()=>window.innerWidth>=760?2:1;
  function labels(){
    document.getElementById('checkin-label').textContent=ci?longF(ci):'Data de Entrada';
    document.getElementById('checkout-label').textContent=co?longF(co):'Data de Saída';
    fIn.classList.toggle('filled',!!ci); fOut.classList.toggle('filled',!!co);
    fIn.classList.toggle('active',!pop.hidden&&picking==='in'); fOut.classList.toggle('active',!pop.hidden&&picking==='out');
    hint.textContent=picking==='in'?'Escolha a data de entrada':'Agora, a data de saída';
    sum.textContent=ci&&co?`${nights()} ${nights()>1?'noites':'noite'} · ${brF(ci)} a ${brF(co)}`:(ci?`Entrada ${brF(ci)}`:'');
  }
  function render(){
    months.innerHTML='';
    for(let k=0;k<nMonths();k++){
      const first=new Date(view.getFullYear(), view.getMonth()+k, 1);
      const m=document.createElement('div'); m.className='cal-month';
      let h=`<p class="cal-title">${MES[first.getMonth()]} ${first.getFullYear()}</p><div class="cal-grid">`+SEM.map(s=>`<span class="cal-dow">${s}</span>`).join('');
      for(let i=0;i<first.getDay();i++) h+='<span></span>';
      const dim=new Date(first.getFullYear(), first.getMonth()+1, 0).getDate();
      for(let d=1; d<=dim; d++){
        const dt=new Date(first.getFullYear(), first.getMonth(), d);
        let cls='cal-day', dis=dt<today || (picking==='out'&&ci&&dt<=ci);
        if(same(dt,today)) cls+=' today';
        if(same(dt,ci)) cls+=' start';
        if(same(dt,co)) cls+=' end';
        if(ci&&co&&dt>ci&&dt<co) cls+=' range';
        h+=`<button type="button" class="${cls}" data-t="${dt.getTime()}" ${dis?'disabled':''} aria-label="${longF(dt)}">${d}</button>`;
      }
      m.innerHTML=h+'</div>'; months.appendChild(m);
    }
    const prevDisabled=view.getFullYear()===today.getFullYear()&&view.getMonth()===today.getMonth();
    document.getElementById('cal-prev').disabled=prevDisabled;
    labels();
  }
  function open(which){
    picking=which==='out'&&ci?'out':'in';
    const base=picking==='out'&&ci?ci:(ci||today);
    view=new Date(base.getFullYear(), base.getMonth(), 1);
    pop.hidden=false; fIn.setAttribute('aria-expanded','true'); fOut.setAttribute('aria-expanded','true');
    msg.hidden=true; render();
    if(window.innerWidth<760) pop.scrollIntoView({behavior:'smooth',block:'nearest'});
  }
  function close(){ pop.hidden=true; fIn.setAttribute('aria-expanded','false'); fOut.setAttribute('aria-expanded','false'); labels(); }
  fIn.addEventListener('click',e=>{ e.stopPropagation(); open('in'); });
  fOut.addEventListener('click',e=>{ e.stopPropagation(); open('out'); });
  months.addEventListener('click',e=>{
    const b=e.target.closest('.cal-day'); if(!b||b.disabled) return; e.stopPropagation();
    const dt=new Date(+b.dataset.t);
    if(picking==='in'){ ci=dt; if(co&&co<=ci) co=null; picking='out'; render(); }
    else { co=dt; render(); setTimeout(close,250); }
  });
  document.getElementById('cal-prev').addEventListener('click',e=>{ e.stopPropagation(); view=new Date(view.getFullYear(), view.getMonth()-1, 1); render(); });
  document.getElementById('cal-next').addEventListener('click',e=>{ e.stopPropagation(); view=new Date(view.getFullYear(), view.getMonth()+1, 1); render(); });
  document.getElementById('cal-clear').addEventListener('click',e=>{ e.stopPropagation(); ci=co=null; picking='in'; render(); });
  document.getElementById('cal-ok').addEventListener('click',e=>{ e.stopPropagation(); close(); });
  pop.addEventListener('click',e=>e.stopPropagation());
  document.addEventListener('click',()=>{ if(!pop.hidden) close(); });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&!pop.hidden) close(); });
  window.addEventListener('resize',()=>{ if(!pop.hidden) render(); });
  document.getElementById('avail-submit').addEventListener('click',e=>{
    e.stopPropagation();
    if(!ci||!co){ msg.textContent=!ci?'Escolha a data de entrada para continuar.':'Escolha a data de saída para continuar.'; msg.hidden=false; open(!ci?'in':'out'); return; }
    const n=nights();
    const text=`Olá! Gostaria de verificar a disponibilidade para:\n\n• Check-in: ${longF(ci)}\n• Check-out: ${longF(co)}\n• ${n} ${n>1?'noites':'noite'}\n\nPodem me ajudar?`;
    window.open('https://api.whatsapp.com/send?phone=5514991797722&text='+encodeURIComponent(text),'_blank','noopener');
  });
  labels();
})();

const topbar = document.querySelector('.topbar');
const onScroll = () => { topbar.classList.toggle('solid', window.scrollY > 60); };
window.addEventListener('scroll', onScroll); onScroll();

// Full nav toggle
const menuBtn = document.querySelector('.menu-btn');
const fullnav = document.querySelector('.fullnav');
menuBtn.addEventListener('click', () => {
  const open = fullnav.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', open);
});
fullnav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => fullnav.classList.remove('open')));

// Reel arrows
const reel = document.querySelector('.reel');
document.querySelector('.reel-prev').addEventListener('click', () => reel.scrollBy({left: -360, behavior:'smooth'}));
document.querySelector('.reel-next').addEventListener('click', () => reel.scrollBy({left: 360, behavior:'smooth'}));

// Reveal on scroll
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); } });
  }, { threshold: 0.15 });
  revealEls.forEach(el => io.observe(el));
} else { revealEls.forEach(el => el.classList.add('in')); }
