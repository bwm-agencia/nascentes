// Filtros, ordenação e mapa do ranking. Os cards já vêm renderizados no HTML
// (bom para SEO); aqui só reordenamos e escondemos o que não bate com os filtros.
(function () {
  var list = document.getElementById('list');
  var cards = Array.prototype.slice.call(list.querySelectorAll('.card'));
  var q = document.getElementById('q');
  var sort = document.getElementById('sort');
  var count = document.getElementById('count');
  var empty = document.getElementById('empty');
  var filtros = { tipo: '', regiao: '', estilo: '' };

  function normaliza(t) {
    return t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  var ordens = {
    score: function (a, b) { return b.dataset.score - a.dataset.score; },
    nota: function (a, b) { return b.dataset.nota - a.dataset.nota || b.dataset.avaliacoes - a.dataset.avaliacoes; },
    avaliacoes: function (a, b) { return b.dataset.avaliacoes - a.dataset.avaliacoes; },
    distancia: function (a, b) { return a.dataset.distancia - b.dataset.distancia; }
  };

  function aplica() {
    var termo = normaliza(q.value.trim());
    var visiveis = 0;
    cards.slice().sort(ordens[sort.value]).forEach(function (c) {
      var ok = (!termo || normaliza(c.dataset.nome).indexOf(termo) > -1) &&
        (!filtros.tipo || c.dataset.tipo === filtros.tipo) &&
        (!filtros.regiao || c.dataset.regiao === filtros.regiao) &&
        (!filtros.estilo || c.dataset.estilos.split('|').indexOf(filtros.estilo) > -1);
      c.hidden = !ok;
      if (ok) visiveis++;
      list.appendChild(c);
      var m = marcadores[c.dataset.id];
      if (m) m.setOpacity(ok ? 1 : 0.25);
    });
    count.textContent = visiveis === cards.length
      ? cards.length + ' hospedagens ranqueadas'
      : visiveis + ' de ' + cards.length + ' hospedagens';
    empty.hidden = visiveis > 0;
  }

  document.querySelectorAll('[data-filter]').forEach(function (grupo) {
    grupo.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      grupo.querySelectorAll('.chip').forEach(function (b) { b.setAttribute('aria-pressed', b === chip); });
      filtros[grupo.dataset.filter] = chip.dataset.v;
      aplica();
    });
  });
  q.addEventListener('input', aplica);
  sort.addEventListener('change', aplica);
  document.getElementById('reset').addEventListener('click', function () {
    q.value = '';
    sort.value = 'score';
    document.querySelectorAll('[data-filter] .chip').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.v === ''); });
    filtros = { tipo: '', regiao: '', estilo: '' };
    aplica();
  });

  function destaca(id) {
    var card = document.getElementById('h-' + id);
    if (!card) return;
    cards.forEach(function (c) { c.classList.remove('hl'); });
    card.classList.add('hl');
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Mapa (Leaflet + OpenStreetMap). Se a lib não carregar, o ranking segue funcionando.
  var marcadores = {};
  if (window.L && window.RANKING) {
    var mapa = L.map('map', { scrollWheelZoom: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap'
    }).addTo(mapa);
    var pontos = [];
    window.RANKING.itens.filter(function (i) { return i.ranqueado; }).forEach(function (i) {
      var icone = L.divIcon({
        className: '',
        html: '<div style="background:' + (i.posicao <= 3 ? '#e8a33d' : '#123a2c') +
          ';color:#fff;border:2px solid #fff;border-radius:50%;width:26px;height:26px;display:grid;place-items:center;font:600 12px Inter,sans-serif;box-shadow:0 1px 4px rgba(0,0,0,.35)">' + i.posicao + '</div>',
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });
      var m = L.marker([i.lat, i.lng], { icon: icone, title: i.nome, zIndexOffset: 100 - i.posicao })
        .addTo(mapa)
        .bindTooltip(i.posicao + 'º ' + i.nome + ' · ' + String(i.score).replace('.', ','));
      m.on('click', function () { destaca(i.id); });
      marcadores[i.id] = m;
      pontos.push([i.lat, i.lng]);
    });
    mapa.fitBounds(pontos, { padding: [20, 20] });
  }

  aplica();
})();
