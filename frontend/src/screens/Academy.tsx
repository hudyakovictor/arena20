import { useState } from "react";
import { Button, Card, Tag } from "../components/ui";
import { IconBack, IconBook, IconCheck, IconChevron, IconLock, IconSwords } from "../components/icons";
import { chapters, type Chapter } from "../data/game";
import { cn } from "../utils/cn";

const PLAYER_LEVEL = 13;

function status(c: Chapter) {
  if (c.done === c.atoms) return "done";
  if (c.done > 0) return "current";
  if (c.level <= PLAYER_LEVEL) return "available";
  return "locked";
}

export function Academy({ onReward, onGoArena }: { onReward: (xp: number, sig: number) => void; onGoArena: () => void }) {
  const [open, setOpen] = useState<Chapter | null>(null);
  const totalAtoms = chapters.reduce((a, c) => a + c.atoms, 0);
  const doneAtoms = chapters.reduce((a, c) => a + c.done, 0);

  if (open) return <Lesson chapter={open} onBack={() => setOpen(null)} onReward={onReward} onGoArena={onGoArena} />;

  return (
    <div className="fade-up space-y-4 px-3 pt-4">
      <div>
        <h1 className="stencil drip drip-right drip-dark relative inline-block text-[34px] leading-none text-text">Академия</h1>
        <p className="mt-1 text-[15px] text-sub">Теория бесплатна. Практика — уже нет.</p>
      </div>

      <Card acid className="flex items-center gap-4">
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-acid bg-ink font-display text-[22px] font-bold text-acid shadow-acid-soft">
          L{PLAYER_LEVEL}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[16px] font-semibold uppercase text-text">Атомов освоено</p>
          <div className="mt-1.5 h-2.5 rounded-full bg-ink/70">
            <div className="h-full rounded-full bg-acid shadow-acid-soft" style={{ width: `${(doneAtoms / totalAtoms) * 100}%` }} />
          </div>
          <p className="mt-1 text-[13px] text-sub">
            <span className="text-acid">{doneAtoms}</span> / {totalAtoms} · 4 карты из 17. Система следит.
          </p>
        </div>
      </Card>

      <ol className="relative space-y-2.5">
        <span className="absolute bottom-6 left-[27px] top-6 w-0.5 bg-line" />
        {chapters.map((c) => {
          const s = status(c);
          const locked = s === "locked";
          return (
            <li key={c.n}>
              <button
                disabled={locked}
                onClick={() => setOpen(c)}
                className={cn(
                  "press relative flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all",
                  s === "current" && "acid-ring bg-elevated/90",
                  s === "done" && "border-line-strong bg-elevated/70",
                  s === "available" && "border-line-strong bg-elevated/70",
                  locked && "border-line bg-surface/50 opacity-70",
                )}
              >
                <span
                  className={cn(
                    "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 font-display text-[14px] font-bold",
                    s === "done" && "border-acid bg-acid text-ink",
                    s === "current" && "border-acid bg-ink text-acid shadow-acid-soft",
                    s === "available" && "border-line-strong bg-ink text-text",
                    locked && "border-line bg-ink text-muted",
                  )}
                >
                  {s === "done" ? <IconCheck size={14} /> : locked ? <IconLock size={14} /> : c.n}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn("font-display text-[17px] font-semibold uppercase leading-tight", locked ? "text-sub" : "text-text")}>{c.title}</p>
                  <p className="mt-0.5 truncate text-[12px] text-muted">
                    {locked ? `Откроется на L${c.level} · против: ${c.enemy}` : `Карта «${c.card}» · ${c.done}/${c.atoms} атомов`}
                  </p>
                  {!locked && (
                    <div className="mt-1.5 flex gap-0.5">
                      {Array.from({ length: c.atoms }).map((_, i) => (
                        <span key={i} className={cn("h-1.5 flex-1 rounded-sm", i < c.done ? "bg-acid" : "bg-line-strong")} />
                      ))}
                    </div>
                  )}
                </div>
                {s === "done" && <Tag color="bg-acid/15 text-acid border border-acid/40">Ранг III</Tag>}
                {s === "current" && <Tag>Сейчас</Tag>}
                {!locked && <IconChevron size={18} className="text-muted" />}
              </button>
            </li>
          );
        })}
      </ol>
      <p className="pb-2 text-center text-[12px] text-muted">L81–99 — пояс мастерства. Новой теории нет. Есть только ты и рынок.</p>
    </div>
  );
}

