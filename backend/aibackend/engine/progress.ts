// Progress — уровни, ранги карт, комбо, стадии, калибровка (ТЗ Часть 6 §4.3)
import { balanceConfig } from '../config/balanceConfig';
import { getEpochForLevel } from '../config/epochConfig';
import { cardById, cards } from '../content/cards';
import { combos } from '../content/combos';
import { enemyById } from '../content/enemies';
import type { EpochId } from '../types';

/** Суммарные пороги XP по уровням. После таблицы конфига — геометрическая прогрессия ×1.3. */
export function xpThresholdForLevel(level: number): number {
  const t = balanceConfig.xp.levelThresholds;
  if (level <= 1) return 0;
  if (level - 1 < t.length) return t[level - 1];
  let v = t[t.length - 1];
  for (let l = t.length; l < level; l++) v = Math.round(v * 1.3);
  return v;
}

export function levelFromXp(totalXp: number): number {
  let level = 1;
  while (level < 99 && totalXp >= xpThresholdForLevel(level + 1)) level++;
  return level;
}

export function levelView(totalXp: number) {
  const level = levelFromXp(totalXp);
  const cur = xpThresholdForLevel(level);
  const next = level >= 99 ? cur : xpThresholdForLevel(level + 1);
  return { level, xp: totalXp - cur, xpMax: Math.max(1, next - cur), totalXp, epoch: getEpochForLevel(level) as EpochId };
}

export function cardUnlockLevel(cardId: string): number {
  return cardById[cardId]?.unlockLevel ?? 99;
}

export function isCardUnlocked(cardId: string, level: number): boolean {
  return level >= cardUnlockLevel(cardId);
}

/** Ранг карты от числа освоенных атомов: 0 — нет карты; 1 — выдана; 2/3 — пороги конфига. */
export function rankFromAtoms(cardId: string, atomsDone: string[]): number {
  const card = cardById[cardId];
  if (!card) return 0;
  const done = atomsDone.filter(a => card.atoms.some(x => x.id === a)).length;
  if (done === 0) return 0;
  const [r2, r3] = card.rankThresholds;
  if (done >= r3 || done >= card.atoms.length) return 3;
  if (done >= r2) return 2;
  return 1;
}

export interface StageAvailability { enemyId: string; stage: number; level: number; available: boolean; reasons: string[]; }

export function stageAvailability(
  enemyId: string, stageNum: number, level: number,
  cardRanks: Record<string, number>, stageReached: number, combosUnlocked: string[],
): StageAvailability {
  const enemy = enemyById[enemyId];
  const stage = enemy?.stages.find(s => s.stage === stageNum);
  const reasons: string[] = [];
  if (!enemy || !stage) return { enemyId, stage: stageNum, level: 0, available: false, reasons: ['no_stage'] };
  if (level < stage.level) reasons.push(`level<${stage.level}`);
  for (const rc of stage.requiredCards) if ((cardRanks[rc.cardId] ?? 0) < rc.rank) reasons.push(`${rc.cardId}:r${rc.rank}`);
  if (stageNum > 1 && stageReached < stageNum - 1) reasons.push(`stage${stageNum - 1}_not_won`);
  for (const k of stage.comboRequired ?? []) if (!combosUnlocked.includes(k)) reasons.push(`combo:${k}`);
  return { enemyId, stage: stageNum, level: stage.level, available: reasons.length === 0, reasons };
}

/** Комбо, к которым относится набор одновременно применённых карт ранга ≥ needRank. */
export function combosTouched(skills: string[], cardRanks: Record<string, number>): string[] {
  const eligible = skills.filter(s => (cardRanks[s] ?? 0) >= balanceConfig.combo.needRank);
  return combos.filter(k => k.cards.every(c => eligible.includes(c))).map(k => k.id);
}

export function calibrationSummary(rows: { predicted: number; actual: number }[]) {
  if (!rows.length) return { n: 0, predicted: 0, actual: 0, gap: 0, verdict: 'нет данных' };
  const p = rows.reduce((a, r) => a + r.predicted, 0) / rows.length;
  const a = rows.reduce((s, r) => s + r.actual, 0) / rows.length;
  const gap = +(p - a).toFixed(3);
  return { n: rows.length, predicted: +p.toFixed(3), actual: +a.toFixed(3), gap, verdict: gap > 0.15 ? 'переоценка' : gap < -0.15 ? 'недооценка' : 'калиброван' };
}

export function allCardsView(level: number, ranks: Record<string, { rank: number; atomsDone: string[] }>) {
  return cards.map(c => ({
    id: c.id, name: c.name, domain: c.domain, unlockLevel: c.unlockLevel,
    unlocked: isCardUnlocked(c.id, level),
    rank: ranks[c.id]?.rank ?? 0,
    atomsDone: ranks[c.id]?.atomsDone ?? [],
    atomsTotal: c.atoms.length,
  }));
}
