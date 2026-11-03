// Relatório de SEO dos pacotes e posts criados pelo painel. Só avisa: nunca trava o build.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';

const norm = (t = '') => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const has = (text, kw) => norm(text).includes(norm(kw));
const words = (t) => String(t).split(/\s+/).filter(Boolean).length;

function load(dir, ext) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith(ext)).map((f) => {
    const raw = readFileSync(join(dir, f), 'utf8');
    try {
      if (ext === '.yaml') return { slug: f.slice(0, -5), data: YAML.parse(raw), body: '' };
      const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
      return { slug: f.slice(0, -5), data: YAML.parse(m ? m[1] : ''), body: m ? m[2] : '' };
    } catch (e) {
      console.log(`[SEO] não consegui ler ${f}: ${e.message.split('\n')[0]}`);
      return { slug: f.slice(0, -5), data: null, body: '' };
    }
  });
}

const items = [
  ...load('src/content/pacotes', '.yaml').map((i) => ({ ...i, tipo: 'pacote' })),
  ...load('src/content/posts', '.mdoc').map((i) => ({ ...i, tipo: 'post' })),
].filter((i) => i.data && i.data.publicado !== false && !i.data.semIndexar);

let avisos = 0;
for (const { slug, data: d, body, tipo } of items) {
  const kw = d.palavraChave;
  const problemas = [];
  const t = d.metaTitulo || '', desc = d.metaDescricao || '';
  if (!kw) problemas.push('sem palavra-chave principal');
  if (t.length < 30 || t.length > 60) problemas.push(`título com ${t.length} caracteres (ideal 30–60)`);
  if (desc.length < 120 || desc.length > 155) problemas.push(`descrição com ${desc.length} caracteres (ideal 120–155)`);
  if (kw && !has(t, kw)) problemas.push('palavra-chave não aparece no título do Google');
  if (kw && !has(desc, kw)) problemas.push('palavra-chave não aparece na descrição do Google');
  if (kw && !has(String(d.titulo || '') + ' ' + (d.tituloAntes || ''), kw)) problemas.push('palavra-chave não aparece no título da página (H1)');
  if (tipo === 'post') {
    const texto = body.replace(/[#*_>\[\]()`-]/g, ' ');
    if (kw && !has(texto.split(/\s+/).slice(0, 120).join(' '), kw)) problemas.push('palavra-chave não aparece nas primeiras 120 palavras');
    if (words(texto) < 300) problemas.push(`texto curto (${words(texto)} palavras; ideal 300+)`);
    if (!/\]\(\/[^)]*\)/.test(body)) problemas.push('nenhum link interno (ex.: para /suites ou /pacotes)');
    if (!(d.perguntas || []).length) problemas.push('sem perguntas e respostas (ajudam em respostas do Google e de IAs)');
  }
  if (problemas.length) { avisos += problemas.length; console.log(`\n[SEO] ${tipo} "${slug}"\n  - ${problemas.join('\n  - ')}`); }
  else console.log(`[SEO] ${tipo} "${slug}": ok`);
}
if (items.length === 0) console.log('[SEO] nenhum pacote/post do painel publicado ainda');
else console.log(`\n[SEO] ${avisos} aviso(s) em ${items.length} página(s). Avisos não impedem a publicação.`);
