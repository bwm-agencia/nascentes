// Depois do build: melhora o PageSpeed nas páginas geradas (dist/**/*.html).
//  1) <img> sem width/height recebe as dimensões reais da imagem (evita deslocamento de layout, CLS)
//  2) a foto de topo da página (aplicada como background-image) ganha <link rel="preload" fetchpriority="high"> (LCP mais rápido)
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const dist = 'dist';
const cache = new Map();
async function dim(src) {
  const clean = src.split('?')[0];
  if (!clean.startsWith('/') || /^\/\//.test(clean)) return null;
  if (cache.has(clean)) return cache.get(clean);
  let r = null;
  for (const base of [dist, 'public']) {
    const f = join(base, decodeURI(clean));
    if (existsSync(f) && statSync(f).isFile()) {
      try { const m = await sharp(f).metadata(); if (m.width && m.height) r = { w: m.width, h: m.height }; } catch {}
      break;
    }
  }
  cache.set(clean, r);
  return r;
}
function* walk(d) {
  for (const n of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, n.name);
    if (n.isDirectory()) yield* walk(p);
    else if (n.name.endsWith('.html')) yield p;
  }
}
let paginas = 0, imgs = 0, preloads = 0;
for (const f of walk(dist)) {
  let h = readFileSync(f, 'utf8');
  const orig = h;
  // 1) dimensões
  const tags = [...new Set(h.match(/<img\b[^>]*>/g) || [])];
  for (const t of tags) {
    if (/\swidth=/.test(t) || /\sheight=/.test(t)) continue;
    const m = t.match(/\ssrc="([^"]+)"/);
    if (!m) continue;
    const d = await dim(m[1]);
    if (!d) continue;
    h = h.split(t).join(t.replace(/<img\b/, `<img width="${d.w}" height="${d.h}"`));
    imgs++;
  }
  // 2) preload da foto de topo
  if (!/rel="preload"[^>]*as="image"/.test(h)) {
    const m = h.match(/class="(?:hero-photo|subhero-photo|photo)"[^>]*background-image:\s*url\(['"]?([^'")]+)['"]?\)/);
    if (m && m[1].startsWith('/')) {
      h = h.replace('</head>', `<link rel="preload" as="image" href="${m[1]}" fetchpriority="high"></head>`);
      preloads++;
    }
  }
  if (h !== orig) { writeFileSync(f, h); paginas++; }
}
console.log(`[otimizar-html] ${paginas} página(s) ajustada(s): ${imgs} imagem(ns) com dimensões, ${preloads} preload(s) da foto de topo`);
