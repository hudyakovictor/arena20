// Применение SQL-миграций drizzle/ к SQLite (T100: «миграции применяются»).
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const dbPath = process.env['DATABASE_URL'] ?? join(rootDir, 'data', 'signal-arena.db');

const sqlite = new Database(dbPath);
const db = drizzle(sqlite);
migrate(db, { migrationsFolder: join(rootDir, 'drizzle') });
console.log(`migrations applied: ${dbPath}`);
