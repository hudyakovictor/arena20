import type { ReactNode, CSSProperties, ButtonHTMLAttributes } from 'react';
import { cn } from '../utils/cn';

// ─── Icon family (stroke 24×24) ────────────────────────────────────────────────
const PATHS: Record<string, ReactNode> = {
  academy: <><path d="M3 7l9-4 9 4-9 4-9-4z" /><path d="M6 9v6c0 1.5 3 3 6 3s6-1.5 6-3V9" /></>,
  arena: <><path d="M4 20l6-6M20 4l-6 6" /><path d="M14 4h6v6" /><path d="M4 14v6h6" /><path d="M8 8l8 8" /></>,
  collection: <><rect x="3" y="4" width="8" height="12" rx="1.5" /><rect x="13" y="8" width="8" height="12" rx="1.5" /></>,
  more: <><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></>,
  back: <path d="M15 5l-7 7 7 7" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="M5 12l5 5L20 7" />,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></>,
  alert: <><path d="M12 3l10 18H2L12 3z" /><path d="M12 10v4M12 17.5v.5" /></>,
  chevron: <path d="M9 6l6 6-6 6" />,
  coin: <><circle cx="12" cy="12" r="8" /><path d="M9.5 9.5h3.5a1.75 1.75 0 010 3.5H9.5m0 0h4a1.75 1.75 0 010 3.5H9.5M12 7v2.5M12 14.5V17" /></>,
  flame: <path d="M12 3s5 4.5 5 10a5 5 0 01-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3 1-6 1-8.5z" />,
  trophy: <><path d="M7 4h10v5a5 5 0 01-10 0V4z" /><path d="M7 6H4v2a3 3 0 003 3M17 6h3v2a3 3 0 01-3 3" /><path d="M12 14v4M8 21h8" /></>,
  scroll: <><path d="M6 4h11a2 2 0 012 2v12a2 2 0 002 2H8a2 2 0 01-2-2V4z" /><path d="M6 4a2 2 0 00-2 2v2h4" /><path d="M10 9h6M10 13h6" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" /></>,
  weather: <><path d="M7 17h10a4 4 0 000-8 6 6 0 00-11.5 1.5A3.5 3.5 0 007 17z" /></>,
  chart: <><path d="M4 20h16" /><path d="M7 16V9M7 7v2M11 16v-5M11 9v2M15 16v-8M15 6v2M19 16v-3M19 11v2" /></>,
  news: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 9h6M7 12h10M7 15h10" /></>,
  position: <><path d="M4 18L10 12l4 4 6-8" /><path d="M16 8h4v4" /></>,
  wallet: <><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18M16 14h2" /></>,
  token: <><circle cx="12" cy="12" r="8" /><path d="M12 6v12M8 9h8M8 15h8" /></>,
  chain: <><path d="M10 14a4 4 0 005.66 0l2.83-2.83a4 4 0 00-5.66-5.66L11.5 6.8" /><path d="M14 10a4 4 0 00-5.66 0L5.5 12.83a4 4 0 005.66 5.66l1.33-1.32" /></>,
  orderbook: <><path d="M4 6h10M4 10h14M4 14h8M4 18h12" /><path d="M20 6v12" /></>,
  sentiment: <><circle cx="12" cy="12" r="8" /><path d="M9 10h.01M15 10h.01M8.5 15c1 1 2 1.5 3.5 1.5s2.5-.5 3.5-1.5" /></>,
  eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  eyeOff: <><path d="M3 3l18 18M10.5 6.2A10 10 0 0112 6c6.5 0 10 6 10 6a17 17 0 01-3 3.6M6.6 6.6C3.8 8.4 2 12 2 12s3.5 6 10 6c1.4 0 2.6-.3 3.7-.7" /></>,
  wait: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>,
  bolt: <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />,
  refresh: <><path d="M20 12a8 8 0 01-14.5 4.6M4 12a8 8 0 0114.5-4.6" /><path d="M20 4v4h-4M4 20v-4h4" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0116 0" /></>,
  shield: <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" /></>,
  skull: <><path d="M12 3a8 8 0 00-8 8c0 3 1.5 5 3 6v3h10v-3c1.5-1 3-3 3-6a8 8 0 00-8-8z" /><circle cx="9" cy="11" r="1.5" /><circle cx="15" cy="11" r="1.5" /><path d="M11 16h2" /></>,
  swords: <><path d="M3 21l6-6M21 21l-6-6M3 3l9 9M21 3l-9 9" /></>,
  market: <><path d="M3 9l1.5-5h15L21 9" /><path d="M3 9a3 3 0 006 0 3 3 0 006 0 3 3 0 006 0" /><path d="M5 11v9h14v-9" /><path d="M10 20v-5h4v5" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  star: <path d="M12 3l2.7 5.8 6.3.7-4.7 4.3 1.3 6.2L12 17l-5.6 3 1.3-6.2L3 9.5l6.3-.7L12 3z" />,
  play: <path d="M7 4l12 8-12 8V4z" />,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
};

export function Icon({ name, size = 24, className, style, stroke = 1.75 }: { name: string; size?: number; className?: string; style?: CSSProperties; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" className={cn('shrink-0', className)} style={style}>
      {PATHS[name] ?? <circle cx="12" cy="12" r="6" />}
    </svg>
  );
}

