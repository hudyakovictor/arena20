import { useState } from 'react';
import { useGame } from '../game/state';
import { Screen } from '../components/Shell';
import { Bar, Button, Chip, Headline, Icon, Panel, Row } from '../components/primitives';
import { EnemyArt, SkillCard } from '../components/game';
import { DOMAIN, EPOCHS, HEADLINES, WEATHER, cardById, enemyById, type EpochId } from '../game/data';
import { cn } from '../utils/cn';

// ─── MORE (hub) ───────────────────────────────────────────────────────────────
export function MoreScreen() {
  const { s, epoch, go } = useGame();
  return (
    <Screen>
      <button onClick={() => go('profile')} className="flex w-full items-center gap-3 r-epoch border border-line bg-surface p-3 text-left">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl border-2 bg-elevated" style={{ borderColor: epoch.accent }}><span className="mono text-xl font-extrabold accent">L{s.level}</span></div>
        <div className="flex-1">
          <div className="text-base font-extrabold uppercase">Соучастник #4812</div>
          <div className="text-[11px] text-sub">Эпоха {epoch.num} · {epoch.name} · серия {s.streak} дн.</div>
          <Bar value={s.xp} max={s.xpNext} className="mt-1.5" h={4} />
        </div>
        <Icon name="chevron" className="text-muted" />
      </button>
      <Panel>
        <Row icon="scroll" title="Свиток ошибок" sub={`${s.journal.length} записей · M7`} onClick={() => go('journal')} color="#FF596D" />
        <Row icon="target" title="Мастер-чек" sub="Готовность к экзамену главы" onClick={() => go('mastery')} color="#31D6C4" />
        <Row icon="weather" title="Разминка дня" sub={WEATHER[s.weather].name} onClick={() => go('warmup')} color="#9CA8FF" />
        <Row icon="swords" title="Турниры и тень" sub={s.level >= 51 ? 'Сезон 3 · открыт' : 'Откроется на L51'} onClick={() => go('tournament')} locked={s.level < 51} color="#FFB341" />
        <Row icon="market" title="Маркет" sub={s.level >= 81 ? 'Только косметика. SIG не покупает знания.' : 'Откроется на L81'} onClick={() => go('store')} locked={s.level < 81} color="#B783FF" />
        <Row icon="settings" title="Настройки" sub="Движение, звук, сброс прогресса" onClick={() => go('settings')} />
      </Panel>
      <div className="paper-note r-epoch-sm p-3 text-[11px] leading-4"><b>СЛУЖБА ПОДДЕРЖКИ.</b> Мы не можем вернуть деньги. Мы можем объяснить, куда они делись. Это дороже.</div>
    </Screen>
  );
}

// ─── PROFILE ──────────────────────────────────────────────────────────────────
export function ProfileScreen() {
  const { s, epoch, dispatch } = useGame();
  const ids: EpochId[] = ['street', 'cabinet', 'terminal', 'system'];
  return (
    <Screen title="Профиль" back>
      <div className="relative overflow-hidden r-epoch border border-line bg-surface p-4">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 bg-elevated" style={{ borderColor: epoch.accent, boxShadow: `0 0 24px ${epoch.accent}44` }}><span className="mono text-2xl font-extrabold accent">L{s.level}</span></div>
          <div>
            <div className="text-xl font-extrabold uppercase leading-tight">Соучастник<br />#4812</div>
            <div className="mono text-[10px] text-muted">id 0x4812…e3f · с сезона 2</div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px]"><span className="text-sub">До L{s.level + 1}</span><span className="mono">{s.xp}/{s.xpNext} XP</span></div>
        <Bar value={s.xp} max={s.xpNext} className="mt-1" />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[['Точность', '68%'], ['Улики', '81%'], ['Серия', `${s.streak}д`], ['Тильт', '2']].map(([l, v]) => (
          <div key={l} className="r-epoch-sm border border-line bg-surface py-2 text-center"><div className="mono text-base font-bold">{v}</div><div className="label !text-[8px] text-muted">{l}</div></div>
        ))}
      </div>
      <Panel title="Ось эпох · взросление интерфейса">
        <div className="space-y-1.5 px-3 pb-3">
          {ids.map(id => { const e = EPOCHS[id]; const cur = e.id === epoch.id; return (
            <button key={id} onClick={() => dispatch({ type: 'setLevel', level: e.levels[0] + 3 })} className={cn('flex w-full items-center gap-3 rounded-lg border p-2 text-left', cur ? 'bg-hover' : 'border-line bg-elevated')} style={cur ? { borderColor: e.accent } : undefined}>
              <span className="mono w-6 text-center text-sm font-extrabold" style={{ color: e.accent }}>{e.num}</span>
              <div className="flex-1"><div className="text-[12px] font-bold uppercase">{e.name} <span className="mono text-[9px] font-normal text-muted">L{e.levels[0]}–{e.levels[1]}</span></div><div className="text-[10px] text-muted">{e.description}</div></div>
              <span className="flex gap-0.5">{e.nav.map(n => <span key={n} className="h-2 w-2 rounded-sm" style={{ background: e.accent }} />)}</span>
            </button>); })}
          <div className="text-[10px] text-muted">Тап по эпохе — демо-переключение уровня. Костыли: ярлыки {epoch.crutches.labels}, подсветка улик {epoch.crutches.evidenceHighlights ? 'есть' : 'нет'}.</div>
        </div>
      </Panel>
    </Screen>
  );
}

