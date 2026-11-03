import { defineConfig } from 'astro/config';

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'https://www.pousadadasnascentes.com.br',
  // Mantém as URLs atuais (/suites/agua.html). Trocar para URLs limpas é uma decisão a parte.
  build: { format: 'file' },
  trailingSlash: 'ignore',
});
