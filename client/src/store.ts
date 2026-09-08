// T015 · Zustand vanilla store (без React) + localStorage persist.
// Единственный источник UI-состояния: сцены читают/пишут только через селекторы/экшены.
import type { Lang } from '@signal-arena/shared';
import { createStore } from 'zustand/vanilla';
import { createJSONStorage, persist } from 'zustand/middleware';

export type RouteId =
  | 'home'
  | 'academy'
  | 'arena'
  | 'bestiary'
  | 'journal'
  | 'tournament'
  | 'market'
  | 'profile'
  | 'more';

/** Прототип 4.1–4.14: menu (выбор режима) → brief → task → reveal → verdict. */
export type ArenaPhase = 'menu' | 'brief' | 'task' | 'reveal' | 'verdict';

/** Формат тренировки (прототип 4.1). */
export type ArenaFormat = 'free' | 'series' | 'fix';

/** Фокус контента (прототип 4.1). TODO(T032): использовать в подборе сценариев. */
export type ArenaFocus = 'all' | 'structure' | 'noise' | 'risk' | 'psycho' | 'web3';

export interface ArenaSessionState {
  scenarioId: string;
  decisionId: string | null;
  step2Id: string | null;
  skillIds: string[];
  phase: ArenaPhase;
  quality: number | null;
  tabIndex: number;
  /** Выбранный формат тренировки (4.1). */
  format: ArenaFormat;
  /** Правило сессии, выбранное ДО показа данных (4.1, §9). */
  sessionRuleId: string | null;
  /** Фокус контента (4.1). */
  focus: ArenaFocus;
}

export interface SettingsState {
  sound: boolean;
  reduceMotion: boolean;
  lang: Lang;
}

/** Накопленная статистика карты навыка (прототип 4.6: ПРИМЕНЕНА / СРЕДНЕЕ КАЧЕСТВО). */
export interface SkillStat {
  used: number;
  qualitySum: number;
}

export interface ProgressState {
  xp: number;
  rank: number;
  credits: number;
  streakDays: number;
  completed: string[];
  bestQuality: Record<string, number>;
  ownedItems: string[];
  openTopics: string[];
  skillStats: Record<string, SkillStat>;
}

interface ArenaStore {
  route: RouteId;
  arena: ArenaSessionState | null;
  settings: SettingsState;
  progress: ProgressState;
  booted: boolean;
  setRoute: (route: RouteId) => void;
  setBooted: () => void;
  startScenario: (scenarioId: string) => void;
  /** null — снять выбор (кнопка «Изменить», прототип 4.7). */
  selectDecision: (decisionId: string | null) => void;
  selectStep2: (optionId: string) => void;
  toggleSkill: (skillId: string) => void;
  setArenaTab: (index: number) => void;
  setArenaPhase: (phase: ArenaPhase, quality?: number) => void;
  /** Прототип 4.1: зафиксировать сетап сессии и перейти к брифингу. */
  setSessionSetup: (format: ArenaFormat, sessionRuleId: string, focus: ArenaFocus) => void;
  resetArena: () => void;
  applyVerdict: (scenarioId: string, quality: number, xp: number, skillIds?: string[]) => void;
  buyItem: (itemId: string, price: number) => boolean;
  openTopic: (topicId: string) => void;
  updateSettings: (patch: Partial<SettingsState>) => void;
}

const DEFAULT_SETTINGS: SettingsState = { sound: true, reduceMotion: false, lang: 'ru' };
const DEFAULT_PROGRESS: ProgressState = {
  xp: 0,
  rank: 0,
  credits: 120,
  streakDays: 1,
  completed: [],
  bestQuality: {},
  ownedItems: [],
  openTopics: [],
  skillStats: {},
};

