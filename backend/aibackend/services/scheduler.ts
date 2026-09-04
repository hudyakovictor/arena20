// seeds + scheduler — seed на 3 дня вперёд, очередь встреч, следующее задание, разминка
import { and, desc, eq, inArray, isNull } from 'drizzle-orm';
import { db } from '@/db';
import { attempts, dailySeeds, scheduleQueue } from '../db/schema';
import { buildQueue, buildWarmup, weatherForDay, type QueueItem } from '../engine/scheduler';
import { generate, toPublic } from '../engine/generator';
import { dayKeyOffset, deterministicSeed, todayKey, ApiError } from '../http';
import { loadSnapshot, type PlayerSnapshot } from './progress';
import { getContentPackage, resolveTemplate } from './content';

export async function issueDailySeeds(userId: string, daysAhead = 3) {
  const out: { day: string; seed: number; weatherMode: string }[] = [];
  for (let i = 0; i < daysAhead; i++) {
    const day = dayKeyOffset(i);
    const seed = deterministicSeed('day', userId, day);
    const weatherMode = weatherForDay(seed);
    out.push({ day, seed, weatherMode });
  }
  await db.insert(dailySeeds).values(out.map(o => ({ userId, ...o }))).onConflictDoNothing();
  return out;
}

export async function daySeed(userId: string, day = todayKey()) {
  const seed = deterministicSeed('day', userId, day);
  return { day, seed, weatherMode: weatherForDay(seed) };
}

async function recentTemplates(userId: string): Promise<string[]> {
  const rows = await db.select({ t: attempts.templateId }).from(attempts).where(eq(attempts.userId, userId)).orderBy(desc(attempts.serverTs)).limit(5);
  return rows.map(r => r.t);
}

export async function computeQueue(snapshot: PlayerSnapshot): Promise<QueueItem[]> {
  const ds = await daySeed(snapshot.userId);
  const recent = await recentTemplates(snapshot.userId);
  return buildQueue({
    userId: snapshot.userId, level: snapshot.level, cardRanks: snapshot.cardRanks, enemyStages: snapshot.enemyStages,
    combosUnlocked: snapshot.combosUnlocked,
    scroll: snapshot.scroll.map(s => ({ id: s.id, enemyId: s.enemyId, stage: s.stage, atom: s.atom, templateId: s.templateId, mutationDepth: s.mutationDepth, createdAt: s.createdAt.getTime() })),
    daySeed: ds.seed, now: Date.now(), recentTemplateIds: recent,
  });
}

/** Пересобирает серверную очередь игрока (schedule_queue) и возвращает её. */
export async function refreshQueue(userId: string) {
  const snap = await loadSnapshot(userId);
  const items = await computeQueue(snap);
  await db.delete(scheduleQueue).where(and(eq(scheduleQueue.userId, userId), isNull(scheduleQueue.consumedAt)));
  if (items.length) {
    await db.insert(scheduleQueue).values(items.map(i => ({
      userId, itemType: i.itemType, ref: i.ref, templateId: i.templateId, seed: i.seed, dueAt: new Date(i.dueAt), priority: i.priority, reason: i.reason,
    })));
  }
  return { snapshot: snap, items, weather: (await daySeed(userId)).weatherMode };
}

export async function nextTask(userId: string, opts: { templateId?: string; seed?: number } = {}) {
  const snap = await loadSnapshot(userId);
  const pkg = await getContentPackage();
  let item: QueueItem | null = null;
  if (opts.templateId) {
    const tpl = await resolveTemplate(opts.templateId);
    if (!tpl) throw new ApiError(404, 'template_not_found');
    const seed = opts.seed ?? deterministicSeed('adhoc', userId, tpl.id, Date.now().toString());
    item = { itemType: 'stage', ref: `${tpl.enemyId}:S${tpl.stage}`, templateId: tpl.id, enemyId: tpl.enemyId, stage: tpl.stage, seed, priority: 0, reason: 'выбрано вручную', dueAt: Date.now() };
  } else {
    const items = await computeQueue(snap);
    item = items.find(i => i.dueAt <= Date.now()) ?? items[0] ?? null;
  }
  if (!item) throw new ApiError(404, 'queue_empty', 'Очередь пуста — пройдите главу в Академии');
  const tpl = await resolveTemplate(item.templateId);
  if (!tpl) throw new ApiError(404, 'template_not_found');
  const full = generate(tpl, item.seed, { level: snap.level, epoch: snap.epoch, tiltStreak: snap.row.tiltStreak }, pkg.version);
  return {
    queueItem: { itemType: item.itemType, ref: item.ref, reason: item.reason, priority: item.priority, enemyId: item.enemyId, stage: item.stage },
    task: toPublic(full),
    player: { level: snap.level, epoch: snap.epoch, riskBudget: snap.row.riskBudget, tiltStreak: snap.row.tiltStreak },
  };
}

export async function warmupView(userId: string) {
  const { items, weather, snapshot } = await refreshQueue(userId);
  const w = buildWarmup(items, weather);
  return {
    day: todayKey(), weather: w.weather,
    // M13: I — режим назван в баннере; II+ — режим надо определить
    weatherRevealed: snapshot.epoch === 'street',
    items: w.items.map(i => ({ templateId: i.templateId, seed: i.seed, enemyId: i.enemyId, stage: i.stage, itemType: i.itemType, reason: i.reason })),
  };
}

export async function consumeQueueItem(userId: string, templateId: string) {
  const rows = await db.select().from(scheduleQueue).where(and(eq(scheduleQueue.userId, userId), eq(scheduleQueue.templateId, templateId), isNull(scheduleQueue.consumedAt))).limit(1);
  if (rows.length) await db.update(scheduleQueue).set({ consumedAt: new Date() }).where(inArray(scheduleQueue.id, rows.map(r => r.id)));
}
