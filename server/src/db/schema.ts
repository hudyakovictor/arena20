// T100-минимум · Drizzle-схема SQLite. Полные таблицы — T101/T103/T104.
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const profiles = sqliteTable('profiles', {
  profileId: text('profile_id').primaryKey(),
  displayName: text('display_name').notNull(),
  xp: integer('xp').notNull().default(0),
  rank: integer('rank').notNull().default(0),
  credits: integer('credits').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const journalEntries = sqliteTable('journal_entries', {
  entryId: text('entry_id').primaryKey(),
  profileId: text('profile_id').notNull(),
  scenarioId: text('scenario_id').notNull(),
  contentVersion: text('content_version').notNull(),
  decisionId: text('decision_id').notNull(),
  quality: integer('quality').notNull(),
  createdAt: text('created_at').notNull(),
});
