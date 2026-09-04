// SIGNAL ARENA — модель данных бэкенда (ТЗ Часть 6 §5.2)
// SQLite + Drizzle (стек ТЗ: Fastify, SQLite, Drizzle, Zod, WS). Контент в рантайме читается
// из кода/пакета; здесь — игрок, социальное, сервис.
import { randomUUID } from 'node:crypto';
import {
  sqliteTable, text, integer, real, index, uniqueIndex,
} from 'drizzle-orm/sqlite-core';

const uid = () => randomUUID();
const now = () => new Date();
const ts = (name: string) => integer(name, { mode: 'timestamp_ms' });

// ─── Игрок ──────────────────────────────────────────────────────────────────
export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(uid),
  createdAt: ts('created_at').notNull().$defaultFn(now),
  authKind: text('auth_kind').default('anonymous').notNull(), // anonymous | email | social | wallet
  email: text('email'),
  segment: text('segment').default('default').notNull(), // A/B сегмент конфига
  displayName: text('display_name'),
  premium: integer('premium', { mode: 'boolean' }).default(false).notNull(), // не участвует в engine
});

export const devices = sqliteTable('devices', {
  id: text('id').primaryKey(), // device id клиента
  userId: text('user_id').references(() => users.id).notNull(),
  createdAt: ts('created_at').notNull().$defaultFn(now),
  lastSeenAt: ts('last_seen_at').notNull().$defaultFn(now),
  userAgent: text('user_agent'),
}, (t) => [index('devices_user_idx').on(t.userId)]);

export const progress = sqliteTable('progress', {
  userId: text('user_id').primaryKey().references(() => users.id),
  level: integer('level').default(1).notNull(),
  xp: integer('xp').default(0).notNull(), // суммарный XP
  coins: integer('coins').default(0).notNull(), // SIG
  epoch: text('epoch').default('street').notNull(),
  riskBudget: integer('risk_budget').default(100).notNull(),
  streak: integer('streak').default(0).notNull(),
  lastActiveDay: text('last_active_day'), // YYYY-MM-DD
  hubrisStreak: integer('hubris_streak').default(0).notNull(), // M3 high+ошибка подряд
  tiltStreak: integer('tilt_streak').default(0).notNull(),     // M10 серия ошибок
  updatedAt: ts('updated_at').notNull().$defaultFn(now),
});

export const cardProgress = sqliteTable('card_progress', {
  userId: text('user_id').references(() => users.id).notNull(),
  cardId: text('card_id').notNull(),
  rank: integer('rank').default(0).notNull(),
  atomsDone: text('atoms_done', { mode: 'json' }).$type<string[]>().default([]).notNull(),
  grantedAt: ts('granted_at'),
  updatedAt: ts('updated_at').notNull().$defaultFn(now),
}, (t) => [uniqueIndex('card_progress_pk').on(t.userId, t.cardId)]);

export const comboProgress = sqliteTable('combo_progress', {
  userId: text('user_id').references(() => users.id).notNull(),
  comboId: text('combo_id').notNull(),
  count: integer('count').default(0).notNull(),
  unlockedAt: ts('unlocked_at'),
}, (t) => [uniqueIndex('combo_progress_pk').on(t.userId, t.comboId)]);

export const enemyProgress = sqliteTable('enemy_progress', {
  userId: text('user_id').references(() => users.id).notNull(),
  enemyId: text('enemy_id').notNull(),
  stageReached: integer('stage_reached').default(0).notNull(), // максимальная побеждённая стадия
  trophyLayers: text('trophy_layers', { mode: 'json' }).$type<number[]>().default([]).notNull(),
  errorProfile: text('error_profile', { mode: 'json' }).$type<Record<string, number>>().default({}).notNull(),
  identified: integer('identified', { mode: 'boolean' }).default(false).notNull(), // M5 — полный рендер раскрыт
  lastWinAt: ts('last_win_at'),
  encounters: integer('encounters').default(0).notNull(),
}, (t) => [uniqueIndex('enemy_progress_pk').on(t.userId, t.enemyId)]);

