import { useEffect, useState } from 'react';
import { useGame } from '../game/state';
import { Button, Headline, Icon, Bar } from '../components/primitives';
import { EnemyArt } from '../components/game';
import { ENEMIES } from '../game/data';

export function BootScreen() {
  const { s, epoch, go, dispatch } = useGame();
  const [p, setP] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setP(v => Math.min(100, v + 7)), 90);
    return () => clearInterval(t);
  }, []);
  const ready = p >= 100;
  return (
    <div className="relative flex h-full flex-col overflow-hidden scanlines vignette">
      <img src="/img/boot-street.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
      <div className="absolute inset-0 bg-gradient-to-b from-bg/40 via-bg/50 to-bg" />
      <div className="relative flex-1 px-6 pt-16">
        <div className="mono text-[11px] font-bold tracking-[0.3em] accent">ЭПОХА {epoch.num} · {epoch.name}</div>
        <h1 className="mt-3 text-[44px] font-extrabold leading-[0.95] tracking-tighter text-txt flicker">SIGNAL<br />ARENA</h1>
        <p className="mt-4 max-w-[260px] text-[13px] font-semibold uppercase leading-5 text-sub">{epoch.motto}</p>
      </div>
      <div className="relative space-y-4 px-6 pb-10">
        <div className="paper-note r-epoch-sm px-3 py-2 text-[11px] leading-4">
          <b>ДЕПАРТАМЕНТ УПРАВЛЯЕМОЙ ПАНИКИ</b> сообщает: обучение не гарантирует прибыль. Оно гарантирует, что ты поймёшь, почему её нет.
        </div>
        <div>
          <div className="mb-1 flex justify-between mono text-[10px] text-muted"><span>{ready ? 'ГОТОВО' : 'ЗАГРУЗКА РЫНКА'}</span><span>{p}%</span></div>
          <Bar value={p} max={100} h={4} />
        </div>
        <Button full size="lg" disabled={!ready} onClick={() => { if (!s.onboardingDone) go('onboarding'); else go('academy'); }}>
          {s.onboardingDone ? 'Продолжить' : 'Войти на рынок'} <Icon name="chevron" size={16} />
        </Button>
        <button onClick={() => { dispatch({ type: 'reset' }); }} className="w-full text-center text-[10px] uppercase tracking-wider text-muted">v4 · прототип</button>
      </div>
    </div>
  );
}

const STEPS = [
  {
    kicker: 'Шаг 1 из 3 · Формула',
    title: '33% терминал. 33% карты. 33% Duolingo.',
    body: 'Академия выдаёт карты навыков. Арена требует их против врагов. Больше ничего. Остальное — сервис для удержания.',
    visual: 'formula',
  },
  {
    kicker: 'Шаг 2 из 3 · Враги',
    title: 'Враги — это твои ошибки.',
    body: 'Каждый враг — рыночная угроза или ошибка трейдера. Ты не увидишь его до решения. Только силуэт и знак вопроса. Он увидит тебя сразу.',
    visual: 'enemies',
  },
  {
    kicker: 'Шаг 3 из 3 · Бюджет риска',
    title: 'У тебя 20 единиц риска. Не 21.',
    body: 'Каждая ошибка списывает бюджет. Ставка «высоко» умножает и награду, и списание. Ноль — встреча с Левиафаном. Он не учит. Он напоминает.',
    visual: 'budget',
  },
];

export function OnboardingScreen() {
  const { go, dispatch } = useGame();
  const [i, setI] = useState(0);
  const st = STEPS[i];
  const finish = () => { dispatch({ type: 'onboarded' }); go('academy'); };
  return (
    <div className="flex h-full flex-col bg-bg tex-brick">
      <div className="flex items-center justify-between px-4 pt-4">
        <div className="flex gap-1">{STEPS.map((_, k) => <span key={k} className="h-1 w-8 rounded-full" style={{ background: k <= i ? 'var(--accent)' : '#22304A' }} />)}</div>
        <button onClick={finish} className="label text-muted">пропустить</button>
      </div>
      <div className="flex flex-1 flex-col justify-center px-5">
        <div className="mx-auto mb-6 flex h-52 w-full items-center justify-center rise" key={i}>
          {st.visual === 'formula' && (
            <div className="flex items-end gap-3">
              {[{ l: 'ТЕРМИНАЛ', i: 'chart', c: '#50C8FF' }, { l: 'КАРТЫ', i: 'collection', c: '#B783FF' }, { l: 'DUOLINGO', i: 'academy', c: '#3BDE8A' }].map(x => (
                <div key={x.l} className="flex flex-col items-center gap-2">
                  <div className="flex h-24 w-20 items-end justify-center rounded-xl border border-line bg-surface p-2" style={{ boxShadow: `inset 0 -32px 0 ${x.c}22` }}><Icon name={x.i} size={32} style={{ color: x.c }} /></div>
                  <span className="mono text-[10px] font-bold text-sub">33%</span><span className="label !text-[8px] text-muted">{x.l}</span>
                </div>
              ))}
            </div>
          )}
          {st.visual === 'enemies' && (
            <div className="flex items-center gap-2">
              <EnemyArt enemy={ENEMIES[0]} silhouette size={96} />
              <EnemyArt enemy={ENEMIES[2]} silhouette size={128} />
              <EnemyArt enemy={ENEMIES[1]} silhouette size={96} />
            </div>
          )}
          {st.visual === 'budget' && (
            <div className="w-full space-y-3 rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-center justify-between"><span className="label text-muted">Бюджет риска</span><span className="mono text-sm font-bold accent">20 / 20</span></div>
              <Bar value={20} max={20} segments={20} h={14} />
              <div className="grid grid-cols-3 gap-2 text-center">
                {[['НИЗКО', '×0.6', '#93A3BC'], ['СРЕДНЕ', '×1.0', '#31D6C4'], ['ВЫСОКО', '×1.8', '#FF596D']].map(([l, m, c]) => (
                  <div key={l} className="rounded-lg border border-line bg-elevated py-2"><div className="label" style={{ color: c }}>{l}</div><div className="mono text-xs font-bold">{m}</div></div>
                ))}
              </div>
            </div>
          )}
        </div>
        <Headline kicker={st.kicker} title={st.title} sub={st.body} />
      </div>
      <div className="flex gap-2 p-4">
        {i > 0 && <Button variant="ghost" onClick={() => setI(i - 1)}><Icon name="back" size={16} /></Button>}
        <Button full size="lg" onClick={() => (i < 2 ? setI(i + 1) : finish())}>{i < 2 ? 'Далее' : 'Начать'} <Icon name="chevron" size={16} /></Button>
      </div>
    </div>
  );
}
