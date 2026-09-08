// Lazily-инициализируемый Drizzle-клиент поверх better-sqlite3.
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

function dbPath(): string {
  return process.env['DATABASE_URL'] ?? join(rootDir, 'data', 'signal-arena.db');
}

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function database(): ReturnType<typeof drizzle<typeof schema>> {
  if (!db) {
    const path = dbPath();
    mkdirSync(dirname(path), { recursive: true });
    const sqlite = new Database(path);
    db = drizzle(sqlite, { schema });
  }
  return db;
}
