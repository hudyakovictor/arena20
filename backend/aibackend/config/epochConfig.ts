import type { EpochId, SourceId } from '../types';
import { balanceConfig } from './balanceConfig';

export interface EpochDef {
  id: EpochId;
  name: string;
  levels: [number, number];
  motto: string;
  description: string;
  // токены оформления — разница эпох при одном скелете
  tokens: {
    bg: string; surface: string; border: string; accent: string;
    radius: number; texture: string;
  };
  crutches: {
    labels: 'all' | 'partial' | 'none' | 'false';
    evidenceHighlights: boolean;
    toActionButton: boolean;
  };
  nav: string[];
}

export const epochs: Record<EpochId, EpochDef> = {
  street: {
    id: 'street', name: 'УЛИЦА', levels: [1,20],
    motto: 'ТЫ ЗДЕСЬ РАДИ ДЕНЕГ. ИМЕННО ПОЭТОМУ ТЫ УЖЕ В ОПАСНОСТИ.',
    description: 'Граффити, неон-лайм, толстые обводки. Все ярлыки на месте.',
    tokens: { bg: '#070B14', surface: '#0C1323', border: '#22304A', accent: '#31D6C4', radius: 16, texture: 'brick' },
    crutches: { labels: 'all', evidenceHighlights: true, toActionButton: true },
    nav: ['ACADEMY','ARENA']
  },
  cabinet: {
    id: 'cabinet', name: 'КАБИНЕТ', levels: [21,50],
    motto: 'РЫНОК — ЭТО НЕ ГРАФИК. ЭТО ЛЮДИ, КОТОРЫЕ РИСУЮТ ГРАФИК.',
    description: 'Скруглённые панели, пастель, тонкие иконки. Часть костылей снята.',
    tokens: { bg: '#080E1E', surface: '#0F1B32', border: '#2A3A55', accent: '#59A7FF', radius: 12, texture: 'paper' },
    crutches: { labels: 'partial', evidenceHighlights: false, toActionButton: false },
    nav: ['ACADEMY','ARENA','COLLECTION']
  },
  terminal: {
    id: 'terminal', name: 'ТЕРМИНАЛ', levels: [51,80],
    motto: 'ВОЛАТИЛЬНОСТЬ ВРЕМЕННА. ТВОЯ ОШИБКА — НАВСЕГДА.',
    description: 'Плотная сетка, монохром + один акцент, моноширинные данные.',
    tokens: { bg: '#060A12', surface: '#0A1320', border: '#1E2E4A', accent: '#FFB341', radius: 8, texture: 'grid' },
    crutches: { labels: 'none', evidenceHighlights: false, toActionButton: false },
    nav: ['ACADEMY','ARENA','COLLECTION','TOURNAMENTS']
  },
  system: {
    id: 'system', name: 'СИСТЕМА', levels: [81,99],
    motto: 'СИСТЕМА РАБОТАЕТ. ПОКА ТЫ НЕ ВМЕШАЕШЬСЯ.',
    description: 'Минимализм, белое на тёмном, ложные ярлыки как норма.',
    tokens: { bg: '#05070D', surface: '#0A0F1C', border: '#1A2740', accent: '#B783FF', radius: 8, texture: 'none' },
    crutches: { labels: 'false', evidenceHighlights: false, toActionButton: false },
    nav: ['ACADEMY','ARENA','COLLECTION','TOURNAMENTS','MARKET']
  }
};

export function getEpochForLevel(level: number): EpochId {
  if (level <= 20) return 'street';
  if (level <= 50) return 'cabinet';
  if (level <= 80) return 'terminal';
  return 'system';
}
export function epochOf(level: number): EpochDef { return epochs[getEpochForLevel(level)]; }

export const mechanicsIntro: Record<string, {epoch: EpochId, level: number, note: string}> = {
  M1_Evidence: { epoch: 'street', level: 1, note: 'улики + evidence strip' },
  M6_PlayForward: { epoch: 'street', level: 1, note: 'график доигрывает' },
  M10_ColdHead: { epoch: 'street', level: 1, note: 'вариант ЖДАТЬ всегда в пуле' },
  M11_Mutation: { epoch: 'street', level: 1, note: 'детерминированная мутация' },
  M12_Campaign: { epoch: 'street', level: 1, note: 'враг 3-4 стадии' },
  M13_Weather: { epoch: 'street', level: 1, note: 'погода дня' },
  M15_Budget: { epoch: 'street', level: 1, note: 'бюджет риска в топ-баре' },
  M3_Confidence: { epoch: 'street', level: 3, note: 'ставка низко/средне/высоко' },
  M5_Identify: { epoch: 'street', level: 8, note: 'опознание врага после ответа' },
  M2_Sequence: { epoch: 'street', level: 14, note: 'стек 2 карты' },
  M4_Verdict: { epoch: 'cabinet', level: 21, note: 'вердикт конфликта' },
  M7_Scroll: { epoch: 'cabinet', level: 21, note: 'свиток ошибок полный' },
  M8_Combo: { epoch: 'cabinet', level: 28, note: 'двойки' },
  M9_Blind: { epoch: 'cabinet', level: 30, note: 'слепой источник' },
};
