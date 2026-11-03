import { defineConfig } from 'astro/config';

export default defineConfig({
  // Mantém as URLs atuais (/suites/agua.html). Trocar para URLs limpas é uma decisão a parte.
  build: { format: 'file' },
  trailingSlash: 'ignore',
});
