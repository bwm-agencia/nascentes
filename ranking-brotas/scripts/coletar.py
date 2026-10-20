#!/usr/bin/env python3
"""Faz as perguntas do config.json ao ChatGPT, Gemini e Perplexity (com busca na web)
e salva cada resposta bruta em data/coletas/<AAAA-MM>/.

Chaves por variável de ambiente: OPENAI_API_KEY, GEMINI_API_KEY, PERPLEXITY_API_KEY.

Uso:
    python3 scripts/coletar.py                 # mês atual, todas as IAs
    python3 scripts/coletar.py --mes 2026-11   # mês específico
    python3 scripts/coletar.py --ia gemini     # só uma IA

Respostas já salvas não são refeitas, então dá para rodar de novo após uma falha.
"""
import argparse
import datetime as dt
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
CONFIG = json.loads((BASE / "config.json").read_text(encoding="utf-8"))


def post(url, corpo, headers):
    req = urllib.request.Request(
        url, data=json.dumps(corpo).encode(), method="POST",
        headers={"Content-Type": "application/json", **headers},
    )
    for tentativa in range(4):
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                return json.loads(r.read())
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503) and tentativa < 3:
                time.sleep(5 * 2 ** tentativa)
                continue
            raise RuntimeError(f"{url} → HTTP {e.code}: {e.read().decode()[:500]}")


def chatgpt(pergunta, modelo, chave):
    r = post("https://api.openai.com/v1/responses",
             {"model": modelo, "input": pergunta, "tools": [{"type": "web_search"}]},
             {"Authorization": f"Bearer {chave}"})
    partes = []
    for item in r.get("output", []):
        if item.get("type") == "message":
            partes += [c["text"] for c in item.get("content", []) if c.get("type") == "output_text"]
    return "\n".join(partes), r


def gemini(pergunta, modelo, chave):
    r = post(f"https://generativelanguage.googleapis.com/v1beta/models/{modelo}:generateContent",
             {"contents": [{"role": "user", "parts": [{"text": pergunta}]}],
              "tools": [{"google_search": {}}]},
             {"x-goog-api-key": chave})
    partes = r.get("candidates", [{}])[0].get("content", {}).get("parts", [])
    return "\n".join(p.get("text", "") for p in partes), r


def perplexity(pergunta, modelo, chave):
    r = post("https://api.perplexity.ai/chat/completions",
             {"model": modelo, "messages": [{"role": "user", "content": pergunta}]},
             {"Authorization": f"Bearer {chave}"})
    return r["choices"][0]["message"]["content"], r


CLIENTES = {"chatgpt": chatgpt, "gemini": gemini, "perplexity": perplexity}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--mes", default=dt.date.today().strftime("%Y-%m"))
    ap.add_argument("--ia", choices=list(CLIENTES))
    args = ap.parse_args()

    pasta = BASE / "data" / "coletas" / args.mes
    pasta.mkdir(parents=True, exist_ok=True)
    ias = [args.ia] if args.ia else list(CONFIG["ias"])

    faltando = [CONFIG["ias"][ia]["env"] for ia in ias if not os.environ.get(CONFIG["ias"][ia]["env"])]
    if faltando:
        sys.exit("Defina as variáveis de ambiente: " + ", ".join(faltando))

    erros = 0
    for ia in ias:
        cfg = CONFIG["ias"][ia]
        for p, pergunta in enumerate(CONFIG["perguntas"], 1):
            for rep in range(1, CONFIG["repeticoes"] + 1):
                arquivo = pasta / f"{ia}-p{p}-r{rep}.json"
                if arquivo.exists():
                    continue
                print(f"{cfg['nome']} · P{p} · rodada {rep}: {pergunta}")
                try:
                    texto, bruto = CLIENTES[ia](pergunta, cfg["modelo"], os.environ[cfg["env"]])
                except Exception as e:  # segue com as outras perguntas; rodar de novo completa
                    print(f"  falhou: {e}", file=sys.stderr)
                    erros += 1
                    continue
                arquivo.write_text(json.dumps({
                    "ia": ia, "modelo": cfg["modelo"], "pergunta": p, "textoPergunta": pergunta,
                    "rodada": rep, "coletadoEm": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
                    "resposta": texto, "bruto": bruto,
                }, ensure_ascii=False, indent=1), encoding="utf-8")
    total = len(list(pasta.glob("*-p*-r*.json")))
    print(f"{total} respostas salvas em {pasta.relative_to(BASE)}" + (f" ({erros} falhas)" if erros else ""))
    sys.exit(1 if erros else 0)


if __name__ == "__main__":
    main()
