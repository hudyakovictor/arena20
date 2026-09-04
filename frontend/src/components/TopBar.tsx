import { IconBell, IconGear, IconSkull, IconTarget } from "./icons";

export type Hud = {
  xp: number;
  xpMax: number;
  sig: number;
  ammo?: string; // e.g. "9/10" or "780"
  ammoTone?: "good" | "bad";
};

export function TopBar({ hud, onSettings }: { hud: Hud; onSettings?: () => void }) {
  const pct = Math.min(100, Math.round((hud.xp / hud.xpMax) * 100));
  return (
    <div className="sticky top-0 z-40 px-3 pt-3">
      <div className="card flex items-center gap-2 rounded-2xl px-2 py-2">
        {/* skull avatar */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line-strong bg-ink/70 text-text">
          <IconSkull size={26} />
        </div>

        {/* XP bar */}
        <div className="relative h-11 min-w-0 flex-1 overflow-hidden rounded-xl border border-line-strong bg-ink/70">
          <div className="absolute inset-y-0 left-0 bg-acid" style={{ width: `${pct}%` }} />
          <div className="absolute inset-y-0 left-0 w-1 bg-acid/60 blur-[2px]" style={{ left: `calc(${pct}% - 2px)` }} />
          <div className="relative flex h-full items-center px-3 font-display text-[16px] font-bold tracking-wide">
            <span className="text-ink mix-blend-normal" style={{ color: pct > 20 ? "#0a0b0d" : "#f2f3f5" }}>
              XP {hud.xp.toLocaleString("ru-RU")}
            </span>
            <span className="ml-1 text-sub">/ {hud.xpMax.toLocaleString("ru-RU")}</span>
          </div>
          {/* drips */}
          <span className="absolute -bottom-0.5 h-3 w-1.5 rounded-b bg-acid" style={{ left: `calc(${pct}% - 22px)` }} />
        </div>

        {/* SIG */}
        <div className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-line-strong bg-ink/70 px-2.5">
          <span className="rounded-md bg-acid px-1.5 py-0.5 font-display text-[12px] font-bold text-ink">SIG</span>
          <span className="font-display text-[16px] font-bold text-acid">{hud.sig.toLocaleString("ru-RU")}</span>
        </div>

        {/* ammo / target */}
        {hud.ammo && (
          <div className="flex h-11 shrink-0 items-center gap-1 rounded-xl border border-line-strong bg-ink/70 px-2 text-bad">
            <IconTarget size={18} />
            <span className="font-display text-[15px] font-bold">{hud.ammo}</span>
          </div>
        )}

        <button className="press hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line-strong bg-ink/70 text-text min-[420px]:flex" aria-label="Уведомления">
          <IconBell size={22} />
        </button>
        <button onClick={onSettings} className="press flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line-strong bg-ink/70 text-text" aria-label="Настройки">
          <IconGear size={22} />
        </button>
      </div>
    </div>
  );
}
