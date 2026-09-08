import { describe, expect, it } from 'vitest';
import { contentPackSchema, scenarioFullSchema, scenarioPublicSchema } from './schemas.js';
import { fixturePack } from './fixtures.js';

describe('T001 shared schemas', () => {
  it('валидный content-pack проходит Zod', () => {
    const pack = fixturePack();
    expect(contentPackSchema.safeParse(pack).success).toBe(true);
  });

  it('невалидный пак падает: качество вне 0–100', () => {
    const pack = structuredClone(fixturePack());
    const first = pack.scenarios[0];
    if (!first) throw new Error('fixture: нет сценариев');
    (first.decisions[0] as { quality: number }).quality = 140;
    expect(contentPackSchema.safeParse(pack).success).toBe(false);
  });

  it('публичная схема не содержит скрытое future (by design)', () => {
    const full = fixturePack().scenarios[0];
    if (!full) throw new Error('fixture: нет сценариев');
    const parsed = scenarioPublicSchema.safeParse(full);
    // лишние ключи (futureCandles/factKey/sourceRef) отбрасываются публичной схемой
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect('futureCandles' in parsed.data).toBe(false);
      expect('factKey' in parsed.data).toBe(false);
      expect(parsed.data.futureHash).toMatch(/^[0-9a-f]{32}$/i);
    }
  });

  it('полная схема требует future + факт + источник', () => {
    const full = fixturePack().scenarios[0];
    if (!full) throw new Error('fixture: нет сценариев');
    const { futureCandles: _drop, ...pub } = full;
    expect(scenarioFullSchema.safeParse(pub).success).toBe(false);
    expect(scenarioFullSchema.safeParse(full).success).toBe(true);
  });
});
