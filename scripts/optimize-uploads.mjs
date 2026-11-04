// Converte fotos enviadas pelo painel (public/uploads) para WebP antes do build.
import sharp from 'sharp';
import { readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const root = 'public/uploads';
const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
if (existsSync(root)) {
  let n = 0;
  for (const f of walk(root)) {
    if (!/\.(jpe?g|png)$/i.test(f)) continue;
    const out = f.replace(/\.(jpe?g|png)$/i, '.webp');
    if (existsSync(out)) continue;
    await sharp(f).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 76 }).toFile(out);
    n++;
  }
  console.log(`[uploads] ${n} foto(s) convertida(s) para WebP`);
}