// ─── Button ────────────────────────────────────────────────────────────────────
type BtnVariant = 'primary' | 'ghost' | 'danger' | 'paper' | 'outline';
export function Button({ variant = 'primary', className, children, full, size = 'md', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; full?: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const base = 'inline-flex items-center justify-center gap-2 font-bold tracking-wide uppercase select-none transition-all duration-100 active:translate-y-px disabled:opacity-40 disabled:cursor-not-allowed r-epoch-sm';
  const sz = size === 'lg' ? 'h-14 px-6 text-sm' : size === 'sm' ? 'h-9 px-3 text-[11px]' : 'h-11 px-4 text-xs';
  const v: Record<BtnVariant, string> = {
    primary: 'text-ink bg-accent shadow-[0_4px_0_rgba(0,0,0,0.45)] hover:brightness-110',
    ghost: 'text-txt bg-elevated border border-line hover:bg-hover',
    danger: 'text-txt bg-bad/15 border border-bad/50 hover:bg-bad/25',
    paper: 'paper-note text-ink',
    outline: 'text-txt border border-strong hover:border-accent',
  };
  return <button className={cn(base, sz, v[variant], full && 'w-full', className)} {...rest}>{children}</button>;
}

// ─── Panel ─────────────────────────────────────────────────────────────────────
export function Panel({ children, className, title, right, style, tone }: { children?: ReactNode; className?: string; title?: string; right?: ReactNode; style?: CSSProperties; tone?: 'default' | 'inset' }) {
  return (
    <section className={cn('r-epoch border border-line', tone === 'inset' ? 'bg-inset' : 'bg-surface', className)} style={style}>
      {(title || right) && (
        <header className="flex items-center justify-between px-3 pt-2.5 pb-1">
          {title && <span className="label text-muted">{title}</span>}
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

// ─── Chip / Tag ────────────────────────────────────────────────────────────────
export function Chip({ children, color, className, active, onClick, mono }: { children: ReactNode; color?: string; className?: string; active?: boolean; onClick?: () => void; mono?: boolean }) {
  return (
    <span onClick={onClick} style={color ? { color, borderColor: color + '66', background: color + '14' } : undefined}
      className={cn('inline-flex h-6 items-center gap-1 rounded-md border border-line bg-elevated px-2 text-[10px] font-bold uppercase tracking-wider text-sub', mono && 'mono', active && 'glow', onClick && 'cursor-pointer', className)}>
      {children}
    </span>
  );
}

// ─── Progress bar ──────────────────────────────────────────────────────────────
export function Bar({ value, max, color = 'var(--accent)', className, h = 6, segments }: { value: number; max: number; color?: string; className?: string; h?: number; segments?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  if (segments) {
    return (
      <div className={cn('flex gap-0.5', className)} style={{ height: h }}>
        {Array.from({ length: segments }).map((_, i) => (
          <div key={i} className="flex-1 rounded-sm" style={{ background: i < Math.round((value / max) * segments) ? color : '#22304A' }} />
        ))}
      </div>
    );
  }
  return (
    <div className={cn('w-full overflow-hidden rounded-full bg-line', className)} style={{ height: h }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: pct + '%', background: color }} />
    </div>
  );
}

// ─── Headline (tabloid) ────────────────────────────────────────────────────────
export function Headline({ kicker, title, sub, className, size = 'md' }: { kicker?: string; title: string; sub?: string; className?: string; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <div className={cn('space-y-1', className)}>
      {kicker && <div className="label accent">{kicker}</div>}
      <h2 className={cn('font-extrabold leading-tight tracking-tight uppercase text-txt', size === 'lg' ? 'text-[30px] leading-[34px]' : size === 'sm' ? 'text-base' : 'text-2xl')}>{title}</h2>
      {sub && <p className="text-sm leading-5 text-sub">{sub}</p>}
    </div>
  );
}

// ─── Stamp ─────────────────────────────────────────────────────────────────────
export function Stamp({ text, color = '#FF596D', className }: { text: string; color?: string; className?: string }) {
  return (
    <div className={cn('stamp pointer-events-none inline-block border-[3px] px-3 py-1 mono text-lg font-bold uppercase tracking-widest', className)} style={{ color, borderColor: color, transform: 'rotate(-8deg)', opacity: 0.9, mixBlendMode: 'screen' }}>
      {text}
    </div>
  );
}

// ─── Row list item ─────────────────────────────────────────────────────────────
export function Row({ icon, title, sub, right, onClick, locked, color }: { icon: string; title: string; sub?: string; right?: ReactNode; onClick?: () => void; locked?: boolean; color?: string }) {
  return (
    <button onClick={onClick} disabled={locked} className="flex w-full items-center gap-3 px-3 py-3 text-left transition hover:bg-hover disabled:opacity-50 min-h-[56px]">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-elevated" style={color ? { color } : undefined}><Icon name={locked ? 'lock' : icon} size={20} /></span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-semibold text-txt">{title}</span>
        {sub && <span className="block truncate text-xs text-muted">{sub}</span>}
      </span>
      {right ?? <Icon name="chevron" size={18} className="text-muted" />}
    </button>
  );
}
