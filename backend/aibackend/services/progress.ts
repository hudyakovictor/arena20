// progress — уровень, карты/ранги, комбо, трофеи/стадии, свиток, калибровка, бюджет
import { and, desc, eq, isNull } from 'drizzle-orm';
import { db } from '@/db';
import { progress, cardProgress, comboProgress, enemyProgress, mistakeScroll, calibration, attempts } from '../db/schema';
import { levelView, calibrationSummary, allCardsView, stageAvailability } from '../engine/progress';
import { balanceConfig } from '../config/balanceConfig';
import { enemies } from '../content/enemies';
import { combos } from '../content/combos';
import type { SchedulerSnapshot } from '../engine/scheduler';
import type { EpochId } from '../types';
import { ApiError } from '../http';

export interface PlayerSnapshot {
  userId: string;
  row: typeof progress.$inferSelect;
  level: number; epoch: EpochId; xp: number; xpMax: number; totalXp: number;
  cardRanks: Record<string, number>;
  cardAtoms: Record<string, string[]>;
  enemyStages: SchedulerSnapshot['enemyStages'];
  enemyRows: (typeof enemyProgress.$inferSelect)[];
  combosUnlocked: string[];
  comboCounts: Record<string, number>;
  scroll: (typeof mistakeScroll.$inferSelect)[];
}

export async function ensureProgress(userId: string) {
  const rows = await db.select().from(progress).where(eq(progress.userId, userId)).limit(1);
  if (rows[0]) return rows[0];
  const [r] = await db.insert(progress).values({ userId, riskBudget: balanceConfig.riskBudget.initial }).onConflictDoNothing().returning();
  if (r) return r;
  const again = await db.select().from(progress).where(eq(progress.userId, userId)).limit(1);
  if (!again[0]) throw new ApiError(404, 'no_progress');
  return again[0];
}

export async function loadSnapshot(userId: string): Promise<PlayerSnapshot> {
  const row = await ensureProgress(userId);
  const [cp, ep, kp, sc] = await Promise.all([
    db.select().from(cardProgress).where(eq(cardProgress.userId, userId)),
    db.select().from(enemyProgress).where(eq(enemyProgress.userId, userId)),
    db.select().from(comboProgress).where(eq(comboProgress.userId, userId)),
    db.select().from(mistakeScroll).where(and(eq(mistakeScroll.userId, userId), isNull(mistakeScroll.closedAt))).orderBy(desc(mistakeScroll.createdAt)).limit(balanceConfig.errorScroll.maxEntries),
  ]);
  const lv = levelView(row.xp);
  return {
    userId, row, ...lv,
    cardRanks: Object.fromEntries(cp.map(c => [c.cardId, c.rank])),
    cardAtoms: Object.fromEntries(cp.map(c => [c.cardId, c.atomsDone])),
    enemyStages: Object.fromEntries(ep.map(e => [e.enemyId, { stageReached: e.stageReached, lastWinAt: e.lastWinAt ? e.lastWinAt.getTime() : null, encounters: e.encounters }])),
    enemyRows: ep,
    combosUnlocked: kp.filter(k => k.unlockedAt).map(k => k.comboId),
    comboCounts: Object.fromEntries(kp.map(k => [k.comboId, k.count])),
    scroll: sc,
  };
}

export async function progressView(userId: string) {
  const s = await loadSnapshot(userId);
  const cal = await db.select().from(calibration).where(eq(calibration.userId, userId)).orderBy(desc(calibration.createdAt)).limit(50);
  const recent = await db.select({ id: attempts.id, templateId: attempts.templateId, result: attempts.result, xp: attempts.xp, budgetDelta: attempts.budgetDelta, serverTs: attempts.serverTs })
    .from(attempts).where(eq(attempts.userId, userId)).orderBy(desc(attempts.serverTs)).limit(10);
  const ranks = Object.fromEntries(Object.keys(s.cardRanks).map(id => [id, { rank: s.cardRanks[id], atomsDone: s.cardAtoms[id] ?? [] }]));
  return {
    level: s.level, xp: s.xp, xpMax: s.xpMax, totalXp: s.totalXp, epoch: s.epoch,
    coins: s.row.coins, riskBudget: s.row.riskBudget, maxBudget: balanceConfig.riskBudget.max, streak: s.row.streak,
    hubrisStreak: s.row.hubrisStreak, tiltStreak: s.row.tiltStreak,
    cards: allCardsView(s.level, ranks),
    cardRanks: s.cardRanks,
    enemies: enemies.map(e => {
      const ep = s.enemyStages[e.id];
      const row = s.enemyRows.find(r => r.enemyId === e.id);
      const next = (ep?.stageReached ?? 0) + 1;
      return {
        id: e.id, name: row?.identified || (ep?.stageReached ?? 0) > 0 ? e.name : '???', domain: e.domain, mode: e.mode,
        stageReached: ep?.stageReached ?? 0, encounters: ep?.encounters ?? 0, identified: row?.identified ?? false,
        trophyLayers: row?.trophyLayers ?? [], errorProfile: row?.errorProfile ?? {},
        nextStage: e.stages.find(st => st.stage === next) ? stageAvailability(e.id, next, s.level, s.cardRanks, ep?.stageReached ?? 0, s.combosUnlocked) : null,
      };
    }),
    combos: combos.map(k => ({ id: k.id, name: k.name, cards: k.cards, count: s.comboCounts[k.id] ?? 0, need: balanceConfig.combo.requiredCorrect, unlocked: s.combosUnlocked.includes(k.id) })),
    errorScroll: s.scroll.map(x => ({ id: x.id, enemy: x.enemyId, stage: x.stage, atom: x.atom, missedEvidence: x.missedEvidence, createdAt: x.createdAt.getTime(), closed: !!x.closedAt, mutationDepth: x.mutationDepth })),
    calibration: calibrationSummary(cal.map(c => ({ predicted: c.predicted, actual: c.actual }))),
    calibrationRows: cal.map(c => ({ bucket: c.bucket, predicted: c.predicted, actual: c.actual })),
    recentAttempts: recent,
  };
}
