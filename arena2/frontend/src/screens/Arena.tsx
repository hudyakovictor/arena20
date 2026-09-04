import { useMemo, useState } from 'react';
import { useGame } from '../game/state';
import { Screen } from '../components/Shell';
import { Button, Chip, Icon, Panel, Stamp, Bar } from '../components/primitives';
import { SkillCard, EnemyArt, CandleChart } from '../components/game';
import { ENCOUNTER, ENEMIES, SOURCES, DOMAIN, cardById, enemyById, epochOf, type SourceId } from '../game/data';
import { cn } from '../utils/cn';

type Conf = 'low' | 'mid' | 'high';
const CONF: Record<Conf, { l: string; m: number; c: string }> = { low: { l: 'Низко', m: 0.6, c: '#93A3BC' }, mid: { l: 'Средне', m: 1, c: '#31D6C4' }, high: { l: 'Высоко', m: 1.8, c: '#FF596D' } };

export function ArenaScreen() {
  const { s, epoch, go, dispatch } = useGame();
  const E = ENCOUNTER; const enemy = enemyById(E.enemy);
  const [tab, setTab] = useState<SourceId>('chart');
  const [evidence, setEvidence] = useState<string[]>([]);
  const [cards, setCards] = useState<string[]>([]);
  const [answer, setAnswer] = useState<string | null>(null);
  const [factor, setFactor] = useState<string | null>(null);
  const [conf, setConf] = useState<Conf>('mid');
  const [blind, setBlind] = useState<SourceId | null>(epoch.id !== 'street' ? 'sentiment' : null);
  const [phase, setPhase] = useState<'task' | 'feedback'>('task');
  const [cold, setCold] = useState(false);

  const stackMode = s.level >= 14; const verdictMode = s.level >= 21; const confOn = s.level >= 3;
  const labels = epoch.crutches.labels;
  const opt = E.options.find(o => o.id === answer);
  const canSubmit = !!answer && (!verdictMode || !!factor) && (cold === false || cards.includes('wait'));
  const hasEvidence = evidence.includes(E.requiredEvidence);

  const toggleEvidence = (k: string) => setEvidence(v => v.includes(k) ? v.filter(x => x !== k) : [...v, k].slice(-2));
  const toggleCard = (id: string) => setCards(v => v.includes(id) ? v.filter(x => x !== id) : stackMode ? [...v, id] : [id]);
  const submit = () => { if (opt?.wait) setCold(false); setPhase('feedback'); };

  if (phase === 'feedback') return <Feedback conf={conf} answer={opt!} hasEvidence={hasEvidence} onNext={() => {
    const correct = !!opt?.correct; const mul = CONF[conf].m;
    if (correct) dispatch({ type: 'gainXp', xp: Math.round((hasEvidence ? 60 : 30) * mul), sig: Math.round(12 * mul) });
    else { dispatch({ type: 'budget', delta: -Math.round(4 * mul) }); dispatch({ type: 'journal', entry: { enemy: E.enemy, atom: E.goal, evidence: hasEvidence ? 'улика найдена, вывод неверен' : 'улика не найдена', date: 'сейчас', mutated: false } }); }
    if (s.budget - (correct ? 0 : Math.round(4 * mul)) <= 0) go('leviathan'); else go('warmup');
  }} />;

  return (
    <Screen compact>
      {/* demo controls */}
      <div className="flex items-center justify-between rounded-lg border border-dashed border-strong px-2 py-1">
        <span className="mono text-[9px] text-muted">DEMO · seed {E.seed} · {E.id}</span>
        <div className="flex gap-1">
          <button onClick={() => { const nl = s.level + 8; const changed = epochOf(nl).id !== epoch.id; dispatch({ type: 'levelUp', by: 8 }); if (changed) go('epoch'); }} className="mono rounded border border-line bg-elevated px-2 py-0.5 text-[10px] font-bold accent">LVL+8</button>
          <button onClick={() => dispatch({ type: 'setLevel', level: 4 })} className="mono rounded border border-line bg-elevated px-2 py-0.5 text-[10px] text-sub">L4</button>
        </div>
      </div>

      {/* 1. Question paper */}
      <div className="paper-note r-epoch-sm p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">Задание · {E.asset} · {E.tf}</div>
            <div className="mt-0.5 text-[15px] font-extrabold leading-tight">{E.goal}</div>
          </div>
          <div className="shrink-0"><EnemyArt enemy={enemy} silhouette size={56} stage={E.stage} /></div>
        </div>
        <p className="mt-2 text-[12px] leading-[18px]">{E.situation}</p>
        <div className="mt-2 flex flex-wrap items-center gap-1">
          <span className="text-[9px] font-bold uppercase opacity-60">Нужно:</span>
          {E.cards.map(c => <span key={c} className="rounded border border-ink/30 px-1.5 mono text-[9px] font-bold">{c} {cardById(c).short}{s.ranks[c] === 0 && ' 🔒'}</span>)}
          <span className="ml-auto mono text-[9px] opacity-60">угроза: неизвестна · стадия {['I', 'II', 'III', 'IV'][E.stage - 1]}</span>
        </div>
      </div>

      {/* 2. Browser shell */}
      <Panel className="overflow-hidden" tone="inset">
        <div className="flex border-b border-line bg-surface">
          {E.sources.map(src => {
            const isBlind = blind === src;
            return (
              <button key={src} onClick={() => setTab(src)} className={cn('relative flex h-10 flex-1 items-center justify-center gap-1.5 text-[11px] font-bold uppercase', tab === src ? 'text-txt' : 'text-muted')}>
                {tab === src && <span className="absolute inset-x-2 bottom-0 h-0.5 bg-accent" />}
                <Icon name={isBlind ? 'eyeOff' : SOURCES[src].glyph} size={14} />
                {labels === 'none' || labels === 'false' ? <span className="mono">{SOURCES[src].short}</span> : SOURCES[src].name}
              </button>
            );
          })}
        </div>
        <div className="relative min-h-[170px] p-2">
          {blind === tab ? (
            <div className="flex h-[166px] flex-col items-center justify-center gap-2 text-center">
              <Icon name="eyeOff" size={28} className="text-muted" />
              <div className="label text-sub">Слепой источник · M9</div>
              <p className="max-w-[220px] text-[11px] text-muted">Вкладка закрыта. Открыть — 6 единиц бюджета. {epoch.id === 'terminal' && 'В Терминале она может быть нерелевантна.'}</p>
              <Button size="sm" variant="outline" onClick={() => { setBlind(null); dispatch({ type: 'budget', delta: -6 }); }}>Открыть за −6 <Icon name="shield" size={12} /></Button>
            </div>
          ) : tab === 'chart' ? (
            <div>
              <div className="flex items-center justify-between px-1 mono text-[10px] text-muted"><span>{E.asset} · {E.tf}</span><span>vol avg 1.0× · last 0.6×</span></div>
              <CandleChart candles={E.candles} level={3420} evidenceHighlights={epoch.crutches.evidenceHighlights} highlight={evidence.includes('touch-3')} height={140} />
            </div>
          ) : tab === 'orderbook' ? <OrderBook labels={labels} /> : <Sentiment labels={labels} />}
        </div>
        {/* evidence strip (M1) */}
        <div className="border-t border-line bg-surface p-2">
          <div className="mb-1 flex items-center justify-between"><span className="label text-muted">Улики · M1 {epoch.id === 'terminal' && '(нужно 2)'}</span><span className="mono text-[9px] text-muted">{evidence.length}/2</span></div>
          <div className="flex flex-wrap gap-1">
            {E.evidence.filter(e => e.source === tab).map(e => (
              <Chip key={e.key} onClick={() => toggleEvidence(e.key)} active={evidence.includes(e.key)} color={evidence.includes(e.key) ? epoch.accent : undefined} className={cn('!h-7 !normal-case !tracking-normal', epoch.crutches.evidenceHighlights && e.key === E.requiredEvidence && !evidence.includes(e.key) && 'border-warn/70 text-warn')}>
                <Icon name="target" size={11} />{e.label}
              </Chip>
            ))}
          </div>
        </div>
      </Panel>

      {/* 3. Action cards */}
      <Panel title={stackMode ? 'Карты действий · стек M2' : 'Карты действий'} right={<span className="mono text-[9px] text-muted">{cards.length ? cards.map(c => c.toUpperCase()).join(' → ') : 'выбери'}</span>}>
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-3 pb-3">
          {E.cards.map(id => <SkillCard key={id} card={cardById(id)} rank={s.ranks[id]} compact selected={cards.includes(id)} locked={s.ranks[id] === 0} onClick={() => s.ranks[id] > 0 && toggleCard(id)} />)}
          {s.level >= 81 && <SkillCard card={cardById('C6')} rank={1} compact selected={cards.includes('C6')} onClick={() => toggleCard('C6')} />}
          <SkillCard wait rank={1} compact selected={cards.includes('wait')} onClick={() => { toggleCard('wait'); setCold(false); }} />
        </div>
      </Panel>

      {/* 4. Answer block */}
      <Panel title={verdictMode ? 'Вердикт · M4 · 1) фактор → 2) действие' : E.question}>
        <div className="space-y-1.5 px-3 pb-3">
          {verdictMode && (
            <div className="mb-2 flex gap-1.5">
              {['Объём', 'Сентимент', 'Стакан'].map(f => <Chip key={f} onClick={() => setFactor(f)} active={factor === f} color={factor === f ? epoch.accent : undefined} className="!h-8 flex-1 justify-center">{f}</Chip>)}
            </div>
          )}
          {E.options.map((o, i) => (
            <button key={o.id} onClick={() => { setAnswer(o.id); if (o.wait) setCards(v => v.includes('wait') ? v : [...v, 'wait']); }}
              className={cn('flex min-h-[44px] w-full items-center gap-3 r-epoch-sm border p-2.5 text-left text-[13px] leading-[18px] transition', answer === o.id ? 'border-accent bg-hover' : 'border-line bg-elevated hover:bg-hover', o.wait && 'border-dashed')}>
              <span className={cn('mono flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-xs font-bold', answer === o.id ? 'border-accent accent' : 'border-line text-sub')}>{o.wait ? <Icon name="wait" size={14} /> : ['A', 'B', 'C', 'D'][i]}</span>
              <span className="flex-1">{o.text}</span>
              {labels === 'all' && o.wait && <span className="label !text-[8px] text-muted">M10</span>}
            </button>
          ))}
        </div>
      </Panel>

      {/* Confidence M3 */}
      {confOn && (
        <Panel title="Ставка уверенности · M3" right={<span className="mono text-[9px] text-muted">калибровка {Math.round(s.calibration * 100)}%</span>}>
          <div className="grid grid-cols-3 gap-1.5 px-3 pb-3">
            {(Object.keys(CONF) as Conf[]).map(k => (
              <button key={k} onClick={() => setConf(k)} className={cn('flex h-12 flex-col items-center justify-center r-epoch-sm border transition', conf === k ? 'bg-hover' : 'border-line bg-elevated')} style={conf === k ? { borderColor: CONF[k].c } : undefined}>
                <span className="label" style={{ color: CONF[k].c }}>{CONF[k].l}</span><span className="mono text-[10px] text-sub">×{CONF[k].m}</span>
              </button>
            ))}
          </div>
        </Panel>
      )}

      <div className="sticky bottom-0 -mx-3 border-t border-line bg-bg/95 p-3 backdrop-blur">
        <Button full size="lg" disabled={!canSubmit} onClick={submit}>
          {epoch.crutches.toActionButton && !answer ? 'К решению' : 'Подтвердить'} <Icon name="bolt" size={16} />
        </Button>
        {!hasEvidence && answer && <div className="mt-1 text-center text-[10px] text-warn">Без улики ответ считается необоснованным: неполная награда, враг не побеждён.</div>}
      </div>
    </Screen>
  );
}

