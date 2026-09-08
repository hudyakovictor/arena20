// Версионированный fixture content-pack (заглушка контента до фазы 11).
// Разрешён стеком: «контент до фазы 11 → небольшой версионированный fixture pack».
// Все свечи детерминированы от scenarioSeed(scenarioId, contentVersion).
import type {
  BrowserTab,
  Candle,
  ContentPack,
  DecisionOption,
  Entity,
  Protocol,
  SkillCard,
} from './schemas.js';
import { contentPackSchema } from './schemas.js';
import { createRng, scenarioSeed } from './prng.js';

export const CONTENT_VERSION = '0.1.0';
export const DATASET_VERSION = 'fixture-0.1.0';

/** Детерминированный генератор свечей (LCG через seedrandom). */
export function genCandles(
  seed: string,
  count: number,
  startPrice: number,
  drift: number,
): Candle[] {
  const rng = createRng(seed);
  const out: Candle[] = [];
  let price = startPrice;
  for (let i = 0; i < count; i += 1) {
    const change = (rng.next() - 0.5 + drift) * startPrice * 0.03;
    const o = price;
    const c = Math.max(startPrice * 0.4, o + change);
    const h = Math.max(o, c) + rng.next() * startPrice * 0.008;
    const l = Math.min(o, c) - rng.next() * startPrice * 0.008;
    const v = 40 + rng.next() * 120;
    out.push({ t: i, o, h, l, c, v });
    price = c;
  }
  return out;
}

/** Псевдо-хэш фиксации future (демо; серверный HMAC — T102/T105). */
export function fixtureFutureHash(seed: string): string {
  const rng = createRng(`hash:${seed}`);
  let hex = '';
  const alphabet = '0123456789abcdef';
  for (let i = 0; i < 32; i += 1) hex += alphabet[rng.int(0, 15)];
  return hex;
}

function decision(
  id: string,
  labelKey: string,
  quality: number,
  rationaleKey: string,
): DecisionOption {
  return { id, labelKey, quality, rationaleKey };
}

function tab(id: BrowserTab['id'], labelKey: string, bodyKey: string): BrowserTab {
  return { id, labelKey, bodyKey };
}

const SKILLS: SkillCard[] = [
  {
    skillId: 'risk-first',
    kind: 'protection',
    titleKey: 'skill.risk-first.title',
    bodyKey: 'skill.risk-first.body',
    theoryKey: 'academy.risk',
    icon: 'i-risk',
  },
  {
    skillId: 'no-confirm',
    kind: 'reading',
    titleKey: 'skill.no-confirm.title',
    bodyKey: 'skill.no-confirm.body',
    theoryKey: 'academy.structure',
    icon: 'i-evidence',
  },
  {
    skillId: 'htf',
    kind: 'reading',
    titleKey: 'skill.htf.title',
    bodyKey: 'skill.htf.body',
    theoryKey: 'academy.timeframes',
    icon: 'i-source',
  },
  {
    skillId: 'news-noise',
    kind: 'reading',
    titleKey: 'skill.news-noise.title',
    bodyKey: 'skill.news-noise.body',
    theoryKey: 'academy.noise',
    icon: 'i-warning',
  },
  {
    skillId: 'no-average',
    kind: 'protection',
    titleKey: 'skill.no-average.title',
    bodyKey: 'skill.no-average.body',
    theoryKey: 'academy.risk',
    icon: 'i-risk',
  },
  {
    skillId: 'flat-ok',
    kind: 'decision',
    titleKey: 'skill.flat-ok.title',
    bodyKey: 'skill.flat-ok.body',
    theoryKey: 'academy.discipline',
    icon: 'i-no-trade',
  },
  {
    skillId: 'invalidate',
    kind: 'decision',
    titleKey: 'skill.invalidate.title',
    bodyKey: 'skill.invalidate.body',
    theoryKey: 'academy.plan',
    icon: 'i-decision',
  },
  {
    skillId: 'plan-profit',
    kind: 'protection',
    titleKey: 'skill.plan-profit.title',
    bodyKey: 'skill.plan-profit.body',
    theoryKey: 'academy.discipline',
    icon: 'i-check',
  },
];

