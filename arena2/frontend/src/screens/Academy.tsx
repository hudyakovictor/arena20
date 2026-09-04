import { useState } from 'react';
import { useGame } from '../game/state';
import { Screen } from '../components/Shell';
import { Button, Chip, Headline, Icon, Panel, Bar } from '../components/primitives';
import { SkillCard, EnemyArt } from '../components/game';
import { CARDS, DOMAIN, ENEMIES, cardById, type Card } from '../game/data';
import { cn } from '../utils/cn';

export function AcademyScreen() {
  const { s, epoch, go, dispatch } = useGame();
  const active = cardById(s.activeChapter);
  const openCount = CARDS.filter(c => c.unlock <= s.level).length;
  return (
    <Screen>
      <Headline kicker={`Академия · Эпоха ${epoch.num}`} title="Теория" sub={`Открыто глав: ${openCount} из 17. Карты выдаются только здесь. Применяются — только там.`} />

      {/* continue CTA */}
      <Panel className="overflow-hidden">
        <div className="flex gap-3 p-3">
          <SkillCard card={active} rank={s.ranks[active.id]} compact />
          <div className="flex-1 min-w-0">
            <div className="label text-muted">Продолжить главу {active.num}</div>
            <div className="mt-0.5 text-sm font-bold leading-tight">{active.title}</div>
            <div className="mt-2 flex items-center gap-2 mono text-[10px] text-sub"><span>атомов {Math.min(active.atoms.length, s.ranks[active.id] * 2)}/{active.atoms.length}</span><Bar value={s.ranks[active.id]} max={3} className="flex-1" h={4} /></div>
            <Button size="sm" className="mt-2" onClick={() => go('lesson')}>Урок <Icon name="chevron" size={14} /></Button>
          </div>
        </div>
      </Panel>

      {/* chapter path */}
      <div className="relative pl-5">
        <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-line" />
        <div className="space-y-2">
          {CARDS.map(c => {
            const unlocked = c.unlock <= s.level; const rank = s.ranks[c.id]; const col = DOMAIN[c.domain].color;
            const done = rank === 3; const isActive = c.id === s.activeChapter;
            return (
              <div key={c.id} className="relative">
                <span className={cn('absolute -left-5 top-4 flex h-5 w-5 items-center justify-center rounded-full border-2 bg-bg', done ? 'border-good' : unlocked ? 'border-accent' : 'border-strong')}>
                  {done ? <Icon name="check" size={11} className="text-good" stroke={3} /> : !unlocked ? <Icon name="lock" size={10} className="text-muted" /> : <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                </span>
                <button disabled={!unlocked} onClick={() => { dispatch({ type: 'chapter', id: c.id }); go('lesson'); }}
                  className={cn('flex w-full items-center gap-3 r-epoch border bg-surface p-2.5 text-left transition hover:bg-hover disabled:opacity-60', isActive ? 'border-accent' : 'border-line')}>
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-line" style={{ background: col + '14' }}>
                    {unlocked ? (
                      <EnemyArt enemy={ENEMIES.find(e => e.card === c.id) ?? ENEMIES[0]} silhouette size={48} rim={false} />
                    ) : <div className="flex h-full items-center justify-center"><Icon name="lock" size={16} className="text-muted" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5"><span className="mono text-[10px] font-bold" style={{ color: col }}>{c.id}</span><span className="label !text-[9px] text-muted">{DOMAIN[c.domain].name}</span></div>
                    <div className="truncate text-[13px] font-semibold text-txt">{c.title}</div>
                    <div className="truncate text-[10px] text-muted">{unlocked ? `Против: ${c.enemyTeaser}` : `Откроется на L${c.unlock}`}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex gap-0.5">{[1, 2, 3].map(i => <span key={i} className="h-1.5 w-3 rounded-sm" style={{ background: i <= rank ? col : '#22304A' }} />)}</div>
                    <span className="mono text-[9px] text-muted">{c.atoms.length} ат.</span>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
        <div className="mt-3 r-epoch border border-dashed border-strong p-3 text-center">
          <div className="label text-muted">L81–99 · Пояс мастерства</div>
          <div className="text-[11px] text-sub">Новой теории нет. Все 17 карт открыты. Практика проверяет комбинации и перенос.</div>
        </div>
      </div>
    </Screen>
  );
}

// ─── Lesson overlay: atom → micro-check → rank up ──────────────────────────────
const CHECK: Record<string, { q: string; a: string[]; c: number; why: string }> = {
  default: {
    q: 'Свеча закрылась над уровнем. Объём на ней — 0.6× среднего. Что это?',
    a: ['Подтверждённый пробой — объём не важен', 'Пробой без объёма: вероятная ловушка, ждать ретест', 'Разворот тренда вниз'],
    c: 1,
    why: 'Пробой без участников — это не пробой, это приглашение. Объём — единственный свидетель, который не пишет в чат.',
  },
};

export function LessonScreen() {
  const { s, go, back, dispatch } = useGame();
  const card: Card = cardById(s.activeChapter);
  const col = DOMAIN[card.domain].color;
  const [step, setStep] = useState<'atom' | 'check' | 'result'>('atom');
  const [pick, setPick] = useState<number | null>(null);
  const atomIdx = Math.min(card.atoms.length - 1, s.ranks[card.id] * 2);
  const atom = card.atoms[atomIdx];
  const ch = CHECK.default;
  const correct = pick === ch.c;

  return (
    <div className="flex h-full flex-col bg-bg">
      <header className="flex h-14 items-center gap-2 border-b border-line px-3">
        <button onClick={back} className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-hover"><Icon name="close" /></button>
        <div className="flex-1">
          <div className="flex gap-1">{card.atoms.map((_, i) => <span key={i} className="h-1.5 flex-1 rounded-full" style={{ background: i < atomIdx ? col : i === atomIdx ? 'var(--accent)' : '#22304A' }} />)}</div>
          <div className="mt-1 mono text-[10px] text-muted">{card.id} · атом {atomIdx + 1}/{card.atoms.length}</div>
        </div>
        <Chip color={col}>{DOMAIN[card.domain].short}</Chip>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-4">
        {step === 'atom' && (
          <div className="rise space-y-4">
            <Headline kicker="Атом-умение" title={atom} />
            <div className="paper-note r-epoch-sm p-4 text-[13px] leading-5">
              <b className="block text-[11px] uppercase tracking-wider">Выдержка из отчёта о катастрофе</b>
              <p className="mt-1">Уровень пробивают трижды. Первые два раза — чтобы собрать стопы. Третий — чтобы собрать тех, кто «понял систему».</p>
              <p className="mt-2">Объём — единственный участник рынка, который не врёт в чате. Пробой на 0.6× среднего объёма означает: крупные не участвуют. Значит, участвуешь ты. Один.</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <MiniChart label="Пробой С объёмом" ok />
              <MiniChart label="Пробой БЕЗ объёма" />
            </div>
            <div className="rounded-lg border border-line bg-surface p-3 text-[11px] text-sub">
              <span className="label text-muted">Правило Академии</span><br />Здесь нет врагов, источников и наград Арены. Только проверка: освоил ли ты умение.
            </div>
          </div>
        )}

        {step === 'check' && (
          <div className="rise space-y-3">
            <Headline kicker="Микро-проверка" title={ch.q} size="sm" />
            {ch.a.map((a, i) => (
              <button key={i} onClick={() => setPick(i)} className={cn('flex w-full items-center gap-3 r-epoch-sm border p-3 text-left text-sm transition', pick === i ? 'border-accent bg-hover' : 'border-line bg-surface hover:bg-hover')}>
                <span className="mono flex h-7 w-7 items-center justify-center rounded-md border border-line text-xs font-bold">{['A', 'B', 'C'][i]}</span>{a}
              </button>
            ))}
          </div>
        )}

        {step === 'result' && (
          <div className="rise space-y-4 text-center">
            <div className={cn('mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2', correct ? 'border-good text-good' : 'border-bad text-bad')}><Icon name={correct ? 'check' : 'close'} size={32} stroke={2.5} /></div>
            <Headline title={correct ? 'Атом освоен' : 'Рынок принял твоё решение'} sub={ch.why} />
            {correct && (
              <div className="mx-auto flex w-fit items-center gap-4 rounded-2xl border border-line bg-surface p-4">
                <SkillCard card={card} rank={s.ranks[card.id]} />
                <div className="text-left">
                  <div className="label text-muted">Карта навыка</div>
                  <div className="text-sm font-bold">{card.title}</div>
                  <div className="mt-1 mono text-xs" style={{ color: col }}>ранг {['—', 'I', 'II', 'III'][s.ranks[card.id]]} → {['—', 'I', 'II', 'III'][Math.min(3, s.ranks[card.id] + 1)]}</div>
                  <div className="mt-1 text-[10px] text-muted">Рамка меняется. Интерфейс — нет.</div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-line p-4">
        {step === 'atom' && <Button full size="lg" onClick={() => setStep('check')}>К проверке <Icon name="chevron" size={16} /></Button>}
        {step === 'check' && <Button full size="lg" disabled={pick === null} onClick={() => { setStep('result'); if (pick === ch.c) dispatch({ type: 'rankUp', card: card.id }); }}>Ответить</Button>}
        {step === 'result' && (
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => { setStep('atom'); setPick(null); }}>Ещё атом</Button>
            <Button full size="lg" onClick={() => go('arena')}>→ Арена <Icon name="arena" size={16} /></Button>
          </div>
        )}
      </footer>
    </div>
  );
}

function MiniChart({ label, ok }: { label: string; ok?: boolean }) {
  return (
    <div className="rounded-lg border border-line bg-inset p-2">
      <svg viewBox="0 0 120 70" className="w-full">
        <line x1="0" x2="120" y1="30" y2="30" stroke="#93A3BC" strokeDasharray="3 3" />
        {[0, 1, 2, 3, 4, 5].map(i => {
          const x = 10 + i * 18; const up = i >= 4; const h = 14;
          const y = up ? 30 - (i - 3) * 8 : 34 + (i % 2) * 4;
          return <g key={i}><line x1={x} x2={x} y1={y - 5} y2={y + h + 5} stroke={up ? '#3BDE8A' : '#FF596D'} /><rect x={x - 4} y={y} width="8" height={h} fill={up ? '#3BDE8A' : '#FF596D'} /><rect x={x - 4} y={70 - (ok && up ? 18 : 5 + (i % 3) * 2)} width="8" height={ok && up ? 18 : 5 + (i % 3) * 2} fill={ok && up ? '#FFB341' : '#344563'} /></g>;
        })}
      </svg>
      <div className="mt-1 text-center label !text-[9px]" style={{ color: ok ? '#3BDE8A' : '#FF596D' }}>{label}</div>
    </div>
  );
}
