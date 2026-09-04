// Мост клиент↔API (ТЗ Часть 6 §5): auth/anonymous → content/config → tasks/next → attempts.
// Сервер — источник правды; localStorage деградирует до офлайн-очереди попыток.
// Все запросы идут относительными URL через dev-прокси Vite (/api → :8080).

import type { Confidence, SourceId } from '../types';

const API = '/api/v1';
const TOKEN_KEY = 'arena_token';
const DEVICE_KEY = 'arena_device_id';
const QUEUE_KEY = 'arena_attempt_queue';
const TIMEOUT_MS = 4000;

// ── контракты сервера (aibackend/schemas, services) ──
export interface ServerAnswer { label: string; text: string; isWait?: boolean }
export interface ServerEvidence { id: string; source: string; label: string }
export interface ServerTask {
  templateId: string; contentVersion: string; seed: number;
  enemyDomain: string; stage: number; mode: string;
  question: string; ticker: string; timeframe: string; isMirrored: boolean;
  sources: string[]; noiseSource: string | null; blindSource: string | null;
  answers: ServerAnswer[]; evidence: ServerEvidence[];
  skills: string[]; sequenceSlots: number; requiredEvidence: number; coldDelayMs: number;
  verdict: { factorA: string; factorB: string } | null;
  learningGoal: string; atoms: string[];
}
export interface NextTaskResponse {
  queueItem: { itemType: string; ref: string; reason: string; enemyId: string; stage: number } | null;
  task: ServerTask;
  player: { level: number; epoch: string; riskBudget: number; tiltStreak: number };
}
export interface AttemptPayload {
  clientAttemptId: string;
  templateId: string;
  contentVersion?: string;
  seed: number;
  answer: number | null;
  evidence: string[];
  confidence: Confidence;
  openedSources: SourceId[];
  sequence: string[];
  verdict: 'A' | 'B' | null;
  blindOpened: boolean;
  durationMs: number;
  clientTs?: number;
}
export interface AttemptResponse {
  attemptId: string;
  duplicate: boolean;
  result: 'correct' | 'correct_unfounded' | 'wrong';
  reveal: {
    correctAnswer: number; correctEvidence: string[];
    verdictCorrect: boolean | null; sequenceCorrect: boolean | null;
    enemy: { id: string; name: string; domain: string; stage: number } | null;
    identifyOptions: string[]; identifyCorrect: boolean | null;
    missedEvidence: string;
    playForward: { candles: number; direction: 'up' | 'down'; outcomePct: number; durationMs: number };
  };
  reward: { xp: number; coins: number; budgetDelta: number; enemyDefeated: boolean };
  shadow: { distribution: { variant: number; text: string; share: number }[]; crowdBias: string | null; n: number };
  progress: {
    level: number; totalXp: number; epoch: string; riskBudget: number; coins: number; streak: number;
    levelUp: boolean; epochTransition: string | null; scrollAdded: boolean; combosUnlocked: string[];
    stageWon: { enemyId: string; stage: number } | null; leviathan: boolean; hubrisDragon: boolean;
  };
  flags: string[];
}
export interface MeResponse {
  userId: string; deviceId: string; segment: string;
  level: number; epoch: string; xp: number; xpMax: number; coins: number; riskBudget: number; streak: number;
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0; return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function lsGet(key: string): string | null { try { return localStorage.getItem(key); } catch { return null; } }
function lsSet(key: string, v: string): void { try { localStorage.setItem(key, v); } catch { /* quota/private mode */ } }

class ApiClient {
  /** true после успешного auth; сбрасывается при сетевой ошибке */
  online = false;
  private token: string | null = lsGet(TOKEN_KEY);
  private authPromise: Promise<void> | null = null;

  private deviceId(): string {
    let d = lsGet(DEVICE_KEY);
    if (!d) { d = 'dev-' + uuid(); lsSet(DEVICE_KEY, d); }
    return d;
  }

  /** Запуск моста: анонимный вход + слив офлайн-очереди. Не бросает исключений. */
  async init(): Promise<void> {
    try {
      await this.ensureAuth();
      this.online = true;
      await this.flushQueue();
    } catch {
      this.online = false;
    }
  }

  private async ensureAuth(): Promise<void> {
    if (this.token) return;
    if (!this.authPromise) {
      this.authPromise = (async () => {
        const res = await this.raw('POST', '/auth/anonymous', { deviceId: this.deviceId() }, false);
        this.token = (res as { token: string }).token;
        lsSet(TOKEN_KEY, this.token);
      })().finally(() => { this.authPromise = null; });
    }
    return this.authPromise;
  }

  private async raw(method: string, path: string, body?: unknown, auth = true): Promise<unknown> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const headers: Record<string, string> = { 'content-type': 'application/json' };
      if (auth && this.token) headers.authorization = `Bearer ${this.token}`;
      const res = await fetch(API + path, {
        method, headers, signal: ctrl.signal,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      if (res.status === 401 && auth) {
        // токен протух — одна повторная попытка с новым анонимным входом
        this.token = null;
        await this.ensureAuth();
        return this.raw(method, path, body, auth);
      }
      if (!res.ok) throw new Error(`api ${res.status} ${path}`);
      this.online = true;
      return await res.json();
    } catch (e) {
      if (e instanceof TypeError || (e instanceof DOMException && e.name === 'AbortError')) this.online = false;
      throw e;
    } finally {
      clearTimeout(timer);
    }
  }

  private async request(method: string, path: string, body?: unknown): Promise<unknown> {
    await this.ensureAuth();
    return this.raw(method, path, body);
  }

  // ── публичные вызовы ──
  async nextTask(): Promise<NextTaskResponse> {
    return await this.request('GET', '/tasks/next') as NextTaskResponse;
  }

  async me(): Promise<MeResponse> {
    return await this.request('GET', '/me') as MeResponse;
  }

  async submitAttempt(p: AttemptPayload): Promise<AttemptResponse> {
    return await this.request('POST', '/attempts', { ...p, clientTs: Date.now() }) as AttemptResponse;
  }

  // ── офлайн-очередь попыток (идемпотентность — clientAttemptId, сервер дедуплицирует) ──
  queueAttempt(p: AttemptPayload): void {
    const q = this.readQueue();
    q.push(p);
    lsSet(QUEUE_KEY, JSON.stringify(q.slice(-50))); // лимит батча сервера
  }

  queuedCount(): number { return this.readQueue().length; }

  async flushQueue(): Promise<void> {
    const q = this.readQueue();
    if (!q.length) return;
    try {
      await this.request('POST', '/attempts/batch', { attempts: q });
      lsSet(QUEUE_KEY, '[]');
    } catch { /* остаёмся в очереди до следующего подключения */ }
  }

  private readQueue(): AttemptPayload[] {
    try {
      const raw = lsGet(QUEUE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  }

  newAttemptId(): string { return 'att-' + uuid(); }
}

export const api = new ApiClient();
