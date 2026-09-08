// T031 (минимум для vertical slice) · Детерминированная обёртка seedrandom.
// Один seed + одна версия контента = один результат. Math.random запрещён.
import seedrandom from 'seedrandom';

export interface Rng {
  /** [0, 1) */
  next: () => number;
  /** целое в [min, max] включительно */
  int: (min: number, max: number) => number;
  /** вещественное в [min, max) */
  range: (min: number, max: number) => number;
  /** детерминированный выбор элемента */
  pick: <T>(items: readonly T[]) => T;
  /** детерминированный shuffle (возвращает новый массив) */
  shuffle: <T>(items: readonly T[]) => T[];
}

export function createRng(seed: string): Rng {
  const rand = seedrandom(seed);
  return {
    next: () => rand(),
    int: (min: number, max: number) => {
      const lo = Math.ceil(min);
      const hi = Math.floor(max);
      return lo + Math.floor(rand() * (hi - lo + 1));
    },
    range: (min: number, max: number) => min + rand() * (max - min),
    pick: <T>(items: readonly T[]): T => {
      if (items.length === 0) throw new Error('createRng.pick: пустой массив');
      const idx = Math.floor(rand() * items.length);
      const item = items[idx];
      if (item === undefined) throw new Error('createRng.pick: индекс вне диапазона');
      return item;
    },
    shuffle: <T>(items: readonly T[]): T[] => {
      const arr = [...items];
      for (let i = arr.length - 1; i > 0; i -= 1) {
        const j = Math.floor(rand() * (i + 1));
        const a = arr[i];
        const b = arr[j];
        if (a === undefined || b === undefined) throw new Error('createRng.shuffle: сбой индекса');
        arr[i] = b;
        arr[j] = a;
      }
      return arr;
    },
  };
}

/** Канонический seed сценария: scenarioId + contentVersion (02_TECH_STACK.md). */
export function scenarioSeed(scenarioId: string, contentVersion: string): string {
  return `signal-arena/v1/${contentVersion}/${scenarioId}`;
}
