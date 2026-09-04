// sessions · tournaments · shadow · analytics · billing
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { db } from '@/db';
import { sessions, progress, tournaments, shadowRuns, answerDistribution, eventLog, purchases, users, attempts } from '../db/schema';
import { templates } from '../content/templates';
import { ApiError, deterministicSeed } from '../http';
import { loadSnapshot } from './progress';
import { daySeed } from './scheduler';
import { getContentPackage, resolveTemplate } from './content';
import { getConfig } from './config';
import { balanceConfig } from '../config/balanceConfig';

// ─── Сессии (M15 — бюджет риска как мета-цикл) ──────────────────────────────
export async function startSession(userId: string, weatherMode?: string) {
  const snap = await loadSnapshot(userId);
  const ds = await daySeed(userId);
  // Новая сессия восстанавливает бюджет до максимума, если предыдущая завершена
  const open = await db.select().from(sessions).where(and(eq(sessions.userId, userId), sql`${sessions.endedAt} is null`)).orderBy(desc(sessions.startedAt)).limit(1);
  if (open[0]) return { session: open[0], resumed: true, riskBudget: snap.row.riskBudget };
  const budget = balanceConfig.riskBudget.initial;
  await db.update(progress).set({ riskBudget: budget, tiltStreak: 0 }).where(eq(progress.userId, userId));
  const [s] = await db.insert(sessions).values({ userId, riskBudgetStart: budget, weatherMode: weatherMode ?? ds.weatherMode }).returning();
  return { session: s, resumed: false, riskBudget: budget };
}

export async function endSession(userId: string, sessionId: string, endedBy: string) {
  const snap = await loadSnapshot(userId);
  const [s] = await db.update(sessions).set({ endedAt: new Date(), endedBy, riskBudgetEnd: snap.row.riskBudget }).where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId))).returning();
  if (!s) throw new ApiError(404, 'session_not_found');
  return s;
}

// ─── Тень арены (M14) ──────────────────────────────────────────────────────
export async function shadowFor(templateId: string) {
  const tpl = await resolveTemplate(templateId);
  if (!tpl) throw new ApiError(404, 'template_not_found');
  const dist = await db.select().from(answerDistribution).where(eq(answerDistribution.templateId, templateId));
  const n = dist.reduce((a, d) => a + d.count, 0);
  // Распределение не раскрывает верный вариант: только доли по текстам исходных вариантов
  return { templateId, n, distribution: tpl.answers.map((a, i) => ({ variant: i, text: a.text, share: n ? +(((dist.find(d => d.variant === i)?.count ?? 0) / n).toFixed(3)) : 0 })) };
}

// ─── Турниры (асинхронные, общий seed-набор, окно времени) ───────────────────
export async function createTournament(name: string, startsAt: Date, durationHours: number, size: number) {
  const pkg = await getContentPackage();
  const cfg = await getConfig();
  const pool = templates.slice(0, Math.max(size, 1));
  const seedSet = pool.slice(0, size).map((t, i) => ({ templateId: t.id, seed: deterministicSeed('tournament', name, startsAt.toISOString(), t.id, String(i)) }));
  const [t] = await db.insert(tournaments).values({ name, startsAt, endsAt: new Date(startsAt.getTime() + durationHours * 3600_000), seedSet, configVersion: cfg.version, contentVersion: pkg.version }).returning();
  return t;
}

export async function listTournaments() {
  const now = new Date();
  const rows = await db.select().from(tournaments).where(gte(tournaments.endsAt, new Date(now.getTime() - 7 * 86400_000))).orderBy(desc(tournaments.startsAt)).limit(20);
  return rows.map(t => ({ id: t.id, name: t.name, startsAt: t.startsAt, endsAt: t.endsAt, tasks: t.seedSet.length, status: now < t.startsAt ? 'upcoming' : now > t.endsAt ? 'finished' : 'live' }));
}

/** Seed выдаётся только в момент старта окна и привязывается к устройству. */
export async function joinTournament(userId: string, deviceId: string, tournamentId: string) {
  const [t] = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId)).limit(1);
  if (!t) throw new ApiError(404, 'tournament_not_found');
  const now = Date.now();
  if (now < t.startsAt.getTime()) throw new ApiError(409, 'tournament_not_started');
  if (now > t.endsAt.getTime()) throw new ApiError(409, 'tournament_finished');
  await db.insert(shadowRuns).values({ userId, tournamentId, deviceId }).onConflictDoNothing();
  const [run] = await db.select().from(shadowRuns).where(and(eq(shadowRuns.userId, userId), eq(shadowRuns.tournamentId, tournamentId))).limit(1);
  if (run.deviceId !== deviceId) throw new ApiError(409, 'device_mismatch', 'Турнир играется с одного устройства');
  return { tournament: { id: t.id, name: t.name, endsAt: t.endsAt, contentVersion: t.contentVersion, configVersion: t.configVersion }, seedSet: t.seedSet, answered: Object.keys(run.answers) };
}

