'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';

type Json = Record<string, unknown>;
type Task = {
  templateId: string; seed: number; contentVersion: string; question: string; ticker: string; timeframe: string; mode: string; stage: number; enemyDomain: string;
  sources: string[]; blindSource: string | null; answers: { label: string; text: string; isWait?: boolean }[]; evidence: { id: string; source: string; label: string }[];
  skills: string[]; sequenceSlots: number; requiredEvidence: number; coldDelayMs: number; verdict: { factorA: string; factorB: string } | null; learningGoal: string; atoms: string[];
};

const API = '/api/v1';
const mono = 'font-mono text-[11px]';

function useApi(token: string | null, admin: string) {
  return useCallback(async (path: string, init: RequestInit = {}, asAdmin = false) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(init.headers as Record<string, string> ?? {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (asAdmin) headers['X-Admin-Token'] = admin;
    const res = await fetch(API + path, { ...init, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error((data as { message?: string }).message ?? res.statusText), { data, status: res.status });
    return data;
  }, [token, admin]);
}

export default function Console() {
  const [token, setToken] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState('');
  const [admin, setAdmin] = useState('admin-dev-token');
  const [tab, setTab] = useState<'arena' | 'academy' | 'progress' | 'admin' | 'api'>('arena');
  const [status, setStatus] = useState<Json | null>(null);
  const [log, setLog] = useState<{ t: string; m: string; err?: boolean }[]>([]);
  const api = useApi(token, admin);
  const push = (m: string, err = false) => setLog(l => [{ t: new Date().toLocaleTimeString(), m, err }, ...l].slice(0, 40));

  useEffect(() => {
    const d = localStorage.getItem('sa_device') ?? ('dev-' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36));
    localStorage.setItem('sa_device', d); setDeviceId(d);
    const t = localStorage.getItem('sa_token'); if (t) setToken(t);
    fetch(API + '/content/version').then(r => r.json()).then(v => fetch(API + '/config').then(r => r.json()).then(c => setStatus({ content: v.version, config: (c as { version: string }).version }))).catch(() => setStatus({ error: 'API недоступен' }));
  }, []);

  const login = async () => {
    try { const r = await api('/auth/anonymous', { method: 'POST', body: JSON.stringify({ deviceId }) }); setToken(r.token); localStorage.setItem('sa_token', r.token); push(`auth: user ${String(r.user.id).slice(0, 8)} ${r.created ? '(создан)' : '(вход)'}`); }
    catch (e) { push('auth error: ' + (e as Error).message, true); }
  };
  const logout = () => { localStorage.removeItem('sa_token'); localStorage.removeItem('sa_device'); setToken(null); location.reload(); };

  return (
    <div className="min-h-screen bg-[#070B14] text-[#DCE4F2]">
      <header className="border-b border-[#22304A] bg-[#0C1323]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
          <div className="text-lg font-black tracking-widest text-[#31D6C4]">SIGNAL ARENA · aibackend</div>
          <div className={`${mono} text-[#93A3BC]`}>content {String(status?.content ?? '…')} · config {String(status?.config ?? '…')}</div>
          <div className="ml-auto flex items-center gap-2">
            <span className={`${mono} text-[#62708A]`}>device {deviceId.slice(0, 14)}</span>
            {token ? <button onClick={logout} className="rounded border border-[#22304A] px-3 py-1 text-xs hover:bg-[#121B2E]">выйти</button>
              : <button onClick={login} className="rounded bg-[#31D6C4] px-3 py-1 text-xs font-bold text-black">анонимный вход</button>}
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 px-4 pb-2">
          {(['arena', 'academy', 'progress', 'admin', 'api'] as const).map(k => (
            <button key={k} onClick={() => setTab(k)} className={`rounded-t px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${tab === k ? 'bg-[#31D6C4] text-black' : 'text-[#93A3BC] hover:bg-[#121B2E]'}`}>
              {{ arena: 'Арена', academy: 'Академия', progress: 'Прогресс', admin: 'Админ · ИИ', api: 'API' }[k]}
            </button>
          ))}
        </nav>
      </header>
      <main className="mx-auto grid max-w-6xl gap-4 px-4 py-4 lg:grid-cols-[1fr_320px]">
        <section>
          {!token && tab !== 'api' && tab !== 'admin' && <div className="rounded-lg border border-[#22304A] bg-[#0C1323] p-6 text-sm text-[#93A3BC]">Сначала выполните <b className="text-[#31D6C4]">анонимный вход</b> — бэкенд выдаст JWT по device id (ТЗ Часть 6 §5.1 auth).</div>}
          {token && tab === 'arena' && <Arena api={api} push={push} />}
          {token && tab === 'academy' && <Academy api={api} push={push} />}
          {token && tab === 'progress' && <Progress api={api} />}
          {tab === 'admin' && <Admin api={api} push={push} admin={admin} setAdmin={setAdmin} />}
          {tab === 'api' && <ApiDocs />}
        </section>
        <aside className="rounded-lg border border-[#22304A] bg-[#0C1323] p-3">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#62708A]">Журнал запросов</div>
          <div className={`${mono} max-h-[70vh] space-y-1 overflow-auto`}>
            {log.map((l, i) => <div key={i} className={l.err ? 'text-[#FF6B6B]' : 'text-[#93A3BC]'}><span className="text-[#62708A]">{l.t}</span> {l.m}</div>)}
            {!log.length && <div className="text-[#62708A]">пусто</div>}
          </div>
        </aside>
      </main>
    </div>
  );
}

type Api = ReturnType<typeof useApi>;

function Arena({ api, push }: { api: Api; push: (m: string, e?: boolean) => void }) {
  const [task, setTask] = useState<Task | null>(null);
  const [meta, setMeta] = useState<Json | null>(null);
  const [answer, setAnswer] = useState<number | null>(null);
  const [evidence, setEvidence] = useState<string[]>([]);
  const [conf, setConf] = useState<'low' | 'mid' | 'high' | null>(null);
  const [seq, setSeq] = useState<string[]>([]);
  const [verdict, setVerdict] = useState<'A' | 'B' | null>(null);
  const [opened, setOpened] = useState<string[]>([]);
  const [result, setResult] = useState<Json | null>(null);
  const [started, setStarted] = useState(0);
  const [session, setSession] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setBusy(true);
    try {
      if (!session) { const s = await api('/sessions', { method: 'POST', body: '{}' }); setSession(s.session.id); push(`session ${String(s.session.id).slice(0, 8)} · погода ${s.session.weatherMode} · бюджет ${s.riskBudget}`); }
      const r = await api('/tasks/next');
      setTask(r.task); setMeta({ ...r.queueItem, ...r.player }); setAnswer(null); setEvidence([]); setConf(null); setSeq([]); setVerdict(null); setOpened([r.task.sources[0]]); setResult(null); setStarted(Date.now());
      push(`task ${r.task.templateId} seed=${r.task.seed} mode=${r.task.mode} (${r.queueItem.reason})`);
    } catch (e) { push('tasks/next: ' + (e as Error).message, true); }
    setBusy(false);
  };
  const submit = async () => {
    if (!task) return;
    setBusy(true);
    try {
      const body = { clientAttemptId: `c-${task.seed}-${Date.now()}`, sessionId: session, templateId: task.templateId, contentVersion: task.contentVersion, seed: task.seed, answer, evidence, confidence: conf, openedSources: opened, sequence: seq, verdict, blindOpened: !!task.blindSource && opened.includes(task.blindSource), durationMs: Date.now() - started, clientTs: Date.now() };
      const r = await api('/attempts', { method: 'POST', body: JSON.stringify(body) });
      setResult(r);
      push(`attempt → ${r.result} · xp+${r.reward.xp} · бюджет ${r.reward.budgetDelta > 0 ? '+' : ''}${r.reward.budgetDelta} → ${r.progress.riskBudget}${r.flags.length ? ' · flags: ' + r.flags.join(',') : ''}`);
    } catch (e) { push('attempts: ' + (e as Error).message, true); }
    setBusy(false);
  };
  const toggle = (arr: string[], v: string, set: (a: string[]) => void) => set(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
  const canSubmit = task && (task.mode === 'sequence' ? seq.length >= task.sequenceSlots : answer !== null) && (task.mode !== 'verdict' || verdict);

  if (!task) return <div className="rounded-lg border border-[#22304A] bg-[#0C1323] p-6"><p className="mb-3 text-sm text-[#93A3BC]">Сервер выберет следующее задание из очереди планировщика (свиток → стадии → новые карты), сгенерирует экземпляр по seed и вернёт его <b>без пометки верного варианта</b>.</p><button disabled={busy} onClick={load} className="rounded bg-[#31D6C4] px-4 py-2 text-sm font-black text-black disabled:opacity-50">GET /tasks/next</button></div>;

  const res = result as null | { result: string; reveal: { correctAnswer: number; correctEvidence: string[]; enemy: { name: string; id: string; domain: string } | null; missedEvidence: string; identifyOptions: string[]; playForward: { direction: string; outcomePct: number } }; reward: { xp: number; coins: number; budgetDelta: number; enemyDefeated: boolean }; shadow: { distribution: { variant: number; text: string; share: number }[]; crowdBias: string | null; n: number }; progress: Json; flags: string[] };
  return (
    <div className="space-y-3">
      <div className={`flex flex-wrap gap-3 rounded border border-[#22304A] bg-[#0C1323] px-3 py-2 ${mono} text-[#93A3BC]`}>
        <span>L{String(meta?.level)} · {String(meta?.epoch)}</span><span>БЮДЖЕТ {String(meta?.riskBudget)}</span><span>{task.ticker} · {task.timeframe}</span><span>seed {task.seed}</span><span className="text-[#FFB341]">режим {task.mode}</span><span>{String(meta?.itemType)}: {String(meta?.reason)}</span>
      </div>
      <div className="rounded-lg border border-[#22304A] bg-[#0C1323] p-4">
        <div className="mb-1 text-[10px] uppercase tracking-widest text-[#62708A]">1 · Вопрос и условия · цель: {task.learningGoal}</div>
        <div className="text-base font-bold">{task.question}</div>
        <div className={`${mono} mt-1 text-[#62708A]`}>враг: ??? · домен {task.enemyDomain} · стадия {task.stage} · атомы {task.atoms.join(', ')}</div>
      </div>
      <div className="rounded-lg border border-[#22304A] bg-[#0C1323] p-4">
        <div className="mb-2 text-[10px] uppercase tracking-widest text-[#62708A]">2 · Источники (≤3) — тапни вкладку, отметь улики (нужно {task.requiredEvidence})</div>
        <div className="mb-2 flex gap-1">{task.sources.map(s => <button key={s} onClick={() => toggle(opened, s, setOpened)} className={`rounded px-2 py-1 text-xs ${opened.includes(s) ? 'bg-[#22304A]' : 'border border-[#22304A] text-[#62708A]'}`}>{s}{task.blindSource === s ? ' 🔒' : ''}</button>)}</div>
        <div className="grid gap-1 sm:grid-cols-2">{task.evidence.filter(e => opened.includes(e.source)).map(e => <button key={e.id} onClick={() => toggle(evidence, e.id, setEvidence)} className={`rounded border px-2 py-1.5 text-left text-xs ${evidence.includes(e.id) ? 'border-[#31D6C4] bg-[#0F2A2A]' : 'border-[#22304A]'} ${res ? (res.reveal.correctEvidence.includes(e.id) ? 'ring-1 ring-[#3BDE8A]' : '') : ''}`}><span className="text-[#62708A]">[{e.source}]</span> {e.label}</button>)}</div>
      </div>
      <div className="rounded-lg border border-[#22304A] bg-[#0C1323] p-4">
        <div className="mb-2 text-[10px] uppercase tracking-widest text-[#62708A]">3 · Карты действий {task.mode === 'sequence' ? `— выстрой ${task.sequenceSlots} по порядку анализа (M2)` : ''}</div>
        <div className="flex gap-1">{task.skills.map(s => <button key={s} onClick={() => task.mode === 'sequence' && (seq.includes(s) ? setSeq(seq.filter(x => x !== s)) : seq.length < task.sequenceSlots && setSeq([...seq, s]))} className={`rounded border px-3 py-1 text-xs font-bold ${seq.includes(s) ? 'border-[#31D6C4] text-[#31D6C4]' : 'border-[#22304A]'}`}>{s}{seq.includes(s) ? ` #${seq.indexOf(s) + 1}` : ''}</button>)}</div>
      </div>
      <div className="rounded-lg border border-[#22304A] bg-[#0C1323] p-4">
        <div className="mb-2 text-[10px] uppercase tracking-widest text-[#62708A]">4 · Ответ {task.mode === 'verdict' && task.verdict ? '· M4: сначала доминирующий фактор' : ''}</div>
        {task.mode === 'verdict' && task.verdict && <div className="mb-2 flex gap-1">{(['A', 'B'] as const).map(k => <button key={k} onClick={() => setVerdict(k)} className={`rounded border px-3 py-1 text-xs ${verdict === k ? 'border-[#FFB341] text-[#FFB341]' : 'border-[#22304A]'}`}>{k}: {k === 'A' ? task.verdict!.factorA : task.verdict!.factorB}</button>)}</div>}
        {task.mode !== 'sequence' && <div className="grid gap-1 sm:grid-cols-2">{task.answers.map((a, i) => <button key={i} onClick={() => !res && setAnswer(i)} className={`rounded border px-3 py-2 text-left text-sm ${answer === i ? 'border-[#31D6C4] bg-[#0F2A2A]' : 'border-[#22304A]'} ${res && res.reveal.correctAnswer === i ? 'ring-2 ring-[#3BDE8A]' : ''}`}><b>{a.label}</b> {a.text}{a.isWait ? ' ⧖' : ''}</button>)}</div>}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#62708A]">M3 ставка:</span>{(['low', 'mid', 'high'] as const).map(k => <button key={k} onClick={() => setConf(k)} className={`rounded border px-2 py-1 text-xs ${conf === k ? 'border-[#B783FF] text-[#B783FF]' : 'border-[#22304A]'}`}>{k}</button>)}
          <button disabled={!canSubmit || busy || !!res} onClick={submit} className="ml-auto rounded bg-[#31D6C4] px-4 py-2 text-sm font-black text-black disabled:opacity-40">POST /attempts</button>
          {res && <button onClick={load} className="rounded border border-[#22304A] px-4 py-2 text-sm">Далее →</button>}
        </div>
      </div>
      {res && (
        <div className={`rounded-lg border p-4 ${res.result === 'correct' ? 'border-[#3BDE8A]' : res.result === 'wrong' ? 'border-[#FF6B6B]' : 'border-[#FFB341]'} bg-[#0C1323]`}>
          <div className="text-lg font-black">{res.result === 'correct' ? 'ВЕРНО, С УЛИКОЙ' : res.result === 'correct_unfounded' ? 'ВЕРНО, НО НЕОБОСНОВАННО (M1)' : 'ОШИБКА'}</div>
          <div className={`${mono} mt-1 text-[#93A3BC]`}>M5 опознание: это был <b className="text-[#DCE4F2]">{res.reveal.enemy?.name}</b> ({res.reveal.enemy?.id}) · M6 play-forward: {res.reveal.playForward.direction} {res.reveal.playForward.outcomePct}% · упущено: {res.reveal.missedEvidence || '—'}</div>
          <div className={`${mono} mt-1`}>XP +{res.reward.xp} · SIG +{res.reward.coins} · бюджет {res.reward.budgetDelta} → {String(res.progress.riskBudget)} · L{String(res.progress.level)} {res.progress.levelUp ? '⬆ LEVEL UP' : ''} {res.progress.scrollAdded ? '· запись в свиток (M7)' : ''} {(res.progress.combosUnlocked as string[]).length ? '· комбо ' + (res.progress.combosUnlocked as string[]).join(',') : ''} {res.progress.stageWon ? '· стадия побеждена (M12)' : ''} {res.progress.leviathan ? '· ⚠ LEVIATHAN' : ''}</div>
          <div className="mt-2 text-[10px] uppercase tracking-widest text-[#62708A]">M14 тень арены · n={res.shadow.n} {res.shadow.crowdBias ? `· искажение толпы: ${res.shadow.crowdBias}` : ''}</div>
          <div className="mt-1 space-y-1">{res.shadow.distribution.map(d => <div key={d.variant} className="flex items-center gap-2 text-xs"><div className="h-2 rounded bg-[#31D6C4]" style={{ width: `${Math.max(2, d.share * 200)}px` }} /><span className="text-[#93A3BC]">{Math.round(d.share * 100)}% · {d.text}</span></div>)}</div>
          {res.flags.length > 0 && <div className={`${mono} mt-2 text-[#FF6B6B]`}>антифрод-флаги: {res.flags.join(', ')}</div>}
        </div>
      )}
    </div>
  );
}

function Academy({ api, push }: { api: Api; push: (m: string, e?: boolean) => void }) {
  const [data, setData] = useState<Json | null>(null);
  const [lesson, setLesson] = useState<Json | null>(null);
  const load = useCallback(() => api('/academy/chapters').then(setData).catch(e => push('academy: ' + e.message, true)), [api, push]);
  useEffect(() => { load(); }, [load]);
  const open = async (id: string) => { try { setLesson(await api(`/academy/chapters/${id}`)); } catch (e) { push('lesson: ' + (e as Error).message, true); } };
  const answerMc = async (cardId: string, atomId: string, seed: number, answer: number) => {
    try { const r = await api('/academy/microcheck', { method: 'POST', body: JSON.stringify({ cardId, atomId, seed, answer }) }); push(`microcheck ${atomId}: ${r.correct ? 'верно' : 'неверно'}${r.cardGranted ? ' · КАРТА ВЫДАНА' : ''}${r.rankUp ? ' · ранг ' + r.rank : ''}`); await open(cardId); load(); }
    catch (e) { push('microcheck: ' + (e as Error).message, true); }
  };
  const chapters = (data?.chapters ?? []) as { id: string; name: string; unlockLevel: number; unlocked: boolean; rank: number; atoms: { done: boolean }[]; domain: string }[];
  const atoms = (lesson?.atoms ?? []) as { id: string; desc: string; done: boolean; microcheck: { seed: number; question: string; options: string[] } }[];
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="space-y-1">{chapters.map(c => <button key={c.id} disabled={!c.unlocked} onClick={() => open(c.id)} className={`flex w-full items-center gap-2 rounded border border-[#22304A] bg-[#0C1323] px-3 py-2 text-left text-xs disabled:opacity-40 ${lesson?.cardId === c.id ? 'ring-1 ring-[#31D6C4]' : ''}`}><span className="w-8 font-black text-[#31D6C4]">{c.id}</span><span className="flex-1">{c.name}</span><span className={`${mono} text-[#62708A]`}>L{c.unlockLevel} · ранг {c.rank} · {c.atoms.filter(a => a.done).length}/{c.atoms.length}</span></button>)}</div>
      <div className="rounded-lg border border-[#22304A] bg-[#0C1323] p-3">
        {!lesson ? <div className="text-xs text-[#62708A]">Выбери открытую главу. Микро-проверки валидируются сервером по seed; верный ответ осваивает атом → карта/ранг.</div> : (
          <div className="space-y-3">
            <div className="font-black">{String(lesson.name)} · ранг {String(lesson.rank)}</div>
            {atoms.map(a => <div key={a.id} className="rounded border border-[#22304A] p-2">
              <div className="text-xs"><b className="text-[#31D6C4]">{a.id}</b> {a.desc} {a.done && <span className="text-[#3BDE8A]">✓ освоен</span>}</div>
              {!a.done && <><div className="mt-1 text-[11px] text-[#93A3BC]">{a.microcheck.question}</div><div className="mt-1 space-y-1">{a.microcheck.options.map((o, i) => <button key={i} onClick={() => answerMc(String(lesson.cardId), a.id, a.microcheck.seed, i)} className="block w-full rounded border border-[#22304A] px-2 py-1 text-left text-[11px] hover:bg-[#121B2E]">{i + 1}. {o}</button>)}</div></>}
            </div>)}
          </div>
        )}
      </div>
    </div>
  );
}

