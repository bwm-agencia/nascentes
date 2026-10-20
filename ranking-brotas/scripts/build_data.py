#!/usr/bin/env python3
"""Gera data/ranking.js e index.html a partir de data/tripadvisor-brotas.json.

Score Ranqueia (média bayesiana): equilibra nota e volume de avaliações,
para que uma pousada com 5.0 em 2 avaliações não passe à frente de outra
com 4.8 em 900.

    score = (v / (v + m)) * R + (m / (v + m)) * C

R = nota média da hospedagem, v = nº de avaliações,
m = mínimo de confiança (M_CONFIANCA), C = nota média de todas as hospedagens.

Uso: python3 scripts/build_data.py
"""
import html
import json
import math
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
ENTRADA = BASE / "data" / "tripadvisor-brotas.json"
SAIDA = BASE / "data" / "ranking.js"
TEMPLATE = BASE / "src" / "template.html"
PAGINA = BASE / "index.html"

M_CONFIANCA = 50          # avaliações necessárias para a nota "pesar" por si só
MIN_AVALIACOES = 10       # abaixo disso a hospedagem fica em "Em avaliação"
CENTRO = (-22.2842, -48.1267)  # Praça Amador Simões, centro de Brotas
RAIO_CENTRO_KM = 2.5

ESTILOS_PT = {
    "Romantic": "Romântico",
    "Charming": "Charmoso",
    "Green": "Natureza",
    "Quirky Hotels": "Diferenciado",
    "Mid-range": "Custo-benefício",
    "Great View": "Vista incrível",
    "City View": "Vista da cidade",
    "Family": "Família",
    "Budget": "Econômico",
    "Business": "Negócios",
    "Luxury": "Luxo",
    "Centrally Located": "Bem localizado",
    "Trendy": "Moderno",
    "Quaint": "Aconchegante",
}


def tipo(nome):
    n = nome.lower()
    if "fazenda" in n or "farm" in n:
        return "Hotel fazenda"
    if "hostel" in n:
        return "Hostel"
    if "motel" in n:
        return "Motel"
    if "pousada" in n or "recanto" in n or "hospedaria" in n or "hospedagem" in n:
        return "Pousada"
    return "Hotel"


def distancia_km(lat, lng):
    r = 6371
    p1, p2 = math.radians(CENTRO[0]), math.radians(lat)
    dp = p2 - p1
    dl = math.radians(lng - CENTRO[1])
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def main():
    bruto = json.loads(ENTRADA.read_text(encoding="utf-8"))
    hoteis = [h for h in bruto["hoteis"] if h["avaliacoes"] > 0]

    # remove duplicados (mesmo nome), mantendo o registro com mais avaliações
    por_nome = {}
    for h in hoteis:
        chave = h["nome"].strip().lower()
        if chave not in por_nome or h["avaliacoes"] > por_nome[chave]["avaliacoes"]:
            por_nome[chave] = h
    hoteis = list(por_nome.values())

    elegiveis = [h for h in hoteis if h["avaliacoes"] >= MIN_AVALIACOES]
    total_av = sum(h["avaliacoes"] for h in elegiveis)
    media = sum(h["nota"] * h["avaliacoes"] for h in elegiveis) / total_av

    itens = []
    for h in hoteis:
        v, nota = h["avaliacoes"], h["nota"]
        score = (v / (v + M_CONFIANCA)) * nota + (M_CONFIANCA / (v + M_CONFIANCA)) * media
        dist = distancia_km(h["lat"], h["lng"])
        itens.append({
            "id": h["id"],
            "nome": h["nome"],
            "tipo": tipo(h["nome"]),
            "nota": nota,
            "avaliacoes": v,
            "score": round(score * 2, 2),  # escala 0-10
            "estilos": [ESTILOS_PT.get(e, e) for e in h["estilos"]],
            "distanciaKm": round(dist, 1),
            "regiao": "Centro" if dist <= RAIO_CENTRO_KM else "Zona rural",
            "lat": h["lat"],
            "lng": h["lng"],
            "url": h["url"],
            "foto": h["foto"],
            "ranqueado": v >= MIN_AVALIACOES,
        })

    itens.sort(key=lambda i: (-i["ranqueado"], -i["score"], -i["avaliacoes"]))
    pos = 0
    for i in itens:
        if i["ranqueado"]:
            pos += 1
            i["posicao"] = pos

    saida = {
        "cidade": "Brotas",
        "uf": "SP",
        "categoria": "Hotéis e pousadas",
        "fonte": bruto["fonte"],
        "atualizadoEm": bruto["coletadoEm"],
        "metodo": {
            "mConfianca": M_CONFIANCA,
            "minAvaliacoes": MIN_AVALIACOES,
            "mediaGeral": round(media, 3),
            "totalAvaliacoes": sum(i["avaliacoes"] for i in itens),
        },
        "itens": itens,
    }
    SAIDA.write_text(
        "// Arquivo gerado por scripts/build_data.py — não edite à mão.\n"
        "window.RANKING = " + json.dumps(saida, ensure_ascii=False, indent=1) + ";\n",
        encoding="utf-8",
    )
    PAGINA.write_text(render_pagina(saida), encoding="utf-8")
    print(f"{pos} ranqueados, {len(itens) - pos} em avaliação, média geral {media:.3f}")


