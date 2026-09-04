import { useState } from "react";
import { Button, Card, Tag } from "../components/ui";
import { IconBack, IconLock, IconSwords } from "../components/icons";
import { enemies, type Enemy } from "../data/game";
import { cn } from "../utils/cn";

const stageLabel = ["Силуэт", "Замечен", "Раскрыт", "Трофей"];

export function Bestiary({ onGoArena }: { onGoArena: () => void }) {
  const [open, setOpen] = useState<Enemy | null>(null);
  const [filter, setFilter] = useState<"all" | "met" | "locked">("all");

  if (open) return <Dossier e={open} onBack={() => setOpen(null)} onGoArena={onGoArena} />;

  const list = enemies.filter((e) => (filter === "all" ? true : filter === "met" ? e.stage > 0 : e.stage === 0));

  return (
    <div className="fade-up space-y-4 px-3 pt-4">
      <div>
        <h1 className="stencil drip drip-right drip-dark relative inline-block text-[34px] leading-none text-text">Бестиарий</h1>
        <p className="mt-1 text-[15px] text-sub">Каталог тех, кто уже забрал твои деньги.</p>
      </div>

      <div className="flex gap-2">
        {[
          ["all", "Все"],
          ["met", "Встречены"],
          ["locked", "Силуэты"],
        ].map(([id, l]) => (
          <button
            key={id}
            onClick={() => setFilter(id as typeof filter)}
            className={cn(
              "press h-9 rounded-full border-2 px-4 font-display text-[14px] font-semibold uppercase",
              filter === id ? "border-acid text-acid shadow-acid-soft" : "border-line-strong text-sub",
            )}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {list.map((e) => {
          const hidden = e.stage === 0;
          return (
            <button
              key={e.id}
              onClick={() => setOpen(e)}
              className={cn(
                "press card relative flex flex-col overflow-hidden rounded-2xl p-0 text-left",
                e.stage === 3 && "border-gold/70 shadow-[0_0_0_1px_rgba(245,197,66,0.4),0_0_16px_rgba(245,197,66,0.15)]",
              )}
            >
              <div className="relative aspect-square w-full bg-ink">
                {e.img && !hidden ? (
                  <img src={e.img} alt={e.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-elevated to-ink">
                    <span className="stencil text-[72px] text-line-strong">?</span>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-ink to-transparent" />
                <Tag className="absolute left-2 top-2" color={e.domainColor}>
                  {e.domain}
                </Tag>
                {hidden && <IconLock size={16} className="absolute right-2 top-2 text-muted" />}
              </div>
              <div className="p-3">
                <p className="font-display text-[17px] font-bold uppercase leading-tight text-text">{hidden ? "Неизвестная угроза" : e.name}</p>
                <div className="mt-2 flex items-center gap-1">
                  {[1, 2, 3].map((s) => (
                    <span key={s} className={cn("h-1.5 flex-1 rounded-sm", s <= e.stage ? (e.stage === 3 ? "bg-gold" : "bg-acid") : "bg-line-strong")} />
                  ))}
                </div>
                <p className="mt-1 text-[11px] uppercase text-muted">{stageLabel[e.stage]}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Dossier({ e, onBack, onGoArena }: { e: Enemy; onBack: () => void; onGoArena: () => void }) {
  const hidden = e.stage === 0;
  return (
    <div className="fade-up space-y-4 px-3 pt-4">
      <button onClick={onBack} className="press flex items-center gap-1 font-display text-[14px] uppercase text-sub">
        <IconBack size={18} /> Бестиарий
      </button>

      <div className="card relative overflow-hidden rounded-2xl p-0">
        <div className="relative aspect-[4/5] w-full bg-ink">
          {e.img && !hidden ? (
            <img src={e.img} alt={e.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-elevated to-ink">
              <span className="stencil text-[120px] text-line-strong">?</span>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink via-ink/70 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <Tag color={e.domainColor}>{e.domain}</Tag>
            <h1 className="stencil mt-2 text-[34px] leading-none text-text">{hidden ? "Неизвестная угроза" : e.name}</h1>
            <p className="stencil mt-1 text-[16px] text-acid">{hidden ? "ДОСЬЕ ЗАСЕКРЕЧЕНО" : e.headline}</p>
          </div>
        </div>
      </div>

      <Card>
        <p className="text-[16px] text-text">{hidden ? "Ты ещё не встречался. Это временно." : e.truth}</p>
        <p className="mt-2 text-[14px] text-sub">{hidden ? "Досье открывается после первого поражения. Обычно твоего." : e.hit}</p>
      </Card>

      <div className="grid grid-cols-3 gap-2">
        {[
          ["Встреч", e.met],
          ["Побед", e.beaten],
          ["Стадия", `${e.stage}/3`],
        ].map(([l, v]) => (
          <div key={l as string} className="card-inset p-3 text-center">
            <p className="stencil text-[24px] text-text">{v}</p>
            <p className="text-[11px] uppercase text-muted">{l}</p>
          </div>
        ))}
      </div>

      <Card acid>
        <p className="font-display text-[12px] uppercase tracking-wider text-muted">Контр-карты</p>
        <p className="font-display text-[20px] font-bold uppercase text-acid">{e.counter}</p>
        <Button className="mt-3 w-full" onClick={onGoArena}>
          <IconSwords size={20} /> Найти в Арене
        </Button>
      </Card>
    </div>
  );
}
