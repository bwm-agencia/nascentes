# Painel de edição (Keystatic)

Editores: `fredagenciabwm-debug`, `sandrofraga-evoluir`, `agencia-bwm` (todos com permissão de escrita no repositório `bwm-agencia/nascentes`).

## O que dá para editar no painel
- **Pacotes (novos):** campos fixos (foto, título, preço, o que inclui, perguntas, mensagem do WhatsApp). A página, o card na lista de pacotes e o sitemap saem sozinhos.
- **Posts do blog (novos):** título, categoria, data, resumo, foto de capa e texto com formatação. O card na lista do blog e o sitemap saem sozinhos.
- Pacotes e posts antigos continuam como páginas do site e são alterados pelo Claude ou no código.

## Como o painel funciona
1. Quem edita entra com a conta do GitHub.
2. Ao salvar, o painel cria um commit no repositório (histórico completo, dá para voltar atrás).
3. O GitHub reconstrói o site e publica na Hostinger.

## Rodar o painel no computador (teste, sem GitHub)
```
npm install
npm run dev:admin
```
Abrir http://localhost:4321/keystatic. Aqui as alterações gravam direto nos arquivos.

## Publicar o painel (uma vez)
1. Hospedar o painel na Vercel com `npm run build:admin` (modo administrador do projeto).
2. Criar o GitHub App do Keystatic na organização `bwm-agencia` e guardar nas variáveis da Vercel:
   `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET`, `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG`, além de `PUBLIC_KEYSTATIC_STORAGE=github`.
3. O painel fica protegido pelo login do GitHub: só entra quem tem acesso ao repositório.

## Fotos
Fotos enviadas pelo painel são convertidas para WebP no build (`scripts/optimize-uploads.mjs`).

## Títulos: o que vira H1, H2 e H3

Cada campo do painel mostra no nome onde ele entra na página.

| Nível | Pacotes | Posts do blog |
|---|---|---|
| **H1** (um só por página) | "Título (parte normal)" + "Título (parte em destaque)" | "Título do post" |
| **H2** | Seções fixas ("O que vocês vão ter", "Antes de reservar") e "Chamada final: título" | Seções do "Texto do post" e a seção fixa "Perguntas frequentes" |
| **H3** | "Nome da opção" e "Título do bloco" | Subdivisões dentro de um H2 no "Texto do post" |

Regras: o editor do texto do post só oferece H2, H3 e H4 (H1 bloqueado). Não pule níveis (depois do H2 vem o H3). O relatório de SEO do build avisa se o texto tiver H1 ou pular nível.

## Despublicar um pacote ou post sem perder SEO

Ao desmarcar "Publicado no site", escolha em **"Ao despublicar, redirecionar para"** a página de destino (lista de pacotes, suítes, blog, outro pacote/post). O site cria sozinho um redirecionamento 301 na próxima publicação. Sem escolha, a página dá erro 404. Evite mandar tudo para a página inicial (o Google pode tratar como erro). O relatório de SEO do build avisa quando algo é despublicado sem redirecionamento. Pacotes que voltam todo ano: mantenha a página no ar e só atualize datas e preços (por isso não coloque o ano no nome do pacote).

## Pacotes que já existiam

Os 7 pacotes que eram páginas fixas agora estão no painel, com os mesmos endereços: Refúgio Primavera, Escapada a dois, Primavera Romântica, Aniversariante do Mês, Consciência Negra (publicados) e 12 de Outubro e Feriado 2 de Novembro (despublicados, redirecionam para a lista de pacotes). Seções que só alguns pacotes têm (texto com agenda riscada, "Como funciona" em passos, caixa "Conheça outro pacote", seção Brotas, extras) são campos opcionais: deixe o título vazio para não mostrar. Para trocar a ordem na lista, use "Ordem na lista de pacotes".

## Pacotes na página inicial

A seção "Pacotes" da página inicial mostra até 3 pacotes publicados que tenham "Mostrar na página inicial" marcado, na ordem da lista. Foto, etiqueta e itens vêm do card da lista de pacotes. Para trocar o que aparece na Home, marque ou desmarque esse campo.


## Como o site chega na Hostinger

1. A equipe publica no painel, e o conteúdo vai para a branch `main`.
2. O GitHub (workflow *Publicar para Hostinger*) gera o site e grava o resultado na branch `hostinger`.
3. A Hostinger (Sites → Implantação a partir do Git) está ligada à branch `hostinger` e atualiza o site sozinha (webhook de implantação automática).

Se algo falhar, veja a aba **Actions** do repositório.
