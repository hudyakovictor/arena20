import { useEffect, useMemo, useState } from 'react';
import { DOMAIN, type Card, type Enemy, type Rank } from '../game/data';
import { Icon } from './primitives';
import { cn } from '../utils/cn';

// ─── Skill card glyph metaphors (illustration tier, drawn as vector) ───────────
function Glyph({ g, color }: { g: string; color: string }) {
  const common = { fill: 'none', stroke: color, strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (g) {
    case 'candle': return <g {...common}><path d="M20 10v12M20 38v12" /><rect x="14" y="22" width="12" height="16" fill={color} opacity=".85" /><path d="M40 8v8M40 30v14" /><rect x="34" y="16" width="12" height="14" /></g>;
    case 'levels': return <g {...common}><path d="M8 20h44M8 40h44" strokeDasharray="4 4" /><path d="M10 46l10-8 8 4 10-16 8 6 6-12" /></g>;
    case 'indicator': return <g {...common}><path d="M8 40c8 0 8-24 16-24s8 20 16 20 8-14 12-14" /><path d="M8 26h44" opacity=".4" /></g>;
    case 'shield': return <g {...common}><path d="M30 8l18 6v14c0 12-8 18-18 22-10-4-18-10-18-22V14l18-6z" /><path d="M22 30l6 6 12-12" /></g>;
    case 'brain': return <g {...common}><path d="M24 14a8 8 0 00-8 10 8 8 0 002 16h6V14zM36 14a8 8 0 018 10 8 8 0 01-2 16h-6V14z" /><path d="M30 14v26" /></g>;
    case 'lock': return <g {...common}><rect x="16" y="26" width="28" height="22" rx="3" /><path d="M22 26v-6a8 8 0 0116 0v6" /><circle cx="30" cy="37" r="3" fill={color} /></g>;
    case 'token': return <g {...common}><circle cx="30" cy="30" r="18" /><circle cx="30" cy="30" r="10" strokeDasharray="3 3" /><path d="M30 20v20M20 30h20" /></g>;
    case 'news': return <g {...common}><rect x="10" y="14" width="40" height="32" rx="3" /><path d="M16 22h14M16 28h28M16 34h28M16 40h20" /><rect x="34" y="20" width="10" height="4" fill={color} /></g>;
    case 'chain': return <g {...common}><path d="M26 34a7 7 0 009.9 0l6-6a7 7 0 00-9.9-9.9l-2 2" /><path d="M34 26a7 7 0 00-9.9 0l-6 6a7 7 0 009.9 9.9l2-2" /></g>;
    case 'derivative': return <g {...common}><path d="M10 44L26 20l8 10 16-20" /><path d="M42 10h8v8" /><path d="M10 50h40" opacity=".4" /></g>;
    case 'megaphone': return <g {...common}><path d="M12 26v8h6l16 10V16L18 26h-6z" /><path d="M40 24a8 8 0 010 12" /><path d="M44 18a14 14 0 010 24" opacity=".5" /></g>;
    case 'checklist': return <g {...common}><rect x="12" y="10" width="36" height="40" rx="3" /><path d="M18 22l3 3 6-6M18 34l3 3 6-6M32 21h10M32 33h10" /></g>;
    case 'execution': return <g {...common}><path d="M10 40h40" opacity=".4" /><path d="M12 36l10-10 8 6 10-14 10 6" /><circle cx="22" cy="26" r="2.5" fill={color} /><circle cx="40" cy="18" r="2.5" fill={color} /></g>;
    case 'math': return <g {...common}><path d="M12 16h14l-8 28h14" /><path d="M36 22h14M36 34h14M43 15v14" /></g>;
    case 'defi': return <g {...common}><circle cx="22" cy="24" r="9" /><circle cx="38" cy="24" r="9" /><path d="M14 44h32M30 44v-8" /></g>;
    case 'cycle': return <g {...common}><path d="M44 30a14 14 0 11-4-9.9" /><path d="M46 14v8h-8" /><path d="M24 34l6-8 6 6" /></g>;
    case 'system': return <g {...common}><rect x="12" y="12" width="14" height="14" rx="2" /><rect x="34" y="12" width="14" height="14" rx="2" /><rect x="23" y="34" width="14" height="14" rx="2" /><path d="M19 26v4h22v-4M30 30v4" /></g>;
    default: return <circle cx="30" cy="30" r="14" {...common} />;
  }
}

const RANK_FRAME: Record<Rank, { label: string; frame: string; glow: string }> = {
  0: { label: '—', frame: '#344563', glow: 'none' },
  1: { label: 'I', frame: '#93A3BC', glow: 'none' },
  2: { label: 'II', frame: '#59A7FF', glow: '0 0 12px rgba(89,167,255,.35)' },
  3: { label: 'III', frame: '#FFB341', glow: '0 0 16px rgba(255,179,65,.45)' },
};

export function SkillCard({ card, rank, compact, selected, locked, onClick, wait, className }: { card?: Card; rank: Rank; compact?: boolean; selected?: boolean; locked?: boolean; onClick?: () => void; wait?: boolean; className?: string }) {
  const color = wait ? '#93A3BC' : DOMAIN[card!.domain].color;
  const rf = RANK_FRAME[rank];
  const w = compact ? 76 : 132;
  const h = compact ? 108 : 192;
  return (
    <button onClick={onClick} disabled={locked && !onClick}
      className={cn('relative shrink-0 overflow-hidden text-left transition-all duration-150', selected && '-translate-y-1', className)}
      style={{ width: w, height: h, borderRadius: compact ? 10 : 14, background: 'linear-gradient(180deg,#111B2E,#0C1323)', border: `2px solid ${selected ? color : rf.frame}`, boxShadow: selected ? `0 0 0 1px ${color}, 0 0 20px ${color}66` : rf.glow, opacity: locked ? 0.45 : 1 }}>
      {rank === 3 && !wait && <div className="pointer-events-none absolute inset-0 opacity-30" style={{ background: 'linear-gradient(135deg,transparent 40%,rgba(255,179,65,.5) 50%,transparent 60%)' }} />}
      <div className="absolute inset-x-0 top-0 h-1" style={{ background: color }} />
      <div className="absolute left-1.5 top-1.5 mono text-[9px] font-bold" style={{ color }}>{wait ? 'M10' : card!.id}</div>
      <div className="absolute right-1.5 top-1.5 mono text-[9px] font-bold text-sub">{rf.label}</div>
      <div className="flex h-full flex-col items-center justify-center gap-1 px-1.5 pt-3">
        <svg width={compact ? 40 : 60} height={compact ? 40 : 60} viewBox="0 0 60 60">
          {wait ? <g fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round"><circle cx="30" cy="30" r="18" /><path d="M30 18v12l8 5" /></g> : <Glyph g={card!.glyph} color={color} />}
        </svg>
        <div className={cn('text-center font-bold uppercase leading-tight text-txt', compact ? 'text-[9px]' : 'text-[11px]')}>{wait ? 'ЖДАТЬ' : card!.short}</div>
        {!compact && <div className="text-center text-[9px] leading-tight text-muted">{wait ? 'Холодная голова' : DOMAIN[card!.domain].name}</div>}
      </div>
      {locked && <div className="absolute inset-0 flex items-center justify-center bg-bg/60"><Icon name="lock" size={compact ? 16 : 22} className="text-sub" /></div>}
      {!compact && rank > 0 && (
        <div className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 gap-0.5">
          {[1, 2, 3].map(i => <span key={i} className="h-1 w-3 rounded-sm" style={{ background: i <= rank ? rf.frame : '#22304A' }} />)}
        </div>
      )}
    </button>
  );
}

// ─── Enemy render: master pose, stages as overlays, silhouette before decision ─
export function EnemyArt({ enemy, size = 120, silhouette, stage = 1, className, rim = true }: { enemy: Enemy; size?: number; silhouette?: boolean; stage?: number; className?: string; rim?: boolean }) {
  const c = DOMAIN[enemy.domain].color;
  const c2 = enemy.second ? DOMAIN[enemy.second].color : c;
  const seed = enemy.id.charCodeAt(2) * 7 + enemy.id.charCodeAt(1);
  const horns = seed % 3;
  const eyes = 1 + (seed % 2);
  const body = silhouette ? '#0B1220' : '#131C2E';
  const outline = silhouette ? c + '33' : c;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className={className}>
      <defs>
        <radialGradient id={`v${enemy.id}`} cx="50%" cy="45%" r="60%"><stop offset="0%" stopColor={silhouette ? '#0d1626' : c + '33'} /><stop offset="100%" stopColor="#05070D" /></radialGradient>
        <linearGradient id={`r${enemy.id}`} x1="0" x2="1"><stop offset="0" stopColor={c2} stopOpacity=".0" /><stop offset="1" stopColor={c2} stopOpacity={stage >= 3 ? '.9' : '0'} /></linearGradient>
      </defs>
      <rect width="120" height="120" rx="14" fill={`url(#v${enemy.id})`} />
      {/* finance underlay 30% */}
      <g opacity={silhouette ? 0.08 : 0.16} stroke={c} strokeWidth="1.2">
        <path d="M10 92l14-10 12 6 16-20 14 8 12-16 22 12" fill="none" />
        {[18, 34, 50, 66, 82, 98].map((x, i) => <rect key={x} x={x} y={100 - (i * 7 % 22)} width="6" height={8 + (i * 7 % 22)} fill={c} opacity=".5" stroke="none" />)}
      </g>
      {/* flat-3D plinth */}
      <ellipse cx="60" cy="104" rx="34" ry="7" fill={silhouette ? '#0A1120' : c + '22'} />
      {/* body */}
      <g stroke={outline} strokeWidth={silhouette ? 1 : 2}>
        <path d="M32 100c-4-30 6-52 28-52s32 22 28 52z" fill={body} />
        <circle cx="60" cy="42" r="22" fill={body} />
        {horns >= 1 && <path d="M42 28l-8-16 14 8M78 28l8-16-14 8" fill={body} />}
        {horns === 2 && <path d="M60 22v-12" />}
        {/* signature items */}
        <path d="M20 70l12 18M100 70l-12 18" strokeWidth={silhouette ? 1 : 3} />
      </g>
      {/* stage 2: extra item; stage 3: second domain rim; stage 4: cracks */}
      {stage >= 2 && !silhouette && <rect x="80" y="60" width="22" height="14" rx="2" fill={c} opacity=".8" transform="rotate(-12 91 67)" />}
      {stage >= 3 && !silhouette && <path d="M32 100c-4-30 6-52 28-52s32 22 28 52z" fill={`url(#r${enemy.id})`} opacity=".7" />}
      {stage >= 4 && !silhouette && <g stroke="#FF596D" strokeWidth="1" opacity=".8"><path d="M8 110l14-10 6 6 10-14M112 110l-14-10-6 6-10-14" fill="none" /></g>}
      {/* eyes */}
      {!silhouette && (eyes === 1
        ? <ellipse cx="60" cy="42" rx="8" ry="4" fill={c} className="pulse-soft" />
        : <><circle cx="52" cy="42" r="3.5" fill={c} className="pulse-soft" /><circle cx="68" cy="42" r="3.5" fill={c} className="pulse-soft" /></>)}
      {silhouette && rim && <circle cx="60" cy="42" r="22" fill="none" stroke={c} strokeOpacity=".08" strokeWidth="3" />}
      {silhouette && <text x="60" y="52" textAnchor="middle" fontFamily="IBM Plex Mono" fontWeight="700" fontSize="30" fill={c} opacity=".55">?</text>}
      {/* danger rank badge */}
      <g>
        <circle cx="104" cy="16" r="10" fill="#070B14" stroke={silhouette ? '#344563' : c} />
        <text x="104" y="20" textAnchor="middle" fontFamily="IBM Plex Mono" fontWeight="700" fontSize="10" fill={silhouette ? '#93A3BC' : c}>{['I', 'II', 'III', 'IV'][Math.max(0, stage - 1)]}</text>
      </g>
    </svg>
  );
}

// ─── Candle chart with play-forward (M6) ───────────────────────────────────────
export function CandleChart({ candles, forward = [], playing, level, highlight, onDone, height = 150, evidenceHighlights }: { candles: number[][]; forward?: number[][]; playing?: boolean; level?: number; highlight?: boolean; onDone?: () => void; height?: number; evidenceHighlights?: boolean }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (!playing) { setShown(0); return; }
    if (shown >= forward.length) { onDone?.(); return; }
    const t = setTimeout(() => setShown(s => s + 1), 380);
    return () => clearTimeout(t);
  }, [playing, shown, forward.length, onDone]);

  const all = useMemo(() => [...candles, ...forward.slice(0, shown)], [candles, forward, shown]);
  const total = candles.length + forward.length;
  const allPrices = [...candles, ...forward].flatMap(c => [c[1], c[2]]);
  const min = Math.min(...allPrices), max = Math.max(...allPrices);
  const W = 340, H = height, pad = 8;
  const y = (p: number) => pad + (1 - (p - min) / (max - min)) * (H - pad * 2);
  const cw = (W - 40) / total;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
      {[0, .25, .5, .75, 1].map(f => <line key={f} x1="0" x2={W - 40} y1={pad + f * (H - pad * 2)} y2={pad + f * (H - pad * 2)} stroke="#22304A" strokeDasharray="2 4" />)}
      {[0, .5, 1].map(f => <text key={f} x={W - 36} y={pad + f * (H - pad * 2) + 3} fontSize="8" fontFamily="IBM Plex Mono" fill="#62708A">{Math.round(max - f * (max - min))}</text>)}
      {level && <>
        <line x1="0" x2={W - 40} y1={y(level)} y2={y(level)} stroke={highlight ? '#FFB341' : '#93A3BC'} strokeWidth={highlight ? 1.5 : 1} />
        <rect x={W - 40} y={y(level) - 6} width="36" height="12" fill={highlight ? '#FFB341' : '#344563'} rx="2" />
        <text x={W - 22} y={y(level) + 3} fontSize="8" textAnchor="middle" fontFamily="IBM Plex Mono" fontWeight="700" fill="#070B14">{level}</text>
      </>}
      {all.map((c, i) => {
        const [o, h, l, cl] = c; const up = cl >= o; const col = up ? '#3BDE8A' : '#FF596D';
        const x = i * cw + cw / 2; const isFwd = i >= candles.length;
        const vol = 4 + ((i * 37) % 11); const isBreak = i === candles.length - 1;
        return (
          <g key={i} className={isFwd ? 'rise' : undefined}>
            <rect x={x - cw * 0.3} y={H - vol - 2} width={cw * 0.6} height={isBreak ? 3 : vol} fill={isBreak && evidenceHighlights ? '#FFB341' : col} opacity={isBreak ? 0.9 : 0.25} />
            <line x1={x} x2={x} y1={y(h)} y2={y(l)} stroke={col} strokeWidth="1" />
            <rect x={x - cw * 0.3} y={y(Math.max(o, cl))} width={cw * 0.6} height={Math.max(1.5, Math.abs(y(o) - y(cl)))} fill={col} />
            {isBreak && evidenceHighlights && <circle cx={x} cy={y(h) - 6} r="3" fill="#FFB341" className="pulse-soft" />}
          </g>
        );
      })}
      {playing && shown < forward.length && <rect x={0} y={0} width={W - 40} height={H} fill="url(#none)" />}
    </svg>
  );
}
