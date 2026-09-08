// Генератор copy-keys: shared/copy/keys.tsv -> shared/src/copy.keys.ts
// Использование: node scripts/build-copy.mjs [--check]
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TSV = join(ROOT, 'shared/copy/keys.tsv');
const OUT = join(ROOT, 'shared/src/copy.keys.ts');
const CHECK = process.argv.includes('--check');

const fail = (msg) => {
  console.error(`build-copy: ${msg}`);
  process.exit(1);
};

const lines = readFileSync(TSV, 'utf-8').split('\n');
if (lines.at(-1) === '') lines.pop();
const header = lines.shift();
if (header !== 'key\tscope\tarea\tscreen\tru\ten\tstatus\tnote') {
  fail(`неверный заголовок TSV: ${JSON.stringify(header)}`);
}

const KEY_RE = /^[A-Za-z0-9_.@-]+$/;
const SLOT_RE = /\{([^{}]+)\}/g;
const seen = new Set();
const ru = {};
const en = {};
const todo = [];
let nDraft = 0;

lines.forEach((line, i) => {
  const row = `${i + 2}`;
  const cols = line.split('\t');
  if (cols.length !== 8) fail(`строка ${row}: ожидалось 8 колонок, получено ${cols.length}`);
  const [key, scope, area, screen, rv, ev, status, note] = cols;
  if (!KEY_RE.test(key)) fail(`строка ${row}: плохое имя ключа ${JSON.stringify(key)}`);
  if (seen.has(key)) fail(`строка ${row}: дубликат ключа ${key}`);
  seen.add(key);
  if (scope !== 'mvp' && scope !== 'later')
    fail(`строка ${row} (${key}): scope=${JSON.stringify(scope)}`);
  if (area !== key.split('.')[0]) fail(`строка ${row} (${key}): area=${JSON.stringify(area)}`);
  if (status !== 'ok' && status !== 'draft' && status !== 'todo') {
    fail(`строка ${row} (${key}): status=${JSON.stringify(status)}`);
  }
  if (status === 'todo') {
    if (rv !== '') fail(`строка ${row} (${key}): todo с непустым ru`);
    todo.push(key);
  } else {
    if (rv === '') fail(`строка ${row} (${key}): пустой ru при status=${status}`);
    ru[key] = rv;
  }
  if (ev !== '') {
    if (status === 'todo') fail(`строка ${row} (${key}): todo с непустым en`);
    en[key] = ev;
    const rSlots = [...rv.matchAll(SLOT_RE)]
      .map((m) => m[1])
      .sort()
      .join(',');
    const eSlots = [...ev.matchAll(SLOT_RE)]
      .map((m) => m[1])
      .sort()
      .join(',');
    if (rSlots !== eSlots) fail(`строка ${row} (${key}): слоты ru{${rSlots}} ≠ en{${eSlots}}`);
  }
  if (status === 'draft') nDraft++;
  void screen;
  void note;
});

const esc = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const emit = (obj) =>
  Object.entries(obj)
    .map(([k, v]) => `  '${k}': '${esc(v)}',`)
    .join('\n');

const out =
  `// СГЕНЕРИРОВАНО из shared/copy/keys.tsv — не редактировать вручную.\n` +
  `// Регенерация: npm run build:copy (см. shared/copy/README.md).\n` +
  `export const RU: Record<string, string> = {\n${emit(ru)}\n};\n\n` +
  `export const EN: Record<string, string> = {\n${emit(en)}\n};\n\n` +
  `/** Ключи без текста (status=todo в keys.tsv): слоты под будущий контент. */\n` +
  `export const COPY_TODO: string[] = [\n${todo.map((k) => `  '${k}',`).join('\n')}\n];\n`;

if (CHECK) {
  let cur = null;
  try {
    cur = readFileSync(OUT, 'utf-8');
  } catch {
    fail(`${OUT} отсутствует — запусти npm run build:copy`);
  }
  if (cur !== out) fail(`${OUT} рассинхронизирован с keys.tsv — запусти npm run build:copy`);
  console.log(`build-copy: OK (${seen.size} ключей, todo=${todo.length}, draft=${nDraft})`);
} else {
  writeFileSync(OUT, out);
  console.log(
    `build-copy: записано ${OUT} (${seen.size} ключей, todo=${todo.length}, draft=${nDraft})`,
  );
}
