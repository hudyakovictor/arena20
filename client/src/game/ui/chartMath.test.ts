import { describe, expect, it } from 'vitest';
import { fixturePack } from '@signal-arena/shared';
import { chartGeom, fitCount, priceRange } from './chartMath.js';

describe('T020 chart math', () => {
  const candles = fixturePack().scenarios[0]?.visibleCandles ?? [];

  it('диапазон покрывает все свечи + отступ', () => {
    const r = priceRange(candles);
    for (const c of candles) {
      expect(r.min).toBeLessThanOrEqual(c.l);
      expect(r.max).toBeGreaterThanOrEqual(c.h);
    }
    expect(r.span).toBeGreaterThan(0);
  });

  it('y(): максимум выше минимума', () => {
    const r = priceRange(candles);
    const g = chartGeom(candles.length, r, 300, 120);
    expect(g.y(r.max)).toBeLessThan(g.y(r.min));
    expect(g.y(r.max)).toBeGreaterThanOrEqual(0);
    expect(g.y(r.min)).toBeLessThanOrEqual(120);
  });

  it('x() монотонно и внутри ширины', () => {
    const r = priceRange(candles);
    const g = chartGeom(candles.length, r, 300, 120);
    let prev = -1;
    for (let i = 0; i < candles.length; i += 1) {
      const x = g.x(i);
      expect(x).toBeGreaterThan(prev);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(300);
      prev = x;
    }
  });

  it('видимых свечей не больше 120', () => {
    const r = priceRange(candles);
    const g = chartGeom(candles.length, r, 300, 120);
    expect(g.visible(500)).toBe(120);
  });

  it('fitCount держит 10–120', () => {
    expect(fitCount(30)).toBeGreaterThanOrEqual(10);
    expect(fitCount(4000)).toBeLessThanOrEqual(120);
  });
});
