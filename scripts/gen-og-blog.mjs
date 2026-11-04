// Gera as capas de compartilhamento (1200x630) dos artigos do blog em public/og/blog/<slug>.jpg.
// - Artigos fixos: src/pages/blog/*.astro (título, categoria e foto lidos do próprio arquivo)
// - Posts do painel: src/content/posts/*.mdoc (pulados se tiverem "imagem de compartilhamento" própria)
// Só refaz o que mudou (título, categoria ou foto) — controle em public/og/blog/.manifest.json.
// Uso: node scripts/gen-og-blog.mjs [--check]   (--check só informa quantas faltam e sai)
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public/og/blog');
const manifestFile = join(outDir, '.manifest.json');
const unesc = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\\"/g, '"');
const strip = (s) => unesc(s.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
const webp = (p) => {
  const w = p.replace(/\.(jpe?g|png)$/i, '.webp');
  return w !== p && existsSync(join(root, 'public', w)) ? w : p;
};

function collect() {
  const items = [];
  const dir = join(root, 'src/pages/blog');
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.astro') && !x.startsWith('['))) {
    const t = readFileSync(join(dir, f), 'utf8');
    const h1 = t.match(/<h1>([\s\S]*?)<\/h1>/);
    const ph = t.match(/class="photo" style="background-image:url\('([^']+)'/);
    if (!h1 || !ph) continue;
    const cat = t.match(/class="cat">([\s\S]*?)<\/span>/);
    items.push({ slug: f.slice(0, -6), cat: cat ? strip(cat[1]) : 'Guia de Brotas', title: strip(h1[1]), photo: webp(ph[1]) });
  }
  const pdir = join(root, 'src/content/posts');
  if (existsSync(pdir)) {
    for (const f of readdirSync(pdir).filter((x) => /\.(mdoc|md|mdx)$/.test(x))) {
      const t = readFileSync(join(pdir, f), 'utf8');
      const fm = (t.match(/^---\n([\s\S]*?)\n---/) || [, ''])[1];
      const get = (k) => {
        const m = fm.match(new RegExp('^' + k + ':\\s*(.*)$', 'm'));
        return m ? m[1].trim().replace(/^(["'])([\s\S]*)\1$/, '$2') : '';
      };
      if (get('publicado') === 'false' || get('imagemCompartilhamento')) continue;
      const foto = get('foto');
      if (!get('titulo') || !foto) continue;
      items.push({ slug: f.replace(/\.[^.]+$/, ''), cat: get('categoria') || 'Guia de Brotas', title: get('titulo'), photo: webp(foto) });
    }
  }
  return items;
}

const hash = (i) => createHash('md5').update([i.title, i.cat, i.photo, existsSync(join(root, 'public', i.photo)) ? statSync(join(root, 'public', i.photo)).size : 0, 'v1'].join('|')).digest('hex').slice(0, 12);
const manifest = existsSync(manifestFile) ? JSON.parse(readFileSync(manifestFile, 'utf8')) : {};
const todo = collect().filter((i) => manifest[i.slug] !== hash(i) || !existsSync(join(outDir, i.slug + '.jpg')));

if (process.argv.includes('--check')) {
  console.log(`[og-blog] ${todo.length} capa(s) a gerar`);
  process.exit(0);
}
if (!todo.length) {
  console.log('[og-blog] capas em dia');
  process.exit(0);
}

let chromium;
try {
  ({ chromium } = (await import('node:module')).createRequire(import.meta.url)('playwright'));
} catch {
  console.warn('[og-blog] playwright indisponível — capas novas não geradas (o site usa a foto do artigo como fallback)');
  process.exit(0);
}
const sharp = (await import('sharp')).default;
const fp = (p) => pathToFileURL(join(root, 'node_modules/@fontsource-variable', p)).href;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const css = `
@font-face{font-family:'Playfair Display';font-weight:400 900;src:url('${fp('playfair-display/files/playfair-display-latin-wght-normal.woff2')}')}
@font-face{font-family:'Manrope';font-weight:200 800;src:url('${fp('manrope/files/manrope-latin-wght-normal.woff2')}')}
*{box-sizing:border-box}body{margin:0}
.a{width:1200px;height:630px;position:relative;overflow:hidden;background:#0B0607;color:#F3EDE2;font-family:'Manrope',sans-serif}
.ph{position:absolute;top:0;bottom:0;right:0;width:560px;background-size:cover;background-position:center 50%}
.sh{position:absolute;top:0;bottom:0;left:560px;width:200px;background:linear-gradient(90deg,#0B0607,rgba(11,6,7,.6) 45%,rgba(11,6,7,0))}
.c{position:absolute;left:64px;top:56px;bottom:120px;width:480px;display:flex;flex-direction:column}
.c img{width:210px;display:block}
.m{margin-top:auto}
.k{font-size:17px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:#E8A84C;margin-bottom:18px}
h1{margin:0;font-family:'Playfair Display',serif;font-weight:500;line-height:1.1;max-width:480px}
.u{position:absolute;left:64px;bottom:40px;font-size:18px;font-weight:600;letter-spacing:.04em;color:#C6A29D}
.u b{color:#E8A84C;font-weight:700;letter-spacing:.2em;text-transform:uppercase;font-size:15px;margin-right:14px}`;
const logo = pathToFileURL(join(root, 'public/logo/logo-horizontal.png')).href;
const page = (i) => {
  const n = i.title.length;
  const fs = n <= 38 ? 50 : n <= 60 ? 44 : n <= 90 ? 40 : 34;
  const photo = pathToFileURL(join(root, 'public', i.photo)).href;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body><div class="a"><div class="ph" style="background-image:url('${photo}')"></div><div class="sh"></div>
<div class="c"><img src="${logo}"><div class="m"><div class="k">${esc(i.cat)}</div><h1 style="font-size:${fs}px">${esc(i.title)}</h1></div></div>
<div class="u"><b>Guia de Brotas</b>pousadadasnascentes.com.br</div></div></body></html>`;
};

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const pg = await browser.newPage({ viewport: { width: 1200, height: 630 } });
const tmp = join(outDir, '.tmp.html');
for (const i of todo) {
  if (!existsSync(join(root, 'public', i.photo))) {
    console.warn(`[og-blog] foto não encontrada para ${i.slug}: ${i.photo}`);
    continue;
  }
  writeFileSync(tmp, page(i));
  await pg.goto(pathToFileURL(tmp).href);
  await pg.evaluate(() => document.fonts.ready);
  await pg.waitForTimeout(150);
  const png = await pg.screenshot();
  await sharp(png).jpeg({ quality: 86, mozjpeg: true }).toFile(join(outDir, i.slug + '.jpg'));
  manifest[i.slug] = hash(i);
}
await browser.close();
try { (await import('node:fs')).unlinkSync(tmp); } catch {}
writeFileSync(manifestFile, JSON.stringify(manifest, null, 1) + '\n');
console.log(`[og-blog] ${todo.length} capa(s) geradas`);
