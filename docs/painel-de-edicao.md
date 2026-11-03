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
   `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET`, `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG`, além de `KEYSTATIC_STORAGE=github`.
3. O painel fica protegido pelo login do GitHub: só entra quem tem acesso ao repositório.

## Fotos
Fotos enviadas pelo painel são convertidas para WebP no build (`scripts/optimize-uploads.mjs`).
