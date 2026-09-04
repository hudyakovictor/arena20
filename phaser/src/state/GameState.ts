import { balanceConfig } from '../config/balanceConfig';
import { getEpochForLevel } from '../config/epochConfig';
import type { GameProgress, EpochId } from '../types';
import { dailyWeather } from '../engine/arenaFlow';

const STORAGE_KEY = 'arena_v5_progress';
const FLAGS_KEY = 'arena_v5_flags';
/** Версия схемы прогресса: при росте — прогоняем миграции (аудит D2). */
const SCHEMA_VERSION = 5;

interface StoredProgress extends GameProgress {
  schemaVersion?: number;
  /** Сквозной номер задачи — вместе с уровнем даёт детерминированный seed. */
  taskIndex?: number;
}

/** Новый игрок начинает с первого уровня, а не с середины (аудит D2). */
function defaultProgress(): GameProgress {
  return {
    level: 1,
    xp: 0,
    xpMax: 100,
    coins: 0,
    riskBudget: balanceConfig.riskBudget.initial,
    maxBudget: balanceConfig.riskBudget.max,
    streak: 0,
    epoch: getEpochForLevel(1),
    cardRanks: { C1: 1 },
    enemyStagesReached: {},
    errorScroll: [],
    combosUnlocked: [],
    calibration: [],
    weather: 'TREND',
  };
}

/** Переносит сохранение старого формата в текущий. */
function migrate(raw: StoredProgress): StoredProgress {
  const out: StoredProgress = { ...defaultProgress(), ...raw };
  // до v5 прогресс стартовал с уровня 4 и демо-баланса — обнуляем демо-значения
  if ((raw.schemaVersion ?? 0) < 5) {
    out.taskIndex = raw.taskIndex ?? 0;
  }
  out.schemaVersion = SCHEMA_VERSION;
  out.epoch = getEpochForLevel(out.level);
  // защищаемся от повреждённых полей
  if (!Array.isArray(out.errorScroll)) out.errorScroll = [];
  if (!Array.isArray(out.calibration)) out.calibration = [];
  if (!out.cardRanks || typeof out.cardRanks !== 'object') out.cardRanks = { C1: 1 };
  if (!out.enemyStagesReached || typeof out.enemyStagesReached !== 'object') {
    out.enemyStagesReached = {};
  }
  out.xpMax = out.xpMax > 0 ? out.xpMax : 100;
  return out;
}

export class GameState {
  progress: GameProgress;
  /** Номер текущей задачи — часть детерминированного seed. */
  taskIndex: number;

  constructor() {
    let stored: StoredProgress | null = null;
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) stored = JSON.parse(raw) as StoredProgress;
    } catch {
      stored = null;
    }
    const merged = stored ? migrate(stored) : { ...defaultProgress(), schemaVersion: SCHEMA_VERSION, taskIndex: 0 };
    this.taskIndex = merged.taskIndex ?? 0;
    delete merged.taskIndex;
    delete merged.schemaVersion;
    this.progress = merged;
    this.refreshEpoch();
    this.refreshWeather();
  }

  refreshEpoch(): void {
    this.progress.epoch = getEpochForLevel(this.progress.level) as EpochId;
  }

  refreshWeather(now = new Date()): void {
    this.progress.weather = dailyWeather(now);
  }

  save(): void {
    try {
      const payload: StoredProgress = {
        ...this.progress,
        schemaVersion: SCHEMA_VERSION,
        taskIndex: this.taskIndex,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* хранилище недоступно — играем без сохранения */
    }
  }

  /** Сдвигает счётчик задач: следующая встреча получит новый seed. */
  advanceTask(): void {
    this.taskIndex += 1;
    this.save();
  }

  addXp(v: number): void {
    if (v <= 0) return;
    this.progress.xp += v;
    while (this.progress.xp >= this.progress.xpMax) {
      this.progress.xp -= this.progress.xpMax;
      this.progress.level++;
      this.progress.xpMax = Math.round(this.progress.xpMax * 1.4);
      this.refreshEpoch();
    }
    this.save();
  }

  addCoins(v: number): void {
    if (v <= 0) return;
    this.progress.coins += v;
    this.save();
  }

  changeBudget(delta: number): number {
    this.progress.riskBudget = Math.max(
      0,
      Math.min(this.progress.maxBudget, this.progress.riskBudget + delta),
    );
    this.save();
    return this.progress.riskBudget;
  }

  bumpStreak(): void {
    this.progress.streak += 1;
    this.save();
  }

  resetStreak(): void {
    this.progress.streak = 0;
    this.save();
  }

  pushError(enemy: string, atom: string, missedEvidence: string): void {
    const existingIndex = this.progress.errorScroll.findIndex(
      (e) => !e.closed && e.enemy === enemy && e.atom === atom,
    );
    if (existingIndex >= 0) {
      const [existing] = this.progress.errorScroll.splice(existingIndex, 1);
      existing.missedEvidence = missedEvidence;
      existing.mutationDepth += 1;
      existing.createdAt = Date.now();
      this.progress.errorScroll.unshift(existing);
    } else {
      this.progress.errorScroll.unshift({
        id: 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        enemy,
        atom,
        missedEvidence,
        createdAt: Date.now(),
        closed: false,
        mutationDepth: 0,
      });
    }
    if (this.progress.errorScroll.length > balanceConfig.errorScroll.maxEntries) {
      this.progress.errorScroll.pop();
    }
    this.save();
  }

  closeError(id: string): void {
    const e = this.progress.errorScroll.find((x) => x.id === id);
    if (e) e.closed = true;
    this.save();
  }

  addCalibration(predicted: number, actual: number): void {
    this.progress.calibration.push({ predicted, actual });
    if (this.progress.calibration.length > 50) this.progress.calibration.shift();
    this.save();
  }

  isCardUnlocked(cardId: string): boolean {
    if (cardId === 'Cwait') return true;
    const lvl = this.progress.level;
    const map: Record<string, number> = {
      C1: 1, C2: 4, C3: 8, C4: 12, C5: 16, C8: 21, C7: 26, C6: 31, C9: 36,
      C10: 41, C11: 46, C12: 51, C13: 56, C14: 61, C15: 66, C16: 72, C17: 78,
    };
    return lvl >= (map[cardId] ?? 99);
  }

  // ── Флаги пользовательского пути ──────────────────────────────────
  getFlag(key: string): boolean {
    try {
      const f = JSON.parse(localStorage.getItem(FLAGS_KEY) ?? '{}') as Record<string, boolean>;
      return !!f[key];
    } catch {
      return false;
    }
  }

  setFlag(key: string, val = true): void {
    try {
      const f = JSON.parse(localStorage.getItem(FLAGS_KEY) ?? '{}') as Record<string, boolean>;
      f[key] = val;
      localStorage.setItem(FLAGS_KEY, JSON.stringify(f));
    } catch {
      /* флаги не сохранятся — не критично */
    }
  }

  resetAll(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(FLAGS_KEY);
    } catch {
      /* нечего чистить */
    }
    this.progress = defaultProgress();
    this.taskIndex = 0;
    this.refreshEpoch();
    this.refreshWeather();
    this.save();
  }
}

export const gameState = new GameState();