const ENTITIES: Entity[] = [
  {
    entityId: 'fake-breakout-phantom',
    slug: 'fake-breakout-phantom',
    nameEn: 'Fake Breakout Phantom',
    category: 'market-structure',
    bodyKey: 'entity.fake-breakout-phantom.body',
    tellKey: 'entity.fake-breakout-phantom.tell',
    counterKey: 'entity.fake-breakout-phantom.counter',
    icon: 'i-entity',
  },
  {
    entityId: 'fomo-wraith',
    slug: 'fomo-wraith',
    nameEn: 'FOMO Wraith',
    category: 'emotions-behaviour',
    bodyKey: 'entity.fomo-wraith.body',
    tellKey: 'entity.fomo-wraith.tell',
    counterKey: 'entity.fomo-wraith.counter',
    icon: 'i-entity',
  },
  {
    entityId: 'leverage-goblin',
    slug: 'leverage-goblin',
    nameEn: 'Leverage Goblin',
    category: 'risk-exposure',
    bodyKey: 'entity.leverage-goblin.body',
    tellKey: 'entity.leverage-goblin.tell',
    counterKey: 'entity.leverage-goblin.counter',
    icon: 'i-entity',
  },
  {
    entityId: 'headline-titan',
    slug: 'headline-titan',
    nameEn: 'Headline Titan',
    category: 'narratives-info',
    bodyKey: 'entity.headline-titan.body',
    tellKey: 'entity.headline-titan.tell',
    counterKey: 'entity.headline-titan.counter',
    icon: 'i-entity',
  },
  {
    entityId: 'anchor-golem',
    slug: 'anchor-golem',
    nameEn: 'Anchor Golem',
    category: 'emotions-behaviour',
    bodyKey: 'entity.anchor-golem.body',
    tellKey: 'entity.anchor-golem.tell',
    counterKey: 'entity.anchor-golem.counter',
    icon: 'i-entity',
  },
  {
    entityId: 'revenge-wraith',
    slug: 'revenge-wraith',
    nameEn: 'Revenge Wraith',
    category: 'emotions-behaviour',
    bodyKey: 'entity.revenge-wraith.body',
    tellKey: 'entity.revenge-wraith.tell',
    counterKey: 'entity.revenge-wraith.counter',
    icon: 'i-entity',
  },
];

const PROTOCOLS: Protocol[] = [
  {
    protocolId: 'risk-first',
    titleKey: 'protocol.risk-first.title',
    ruleKey: 'protocol.risk-first.rule',
  },
  {
    protocolId: 'evidence-only',
    titleKey: 'protocol.evidence-only.title',
    ruleKey: 'protocol.evidence-only.rule',
  },
  {
    protocolId: 'noise-quarantine',
    titleKey: 'protocol.noise-quarantine.title',
    ruleKey: 'protocol.noise-quarantine.rule',
  },
  { protocolId: 'flat-ok', titleKey: 'protocol.flat-ok.title', ruleKey: 'protocol.flat-ok.rule' },
  {
    protocolId: 'save-system',
    titleKey: 'protocol.save-system.title',
    ruleKey: 'protocol.save-system.rule',
  },
  {
    protocolId: 'after-loss',
    titleKey: 'protocol.after-loss.title',
    ruleKey: 'protocol.after-loss.rule',
  },
  {
    protocolId: 'confidence',
    titleKey: 'protocol.confidence.title',
    ruleKey: 'protocol.confidence.rule',
  },
];

