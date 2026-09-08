import { describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { journalEntries, profiles } from './schema.js';

const here = dirname(fileURLToPath(import.meta.url));

describe('T100 миграции', () => {
  it('миграции применяются на чистую БД, таблицы пишутся/читаются', () => {
    const sqlite = new Database(':memory:');
    const db = drizzle(sqlite);
    migrate(db, { migrationsFolder: join(here, '..', '..', 'drizzle') });
    db.insert(profiles)
      .values({
        profileId: 'p1',
        displayName: 'Tester',
        xp: 10,
        rank: 1,
        credits: 5,
        createdAt: '2026-09-08',
        updatedAt: '2026-09-08',
      })
      .run();
    db.insert(journalEntries)
      .values({
        entryId: 'e1',
        profileId: 'p1',
        scenarioId: 'mvp-001',
        contentVersion: '0.1.0',
        decisionId: 'b',
        quality: 92,
        createdAt: '2026-09-08',
      })
      .run();
    const rows = db.select().from(profiles).all();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.displayName).toBe('Tester');
  });
});
