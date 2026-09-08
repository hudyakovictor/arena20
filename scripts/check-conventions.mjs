// T000: автоматизируемые конвенции 00_CONVENTIONS.md / 02_TECH_STACK.md,
// которые неудобно выразить правилами ESLint. Падает в CI при нарушении.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const failures = [];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name === 'coverage' || name === '.git')
      continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|js|mjs|cjs|html|css)$/.test(name)) out.push(full);
  }
  return out;
}

function check(label, files, predicate, hint) {
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    const lines = text.split('\n');
    lines.forEach((line, i) => {
      if (predicate(line, file)) {
        failures.push(
          `${label}: ${relative(ROOT, file)}:${i + 1}: ${line.trim().slice(0, 120)}\n  -> ${hint}`,
        );
      }
    });
  }
}

const clientSrc = walk(join(ROOT, 'client', 'src'));
const sharedSrc = walk(join(ROOT, 'shared', 'src'));
const serverSrc = walk(join(ROOT, 'server', 'src'));
const allSrc = [...clientSrc, ...sharedSrc, ...serverSrc];
const notTest = (file) => !/\.test\.ts$/.test(file);

// 1. Нет хардкода HEX в сценах/клиенте — только через дизайн-токены (T002).
//    Исключение: сам модуль токенов и тесты.
check(
  'HEX-HARDCODE',
  clientSrc.filter((f) => notTest(f) && !f.endsWith('tokens.ts')),
  (line) => /#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?\b/.test(line) && !line.trimStart().startsWith('//'),
  'HEX только через UI_TINT/UI_HEX из @signal-arena/shared',
);

// 2. Emoji и icon-font запрещены как production-иконки (только SVG/Text-глифы-заглушки в dev).
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u;
check(
  'EMOJI-ICON',
  allSrc.filter(notTest),
  (line) => EMOJI.test(line),
  'emoji запрещены как prod-иконки: только SVG через manifest (см. assets.md)',
);

// 3. Math.random запрещён в домене/рантайме (детерминизм через seedrandom-обёртку).
check(
  'MATH-RANDOM',
  [...sharedSrc, ...clientSrc].filter(notTest),
  (line) => line.includes('Math.random') && !line.trimStart().startsWith('//'),
  'детерминизм: только createRng() из @signal-arena/shared',
);

// 4. Готовые web-графики запрещены (только свой CandleChart на Graphics).
check(
  'WEB-CHART',
  allSrc.filter(notTest),
  (line) =>
    /lightweight-charts|tradingview|highcharts|['"]chart\.js['"]|\becharts\b/i.test(line) &&
    !/CandleChart/i.test(line),
  'только собственный CandleChart на Phaser Graphics',
);

// 5. Скрытое future идёт только через воронку content.ts (revealScenario +
// futureCandlesOf) и рисуется только CandleChart. Остальному клиенту имя
// поля запрещено — защита от случайной утечки до фиксации решения.
const futureFunnel = new Set(['content.ts', 'CandleChart.ts']);
check(
  'FUTURE-LEAK',
  clientSrc.filter((f) => notTest(f) && ![...futureFunnel].some((tail) => f.endsWith(tail))),
  (line) => /futureCandles(?!Of)|hiddenFuture|fullScenario|ScenarioFull/i.test(line),
  'future только через content.revealScenario()/futureCandlesOf() + CandleChart',
);

if (failures.length > 0) {
  console.error(`check-conventions: FAILED (${failures.length})\n`);
  for (const f of failures) console.error(`- ${f}`);
  process.exit(1);
}
console.log(`check-conventions: OK (${allSrc.length} files scanned)`);
