// Aplica a agenda de pacotes (src/config/agenda-pacotes.json): despublica pacotes que já terminaram
// (com redirecionamento 301) e liga/desliga "mostrar na home" nas datas combinadas.
// Roda todo dia pelo GitHub (.github/workflows/agenda-pacotes.yml). Só altera o arquivo do pacote;
// quem publica é o workflow. Para testar: HOJE=2026-11-23 node scripts/aplicar-agenda-pacotes.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const hoje = process.env.HOJE || new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10); // horário de Brasília
const agenda = JSON.parse(readFileSync('src/config/agenda-pacotes.json', 'utf8'));
let mudou = 0;

const setBool = (s, k, v) => (new RegExp(`^${k}:`, 'm').test(s) ? s.replace(new RegExp(`^${k}:.*$`, 'm'), `${k}: ${v}`) : s.replace(/^(destaque:.*)$/m, `$1\n${k}: ${v}`));

for (const a of agenda) {
  if (a.a_partir_de > hoje) continue;
  const f = `src/content/pacotes/${a.pacote}.yaml`;
  if (!existsSync(f)) { console.warn(`[agenda] pacote não encontrado: ${a.pacote}`); continue; }
  const orig = readFileSync(f, 'utf8');
  let s = orig;
  if (a.publicado !== undefined) s = setBool(s, 'publicado', a.publicado);
  if (a.mostrarNaHome !== undefined) s = setBool(s, 'mostrarNaHome', a.mostrarNaHome);
  if (a.redirecionar && a.publicado === false) {
    s = s.replace(/^redirecionar:\n  discriminant:.*\n  value:.*$/m, `redirecionar:\n  discriminant: ${a.redirecionar}\n  value: null`);
  }
  if (s !== orig) {
    writeFileSync(f, s);
    mudou++;
    console.log(`[agenda] ${a.pacote}: ${a.obs || 'atualizado'}`);
  }
}
console.log(mudou ? `[agenda] ${mudou} pacote(s) atualizado(s)` : '[agenda] nada a fazer hoje');
