import { useEffect } from 'react';
import { GameProvider, useGame, type Screen } from './game/state';
import { EPOCHS } from './game/data';
import { BootScreen, OnboardingScreen } from './screens/Intro';
import { AcademyScreen, LessonScreen } from './screens/Academy';
import { ArenaScreen } from './screens/Arena';
import { CollectionScreen } from './screens/Collection';
import { MoreScreen, ProfileScreen, JournalScreen, MasteryScreen, WarmupScreen } from './screens/Service';
import { TournamentScreen, StoreScreen, SettingsScreen, EpochScreen, LeviathanScreen } from './screens/Extra';
import { cn } from './utils/cn';

const SCREENS: { key: Screen; label: string; group: string; note: string }[] = [
  { key: 'boot', label: 'Boot', group: 'Вход', note: 'эпоховая заставка' },
  { key: 'onboarding', label: 'Onboarding', group: 'Вход', note: '3 шага' },
  { key: 'academy', label: 'Academy', group: 'Ядро', note: '17 глав · путь' },
  { key: 'lesson', label: 'Lesson', group: 'Ядро', note: 'атом → микро-проверка → карта' },
  { key: 'arena', label: 'Arena', group: 'Ядро', note: '4 блока · M1–M15 · feedback' },
  { key: 'collection', label: 'Collection', group: 'Удержание', note: 'карты · трофеи · комбо' },
  { key: 'more', label: 'More', group: 'Удержание', note: 'хаб сервисов' },
  { key: 'profile', label: 'Profile', group: 'Удержание', note: 'ось эпох' },
  { key: 'journal', label: 'Error Journal', group: 'Сервис', note: 'свиток M7' },
  { key: 'mastery', label: 'Mastery Check', group: 'Сервис', note: 'готовность к экзамену' },
  { key: 'warmup', label: 'Daily Warmup', group: 'Сервис', note: 'погода M13 + очередь' },
  { key: 'tournament', label: 'Tournament', group: 'Сервис', note: 'сезон · тень M14' },
  { key: 'store', label: 'Store', group: 'Сервис', note: 'косметика за SIG' },
  { key: 'settings', label: 'Settings', group: 'Сервис', note: 'демо-уровень · сброс' },
  { key: 'epoch', label: 'Epoch Transition', group: 'События', note: 'смена токенов и навигации' },
  { key: 'leviathan', label: 'Leviathan', group: 'События', note: 'бюджет риска = 0' },
];

function Router() {
  const { s } = useGame();
  switch (s.screen) {
    case 'boot': return <BootScreen />;
    case 'onboarding': return <OnboardingScreen />;
    case 'academy': return <AcademyScreen />;
    case 'lesson': return <LessonScreen />;
    case 'arena': return <ArenaScreen />;
    case 'collection': return <CollectionScreen />;
    case 'more': return <MoreScreen />;
    case 'profile': return <ProfileScreen />;
    case 'journal': return <JournalScreen />;
    case 'mastery': return <MasteryScreen />;
    case 'warmup': return <WarmupScreen />;
    case 'tournament': return <TournamentScreen />;
    case 'store': return <StoreScreen />;
    case 'settings': return <SettingsScreen />;
    case 'epoch': return <EpochScreen />;
    case 'leviathan': return <LeviathanScreen />;
  }
}

function Phone() {
  const { s, epoch } = useGame();
  useEffect(() => {
    const r = document.documentElement.style;
    r.setProperty('--accent', epoch.accent); r.setProperty('--epoch-bg', epoch.bg); r.setProperty('--epoch-surface', epoch.surface);
    r.setProperty('--epoch-border', epoch.border); r.setProperty('--epoch-radius', epoch.radius + 'px');
  }, [epoch]);
  return (
    <div className="relative">
      <div className="relative h-[844px] w-[390px] overflow-hidden rounded-[44px] border-[6px] border-[#1a2030] bg-bg shadow-[0_40px_120px_rgba(0,0,0,.8),inset_0_0_0_1px_#2a3346]">
        <div className="pointer-events-none absolute left-1/2 top-2 z-[500] h-6 w-28 -translate-x-1/2 rounded-full bg-[#03050a]" />
        <div key={s.screen} className={cn('h-full w-full', epoch.texture)} style={{ background: epoch.bg }}>
          <Router />
        </div>
      </div>
      <div className="mt-3 text-center mono text-[10px] text-muted">390 × 844 · {s.screen} · L{s.level} · {epoch.name}</div>
    </div>
  );
}

