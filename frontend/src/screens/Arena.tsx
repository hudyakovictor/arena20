import { useState } from "react";
import { CandleChart } from "../components/CandleChart";
import {
  IconCalendar,
  IconCandles,
  IconChat,
  IconChecklist,
  IconGhost,
  IconHourglass,
  IconLock,
  IconNews,
  IconPause,
  IconPlus,
  IconShield,
  IconSkull,
  IconStar,
  IconTimerLock,
  IconTrend,
  IconTrendDown,
  IconVolume,
  IconWarning,
  IconWhale,
  IconCheck,
} from "../components/icons";
import { Button, Card } from "../components/ui";
import { news } from "../data/game";
import { cn } from "../utils/cn";

type Step = "encounter" | "feedback" | "move" | "result";
type SourceTab = "chart" | "news" | "check" | "whale" | "cal" | "chat";

const sourceTabs: { id: SourceTab; Icon: typeof IconCandles; locked?: boolean }[] = [
  { id: "chart", Icon: IconCandles },
  { id: "news", Icon: IconNews },
  { id: "check", Icon: IconChecklist },
  { id: "whale", Icon: IconWhale, locked: true },
  { id: "cal", Icon: IconCalendar, locked: true },
  { id: "chat", Icon: IconChat, locked: true },
];

const skillCards = [
  { id: "trend", label: "Тренд", Icon: IconTrend, color: "text-acid" },
  { id: "volume", label: "Объём", Icon: IconVolume, color: "text-cyan", key: true },
  { id: "risk", label: "Риск", Icon: IconShield, color: "text-cyan" },
  { id: "wait", label: "Ждать", Icon: IconTimerLock, color: "text-sub", locked: true },
];

const answers = [
  { id: "A", label: "Войти на пробое", Icon: IconWarning, tone: "text-bad", why: "Пробой без объёма — это когда дверь открыли, но никто не зашёл. Кроме тебя." },
  { id: "B", label: "Ждать ретест", Icon: IconHourglass, tone: "text-ink", correct: true, why: "Ретест покажет, держат ли уровень покупатели. Терпение — тоже позиция." },
  { id: "C", label: "Старшие таймфреймы", Icon: IconCandles, tone: "text-cyan", why: "Полезно, но не отвечает на вопрос: объёма нет здесь и сейчас." },
  { id: "D", label: "Усреднить с плечом", Icon: IconSkull, tone: "text-pink", why: "Так делают герои. И банкроты. Обычно это один и тот же человек." },
];

