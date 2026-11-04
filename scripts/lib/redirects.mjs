// Lê os pacotes e posts do painel e devolve os redirecionamentos 301 dos que foram despublicados.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';

const COLECOES = [
  { dir: 'src/content/pacotes', ext: '.yaml', base: '/pacotes' },
  { dir: 'src/content/posts', ext: '.mdoc', base: '/blog' },
];

function lerDados(arquivo, ext) {
  const raw = readFileSync(arquivo, 'utf8');
  if (ext === '.yaml') return YAML.parse(raw);
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  return YAML.parse(m ? m[1] : '');
}

export function redirectsDoPainel(raiz = process.cwd()) {
  const lista = [];
  for (const { dir, ext, base } of COLECOES) {
    const pasta = join(raiz, dir);
    if (!existsSync(pasta)) continue;
    for (const f of readdirSync(pasta).filter((n) => n.endsWith(ext))) {
      let d;
      try { d = lerDados(join(pasta, f), ext); } catch { continue; }
      if (!d || d.publicado !== false) continue;
      const slug = f.slice(0, -ext.length);
      const r = d.redirecionar;
      const escolha = r && r.discriminant;
      if (!escolha || escolha === 'nenhum') continue;
      const para = escolha === 'outro' ? (r.value ? `${base}/${r.value}` : null) : escolha;
      const de = `${base}/${slug}`;
      if (!para || para === de) continue;
      lista.push({ de, para });
    }
  }
  return lista;
}
