import { createReader } from '@keystatic/core/reader';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import keystaticConfig from '../../keystatic.config';
import { whatsapp } from '../config/site';

export const reader = createReader(process.cwd(), keystaticConfig);

/** Foto enviada pelo painel: usa a versão WebP (gerada no build) quando existir. */
export function img(p: string | null | undefined): string {
  if (!p) return '';
  if (p.startsWith('/uploads/')) {
    const w = p.replace(/\.(jpe?g|png)$/i, '.webp');
    if (w !== p && existsSync(join(process.cwd(), 'public', w))) return w;
  }
  return p;
}

export const wa = (msg: string) =>
  `https://api.whatsapp.com/send?phone=${whatsapp}&text=${encodeURIComponent(msg)}`;

export async function listPacotes() {
  const all = await reader.collections.pacotes.all();
  return all
    .filter((p) => p.entry.publicado)
    .sort((a, b) => (a.entry.ordem ?? 9999) - (b.entry.ordem ?? 9999) || a.entry.titulo.localeCompare(b.entry.titulo));
}
export async function listPosts() {
  const all = await reader.collections.posts.all();
  return all
    .filter((p) => p.entry.publicado)
    .sort((a, b) => String(b.entry.data).localeCompare(String(a.entry.data)));
}
