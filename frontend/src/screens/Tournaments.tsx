import { useEffect, useState } from "react";
import { Avatar, Button, Card } from "../components/ui";
import { IconClock, IconCrown, IconSwords, IconTrophy } from "../components/icons";
import { leaders } from "../data/game";
import { cn } from "../utils/cn";

function useCountdown(start = 23 * 3600 + 14 * 60 + 7) {
  const [s, setS] = useState(start);
  useEffect(() => {
    const t = setInterval(() => setS((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function Tournaments() {
  const time = useCountdown();
  const [joined, setJoined] = useState(false);
  const podium = [leaders[1], leaders[0], leaders[2]];

  return (
    <div className="fade-up space-y-4 px-3 pt-4">
      <h1 className="stencil text-[34px] leading-none text-text">Турниры</h1>

      {/* LIVE tournament */}
      <Card className="overflow-hidden">
        <div className="flex gap-3">
          <div className="flex w-[110px] shrink-0 flex-col items-center justify-between">
            <div className="relative mt-2 text-gold drop-shadow-[0_0_16px_rgba(245,197,66,0.45)]">
              <IconTrophy size={96} />
            </div>
            <p className="mt-2 text-center text-[12px] text-sub">
              Ранг 45 · <span className="text-text">топ 10%</span>
            </p>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-bad px-3 py-1 font-display text-[13px] font-bold text-white">
                <span className="live-dot h-2 w-2 rounded-full bg-white" /> LIVE
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/70 px-3 py-1 font-display text-[13px] font-semibold text-text">
                <IconClock size={14} className="text-sub" /> {time}
              </span>
            </div>
            <h2 className="stencil mt-2 text-[28px] leading-none text-text">Bull Run Blitz</h2>
            <p className="mt-1 font-display text-[14px] uppercase tracking-wide text-sub">
              Призовой фонд: <span className="text-gold">500 000 $SIG</span>
            </p>
            <p className="text-[13px] text-muted">Второе место получает опыт</p>
            <Button className="mt-3 w-full" size="lg" drip onClick={() => setJoined(!joined)}>
              {joined ? "Ты в списке жертв" : "Участвовать"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Season leaders */}
      <Card>
        <h3 className="font-display text-[18px] font-semibold uppercase tracking-wide text-text">Лидеры сезона</h3>

        {/* podium */}
        <div className="mt-2 grid grid-cols-3 items-end gap-1 px-2">
          {podium.map((p, i) => {
            const place = [2, 1, 3][i];
            const h = place === 1 ? 118 : place === 2 ? 88 : 72;
            const color = place === 1 ? "text-gold" : place === 2 ? "text-[#c9ced6]" : "text-orange";
            const ring = place === 1 ? "border-gold" : place === 2 ? "border-[#c9ced6]" : "border-orange";
            return (
              <div key={p.rank} className="flex flex-col items-center">
                <Avatar emoji={p.emoji} size={place === 1 ? 64 : 56} ring={ring} className="mb-2 shadow-[0_0_14px_rgba(0,0,0,0.6)]" />
                <div
                  style={{ height: h }}
                  className={cn(
                    "flex w-full flex-col items-center justify-start rounded-t-lg border border-line-strong bg-gradient-to-b from-elevated to-surface pt-2",
                    place === 1 && "from-hover",
                  )}
                >
                  {place === 1 && <IconCrown size={22} className="text-gold" />}
                  <span className={cn("stencil text-[36px] leading-none", color)}>{place}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* leaderboard */}
        <ul className="mt-3 space-y-2">
          {leaders.map((l) => (
            <li
              key={l.rank}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3 py-2",
                l.you ? "border-acid bg-ink/60 shadow-acid-soft" : "border-line bg-ink/40",
              )}
            >
              <span className={cn("w-5 font-display text-[20px] font-bold", l.you ? "text-acid" : "text-sub")}>{l.rank}</span>
              <Avatar emoji={l.emoji} size={36} />
              <span className="min-w-0 flex-1 truncate font-display text-[18px] font-semibold text-text">{l.name}</span>
              {l.you && <span className="rounded-full border border-acid px-2 py-0.5 text-[11px] text-acid">это ты</span>}
              <span className={cn("font-display text-[20px] font-bold", l.you ? "text-acid" : "text-gold")}>{l.score.toLocaleString("ru-RU")}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* League + Duel */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3">
          <p className="font-display text-[15px] font-semibold uppercase leading-tight text-text">Еженедельная лига</p>
          <p className="mt-1 text-[13px] text-sub">Лига II → Лига I</p>
          <div className="mt-2 flex items-end gap-1">
            <div className="h-2 flex-1 rounded-full bg-ink/70">
              <div className="h-full w-[68%] rounded-full bg-acid shadow-acid-soft" />
            </div>
            {[10, 16, 22].map((h, i) => (
              <span key={i} style={{ height: h }} className={cn("w-2 rounded-sm", i === 0 ? "bg-acid" : "bg-line-strong")} />
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted">понижение тоже бывает</p>
        </Card>
        <Card className="flex items-center gap-2 p-3">
          <IconSwords size={44} className="shrink-0 text-sub" />
          <div className="flex flex-1 flex-col items-end">
            <p className="font-display text-[15px] font-semibold uppercase text-text">Дуэль 1 на 1</p>
            <Button variant="outline" size="sm" className="mt-2 w-full">
              Вызов
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