export const mistakeScroll = sqliteTable('mistake_scroll', {
  id: text('id').primaryKey().$defaultFn(uid),
  userId: text('user_id').references(() => users.id).notNull(),
  atom: text('atom').notNull(),
  enemyId: text('enemy_id').notNull(),
  stage: integer('stage').notNull(),
  templateId: text('template_id').notNull(),
  missedEvidence: text('missed_evidence').notNull(),
  mutationDepth: integer('mutation_depth').default(0).notNull(),
  createdAt: ts('created_at').notNull().$defaultFn(now),
  closedAt: ts('closed_at'),
}, (t) => [index('mistake_scroll_user_idx').on(t.userId)]);

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey().$defaultFn(uid),
  userId: text('user_id').references(() => users.id).notNull(),
  startedAt: ts('started_at').notNull().$defaultFn(now),
  endedAt: ts('ended_at'),
  riskBudgetStart: integer('risk_budget_start').notNull(),
  riskBudgetEnd: integer('risk_budget_end'),
  weatherMode: text('weather_mode').notNull(),
  endedBy: text('ended_by'), // budget_zero | player | leviathan | timeout
  attempts: integer('attempts').default(0).notNull(),
}, (t) => [index('sessions_user_idx').on(t.userId)]);

export const attempts = sqliteTable('attempts', {
  id: text('id').primaryKey().$defaultFn(uid),
  userId: text('user_id').references(() => users.id).notNull(),
  sessionId: text('session_id'),
  clientAttemptId: text('client_attempt_id'), // идемпотентность офлайн-очереди
  templateId: text('template_id').notNull(),
  contentVersion: text('content_version').notNull(),
  seed: integer('seed', { mode: 'number' }).notNull(),
  mode: text('mode').default('standard').notNull(), // standard | sequence | verdict | blind
  answer: integer('answer'),
  evidence: text('evidence', { mode: 'json' }).$type<string[]>().default([]).notNull(),
  confidence: text('confidence'),
  openedSources: text('opened_sources', { mode: 'json' }).$type<string[]>().default([]).notNull(),
  sequence: text('sequence', { mode: 'json' }).$type<string[]>().default([]).notNull(),
  verdict: text('verdict'),
  blindOpened: integer('blind_opened', { mode: 'boolean' }).default(false).notNull(),
  result: text('result').notNull(), // correct | correct_unfounded | wrong
  xp: integer('xp').default(0).notNull(),
  coins: integer('coins').default(0).notNull(),
  budgetDelta: integer('budget_delta').default(0).notNull(),
  durationMs: integer('duration_ms').default(0).notNull(),
  flags: text('flags', { mode: 'json' }).$type<string[]>().default([]).notNull(), // антифрод
  tournamentId: text('tournament_id'),
  clientTs: integer('client_ts', { mode: 'number' }),
  serverTs: ts('server_ts').notNull().$defaultFn(now),
}, (t) => [
  index('attempts_user_idx').on(t.userId),
  index('attempts_template_idx').on(t.templateId),
  uniqueIndex('attempts_client_id_uq').on(t.userId, t.clientAttemptId),
]);

export const calibration = sqliteTable('calibration', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').references(() => users.id).notNull(),
  bucket: text('bucket').notNull(), // low | mid | high
  predicted: real('predicted').notNull(),
  actual: integer('actual').notNull(),
  createdAt: ts('created_at').notNull().$defaultFn(now),
}, (t) => [index('calibration_user_idx').on(t.userId)]);

export const scheduleQueue = sqliteTable('schedule_queue', {
  id: text('id').primaryKey().$defaultFn(uid),
  userId: text('user_id').references(() => users.id).notNull(),
  itemType: text('item_type').notNull(), // scroll | stage | new_card | weather | event
  ref: text('ref').notNull(), // templateId / enemyId:stage / scrollId
  templateId: text('template_id').notNull(),
  seed: integer('seed', { mode: 'number' }).notNull(),
  dueAt: ts('due_at').notNull().$defaultFn(now),
  priority: integer('priority').default(0).notNull(),
  reason: text('reason').notNull(),
  consumedAt: ts('consumed_at'),
  createdAt: ts('created_at').notNull().$defaultFn(now),
}, (t) => [index('schedule_user_idx').on(t.userId, t.consumedAt)]);

export const dailySeeds = sqliteTable('daily_seeds', {
  userId: text('user_id').references(() => users.id).notNull(),
  day: text('day').notNull(), // YYYY-MM-DD
  seed: integer('seed', { mode: 'number' }).notNull(),
  weatherMode: text('weather_mode').notNull(),
  issuedAt: ts('issued_at').notNull().$defaultFn(now),
}, (t) => [uniqueIndex('daily_seeds_pk').on(t.userId, t.day)]);

