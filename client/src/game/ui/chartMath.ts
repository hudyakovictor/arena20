// T020 · Чистая математика CandleChart (без Phaser — покрыта Vitest).
import type { Candle } from '@signal-arena/shared';

export interface PriceRange {
  min: number;
  max: number;
  span: number;
}

/** Диапазон цен с отступом сверху/снизу (доля pad от спрэда). */
export function priceRange(candles: readonly Candle[], pad = 0.12): PriceRange {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const c of candles) {
    if (c.l < min) min = c.l;
    if (c.h > max) max = c.h;
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: 0, max: 1, span: 1 };
  const span = Math.max(max - min, 1e-9);
  const padAbs = span * pad;
  return { min: min - padAbs, max: max + padAbs, span: span + padAbs * 2 };
}

export interface ChartGeom {
  range: PriceRange;
  /** ширина одного слота свечи */
  slot: number;
  /** ширина тела свечи */
  body: number;
  x: (index: number) => number;
  y: (price: number) => number;
  /** видимые свечи: мобильный ориентир 40–120 (ui-graphics.md §9) */
  visible: (total: number) => number;
}

/** Геометрия графика: x по индексу, y по цене. */
export function chartGeom(count: number, range: PriceRange, w: number, h: number): ChartGeom {
  const slot = count > 0 ? w / count : w;
  const body = Math.max(1, Math.min(slot * 0.62, 14));
  return {
    range,
    slot,
    body,
    x: (index) => index * slot + slot / 2,
    y: (price) => h - ((price - range.min) / range.span) * h,
    visible: (total) => Math.max(0, Math.min(total, 120)),
  };
}

/** Сколько свечей помещается при минимальной ширине слота. */
export function fitCount(width: number, minSlot = 3): number {
  return Math.max(10, Math.min(120, Math.floor(width / minSlot)));
}
