// generate(template, seed, ctx) → TaskInstance — детерминированно, общий код с клиентом (ТЗ Часть 6 §2, §6)
import type { EncounterInstance, EncounterTemplate, EpochId, SourceId } from '../types';
import { mutate, nextSeed } from './mutator';
import { SeededRng, hashString } from './rng';
import { balanceConfig } from '../config/balanceConfig';
import { getEpochForLevel } from '../config/epochConfig';

export interface PlayerContext {
  level: number;
  epoch: EpochId;
  tiltStreak?: number;
}

export interface TaskInstanceFull extends EncounterInstance {
  contentVersion: string;
  mode: 'standard' | 'sequence' | 'verdict' | 'blind';
  sequenceSlots: number;
  blindSource: SourceId | null;
  blindIrrelevant: boolean;
  requiredEvidence: number;
  coldDelayMs: number;
  noiseSource: SourceId | null;
}

/** Публичный экземпляр — без пометок верного варианта и верных улик (принцип нераскрытия). */
export interface TaskInstancePublic {
  templateId: string;
  contentVersion: string;
  seed: number;
  enemyDomain: string;
  stage: number;
  mode: TaskInstanceFull['mode'];
  question: string;
  ticker: string;
  timeframe: string;
  isMirrored: boolean;
  sources: SourceId[];
  noiseSource: SourceId | null;
  blindSource: SourceId | null;
  answers: { label: string; text: string; isWait?: boolean }[];
  evidence: { id: string; source: SourceId; label: string }[];
  skills: string[];
  sequenceSlots: number;
  requiredEvidence: number;
  coldDelayMs: number;
  verdict: { factorA: string; factorB: string } | null;
  learningGoal: string;
  atoms: string[];
}

const ALL_SOURCES: SourceId[] = ['chart', 'news', 'position', 'wallet', 'tokenomics', 'onchain', 'orderbook', 'sentiment'];

export function generate(template: EncounterTemplate, seed: number, ctx: PlayerContext, contentVersion: string): TaskInstanceFull {
  // Постусловие генерации: эталон обязан оставаться верным; иначе seed отклоняется и берётся следующий
  let s = seed >>> 0;
  let inst = mutate(template, s);
  let guard = 0;
  while (inst.mutatedAnswers[inst.correctAnswer] !== template.answers[template.correct] && guard < 8) {
    s = nextSeed(s); inst = mutate(template, s); guard++;
  }
  const epoch = ctx.epoch ?? getEpochForLevel(ctx.level);
  const rng = new SeededRng((s ^ hashString(template.id + ':meta')) >>> 0);

  // Режим задания — состояние экрана Task, не отдельная сцена
  let mode: TaskInstanceFull['mode'] = 'standard';
  if (template.verdict && ctx.level >= balanceConfig.verdict.introducedAt) mode = 'verdict';
  else if (ctx.level >= balanceConfig.sequence.introducedAt && template.skills.length >= 2 && epoch !== 'street') mode = 'sequence';

  // M9 — слепой источник (одна вкладка закрыта; в III может быть нерелевантной; в IV — две, упрощённо одна)
  let blindSource: SourceId | null = null;
  let blindIrrelevant = false;
  if (ctx.level >= balanceConfig.blind.introducedAt && template.sources.length >= 2) {
    blindSource = template.sources[rng.int(1, template.sources.length - 1)];
    blindIrrelevant = (epoch === 'terminal' || epoch === 'system') && rng.next() < 0.3;
    if (mode === 'standard') mode = 'blind';
  }
  // Шум эпох III–IV — лишний источник, не влияющий на вердикт (≤3 вкладок)
  let noiseSource: SourceId | null = null;
  if ((epoch === 'terminal' || epoch === 'system') && template.sources.length < 3 && rng.next() < 0.5) {
    const cand = ALL_SOURCES.filter(x => !template.sources.includes(x));
    noiseSource = rng.pick(cand);
  }
  const requiredEvidence = balanceConfig.evidence.requiredInEpoch[epoch];
  const coldDelayMs = (ctx.tiltStreak ?? 0) >= balanceConfig.coldHead.tiltThreshold ? balanceConfig.coldHead.delayMs : 0;
  const sequenceSlots = Math.min(balanceConfig.sequence.slotsByEpoch[epoch], template.skills.length);

  return { ...inst, seed: s, contentVersion, mode, sequenceSlots, blindSource, blindIrrelevant, requiredEvidence, coldDelayMs, noiseSource };
}

export function toPublic(inst: TaskInstanceFull): TaskInstancePublic {
  const sources = [...inst.sources, ...(inst.noiseSource ? [inst.noiseSource] : [])].slice(0, 3);
  return {
    templateId: inst.id,
    contentVersion: inst.contentVersion,
    seed: inst.seed,
    enemyDomain: inst.domain,
    stage: inst.stage,
    mode: inst.mode,
    question: inst.question,
    ticker: inst.ticker,
    timeframe: inst.timeframe,
    isMirrored: inst.isMirrored,
    sources,
    noiseSource: inst.noiseSource,
    blindSource: inst.blindSource,
    answers: inst.mutatedAnswers.map(a => ({ label: a.label, text: a.text, ...(a.isWait ? { isWait: true } : {}) })),
    evidence: inst.mutatedEvidence.map(e => ({ id: e.id, source: e.source, label: e.label })),
    skills: inst.skills,
    sequenceSlots: inst.sequenceSlots,
    requiredEvidence: inst.requiredEvidence,
    coldDelayMs: inst.coldDelayMs,
    verdict: inst.verdict ? { factorA: inst.verdict.factorA, factorB: inst.verdict.factorB } : null,
    learningGoal: inst.learningGoal,
    atoms: inst.atoms,
  };
}