function buildPack(): ContentPack {
  const seed1 = scenarioSeed('mvp-001', CONTENT_VERSION);
  const seed2 = scenarioSeed('mvp-002', CONTENT_VERSION);
  const pack = {
    contentVersion: CONTENT_VERSION,
    scenarios: [
      {
        scenarioId: 'mvp-001',
        contentVersion: CONTENT_VERSION,
        kind: 'pre-entry',
        difficulty: 12,
        contextKey: 'scen.mvp-001.context',
        goalKey: 'scen.mvp-001.goal',
        tabs: [
          tab('chart', 'tab.chart', 'scen.mvp-001.tab.chart'),
          tab('volume', 'tab.volume', 'scen.mvp-001.tab.volume'),
          tab('news', 'tab.news', 'scen.mvp-001.tab.news'),
          tab('social', 'tab.social', 'scen.mvp-001.tab.social'),
        ],
        visibleCandles: genCandles(`${seed1}:visible`, 48, 100, 0.12),
        t0Index: 47,
        timeframeKey: 'scen.mvp-001.tf',
        skillIds: ['risk-first', 'no-confirm', 'news-noise', 'flat-ok'],
        entityIds: ['fake-breakout-phantom'],
        protocolId: 'risk-first',
        decisions: [
          decision('a', 'scen.mvp-001.d0', 25, 'scen.mvp-001.d0r'),
          decision('b', 'scen.mvp-001.d1', 92, 'scen.mvp-001.d1r'),
          decision('c', 'scen.mvp-001.d2', 45, 'scen.mvp-001.d2r'),
          decision('d', 'scen.mvp-001.d3', 85, 'scen.mvp-001.d3r'),
        ],
        step2: {
          kind: 'risk',
          promptKey: 'scen.mvp-001.step2q',
          options: [
            decision('s0', 'scen.mvp-001.s0', 95, 'scen.mvp-001.s0r'),
            decision('s1', 'scen.mvp-001.s1', 60, 'scen.mvp-001.s1r'),
            decision('s2', 'scen.mvp-001.s2', 5, 'scen.mvp-001.s2r'),
          ],
        },
        futureHash: fixtureFutureHash(seed1),
        datasetVersion: DATASET_VERSION,
        futureCandles: genCandles(`${seed1}:future`, 16, 103.4, -0.35),
        factKey: 'scen.mvp-001.fact',
        sourceRef: 'scen.mvp-001.source',
      },
      {
        scenarioId: 'mvp-002',
        contentVersion: CONTENT_VERSION,
        kind: 'in-position',
        difficulty: 24,
        contextKey: 'scen.mvp-002.context',
        goalKey: 'scen.mvp-002.goal',
        tabs: [
          tab('chart', 'tab.chart', 'scen.mvp-002.tab.chart'),
          tab('position', 'tab.position', 'scen.mvp-002.tab.position'),
          tab('social', 'tab.social', 'scen.mvp-002.tab.social'),
        ],
        visibleCandles: genCandles(`${seed2}:visible`, 40, 64, 0.02),
        t0Index: 39,
        timeframeKey: 'scen.mvp-002.tf',
        skillIds: ['risk-first', 'no-average', 'invalidate'],
        entityIds: ['revenge-wraith'],
        protocolId: 'evidence-only',
        decisions: [
          decision('a', 'scen.mvp-002.d0', 80, 'scen.mvp-002.d0r'),
          decision('b', 'scen.mvp-002.d1', 95, 'scen.mvp-002.d1r'),
          decision('c', 'scen.mvp-002.d2', 10, 'scen.mvp-002.d2r'),
          decision('d', 'scen.mvp-002.d3', 40, 'scen.mvp-002.d3r'),
        ],
        futureHash: fixtureFutureHash(seed2),
        datasetVersion: DATASET_VERSION,
        futureCandles: genCandles(`${seed2}:future`, 14, 64.2, -0.3),
        factKey: 'scen.mvp-002.fact',
        sourceRef: 'scen.mvp-002.source',
      },
    ],
    skills: SKILLS,
    entities: ENTITIES,
    protocols: PROTOCOLS,
    manifest: {
      version: CONTENT_VERSION,
      assets: [
        {
          id: 'icon.arena',
          kind: 'svg',
          src: 'assets/icons/i-arena.svg',
          pack: 'core-ui',
          lazy: false,
          logicalSize: { width: 24, height: 24 },
          maxBytes: 400,
          tintable: true,
          placeholder: true,
        },
      ],
    },
  } as const;
  return contentPackSchema.parse(pack);
}

let cached: ContentPack | null = null;

/** Ленивый синглтон fixture-pack (парсинг + валидация один раз). */
export function fixturePack(): ContentPack {
  if (!cached) cached = buildPack();
  return cached;
}
