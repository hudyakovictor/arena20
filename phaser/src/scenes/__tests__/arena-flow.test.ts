import { describe, expect, it } from 'vitest';
import type { EncounterInstance, SourceId } from '../../types';
import {
  cardChoiceFits,
  dailyWeather,
  effectiveStackSlots,
  visibleSourceTabs,
} from '../../engine/arenaFlow';

const encounter: EncounterInstance = {
  id: 'test',
  learningGoal: 'test',
  atoms: ['C1.1'],
  enemyId: 'E01',
  stage: 1,
  sources: ['chart', 'news', 'position'],
  questionPool: ['test'],
  answers: [
    { label: 'A', text: 'act' },
    { label: 'B', text: 'wait', isWait: true },
  ],
  correct: 0,
  evidence: [],
  skills: ['C1'],
  domain: 'technical',
  seed: 1,
  question: 'test',
  mutatedAnswers: [
    { label: 'A', text: 'act' },
    { label: 'B', text: 'wait', isWait: true },
  ],
  correctAnswer: 0,
  mutatedEvidence: [],
  ticker: 'BTC/USDT',
  timeframe: '15m',
  isMirrored: false,
};

describe('режим рынка', () => {
  it('стабилен внутри одного календарного дня и меняется по ротации', () => {
    const morning = dailyWeather(new Date(2026, 8, 5, 8));
    const evening = dailyWeather(new Date(2026, 8, 5, 23));
    const nextDay = dailyWeather(new Date(2026, 8, 6, 8));
    expect(morning).toBe(evening);
    expect(nextDay).not.toBe(morning);
  });
});

describe('карта является частью решения', () => {
  it('принимает подходящую карту навыка', () => {
    expect(cardChoiceFits(encounter, 0, 'C1')).toBe(true);
  });

  it('отклоняет отсутствие карты и постороннюю карту', () => {
    expect(cardChoiceFits(encounter, 0, null)).toBe(false);
    expect(cardChoiceFits(encounter, 0, 'C4')).toBe(false);
  });

  it('карта «Ждать» подходит только к действию ожидания', () => {
    expect(cardChoiceFits(encounter, 0, 'Cwait')).toBe(false);
    expect(cardChoiceFits(encounter, 1, 'Cwait')).toBe(true);
  });
});

describe('план из карт всегда проходим', () => {
  it('ограничивает слоты фактическим числом правильных карт', () => {
    expect(effectiveStackSlots(4, ['C1', 'C2', 'C3'])).toBe(3);
    expect(effectiveStackSlots(3, ['C1', 'C2'])).toBe(2);
  });

  it('не включает план в ранней эпохе', () => {
    expect(effectiveStackSlots(0, ['C1'])).toBe(0);
  });
});

describe('закрытый источник', () => {
  const sources: SourceId[] = ['chart', 'news', 'position'];

  it('до оплаты оставляет последний слот закрытым', () => {
    expect(visibleSourceTabs(sources, 3, true, false)).toEqual(['chart', 'news']);
  });

  it('после оплаты показывает реальный третий источник', () => {
    expect(visibleSourceTabs(sources, 3, true, true)).toEqual(sources);
  });

  it('без механики закрытой вкладки ничего не скрывает', () => {
    expect(visibleSourceTabs(sources, 3, false, false)).toEqual(sources);
  });
});
