/* Consentimento LGPD + carregamento condicional de GTM e Meta Pixel.
   Nada de rastreamento carrega antes da escolha do visitante. */
(function () {
  var KEY = 'nascentes_consent_v1';
  var me = document.currentScript || {};
  var GTM = me.getAttribute && me.getAttribute('data-gtm');
  var PIXEL = me.getAttribute && me.getAttribute('data-pixel');
  var loaded = { gtm: false, pixel: false };

  function read() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
  function write(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} }

  function loadGTM() {
    if (!GTM || loaded.gtm) return; loaded.gtm = true;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    var s = document.createElement('script'); s.async = true;
    s.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(GTM);
    document.head.appendChild(s);
  }
  function loadPixel() {
    if (!PIXEL || loaded.pixel) return; loaded.pixel = true;
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', PIXEL); window.fbq('track', 'PageView');
  }
  function applyConsent(c) {
    if (typeof gtag === 'function') {
      gtag('consent', 'update', {
        analytics_storage: c.a ? 'granted' : 'denied',
        ad_storage: c.m ? 'granted' : 'denied',
        ad_user_data: c.m ? 'granted' : 'denied',
        ad_personalization: c.m ? 'granted' : 'denied'
      });
    }
    if (c.a || c.m) loadGTM();
    if (c.m) loadPixel();
  }
  function clearCookies() {
    var host = location.hostname, parts = host.split('.'), doms = ['', host, '.' + host];
    if (parts.length > 2) doms.push('.' + parts.slice(-3).join('.'));
    if (parts.length > 1) doms.push('.' + parts.slice(-2).join('.'));
    document.cookie.split(';').forEach(function (k) {
      var n = k.split('=')[0].trim();
      if (/^(_ga|_gid|_gat|_gcl|_fbp|_fbc)/.test(n)) doms.forEach(function (d) {
        document.cookie = n + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + (d ? '; domain=' + d : '');
      });
    });
  }

  function css() {
    var s = document.createElement('style');
    s.textContent = '#cc{position:fixed;left:16px;bottom:16px;z-index:2147483000;max-width:380px;width:calc(100% - 32px);background:#1b0d0e;color:#F3EDE2;border:1px solid rgba(242,200,121,.35);border-radius:14px;padding:18px 18px 16px;font:14px/1.5 Manrope,system-ui,sans-serif;box-shadow:0 12px 40px rgba(0,0,0,.45)}' +
      '#cc h2{font:600 16px/1.3 Manrope,system-ui,sans-serif;margin:0 0 6px;color:#F2C879}#cc p{margin:0 0 12px;color:#e6dccd}#cc a{color:#F2C879}' +
      '#cc .r{display:flex;gap:8px;flex-wrap:wrap}#cc button{flex:1 1 0;min-width:96px;padding:10px 12px;border-radius:999px;border:1px solid #F2C879;background:transparent;color:#F2C879;font:600 13px Manrope,system-ui,sans-serif;cursor:pointer}' +
      '#cc button.p{background:#F2C879;color:#23090B}#cc button:focus-visible{outline:2px solid #fff;outline-offset:2px}#cc .l{display:block;margin-top:10px;background:none;border:0;padding:0;color:#F2C879;text-decoration:underline;font-weight:500;flex:none;cursor:pointer}' +
      '#cc fieldset{border:0;margin:0 0 12px;padding:0}#cc label{display:flex;gap:10px;align-items:flex-start;margin:0 0 10px}#cc label span small{display:block;color:#c6a29d}#cc input{margin-top:4px;accent-color:#E8A84C}' +
      '@media (min-width:640px){#cc{left:24px;bottom:24px}}@media (prefers-reduced-motion:no-preference){#cc{animation:ccin .25s ease-out}@keyframes ccin{from{opacity:0;transform:translateY(8px)}}}';
    document.head.appendChild(s);
  }

  var box;
  function close() { if (box) { box.remove(); box = null; } }
  function save(a, m) {
    var prev = read();
    var next = { a: !!a, m: !!m, t: Date.now() };
    write(next);
    var withdrew = prev && ((prev.a && !next.a) || (prev.m && !next.m));
    applyConsent(next);
    close();
    if (withdrew) { clearCookies(); location.reload(); }
  }
  function open(detail) {
    if (box) close();
    var cur = read() || { a: false, m: false };
    css();
    box = document.createElement('div');
    box.id = 'cc'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Preferências de cookies');
    box.innerHTML =
      '<h2>Cookies e privacidade</h2>' +
      '<p>Usamos cookies para medir o uso do site e melhorar nossos anúncios. Você escolhe. Saiba mais na <a href="/politica-de-cookies">Política de Cookies</a> e na <a href="/politica-de-privacidade">Política de Privacidade</a>.</p>' +
      '<div id="ccd" hidden><fieldset>' +
      '<label><input type="checkbox" checked disabled><span>Necessários<small>Guardam sua escolha de cookies. Sempre ativos.</small></span></label>' +
      '<label><input type="checkbox" id="cca"' + (cur.a ? ' checked' : '') + '><span>Estatísticas<small>Google Analytics: como o site é usado.</small></span></label>' +
      '<label><input type="checkbox" id="ccm"' + (cur.m ? ' checked' : '') + '><span>Marketing<small>Meta Pixel e anúncios: medir resultados das campanhas.</small></span></label>' +
      '</fieldset><div class="r"><button type="button" id="ccs" class="p">Salvar escolhas</button></div></div>' +
      '<div class="r" id="ccb"><button type="button" id="ccr">Rejeitar</button><button type="button" id="cco" class="p">Aceitar todos</button></div>' +
      '<button type="button" class="l" id="ccp">Personalizar</button>';
    document.body.appendChild(box);
    var d = box.querySelector('#ccd'), b = box.querySelector('#ccb'), p = box.querySelector('#ccp');
    function showDetail() { d.hidden = false; b.hidden = true; p.hidden = true; }
    box.querySelector('#cco').onclick = function () { save(true, true); };
    box.querySelector('#ccr').onclick = function () { save(false, false); };
    box.querySelector('#ccs').onclick = function () { save(box.querySelector('#cca').checked, box.querySelector('#ccm').checked); };
    p.onclick = showDetail;
    if (detail) showDetail();
  }

  var saved = read();
  if (saved) applyConsent(saved);
  function init() {
    if (!saved) open(false);
    document.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('[data-open-consent]');
      if (t) { e.preventDefault(); open(true); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