def br(n, casas=1):
    return f"{n:,.{casas}f}".replace(",", "X").replace(".", ",").replace("X", ".")


def br_int(n):
    return f"{n:,}".replace(",", ".")


def estrelas(nota):
    cheias = int(round(nota))
    return "★" * cheias + "☆" * (5 - cheias)


def render_card(i, max_score):
    nome = html.escape(i["nome"])
    tags = "".join(f'<span class="tag">{html.escape(e)}</span>' for e in i["estilos"])
    largura = max(0, (i["score"] - 6) / (max_score - 6) * 100)
    return f"""
<li class="card" id="h-{i['id']}" data-id="{i['id']}" data-nome="{html.escape(i['nome'].lower())}" data-tipo="{i['tipo']}" data-regiao="{i['regiao']}" data-estilos="{'|'.join(i['estilos'])}" data-score="{i['score']}" data-nota="{i['nota']}" data-avaliacoes="{i['avaliacoes']}" data-distancia="{i['distanciaKm']}">
  <div class="pos" aria-label="Posição {i['posicao']}">{i['posicao']}</div>
  <div class="thumb" style="background-image:url('{i['foto'] or ''}')" role="img" aria-label="Foto de {nome}"></div>
  <div class="info">
    <h3><a href="{i['url']}" target="_blank" rel="noopener nofollow">{nome}</a></h3>
    <div class="line2"><span><span class="stars" aria-hidden="true">{estrelas(i['nota'])}</span> {br(i['nota'])} · {br_int(i['avaliacoes'])} avaliações</span><span>{i['tipo']}</span><span>{i['regiao']} · {br(i['distanciaKm'])} km do centro</span></div>
    <div class="tags">{tags}</div>
  </div>
  <div class="score"><strong>{br(i['score'])}</strong><small>Score</small><div class="bar"><i style="width:{largura:.0f}%"></i></div></div>
</li>"""


def render_podio(i):
    nome = html.escape(i["nome"])
    return f"""
<a class="pod" href="#h-{i['id']}">
  <div class="ph" style="background-image:url('{i['foto'] or ''}')"><span class="medal m{i['posicao']}">{i['posicao']}º</span></div>
  <div class="bd"><h3>{nome}</h3><div class="meta">Score {br(i['score'])} · {br(i['nota'])}★ · {br_int(i['avaliacoes'])} avaliações</div></div>
</a>"""


def chips(valores):
    out = ['<button class="chip" type="button" data-v="" aria-pressed="true">Todos</button>']
    out += [f'<button class="chip" type="button" data-v="{html.escape(v)}" aria-pressed="false">{html.escape(v)}</button>' for v in valores]
    return "".join(out)


