// T004-минимум · SVG pipeline: currentColor-источники → белые рантайм-копии для Phaser tint.
// Источники: client/assets-src/icons/*.svg (канон, currentColor).
// Выход: client/public/assets/icons/*.svg (рантайм, #FFFFFF × tint).
// Лимиты: ≤400B/иконка, core-набор ≤12KB (ui-graphics.md §3/§11).
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, 'client', 'assets-src', 'icons');
const outDir = join(root, 'client', 'public', 'assets', 'icons');

mkdirSync(outDir, { recursive: true });
const files = readdirSync(srcDir)
  .filter((f) => f.endsWith('.svg'))
  .sort();
let total = 0;
for (const file of files) {
  const src = readFileSync(join(srcDir, file), 'utf8');
  const bytes = Buffer.byteLength(src);
  if (bytes > 400) {
    console.error(`build-icons: FAIL ${file} = ${bytes}B > 400B`);
    process.exit(1);
  }
  total += bytes;
  const runtime = src.replace(/currentColor/g, '#FFFFFF');
  writeFileSync(join(outDir, file), runtime);
}
if (total > 12 * 1024) {
  console.error(`build-icons: FAIL core set = ${total}B > 12KB`);
  process.exit(1);
}
console.log(`build-icons: OK (${files.length} icons, ${total}B)`);
