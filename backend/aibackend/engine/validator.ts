// Validator — проверка ответа, улик, стека, вердикта; результат correct / correct_unfounded / wrong (ТЗ Часть 6 §4.3, §5.3)
import type { Confidence } from '../types';
import type { TaskInstanceFull } from './generator';
import { balanceConfig } from '../config/balanceConfig';

export type AttemptResult = 'correct' | 'correct_unfounded' | 'wrong';

export interface AttemptInput {
  answer: number | null;             // индекс варианта в мутированном порядке
  evidence: string[];                // id зон-улик
  confidence: Confidence;
  openedSources: string[];
  sequence: string[];                // M2 — карты по порядку
  verdict: 'A' | 'B' | null;         // M4
  blindOpened: boolean;              // M9
  durationMs: number;
}

export interface ValidationOutcome {
  result: AttemptResult;
  isCorrect: boolean;
  isJustified: boolean;
  verdictCorrect: boolean | null;
  sequenceCorrect: boolean | null;
  correctAnswer: number;             // раскрывается только после валидации
  correctEvidence: string[];
  originalVariant: number | null;    // индекс варианта в исходном шаблоне (для распределения ответов)
  flags: string[];                   // антифрод-флаги
  missedEvidence: string;
}

/** Минимально возможное время: открыть обязательные источники + прочитать вопрос. */
export function minPlausibleMs(inst: TaskInstanceFull): number {
  return 1500 + inst.sources.length * 700 + (inst.mode === 'sequence' ? 1500 : 0);
}

export function validateAttempt(inst: TaskInstanceFull, input: AttemptInput): ValidationOutcome {
  const flags: string[] = [];
  const correctEvidence = inst.mutatedEvidence.filter(e => e.isCorrect).map(e => e.id);
  const knownEvidence = new Set(inst.mutatedEvidence.map(e => e.id));

  // Улика обязана быть зоной, существующей в экземпляре
  const validEvidence = input.evidence.filter(e => knownEvidence.has(e));
  if (validEvidence.length !== input.evidence.length) flags.push('evidence_unknown_zone');
  const correctPicked = validEvidence.filter(e => correctEvidence.includes(e)).length;
  const isJustified = correctPicked >= Math.min(inst.requiredEvidence, correctEvidence.length) && correctPicked > 0;

  if (input.durationMs > 0 && input.durationMs < minPlausibleMs(inst)) flags.push('too_fast');
  if (inst.blindSource && input.blindOpened === false && input.openedSources.includes(inst.blindSource)) flags.push('blind_source_bypass');

  // M4 — вердикт: сначала фактор, потом действие; неверный фактор = ошибка (частичный балл только за верный первый шаг)
  let verdictCorrect: boolean | null = null;
  if (inst.mode === 'verdict' && inst.verdict) {
    verdictCorrect = input.verdict === inst.verdict.correctFactor;
  }

  // M2 — стек: принимаются все допустимые порядки шаблона (в MVP — префикс порядка skills)
  let sequenceCorrect: boolean | null = null;
  if (inst.mode === 'sequence') {
    const expected = inst.skills.slice(0, inst.sequenceSlots);
    const seq = input.sequence.slice(0, inst.sequenceSlots);
    sequenceCorrect = seq.length === expected.length && seq.every((s, i) => s === expected[i]);
  }

  let isCorrect: boolean;
  if (inst.mode === 'sequence') isCorrect = !!sequenceCorrect;
  else isCorrect = input.answer !== null && input.answer === inst.correctAnswer;
  if (verdictCorrect === false) isCorrect = false;

  const result: AttemptResult = !isCorrect ? 'wrong' : isJustified ? 'correct' : 'correct_unfounded';

  const originalVariant = input.answer !== null && inst.mutatedAnswers[input.answer]
    ? inst.answers.indexOf(inst.mutatedAnswers[input.answer])
    : null;

  const missed = inst.mutatedEvidence.find(e => e.isCorrect && !validEvidence.includes(e.id));
  return {
    result, isCorrect, isJustified, verdictCorrect, sequenceCorrect,
    correctAnswer: inst.correctAnswer, correctEvidence, originalVariant, flags,
    missedEvidence: missed?.label ?? (isJustified ? '' : 'нет улики'),
  };
}

export function confidenceValue(c: Confidence): number {
  return c === 'high' ? 0.9 : c === 'mid' ? 0.65 : c === 'low' ? 0.35 : 0.5;
}

export const blindCost = () => balanceConfig.riskBudget.blindSourceCost;
