import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react';
import { CARDS, epochOf, type Epoch, type Rank } from './data';

export type Screen =
  | 'boot' | 'onboarding' | 'academy' | 'lesson' | 'arena' | 'collection' | 'more'
  | 'journal' | 'mastery' | 'warmup' | 'tournament' | 'store' | 'settings' | 'epoch' | 'leviathan' | 'profile';

export interface JournalEntry { enemy: string; atom: string; evidence: string; date: string; mutated: boolean }

export interface GameState {
  screen: Screen; prev: Screen[];
  level: number; xp: number; xpNext: number; sig: number; budget: number; budgetMax: number;
  ranks: Record<string, Rank>;
  journal: JournalEntry[];
  onboardingDone: boolean;
  activeChapter: string;
  streak: number; calibration: number;
  weather: number;
}

type Action =
  | { type: 'go'; screen: Screen }
  | { type: 'back' }
  | { type: 'setLevel'; level: number }
  | { type: 'levelUp'; by: number }
  | { type: 'gainXp'; xp: number; sig: number }
  | { type: 'budget'; delta: number }
  | { type: 'rankUp'; card: string }
  | { type: 'journal'; entry: JournalEntry }
  | { type: 'onboarded' }
  | { type: 'chapter'; id: string }
  | { type: 'reset' }
  | { type: 'weather'; i: number }
  | { type: 'spend'; sig: number };

const initialRanks = (): Record<string, Rank> => {
  const r: Record<string, Rank> = {};
  CARDS.forEach(c => { r[c.id] = 0; });
  r.C1 = 3; r.C2 = 1;
  return r;
};

const initial = (): GameState => ({
  screen: 'boot', prev: [], level: 4, xp: 340, xpNext: 600, sig: 128, budget: 14, budgetMax: 20,
  ranks: initialRanks(), onboardingDone: false, activeChapter: 'C2', streak: 3, calibration: 0.62, weather: 0,
  journal: [
    { enemy: 'E10', atom: 'Распознать «сигнал» из чата как шум', evidence: 'Источник сигнала — платный канал', date: '2 дн.', mutated: true },
    { enemy: 'E02', atom: 'Отличить пробой с объёмом от пробоя без объёма', evidence: 'Объём 0.6× среднего', date: 'вчера', mutated: false },
  ],
});

function reducer(s: GameState, a: Action): GameState {
  switch (a.type) {
    case 'go': return { ...s, prev: [...s.prev.slice(-12), s.screen], screen: a.screen };
    case 'back': { const p = [...s.prev]; const last = p.pop() ?? 'academy'; return { ...s, prev: p, screen: last }; }
    case 'setLevel': return { ...s, level: Math.max(1, Math.min(99, a.level)) };
    case 'levelUp': return { ...s, level: Math.min(99, s.level + a.by), budget: s.budgetMax };
    case 'gainXp': {
      let xp = s.xp + a.xp, level = s.level, next = s.xpNext;
      while (xp >= next) { xp -= next; level++; next = Math.round(next * 1.18); }
      return { ...s, xp, level, xpNext: next, sig: s.sig + a.sig };
    }
    case 'budget': return { ...s, budget: Math.max(0, Math.min(s.budgetMax, s.budget + a.delta)) };
    case 'rankUp': return { ...s, ranks: { ...s.ranks, [a.card]: Math.min(3, (s.ranks[a.card] ?? 0) + 1) as Rank } };
    case 'journal': return { ...s, journal: [a.entry, ...s.journal] };
    case 'onboarded': return { ...s, onboardingDone: true };
    case 'chapter': return { ...s, activeChapter: a.id };
    case 'spend': return { ...s, sig: Math.max(0, s.sig - a.sig) };
    case 'weather': return { ...s, weather: a.i };
    case 'reset': return { ...initial(), screen: 'boot' };
  }
}

interface Ctx { s: GameState; epoch: Epoch; go: (sc: Screen) => void; back: () => void; dispatch: (a: Action) => void }
const GameCtx = createContext<Ctx | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [s, dispatch] = useReducer(reducer, undefined, initial);
  const epoch = useMemo(() => epochOf(s.level), [s.level]);
  const value = useMemo<Ctx>(() => ({
    s, epoch, dispatch,
    go: (screen) => dispatch({ type: 'go', screen }),
    back: () => dispatch({ type: 'back' }),
  }), [s, epoch]);
  return <GameCtx.Provider value={value}>{children}</GameCtx.Provider>;
}

export function useGame() {
  const c = useContext(GameCtx);
  if (!c) throw new Error('GameProvider missing');
  return c;
}
