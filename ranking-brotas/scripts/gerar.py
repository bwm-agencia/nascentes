#!/usr/bin/env python3
"""Lê as respostas de data/coletas/<AAAA-MM>/, conta quem cada IA indicou e gera
index.html + data/rankings/<AAAA-MM>.json.

Regras (iguais às da página de metodologia):
- cada resposta conta no máximo 1 vez por hospedagem;
- grafias diferentes do mesmo negócio se juntam (data/catalogo.json → apelidos);
- plataformas e diretórios (Booking, Airbnb…) não contam;
- fica na frente quem aparece em mais respostas; empate: mais IAs diferentes,
  depois quem vem antes nas respostas (posição média);
- entra na lista quem foi indicado em pelo menos `minimoCitacoes` respostas.

Uso:
    python3 scripts/gerar.py                    # último mês coletado
    python3 scripts/gerar.py --mes 2026-11
    python3 scripts/gerar.py --coletas DIR --saida arquivo.html --demo   # prévia com dados de teste
"""
import argparse
import datetime as dt
import html
import json
import re
import unicodedata
from pathlib import Path
from urllib.parse import quote

BASE = Path(__file__).resolve().parent.parent
CONFIG = json.loads((BASE / "config.json").read_text(encoding="utf-8"))
CATALOGO = json.loads((BASE / "data" / "catalogo.json").read_text(encoding="utf-8"))
TEMPLATE = BASE / "src" / "template.html"

MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho",
         "agosto", "setembro", "outubro", "novembro", "dezembro"]

# Nomes próprios de hospedagem que não estão no catálogo: "Pousada Xyz", "Hotel Fazenda Abc"…
GENERICO = re.compile(
    r"\b(?:Hotel Fazenda|Eco ?Hotel|Pousada|Hotel|Hostel|Resort|Recanto|Chal[ée]s?|Hospedaria|Hospedagem|Camping|Glamping)"
    r"(?:\s+(?:d[aoe]s?|&|e)?\s*[A-ZÁÂÃÉÊÍÓÔÕÚÇ][\wÀ-ÿ'’-]*)+"
)
CONECTORES_FINAIS = re.compile(r"(\s+(?:d[aoe]s?|&|e))+$")


def normaliza(texto):
    """Minúsculas, sem acento e só [a-z0-9 ], preservando o comprimento (posições batem)."""
    out = []
    for ch in texto:
        base = unicodedata.normalize("NFKD", ch)[0].lower()
        out.append(base if base.isascii() and base.isalnum() else " ")
    return "".join(out)


def chave(nome):
    return " ".join(normaliza(nome).split())


class Extrator:
    def __init__(self):
        self.apelidos = []  # (apelido normalizado, nome canônico)
        for h in CATALOGO["hospedagens"]:
            for a in [h["nome"], *h.get("apelidos", [])]:
                self.apelidos.append((chave(a), h["nome"]))
        self.apelidos.sort(key=lambda x: -len(x[0]))  # o mais longo vence ("Villa Cassorova" antes de "Cassorova")
        self.ignorar = {chave(n) for n in CATALOGO.get("ignorar", [])}
        self.plataformas = [chave(p) for p in CONFIG["plataformas"]]
        self.nao_mapeados = {}

    def extrai(self, texto):
        """Hospedagens citadas na resposta, na ordem em que aparecem."""
        norm = " " + normaliza(texto) + " "
        ocupado = [False] * len(norm)
        achados = []  # (posição, nome)
        for apelido, nome in self.apelidos:
            agulha = " " + apelido + " "
            i = norm.find(agulha)
            while i != -1:
                ini, fim = i + 1, i + 1 + len(apelido)
                if not any(ocupado[ini:fim]):
                    ocupado[ini:fim] = [True] * (fim - ini)
                    achados.append((ini, nome))
                i = norm.find(agulha, i + 1)

        for m in GENERICO.finditer(texto):
            nome = CONECTORES_FINAIS.sub("", m.group(0)).strip(" '’-")
            k = chave(nome)
            ini = m.start() + 1  # +1 pelo espaço inicial em `norm`
            if (len(k.split()) < 2 or k in self.ignorar or any(ocupado[ini:ini + len(nome)])
                    or any(p in k.split() for p in self.plataformas)):
                continue
            achados.append((ini, nome))
            self.nao_mapeados[k] = nome

        ordem, vistos = [], set()
        for _, nome in sorted(achados):
            k = chave(nome)
            if k not in vistos:
                vistos.add(k)
                ordem.append(nome)
        return ordem


