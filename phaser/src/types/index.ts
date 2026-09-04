export type SkillDomain = 'technical' | 'risk' | 'context' | 'crypto' | 'human' | 'cognitive';
export type EpochId = 'street' | 'cabinet' | 'terminal' | 'system';
export type SourceId = 'chart' | 'news' | 'position' | 'wallet' | 'tokenomics' | 'onchain' | 'orderbook' | 'sentiment';
export type EvidenceId = string;

export interface Atom { id: string; desc: string; }
export interface SkillCard {
  id: string;           // C1..C17
  cid: number;
  name: string;
  short: string;
  domain: SkillDomain;
  icon: string;
  unlockLevel: number;
  atoms: Atom[];
  rankThresholds: [number, number]; // atoms needed for r2,r3
  mandatorySources: SourceId[];
  optionalSources: SourceId[];
}
export interface SourceDef {
  id: SourceId;
  name: string;
  short: string;
  icon: string;
  appearsWithCard: string;
}
export interface EnemyStage {
  stage: 1|2|3|4;
  level: number;
  requiredCards: { cardId: string; rank: number }[];
  sources: SourceId[];
  factor: string;           // added factor description
  secondDomain?: SkillDomain;
  comboRequired?: string[];  // combo ids
  layers: string;            // art layer description
}
export interface Enemy {
  id: string; // E01
  name: string;
  domain: SkillDomain;
  rankDanger: 1|2|3|4;
  mode: 'normal' | 'event' | 'boss';
  stages: EnemyStage[];
}
export interface AnswerOption { label: string; text: string; isWait?: boolean; errorType?: string; enemyHint?: string; }
export interface EvidenceZone { id: string; source: SourceId; label: string; isCorrect: boolean; hint?: string; }
export interface EncounterTemplate {
  id: string;
  learningGoal: string;
  atoms: string[];
  enemyId: string;
  stage: number;
  sources: SourceId[];
  questionPool: string[];
  answers: AnswerOption[];
  correct: number;
  evidence: EvidenceZone[];
  skills: string[]; // card ids allowed
  domain: SkillDomain;
  verdict?: { factorA: string; factorB: string; correctFactor: 'A'|'B' };
}

export interface EncounterInstance extends EncounterTemplate {
  seed: number;
  question: string;
  mutatedAnswers: AnswerOption[];
  correctAnswer: number;
  mutatedEvidence: EvidenceZone[];
  ticker: string;
  timeframe: string;
  isMirrored: boolean;
}

export type TaskMode = 'standard' | 'sequence' | 'verdict' | 'blind';
export type Confidence = 'low' | 'mid' | 'high' | null;

export interface ComboDef { id: string; cards: string[]; name: string; requiredStage: string; }
export interface GameProgress {
  level: number;
  xp: number;
  xpMax: number;
  coins: number;
  riskBudget: number; // M15
  maxBudget: number;
  streak: number;
  epoch: EpochId;
  cardRanks: Record<string, number>;
  enemyStagesReached: Record<string, number>;
  errorScroll: ErrorScrollEntry[];
  combosUnlocked: string[];
  calibration: { predicted: number; actual: number }[];
  weather: string;
}
export interface ErrorScrollEntry {
  id: string;
  enemy: string;
  atom: string;
  missedEvidence: string;
  createdAt: number;
  closed: boolean;
  mutationDepth: number;
}

export type ScreenKey = 'arena' | 'academy-path' | 'academy-lesson' | 'collection' | 'more' | 'error-journal' | 'onboarding' | 'store' | 'settings' | 'mastery-check' | 'daily-warmup' | 'tournament';
