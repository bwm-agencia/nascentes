import { defineConfig } from 'astro/config';
import { redirectsDoPainel } from './scripts/lib/redirects.mjs';

// Dois modos de build:
//  - normal (site público): 100% estático, sem nada do painel. É o que vai para a Hostinger.
//  - ADMIN=1 (painel de edição): inclui o Keystatic e roda como função na Vercel.
const admin = process.env.ADMIN === '1';

const integrations = [];
let adapter;
if (admin) {
  const react = (await import('@astrojs/react')).default;
  const keystatic = (await import('@keystatic/astro')).default;
  adapter = (await import('@astrojs/vercel')).default();
  integrations.push(react(), keystatic());
} else {
  // O renderizador de texto dos posts usa React, mesmo no site estático.
  const react = (await import('@astrojs/react')).default;
  integrations.push(react());
}

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'https://www.pousadadasnascentes.com.br',
  build: { format: 'file' },
  trailingSlash: 'ignore',
  integrations,
  // Pacotes/posts despublicados com destino escolhido no painel viram redirecionamento 301.
  redirects: Object.fromEntries(redirectsDoPainel().map((r) => [r.de, { status: 301, destination: r.para }])),
  ...(adapter ? { adapter } : {}),
});