function Lesson({ chapter, onBack, onReward, onGoArena }: { chapter: Chapter; onBack: () => void; onReward: (xp: number, sig: number) => void; onGoArena: () => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  const correct = 1;
  const options = ["Уровень пробит — значит, тренд продолжится", "Объём на пробое ниже среднего — подтверждения нет", "Красная свеча — это всегда шорт", "Индикатор сказал «покупать»"];

  return (
    <div className="fade-up space-y-4 px-3 pt-4">
      <button onClick={onBack} className="press flex items-center gap-1 font-display text-[14px] uppercase text-sub">
        <IconBack size={18} /> Академия
      </button>
      <div>
        <Tag color="bg-elevated text-sub border border-line-strong">Глава {chapter.n} · карта «{chapter.card}»</Tag>
        <h1 className="stencil mt-2 text-[30px] leading-none text-text">{chapter.title}</h1>
        <p className="mt-2 text-[15px] text-sub">{chapter.quip}</p>
      </div>

      {/* teaser silhouette */}
      <div className="relative overflow-hidden rounded-2xl border border-line bg-ink/70 p-4">
        <div className="absolute -right-4 -top-4 h-28 w-28 rounded-full bg-acid/10 blur-2xl" />
        <p className="font-display text-[12px] uppercase tracking-wider text-muted">Против кого нужна эта карта</p>
        <div className="mt-2 flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-line-strong bg-surface font-display text-[28px] text-muted">?</div>
          <div>
            <p className="font-display text-[18px] font-bold uppercase text-text">{chapter.enemy}</p>
            <p className="text-[12px] text-sub">Силуэт. Подробности — в Арене. Если доживёшь.</p>
          </div>
        </div>
      </div>

      <Card className="space-y-3">
        <div className="flex items-center gap-2 text-acid">
          <IconBook size={18} />
          <p className="font-display text-[13px] font-bold uppercase tracking-wider">Цель урока</p>
        </div>
        <p className="text-[15px] text-text">Отличить пробой с объёмом от пробоя без объёма и не стать ликвидностью для тех, кто это уже умеет.</p>
        <div className="grid grid-cols-2 gap-2 text-[13px]">
          {[
            ["Пробой", "Цена закрылась за уровнем. Не «коснулась». Закрылась."],
            ["Объём", "Сколько денег подтвердило движение. Если мало — это шёпот, а не сигнал."],
            ["Ретест", "Возврат к уровню. Проверка: держат или отпускают."],
            ["Ловушка", "Пробой без объёма и быстрый возврат. Классика жанра."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-xl border border-line bg-ink/50 p-3">
              <p className="font-display text-[14px] font-bold uppercase text-acid">{t}</p>
              <p className="mt-1 text-sub">{d}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <p className="font-display text-[13px] font-bold uppercase tracking-wider text-acid">Микро-проверка</p>
        <p className="mt-1 text-[15px] text-text">Цена закрылась выше уровня на одной свече. Объём — 40% от среднего. Что это?</p>
        <div className="mt-3 space-y-2">
          {options.map((o, i) => {
            const on = picked === i;
            const show = picked !== null;
            return (
              <button
                key={o}
                disabled={show}
                onClick={() => {
                  setPicked(i);
                  onReward(i === correct ? 40 : 5, i === correct ? 10 : 0);
                }}
                className={cn(
                  "press flex w-full items-center gap-3 rounded-xl border-2 px-3 py-3 text-left text-[15px] transition-all",
                  !show && "border-line-strong bg-elevated/70 text-text",
                  show && i === correct && "border-good bg-good/15 text-good",
                  show && on && i !== correct && "border-bad bg-bad/15 text-bad",
                  show && !on && i !== correct && "border-line text-muted",
                )}
              >
                <span className="font-display text-[14px] font-bold">{"ABCD"[i]}</span>
                {o}
              </button>
            );
          })}
        </div>
        {picked !== null && (
          <div className="fade-up mt-4 rounded-xl border border-acid bg-ink/60 p-3 shadow-acid-soft">
            <p className="font-display text-[16px] font-bold uppercase text-acid">{picked === correct ? "Атом освоен. Карта «Объём» +1 ранг." : "Рынок принял твоё решение."}</p>
            <p className="mt-1 text-[13px] text-sub">
              {picked === correct ? "Не привыкай. Рынок уже заметил твою самоуверенность." : "Объём — это подтверждение. Без него пробой — просто слух."}
            </p>
            <Button className="mt-3 w-full" onClick={onGoArena}>
              <IconSwords size={20} /> Применить в Арене
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