export async function leaderboard(tournamentId: string, userId?: string) {
  const rows = await db.select({ userId: shadowRuns.userId, score: shadowRuns.score, totalMs: shadowRuns.totalMs, finishedAt: shadowRuns.finishedAt, answers: shadowRuns.answers, name: users.displayName })
    .from(shadowRuns).innerJoin(users, eq(users.id, shadowRuns.userId)).where(eq(shadowRuns.tournamentId, tournamentId)).orderBy(desc(shadowRuns.score), shadowRuns.totalMs).limit(100);
  const board = rows.map((r, i) => ({ rank: i + 1, userId: r.userId, name: r.name ?? `trader-${r.userId.slice(0, 4)}`, score: r.score, totalMs: r.totalMs, finished: !!r.finishedAt, answered: Object.keys(r.answers).length }));
  // Тень — игрок выше по рейтингу на тех же seed: его ход по каждому шаблону (без раскрытия верного варианта)
  let shadow: { name: string; rank: number; moves: Record<string, { answer: number; ms: number }> } | null = null;
  if (userId) {
    const me = board.findIndex(b => b.userId === userId);
    if (me > 0) { const above = rows[me - 1]; shadow = { name: board[me - 1].name, rank: me, moves: Object.fromEntries(Object.entries(above.answers).map(([k, v]) => [k, { answer: v.answer, ms: v.ms }])) }; }
  }
  return { board, me: board.find(b => b.userId === userId) ?? null, shadow };
}

// ─── Аналитика ──────────────────────────────────────────────────────────────
export async function ingestEvents(userId: string, events: { name: string; sessionId?: string; payload: Record<string, unknown>; clientTs?: number }[]) {
  const snap = await loadSnapshot(userId);
  const pkg = await getContentPackage();
  await db.insert(eventLog).values(events.map(e => ({ userId, sessionId: e.sessionId ?? null, name: e.name, epoch: snap.epoch, level: snap.level, contentVersion: pkg.version, payload: e.payload, clientTs: e.clientTs ?? null })));
  return { accepted: events.length };
}

/** Витрины для планировщика и редакторов: по атому / шаблону / продукту. */
export async function analyticsDashboard() {
  const byTemplate = await db.select({
    templateId: attempts.templateId, n: sql<number>`count(*)::int`,
    correct: sql<number>`sum(case when ${attempts.result}='correct' then 1 else 0 end)::int`,
    unfounded: sql<number>`sum(case when ${attempts.result}='correct_unfounded' then 1 else 0 end)::int`,
    avgMs: sql<number>`avg(${attempts.durationMs})::int`,
    flagged: sql<number>`sum(case when jsonb_array_length(${attempts.flags})>0 then 1 else 0 end)::int`,
  }).from(attempts).groupBy(attempts.templateId).orderBy(desc(sql`count(*)`)).limit(50);
  const [totals] = await db.select({ users: sql<number>`count(distinct ${attempts.userId})::int`, attempts: sql<number>`count(*)::int`, medianMs: sql<number>`coalesce(percentile_cont(0.5) within group (order by ${attempts.durationMs}),0)::int` }).from(attempts);
  const sessionsEnd = await db.select({ endedBy: sessions.endedBy, n: sql<number>`count(*)::int` }).from(sessions).where(sql`${sessions.endedBy} is not null`).groupBy(sessions.endedBy);
  const events = await db.select({ name: eventLog.name, n: sql<number>`count(*)::int` }).from(eventLog).groupBy(eventLog.name).orderBy(desc(sql`count(*)`)).limit(30);
  const [d1] = await db.select({ n: sql<number>`count(*)::int` }).from(progress).where(and(gte(progress.streak, 2), lte(progress.streak, 999)));
  const byAtom: Record<string, { n: number; errors: number; unfounded: number }> = {};
  for (const r of byTemplate) {
    const tpl = await resolveTemplate(r.templateId);
    for (const a of tpl?.atoms ?? []) { const s = (byAtom[a] ??= { n: 0, errors: 0, unfounded: 0 }); s.n += r.n; s.errors += r.n - r.correct - r.unfounded; s.unfounded += r.unfounded; }
  }
  return { totals: { ...totals, returningUsers: d1.n }, byTemplate, byAtom, sessionsEnd, events };
}

// ─── Billing (строго без влияния на engine) ─────────────────────────────────
export async function purchase(userId: string, sku: string, kind: 'premium' | 'cosmetic', priceSig: number) {
  const snap = await loadSnapshot(userId);
  if (snap.row.coins < priceSig) throw new ApiError(402, 'not_enough_sig');
  await db.update(progress).set({ coins: snap.row.coins - priceSig }).where(eq(progress.userId, userId));
  if (kind === 'premium') await db.update(users).set({ premium: true }).where(eq(users.id, userId));
  const [p] = await db.insert(purchases).values({ userId, sku, kind, priceSig }).returning();
  return { purchase: p, coins: snap.row.coins - priceSig };
}
