import { cn } from "../utils/cn";
import { IconAcademy, IconCards, IconStore, IconSwords, IconTrophy } from "./icons";

export type TabId = "academy" | "bestiary" | "arena" | "market" | "tournaments";

const items: { id: TabId; label: string; Icon: typeof IconAcademy }[] = [
  { id: "academy", label: "Академия", Icon: IconAcademy },
  { id: "bestiary", label: "Бестиарий", Icon: IconCards },
  { id: "arena", label: "Арена", Icon: IconSwords },
  { id: "market", label: "Маркет", Icon: IconStore },
  { id: "tournaments", label: "Турниры", Icon: IconTrophy },
];

export function BottomNav({ active, onChange, badge }: { active: TabId; onChange: (t: TabId) => void; badge?: Partial<Record<TabId, string>> }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[520px] px-2 pb-[max(8px,env(safe-area-inset-bottom))]">
      <nav className="card grid grid-cols-5 rounded-2xl border-t border-line-strong bg-ink/90 px-1 py-1.5">
        {items.map(({ id, label, Icon }) => {
          const on = id === active;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={cn("press relative flex h-[62px] flex-col items-center justify-center gap-1 rounded-xl transition-colors", on ? "text-acid" : "text-sub hover:text-text")}
              aria-current={on ? "page" : undefined}
            >
              {badge?.[id] && (
                <span className="absolute -top-2 rounded-full bg-acid px-2 py-0.5 font-display text-[10px] font-bold text-ink shadow-acid-soft">{badge[id]}</span>
              )}
              {on && <span className="absolute -top-1.5 h-1 w-8 rounded-full bg-acid shadow-acid-soft" />}
              <Icon size={28} className={cn(on && "drop-shadow-[0_0_8px_rgba(200,255,0,0.7)]")} />
              <span className="font-display text-[11px] font-semibold uppercase tracking-wide">{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
