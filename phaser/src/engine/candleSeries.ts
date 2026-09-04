// Детерминированная генерация свечной серии — чистые данные, без Phaser.
// Один seed → одна серия на любом устройстве (тот же SeededRng, что и движок заданий).
import { SeededRng } from './rng';

export interface Candle { o: number; h: number; l: number; c: number; v: number; }

/** Случайное блуждание с трендовыми отрезками + свеча-улика «памп без объёма» (M1). */
export function generateSeries(seed: number, count: number, evidenceFromEnd: number, mirrored: boolean): { candles: Candle[]; evidenceIndex: number } {
  const rng = new SeededRng(seed ^ 0x9e3779b9);
  const candles: Candle[] = [];
  let price = 100 + rng.next() * 40;
  // 2–3 трендовых отрезка: направление и сила
  const segCount = rng.int(2, 3);
  const segLen = Math.ceil(count / segCount);
  let dir = rng.next() > 0.5 ? 1 : -1;
  for (let s = 0; s < segCount; s++) {
    for (let i = 0; i < segLen && candles.length < count; i++) {
      const drift = dir * (0.3 + rng.next() * 0.9);
      const vol = 0.6 + rng.next() * 1.8;
      const o = price;
      const c = o + drift + (rng.next() - 0.5) * 2.2;
      const hi = Math.max(o, c) + rng.next() * vol;
      const lo = Math.min(o, c) - rng.next() * vol;
      const v = 0.35 + rng.next() * 0.65;
      candles.push({ o, h: hi, l: lo, c, v });
      price = c;
    }
    dir = -dir * (rng.next() > 0.3 ? 1 : -1); // разворот или продолжение
  }
  // Свеча-улика: сильное тело вверх при аномально НИЗКОМ объёме («памп без объёма»)
  const evidenceIndex = Math.max(2, candles.length - 1 - evidenceFromEnd);
  const ev = candles[evidenceIndex];
  const body = Math.abs(ev.c - ev.o);
  const boost = Math.max(2.6, body * 3);
  ev.c = ev.o + boost;              // выраженный рост
  ev.h = ev.c + boost * 0.15;
  ev.l = ev.o - boost * 0.1;
  ev.v = 0.10 + (new SeededRng(seed ^ 0x51ed).next()) * 0.08; // тонкий объём
  // после аномалии следующая свеча продолжает от нового close
  const nxt = candles[evidenceIndex + 1];
  if (nxt) {
    const shift = ev.c - nxt.o;
    nxt.o += shift; nxt.c += shift; nxt.h += shift; nxt.l += shift;
  }
  const list = mirrored ? [...candles].reverse().map(c0 => ({ o: c0.c, c: c0.o, h: c0.h, l: c0.l, v: c0.v })) : candles;
  const evIdx = mirrored ? list.length - 1 - evidenceIndex : evidenceIndex;
  return { candles: list, evidenceIndex: evIdx };
}
