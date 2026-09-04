import type { EncounterInstance, SourceId } from '../types';

const WEATHER_ROTATION = ['TREND', 'FLAT', 'VOLATILE', 'NEWS', 'LATE_CYCLE'] as const;

/** Детерминированный режим рынка на локальный календарный день игрока. */
export function dailyWeather(now = new Date()): (typeof WEATHER_ROTATION)[number] {
  const dayKey = now.getFullYear() * 372 + (now.getMonth() + 1) * 31 + now.getDate();
  return WEATHER_ROTATION[dayKey % WEATHER_ROTATION.length];
}

/** Проверяет, что выбранная карта действительно объясняет выбранное действие. */
export function cardChoiceFits(
  enc: EncounterInstance,
  selectedAnswer: number,
  selectedCard: string | null,
): boolean {
  const answer = enc.mutatedAnswers[selectedAnswer];
  return selectedCard === 'Cwait'
    ? !!answer?.isWait
    : !!selectedCard && enc.skills.includes(selectedCard);
}

/** Число шагов плана не может превышать число правильных карт встречи. */
export function effectiveStackSlots(requested: number, skills: string[]): number {
  if (requested <= 0) return 0;
  return Math.min(requested, skills.length);
}

/** Видимые вкладки с учётом слота платного закрытого источника. */
export function visibleSourceTabs(
  sources: SourceId[],
  limit: number,
  blindTab: boolean,
  blindOpened: boolean,
): SourceId[] {
  const max = Math.max(1, limit);
  const visible = blindTab && !blindOpened ? Math.max(1, max - 1) : max;
  return sources.slice(0, visible);
}
