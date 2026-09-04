import { useState } from 'react';
import { useGame } from '../game/state';
import { Screen } from '../components/Shell';
import { Bar, Button, Chip, Headline, Icon, Panel, Row } from '../components/primitives';
import { EnemyArt } from '../components/game';
import { ENEMIES, EPOCHS, epochOf } from '../game/data';
import { cn } from '../utils/cn';

// ─── TOURNAMENT / SHADOW (M14) ────────────────────────────────────────────────
export function TournamentScreen() {
  const { s, go } = useGame();
  const [tab, setTab] = useState<'season' | 'shadow'>('season');
  const board = [
    { n: 'quiet_quant', l: 74, p: 2840, me: false }, { n: 'stop_hunter_9', l: 68, p: 2610, me: false }, { n: 'соучастник #4812', l: s.level, p: 2390, me: true },
    { n: 'not_a_whale', l: 61, p: 2205, me: false }, { n: 'moon_tomorrow', l: 12, p: 40, me: false },
  ];
  return (
    <Screen title="Турниры и тень" back>
      <div className="relative overflow-hidden r-epoch border border-warn/40 bg-surface p-4">
        <div className="label text-warn">Сезон 3 · «Налог на надежду»</div>
        <div className="text-2xl font-extrabold uppercase leading-tight">Осталось 4д 11ч</div>
        <p className="mt-1 text-[12px] text-sub">Смешанные встречи: 2–3 врага, ложные ярлыки как норма. Награда — косметика и место в отчёте о катастрофе.</p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[['Место', '#3'], ['Очки', '2 390'], ['Точность', '71%']].map(([l, v]) => <div key={l} className="rounded-lg border border-line bg-elevated py-2"><div className="mono text-base font-bold">{v}</div><div className="label !text-[8px] text-muted">{l}</div></div>)}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-surface p-1">
        {(['season', 'shadow'] as const).map(t => <button key={t} onClick={() => setTab(t)} className={cn('h-9 rounded-lg text-[11px] font-bold uppercase', tab === t ? 'bg-elevated glow' : 'text-muted')}>{t === 'season' ? 'Таблица' : 'Тень · M14'}</button>)}
      </div>
      {tab === 'season' ? (
        <Panel>
          {board.map((b, i) => (
            <div key={b.n} className={cn('flex items-center gap-3 border-b border-line/60 px-3 py-2.5 last:border-0', b.me && 'bg-hover')}>
              <span className={cn('mono w-5 text-sm font-extrabold', i < 3 ? 'text-warn' : 'text-muted')}>{i + 1}</span>
              <div className="flex-1"><div className={cn('text-[12px] font-semibold', b.me && 'accent')}>{b.n}</div><div className="mono text-[9px] text-muted">L{b.l}</div></div>
              <span className="mono text-sm font-bold">{b.p}</span>
            </div>
          ))}
        </Panel>
      ) : (
        <>
          <Panel title="Твоя тень" right={<Chip color="#B783FF">асинхронно</Chip>}>
            <div className="flex items-center gap-3 px-3 pb-3">
              <div className="overflow-hidden rounded-xl border border-line"><EnemyArt enemy={ENEMIES[3]} size={72} silhouette rim={false} /></div>
              <div className="flex-1 text-[11px] text-sub">Тень — игрок твоего уровня, решивший это же задание раньше. Ты видишь его ответ и время только после своего. Он не видит тебя. Пока.</div>
            </div>
          </Panel>
          <Panel title="Последние дуэли с тенью">
            {[['T-0412', 'B / B', '38с / 51с', true], ['T-0398', 'A / D', '22с / 47с', false], ['T-0371', 'C / C', '61с / 59с', true]].map(([id, a, t, w]) => (
              <Row key={id as string} icon={w ? 'check' : 'close'} color={w ? '#3BDE8A' : '#FF596D'} title={`${id} · ответы ${a}`} sub={`время ${t}`} right={<span className="mono text-[10px] text-muted">{w ? '+12' : '−4'}</span>} />
            ))}
          </Panel>
        </>
      )}
      <Button full onClick={() => go('arena')}>В арену <Icon name="arena" size={14} /></Button>
    </Screen>
  );
}