// ─── Социальное ────────────────────────────────────────────────────────────
export const answerDistribution = sqliteTable('answer_distribution', {
  templateId: text('template_id').notNull(),
  variant: integer('variant').notNull(), // индекс варианта в исходном шаблоне (до перестановки)
  count: integer('count').default(0).notNull(),
}, (t) => [uniqueIndex('answer_distribution_pk').on(t.templateId, t.variant)]);

export const tournaments = sqliteTable('tournaments', {
  id: text('id').primaryKey().$defaultFn(uid),
  name: text('name').notNull(),
  startsAt: ts('starts_at').notNull(),
  endsAt: ts('ends_at').notNull(),
  seedSet: text('seed_set', { mode: 'json' }).$type<{ templateId: string; seed: number }[]>().notNull(),
  configVersion: text('config_version').notNull(),
  contentVersion: text('content_version').notNull(),
  createdAt: ts('created_at').notNull().$defaultFn(now),
});

export const shadowRuns = sqliteTable('shadow_runs', {
  id: text('id').primaryKey().$defaultFn(uid),
  userId: text('user_id').references(() => users.id).notNull(),
  tournamentId: text('tournament_id').references(() => tournaments.id).notNull(),
  deviceId: text('device_id').notNull(),
  answers: text('answers', { mode: 'json' }).$type<Record<string, { answer: number; result: string; ms: number }>>().default({}).notNull(),
  score: integer('score').default(0).notNull(),
  totalMs: integer('total_ms').default(0).notNull(),
  joinedAt: ts('joined_at').notNull().$defaultFn(now),
  finishedAt: ts('finished_at'),
}, (t) => [uniqueIndex('shadow_runs_pk').on(t.userId, t.tournamentId)]);

// ─── Сервис ────────────────────────────────────────────────────────────────
export const configs = sqliteTable('configs', {
  version: text('version').notNull(),
  segment: text('segment').default('default').notNull(),
  json: text('json', { mode: 'json' }).$type<Record<string, unknown>>().notNull(),
  active: integer('active', { mode: 'boolean' }).default(true).notNull(),
  createdAt: ts('created_at').notNull().$defaultFn(now),
}, (t) => [uniqueIndex('configs_pk').on(t.version, t.segment)]);

export const contentPackages = sqliteTable('content_packages', {
  version: text('version').primaryKey(),
  publishedAt: ts('published_at').notNull().$defaultFn(now),
  json: text('json', { mode: 'json' }).$type<Record<string, unknown>>().notNull(),
  autotest: text('autotest', { mode: 'json' }).$type<Record<string, unknown>>(),
  active: integer('active', { mode: 'boolean' }).default(false).notNull(),
});

// Черновики шаблонов из ИИ-конвейера (ТЗ Часть 6 §7)
export const templateDrafts = sqliteTable('template_drafts', {
  id: text('id').primaryKey().$defaultFn(uid),
  templateId: text('template_id').notNull(),
  status: text('status').default('draft').notNull(), // draft | rejected | approved | published
  provider: text('provider').notNull(), // openai | synthetic
  model: text('model'),
  request: text('request', { mode: 'json' }).$type<Record<string, unknown>>().notNull(),
  template: text('template', { mode: 'json' }).$type<Record<string, unknown>>().notNull(),
  report: text('report', { mode: 'json' }).$type<Record<string, unknown>>().notNull(), // автотест + боты
  createdAt: ts('created_at').notNull().$defaultFn(now),
  reviewedAt: ts('reviewed_at'),
  reviewNote: text('review_note'),
});

export const eventLog = sqliteTable('event_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id'),
  sessionId: text('session_id'),
  name: text('name').notNull(),
  epoch: text('epoch'),
  level: integer('level'),
  contentVersion: text('content_version'),
  payload: text('payload', { mode: 'json' }).$type<Record<string, unknown>>().default({}).notNull(),
  clientTs: integer('client_ts', { mode: 'number' }),
  serverTs: ts('server_ts').notNull().$defaultFn(now),
}, (t) => [index('event_log_name_idx').on(t.name), index('event_log_user_idx').on(t.userId)]);

export const purchases = sqliteTable('purchases', {
  id: text('id').primaryKey().$defaultFn(uid),
  userId: text('user_id').references(() => users.id).notNull(),
  sku: text('sku').notNull(),
  kind: text('kind').notNull(), // premium | cosmetic
  priceSig: integer('price_sig').default(0).notNull(),
  createdAt: ts('created_at').notNull().$defaultFn(now),
});
