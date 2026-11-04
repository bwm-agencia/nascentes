import { siteUrl } from '../config/site';
import { listPacotes, listPosts } from '../lib/content';
import { execSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';

// Data da última alteração do arquivo da página (último commit no Git; se não houver, a data do arquivo).
const hoje = new Date().toISOString().slice(0, 10);
function lastmod(arquivos: string[]): string {
  let melhor = '';
  for (const f of arquivos) {
    if (!existsSync(f)) continue;
    let d = '';
    try { d = execSync(`git log -1 --format=%cs -- "${f}"`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch {}
    if (!d) d = statSync(f).mtime.toISOString().slice(0, 10);
    if (d > melhor) melhor = d;
  }
  return melhor || hoje;
}

// Gera o sitemap a partir das páginas existentes em src/pages. Página nova = entra sozinha.
export async function GET() {
  const files = Object.keys(import.meta.glob('/src/pages/**/*.astro'));
  const paths = files
    .map((f) => f.replace('/src/pages', '').replace(/\.astro$/, ''))
    .filter((p) => p !== '/404' && p !== '/links' && !p.includes('['))
    .map((p) => (p === '/index' ? '/' : p))
    .sort((a, b) => (a === '/' ? -1 : b === '/' ? 1 : a.localeCompare(b)));
  for (const x of (await listPacotes()).filter((i) => !i.entry.semIndexar)) paths.push('/pacotes/' + x.slug);
  for (const x of (await listPosts()).filter((i) => !i.entry.semIndexar)) paths.push('/blog/' + x.slug);
  const fonte = (p: string) => {
    if (p === '/') return ['src/pages/index.astro', 'src/components/FooterHome.astro'];
    if (p.startsWith('/pacotes/')) return [`src/content/pacotes/${p.slice(9)}.yaml`];
    if (p.startsWith('/blog/')) {
      const s = p.slice(6);
      return [`src/pages/blog/${s}.astro`, `src/content/posts/${s}.mdoc`];
    }
    return [`src/pages${p}.astro`];
  };
  const body = paths.map((p) => `  <url><loc>${siteUrl}${p}</loc><lastmod>${lastmod(fonte(p))}</lastmod></url>`).join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
}
