// T001 · Общие Zod-схемы домена — единый источник типов для client/server.
// Источники: product-mechanics.md (§4, §6–§10, §15), ui-graphics.md (§4, §7, §10).
// TypeScript strict, никакого `any`.
import { z } from 'zod';

export const contentVersionSchema = z
  .string()
  .regex(/^\d+\.\d+\.\d+$/, 'contentVersion: semver MAJOR.MINOR.PATCH');

export const hexHashSchema = z.string().regex(/^[0-9a-f]{16,64}$/i, 'hash: hex 16–64 chars');

/** Свеча OHLCV. Время — индекс/метка архива, не wall-clock. */
export const candleSchema = z.object({
  t: z.number().int().nonnegative(),
  o: z.number().finite(),
  h: z.number().finite(),
  l: z.number().finite(),
  c: z.number().finite(),
  v: z.number().finite().nonnegative(),
});

/** Вкладки браузерного виджета (product-mechanics.md §5). */
export const browserTabIdSchema = z.enum([
  'chart',
  'higher-tf',
  'volume',
  'news',
  'social',
  'macro',
  'tokenomics',
  'onchain',
  'position',
  'journal',
]);

export const browserTabSchema = z.object({
  id: browserTabIdSchema,
  /** copy-key заголовка вкладки */
  labelKey: z.string().min(1),
  /** copy-key тела (или chart-конфиг для графических вкладок) */
  bodyKey: z.string().min(1),
});

export const decisionOptionSchema = z.object({
  id: z.string().min(1),
  /** copy-key текста решения */
  labelKey: z.string().min(1),
  /** Аннотация качества (авторская, часть content-pack; движок оценки — T044). */
  quality: z.number().int().min(0).max(100),
  /** copy-key объяснения, почему это решение такого качества */
  rationaleKey: z.string().min(1),
});

export const step2Schema = z.object({
  kind: z.enum(['risk', 'invalidation', 'confirmation', 'evidence', 'pause']),
  /** copy-key вопроса второго шага */
  promptKey: z.string().min(1),
  options: z.array(decisionOptionSchema).min(2).max(4),
});

/**
 * Публичный сценарий — всё, что разрешено отправлять клиенту ДО решения.
 * Скрытое будущее здесь отсутствует by design (02_TECH_STACK.md).
 */
export const scenarioPublicSchema = z.object({
  scenarioId: z.string().min(1),
  contentVersion: contentVersionSchema,
  kind: z.enum(['pre-entry', 'in-position']),
  difficulty: z.number().int().min(0).max(99),
  contextKey: z.string().min(1),
  goalKey: z.string().min(1),
  tabs: z.array(browserTabSchema).min(1).max(10),
  /** Видимые свечи — только до t0 включительно. */
  visibleCandles: z.array(candleSchema).min(10).max(240),
  /** Индекс t0 в visibleCandles (обычно последний). */
  t0Index: z.number().int().nonnegative(),
  skillIds: z.array(z.string().min(1)).min(1).max(6),
  entityIds: z.array(z.string().min(1)).max(3),
  protocolId: z.string().min(1),
  decisions: z.tuple([
    decisionOptionSchema,
    decisionOptionSchema,
    decisionOptionSchema,
    decisionOptionSchema,
  ]),
  step2: step2Schema.optional(),
  /** Хэш скрытого будущего — доказательство фиксации, не сами данные (§15). */
  futureHash: hexHashSchema,
  datasetVersion: z.string().min(1),
});

/**
 * Полный сценарий — только сервер/авторство. Клиент получает future
 * отдельным ответом ПОСЛЕ фиксации решения (T102).
 */
export const scenarioFullSchema = scenarioPublicSchema.extend({
  futureCandles: z.array(candleSchema).min(1).max(120),
  factKey: z.string().min(1),
  sourceRef: z.string().min(1),
});

export const skillKindSchema = z.enum(['reading', 'decision', 'protection']);

export const skillCardSchema = z.object({
  skillId: z.string().min(1),
  kind: skillKindSchema,
  /** copy-key названия-принципа */
  titleKey: z.string().min(1),
  /** copy-key короткого пояснения */
  bodyKey: z.string().min(1),
  /** copy-key связанной теории Академии */
  theoryKey: z.string().min(1),
  icon: z.string().min(1),
});

