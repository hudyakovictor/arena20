// SIGNAL ARENA — модель данных бэкенда (ТЗ Часть 6 §5.2)
// PostgreSQL + Drizzle. Контент в рантайме читается из кода/пакета, здесь — игрок, социальное, сервис.
import {
  pgTable, text, integer, bigint, boolean, timestamp, jsonb, real, uuid, index, uniqueIndex, serial,
} from 'drizzle-orm/pg-core';

// ─── Игрок ──────────────────────────────────────────────────────────────────
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  authKind: text('auth_kind').default('anonymous').notNull(), // anonymous | email | social | wallet
  email: text('email'),
  segment: text('segment').default('default').notNull(), // A/B сегмент конфига
  displayName: text('display_name'),
  premium: boolean('premium').default(false).notNull(), // не участвует в engine
});

export const devices = pgTable('devices', {
  id: text('id').primaryKey(), // device id клиента
  userId: uuid('user_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).defaultNow().notNull(),
  userAgent: text('user_agent'),
}, (t) => [index('devices_user_idx').on(t.userId)]);

export const progress = pgTable('progress', {
  userId: uuid('user_id').primaryKey().references(() => users.id),
  level: integer('level').default(1).notNull(),
  xp: integer('xp').default(0).notNull(), // суммарный XP
  coins: integer('coins').default(0).notNull(), // SIG
  epoch: text('epoch').default('street').notNull(),
  riskBudget: integer('risk_budget').default(100).notNull(),
  streak: integer('streak').default(0).notNull(),
  lastActiveDay: text('last_active_day'), // YYYY-MM-DD
  hubrisStreak: integer('hubris_streak').default(0).notNull(), // M3 high+ошибка подряд
  tiltStreak: integer('tilt_streak').default(0).notNull(),     // M10 серия ошибок
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const cardProgress = pgTable('card_progress', {
  userId: uuid('user_id').references(() => users.id).notNull(),
  cardId: text('card_id').notNull(),
  rank: integer('rank').default(0).notNull(),
  atomsDone: jsonb('atoms_done').$type<string[]>().default([]).notNull(),
  grantedAt: timestamp('granted_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex('card_progress_pk').on(t.userId, t.cardId)]);

export const comboProgress = pgTable('combo_progress', {
  userId: uuid('user_id').references(() => users.id).notNull(),
  comboId: text('combo_id').notNull(),
  count: integer('count').default(0).notNull(),
  unlockedAt: timestamp('unlocked_at', { withTimezone: true }),
}, (t) => [uniqueIndex('combo_progress_pk').on(t.userId, t.comboId)]);

export const enemyProgress = pgTable('enemy_progress', {
  userId: uuid('user_id').references(() => users.id).notNull(),
  enemyId: text('enemy_id').notNull(),
  stageReached: integer('stage_reached').default(0).notNull(), // максимальная побеждённая стадия
  trophyLayers: jsonb('trophy_layers').$type<number[]>().default([]).notNull(),
  errorProfile: jsonb('error_profile').$type<Record<string, number>>().default({}).notNull(),
  identified: boolean('identified').default(false).notNull(), // M5 — полный рендер раскрыт
  lastWinAt: timestamp('last_win_at', { withTimezone: true }),
  encounters: integer('encounters').default(0).notNull(),
}, (t) => [uniqueIndex('enemy_progress_pk').on(t.userId, t.enemyId)]);

export const mistakeScroll = pgTable('mistake_scroll', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  atom: text('atom').notNull(),
  enemyId: text('enemy_id').notNull(),
  stage: integer('stage').notNull(),
  templateId: text('template_id').notNull(),
  missedEvidence: text('missed_evidence').notNull(),
  mutationDepth: integer('mutation_depth').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  closedAt: timestamp('closed_at', { withTimezone: true }),
}, (t) => [index('mistake_scroll_user_idx').on(t.userId)]);

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  riskBudgetStart: integer('risk_budget_start').notNull(),
  riskBudgetEnd: integer('risk_budget_end'),
  weatherMode: text('weather_mode').notNull(),
  endedBy: text('ended_by'), // budget_zero | player | leviathan | timeout
  attempts: integer('attempts').default(0).notNull(),
}, (t) => [index('sessions_user_idx').on(t.userId)]);

export const attempts = pgTable('attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  sessionId: uuid('session_id'),
  clientAttemptId: text('client_attempt_id'), // идемпотентность офлайн-очереди
  templateId: text('template_id').notNull(),
  contentVersion: text('content_version').notNull(),
  seed: bigint('seed', { mode: 'number' }).notNull(),
  mode: text('mode').default('standard').notNull(), // standard | sequence | verdict | blind
  answer: integer('answer'),
  evidence: jsonb('evidence').$type<string[]>().default([]).notNull(),
  confidence: text('confidence'),
  openedSources: jsonb('opened_sources').$type<string[]>().default([]).notNull(),
  sequence: jsonb('sequence').$type<string[]>().default([]).notNull(),
  verdict: text('verdict'),
  blindOpened: boolean('blind_opened').default(false).notNull(),
  result: text('result').notNull(), // correct | correct_unfounded | wrong
  xp: integer('xp').default(0).notNull(),
  coins: integer('coins').default(0).notNull(),
  budgetDelta: integer('budget_delta').default(0).notNull(),
  durationMs: integer('duration_ms').default(0).notNull(),
  flags: jsonb('flags').$type<string[]>().default([]).notNull(), // антифрод
  tournamentId: uuid('tournament_id'),
  clientTs: bigint('client_ts', { mode: 'number' }),
  serverTs: timestamp('server_ts', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('attempts_user_idx').on(t.userId),
  index('attempts_template_idx').on(t.templateId),
  uniqueIndex('attempts_client_id_uq').on(t.userId, t.clientAttemptId),
]);

export const calibration = pgTable('calibration', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  bucket: text('bucket').notNull(), // low | mid | high
  predicted: real('predicted').notNull(),
  actual: integer('actual').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index('calibration_user_idx').on(t.userId)]);

export const scheduleQueue = pgTable('schedule_queue', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  itemType: text('item_type').notNull(), // scroll | stage | new_card | weather | event
  ref: text('ref').notNull(), // templateId / enemyId:stage / scrollId
  templateId: text('template_id').notNull(),
  seed: bigint('seed', { mode: 'number' }).notNull(),
  dueAt: timestamp('due_at', { withTimezone: true }).defaultNow().notNull(),
  priority: integer('priority').default(0).notNull(),
  reason: text('reason').notNull(),
  consumedAt: timestamp('consumed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index('schedule_user_idx').on(t.userId, t.consumedAt)]);

export const dailySeeds = pgTable('daily_seeds', {
  userId: uuid('user_id').references(() => users.id).notNull(),
  day: text('day').notNull(), // YYYY-MM-DD
  seed: bigint('seed', { mode: 'number' }).notNull(),
  weatherMode: text('weather_mode').notNull(),
  issuedAt: timestamp('issued_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex('daily_seeds_pk').on(t.userId, t.day)]);

// ─── Социальное ────────────────────────────────────────────────────────────
export const answerDistribution = pgTable('answer_distribution', {
  templateId: text('template_id').notNull(),
  variant: integer('variant').notNull(), // индекс варианта в исходном шаблоне (до перестановки)
  count: integer('count').default(0).notNull(),
}, (t) => [uniqueIndex('answer_distribution_pk').on(t.templateId, t.variant)]);

export const tournaments = pgTable('tournaments', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  seedSet: jsonb('seed_set').$type<{ templateId: string; seed: number }[]>().notNull(),
  configVersion: text('config_version').notNull(),
  contentVersion: text('content_version').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const shadowRuns = pgTable('shadow_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  tournamentId: uuid('tournament_id').references(() => tournaments.id).notNull(),
  deviceId: text('device_id').notNull(),
  answers: jsonb('answers').$type<Record<string, { answer: number; result: string; ms: number }>>().default({}).notNull(),
  score: integer('score').default(0).notNull(),
  totalMs: integer('total_ms').default(0).notNull(),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
}, (t) => [uniqueIndex('shadow_runs_pk').on(t.userId, t.tournamentId)]);

// ─── Сервис ────────────────────────────────────────────────────────────────
export const configs = pgTable('configs', {
  version: text('version').notNull(),
  segment: text('segment').default('default').notNull(),
  json: jsonb('json').$type<Record<string, unknown>>().notNull(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex('configs_pk').on(t.version, t.segment)]);

export const contentPackages = pgTable('content_packages', {
  version: text('version').primaryKey(),
  publishedAt: timestamp('published_at', { withTimezone: true }).defaultNow().notNull(),
  json: jsonb('json').$type<Record<string, unknown>>().notNull(),
  autotest: jsonb('autotest').$type<Record<string, unknown>>(),
  active: boolean('active').default(false).notNull(),
});

// Черновики шаблонов из ИИ-конвейера (ТЗ Часть 6 §7)
export const templateDrafts = pgTable('template_drafts', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: text('template_id').notNull(),
  status: text('status').default('draft').notNull(), // draft | rejected | approved | published
  provider: text('provider').notNull(), // openai | synthetic
  model: text('model'),
  request: jsonb('request').$type<Record<string, unknown>>().notNull(),
  template: jsonb('template').$type<Record<string, unknown>>().notNull(),
  report: jsonb('report').$type<Record<string, unknown>>().notNull(), // автотест + боты
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  reviewNote: text('review_note'),
});

export const eventLog = pgTable('event_log', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id'),
  sessionId: uuid('session_id'),
  name: text('name').notNull(),
  epoch: text('epoch'),
  level: integer('level'),
  contentVersion: text('content_version'),
  payload: jsonb('payload').$type<Record<string, unknown>>().default({}).notNull(),
  clientTs: bigint('client_ts', { mode: 'number' }),
  serverTs: timestamp('server_ts', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index('event_log_name_idx').on(t.name), index('event_log_user_idx').on(t.userId)]);

export const purchases = pgTable('purchases', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  sku: text('sku').notNull(),
  kind: text('kind').notNull(), // premium | cosmetic
  priceSig: integer('price_sig').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
