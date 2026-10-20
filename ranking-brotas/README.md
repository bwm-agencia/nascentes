# Ranking — Hotéis e pousadas em Brotas, SP

Página estática no formato de ranking ("Os N melhores hotéis e pousadas em Brotas"),
inspirada nas páginas de ranking por cidade do Ranqueia.

## Estrutura

- `index.html` — página final (gerada; o ranking já vem renderizado no HTML, bom para SEO/AEO)
- `src/template.html` — layout e estilos da página
- `assets/app.js` — filtros (tipo, região, estilo), busca, ordenação e mapa (Leaflet + OpenStreetMap)
- `data/tripadvisor-brotas.json` — dados brutos (nota, nº de avaliações, estilos, coordenadas, foto)
- `data/ranking.js` — dados processados (gerado)
- `scripts/build_data.py` — calcula o score e gera `data/ranking.js` e `index.html`

## Atualizar o ranking

1. Atualize `data/tripadvisor-brotas.json` com uma coleta nova.
2. Rode `python3 scripts/build_data.py`.

## Metodologia

Score = média bayesiana: `(v/(v+50))·nota + (50/(v+50))·média_da_cidade`, convertido para 0–10.
Hospedagens com menos de 10 avaliações ficam em "Em avaliação" e não entram no ranking.

## SEO

- `<title>`, meta description, Open Graph e canonical (`/rank/hoteis-e-pousadas/brotas`)
- JSON-LD `ItemList` (com `LodgingBusiness` + `AggregateRating`) e `FAQPage`
- FAQ com respostas geradas a partir dos dados (pensado para AEO / respostas de IA)