// ─── ERROR JOURNAL (M7) ───────────────────────────────────────────────────────
export function JournalScreen() {
  const { s, go } = useGame();
  return (
    <Screen title="Свиток ошибок · M7" back>
      <div className="paper-note r-epoch-sm p-3">
        <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">Протокол коллективного отрицания</div>
        <div className="text-lg font-extrabold uppercase leading-tight">Каждая запись — враг, атом, улика.</div>
        <p className="mt-1 text-[11px]">Записи попадают в разминку первыми. Повтор придёт мутированным: другой актив, другой таймфрейм, зеркало. Ошибка та же.</p>
      </div>
      {s.journal.length === 0 && <div className="py-10 text-center text-sub">Свиток пуст. Это временно.</div>}
      {s.journal.map((j, i) => { const e = enemyById(j.enemy); const c = DOMAIN[e.domain].color; return (
        <div key={i} className="flex gap-3 r-epoch border border-line bg-surface p-2.5">
          <div className="overflow-hidden rounded-lg"><EnemyArt enemy={e} size={64} silhouette={s.level < 8} rim={false} /></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2"><span className="mono text-[10px] font-bold" style={{ color: c }}>{e.id}</span><span className="truncate text-[12px] font-bold uppercase">{s.level >= 8 ? e.name : 'Неопознан'}</span><span className="ml-auto mono text-[9px] text-muted">{j.date}</span></div>
            <div className="mt-0.5 text-[11px] text-txt"><span className="text-muted">атом:</span> {j.atom}</div>
            <div className="text-[11px] text-sub"><span className="text-muted">улика:</span> {j.evidence}</div>
            <div className="mt-1 flex gap-1">{j.mutated ? <Chip color="#B783FF">мутация · M11</Chip> : <Chip>в очереди разминки</Chip>}</div>
          </div>
        </div>); })}
      <Button full variant="ghost" onClick={() => go('warmup')}>Отработать в разминке <Icon name="chevron" size={14} /></Button>
    </Screen>
  );
}

// ─── MASTERY CHECK ────────────────────────────────────────────────────────────
export function MasteryScreen() {
  const { s, go } = useGame();
  const card = cardById(s.activeChapter); const col = DOMAIN[card.domain].color;
  const reqs = [
    { t: `Все ${card.atoms.length} атомов освоены`, ok: s.ranks[card.id] >= 3 },
    { t: 'Карта применена в Арене ≥ 5 раз', ok: true },
    { t: 'Улика найдена в ≥ 70% попыток', ok: true },
    { t: 'Нет открытых записей в свитке по главе', ok: s.journal.every(j => enemyById(j.enemy).card !== card.id) },
  ];
  const ready = reqs.every(r => r.ok);
  return (
    <Screen title="Мастер-чек" back>
      <div className="flex items-center gap-4">
        <SkillCard card={card} rank={s.ranks[card.id]} />
        <div><Headline kicker={`Глава ${card.num}`} title={card.title} size="sm" /><div className="mt-2 mono text-[10px]" style={{ color: col }}>ранг {['—', 'I', 'II', 'III'][s.ranks[card.id]]} · {DOMAIN[card.domain].name}</div></div>
      </div>
      <Panel title="Что нужно для экзамена">
        <div className="space-y-1 px-3 pb-3">
          {reqs.map(r => (
            <div key={r.t} className="flex items-center gap-2 py-1.5 text-[12px]"><span className={cn('flex h-5 w-5 items-center justify-center rounded-full border', r.ok ? 'border-good text-good' : 'border-strong text-muted')}><Icon name={r.ok ? 'check' : 'close'} size={12} stroke={3} /></span><span className={r.ok ? 'text-txt' : 'text-sub'}>{r.t}</span></div>
          ))}
        </div>
      </Panel>
      <Panel title="Атомы главы">
        <div className="space-y-1 px-3 pb-3">
          {card.atoms.map((a, i) => <div key={a} className="flex items-center gap-2 text-[11px]"><span className="mono w-5 text-muted">{i + 1}</span><span className={i < s.ranks[card.id] * 2 ? 'text-txt' : 'text-muted'}>{a}</span>{i < s.ranks[card.id] * 2 && <Icon name="check" size={12} className="ml-auto text-good" />}</div>)}
        </div>
      </Panel>
      <div className="rounded-lg border border-line bg-surface p-3 text-[11px] text-sub">Экзамен — задание Арены со стадией S3: враг приведёт второй домен. {ready ? 'Ты готов. Это не гарантия.' : 'Сначала закрой требования. Рынок не принимает справки.'}</div>
      <Button full size="lg" disabled={!ready} onClick={() => go('arena')}>{ready ? 'Сдать экзамен' : 'Не готов'}</Button>
    </Screen>
  );
}