def carrega(pasta):
    respostas = [json.loads(p.read_text(encoding="utf-8")) for p in sorted(pasta.glob("*-p*-r*.json"))]
    if not respostas:
        raise SystemExit(f"Nenhuma resposta em {pasta}. Rode scripts/coletar.py primeiro.")
    return respostas


def calcula(respostas):
    ex = Extrator()
    for r in respostas:
        r["citados"] = ex.extrai(r["resposta"])

    stats = {}
    for r in respostas:
        for pos, nome in enumerate(r["citados"], 1):
            s = stats.setdefault(chave(nome), {"nome": nome, "respostas": 0, "ias": set(), "posicoes": []})
            s["respostas"] += 1
            s["ias"].add(r["ia"])
            s["posicoes"].append(pos)

    lista = [s for s in stats.values() if s["respostas"] >= CONFIG["minimoCitacoes"]]
    lista.sort(key=lambda s: (-s["respostas"], -len(s["ias"]), sum(s["posicoes"]) / len(s["posicoes"]), s["nome"]))
    ranking = [{
        "posicao": i, "nome": s["nome"], "respostas": s["respostas"],
        "ias": sorted(s["ias"]), "posicaoMedia": round(sum(s["posicoes"]) / len(s["posicoes"]), 2),
    } for i, s in enumerate(lista, 1)]
    no_ranking = {chave(r["nome"]) for r in ranking}

    perguntas = []
    for p, texto in enumerate(CONFIG["perguntas"], 1):
        por_ia = []
        for ia in CONFIG["ias"]:
            rs = [r for r in respostas if r["pergunta"] == p and r["ia"] == ia]
            if not rs:
                continue
            cont = {}
            for r in rs:
                for pos, nome in enumerate(r["citados"], 1):
                    if chave(nome) in no_ranking:
                        c = cont.setdefault(nome, [0, 0])
                        c[0] += 1
                        c[1] += pos
            nomes = sorted(cont, key=lambda n: (-cont[n][0], cont[n][1] / cont[n][0]))
            por_ia.append({"ia": ia, "nomes": nomes})
        perguntas.append({"pergunta": texto, "respostas": por_ia})

    return ranking, perguntas, sorted(ex.nao_mapeados.values())


