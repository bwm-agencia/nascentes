# Hotéis e pousadas que a IA mais indica em Brotas

Ranking mensal no formato das páginas "ranking mensal da IA": todo mês o ChatGPT, o Gemini e o
Perplexity recebem 5 perguntas sobre onde se hospedar em Brotas, 2 vezes cada, com busca na web
(30 respostas). A página mostra quem foi mais indicado.

## Estrutura

| Caminho | O que é |
|---|---|
| `config.json` | perguntas, IAs/modelos, nº de repetições, mínimo de citações, marca, WhatsApp e e-mail |
| `data/catalogo.json` | hospedagens conhecidas de Brotas + apelidos (junta grafias diferentes do mesmo negócio) |
| `data/tripadvisor-brotas.json` | base usada para montar o catálogo (nome, coordenadas, nº de avaliações) |
| `scripts/coletar.py` | faz as perguntas às 3 IAs e salva as respostas brutas em `data/coletas/AAAA-MM/` |
| `scripts/gerar.py` | extrai os nomes citados, monta o ranking e gera `index.html` + `data/rankings/AAAA-MM.json` |
| `src/template.html` | layout da página |

Só usa a biblioteca padrão do Python 3.

## Rodar

```bash
export OPENAI_API_KEY=... GEMINI_API_KEY=... PERPLEXITY_API_KEY=...
python3 scripts/coletar.py      # 30 chamadas; se falhar no meio, rode de novo que ele completa
python3 scripts/gerar.py        # gera index.html
```

Depois de gerar, confira `data/coletas/AAAA-MM/nao-mapeados.txt`: são nomes citados que não
estão no catálogo. Se for uma grafia diferente de uma hospedagem já conhecida, adicione-a em
`apelidos`; se for lixo (ex.: "Pousada Brotas" genérico), adicione em `"ignorar"`; depois rode
`gerar.py` de novo.

Prévia com dados de teste: `python3 scripts/gerar.py --coletas PASTA --saida demo.html --demo`
(gera uma página com faixa de aviso e `noindex`).

## Automação

`.github/workflows/ranking-brotas.yml` roda no dia 1º de cada mês (e manualmente em
*Actions → Run workflow*). Cadastre os secrets `OPENAI_API_KEY`, `GEMINI_API_KEY` e
`PERPLEXITY_API_KEY` no repositório.

## Regras do ranking

- Cada resposta conta no máximo 1 vez por hospedagem.
- Plataformas e diretórios (Booking, Airbnb, Tripadvisor…) não contam.
- Ordem: mais respostas → mais IAs diferentes → posição média mais alta nas respostas.
- Entra quem foi citado em pelo menos 2 respostas.
- Quando existe o ranking do mês anterior, a página mostra quem subiu, caiu ou entrou.

## Antes de publicar

- Troque `whatsapp`, `email` e `marca` em `config.json` (hoje são placeholders).
- Ajuste `slug` para o endereço final da página.