def render_pagina(d):
    rank = [i for i in d["itens"] if i["ranqueado"]]
    fora = [i for i in d["itens"] if not i["ranqueado"]]
    m = d["metodo"]
    total_av = sum(i["avaliacoes"] for i in rank)
    ano = d["atualizadoEm"][:4]
    data_br = "/".join(reversed(d["atualizadoEm"].split("-")))
    max_score = rank[0]["score"]

    contagem = {}
    for i in rank:
        for e in i["estilos"]:
            contagem[e] = contagem.get(e, 0) + 1
    estilos = [e for e, n in sorted(contagem.items(), key=lambda x: -x[1]) if n >= 3]
    tipos = sorted({i["tipo"] for i in rank}, key=lambda t: -sum(1 for i in rank if i["tipo"] == t))

    top = rank[0]
    mais_av = max(rank, key=lambda i: i["avaliacoes"])
    romanticos = [i for i in rank if "Romântico" in i["estilos"]][:3]
    centro = [i for i in rank if i["regiao"] == "Centro"][:3]
    economicos = [i for i in rank if "Econômico" in i["estilos"]][:3]

    def nomes(lst):
        return ", ".join(f"{x['nome']} ({br(x['score'])})" for x in lst)

    faq = [
        ("Qual é o melhor hotel ou pousada de Brotas?",
         f"Pelo nosso ranking, a hospedagem mais bem posicionada de Brotas é {top['nome']}, com score {br(top['score'])} de 10, nota {br(top['nota'])} e {br_int(top['avaliacoes'])} avaliações. O pódio se completa com {rank[1]['nome']} e {rank[2]['nome']}."),
        ("Qual a pousada mais romântica de Brotas para casais?",
         f"Entre as hospedagens classificadas como românticas pelos hóspedes, as melhores posicionadas são: {nomes(romanticos)}."),
        ("Onde ficar em Brotas perto do centro?",
         f"Para ficar a até {br(RAIO_CENTRO_KM)} km da praça central, a pé de bares e restaurantes, as melhores opções do ranking são: {nomes(centro)}."),
        ("Quais são as opções econômicas bem avaliadas em Brotas?",
         f"Entre as hospedagens marcadas como econômicas, destacam-se: {nomes(economicos)}."),
        ("Qual hospedagem de Brotas tem mais avaliações?",
         f"{mais_av['nome']} é a hospedagem com maior volume de avaliações em Brotas: {br_int(mais_av['avaliacoes'])}, com nota média {br(mais_av['nota'])}."),
        ("Como o ranking de hotéis de Brotas é calculado?",
         f"Usamos uma média bayesiana que combina a nota (0 a 5) e o número de avaliações de cada hospedagem, puxando as notas com poucas avaliações para a média da cidade ({br(m['mediaGeral'], 2)}). Só entram hospedagens com pelo menos {MIN_AVALIACOES} avaliações, e o resultado é convertido para a escala de 0 a 10."),
    ]
    faq_html = "".join(f"<details><summary>{html.escape(q)}</summary><p>{html.escape(a)}</p></details>" for q, a in faq)
    jsonld_faq = {
        "@context": "https://schema.org", "@type": "FAQPage",
        "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faq],
    }
    jsonld_list = {
        "@context": "https://schema.org", "@type": "ItemList",
        "name": f"Melhores hotéis e pousadas em Brotas, SP ({ano})",
        "numberOfItems": len(rank), "itemListOrder": "https://schema.org/ItemListOrderDescending",
        "itemListElement": [{
            "@type": "ListItem", "position": i["posicao"],
            "item": {
                "@type": "LodgingBusiness", "name": i["nome"], "url": i["url"],
                **({"image": i["foto"]} if i["foto"] else {}),
                "address": {"@type": "PostalAddress", "addressLocality": "Brotas", "addressRegion": "SP", "addressCountry": "BR"},
                "geo": {"@type": "GeoCoordinates", "latitude": i["lat"], "longitude": i["lng"]},
                "aggregateRating": {"@type": "AggregateRating", "ratingValue": i["nota"], "reviewCount": i["avaliacoes"], "bestRating": 5},
            },
        } for i in rank],
    }

    mini_av = "".join(f'<li><a href="#h-{i["id"]}">{html.escape(i["nome"])}</a><span>{br_int(i["avaliacoes"])}</span></li>'
                      for i in sorted(rank, key=lambda i: -i["avaliacoes"])[:5])
    mini_fora = "".join(f'<li><a href="{i["url"]}" target="_blank" rel="noopener nofollow">{html.escape(i["nome"])}</a><span>{i["avaliacoes"]} aval.</span></li>'
                        for i in fora)

    subs = {
        "ANO": ano,
        "TOTAL": str(len(rank)),
        "TOTAL_AV": br_int(total_av),
        "MEDIA": br(m["mediaGeral"], 2),
        "MEDIA_RAW": f"{m['mediaGeral']:.2f}",
        "M": str(m["mConfianca"]),
        "MIN_AV": str(MIN_AVALIACOES),
        "ATUALIZADO": data_br,
        "FONTE": html.escape(d["fonte"]),
        "OG_IMAGE": top["foto"] or "",
        "PODIO": "".join(render_podio(i) for i in rank[:3]),
        "CARDS": "".join(render_card(i, max_score) for i in rank),
        "CHIPS_TIPO": chips(tipos),
        "CHIPS_REGIAO": chips(["Centro", "Zona rural"]),
        "CHIPS_ESTILO": chips(estilos),
        "MAIS_AVALIADAS": mini_av,
        "EM_AVALIACAO": mini_fora,
        "FAQ_HTML": faq_html,
        "JSONLD_LIST": json.dumps(jsonld_list, ensure_ascii=False).replace("</", "<\\/"),
        "JSONLD_FAQ": json.dumps(jsonld_faq, ensure_ascii=False).replace("</", "<\\/"),
    }
    pagina = TEMPLATE.read_text(encoding="utf-8")
    for k, v in subs.items():
        pagina = pagina.replace("{{" + k + "}}", v)
    return pagina


if __name__ == "__main__":
    main()
