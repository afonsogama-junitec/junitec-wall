// Valida os cartões em people/*.json e gera people/index.json.
// Uso: node scripts/build-index.mjs [--check]
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const DIR = 'people';
const check = process.argv.includes('--check');
const errors = [];
const cards = [];

const files = readdirSync(DIR).filter((f) => f.endsWith('.json') && f !== 'index.json').sort();

for (const f of files) {
  const fail = (msg) => errors.push(`${DIR}/${f}: ${msg}`);
  if (!/^[a-z0-9-]+\.json$/.test(f)) { fail('o nome do ficheiro só pode ter a-z, 0-9 e hífens'); continue; }
  let p;
  try { p = JSON.parse(readFileSync(`${DIR}/${f}`, 'utf8')); }
  catch (e) { fail(`JSON inválido (${e.message})`); continue; }

  const str = (k, max, required = false) => {
    const v = p[k];
    if (v === undefined || v === '') { if (required) fail(`falta "${k}"`); return ''; }
    if (typeof v !== 'string') { fail(`"${k}" tem de ser texto`); return ''; }
    if (Array.from(v).length > max) fail(`"${k}" excede ${max} caracteres`);
    return v;
  };
  const card = {
    name: str('name', 30, true),
    emoji: str('emoji', 8) || '🙂',
    tech: str('tech', 24),
    fact: str('fact', 2500),
    color: typeof p.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(p.color) ? p.color : '',
  };
  if (!card.color) { fail('"color" tem de ser um hex como #6c5ce7'); card.color = '#6c5ce7'; }
  cards.push(card);
}

if (errors.length) {
  console.error('Erros encontrados:\n- ' + errors.join('\n- '));
  process.exit(1);
}
console.log(`${cards.length} cartões válidos.`);
if (!check) writeFileSync(`${DIR}/index.json`, JSON.stringify(cards));
