# Checklist da virada para a Hostinger

## Antes (um dia antes)
- [ ] Tag `v1-html-original` criada em Releases (aponta para a branch `legacy-html`)
- [ ] Backup do WordPress (arquivos + banco) feito na Locaweb
- [ ] Print/cópia de TODOS os registros da zona DNS no Registro.br
- [ ] TTL dos registros A (`@` e `www`) reduzido para 300 s
- [ ] Webhook da Hostinger cadastrado no GitHub (Settings → Webhooks, evento push)
- [ ] PR #1 mergeado na `main` e workflow "Publicar para Hostinger" verde na aba Actions

## Na virada
- [ ] Alterar só os registros A (`@` e `www`) para o IP da Hostinger
- [ ] NÃO mexer em MX, TXT (SPF/DKIM/DMARC) e CNAMEs de e-mail/webmail
- [ ] Ativar SSL (HTTPS) no domínio dentro da Hostinger
- [ ] Forçar HTTPS e `www` canônico (conferir redirecionamento de http e do domínio sem www)

## Logo depois (primeiras horas)
- [ ] E-mail: enviar e receber em uma caixa de teste; conferir que não cai em spam
- [ ] Home, /pacotes, /suites, /blog (Guia de Brotas), uma suíte, um pacote e um post
- [ ] Redirecionamentos 301 das URLs antigas do WordPress (ex.: /pacotes-brotas, /pacotes-para-brotas/oferta-especial, /category/..., /novidades/...)
- [ ] Pacote despublicado redireciona (ex.: /pacotes/primavera-romantica)
- [ ] sitemap.xml e robots.txt abrem; sitemap só com páginas indexáveis
- [ ] Celular: topo da home, menu, banner de cookies
- [ ] GTM em modo de pré-visualização: GA4, Meta Pixel e eventos (WhatsApp, reservar) disparando
- [ ] Teste de edição no painel → aparece no site em 1–2 minutos

## Primeira semana
- [ ] Search Console: reenviar o sitemap e acompanhar Cobertura/404
- [ ] GA4: tráfego e eventos normais
- [ ] Manter o WordPress na Locaweb por 1–2 semanas (plano de volta); não cancelar o plano de e-mail
- [ ] Desligar "Permitir acesso de rede externo" no GitHub App, como combinado
