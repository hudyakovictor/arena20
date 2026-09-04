import { candles } from "../data/game";

export function CandleChart({ highlightLast = true }: { highlightLast?: boolean }) {
  const W = 340;
  const H = 200;
  const pad = 10;
  const min = Math.min(...candles.map((c) => c[2]));
  const max = Math.max(...candles.map((c) => c[1]));
  const y = (v: number) => pad + (H - pad * 2) * (1 - (v - min) / (max - min));
  const step = (W - pad * 2) / candles.length;
  const bw = step * 0.55;

  const lastX = pad + (candles.length - 1.5) * step + step / 2;
  const lastY = y((candles[candles.length - 2][1] + candles[candles.length - 2][2]) / 2);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full">
      <defs>
        <pattern id="grid" width="34" height="40" patternUnits="userSpaceOnUse">
          <path d="M34 0H0V40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        </pattern>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width={W} height={H} fill="url(#grid)" />
      {/* trendline */}
      <line x1={pad} y1={y(34)} x2={W - pad} y2={y(56)} stroke="#45e0d0" strokeWidth="2" strokeDasharray="6 5" opacity=".8" />
      {candles.map((c, i) => {
        const [o, h, l, cl] = c;
        const up = cl >= o;
        const x = pad + i * step + step / 2;
        const color = up ? "#c8ff00" : "#ff4d5e";
        return (
          <g key={i} filter="url(#glow)">
            <line x1={x} x2={x} y1={y(h)} y2={y(l)} stroke={color} strokeWidth="1.5" />
            <rect x={x - bw / 2} y={y(Math.max(o, cl))} width={bw} height={Math.max(2, Math.abs(y(o) - y(cl)))} fill={color} rx="1" />
          </g>
        );
      })}
      {highlightLast && (
        <g>
          <circle cx={lastX} cy={lastY} r="26" fill="none" stroke="#c8ff00" strokeWidth="4" strokeDasharray="120 40" opacity=".95" filter="url(#glow)" />
          <rect x={lastX - 2} y={lastY + 26} width="4" height="16" rx="2" fill="#c8ff00" />
        </g>
      )}
    </svg>
  );
}
