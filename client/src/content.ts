// Клиентский контент-слой: fixture-pack + контракт «скрытого будущего».
// Повторяет серверный контракт T102 на клиенте: публичный сценарий НЕ содержит
// future; revealScenario() — локальное зеркало серверного reveal ПОСЛЕ фиксации.
// Сервер станет авторитетом в T100–T106; сигнатуры уже разделены.
import type {
  Candle,
  ContentPack,
  DecisionOption,
  Entity,
  Protocol,
  ScenarioFull,
  ScenarioPublic,
  SkillCard,
  Verdict,
} from '@signal-arena/shared';
import { fixturePack, scenarioPublicSchema } from '@signal-arena/shared';

let pack: ContentPack | null = null;

export function content(): ContentPack {
  if (!pack) pack = fixturePack();
  return pack;
}

function fullScenario(scenarioId: string): ScenarioFull {
  const found = content().scenarios.find((s) => s.scenarioId === scenarioId);
  if (!found) throw new Error(`content: неизвестный сценарий ${scenarioId}`);
  return found;
}

/** Публичный сценарий для экрана задания: future вырезано схемой. */
export function getPublicScenario(scenarioId: string): ScenarioPublic {
  const full = fullScenario(scenarioId);
  const { futureCandles: _hidden, factKey: _fact, sourceRef: _src, ...pub } = full;
  return scenarioPublicSchema.parse(pub);
}

export interface RevealPayload {
  futureCandles: Candle[];
  factKey: string;
  sourceRef: string;
  futureHash: string;
}

/** Раскрытие архива — только после фиксации решения (см. ArenaScene.reveal). */
export function revealScenario(scenarioId: string): RevealPayload {
  const full = fullScenario(scenarioId);
  return {
    futureCandles: full.futureCandles,
    factKey: full.factKey,
    sourceRef: full.sourceRef,
    futureHash: full.futureHash,
  };
}

/** Единственная точка доступа сцен к свечам будущего (воронка для check-conventions). */
export function futureCandlesOf(reveal: RevealPayload): Candle[] {
  return reveal.futureCandles;
}

export function listScenarioIds(): string[] {
  return content().scenarios.map((s) => s.scenarioId);
}

export function getSkill(skillId: string): SkillCard {
  const found = content().skills.find((s) => s.skillId === skillId);
  if (!found) throw new Error(`content: неизвестный навык ${skillId}`);
  return found;
}

export function getEntity(entityId: string): Entity {
  const found = content().entities.find((e) => e.entityId === entityId);
  if (!found) throw new Error(`content: неизвестная сущность ${entityId}`);
  return found;
}

export function getProtocol(protocolId: string): Protocol {
  const found = content().protocols.find((p) => p.protocolId === protocolId);
  if (!found) throw new Error(`content: неизвестный протокол ${protocolId}`);
  return found;
}

export function decisionOf(scenario: ScenarioPublic, decisionId: string): DecisionOption {
  const found = scenario.decisions.find((d) => d.id === decisionId);
  if (!found) throw new Error(`content: неизвестное решение ${decisionId}`);
  return found;
}

/**
 * STUB вердикта до T044 (движок оценки): качество берётся из авторской
 * аннотации решения, измерения — детерминированный спред от него.
 * TODO(T044): заменить серверной/доменной оценкой по 5 измерениям.
 */
export function computeVerdictStub(
  scenario: ScenarioPublic,
  decisionId: string,
  step2Id: string | null,
): Verdict {
  const base = decisionOf(scenario, decisionId).quality;
  let stepBonus = 0;
  if (scenario.step2 && step2Id) {
    const opt = scenario.step2.options.find((o) => o.id === step2Id);
    if (opt) stepBonus = Math.round((opt.quality - 50) / 10);
  }
  const quality = Math.max(0, Math.min(100, base + stepBonus));
  const spread = (delta: number): number => Math.max(0, Math.min(100, quality + delta));
  return {
    scenarioId: scenario.scenarioId,
    quality,
    dimensions: {
      context: spread(-4),
      evidence: spread(2),
      action: spread(0),
      risk: spread(-6),
      discipline: spread(4),
    },
    factKey: '',
    consequenceKey: decisionOf(scenario, decisionId).rationaleKey,
    ruleKey: getProtocol(scenario.protocolId).ruleKey,
    xpAwarded: Math.round(quality / 10) + 5,
  };
}
