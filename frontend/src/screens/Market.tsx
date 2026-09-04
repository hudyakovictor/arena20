import { useState } from "react";
import { Button, Card, Chip } from "../components/ui";
import { IconCheck, IconCoin, IconCrown, IconTicket } from "../components/icons";
import { cn } from "../utils/cn";

const tabs = ["Магазин", "Пасс", "Подписка", "Паки"] as const;

const passTrack = [
  { n: 1, icon: <IconCoin size={30} className="text-gold" />, premium: false, claimed: true },
  { n: 2, icon: <IconTicket size={30} className="text-gold" />, premium: true, claimed: true },
  { n: 3, icon: <span className="block h-8 w-8 rounded-md border-2 border-gold bg-gradient-to-b from-[#6b5a2c] to-[#3d3218]" />, premium: true, claimed: false },
  { n: 4, icon: <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet font-display text-[10px] font-bold text-white">$SIG</span>, premium: false, claimed: false },
  { n: 5, icon: <IconCoin size={34} className="text-gold" />, premium: true, claimed: false },
];

export function Market() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Магазин");
  const [bought, setBought] = useState<string | null>(null);

  return (
    <div className="fade-up space-y-4 px-3 pt-4">
      <div className="text-center">
        <h1 className="stencil drip drip-right relative inline-block text-[40px] leading-none text-text">Маркет</h1>
        <p className="mt-1 text-[15px] text-sub">Департамент сбора денег</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <Chip key={t} active={tab === t} onClick={() => setTab(t)} className="shrink-0">
            {t}
          </Chip>
        ))}
      </div>

      {(tab === "Магазин" || tab === "Пасс") && (
        <Card gold className="overflow-hidden bg-gradient-to-br from-[#2a2618]/90 to-surface">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gold/20 blur-2xl" />
          <h2 className="stencil drip drip-right relative inline-block text-[24px] leading-none text-text" style={{ ["--drip-color" as string]: "#f5c542" }}>
            Сигнал-пасс · Сезон 1
          </h2>

          {/* track */}
          <div className="relative mt-5 flex items-start justify-between">
            <div className="absolute left-6 right-6 top-8 h-1 bg-line-strong">
              <div className="h-full w-[38%] bg-acid" />
            </div>
            {passTrack.map((s, i) => (
              <div key={s.n} className="relative flex w-16 flex-col items-center">
                {s.premium && <IconCrown size={18} className="absolute -top-3 text-gold" />}
                <div
                  className={cn(
                    "flex h-16 w-16 items-center justify-center rounded-xl border-2 bg-elevated",
                    s.premium ? "border-gold bg-gradient-to-b from-[#6b5a2c] to-[#2a2618]" : "border-line-strong",
                    i < 2 && "opacity-90",
                  )}
                >
                  {s.icon}
                </div>
                <span className={cn("mt-1 text-[12px]", s.premium ? "text-gold" : "text-sub")}>{s.n}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <p className="font-display text-[20px] font-bold text-text">
              <span className="text-acid">12</span> <span className="text-sub">/ 30</span>
            </p>
            <div className="flex gap-2">
              <Button variant="gold" onClick={() => setBought("pass")}>
                {bought === "pass" ? "Куплено" : "490 ₽"}
              </Button>
              <Button variant="ghost">Что внутри</Button>
            </div>
          </div>
        </Card>
      )}

      {(tab === "Магазин" || tab === "Подписка") && (
        <Card cyan className="overflow-hidden">
          <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-cyan/15 blur-2xl" />
          <h2 className="stencil relative inline-block text-[24px] leading-none text-text">PRO Сигнал</h2>
          <ul className="mt-3 space-y-2 text-[16px] text-text">
            {["Без рекламы", "×2 XP", "Ранний доступ к новым ошибкам"].map((s) => (
              <li key={s} className="flex items-center gap-2">
                <IconCheck size={18} className="text-good" /> {s}
              </li>
            ))}
          </ul>
          <button
            onClick={() => setBought("pro")}
            className="press mt-4 h-12 w-full rounded-xl bg-gradient-to-r from-acid via-[#8fe3a0] to-cyan font-display text-[17px] font-bold uppercase tracking-wide text-ink"
          >
            {bought === "pro" ? "Ты в системе. Система рада." : "30 дней · 199 ₽"}
          </button>
          <p className="mt-2 text-center text-[12px] text-muted">Навык не продаётся. Мы проверяли.</p>
        </Card>
      )}

      {(tab === "Магазин" || tab === "Паки") && (
        <div className="grid grid-cols-2 gap-3">
          <Card className="flex min-h-[230px] flex-col p-4">
            <h3 className="stencil text-[20px] leading-none text-text">Набор новичка</h3>
            <div className="relative mt-3 flex flex-1 items-center justify-center">
              <div className="flex -space-x-3">
                <IconCoin size={44} className="text-gold" />
                <IconCoin size={44} className="text-gold" />
              </div>
              <div className="ml-1 h-20 w-16 rounded-md border border-gold/40 bg-gradient-to-b from-elevated to-ink shadow-lg">
                <div className="mx-auto mt-6 h-7 w-7 rounded-full bg-gold" />
              </div>
              <span className="tape absolute bottom-0 right-0 !bg-bad !text-[16px] !px-3">-50%</span>
            </div>
            <Button size="sm" className="mt-3">
              149 ₽
            </Button>
          </Card>
          <Card className="flex min-h-[230px] flex-col p-4">
            <h3 className="stencil text-[20px] leading-none text-text">
              Пак карт <span className="text-acid">x3</span>
            </h3>
            <div className="relative mt-3 flex flex-1 items-center justify-center">
              <div className="h-28 w-20 rotate-[-4deg] overflow-hidden rounded-md border border-line-strong bg-ink shadow-lg">
                <img src="/img/enemy-goblin.jpg" alt="" className="h-full w-full object-cover opacity-90" />
              </div>
            </div>
            <Button size="sm" variant="outline" className="mt-3">
              300 SIG
            </Button>
          </Card>
        </div>
      )}

      <p className="pb-2 text-center text-[12px] text-muted">Все покупки косметические. Разочарование — бесплатно.</p>
    </div>
  );
}