function Progress({ api }: { api: Api }) {
  const [p, setP] = useState<Json | null>(null);
  const [w, setW] = useState<Json | null>(null);
  useEffect(() => { api('/progress').then(setP).catch(() => null); api('/warmup').then(setW).catch(() => null); }, [api]);
  if (!p) return <div className="text-xs text-[#62708A]">загрузка…</div>;
  const cal = p.calibration as { n: number; predicted: number; actual: number; verdict: string };
  const enemiesList = (p.enemies as { id: string; name: string; domain: string; stageReached: number; encounters: number; nextStage: { available: boolean; reasons: string[] } | null }[]).filter(e => e.encounters > 0 || e.nextStage?.available);
  return (
    <div className="space-y-3 text-xs">
      <div className={`grid grid-cols-2 gap-2 sm:grid-cols-4 ${mono}`}>{[['уровень', p.level], ['эпоха', p.epoch], ['XP', `${p.xp}/${p.xpMax}`], ['SIG', p.coins], ['бюджет риска', `${p.riskBudget}/${p.maxBudget}`], ['стрик', p.streak], ['калибровка', `${cal.verdict} (n=${cal.n})`], ['тильт/hubris', `${p.tiltStreak}/${p.hubrisStreak}`]].map(([k, v]) => <div key={String(k)} className="rounded border border-[#22304A] bg-[#0C1323] p-2"><div className="text-[#62708A]">{String(k)}</div><div className="text-sm font-bold">{String(v)}</div></div>)}</div>
      <div className="rounded-lg border border-[#22304A] bg-[#0C1323] p-3"><div className="mb-1 text-[10px] uppercase tracking-widest text-[#62708A]">Разминка дня (M13) · погода {String(w?.weather ?? '…')} {w?.weatherRevealed ? '(названа)' : '(определить самому)'}</div><div className={`${mono} space-y-0.5`}>{((w?.items ?? []) as { templateId: string; seed: number; reason: string }[]).map(i => <div key={i.templateId + i.seed}>{i.templateId} · seed {i.seed} · {i.reason}</div>)}</div></div>
      <div className="rounded-lg border border-[#22304A] bg-[#0C1323] p-3"><div className="mb-1 text-[10px] uppercase tracking-widest text-[#62708A]">Свиток ошибок (M7)</div>{((p.errorScroll ?? []) as { id: string; enemy: string; atom: string; missedEvidence: string; mutationDepth: number }[]).map(e => <div key={e.id} className={mono}>{e.enemy} · {e.atom} · упущено: {e.missedEvidence} · глубина {e.mutationDepth}</div>) || null}{!(p.errorScroll as unknown[]).length && <div className="text-[#62708A]">пусто</div>}</div>
      <div className="rounded-lg border border-[#22304A] bg-[#0C1323] p-3"><div className="mb-1 text-[10px] uppercase tracking-widest text-[#62708A]">Враги / кампания (M12)</div>{enemiesList.map(e => <div key={e.id} className={mono}>{e.id} {e.name} · {e.domain} · стадия {e.stageReached} · встреч {e.encounters} · след.: {e.nextStage ? (e.nextStage.available ? 'доступна' : e.nextStage.reasons.join(' ')) : '—'}</div>)}</div>
      <div className="rounded-lg border border-[#22304A] bg-[#0C1323] p-3"><div className="mb-1 text-[10px] uppercase tracking-widest text-[#62708A]">Комбо (M8)</div><div className="flex flex-wrap gap-1">{(p.combos as { id: string; name: string; count: number; need: number; unlocked: boolean }[]).map(k => <span key={k.id} className={`rounded border px-1.5 py-0.5 ${k.unlocked ? 'border-[#3BDE8A] text-[#3BDE8A]' : k.count ? 'border-[#FFB341]' : 'border-[#22304A] text-[#62708A]'}`}>{k.id} {k.count}/{k.need}</span>)}</div></div>
    </div>
  );
}

