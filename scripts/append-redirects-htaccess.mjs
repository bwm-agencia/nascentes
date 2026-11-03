// Depois do build: grava os redirecionamentos 301 do painel no .htaccess do site (Hostinger/Apache).
import { existsSync, appendFileSync, rmSync } from 'node:fs';
import { redirectsDoPainel } from './lib/redirects.mjs';

const arquivo = 'dist/.htaccess';
const lista = redirectsDoPainel();
if (!existsSync(arquivo)) {
  console.log('[redirects] dist/.htaccess não existe; nada a fazer.');
} else if (lista.length === 0) {
  console.log('[redirects] nenhum redirecionamento do painel.');
} else {
  const linhas = lista.map((r) => `RedirectMatch 301 ^${r.de}/?$ ${r.para}`);
  appendFileSync(arquivo, `\n# Redirecionamentos criados pelo painel (pacotes/posts despublicados)\n${linhas.join('\n')}\n`);
  // Remove a página de redirecionamento HTML gerada pelo Astro: no Apache o 301 do .htaccess é o que vale.
  for (const r of lista) rmSync(`dist${r.de}.html`, { force: true });
  console.log(`[redirects] ${lista.length} redirecionamento(s) 301 gravado(s) no .htaccess.`);
}