export function Arena({ onSpend }: { onSpend: (xp: number, sig: number) => void }) {
  const [step, setStep] = useState<Step>("encounter");
  const [tab, setTab] = useState<SourceTab>("chart");
  const [card, setCard] = useState("volume");
  const [answer, setAnswer] = useState<string | null>(null);
  const [pulse, setPulse] = useState<string | null>(null);

  // move form
  const [dir, setDir] = useState<"long" | "short" | "flat">("long");
  const [risk, setRisk] = useState(2);
  const [stop, setStop] = useState<"level" | "market" | "none">("level");

  const chosen = answers.find((a) => a.id === answer);

  const tapLocked = (id: string) => {
    setPulse(id);
    setTimeout(() => setPulse(null), 300);
  };

  const submit = (id: string) => {
    setAnswer(id);
    setStep("feedback");
    const ok = answers.find((a) => a.id === id)?.correct;
    onSpend(ok ? 120 : 15, ok ? 40 : 0);
  };

  const reset = () => {
    setStep("encounter");
    setAnswer(null);
    setTab("chart");
  };

  if (step === "move" || step === "result") {
    return (
      <MoveForm
        dir={dir}
        setDir={setDir}
        risk={risk}
        setRisk={setRisk}
        stop={stop}
        setStop={setStop}
        result={step === "result"}
        onOpen={() => {
          setStep("result");
          onSpend(60, 20);
        }}
        onBack={reset}
      />
    );
  }

  return (
    <div className="fade-up space-y-4 px-3 pt-4">
      {/* headline */}
      <div className="text-center">
        <h1 className="stencil drip drip-right relative inline-block text-[32px] leading-none text-acid acid-glow-text">
          {step === "feedback" ? (chosen?.correct ? "Терпение зачтено." : "Рынок принял решение.") : "Пробой есть. Объёма нет."}
        </h1>
        <p className="mt-2 text-[15px] text-sub">
          {step === "feedback" ? chosen?.why : "Рынок уже поблагодарил тебя за ликвидность."}
        </p>
      </div>

      {/* Browser shell */}
      <div className="card overflow-hidden rounded-2xl p-0">
        <div className="flex items-center gap-2 border-b border-line bg-ink/60 px-3 pt-2">
          <div className="mr-1 flex gap-1.5 pb-2">
            <span className="h-3 w-3 rounded-full bg-bad" />
            <span className="h-3 w-3 rounded-full bg-warn" />
            <span className="h-3 w-3 rounded-full bg-good" />
          </div>
          <div className="flex flex-1 items-end gap-1 overflow-x-auto">
            {sourceTabs.map(({ id, Icon, locked }) => {
              const on = tab === id;
              return (
                <button
                  key={id}
                  onClick={() => (locked ? tapLocked(id) : setTab(id))}
                  className={cn(
                    "press relative flex h-11 w-12 shrink-0 items-center justify-center rounded-t-xl border border-b-0 transition-all",
                    on ? "acid-ring bg-elevated text-acid" : "border-line bg-surface/80 text-sub",
                    locked && "opacity-50",
                    pulse === id && "scale-95 border-bad text-bad",
                  )}
                  aria-label={id}
                >
                  <Icon size={22} />
                  {locked && <IconLock size={10} className="absolute right-1 top-1 text-muted" />}
                </button>
              );
            })}
            <button className="flex h-11 w-12 shrink-0 items-center justify-center rounded-t-xl border border-b-0 border-line bg-surface/80 text-sub">
              <IconPlus size={20} />
            </button>
          </div>
        </div>

        {/* viewport */}
        <div className="relative bg-ink/70 p-3">
          {tab === "chart" && (
            <div className="relative rounded-xl border border-line bg-[#0e1013] p-2">
              <p className="absolute left-3 top-2 font-display text-[15px] font-semibold text-text">BTC/USDT · 15M</p>
              <CandleChart />
              <span className="tape absolute bottom-3 right-3">Не финрекомендация</span>
            </div>
          )}
          {tab === "news" && (
            <div>
              <div className="mb-3 grid grid-cols-2 border-b border-line text-center font-display text-[15px] uppercase">
                <span className="border-b-2 border-acid pb-2 text-acid">News</span>
                <span className="pb-2 text-sub">Feed</span>
              </div>
              <ul className="space-y-2">
                {news.map((n) => (
                  <li key={n.title} className={cn("relative flex gap-3 rounded-xl border p-3", n.key ? "border-acid shadow-acid-soft" : "border-line bg-surface/70")}>
                    {n.key && (
                      <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-acid text-ink">
                        <IconCheck size={12} />
                      </span>
                    )}
                    <span className="text-[32px] leading-none">{n.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-display text-[16px] font-bold uppercase leading-tight text-text">{n.title}</p>
                        <span className="shrink-0 text-[12px] text-muted">{n.time}</span>
                      </div>
                      <p className="mt-1 text-[13px] leading-snug text-sub">{n.text}</p>
                      <span className={cn("mt-1.5 inline-block rounded px-2 py-0.5 font-display text-[10px] font-bold uppercase", n.tagColor)}>{n.tag}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {tab === "check" && (
            <ul className="space-y-2">
              {[
                ["Тренд на старшем ТФ", true],
                ["Уровень пробит", true],
                ["Объём на пробое", false],
                ["Ретест состоялся", false],
              ].map(([t, ok]) => (
                <li key={t as string} className="flex items-center justify-between rounded-xl border border-line bg-surface/70 px-3 py-2.5 text-[15px]">
                  <span className="text-text">{t as string}</span>
                  <span className={cn("font-display text-[13px] font-bold uppercase", ok ? "text-good" : "text-bad")}>{ok ? "есть" : "нет"}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Skill cards */}
      <div className="grid grid-cols-4 gap-2">
        {skillCards.map(({ id, label, Icon, color, locked, key }) => {
          const on = card === id;
          return (
            <button
              key={id}
              disabled={locked}
              onClick={() => setCard(id)}
              className={cn(
                "press relative flex h-[118px] flex-col items-center justify-between rounded-2xl border-2 bg-elevated/80 px-1 py-3 transition-all",
                on ? "acid-ring drip" : "border-line-strong",
                locked && "opacity-50",
              )}
            >
              {key && <IconStar size={14} className="absolute right-1.5 top-1.5 text-acid" />}
              <Icon size={44} className={cn(color, on && "drop-shadow-[0_0_10px_rgba(200,255,0,0.5)]")} />
              <span className="font-display text-[14px] font-bold uppercase text-text">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Answers */}
      <div className="grid grid-cols-2 gap-2.5">
        {answers.map(({ id, label, Icon, tone, correct }) => {
          const picked = answer === id;
          const revealed = step === "feedback";
          return (
            <button
              key={id}
              disabled={revealed}
              onClick={() => submit(id)}
              className={cn(
                "press relative flex min-h-[64px] items-center gap-2.5 rounded-xl border-2 px-3 py-2 text-left font-display text-[16px] font-semibold leading-tight transition-all",
                !revealed && correct && "bg-acid text-ink border-acid drip",
                !revealed && !correct && "border-line-strong bg-elevated/80 text-text",
                revealed && correct && "border-good bg-good/15 text-good",
                revealed && picked && !correct && "border-bad bg-bad/15 text-bad",
                revealed && !picked && !correct && "border-line bg-elevated/40 text-muted",
              )}
            >
              <Icon size={26} className={cn(!revealed && correct ? "text-ink" : tone)} />
              <span>{label}</span>
              <span className="absolute right-2 top-1 text-[10px] opacity-60">{id}</span>
            </button>
          );
        })}
      </div>

      {step === "feedback" && (
        <Card acid className="fade-up">
          <p className="font-display text-[13px] font-bold uppercase tracking-wider text-acid">Обратная связь</p>
          <p className="mt-1 text-[15px] text-text">
            <span className="text-sub">Сигнал:</span> уровень пробит на одной свече, объём ниже среднего.
          </p>
          <p className="mt-1 text-[15px] text-text">
            <span className="text-sub">Последствие:</span> {chosen?.correct ? "ретест подтвердил слабость. Ты сохранил депозит и +120 XP." : "цена вернулась в диапазон. Стоп сработал. Рынок благодарит за ликвидность."}
          </p>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-line-strong">
              <img src="/img/enemy-ghost.jpg" alt="" className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="font-display text-[13px] uppercase text-muted">Враг раскрыт</p>
              <p className="font-display text-[18px] font-bold uppercase text-text">Ложный Пробой</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="ghost" onClick={reset}>
              Ещё раз
            </Button>
            <Button onClick={() => setStep("move")}>Твоё движение</Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function MoveForm({
  dir,
  setDir,
  risk,
  setRisk,
  stop,
  setStop,
  result,
  onOpen,
  onBack,
}: {
  dir: "long" | "short" | "flat";
  setDir: (d: "long" | "short" | "flat") => void;
  risk: number;
  setRisk: (r: number) => void;
  stop: "level" | "market" | "none";
  setStop: (s: "level" | "market" | "none") => void;
  result: boolean;
  onOpen: () => void;
  onBack: () => void;
}) {
  const marks = [1, 2, 5, 25];
  const pct = ((risk - 1) / 24) * 100;
  const confidence = (dir === "flat" ? 3 : dir === "long" ? 2 : 1) + (stop === "none" ? -1 : 0);

  return (
    <div className="fade-up space-y-4 px-3 pt-4">
      <div className="text-center">
        <h1 className="stencil drip drip-right relative inline-block text-[36px] leading-none text-acid acid-glow-text">
          {result ? (risk >= 20 || stop === "none" ? "Легенда родилась." : "Охота открыта.") : "Твоё движение"}
        </h1>
        <p className="mt-2 text-[15px] text-sub">
          {result
            ? risk >= 20 || stop === "none"
              ? "Рынок пересмотрел твои жизненные планы. +60 XP за храбрость."
              : "Стоп стоит, риск считан. Дальше — вопрос времени."
            : "Помни: не войти — тоже решение. Обычно лучшее."}
        </p>
      </div>

      <div className="card overflow-hidden rounded-2xl p-0">
        <div className="relative h-24 border-b border-line bg-[#0e1013]">
          <div className="absolute left-3 top-2 flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-bad" />
            <span className="h-3 w-3 rounded-full bg-warn" />
            <span className="h-3 w-3 rounded-full bg-good" />
          </div>
          <p className="absolute left-3 top-8 font-display text-[15px] font-semibold text-text">BTC/USDT · 15M</p>
          <div className="absolute inset-y-0 right-0 w-1/2 opacity-70">
            <CandleChart highlightLast={false} />
          </div>
          <span className="tape absolute bottom-2 right-3">Не финрекомендация</span>
        </div>

        <div className="space-y-4 p-4">
          <div>
            <p className="font-display text-[16px] font-semibold uppercase text-sub">Направление</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[
                { id: "long", label: "Лонг", sub: "поехали", Icon: IconTrend, c: "text-acid" },
                { id: "short", label: "Шорт", sub: "едем вниз", Icon: IconTrendDown, c: "text-bad" },
                { id: "flat", label: "Вне рынка", sub: "и так бывает", Icon: IconPause, c: "text-sub" },
              ].map(({ id, label, sub, Icon, c }) => {
                const on = dir === id;
                return (
                  <button
                    key={id}
                    onClick={() => setDir(id as typeof dir)}
                    className={cn(
                      "press flex h-[150px] flex-col items-center justify-center gap-2 rounded-2xl border-2 bg-ink/50 transition-all",
                      on ? "acid-ring drip" : "border-line-strong",
                    )}
                  >
                    <Icon size={48} className={cn(c, on && "drop-shadow-[0_0_10px_rgba(200,255,0,0.5)]")} />
                    <span className={cn("stencil text-[19px] leading-none", on ? "text-acid" : "text-text")}>{label}</span>
                    <span className={cn("text-[12px]", on ? "text-acid" : "text-muted")}>{sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <p className="font-display text-[16px] font-semibold uppercase text-sub">Риск на сделку</p>
              <p className={cn("stencil text-[22px]", risk >= 10 ? "text-bad" : "text-acid")}>{risk}% депозита</p>
            </div>
            <div className="relative mt-3">
              <input
                type="range"
                min={1}
                max={25}
                value={risk}
                onChange={(e) => setRisk(Number(e.target.value))}
                className="range-acid"
                style={{ ["--pct" as string]: `${pct}%` }}
              />
              <IconSkull size={18} className="pointer-events-none absolute -right-1 -top-4 text-bad" />
            </div>
            <div className="relative mt-1 h-10 text-[13px]">
              {marks.map((m) => (
                <span
                  key={m}
                  style={{ left: `${((m - 1) / 24) * 100}%` }}
                  className={cn("absolute -translate-x-1/2 font-display font-semibold", m === 25 ? "translate-x-[-90%] text-bad" : risk === m ? "text-acid" : "text-muted")}
                >
                  {m}%
                  {m === 25 && <span className="block text-[10px] leading-tight text-bad/80">легенды начинают отсюда</span>}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="font-display text-[16px] font-semibold uppercase text-sub">Стоп-лосс</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                { id: "level", label: "За уровнем" },
                { id: "market", label: "По маркету" },
                { id: "none", label: "Без стопа", danger: true },
              ].map(({ id, label, danger }) => {
                const on = stop === id;
                return (
                  <button
                    key={id}
                    onClick={() => setStop(id as typeof stop)}
                    className={cn(
                      "press h-10 rounded-xl border-2 px-3 font-display text-[15px] font-bold uppercase transition-all",
                      danger ? (on ? "border-bad bg-bad/15 text-bad" : "border-bad/50 text-bad/70") : on ? "border-acid text-acid shadow-acid-soft" : "border-line-strong text-sub",
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {stop === "none" && <p className="mt-1 text-right text-[12px] text-bad">так делают герои. и банкроты</p>}
          </div>

          <p className="text-center text-[14px]">
            <span className="font-display font-bold uppercase text-good">Уверенность: {Math.max(0, confidence)}/3 сигнала</span>
            <span className="text-sub"> · {confidence >= 3 ? "силуэт подтверждён" : confidence >= 2 ? "силуэт виден" : "силуэт скрыт"}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pb-2">
        {result ? (
          <Button size="lg" className="col-span-2" onClick={onBack}>
            Следующее задание
          </Button>
        ) : (
          <>
            <Button size="lg" drip onClick={onOpen}>
              Открыть охоту
            </Button>
            <Button size="lg" variant="outline" onClick={onBack}>
              <IconGhost size={22} /> Ещё подумать
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