export const entityCategorySchema = z.enum([
  'market-structure',
  'emotions-behaviour',
  'narratives-info',
  'risk-exposure',
  'web3-infra',
]);

export const entitySchema = z.object({
  entityId: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  /** Каноническое имя — только EN (ui-graphics.md §7). */
  nameEn: z.string().min(1),
  category: entityCategorySchema,
  /** copy-key описания */
  bodyKey: z.string().min(1),
  /** copy-key признака/проявления */
  tellKey: z.string().min(1),
  /** copy-key контр-приёма */
  counterKey: z.string().min(1),
  icon: z.string().min(1),
});

export const protocolSchema = z.object({
  protocolId: z.string().min(1),
  /** copy-key названия режима оценки */
  titleKey: z.string().min(1),
  /** copy-key правила */
  ruleKey: z.string().min(1),
});

export const verdictDimensionSchema = z.enum([
  'context',
  'evidence',
  'action',
  'risk',
  'discipline',
]);

export const verdictSchema = z.object({
  scenarioId: z.string().min(1),
  quality: z.number().int().min(0).max(100),
  dimensions: z.record(verdictDimensionSchema, z.number().int().min(0).max(100)),
  factKey: z.string().min(1),
  consequenceKey: z.string().min(1),
  ruleKey: z.string().min(1),
  xpAwarded: z.number().int().nonnegative(),
});

export const achievementSchema = z.object({
  achievementId: z.string().min(1),
  unlockedAt: z.string().min(1),
});

export const profileSchema = z.object({
  profileId: z.string().min(1),
  displayName: z.string().min(1).max(24),
  xp: z.number().int().nonnegative(),
  /** Уровень 0–99 — подтверждённая устойчивость, не время в игре (§11). */
  rank: z.number().int().min(0).max(99),
  streakDays: z.number().int().nonnegative(),
  credits: z.number().int().nonnegative(),
  achievements: z.array(achievementSchema),
  masteredEntities: z.array(z.string().min(1)),
  masteredSkills: z.array(z.string().min(1)),
});

export const copyKeySchema = z.string().regex(/^[a-z0-9]+(?:\.[a-z0-9]+)+$/);

export const assetManifestEntrySchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['image', 'svg', 'audio', 'font', 'json']),
  src: z.string().min(1),
  pack: z.string().min(1),
  lazy: z.boolean(),
  logicalSize: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
  sourceSize: z
    .object({ width: z.number().int().positive(), height: z.number().int().positive() })
    .optional(),
  maxBytes: z.number().int().positive(),
  category: z.string().min(1).optional(),
  tintable: z.boolean().optional(),
  /** T003/T004: кодовая/SVG-заглушка до готовности финального арта. */
  placeholder: z.boolean().optional(),
});

export const assetManifestSchema = z.object({
  version: contentVersionSchema,
  assets: z.array(assetManifestEntrySchema).min(1),
});

/** Версионированный content-pack (сценарии + справочники + копи). */
export const contentPackSchema = z.object({
  contentVersion: contentVersionSchema,
  scenarios: z.array(scenarioFullSchema).min(1),
  skills: z.array(skillCardSchema).min(1),
  entities: z.array(entitySchema).min(1),
  protocols: z.array(protocolSchema).min(1),
  manifest: assetManifestSchema,
});

export type ContentPack = z.infer<typeof contentPackSchema>;
export type ScenarioPublic = z.infer<typeof scenarioPublicSchema>;
export type ScenarioFull = z.infer<typeof scenarioFullSchema>;
export type Candle = z.infer<typeof candleSchema>;
export type SkillCard = z.infer<typeof skillCardSchema>;
export type Entity = z.infer<typeof entitySchema>;
export type Protocol = z.infer<typeof protocolSchema>;
export type Verdict = z.infer<typeof verdictSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type BrowserTab = z.infer<typeof browserTabSchema>;
export type BrowserTabId = z.infer<typeof browserTabIdSchema>;
export type DecisionOption = z.infer<typeof decisionOptionSchema>;
export type AssetManifest = z.infer<typeof assetManifestSchema>;
export type AssetManifestEntry = z.infer<typeof assetManifestEntrySchema>;