function Admin({ api, push, admin, setAdmin }: { api: Api; push: (m: string, e?: boolean) => void; admin: string; setAdmin: (s: string) => void }) {
  const [st, setSt] = useState<Json | null>(null);
  const [auto, setAuto] = useState<Json | null>(null);
  const [drafts, setDrafts] = useState<Json[]>([]);
  const [gen, setGen] = useState<Json | null>(null);
  const [req, setReq] = useState({ enemyId: 'E02', stage: 1, variants: 2, provider: 'auto' });
  const [an, setAn] = useState<Json | null>(null);
  const refresh = useCallback(async () => { try { setSt(await api('/admin/status', {}, true)); setDrafts((await api('/admin/ai/drafts', {}, true)).drafts); } catch (e) { push('admin: ' + (e as Error).message, true); } }, [api, push]);
  useEffect(() => { refresh(); }, [refresh]);
  const run = async (fn: () => Promise<void>) => { try { await fn(); } catch (e) { push('admin: ' + (e as Error).message + (((e as { data?: { details?: unknown } }).data?.details) ? ' ' + JSON.stringify((e as { data: { details: unknown } }).data.details).slice(0, 200) : ''), true); } };
  const ai = st?.ai as { provider: string; model: string; configured: boolean } | undefined;
  const autoG = auto?.global as { name: string; ok: boolean; details: string[] }[] | undefined;
  const genRes = gen?.results as { id: string; templateId?: string; status: string; ok?: boolean; checks?: { name: string; ok: boolean; details: string[] }[]; bots?: { blind: number; random: number; memorizing: number; heuristic: number } }[] | undefined;
  return (
    <div className="space-y-3 text-xs">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[#22304A] bg-[#0C1323] p-3">
        <span className="text-[#62708A]">X-Admin-Token</span><input value={admin} onChange={e => setAdmin(e.target.value)} className="rounded border border-[#22304A] bg-[#070B14] px-2 py-1 font-mono" /><button onClick={refresh} className="rounded border border-[#22304A] px-2 py-1">обновить</button>
        {st && <span className={`${mono} ml-auto text-[#93A3BC]`}>users {String((st.stats as Json).users)} · attempts {String((st.stats as Json).attempts)} · templates {String((st.stats as Json).templates)} · LLM: {ai?.configured ? `${ai.provider}/${ai.model}` : 'нет ключа → synthetic'}</span>}
      </div>
      <div className="rounded-lg border border-[#22304A] bg-[#0C1323] p-3">
        <div className="mb-2 flex items-center gap-2"><b>Автотест полноты (Часть 4 §8) + боты</b><button onClick={() => run(async () => setAuto(await api('/admin/autotest', {}, true)))} className="rounded bg-[#31D6C4] px-2 py-1 font-bold text-black">GET /admin/autotest</button>{auto && <span className={auto.ok ? 'text-[#3BDE8A]' : 'text-[#FFB341]'}>{auto.ok ? 'всё зелёное' : `провалов: шаблоны ${String((auto.summary as Json).templateFailures)}, глобальные ${String((auto.summary as Json).globalFailures)}`}</span>}</div>
        {autoG && <div className={`${mono} space-y-0.5`}>{autoG.map(g => <div key={g.name}><span className={g.ok ? 'text-[#3BDE8A]' : 'text-[#FF6B6B]'}>{g.ok ? '✓' : '✗'}</span> {g.name} {g.details.slice(0, 3).join('; ')}{g.details.length > 3 ? ` … +${g.details.length - 3}` : ''}</div>)}
          {(auto!.perTemplate as { templateId: string; checks: { name: string; ok: boolean; details: string[] }[] }[]).map(t => <div key={t.templateId}><span className={t.checks.every(c => c.ok) ? 'text-[#3BDE8A]' : 'text-[#FF6B6B]'}>{t.checks.every(c => c.ok) ? '✓' : '✗'}</span> {t.templateId}: {t.checks.filter(c => !c.ok).map(c => `${c.name}(${c.details.join(',')})`).join(' ') || 'ok'} · боты {t.checks.find(c => c.name === 'bots')?.ok ? 'ok' : 'FAIL'}</div>)}</div>}
      </div>
      <div className="rounded-lg border border-[#22304A] bg-[#0C1323] p-3">
        <div className="mb-2 font-bold">ИИ-конвейер: LLM → Zod → автотест → боты → редактор → публикация</div>
        <div className="flex flex-wrap items-center gap-2">
          <input value={req.enemyId} onChange={e => setReq({ ...req, enemyId: e.target.value })} className="w-16 rounded border border-[#22304A] bg-[#070B14] px-2 py-1 font-mono" />
          <select value={req.stage} onChange={e => setReq({ ...req, stage: Number(e.target.value) })} className="rounded border border-[#22304A] bg-[#070B14] px-2 py-1">{[1, 2, 3, 4].map(s => <option key={s} value={s}>S{s}</option>)}</select>
          <select value={req.variants} onChange={e => setReq({ ...req, variants: Number(e.target.value) })} className="rounded border border-[#22304A] bg-[#070B14] px-2 py-1">{[1, 2, 3].map(s => <option key={s} value={s}>{s} вар.</option>)}</select>
          <select value={req.provider} onChange={e => setReq({ ...req, provider: e.target.value })} className="rounded border border-[#22304A] bg-[#070B14] px-2 py-1"><option value="auto">auto</option><option value="openai">openai</option><option value="synthetic">synthetic</option></select>
          <button onClick={() => run(async () => { const r = await api('/admin/ai/drafts', { method: 'POST', body: JSON.stringify(req) }, true); setGen(r); push(`ai drafts: ${r.provider} → ${r.results.length} шт.`); refresh(); })} className="rounded bg-[#B783FF] px-2 py-1 font-bold text-black">POST /admin/ai/drafts</button>
        </div>
        {genRes && <div className={`${mono} mt-2 space-y-1`}>{genRes.map(r => <div key={r.id} className="rounded border border-[#22304A] p-2"><span className={r.ok ? 'text-[#3BDE8A]' : 'text-[#FF6B6B]'}>{r.status}</span> {r.templateId ?? 'invalid'} · боты: {r.bots ? `blind ${r.bots.blind} random ${r.bots.random} memo ${r.bots.memorizing} heur ${r.bots.heuristic}` : '—'}<div className="text-[#62708A]">{r.checks?.filter(c => !c.ok).map(c => `${c.name}: ${c.details.join(', ')}`).join(' · ') || 'все проверки ok'}</div></div>)}</div>}
        <div className="mt-2 text-[10px] uppercase tracking-widest text-[#62708A]">Черновики</div>
        <div className={`${mono} space-y-0.5`}>{drafts.map(d => <div key={String(d.id)} className="flex items-center gap-2"><span className={d.status === 'published' ? 'text-[#3BDE8A]' : d.status === 'rejected' ? 'text-[#FF6B6B]' : 'text-[#FFB341]'}>{String(d.status)}</span><span>{String(d.templateId)}</span><span className="text-[#62708A]">{String(d.provider)}</span>
          {d.status !== 'published' && d.status !== 'rejected' && <><button onClick={() => run(async () => { await api(`/admin/ai/drafts/${d.id}/review`, { method: 'POST', body: JSON.stringify({ action: 'publish', note: 'ok' }) }, true); push(`published ${d.templateId}`); refresh(); })} className="rounded border border-[#3BDE8A] px-1.5 text-[#3BDE8A]">publish</button><button onClick={() => run(async () => { await api(`/admin/ai/drafts/${d.id}/review`, { method: 'POST', body: JSON.stringify({ action: 'reject' }) }, true); refresh(); })} className="rounded border border-[#FF6B6B] px-1.5 text-[#FF6B6B]">reject</button></>}</div>)}{!drafts.length && <div className="text-[#62708A]">нет</div>}</div>
      </div>
      <div className="rounded-lg border border-[#22304A] bg-[#0C1323] p-3">
        <div className="mb-2 flex items-center gap-2"><b>Аналитика (витрины)</b><button onClick={() => run(async () => setAn(await api('/admin/analytics', {}, true)))} className="rounded border border-[#22304A] px-2 py-1">GET /admin/analytics</button><button onClick={() => run(async () => { const t = await api('/admin/tournaments', { method: 'POST', body: JSON.stringify({ name: 'Weekly ' + new Date().toISOString().slice(0, 10), durationHours: 48, size: 6 }) }, true); push('tournament ' + t.id); })} className="rounded border border-[#22304A] px-2 py-1">создать турнир</button></div>
        {an && <pre className={`${mono} max-h-64 overflow-auto text-[#93A3BC]`}>{JSON.stringify({ totals: an.totals, byAtom: an.byAtom, sessionsEnd: an.sessionsEnd }, null, 1)}</pre>}
      </div>
    </div>
  );
}

function ApiDocs() {
  const rows = useMemo(() => [
    ['POST', '/auth/anonymous', '—', 'device id → JWT (анонимный старт)'], ['GET', '/me', 'user', 'краткий профиль'], ['GET', '/content', '—', 'пакет контента (ETag), без верных ответов'], ['GET', '/config', '—', 'конфиг по версии/сегменту (ETag)'],
    ['GET', '/seeds/daily', 'user', 'seed на 3 дня вперёд + погода'], ['GET', '/schedule', 'user', 'серверная очередь повторений'], ['GET', '/warmup', 'user', 'разминка дня (M13)'], ['GET', '/tasks/next', 'user', 'следующий экземпляр задания (публичный)'], ['GET', '/tasks/:templateId?seed=', 'user', 'экземпляр по шаблону/seed'],
    ['POST', '/attempts', 'user', 'валидация по seed, скоринг, прогресс, тень'], ['POST', '/attempts/batch', 'user', 'офлайн-очередь (идемпотентно по clientAttemptId)'], ['GET', '/progress', 'user', 'карты/ранги, враги, комбо, свиток, калибровка'],
    ['GET', '/academy/chapters', 'user', 'главы и атомы'], ['GET', '/academy/chapters/:cardId', 'user', 'урок с микро-проверками'], ['POST', '/academy/microcheck', 'user', 'ответ → атом → карта/ранг'],
    ['POST', '/sessions', 'user', 'старт сессии (бюджет риска)'], ['POST', '/sessions/:id/end', 'user', 'завершение сессии'], ['GET', '/shadow/:templateId', 'user', 'распределение ответов (M14)'],
    ['GET', '/tournaments', '—', 'список'], ['POST', '/tournaments/:id/join', 'user', 'seed-набор в окне, одно устройство'], ['GET', '/tournaments/:id/leaderboard', '—', 'таблица + тень выше по рейтингу'],
    ['POST', '/analytics/events', 'user', 'события аналитики'], ['POST', '/billing/purchase', 'user', 'косметика/premium за SIG (вне engine)'],
    ['GET', '/admin/status', 'admin', 'статус'], ['GET', '/admin/autotest', 'admin', 'автотест пакета'], ['GET', '/admin/preview/:templateId', 'admin', '5 мутаций шаблона'], ['POST', '/admin/config', 'admin', 'публикация конфига'], ['GET', '/admin/analytics', 'admin', 'витрины'], ['POST', '/admin/tournaments', 'admin', 'создать турнир'],
    ['POST', '/admin/ai/drafts', 'admin', 'LLM-черновики шаблонов'], ['GET', '/admin/ai/drafts', 'admin', 'список черновиков'], ['POST', '/admin/ai/drafts/:id/review', 'admin', 'approve / reject / publish'],
  ], []);
  return <div className="rounded-lg border border-[#22304A] bg-[#0C1323] p-3"><div className="mb-2 text-sm font-bold">REST API v1 · база <code className="text-[#31D6C4]">/api/v1</code> · документация: <code>aibackend/README.md</code></div><table className={`w-full ${mono}`}><tbody>{rows.map(r => <tr key={r[0] + r[1]} className="border-t border-[#22304A]"><td className="py-1 pr-2 font-bold text-[#FFB341]">{r[0]}</td><td className="pr-2 text-[#DCE4F2]">{r[1]}</td><td className="pr-2 text-[#62708A]">{r[2]}</td><td className="text-[#93A3BC]">{r[3]}</td></tr>)}</tbody></table></div>;
}
