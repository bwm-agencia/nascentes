/* Medição de conversões (WhatsApp) e visualização de ofertas.
   Envia eventos ao dataLayer (o GTM lê). Sem consentimento o GTM nem carrega,
   então nada é enviado ao Google. O Pixel só existe se o visitante aceitou marketing. */
(function () {
  window.dataLayer = window.dataLayer || [];

  function tipoDaPagina(p) {
    if (p === '/') return 'home';
    var s = p.split('/').filter(Boolean);
    var m = { pacotes: 'pacote', suites: 'suite', blog: 'guia', experiencia: 'experiencia', 'cafe-da-manha': 'cafe_da_manha', 'lua-de-mel': 'lua_de_mel', localizacao: 'localizacao' };
    var base = m[s[0]] || s[0] || 'pagina';
    var comLista = s[0] === 'pacotes' || s[0] === 'suites' || s[0] === 'blog';
    return comLista && s.length === 1 ? base + '_lista' : base;
  }
  // Nome estável do item = o final do endereço (ex.: consciencia-negra, amarula)
  function nomeDoItem() {
    var s = location.pathname.replace(/\.html$/, '').split('/').filter(Boolean);
    return s.length > 1 ? s[s.length - 1] : '';
  }
  function localDoBotao(a) {
    if (a.closest('.topbar, nav, .fullnav')) return 'menu';
    if (a.closest('footer')) return 'rodape';
    if (a.closest('.hero, .subhero')) return 'topo';
    if (a.closest('.package-card, .pkg-card, .bl-card')) return 'cartao';
    if (a.closest('.final-cta, .cta-final, [class*="final"]')) return 'chamada_final';
    return 'conteudo';
  }

  // 1) Clique em qualquer link do WhatsApp
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href*="api.whatsapp.com"], a[href*="wa.me"]');
    if (!a) return;
    var path = location.pathname.replace(/\.html$/, '').replace(/\/index$/, '') || '/';
    var tipo = tipoDaPagina(path);
    window.dataLayer.push({
      event: 'whatsapp_click',
      page_type: tipo,
      item_name: /^(pacote|suite|guia)$/.test(tipo) ? nomeDoItem() : '',
      button_location: localDoBotao(a),
      link_text: (a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60)
    });
    if (typeof window.fbq === 'function') window.fbq('track', 'Contact');
  }, true);

  // 2) Visualização de uma página de pacote ou de suíte
  var path = location.pathname.replace(/\.html$/, '');
  if (/^\/(pacotes|suites)\/[^/]+$/.test(path)) {
    window.dataLayer.push({
      event: 'view_item',
      page_type: path.indexOf('/pacotes/') === 0 ? 'pacote' : 'suite',
      item_name: nomeDoItem()
    });
  }
})();
