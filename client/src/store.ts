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

export type ArenaPhase = 'brief' | 'task' | 'reveal' | 'verdict';

export interface ArenaSessionState {
  scenarioId: string;
  decisionId: string | null;
  step2Id: string | null;
  skillIds: string[];
  phase: ArenaPhase;
  quality: number | null;
  tabIndex: number;
}

export interface SettingsState {
  sound: boolean;
  reduceMotion: boolean;
  lang: Lang;
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
  selectDecision: (decisionId: string) => void;
  selectStep2: (optionId: string) => void;
  toggleSkill: (skillId: string) => void;
  setArenaTab: (index: number) => void;
  setArenaPhase: (phase: ArenaPhase, quality?: number) => void;
  resetArena: () => void;
  applyVerdict: (scenarioId: string, quality: number, xp: number) => void;
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
            phase: 'brief',
            quality: null,
            tabIndex: 0,
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
              skillIds: has
                ? s.arena.skillIds.filter((id) => id !== skillId)
                : [...s.arena.skillIds, skillId].slice(0, 3),
            },
          };
        }),
      setArenaTab: (tabIndex) => set((s) => (s.arena ? { arena: { ...s.arena, tabIndex } } : {})),
      setArenaPhase: (phase, quality) =>
        set((s) =>
          s.arena ? { arena: { ...s.arena, phase, quality: quality ?? s.arena.quality } } : {},
        ),
      resetArena: () => set({ arena: null }),
      applyVerdict: (scenarioId, quality, xp) =>
        set((s) => {
          const completed = s.progress.completed.includes(scenarioId)
            ? s.progress.completed
            : [...s.progress.completed, scenarioId];
          const prevBest = s.progress.bestQuality[scenarioId] ?? 0;
          const totalXp = s.progress.xp + xp;
          return {
            progress: {
              ...s.progress,
              xp: totalXp,
              // STUB прогрессии ранга до T071: ранг = xp/500, cap 99.
              rank: Math.min(99, Math.floor(totalXp / 500)),
              credits: s.progress.credits + Math.round(xp / 2),
              completed,
              bestQuality: { ...s.progress.bestQuality, [scenarioId]: Math.max(prevBest, quality) },
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
      name: 'signal-arena:v1',
      version: 1,
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
