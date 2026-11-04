/* Fogos de artifício decorativos (canvas). Pausa fora da tela e respeita "reduzir movimento". */
(function(){
  if(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var cores=['#ffd36e','#fff3d6','#ff8a7a','#9fd0ff','#ffb347','#f2c879'];
  document.querySelectorAll('canvas.fx-fogos').forEach(function(cv){
    var ctx=cv.getContext('2d'), W=0,H=0,dpr=Math.min(window.devicePixelRatio||1,2), ps=[], next=0, raf=0, on=false, last=0;
    function size(){ var r=cv.getBoundingClientRect(); W=r.width; H=r.height; cv.width=Math.max(1,W*dpr); cv.height=Math.max(1,H*dpr); ctx.setTransform(dpr,0,0,dpr,0,0); }
    function burst(){
      var x=W*(.12+Math.random()*.76), y=H*(.14+Math.random()*.42), n=Math.round(30+Math.random()*26), c=cores[(Math.random()*cores.length)|0], c2=cores[(Math.random()*cores.length)|0], sp=Math.min(W,H)*(.0042+Math.random()*.0026);
      for(var i=0;i<n;i++){ var a=Math.PI*2*i/n+Math.random()*.15, v=sp*(.55+Math.random()*.6); ps.push({x:x,y:y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:1,d:.011+Math.random()*.008,c:i%3?c:c2,s:2+Math.random()*1.8}); }
    }
    function frame(t){
      if(!on) return; raf=requestAnimationFrame(frame);
      var dt=Math.min(40,t-last||16)/16; last=t;
      ctx.globalCompositeOperation='destination-out'; ctx.fillStyle='rgba(0,0,0,.14)'; ctx.fillRect(0,0,W,H);
      ctx.globalCompositeOperation='lighter';
      if(t>next){ burst(); next=t+900+Math.random()*1500; }
      for(var i=ps.length-1;i>=0;i--){ var p=ps[i]; p.x+=p.vx*dt; p.y+=p.vy*dt; p.vx*=.985; p.vy=p.vy*.985+.0045*Math.min(W,H)*.01*dt; p.l-=p.d*dt;
        if(p.l<=0){ ps.splice(i,1); continue; }
        ctx.globalAlpha=Math.max(0,p.l); ctx.fillStyle=p.c; ctx.beginPath(); ctx.arc(p.x,p.y,p.s*(.5+p.l*.5),0,6.2832); ctx.fill(); }
      ctx.globalAlpha=1;
    }
    function start(){ if(on) return; on=true; last=0; raf=requestAnimationFrame(frame); }
    function stop(){ on=false; cancelAnimationFrame(raf); }
    size(); if('ResizeObserver' in window) new ResizeObserver(size).observe(cv); else window.addEventListener('resize',size);
    if('IntersectionObserver' in window) new IntersectionObserver(function(es){ es[0].isIntersecting?start():stop(); }).observe(cv); else start();
    document.addEventListener('visibilitychange',function(){ document.hidden?stop():start(); });
  });
})();
