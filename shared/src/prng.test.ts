import { describe, expect, it } from 'vitest';
import { createRng, scenarioSeed } from './prng.js';
import { genCandles } from './fixtures.js';

describe('T031 PRNG determinism', () => {
  it('один seed даёт одну последовательность', () => {
    const a = createRng('signal-arena/test');
    const b = createRng('signal-arena/test');
    const seqA = Array.from({ length: 50 }, () => a.next());
    const seqB = Array.from({ length: 50 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it('воспроизводимость по 1000 seed (тест-план T031)', () => {
    for (let i = 0; i < 1000; i += 1) {
      const seed = `signal-arena/seed-${i}`;
      const a = createRng(seed);
      const b = createRng(seed);
      expect(a.next()).toBe(b.next());
      expect(a.int(0, 99)).toBe(b.int(0, 99));
      expect(a.pick([1, 2, 3, 4, 5])).toBe(b.pick([1, 2, 3, 4, 5]));
    }
  });

  it('разные seed дают разные последовательности', () => {
    const a = createRng('seed-a');
    const b = createRng('seed-b');
    const seqA = Array.from({ length: 20 }, () => a.next());
    const seqB = Array.from({ length: 20 }, () => b.next());
    expect(seqA).not.toEqual(seqB);
  });

  it('scenarioSeed каноничен: scenarioId + contentVersion', () => {
    expect(scenarioSeed('mvp-001', '0.1.0')).toBe('signal-arena/v1/0.1.0/mvp-001');
  });

  it('свечи детерминированы от seed', () => {
    const a = genCandles('x', 48, 100, 0.1);
    const b = genCandles('x', 48, 100, 0.1);
    expect(a).toEqual(b);
    expect(a).toHaveLength(48);
  });
});
