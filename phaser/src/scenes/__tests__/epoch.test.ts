// Эпоха: границы уровней и согласованность названия с палитрой.

import { describe, it, expect } from 'vitest';
import { getEpochForLevel, epochs, epochOf } from '../../config/epochConfig';
import { buildPalette, palettes } from '../../ui/palette';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('границы эпох', () => {
  it.each([
    [1, 'street'],
    [20, 'street'],
    [21, 'cabinet'],
    [50, 'cabinet'],
    [51, 'terminal'],
    [80, 'terminal'],
    [81, 'system'],
    [99, 'system'],
  ])('уровень %i → %s', (level, expected) => {
    expect(getEpochForLevel(level)).toBe(expected);
  });

  it('границы совпадают с описанием эпохи', () => {
    for (const def of Object.values(epochs)) {
      const [lo, hi] = def.levels;
      expect(getEpochForLevel(lo)).toBe(def.id);
      expect(getEpochForLevel(hi)).toBe(def.id);
    }
  });

  it('диапазоны не пересекаются и покрывают 1..99', () => {
    const seen = new Set<number>();
    for (let l = 1; l <= 99; l++) seen.add(l);
    for (const def of Object.values(epochs)) {
      for (let l = def.levels[0]; l <= def.levels[1]; l++) seen.delete(l);
    }
    expect([...seen]).toEqual([]);
  });
});

describe('экран смены эпохи', () => {
  const src = readFileSync(
    join(__dirname, '..', 'arena', 'StatusOverlays.ts'),
    'utf8',
  );

  it('берёт название и девиз у эпохи, в которую входим', () => {
    // Была рассинхронизация: цвета брались у новой эпохи, а название —
    // по текущему уровню игрока, то есть у старой.
    expect(src).toMatch(/const def = epochs\[to\]/);
    expect(src).not.toMatch(/epochOf\(/);
  });

  it('палитра тоже берётся у новой эпохи', () => {
    expect(src).toMatch(/buildPalette\(to\)/);
  });
});

describe('палитра и эпохи согласованы', () => {
  it('для каждой эпохи есть палитра', () => {
    for (const id of Object.keys(epochs)) {
      expect(palettes[id], id).toBeDefined();
    }
  });

  it('у эпох разные акценты — переход заметен игроку', () => {
    const accents = Object.keys(epochs).map((id) => buildPalette(id).accent);
    expect(new Set(accents).size).toBe(accents.length);
  });

  it('epochOf возвращает определение текущей эпохи', () => {
    expect(epochOf(1).id).toBe('street');
    expect(epochOf(99).id).toBe('system');
  });
});