function OrderBook({ labels }: { labels: string }) {
  const rows = [3440, 3435, 3430, 3425, 3421, 3419, 3415, 3410, 3405];
  return (
    <div className="mono text-[10px]">
      {labels !== 'none' && labels !== 'false' && <div className="mb-1 label !text-[9px] text-muted">Стакан · плотность заявок</div>}
      {rows.map((p, i) => { const ask = p > 3420; const w = ask ? (p >= 3425 && p <= 3440 ? 70 + (i * 13) % 25 : 20) : 10 + (i * 17) % 30; return (
        <div key={p} className="relative flex h-4 items-center justify-between px-1">
          <div className="absolute inset-y-0.5 right-0 rounded-sm" style={{ width: w + '%', background: ask ? '#FF596D22' : '#3BDE8A22' }} />
          <span className={ask ? 'text-bad' : 'text-good'}>{p}</span><span className="text-sub">{(w * 3.7).toFixed(1)}</span>
        </div>); })}
    </div>
  );
}
function Sentiment({ labels }: { labels: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between"><span className="label !text-[9px] text-muted">{labels === 'false' ? 'Индекс уверенности рынка' : 'Индекс страха и жадности'}</span><span className="mono text-xs font-bold text-warn">82 · ЖАДНОСТЬ</span></div>
      <Bar value={82} max={100} color="#FFB341" h={8} />
      <div className="space-y-1 rounded-lg border border-line bg-surface p-2 text-[11px]">
        <div><b className="text-human">@alpha_signals_vip</b> <span className="text-sub">ПРОБОЙ 3420!!! ЗАХОДИМ х20 🚀🚀 кто не с нами — тот против ликвидности</span></div>
        <div><b className="text-human">@quiet_quant</b> <span className="text-sub">объём на пробое 0.6x. кто покупает — тот и есть объём</span></div>
        <div><b className="text-human">@moon_tomorrow</b> <span className="text-sub">закрыл квартиру, открыл лонг. увидимся на 5000</span></div>
      </div>
      <div className="mono text-[9px] text-muted">упоминания «пробой»: +340% / 1ч</div>
    </div>
  );
}

