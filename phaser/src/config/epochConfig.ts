import type { EpochId } from '../types';

export interface EpochDef {
  id: EpochId;
  name: string;
  levels: [number, number];
  motto: string;
  description: string;
}

// ВАЖНО: цвета эпохи живут ТОЛЬКО в ui/palette.ts (buildPalette).
// Раньше здесь был второй набор токенов (bg/surface/border/accent), из-за чего
// «Улица» получала то лайм #c8ff00 из палитры, то бирюзу #31D6C4 отсюда —
// экран менял тон в зависимости от того, какой модуль рисовал элемент.
// Поведенческие отличия эпох описаны в config/epochStructure.ts.

export const epochs: Record<EpochId, EpochDef> = {
  street: {
    id: 'street', name: 'УЛИЦА', levels: [1,20],
    motto: 'ТЫ ЗДЕСЬ РАДИ ДЕНЕГ. ИМЕННО ПОЭТОМУ ТЫ УЖЕ В ОПАСНОСТИ.',
    description: 'Граффити, неон-лайм, толстые обводки. Все ярлыки на месте.'
  },
  cabinet: {
    id: 'cabinet', name: 'КАБИНЕТ', levels: [21,50],
    motto: 'РЫНОК — ЭТО НЕ ГРАФИК. ЭТО ЛЮДИ, КОТОРЫЕ РИСУЮТ ГРАФИК.',
    description: 'Скруглённые панели, пастель, тонкие иконки. Часть костылей снята.'
  },
  terminal: {
    id: 'terminal', name: 'ТЕРМИНАЛ', levels: [51,80],
    motto: 'ВОЛАТИЛЬНОСТЬ ВРЕМЕННА. ТВОЯ ОШИБКА — НАВСЕГДА.',
    description: 'Плотная сетка, монохром + один акцент, моноширинные данные.'
  },
  system: {
    id: 'system', name: 'СИСТЕМА', levels: [81,99],
    motto: 'СИСТЕМА РАБОТАЕТ. ПОКА ТЫ НЕ ВМЕШАЕШЬСЯ.',
    description: 'Минимализм, белое на тёмном, ложные ярлыки как норма.'
  }
};

export function getEpochForLevel(level: number): EpochId {
  if (level <= 20) return 'street';
  if (level <= 50) return 'cabinet';
  if (level <= 80) return 'terminal';
  return 'system';
}
export function epochOf(level: number): EpochDef { return epochs[getEpochForLevel(level)]; }