// ─── DAILY WARMUP (M13 + M7 priority) ─────────────────────────────────────────
export function WarmupScreen() {
  const { s, go, dispatch } = useGame();
  const w = WEATHER[s.weather];
  const [done, setDone] = useState<number[]>([]);
  const queue = [
    { t: 'Из свитка · E10 Тень Сигнальной Группы', sub: 'мутация: другой актив (SOL), зеркало', tag: 'M7', c: '#FF596D' },
    { t: 'Повтор · C2 пробой с объёмом', sub: 'интервал 3 дня · ранг II', tag: 'SRS', c: '#59A7FF' },
    { t: 'Новое · C2 ловушка ликвидности', sub: 'атом 6 · первое применение', tag: 'NEW', c: '#31D6C4' },
  ];
  return (
    <Screen title="Разминка дня" back>
      <div className="relative overflow-hidden r-epoch border p-4" style={{ borderColor: w.color + '66', background: `linear-gradient(135deg, ${w.color}22, transparent)` }}>
        <div className="label" style={{ color: w.color }}>Погода рынка · M13</div>
        <div className="text-xl font-extrabold uppercase leading-tight">{w.name}</div>
        <p className="mt-1 text-[12px] text-sub">{w.note}</p>
        <div className="mt-3 flex gap-1">{WEATHER.map((x, i) => <button key={x.id} onClick={() => dispatch({ type: 'weather', i })} className={cn('h-6 rounded-md border px-2 mono text-[9px] font-bold uppercase', s.weather === i ? 'text-txt' : 'border-line text-muted')} style={s.weather === i ? { borderColor: x.color, color: x.color } : undefined}>{x.id}</button>)}</div>
        <div className="mt-2 mono text-[10px] text-muted">заголовок дня: {HEADLINES[s.level % HEADLINES.length]}</div>
      </div>
      <div className="flex items-center justify-between"><span className="label text-muted">Очередь · 3 задания · ~4 мин</span><span className="mono text-[10px] text-sub">серия {s.streak} 🔥</span></div>
      {queue.map((q, i) => (
        <button key={i} onClick={() => { setDone(d => [...d, i]); if (i === 0) go('arena'); }} className={cn('flex w-full items-center gap-3 r-epoch border bg-surface p-3 text-left', done.includes(i) ? 'border-good/40 opacity-60' : 'border-line')}>
          <span className="mono flex h-8 w-8 items-center justify-center rounded-lg border text-[10px] font-bold" style={{ color: q.c, borderColor: q.c + '66' }}>{q.tag}</span>
          <div className="flex-1"><div className="text-[13px] font-semibold">{q.t}</div><div className="text-[10px] text-muted">{q.sub}</div></div>
          <Icon name={done.includes(i) ? 'check' : 'play'} size={16} className={done.includes(i) ? 'text-good' : 'text-muted'} />
        </button>
      ))}
      <div className="rounded-lg border border-line bg-surface p-3 text-[11px] text-sub">Разминка не заменяет Арену. Она напоминает, где тебя уже ели.</div>
    </Screen>
  );
}
