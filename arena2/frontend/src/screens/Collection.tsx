import { useState } from 'react';
import { useGame } from '../game/state';
import { Screen } from '../components/Shell';
import { Bar, Chip, Headline, Icon, Panel } from '../components/primitives';
import { SkillCard, EnemyArt } from '../components/game';
import { CARDS, DOMAIN, TROPHIES, enemyById, type Domain } from '../game/data';
import { cn } from '../utils/cn';

export function CollectionScreen() {
  const { s, epoch } = useGame();
  const [tab, setTab] = useState<'cards' | 'trophies' | 'combos'>('cards');
  const [filter, setFilter] = useState<Domain | null>(null);
  const owned = CARDS.filter(c => s.ranks[c.id] > 0).length;
  const list = CARDS.filter(c => !filter || c.domain === filter);
  const defeated = TROPHIES.filter(t => t.stage > 0).length;

  return (
    <Screen>
      <Headline kicker={`Коллекция · Эпоха ${epoch.num}`} title="Что ты уже знаешь" sub={`${owned}/17 карт · ${defeated}/33 врагов опознано · калибровка ставки ${Math.round(s.calibration * 100)}%`} />
      <div className="grid grid-cols-3 gap-1 rounded-xl border border-line bg-surface p-1">
        {(['cards', 'trophies', 'combos'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('h-9 rounded-lg text-[11px] font-bold uppercase tracking-wide transition', tab === t ? 'bg-elevated text-txt glow' : 'text-muted')}>{t === 'cards' ? 'Карты' : t === 'trophies' ? 'Трофеи' : 'Комбо'}</button>
        ))}
      </div>

      {tab === 'cards' && (
        <>
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            <Chip onClick={() => setFilter(null)} active={!filter}>Все</Chip>
            {(Object.keys(DOMAIN) as Domain[]).map(d => <Chip key={d} onClick={() => setFilter(filter === d ? null : d)} active={filter === d} color={DOMAIN[d].color}>{DOMAIN[d].name}</Chip>)}
          </div>
          <div className="grid grid-cols-3 justify-items-center gap-y-3 gap-x-1">
            {list.map(c => <div key={c.id} className="flex flex-col items-center gap-1"><SkillCard card={c} rank={s.ranks[c.id]} locked={s.ranks[c.id] === 0} className="!w-[108px] !h-[156px]" /><span className="mono text-[9px] text-muted">{s.ranks[c.id] ? `ранг ${['', 'I', 'II', 'III'][s.ranks[c.id]]}` : `L${c.unlock}`}</span></div>)}
          </div>
          <Panel title="Ранги = рамка" className="text-[11px] text-sub"><div className="px-3 pb-3">Серебро I → синий II → золото III. Ранг растёт от освоенных атомов главы. Арена может требовать ранг, а не просто карту. Новых элементов интерфейса — нет.</div></Panel>
        </>
      )}

      {tab === 'trophies' && (
        <>
          <div className="grid grid-cols-2 gap-2">
            {TROPHIES.map(t => { const e = enemyById(t.enemy); const known = t.stage > 0; return (
              <div key={t.enemy} className="relative overflow-hidden r-epoch border border-line bg-surface p-2">
                <div className="mx-auto w-fit rounded-full border-4 p-0.5" style={{ borderColor: known ? DOMAIN[e.domain].color + (t.stage === t.total ? 'ff' : '66') : '#22304A' }}>
                  <div className="overflow-hidden rounded-full"><EnemyArt enemy={e} size={88} silhouette={!known} stage={Math.max(1, t.stage)} rim={false} /></div>
                </div>
                <div className="mt-2 text-center">
                  <div className="truncate text-[11px] font-bold uppercase">{known ? e.name : '???'}</div>
                  <div className="mono text-[9px] text-muted">{e.id} · {DOMAIN[e.domain].short}{e.second ? ` +${DOMAIN[e.second].short}` : ''}</div>
                  <div className="mt-1 flex justify-center gap-0.5">{Array.from({ length: t.total }).map((_, i) => <span key={i} className="h-1.5 w-4 rounded-sm" style={{ background: i < t.stage ? DOMAIN[e.domain].color : '#22304A' }} />)}</div>
                  <div className="mt-0.5 mono text-[9px] text-sub">стадия {t.stage}/{t.total}</div>
                </div>
                {t.stage === t.total && <span className="absolute right-1.5 top-1.5 text-warn"><Icon name="trophy" size={14} /></span>}
              </div>); })}
          </div>
          <Panel title="Трофей = слои одного мастера"><div className="px-3 pb-3 text-[11px] text-sub">S1 — мастер-поза. S2 — +предмет. S3 — второй домен и рим-свет в чужой палитре. S4 — арена-фон и трещины. Одна поза на всех стадиях.</div></Panel>
        </>
      )}

      {tab === 'combos' && (
        <>
          <Panel title="Калибровка ставки · M3">
            <div className="space-y-2 px-3 pb-3">
              <div className="flex items-center justify-between text-[11px]"><span className="text-sub">Уверен «высоко» и прав</span><span className="mono font-bold text-good">71%</span></div>
              <Bar value={71} max={100} color="#3BDE8A" />
              <div className="flex items-center justify-between text-[11px]"><span className="text-sub">Уверен «высоко» и ошибся (hubris)</span><span className="mono font-bold text-bad">29%</span></div>
              <Bar value={29} max={100} color="#FF596D" />
              <div className="text-[10px] text-muted">Самоуверенность — не черта. Это статистика. Рынок её видит первым.</div>
            </div>
          </Panel>
          <Panel title="Комбо · M8 · N=3 совместных применений">
            <div className="space-y-1.5 px-3 pb-3">
              {[['K01', 'C1 + C2', 'Свечи × Уровни', 3, 3, true], ['K04', 'C2 + C4', 'Уровни × Риск', 1, 3, false], ['K07', 'C4 + C5', 'Риск × Психология', 0, 3, false], ['T01', 'C1 + C2 + C4', 'Тройка новичка', 0, 3, false]].map(([id, cards, name, n, max, done]) => (
                <div key={id as string} className="flex items-center gap-3 rounded-lg border border-line bg-elevated p-2">
                  <span className={cn('mono text-[10px] font-bold', done ? 'accent' : 'text-muted')}>{id as string}</span>
                  <div className="flex-1"><div className="text-[12px] font-semibold">{name as string}</div><div className="mono text-[9px] text-muted">{cards as string}</div></div>
                  <div className="flex gap-0.5">{Array.from({ length: max as number }).map((_, i) => <span key={i} className="h-2 w-2 rounded-full" style={{ background: i < (n as number) ? 'var(--accent)' : '#22304A' }} />)}</div>
                </div>
              ))}
              <div className="text-[10px] text-muted">Двойки — с L28. Тройки — в Терминале. Стадии S3–S4 требуют комбо.</div>
            </div>
          </Panel>
        </>
      )}
    </Screen>
  );
}
