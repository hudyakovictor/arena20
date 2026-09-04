import { useCallback, useState } from "react";
import { BottomNav, type TabId } from "./components/BottomNav";
import { TopBar, type Hud } from "./components/TopBar";
import { Academy } from "./screens/Academy";
import { Arena } from "./screens/Arena";
import { Bestiary } from "./screens/Bestiary";
import { Market } from "./screens/Market";
import { Tournaments } from "./screens/Tournaments";

export default function App() {
  const [tab, setTab] = useState<TabId>("arena");
  const [hud, setHud] = useState<Hud>({ xp: 12450, xpMax: 18000, sig: 2345, ammo: "9/10" });
  const [toast, setToast] = useState<string | null>(null);

  const reward = useCallback((xp: number, sig: number) => {
    setHud((h) => {
      let nxp = h.xp + xp;
      let max = h.xpMax;
      if (nxp >= max) {
        nxp -= max;
        max = Math.round(max * 1.15);
      }
      return { ...h, xp: nxp, xpMax: max, sig: h.sig + sig };
    });
    if (xp > 0) {
      setToast(`+${xp} XP${sig ? ` · +${sig} SIG` : ""}`);
      setTimeout(() => setToast(null), 1600);
    }
  }, []);

  const ammoByTab: Partial<Record<TabId, Hud["ammo"]>> = { arena: "9/10", academy: undefined, bestiary: undefined, market: undefined, tournaments: undefined };

  return (
    <div className="relative min-h-screen bg-ink text-text">
      {/* background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <img src="/img/bg-wall.jpg" alt="" className="h-full w-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/40 to-ink/90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgba(255,255,255,0.06),transparent_60%)]" />
      </div>

      <div className="relative z-10 mx-auto min-h-screen max-w-[520px] pb-28">
        <TopBar hud={{ ...hud, ammo: ammoByTab[tab] }} />

        {tab === "arena" && <Arena onSpend={reward} />}
        {tab === "academy" && <Academy onReward={reward} onGoArena={() => setTab("arena")} />}
        {tab === "bestiary" && <Bestiary onGoArena={() => setTab("arena")} />}
        {tab === "market" && <Market />}
        {tab === "tournaments" && <Tournaments />}
      </div>

      {toast && (
        <div className="fade-up pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center">
          <span className="rounded-full bg-acid px-4 py-2 font-display text-[15px] font-bold text-ink shadow-acid">{toast}</span>
        </div>
      )}

      <BottomNav active={tab} onChange={setTab} badge={{ market: "ACTIVE" }} />
    </div>
  );
}