// ─── STORE (cosmetics only) ───────────────────────────────────────────────────
export function StoreScreen() {
  const { s, dispatch } = useGame();
  const [owned, setOwned] = useState<string[]>(['frame-street']);
  const items = [
    { id: 'frame-street', n: 'Рамка «Граффити»', p: 0, c: '#31D6C4', k: 'Рамка карты' },
    { id: 'frame-gold', n: 'Рамка «Отчёт о катастрофе»', p: 120, c: '#FFB341', k: 'Рамка карты' },
    { id: 'avatar-whale', n: 'Аватар «Случайный кит»', p: 80, c: '#59A7FF', k: 'Аватар' },
    { id: 'theme-paper', n: 'Тема «Жёлтая газета»', p: 200, c: '#E7DFD0', k: 'Тема' },
    { id: 'stamp-panic', n: 'Печать «Паника зафиксирована»', p: 60, c: '#FF596D', k: 'Печать фидбека' },
    { id: 'title-tax', n: 'Титул «Плательщик налога на надежду»', p: 40, c: '#B783FF', k: 'Титул' },
  ];
  return (
    <Screen title="Маркет" back>
      <div className="flex items-center justify-between r-epoch border border-line bg-surface p-3">
        <div><div className="label text-muted">Баланс</div><div className="mono text-2xl font-extrabold text-warn">{s.sig} <span className="text-sm">SIG</span></div></div>
        <div className="max-w-[180px] text-right text-[10px] text-sub">SIG покупает только косметику. Знания не продаются. Их продают другие — за твои деньги.</div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {items.map(it => { const has = owned.includes(it.id); const can = s.sig >= it.p; return (
          <div key={it.id} className="flex flex-col r-epoch border border-line bg-surface p-2">
            <div className="flex h-20 items-center justify-center rounded-lg border" style={{ borderColor: it.c + '66', background: `radial-gradient(circle at 50% 30%, ${it.c}33, transparent 70%)` }}><Icon name={it.k === 'Аватар' ? 'user' : it.k === 'Тема' ? 'news' : it.k === 'Титул' ? 'star' : it.k === 'Печать фидбека' ? 'alert' : 'collection'} size={28} style={{ color: it.c }} /></div>
            <div className="mt-2 label !text-[8px] text-muted">{it.k}</div>
            <div className="text-[11px] font-bold leading-tight">{it.n}</div>
            <Button size="sm" variant={has ? 'ghost' : 'primary'} className="mt-2" disabled={!has && !can} onClick={() => { if (!has) { dispatch({ type: 'spend', sig: it.p }); setOwned(o => [...o, it.id]); } }}>
              {has ? 'Куплено' : it.p === 0 ? 'Бесплатно' : `${it.p} SIG`}
            </Button>
          </div>); })}
      </div>
      <div className="paper-note r-epoch-sm p-3 text-[11px] leading-4"><b>ПУБЛИЧНЫЙ КОМИТЕТ ПО СПАСЕНИЮ ЛИКВИДНОСТИ</b> напоминает: ни один предмет маркета не влияет на задания, награды и бюджет риска. Pay-to-win отсутствует. Lose-to-learn — включён по умолчанию.</div>
    </Screen>
  );
}

// ─── SETTINGS ────────────────────────────────────────────────────────────────
export function SettingsScreen() {
  const { s, dispatch } = useGame();
  const [t, setT] = useState({ motion: true, sound: false, haptics: true, labels: true });
  const Toggle = ({ k, label, sub }: { k: keyof typeof t; label: string; sub: string }) => (
    <button onClick={() => setT(v => ({ ...v, [k]: !v[k] }))} className="flex w-full items-center gap-3 px-3 py-3 text-left">
      <div className="flex-1"><div className="text-sm font-semibold">{label}</div><div className="text-[11px] text-muted">{sub}</div></div>
      <span className={cn('relative h-6 w-11 rounded-full transition', t[k] ? 'bg-accent' : 'bg-strong')}><span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-txt transition', t[k] ? 'left-[22px]' : 'left-0.5')} /></span>
    </button>
  );
  return (
    <Screen title="Настройки" back>
      <Panel title="Опыт">
        <Toggle k="motion" label="Анимации" sub="prefers-reduced-motion учитывается всегда. Drama ≤ 700мс." />
        <Toggle k="sound" label="Звук" sub="Тиканье холодной головы, штамп фидбека" />
        <Toggle k="haptics" label="Вибрация" sub="Списание бюджета, ошибка, левиафан" />
      </Panel>
      <Panel title="Обучение">
        <Toggle k="labels" label="Ярлыки-костыли" sub={`Управляется эпохой: сейчас «${epochOf(s.level).crutches.labels}». Переключатель — только для демо.`} />
        <div className="px-3 pb-3">
          <div className="mb-1 flex justify-between text-[11px]"><span className="text-sub">Демо-уровень</span><span className="mono accent">L{s.level} · {epochOf(s.level).name}</span></div>
          <input type="range" min={1} max={99} value={s.level} onChange={e => dispatch({ type: 'setLevel', level: +e.target.value })} className="w-full accent-[var(--accent)]" />
          <div className="flex justify-between mono text-[9px] text-muted">{Object.values(EPOCHS).map(e => <span key={e.id}>{e.num} L{e.levels[0]}</span>)}</div>
        </div>
      </Panel>
      <Panel title="Данные">
        <Row icon="refresh" title="Сбросить прогресс + первый вход" sub="Вернёт к онбордингу. Рынок ничего не забудет." onClick={() => dispatch({ type: 'reset' })} color="#FF596D" />
        <Row icon="scroll" title="Экспорт свитка ошибок" sub={`${s.journal.length} записей · JSON`} />
        <Row icon="lock" title="Приватность и кошелёк" sub="Кастодия: чьи ключи, того и монеты" />
      </Panel>
      <div className="text-center mono text-[9px] text-muted">Signal Arena v4 · design prototype · seed-deterministic · offline attempt queue</div>
    </Screen>
  );
}

