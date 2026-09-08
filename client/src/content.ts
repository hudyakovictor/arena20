// Клиентский контент-слой: fixture-pack + контракт «скрытого будущего».
// Повторяет серверный контракт T102 на клиенте: публичный сценарий НЕ содержит
// future; revealScenario() — локальное зеркало серверного reveal ПОСЛЕ фиксации.
// Сервер станет авторитетом в T100–T106; сигнатуры уже разделены.
import type {
  BrowserTabId,
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
import { createRng, fixturePack, scenarioPublicSchema, scenarioSeed } from '@signal-arena/shared';

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

/** Давление сущностей в сценарии (прототип 4.3, зона 3): честно равно сложности. */
export function pressureOf(scenario: ScenarioPublic): number {
  return scenario.difficulty;
}

/** Уровень мастерства карты 0–3 по числу применений (прототип 4.6). */
export function masteryOf(used: number): number {
  if (used <= 0) return 0;
  if (used < 3) return 1;
  if (used < 8) return 2;
  return 3;
}

/** Среднее качество применений навыка; null — навык ещё не применялся. */
export function avgQualityOf(
  stat: { used: number; qualitySum: number } | undefined,
): number | null {
  if (!stat || stat.used <= 0) return null;
  return Math.round(stat.qualitySum / stat.used);
}

/** Заголовок главы Академии по theoryKey навыка (skill.theoryKey → academy.ch.*). */
export function chapterTitleKeyFor(theoryKey: string): string {
  const id = theoryKey.startsWith('academy.') ? theoryKey.slice('academy.'.length) : theoryKey;
  return `academy.ch.${id}.title`;
}

// ---------- каталог вкладок (прототип 4.5) ----------

export type CatalogLock =
  { kind: 'coins'; cost: number } | { kind: 'level'; level: number } | { kind: 'phase' };

export interface CatalogRow {
  tabId: BrowserTabId;
  /** Индекс вкладки в сценарии (для переключения) либо null, если вкладки нет в сценарии. */
  scenarioIndex: number | null;
  lock: CatalogLock | null;
}

/**
 * Строки каталога источников: вкладки сценария (открыты) + платные/уровневые
 * дополнения. Вкладки, которых нет в сценарии и нет в списке открываемых,
 * не показываются: по §5 лишний источник не должен занимать внимание.
 */
export function tabCatalog(scenario: ScenarioPublic): CatalogRow[] {
  const rows: CatalogRow[] = scenario.tabs.map((tab, index) => ({
    tabId: tab.id,
    scenarioIndex: index,
    lock: null,
  }));
  const has = new Set(scenario.tabs.map((tab) => tab.id));
  const extras: { tabId: BrowserTabId; lock: CatalogLock }[] = [
    { tabId: 'macro', lock: { kind: 'coins', cost: 40 } },
    { tabId: 'tokenomics', lock: { kind: 'coins', cost: 30 } },
    { tabId: 'onchain', lock: { kind: 'level', level: 48 } },
  ];
  if (scenario.kind === 'pre-entry') extras.push({ tabId: 'position', lock: { kind: 'phase' } });
  for (const extra of extras) {
    if (!has.has(extra.tabId)) {
      rows.push({ tabId: extra.tabId, scenarioIndex: null, lock: extra.lock });
    }
  }
  return rows;
}

// ---------- стакан и метрики объёма (прототип 4.4) ----------

export interface BookLevel {
  /** Отклонение от последней видимой цены, доли (цены скрыты по §15 — только пропорции). */
  offsetPct: number;
  /** Относительный объём уровня 0–100. */
  vol: number;
}

export interface OrderBook {
  asks: BookLevel[];
  bids: BookLevel[];
  /** Спред в процентах. */
  spreadPct: number;
}

/**
 * Детерминированный стакан из seed сценария. Абсолютные цены не раскрываются
 * (только отклонения и пропорции — правило прототипа 4.4).
 */
export function orderBookOf(scenarioId: string, contentVersion: string): OrderBook {
  const rng = createRng(`${scenarioSeed(scenarioId, contentVersion)}:book`);
  const level = (side: number): BookLevel => ({
    offsetPct: Math.round(side * (0.05 + rng.next() * 0.45) * 100) / 100,
    vol: 8 + Math.round(rng.next() * 30),
  });
  return {
    asks: [level(1), level(1), level(1), level(1)],
    bids: [level(-1), level(-1), level(-1), level(-1)],
    spreadPct: Math.round((0.01 + rng.next() * 0.04) * 100) / 100,
  };
}

/**
 * Отклонение объёма последних 3 свечей от среднего по видимым (целые проценты,
 * отрицательное — затухание). Возвращает null, если свечей меньше 6.
 */
export function breakVolumeDelta(candles: readonly Candle[]): number | null {
  if (candles.length < 6) return null;
  const mean = candles.reduce((sum, c) => sum + c.v, 0) / candles.length;
  if (mean <= 0) return null;
  const tail = candles.slice(-3);
  const tailMean = tail.reduce((sum, c) => sum + c.v, 0) / tail.length;
  return Math.round(((tailMean - mean) / mean) * 100);
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
