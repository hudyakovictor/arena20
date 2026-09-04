// Scheduler — очередь повторений: свиток → стадии по расписанию → новые карты (ТЗ Часть 6 §5.4)
import { balanceConfig } from '../config/balanceConfig';
import { enemies } from '../content/enemies';
import { cards } from '../content/cards';
import { templateFor } from '../content/templates';
import { SeededRng, hashString } from './rng';
import { stageAvailability, isCardUnlocked } from './progress';

export interface SchedulerSnapshot {
  userId: string;
  level: number;
  cardRanks: Record<string, number>;
  enemyStages: Record<string, { stageReached: number; lastWinAt: number | null; encounters: number }>;
  combosUnlocked: string[];
  scroll: { id: string; enemyId: string; stage: number; atom: string; templateId: string; mutationDepth: number; createdAt: number }[];
  daySeed: number;
  now: number;
  recentTemplateIds: string[];
}

export interface QueueItem {
  itemType: 'scroll' | 'stage' | 'new_card' | 'event';
  ref: string;
  templateId: string;
  enemyId: string;
  stage: number;
  seed: number;
  priority: number;
  reason: string;
  dueAt: number;
}

export const schedulerConfig = {
  queueSize: 8,
  warmupMin: 3,
  warmupMax: 5,
  scrollPriority: 100 + balanceConfig.errorScroll.priorityBoost * 10,
  stagePriority: 60,
  newCardPriority: 40,
  stageCooldownMs: 6 * 60 * 60 * 1000,   // повтор стадии не раньше чем через 6 часов
  newEnemiesPerDay: 1,
  scrollRepeatDelayMs: 20 * 60 * 1000,    // повтор ошибки — раньше (20 минут), но мутированный и на ступень сложнее
};

const DAY = 24 * 60 * 60 * 1000;

export function buildQueue(s: SchedulerSnapshot): QueueItem[] {
  const rng = new SeededRng((s.daySeed ^ hashString(s.userId)) >>> 0);
  const out: QueueItem[] = [];
  const seedFor = (key: string) => (hashString(`${s.userId}|${s.daySeed}|${key}`) ^ rng.int(1, 1 << 30)) >>> 0;

  // 1. Свиток ошибок — приоритет над плановой стадией; повтор мутирован и на ступень сложнее (если стадия доступна)
  for (const e of s.scroll.slice(0, 4)) {
    const harder = e.stage + 1;
    const canHarder = stageAvailability(e.enemyId, harder, s.level, s.cardRanks, s.enemyStages[e.enemyId]?.stageReached ?? 0, s.combosUnlocked).available;
    const stage = canHarder ? harder : e.stage;
    const tpl = templateFor(e.enemyId, stage);
    out.push({
      itemType: 'scroll', ref: e.id, templateId: tpl.id, enemyId: e.enemyId, stage,
      seed: seedFor(`scroll:${e.id}:${e.mutationDepth}`),
      priority: schedulerConfig.scrollPriority + (canHarder ? 5 : 0),
      reason: `свиток: ${e.atom}, глубина мутации ${e.mutationDepth + 1}`,
      dueAt: Math.max(s.now, e.createdAt + schedulerConfig.scrollRepeatDelayMs),
    });
  }

  // 2. Стадии врагов по расписанию (кампания, M12): следующая стадия открытых врагов, cooldown из конфига
  let newEnemies = 0;
  const stageItems: QueueItem[] = [];
  for (const en of enemies) {
    if (en.mode === 'event' || en.mode === 'boss') continue;
    const ep = s.enemyStages[en.id];
    const reached = ep?.stageReached ?? 0;
    const next = reached + 1;
    const av = stageAvailability(en.id, next, s.level, s.cardRanks, reached, s.combosUnlocked);
    if (!av.available) continue;
    const isNewEnemy = !ep || ep.encounters === 0;
    if (isNewEnemy) { if (newEnemies >= schedulerConfig.newEnemiesPerDay) continue; newEnemies++; }
    const due = ep?.lastWinAt ? ep.lastWinAt + schedulerConfig.stageCooldownMs : s.now;
    const tpl = templateFor(en.id, next);
    stageItems.push({
      itemType: isNewEnemy ? 'new_card' : 'stage', ref: `${en.id}:S${next}`, templateId: tpl.id, enemyId: en.id, stage: next,
      seed: seedFor(`stage:${en.id}:${next}`),
      priority: (isNewEnemy ? schedulerConfig.newCardPriority : schedulerConfig.stagePriority) + (next > 1 ? next * 3 : 0) - Math.max(0, av.level - s.level),
      reason: isNewEnemy ? `новый враг, ${en.domain}` : `кампания: стадия ${next}`,
      dueAt: due,
    });
  }
  // Повтор ранее побеждённых стадий в смешанном контексте (интервал растёт с числом встреч)
  for (const en of enemies) {
    const ep = s.enemyStages[en.id];
    if (!ep || ep.stageReached === 0 || !ep.lastWinAt) continue;
    const interval = DAY * Math.min(14, Math.pow(2, Math.max(0, ep.encounters - 1)));
    if (ep.lastWinAt + interval > s.now) continue;
    const tpl = templateFor(en.id, ep.stageReached);
    stageItems.push({
      itemType: 'stage', ref: `${en.id}:S${ep.stageReached}:repeat`, templateId: tpl.id, enemyId: en.id, stage: ep.stageReached,
      seed: seedFor(`repeat:${en.id}:${ep.stageReached}:${Math.floor(s.now / DAY)}`),
      priority: schedulerConfig.stagePriority - 10, reason: 'интервальный повтор в новом контексте', dueAt: s.now,
    });
  }
  stageItems.sort((a, b) => b.priority - a.priority);
  out.push(...stageItems);

  // 3. Если очередь пуста (новичок без выданных карт) — первая доступная карта по уровню
  if (out.length === 0) {
    const firstCard = cards.find(c => isCardUnlocked(c.id, s.level));
    const en = enemies.find(e => e.mode === 'normal' && e.stages[0].requiredCards.some(rc => rc.cardId === firstCard?.id));
    if (en) {
      const tpl = templateFor(en.id, 1);
      out.push({ itemType: 'new_card', ref: `${en.id}:S1`, templateId: tpl.id, enemyId: en.id, stage: 1, seed: seedFor(`intro:${en.id}`), priority: 10, reason: 'первая встреча (карта в Академии не получена — учебный режим)', dueAt: s.now });
    }
  }

  // Убираем недавно сыгранные шаблоны в конец
  const recent = new Set(s.recentTemplateIds);
  out.sort((a, b) => (Number(recent.has(a.templateId)) - Number(recent.has(b.templateId))) || b.priority - a.priority || a.dueAt - b.dueAt);
  return out.slice(0, schedulerConfig.queueSize);
}

/** Разминка дня = режим погоды + 3–5 элементов от простого к сложному. */
export function buildWarmup(queue: QueueItem[], weather: string) {
  const items = [...queue].sort((a, b) => a.stage - b.stage).slice(0, schedulerConfig.warmupMax);
  return { weather, items: items.length >= schedulerConfig.warmupMin ? items : items };
}

export function weatherForDay(daySeed: number): string {
  const modes = balanceConfig.weather.modes;
  return modes[daySeed % modes.length];
}
