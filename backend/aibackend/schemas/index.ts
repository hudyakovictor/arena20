// Zod-схемы контента и API-контрактов (ТЗ Часть 6 §2 «контент — данные», Приложение Г)
import { z } from 'zod';

export const SourceIdSchema = z.enum(['chart', 'news', 'position', 'wallet', 'tokenomics', 'onchain', 'orderbook', 'sentiment']);
export const DomainSchema = z.enum(['technical', 'risk', 'context', 'crypto', 'human', 'cognitive']);
export const ConfidenceSchema = z.enum(['low', 'mid', 'high']).nullable();

export const AnswerOptionSchema = z.object({
  label: z.string().min(1).max(2),
  text: z.string().min(3).max(200),
  isWait: z.boolean().optional(),
  errorType: z.string().max(40).optional(),
  enemyHint: z.string().regex(/^E\d{2}$/).optional(),
  answerPool: z.array(z.string().min(3).max(200)).max(4).optional(),
});

export const EvidenceZoneSchema = z.object({
  id: z.string().min(2).max(40),
  source: SourceIdSchema,
  label: z.string().min(2).max(160),
  isCorrect: z.boolean(),
  hint: z.string().max(160).optional(),
});

export const TemplateSchema = z.object({
  id: z.string().regex(/^[A-Z0-9-]+$/).min(3).max(40),
  learningGoal: z.string().min(8).max(200),
  atoms: z.array(z.string().regex(/^C\d{1,2}\.\d{1,2}$/)).min(1).max(4),
  enemyId: z.string().regex(/^E\d{2}$/),
  stage: z.number().int().min(1).max(4),
  sources: z.array(SourceIdSchema).min(1).max(3),
  questionPool: z.array(z.string().min(8).max(240)).min(1).max(8),
  answers: z.array(AnswerOptionSchema).length(4),
  correct: z.number().int().min(0).max(3),
  evidence: z.array(EvidenceZoneSchema).min(1).max(6),
  skills: z.array(z.string().regex(/^C\d{1,2}$/)).min(1).max(4),
  domain: DomainSchema,
  verdict: z.object({ factorA: z.string().min(2).max(60), factorB: z.string().min(2).max(60), correctFactor: z.enum(['A', 'B']) }).optional(),
  feedback: z.object({ correct: z.string().max(300), wrong: z.string().max(300) }).optional(),
});
export type TemplateDraft = z.infer<typeof TemplateSchema>;

// ─── API ────────────────────────────────────────────────────────────────────
export const AnonAuthSchema = z.object({
  deviceId: z.string().min(6).max(128),
  userAgent: z.string().max(300).optional(),
});

export const AttemptSchema = z.object({
  clientAttemptId: z.string().min(4).max(80).optional(),
  sessionId: z.string().uuid().optional(),
  tournamentId: z.string().uuid().optional(),
  templateId: z.string().min(3).max(60),
  contentVersion: z.string().max(64).optional(),
  seed: z.number().int().min(0).max(4294967295),
  answer: z.number().int().min(0).max(3).nullable().default(null),
  evidence: z.array(z.string().max(40)).max(8).default([]),
  confidence: ConfidenceSchema.default(null),
  openedSources: z.array(SourceIdSchema).max(4).default([]),
  sequence: z.array(z.string().max(4)).max(5).default([]),
  verdict: z.enum(['A', 'B']).nullable().default(null),
  blindOpened: z.boolean().default(false),
  identifyGuess: z.string().regex(/^E\d{2}$/).optional(),
  durationMs: z.number().int().min(0).max(10 * 60 * 1000).default(0),
  clientTs: z.number().int().optional(),
});
export type AttemptPayload = z.infer<typeof AttemptSchema>;

export const AttemptBatchSchema = z.object({ attempts: z.array(AttemptSchema).min(1).max(50) });

export const SessionStartSchema = z.object({ weatherMode: z.string().max(20).optional() });
export const SessionEndSchema = z.object({ endedBy: z.enum(['player', 'budget_zero', 'leviathan', 'timeout']).default('player') });

export const MicrocheckSchema = z.object({
  cardId: z.string().regex(/^C\d{1,2}$/),
  atomId: z.string().regex(/^C\d{1,2}\.\d{1,2}$/),
  seed: z.number().int().min(0),
  answer: z.number().int().min(0).max(2),
});

export const EventsSchema = z.object({
  events: z.array(z.object({
    name: z.string().min(2).max(60),
    sessionId: z.string().uuid().optional(),
    payload: z.record(z.string(), z.unknown()).default({}),
    clientTs: z.number().int().optional(),
  })).min(1).max(200),
});

export const AiDraftRequestSchema = z.object({
  enemyId: z.string().regex(/^E\d{2}$/),
  stage: z.number().int().min(1).max(4),
  learningGoal: z.string().min(8).max(200).optional(),
  atoms: z.array(z.string().regex(/^C\d{1,2}\.\d{1,2}$/)).max(4).optional(),
  epoch: z.enum(['street', 'cabinet', 'terminal', 'system']).optional(),
  variants: z.number().int().min(1).max(3).default(1),
  provider: z.enum(['auto', 'openai', 'synthetic']).default('auto'),
});

export const DraftReviewSchema = z.object({
  action: z.enum(['approve', 'reject', 'publish']),
  note: z.string().max(400).optional(),
});

export const ConfigPublishSchema = z.object({
  version: z.string().min(1).max(40),
  segment: z.string().min(1).max(40).default('default'),
  json: z.record(z.string(), z.unknown()),
});

export const TournamentCreateSchema = z.object({
  name: z.string().min(3).max(80),
  startsAt: z.string().datetime().optional(),
  durationHours: z.number().int().min(1).max(24 * 14).default(48),
  size: z.number().int().min(3).max(12).default(6),
});