// ─── EPOCH TRANSITION (event) ─────────────────────────────────────────────────
export function EpochScreen() {
  const { epoch, go } = useGame();
  const prev = Object.values(EPOCHS).find(e => e.levels[1] === epoch.levels[0] - 1);
  return (
    <div className={cn('relative flex h-full flex-col overflow-hidden', epoch.texture)} style={{ background: epoch.bg }}>
      <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 30%, ${epoch.accent}33, transparent 60%)` }} />
      <div className="relative flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="mono text-[11px] tracking-[0.3em] text-sub">ПЕРЕХОД ЭПОХИ</div>
        <div className="mt-6 flex items-center gap-4">
          {prev && <span className="mono text-3xl font-extrabold text-muted line-through">{prev.num}</span>}
          <Icon name="chevron" className="text-muted" />
          <span className="mono text-6xl font-extrabold" style={{ color: epoch.accent, textShadow: `0 0 30px ${epoch.accent}` }}>{epoch.num}</span>
        </div>
        <Headline title={epoch.name} sub={epoch.motto} className="mt-6" size="lg" />
        <div className="mt-6 w-full space-y-1.5 text-left">
          {[
            ['Токены оформления', `${epoch.description}`],
            ['Навигация', epoch.nav.length === 2 ? 'Академия · Арена' : epoch.nav.length === 3 ? '+ Коллекция' : '+ Ещё: турниры, маркет'],
            ['Костыли', epoch.crutches.labels === 'all' ? 'Все ярлыки на месте' : epoch.crutches.labels === 'partial' ? 'Часть ярлыков снята' : epoch.crutches.labels === 'none' ? 'Ярлыков нет. Сырые данные.' : 'Ложные ярлыки — норма'],
          ].map(([k, v]) => <div key={k} className="flex gap-3 rounded-lg border p-2 text-[11px]" style={{ borderColor: epoch.border, background: epoch.surface }}><span className="label w-24 shrink-0 text-muted">{k}</span><span className="text-txt">{v}</span></div>)}
        </div>
      </div>
      <div className="relative p-5"><Button full size="lg" onClick={() => go('arena')}>Принять условия</Button><div className="mt-2 text-center text-[10px] text-muted">Отказаться нельзя. Это и есть взросление.</div></div>
    </div>
  );
}

// ─── LEVIATHAN (budget = 0 event) ─────────────────────────────────────────────
export function LeviathanScreen() {
  const { s, go, dispatch } = useGame();
  return (
    <div className="relative flex h-full flex-col overflow-hidden vignette">
      <img src="/img/leviathan.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg/40 to-bg" />
      <div className="relative flex-1" />
      <div className="relative space-y-4 p-5">
        <div className="label text-bad">Бюджет риска · {s.budget}/{s.budgetMax}</div>
        <h1 className="text-[34px] font-extrabold uppercase leading-[0.95] tracking-tight">Левиафан<br />заметил тебя.</h1>
        <p className="text-[13px] leading-5 text-sub">Ноль бюджета — не проигрыш. Это встреча. Он не учит. Он напоминает, что рынок не рухнул — он просто пересмотрел твои жизненные планы.</p>
        <Bar value={s.budget} max={s.budgetMax} segments={20} color="#FF596D" h={10} />
        <div className="grid grid-cols-2 gap-2">
          <Button variant="danger" onClick={() => { dispatch({ type: 'budget', delta: 10 }); go('warmup'); }}>Разминка · +10</Button>
          <Button variant="ghost" onClick={() => { dispatch({ type: 'budget', delta: 20 }); go('academy'); }}>Академия · восст.</Button>
        </div>
        <div className="text-center text-[10px] text-muted">Восстановление — временем или теорией. Не ставкой «высоко».</div>
      </div>
    </div>
  );
}
