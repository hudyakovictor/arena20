// SIGNAL ARENA — контракт эпох: что меняется в обучении, а не только в цвете.
// Скелет экрана один. Эпоха меняет СТРУКТУРУ: сколько источников открыто,
// нужна ли подсветка улик, сколько карт в плане, есть ли ставка уверенности.
// Так «взросление» игрока становится механикой, а не сменой палитры.

import type { EpochId } from '../types';

export interface EpochStructure {
  /** Сколько вкладок источников доступно одновременно. */
  tabs: number;
  /** Есть ли закрытая вкладка, которую можно открыть за запас риска. */
  blindTab: boolean;
  /** Подсвечивать ли улики на графике. */
  evidenceHighlight: boolean;
  /** Сколько верных улик нужно для «обоснованного» ответа. */
  evidenceRequired: number;
  /** Ярлыки-подсказки на источниках: все / частично / нет / ложные. */
  labels: 'all' | 'partial' | 'none' | 'false';
  /** Сколько карт показываем в ленте. */
  cards: number;
  /** Как подаются карты: с пометкой нужных, с подсказкой, планом, молча. */
  cardMode: 'guided' | 'context' | 'stack' | 'silent';
  /** Слотов в плане решения. 0 — обычный выбор одного ответа. */
  stackSlots: number;
  /** Показывать ли ставку уверенности. */
  confidence: boolean;
  /** Нужен ли вердикт «что здесь главное» до выбора действия. */
  verdict: boolean;
  /** Сколько вариантов в опознании противника. 0 — опознание выключено. */
  identifyOptions: number;
  /** Пошаговый режим: улика → решение → подтверждение (по одному экрану). */
  stepper: boolean;
  /** Показывать ли поясняющую строку-подсказку до ответа. */
  hintLine: boolean;
}

export const epochStructures: Record<EpochId, EpochStructure> = {
  // I «Улица» — учим одному жесту: найти улику, затем выбрать действие.
  street: {
    tabs: 1,
    blindTab: false,
    evidenceHighlight: true,
    evidenceRequired: 1,
    labels: 'all',
    cards: 3,
    cardMode: 'guided',
    stackSlots: 0,
    confidence: false,
    verdict: false,
    identifyOptions: 2,
    stepper: true,
    hintLine: true,
  },
  // II «Кабинет» — два источника, честная оценка своей уверенности.
  cabinet: {
    tabs: 2,
    blindTab: false,
    evidenceHighlight: false,
    evidenceRequired: 1,
    labels: 'partial',
    cards: 4,
    cardMode: 'context',
    stackSlots: 0,
    confidence: true,
    verdict: true,
    identifyOptions: 4,
    stepper: false,
    hintLine: true,
  },
  // III «Терминал» — план из нескольких шагов, платная закрытая вкладка.
  terminal: {
    tabs: 3,
    blindTab: true,
    evidenceHighlight: false,
    evidenceRequired: 2,
    labels: 'none',
    cards: 4,
    cardMode: 'stack',
    stackSlots: 3,
    confidence: true,
    verdict: true,
    identifyOptions: 4,
    stepper: false,
    hintLine: false,
  },
  // IV «Система» — шум, ложные метки, полная ответственность.
  system: {
    tabs: 3,
    blindTab: true,
    evidenceHighlight: false,
    evidenceRequired: 2,
    labels: 'false',
    cards: 5,
    cardMode: 'silent',
    stackSlots: 4,
    confidence: true,
    verdict: true,
    identifyOptions: 0,
    stepper: false,
    hintLine: false,
  },
};

export function structureFor(epoch: EpochId): EpochStructure {
  return epochStructures[epoch] ?? epochStructures.street;
}

/**
 * Некоторые механики вводятся по уровню, а не по эпохе: до порога
 * структура эпохи ужимается, чтобы новичка не завалило сразу всем.
 */
export function structureForLevel(epoch: EpochId, level: number): EpochStructure {
  const s = { ...structureFor(epoch) };
  if (level < 3) s.confidence = false;
  if (level < 8) s.identifyOptions = 0;
  if (level < 14) s.stackSlots = 0;
  return s;
}