def proximo_mes(mes):
    a, m = map(int, mes.split("-"))
    return dt.date(a + m // 12, m % 12 + 1, 1)


def data_extenso(d):
    return f"{d.day}{'º' if d.day == 1 else ''} de {MESES[d.month - 1]} de {d.year}"


def esc(t):
    return html.escape(str(t))


def render(mes, respostas, ranking, perguntas, anterior, demo):
    cfg = CONFIG
    n = len(respostas)
    a, m = map(int, mes.split("-"))
    mes_ext = f"{MESES[m - 1].capitalize()} de {a}"
    nomes_ias = [cfg["ias"][i]["nome"] for i in cfg["ias"]]
    ias_txt = ", ".join(nomes_ias[:-1]) + " e " + nomes_ias[-1]
    atualizado = max(dt.date.fromisoformat(r["coletadoEm"][:10]) for r in respostas)
    proxima = proximo_mes(mes)
    cidade = cfg["cidade"]
    n_ias = len(cfg["ias"])
    pos_ant = {chave(r["nome"]): r["posicao"] for r in (anterior or [])}

    def variacao(item):
        if anterior is None:
            return ""
        antes = pos_ant.get(chave(item["nome"]))
        if antes is None:
            return '<span class="var novo">novo</span>'
        d = antes - item["posicao"]
        if d > 0:
            return f'<span class="var sobe" title="Subiu {d}">▲ {d}</span>'
        if d < 0:
            return f'<span class="var desce" title="Caiu {-d}">▼ {-d}</span>'
        return '<span class="var igual" title="Mesma posição">=</span>'

    def de_n(item):
        return f"{item['respostas']} de {n}"

    podio = ""
    for item in [ranking[i] for i in (1, 0, 2) if i < len(ranking)]:
        p = item["posicao"]
        podio += f"""
<div class="pod p{p}">
  <div class="pod-pos">{p}</div>
  <div class="pod-nome">{esc(item['nome'])}</div>
  <div class="pod-num">{item['respostas']}</div>
  <div class="pod-de">de {n} respostas</div>
  {variacao(item)}
</div>"""

    linhas = ""
    for item in ranking[3:]:
        oculto = ' data-extra hidden' if item["posicao"] > 10 else ""
        largura = item["respostas"] / ranking[0]["respostas"] * 100
        linhas += f"""
<li class="row"{oculto} data-nome="{esc(chave(item['nome']))}">
  <span class="row-pos">{item['posicao']}</span>
  <div class="row-main"><span class="row-nome">{esc(item['nome'])}</span> {variacao(item)}
    <div class="row-bar"><i style="width:{largura:.0f}%"></i></div></div>
  <span class="row-de">{de_n(item)}</span>
</li>"""
    extras = max(0, len(ranking) - 10)
    ver_mais = (f'<button class="ver-mais" id="ver-mais" type="button" aria-expanded="false">Ver lista completa · mais {extras} '
                f'{"hospedagem" if extras == 1 else "hotéis e pousadas"} <span aria-hidden="true">⌄</span></button>') if extras else ""

    blocos = ""
    for q in perguntas:
        ias_html = ""
        for r in q["respostas"]:
            itens = "".join(f"<li>{esc(nm)}</li>" for nm in r["nomes"]) or '<li class="vazio">Nenhum nome com 2+ citações no mês</li>'
            ias_html += f'<div class="q-ia"><div class="q-ia-nome">{esc(cfg["ias"][r["ia"]]["nome"])}</div><ol>{itens}</ol></div>'
        blocos += f'<article class="q"><h3>“{esc(q["pergunta"])}”</h3>{ias_html}</article>'

    top = ranking[0] if ranking else None
    resumo = (f"{esc(top['nome'])} lidera: apareceu em {top['respostas']} das {n} respostas, "
              f"em {len(top['ias'])} das {n_ias} IAs. ") if top else ""
    resumo += (f"Todo mês perguntamos ao {ias_txt} quais hotéis e pousadas eles indicam em {cidade} — "
               f"{len(cfg['perguntas'])} perguntas, {cfg['repeticoes']} vezes cada, com busca na web — e contamos quem aparece mais.")

    faq = [
        (f"Como é feito o ranking de hotéis e pousadas em {cidade}?",
         f"Todo mês fazemos {len(cfg['perguntas'])} perguntas sobre hotéis e pousadas em {cidade} ao {ias_txt}, "
         f"{cfg['repeticoes']} vezes cada, com a busca na web ligada — {n} respostas ao todo. Contamos em quantas respostas "
         f"cada nome foi indicado e ordenamos do mais para o menos citado. Em caso de empate, fica na frente quem foi indicado "
         f"por mais IAs e, depois, quem aparece antes nas respostas. Para entrar na lista, é preciso aparecer em pelo menos "
         f"{cfg['minimoCitacoes']} respostas."),
        ("Alguém paga para aparecer no ranking?",
         "Não. Ninguém paga para entrar ou subir na lista. A lista sai só das respostas das IAs. O que fazemos é tirar "
         "plataformas e diretórios (como Booking, Airbnb e Tripadvisor), nomes que não estão de fato na resposta, e juntar "
         "grafias diferentes do mesmo negócio."),
        ("As respostas são as mesmas que eu veria no ChatGPT?",
         "Parecidas, mas não idênticas. As IAs variam a resposta de uma vez para outra e de uma pessoa para outra — por isso "
         f"cada pergunta é feita {cfg['repeticoes']} vezes, e o ranking mostra quem aparece com mais frequência."),
        (f"Por que o meu hotel ou pousada não aparece entre os hotéis e pousadas de {cidade}?",
         "Porque, neste mês, as IAs não indicaram você nessas perguntas. Elas recomendam quem encontram descrito com clareza "
         "na web — no site, em artigos, no Google Meu Negócio e nas avaliações. Dá para mudar isso, e o ranking do mês "
         "seguinte mostra se mudou."),
        ("Quero corrigir ou remover o meu nome. Como faço?",
         f"Escreva para {cfg['email']} com o link desta página e o nome a corrigir ou remover. A remoção a pedido do titular "
         "vale para todos os meses seguintes, não só o atual."),
        ("Quando o ranking é atualizado?",
         f"Todo mês, a partir do dia 1º. A próxima atualização é em {data_extenso(proxima)}."),
    ]
    faq_html = "".join(
        f'<details{" id=por-que" if "não aparece" in q else ""}><summary>{esc(q)}</summary><p>{esc(r)}</p></details>'
        for q, r in faq)

    wa_txt = quote(f"Olá! Quero o diagnóstico de IA da minha hospedagem em {cidade}.")
    titulo = f"{cfg['categoria']} que a IA mais indica em {cidade}"
    descricao = (f"Ranking mensal: quais {cfg['categoria'].lower()} o {ias_txt} mais indicam em {cidade}, {cfg['uf']}. "
                 f"{mes_ext}, {n} respostas analisadas." + (f" {top['nome']} lidera." if top else ""))
    jsonld = [
        {"@context": "https://schema.org", "@type": "ItemList", "name": f"{titulo} — {mes_ext}",
         "numberOfItems": len(ranking),
         "itemListElement": [{"@type": "ListItem", "position": r["posicao"],
                              "item": {"@type": "LodgingBusiness", "name": r["nome"],
                                       "address": {"@type": "PostalAddress", "addressLocality": cidade,
                                                   "addressRegion": cfg["uf"], "addressCountry": "BR"}}}
                             for r in ranking]},
        {"@context": "https://schema.org", "@type": "FAQPage",
         "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": r}} for q, r in faq]},
    ]
    busca = [{"k": chave(r["nome"]), "nome": r["nome"], "pos": r["posicao"], "de": de_n(r)} for r in ranking]

    subs = {
        "TITULO": esc(titulo), "DESCRICAO": esc(descricao), "SLUG": esc(cfg["slug"]), "MARCA": esc(cfg["marca"]),
        "CIDADE": esc(cidade), "MES": esc(mes_ext), "N": str(n), "IAS": esc(ias_txt),
        "PODIO": podio, "LINHAS": linhas, "VER_MAIS": ver_mais, "PERGUNTAS": blocos,
        "TOTAL": str(len(ranking)), "RESUMO": resumo, "MES_NOME": MESES[m - 1],
        "ATUALIZADO": data_extenso(atualizado), "PROXIMA": data_extenso(proxima),
        "MIN": str(cfg["minimoCitacoes"]), "REPETICOES": str(cfg["repeticoes"]),
        "N_PERGUNTAS": str(len(cfg["perguntas"])), "FAQ": faq_html, "EMAIL": esc(cfg["email"]),
        "WHATSAPP": f"https://wa.me/{cfg['whatsapp']}?text={wa_txt}", "ANO": str(dt.date.today().year),
        "JSONLD": json.dumps(jsonld, ensure_ascii=False).replace("</", "<\\/"),
        "BUSCA": json.dumps(busca, ensure_ascii=False).replace("</", "<\\/"),
        "ROBOTS": "noindex" if demo else "index,follow",
        "DEMO": ('<div class="demo">PRÉVIA COM DADOS DE TESTE — os nomes e números abaixo são fictícios</div>'
                 if demo else ""),
    }
    pagina = TEMPLATE.read_text(encoding="utf-8")
    for k, v in subs.items():
        pagina = pagina.replace("{{" + k + "}}", v)
    sobrou = re.findall(r"\{\{[A-Z_]+\}\}", pagina)
    if sobrou:
        raise SystemExit(f"Placeholders sem valor no template: {sorted(set(sobrou))}")
    return pagina


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--mes")
    ap.add_argument("--coletas", type=Path, help="pasta com as respostas (padrão: data/coletas/<mes>)")
    ap.add_argument("--saida", type=Path, default=BASE / "index.html")
    ap.add_argument("--demo", action="store_true", help="marca a página como prévia e noindex")
    args = ap.parse_args()

    raiz = BASE / "data" / "coletas"
    if args.coletas:
        pasta = args.coletas
        mes = args.mes or dt.date.today().strftime("%Y-%m")
    else:
        mes = args.mes or max((p.name for p in raiz.iterdir() if p.is_dir()), default=None)
        if not mes:
            raise SystemExit("Nenhuma coleta encontrada. Rode scripts/coletar.py primeiro.")
        pasta = raiz / mes

    respostas = carrega(pasta)
    ranking, perguntas, nao_mapeados = calcula(respostas)

    anterior = None
    if not args.demo:
        a, m = map(int, mes.split("-"))
        arq_ant = BASE / "data" / "rankings" / f"{a - (m == 1)}-{(m - 2) % 12 + 1:02d}.json"
        if arq_ant.exists():
            anterior = json.loads(arq_ant.read_text(encoding="utf-8"))["ranking"]
        destino = BASE / "data" / "rankings" / f"{mes}.json"
        destino.parent.mkdir(parents=True, exist_ok=True)
        destino.write_text(json.dumps({"mes": mes, "respostas": len(respostas), "ranking": ranking,
                                       "perguntas": perguntas, "naoMapeados": nao_mapeados},
                                      ensure_ascii=False, indent=1), encoding="utf-8")
        (pasta / "nao-mapeados.txt").write_text("\n".join(nao_mapeados) + "\n", encoding="utf-8")

    args.saida.write_text(render(mes, respostas, ranking, perguntas, anterior, args.demo), encoding="utf-8")
    print(f"{mes}: {len(respostas)} respostas, {len(ranking)} no ranking, {len(nao_mapeados)} nomes fora do catálogo → {args.saida}")


if __name__ == "__main__":
    main()
