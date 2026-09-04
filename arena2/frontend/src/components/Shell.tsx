import type { ReactNode } from 'react';
import { useGame, type Screen } from '../game/state';
import { WEATHER, type NavKey } from '../game/data';
import { Icon } from './primitives';
import { cn } from '../utils/cn';

const NAV: Record<NavKey, { label: string; icon: string; screen: Screen }> = {
  academy: { label: 'Академия', icon: 'academy', screen: 'academy' },
  arena: { label: 'Арена', icon: 'arena', screen: 'arena' },
  collection: { label: 'Коллекция', icon: 'collection', screen: 'collection' },
  more: { label: 'Ещё', icon: 'more', screen: 'more' },
};
const ALL: NavKey[] = ['academy', 'arena', 'collection', 'more'];

export function TopBar({ title, back, compact }: { title?: string; back?: boolean; compact?: boolean }) {
  const { s, epoch, go, back: goBack } = useGame();
  const w = WEATHER[s.weather];
  const budgetLow = s.budget <= 5;
  return (
    <header className="sticky top-0 z-[100] border-b border-line bg-bg/90 backdrop-blur-md">
      <div className="flex h-14 items-center gap-2 px-3">
        {back ? (
          <button onClick={goBack} className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-hover"><Icon name="back" /></button>
        ) : (
          <button onClick={() => go('profile')} className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-elevated">
            <span className="mono text-[13px] font-bold accent">L{s.level}</span>
            <span className="absolute -bottom-1 left-1/2 h-1 w-8 -translate-x-1/2 overflow-hidden rounded-full bg-line"><span className="block h-full bg-accent" style={{ width: (s.xp / s.xpNext) * 100 + '%' }} /></span>
          </button>
        )}
        {title ? (
          <div className="flex-1 truncate text-sm font-bold uppercase tracking-wide">{title}</div>
        ) : (
          <div className="flex flex-1 items-center gap-1.5 overflow-hidden">
            <Stat icon="coin" value={s.sig} color="#FFB341" />
            <button onClick={() => go('leviathan')} className={cn('flex h-8 items-center gap-1.5 rounded-lg border px-2', budgetLow ? 'border-bad/60 bg-bad/10 text-bad' : 'border-line bg-elevated text-txt')} title="Бюджет риска (M15)">
              <Icon name="shield" size={14} />
              <span className="mono text-[11px] font-bold">{s.budget}<span className="text-muted">/{s.budgetMax}</span></span>
              <span className="flex gap-px">{Array.from({ length: 5 }).map((_, i) => <span key={i} className="h-3 w-1 rounded-sm" style={{ background: i < Math.round(s.budget / s.budgetMax * 5) ? (budgetLow ? '#FF596D' : 'var(--accent)') : '#22304A' }} />)}</span>
            </button>
            <button onClick={() => go('journal')} className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-elevated" title="Свиток ошибок (M7)">
              <Icon name="scroll" size={15} />
              {s.journal.length > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-bad px-1 mono text-[9px] font-bold text-txt">{s.journal.length}</span>}
            </button>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <button onClick={() => go('warmup')} className="flex h-8 items-center gap-1 rounded-lg border border-line bg-elevated px-2" title={w.name} style={{ color: w.color }}>
            <Icon name="weather" size={14} />
            <span className="mono text-[10px] font-bold">{w.id === 'fog' ? 'ТУМАН' : w.id === 'storm' ? 'ШТОРМ' : 'ШТИЛЬ'}</span>
          </button>
          <span className="mono rounded-md border px-1.5 py-0.5 text-[10px] font-bold" style={{ color: epoch.accent, borderColor: epoch.accent + '66' }}>{epoch.num}</span>
        </div>
      </div>
      {!compact && !title && (
        <div className="flex h-[18px] items-center gap-2 overflow-hidden border-t border-line/60 px-3" style={{ background: w.color + '10' }}>
          <span className="mono text-[9px] font-bold uppercase" style={{ color: w.color }}>{w.name}</span>
          <span className="truncate text-[9px] text-sub">{w.note}</span>
        </div>
      )}
    </header>
  );
}

function Stat({ icon, value, color }: { icon: string; value: number; color: string }) {
  return (
    <span className="flex h-8 items-center gap-1 rounded-lg border border-line bg-elevated px-2" style={{ color }}>
      <Icon name={icon} size={14} /><span className="mono text-[11px] font-bold text-txt">{value}</span>
    </span>
  );
}

export function BottomNav() {
  const { s, epoch, go } = useGame();
  return (
    <nav className="sticky bottom-0 z-[100] border-t border-line bg-bg/95 backdrop-blur-md">
      <div className="grid h-16 grid-cols-4">
        {ALL.map(k => {
          const n = NAV[k]; const unlocked = epoch.nav.includes(k);
          const active = s.screen === n.screen || (k === 'more' && ['journal', 'mastery', 'warmup', 'tournament', 'store', 'settings', 'profile'].includes(s.screen));
          return (
            <button key={k} onClick={() => unlocked && go(n.screen)} disabled={!unlocked}
              className={cn('relative flex flex-col items-center justify-center gap-1 transition', active ? 'accent' : unlocked ? 'text-muted hover:text-sub' : 'text-disabled')}>
              {active && <span className="absolute top-0 h-0.5 w-10 rounded-b bg-accent" />}
              <Icon name={unlocked ? n.icon : 'lock'} size={22} />
              <span className="label !text-[9px]">{unlocked ? n.label : `L${k === 'collection' ? 21 : 51}`}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function Screen({ children, title, back, nav = true, compact, className, pad = true }: { children: ReactNode; title?: string; back?: boolean; nav?: boolean; compact?: boolean; className?: string; pad?: boolean }) {
  return (
    <div className="flex h-full flex-col">
      <TopBar title={title} back={back} compact={compact} />
      <main className={cn('flex-1 overflow-y-auto no-scrollbar', pad && 'px-3 py-3 space-y-3', className)}>{children}</main>
      {nav && <BottomNav />}
    </div>
  );
}
