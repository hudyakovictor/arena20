// SQLite через sql.js (wasm, без нативных сборок — стек ТЗ: Fastify + SQLite + Drizzle + Zod + WS).
// Файл БД: backend/data/arena.db (gitignored). Миграции — drizzle-kit generate → drizzle/.
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import initSqlJs from "sql.js";
import { drizzle } from "drizzle-orm/sql-js";
import { migrate } from "drizzle-orm/sql-js/migrator";

const require_ = createRequire(import.meta.url);
const dataDir = path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });
const file = path.join(dataDir, "arena.db");

const SQL = await initSqlJs({
  locateFile: (f: string) => path.join(path.dirname(require_.resolve("sql.js")), f),
});

export const sqlite = new SQL.Database(fs.existsSync(file) ? fs.readFileSync(file) : undefined);
export const db = drizzle(sqlite);

// применяем сгенерированные миграции (idempotent)
await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });

// персист: периодическое сохранение файла + при выходе
function save() {
  fs.writeFileSync(file, Buffer.from(sqlite.export()));
}
setInterval(() => { try { save(); } catch { /* noop */ } }, 5000);
export function persist() { save(); }
process.on("exit", () => { try { save(); } catch { /* noop */ } });
process.on("SIGINT", () => process.exit(0));