export const useArenaStore = createStore<ArenaStore>()(
  persist(
    (set, get) => ({
      route: 'home',
      arena: null,
      settings: DEFAULT_SETTINGS,
      progress: DEFAULT_PROGRESS,
      booted: false,
      setRoute: (route) => set({ route }),
      setBooted: () => set({ booted: true }),
      startScenario: (scenarioId) =>
        set({
          route: 'arena',
          arena: {
            scenarioId,
            decisionId: null,
            step2Id: null,
            skillIds: [],
            phase: 'menu',
            quality: null,
            tabIndex: 0,
            format: 'free',
            sessionRuleId: null,
            focus: 'all',
          },
        }),
      selectDecision: (decisionId) =>
        set((s) => (s.arena ? { arena: { ...s.arena, decisionId } } : {})),
      selectStep2: (step2Id) => set((s) => (s.arena ? { arena: { ...s.arena, step2Id } } : {})),
      toggleSkill: (skillId) =>
        set((s) => {
          if (!s.arena) return {};
          const has = s.arena.skillIds.includes(skillId);
          return {
            arena: {
              ...s.arena,
              // Прототип 4.3: одновременно применено не больше 2 карт.
              skillIds: has
                ? s.arena.skillIds.filter((id) => id !== skillId)
                : [...s.arena.skillIds, skillId].slice(0, 2),
            },
          };
        }),
      setArenaTab: (tabIndex) => set((s) => (s.arena ? { arena: { ...s.arena, tabIndex } } : {})),
      setArenaPhase: (phase, quality) =>
        set((s) =>
          s.arena ? { arena: { ...s.arena, phase, quality: quality ?? s.arena.quality } } : {},
        ),
      setSessionSetup: (format, sessionRuleId, focus) =>
        set((s) =>
          s.arena ? { arena: { ...s.arena, format, sessionRuleId, focus, phase: 'brief' } } : {},
        ),
      resetArena: () => set({ arena: null }),
      applyVerdict: (scenarioId, quality, xp, skillIds = []) =>
        set((s) => {
          const completed = s.progress.completed.includes(scenarioId)
            ? s.progress.completed
            : [...s.progress.completed, scenarioId];
          const prevBest = s.progress.bestQuality[scenarioId] ?? 0;
          const totalXp = s.progress.xp + xp;
          const skillStats: Record<string, SkillStat> = { ...s.progress.skillStats };
          for (const skillId of skillIds) {
            const prev = skillStats[skillId] ?? { used: 0, qualitySum: 0 };
            skillStats[skillId] = {
              used: prev.used + 1,
              qualitySum: prev.qualitySum + quality,
            };
          }
          return {
            progress: {
              ...s.progress,
              xp: totalXp,
              // STUB прогрессии ранга до T071: ранг = xp/500, cap 99.
              rank: Math.min(99, Math.floor(totalXp / 500)),
              credits: s.progress.credits + Math.round(xp / 2),
              completed,
              bestQuality: { ...s.progress.bestQuality, [scenarioId]: Math.max(prevBest, quality) },
              skillStats,
            },
          };
        }),
      buyItem: (itemId, price) => {
        const s = get();
        if (s.progress.ownedItems.includes(itemId) || s.progress.credits < price) return false;
        set({
          progress: {
            ...s.progress,
            credits: s.progress.credits - price,
            ownedItems: [...s.progress.ownedItems, itemId],
          },
        });
        return true;
      },
      openTopic: (topicId) =>
        set((s) =>
          s.progress.openTopics.includes(topicId)
            ? {}
            : { progress: { ...s.progress, openTopics: [...s.progress.openTopics, topicId] } },
        ),
      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
    }),
    {
      // v2: фаза menu + format/sessionRuleId/focus + skillStats. Старые сейвы v1
      // игнорируются осознанно (0.1.0, прод-пользователей нет) вместо хрупкой миграции.
      name: 'signal-arena:v2',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        route: s.route,
        arena: s.arena,
        settings: s.settings,
        progress: s.progress,
      }),
    },
  ),
);

// --- Селекторы (сцены используют их, а не сырое состояние) ---
export const selectRoute = (): RouteId => useArenaStore.getState().route;
export const selectArena = (): ArenaSessionState | null => useArenaStore.getState().arena;
export const selectSettings = (): SettingsState => useArenaStore.getState().settings;
export const selectProgress = (): ProgressState => useArenaStore.getState().progress;
export const selectLang = (): Lang => useArenaStore.getState().settings.lang;