// ─── Feedback: M6 play-forward → M5 identify → M14 shadow → rewards ────────────
function Feedback({ conf, answer, hasEvidence, onNext }: { conf: Conf; answer: { correct?: boolean; wait?: boolean; errorType?: string; enemy?: string; text: string }; hasEvidence: boolean; onNext: () => void }) {
  const { s, epoch } = useGame();
  const E = ENCOUNTER; const enemy = enemyById(E.enemy);
  const [played, setPlayed] = useState(false);
  const [guess, setGuess] = useState<string | null>(null);
  const ok = !!answer.correct; const wait = !!answer.wait;
  const mul = CONF[conf].m;
  const lineup = useMemo(() => [enemy, ...ENEMIES.filter(e => e.id !== enemy.id && (e.domain === enemy.domain || e.second === enemy.domain)).slice(0, 2)].sort((a, b) => a.id.localeCompare(b.id)), [enemy]);
  const identifyOn = s.level >= 8;
  const shadow = [{ id: 'a', p: 41 }, { id: 'b', p: 27 }, { id: 'c', p: 22 }, { id: 'd', p: 10 }];
  const xp = ok ? Math.round((hasEvidence ? 60 : 30) * mul) : 0;
  const loss = ok ? 0 : Math.round(4 * mul);

  return (
    <div className={cn('flex h-full flex-col bg-bg', !ok && !wait && !played && 'shake')}>
      <header className="flex h-14 items-center justify-between border-b border-line px-4">
        <span className="label text-muted">Обратная связь · {E.id}</span>
        <span className="mono text-[10px]" style={{ color: CONF[conf].c }}>ставка {CONF[conf].l} ×{mul}</span>
      </header>
      <main className="flex-1 space-y-3 overflow-y-auto no-scrollbar p-3">
        {/* verdict banner */}
        <div className={cn('relative overflow-hidden r-epoch border p-4', ok ? 'border-good/50 bg-good/10' : wait ? 'border-warn/50 bg-warn/10' : 'border-bad/50 bg-bad/10')}>
          <div className="text-[22px] font-extrabold uppercase leading-tight">{ok ? 'Прибыль зафиксирована.' : wait ? 'Ты ждал. Рынок — нет.' : 'Рынок принял твоё решение.'}</div>
          <p className="mt-1 text-[12px] text-sub">{ok ? 'Не привыкай. Рынок уже заметил твою самоуверенность.' : wait ? 'Не входить — ответ. Но не преимущество. Награда неполная, враг не побеждён.' : E.feedback.wrong}</p>
          <div className="absolute right-3 top-3"><Stamp text={ok ? 'ВЕРНО' : wait ? 'ЖДАЛ' : 'ПОТЕРЯ'} color={ok ? '#3BDE8A' : wait ? '#FFB341' : '#FF596D'} /></div>
        </div>

        {/* M6 play-forward */}
        <Panel title="График доигрывает · M6" right={!played && <button onClick={() => setPlayed(true)} className="label accent">пропустить</button>}>
          <div className="px-2 pb-2"><CandleChart candles={E.candles} forward={E.forward} playing level={3420} height={130} onDone={() => setPlayed(true)} /></div>
        </Panel>

        {played && (
          <>
            <Panel title="Что было решающим" className="rise">
              <div className="space-y-2 px-3 pb-3 text-[12px] leading-[18px] text-txt">
                <p>{E.feedback.decisive}</p>
                <p className="text-sub"><b className="text-txt">Последствие:</b> {E.feedback.consequence}</p>
                {answer.errorType && <div className="rounded-md border border-bad/40 bg-bad/10 p-2 text-[11px]"><span className="label text-bad">Типовая ошибка</span><br />{answer.errorType} → записано в свиток (M7)</div>}
                {!hasEvidence && <div className="rounded-md border border-warn/40 bg-warn/10 p-2 text-[11px] text-warn">Улика не отмечена: ответ без основания. Правильно — не значит обоснованно.</div>}
              </div>
            </Panel>

            {/* M5 identify */}
            {identifyOn && (
              <Panel title="Опознание врага · M5" right={<span className="mono text-[9px] text-muted">домен: {DOMAIN[enemy.domain].name}</span>} className="rise">
                <div className="grid grid-cols-3 gap-2 px-3 pb-3">
                  {lineup.map(e => (
                    <button key={e.id} onClick={() => !guess && setGuess(e.id)} className={cn('overflow-hidden rounded-xl border-2 transition', guess ? (e.id === enemy.id ? 'border-good' : guess === e.id ? 'border-bad opacity-60' : 'border-line opacity-40') : 'border-line hover:border-accent')}>
                      <EnemyArt enemy={e} size={100} stage={E.stage} className="w-full h-auto" />
                      <div className="truncate px-1 py-1 text-[10px] font-bold uppercase">{e.name}</div>
                    </button>
                  ))}
                </div>
                {guess && <div className="px-3 pb-3 text-[11px] text-sub rise">«{enemy.quote}» — <span className="mono">{enemy.id}</span> {enemy.name}, {enemy.title}. Трофей: стадия {E.stage}/{enemy.stages} {guess === enemy.id ? '— слой добавлен.' : '— опознан неверно, слой не добавлен.'}</div>}
              </Panel>
            )}

            {/* M14 shadow */}
            <Panel title="Тень арены · M14" right={<span className="mono text-[9px] text-muted">n = 1 284</span>} className="rise">
              <div className="space-y-1 px-3 pb-3">
                {shadow.map((r, i) => { const o = E.options[i]; return (
                  <div key={r.id} className="flex items-center gap-2 text-[10px]">
                    <span className={cn('mono w-4 font-bold', o.correct ? 'text-good' : 'text-muted')}>{['A', 'B', 'C', 'D'][i]}</span>
                    <Bar value={r.p} max={50} color={o.correct ? '#3BDE8A' : answer.text === o.text ? epoch.accent : '#344563'} h={8} className="flex-1" />
                    <span className="mono w-8 text-right text-sub">{r.p}%</span>
                  </div>); })}
                <div className="pt-1 text-[10px] text-muted">41% вошли по рынку. Стадо распределило риск между всеми. Твой асинхронный соперник ответил B за 38с.</div>
              </div>
            </Panel>

            {/* rewards */}
            <div className="grid grid-cols-3 gap-2 rise">
              <Reward icon="star" label="XP" value={`+${xp}`} color="#31D6C4" />
              <Reward icon="coin" label="SIG" value={ok ? `+${Math.round(12 * mul)}` : '+0'} color="#FFB341" />
              <Reward icon="shield" label="Бюджет" value={loss ? `−${loss}` : '±0'} color={loss ? '#FF596D' : '#3BDE8A'} />
            </div>
            {s.level >= 28 && ok && <div className="rounded-lg border border-crypto/40 bg-crypto/10 p-2 text-center text-[11px] text-crypto rise">Комбо M8 · C2 + C1 · совместных применений 2/3</div>}
          </>
        )}
      </main>
      <footer className="border-t border-line p-3">
        <Button full size="lg" disabled={!played} onClick={onNext}>Далее → Разминка <Icon name="chevron" size={16} /></Button>
      </footer>
    </div>
  );
}

function Reward({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col items-center r-epoch-sm border border-line bg-surface py-3">
      <Icon name={icon} size={18} style={{ color }} />
      <div className="mono mt-1 text-lg font-bold" style={{ color }}>{value}</div>
      <div className="label !text-[9px] text-muted">{label}</div>
    </div>
  );
}