function Navigator() {
  const { s, go, dispatch, epoch } = useGame();
  const groups = [...new Set(SCREENS.map(x => x.group))];
  return (
    <aside className="hidden w-[300px] shrink-0 flex-col gap-4 lg:flex">
      <div>
        <div className="mono text-[10px] tracking-[0.3em] accent">SIGNAL ARENA · UI KIT v4</div>
        <h1 className="mt-1 text-2xl font-extrabold uppercase leading-none tracking-tight">Все страницы<br />игры</h1>
        <p className="mt-2 text-[12px] leading-4 text-sub">Интерактивный дизайн по ТЗ (new.txt, Части 1–6): Академия → Карта навыка → Арена → Враг. Mobile-first 390px, токены design-system.tokens.json, 4 эпохи взросления.</p>
      </div>
      <div className="rounded-xl border border-line bg-surface p-3">
        <div className="mb-2 flex items-center justify-between"><span className="label text-muted">Эпоха / уровень</span><span className="mono text-[11px] font-bold" style={{ color: epoch.accent }}>L{s.level} · {epoch.name}</span></div>
        <input type="range" min={1} max={99} value={s.level} onChange={e => dispatch({ type: 'setLevel', level: +e.target.value })} className="w-full" style={{ accentColor: epoch.accent }} />
        <div className="mt-1 grid grid-cols-4 gap-1">
          {Object.values(EPOCHS).map(e => <button key={e.id} onClick={() => dispatch({ type: 'setLevel', level: e.levels[0] + 3 })} className={cn('h-8 rounded-md border mono text-[10px] font-bold', e.id === epoch.id ? 'text-txt' : 'border-line text-muted')} style={e.id === epoch.id ? { borderColor: e.accent, color: e.accent, background: e.accent + '14' } : undefined}>{e.num}</button>)}
        </div>
        <div className="mt-2 text-[10px] text-muted">{epoch.description}</div>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto">
        {groups.map(g => (
          <div key={g}>
            <div className="label mb-1 text-muted">{g}</div>
            <div className="space-y-0.5">
              {SCREENS.filter(x => x.group === g).map(x => (
                <button key={x.key} onClick={() => go(x.key)} className={cn('flex w-full items-center justify-between rounded-lg border px-2.5 py-1.5 text-left transition', s.screen === x.key ? 'border-accent bg-hover' : 'border-transparent hover:bg-hover')}>
                  <span className={cn('text-[12px] font-semibold', s.screen === x.key ? 'accent' : 'text-txt')}>{x.label}</span>
                  <span className="text-[10px] text-muted">{x.note}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-6 gap-1">
        {[['#31D6C4', 'primary'], ['#3BDE8A', 'good'], ['#FF596D', 'bad'], ['#FFB341', 'warn'], ['#59A7FF', 'info'], ['#E7DFD0', 'paper']].map(([c, n]) => <div key={n} className="h-6 rounded-md" style={{ background: c }} title={n} />)}
        {[['#50C8FF', 'tech'], ['#FF5C70', 'risk'], ['#F4B84B', 'context'], ['#B783FF', 'crypto'], ['#FF77BD', 'human'], ['#9CA8FF', 'cognitive']].map(([c, n]) => <div key={n} className="h-3 rounded-sm" style={{ background: c }} title={n} />)}
      </div>
    </aside>
  );
}

export default function App() {
  return (
    <GameProvider>
      <div className="flex min-h-screen items-start justify-center gap-10 bg-[#03050a] px-4 py-6 lg:py-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 0%, rgba(49,214,196,0.07), transparent 40%), radial-gradient(circle at 80% 100%, rgba(183,131,255,0.06), transparent 40%)' }}>
        <Navigator />
        <Phone />
      </div>
    </GameProvider>
  );
}
