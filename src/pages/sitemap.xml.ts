import { siteUrl } from '../config/site';
import { listPacotes, listPosts } from '../lib/content';

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
  const body = paths.map((p) => `  <url><loc>${siteUrl}${p}</loc></url>`).join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
}
