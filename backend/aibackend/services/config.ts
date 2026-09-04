// config — версионируемый JSON по сегменту (ТЗ Часть 6 §9). Дефолт собирается из balanceConfig; переопределения — в БД.
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { configs } from '../db/schema';
import { balanceConfig } from '../config/balanceConfig';
import { epochs, mechanicsIntro } from '../config/epochConfig';
import { cards } from '../content/cards';
import { schedulerConfig } from '../engine/scheduler';
import { botThresholds } from '../engine/autotest';

export const DEFAULT_CONFIG_VERSION = 'cfg-1.0.0';

export function defaultConfig() {
  return {
    version: DEFAULT_CONFIG_VERSION,
    levels: {
      cardUnlock: Object.fromEntries(cards.map(c => [c.id, c.unlockLevel])),
      epochBorders: balanceConfig.epochBorders,
      xpThresholds: balanceConfig.xp.levelThresholds,
    },
    crutches: Object.fromEntries(Object.values(epochs).map(e => [e.id, e.crutches])),
    mechanics: { intro: mechanicsIntro, evidence: balanceConfig.evidence, sequence: balanceConfig.sequence, confidence: balanceConfig.confidence, verdict: balanceConfig.verdict, identify: balanceConfig.identify, playForward: balanceConfig.playForward, errorScroll: balanceConfig.errorScroll, blind: balanceConfig.blind, coldHead: balanceConfig.coldHead, campaign: balanceConfig.campaign, shadow: balanceConfig.shadow },
    risk_budget: balanceConfig.riskBudget,
    confidence: balanceConfig.confidence.multipliers,
    scheduler: schedulerConfig,
    mutation: {
      axes: ['asset', 'timeframe', 'mirror', 'numbers', 'wording', 'order', 'noise'],
      amplitudeByEpoch: { street: 0.4, cabinet: 0.6, terminal: 0.8, system: 1.0 },
      noiseByEpoch: { street: 0, cabinet: 0, terminal: 0.5, system: 0.7 },
    },
    bots: botThresholds,
    combo: balanceConfig.combo,
    weather: balanceConfig.weather,
    economy: { xp: balanceConfig.xp, coins: balanceConfig.coins, cosmeticsPriceSig: { skin_cards: 300, skin_trophy: 450, fx_feedback: 200 } },
    tournament: { windowHours: 48, seedSetSize: 6, shadowTopPercent: 20 },
  };
}

export async function getConfig(segment = 'default') {
  try {
    const rows = await db.select().from(configs).where(and(eq(configs.segment, segment), eq(configs.active, true))).orderBy(desc(configs.createdAt)).limit(1);
    if (rows[0]) return { version: rows[0].version, segment, json: rows[0].json };
    if (segment !== 'default') return getConfig('default');
  } catch { /* fallback */ }
  return { version: DEFAULT_CONFIG_VERSION, segment: 'default', json: defaultConfig() as Record<string, unknown> };
}

export async function publishConfig(version: string, segment: string, json: Record<string, unknown>) {
  await db.update(configs).set({ active: false }).where(eq(configs.segment, segment));
  await db.insert(configs).values({ version, segment, json: { ...defaultConfig(), ...json, version }, active: true })
    .onConflictDoUpdate({ target: [configs.version, configs.segment], set: { json: { ...defaultConfig(), ...json, version }, active: true } });
  return getConfig(segment);
}
