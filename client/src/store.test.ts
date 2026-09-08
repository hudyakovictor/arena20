import { beforeEach, describe, expect, it } from 'vitest';
import { useArenaStore } from './store.js';

describe('T015 zustand store', () => {
  beforeEach(() => {
    localStorage.clear();
    useArenaStore.setState({
      route: 'home',
      arena: null,
      settings: { sound: true, reduceMotion: false, lang: 'ru' },
      progress: {
        xp: 0,
        rank: 0,
        credits: 120,
        streakDays: 1,
        completed: [],
        bestQuality: {},
        ownedItems: [],
        openTopics: [],
        skillStats: {},
      },
      booted: false,
    });
  });

  it('навигация меняет маршрут', () => {
    useArenaStore.getState().setRoute('arena');
    expect(useArenaStore.getState().route).toBe('arena');
  });

  it('старт сценария создаёт сессию в фазе menu (прототип 4.1)', () => {
    useArenaStore.getState().startScenario('mvp-001');
    const arena = useArenaStore.getState().arena;
    expect(arena?.scenarioId).toBe('mvp-001');
    expect(arena?.phase).toBe('menu');
    expect(arena?.format).toBe('free');
    expect(arena?.sessionRuleId).toBeNull();
    expect(arena?.focus).toBe('all');
    expect(useArenaStore.getState().route).toBe('arena');
  });

  it('сетап сессии фиксирует формат/правило/фокус и ведёт в брифинг', () => {
    useArenaStore.getState().startScenario('mvp-001');
    useArenaStore.getState().setSessionSetup('series', 'risk-first', 'noise');
    const arena = useArenaStore.getState().arena;
    expect(arena?.phase).toBe('brief');
    expect(arena?.format).toBe('series');
    expect(arena?.sessionRuleId).toBe('risk-first');
    expect(arena?.focus).toBe('noise');
  });

  it('выбор решения/шага/навыков пишется в сессию', () => {
    const s = useArenaStore.getState();
    s.startScenario('mvp-001');
    useArenaStore.getState().selectDecision('b');
    useArenaStore.getState().selectStep2('s0');
    useArenaStore.getState().toggleSkill('risk-first');
    useArenaStore.getState().toggleSkill('htf');
    const arena = useArenaStore.getState().arena;
    expect(arena?.decisionId).toBe('b');
    expect(arena?.step2Id).toBe('s0');
    expect(arena?.skillIds).toEqual(['risk-first', 'htf']);
    // повторный тоггл снимает
    useArenaStore.getState().toggleSkill('htf');
    expect(useArenaStore.getState().arena?.skillIds).toEqual(['risk-first']);
  });

  it('навыков не больше двух (прототип 4.3)', () => {
    useArenaStore.getState().startScenario('mvp-001');
    for (const id of ['a', 'b', 'c', 'd']) useArenaStore.getState().toggleSkill(id);
    expect(useArenaStore.getState().arena?.skillIds).toHaveLength(2);
  });

  it('выбор решения можно снять через null (прототип 4.7 «Изменить»)', () => {
    useArenaStore.getState().startScenario('mvp-001');
    useArenaStore.getState().selectDecision('b');
    expect(useArenaStore.getState().arena?.decisionId).toBe('b');
    useArenaStore.getState().selectDecision(null);
    expect(useArenaStore.getState().arena?.decisionId).toBeNull();
  });

  it('вердикт начисляет XP/ранг/кредиты и фиксирует лучшее качество', () => {
    const s = useArenaStore.getState();
    s.startScenario('mvp-001');
    s.applyVerdict('mvp-001', 80, 13);
    const p = useArenaStore.getState().progress;
    expect(p.xp).toBe(13);
    expect(p.completed).toEqual(['mvp-001']);
    expect(p.bestQuality['mvp-001']).toBe(80);
    expect(p.credits).toBe(120 + 7);
    // худший повтор не затирает лучшее
    useArenaStore.getState().applyVerdict('mvp-001', 40, 9);
    expect(useArenaStore.getState().progress.bestQuality['mvp-001']).toBe(80);
  });

  it('вердикт копит статистику применённых навыков (прототип 4.6)', () => {
    const s = useArenaStore.getState();
    s.startScenario('mvp-001');
    s.applyVerdict('mvp-001', 80, 13, ['risk-first', 'htf']);
    s.applyVerdict('mvp-001', 60, 11, ['risk-first']);
    const stats = useArenaStore.getState().progress.skillStats;
    expect(stats['risk-first']).toEqual({ used: 2, qualitySum: 140 });
    expect(stats['htf']).toEqual({ used: 1, qualitySum: 80 });
    expect(stats['flat-ok']).toBeUndefined();
  });

  it('покупка списывает кредиты и владеет предметом; без средств — отказ', () => {
    expect(useArenaStore.getState().buyItem('theme-neon', 60)).toBe(true);
    expect(useArenaStore.getState().progress.credits).toBe(60);
    expect(useArenaStore.getState().buyItem('theme-neon', 60)).toBe(false);
    expect(useArenaStore.getState().buyItem('season1', 100)).toBe(false);
  });

  it('настройки обновляются частично', () => {
    useArenaStore.getState().updateSettings({ sound: false });
    expect(useArenaStore.getState().settings.sound).toBe(false);
    expect(useArenaStore.getState().settings.lang).toBe('ru');
  });

  it('персист: состояние сохраняется в localStorage', () => {
    useArenaStore.getState().startScenario('mvp-002');
    useArenaStore.getState().updateSettings({ lang: 'en' });
    const raw = localStorage.getItem('signal-arena:v2');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw ?? '{}') as { state?: { arena?: { scenarioId?: string } } };
    expect(parsed.state?.arena?.scenarioId).toBe('mvp-002');
  });
});
