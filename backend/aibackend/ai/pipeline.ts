// Контент-конвейер с ИИ (ТЗ Часть 6 §7): LLM-генератор → Zod → автотест + боты → редактор → публикация
// ИИ не определяет учебные цели, не меняет атомы/стадии/конфиг. Он масштабирует шаблоны внутри спецификации.
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { templateDrafts } from '../db/schema';
import { TemplateSchema, type TemplateDraft } from '../schemas';
import { cardById, cards } from '../content/cards';
import { enemyById, enemies } from '../content/enemies';
import { combos } from '../content/combos';
import { sources } from '../content/sources';
import { synthTemplate } from '../content/templates';
import { autotestTemplate, runBots } from '../engine/autotest';
import { mutate } from '../engine/mutator';
import { SeededRng, hashString } from '../engine/rng';
import { ApiError } from '../http';
import { getContentPackage, invalidateContentCache } from '../services/content';
import type { z } from 'zod';
import type { AiDraftRequestSchema } from '../schemas';

type DraftRequest = z.infer<typeof AiDraftRequestSchema>;

export function aiStatus() {
  return {
    provider: process.env.OPENAI_API_KEY ? 'openai' : 'synthetic',
    model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
    baseUrl: process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
    configured: !!process.env.OPENAI_API_KEY,
  };
}

const EPOCH_TONE: Record<string, string> = {
  street: 'резкий уличный тон, короткие фразы, второе лицо, без жаргона трейдеров',
  cabinet: 'спокойный деловой тон, термины поясняются контекстом',
  terminal: 'сухой терминальный тон, цифры и факты, минимум эмоций',
  system: 'нейтральный системный тон, формулировки как в торговом журнале',
};

/** Спецификация для LLM: только данные ТЗ, без правил игры и без «верных ответов» из других шаблонов. */
export function buildPrompt(req: DraftRequest) {
  const enemy = enemyById[req.enemyId];
  const stage = enemy?.stages.find(s => s.stage === req.stage);
  if (!enemy || !stage) throw new ApiError(404, 'stage_not_found');
  const stageCards = stage.requiredCards.map(rc => cardById[rc.cardId]).filter(Boolean);
  const atoms = req.atoms?.length ? req.atoms : stageCards.flatMap(c => c.atoms.map(a => a.id)).slice(0, 2);
  const allowedSources = [...new Set(stageCards.flatMap(c => [...c.mandatorySources, ...c.optionalSources]))];
  const errorTypes = ['FOMO', 'Leverage', 'Revenge', 'PaperHands', 'IndicatorCult', 'Narrative', 'HeadlineTitan', 'ApprovalLeech', 'oversize', 'under-risk', 'signal-group', 'no-stop', 'averaging-down', 'chasing'];
  const sameDomain = enemies.filter(e => e.domain === enemy.domain && e.id !== enemy.id).map(e => e.id);
  const system = `Ты — генератор учебных шаблонов заданий для образовательной игры о крипто-трейдинге. Отвечай ТОЛЬКО валидным JSON-объектом по схеме, без пояснений и markdown.
Правила (нарушение = отклонение):
1) Вопрос описывает рыночную ситуацию и учебную задачу; НЕ содержит слов из названия врага «${enemy.name}» и не подсказывает ответ.
2) Ровно 4 варианта: 1 верный, 2 типовые ошибки с errorType и enemyHint (враг того же домена: ${[enemy.id, ...sameDomain].join(', ')}), 1 вариант формы «ждать/не входить» с isWait=true (он может быть верным только если это следует из учебной цели).
3) Улики (evidence): у верного варианта минимум одна зона isCorrect=true; зоны только в источниках задания; дистракторные улики isCorrect=false.
4) Источники: не более 3 и только из: ${allowedSources.join(', ')}. Обязательные для стадии: ${stage.sources.join(', ')}.
5) Числа в уликах пиши как в примерах: «Объём 2.1K», «40%», «2000», «20» — они мутируются генератором.
5a) У КАЖДОГО варианта заполни answerPool — 3–4 альтернативные формулировки того же смысла (ось мутации «формулировка»): между мутациями текст не должен совпадать.
6) Тон: ${EPOCH_TONE[req.epoch ?? 'street']}. Язык — русский.`;
  const user = {
    schema: {
      id: 'string, формат AI-Exx-Sn-XXXX (латиница, цифры, дефис)', learningGoal: 'string', atoms: atoms, enemyId: enemy.id, stage: stage.stage,
      sources: 'string[] (<=3)', questionPool: 'string[] 2-4 формулировки', answers: '[{label:"A|B|C|D", text, answerPool: string[3-4], isWait?, errorType?, enemyHint?}] x4',
      correct: 'index 0..3', evidence: '[{id:"ev-...", source, label, isCorrect, hint?}]', skills: stageCards.map(c => c.id), domain: enemy.domain,
      verdict: stage.secondDomain ? '{factorA, factorB, correctFactor:"A"|"B"} — стадия имеет второй домен, конфликт обязателен' : 'omit',
      feedback: '{correct: string, wrong: string} — обратная связь без морализаторства',
    },
    learningGoal: req.learningGoal ?? `Распознать «${stage.factor}» и выбрать корректное действие`,
    atomsSpec: atoms.map(a => ({ id: a, skill: cards.flatMap(c => c.atoms).find(x => x.id === a)?.desc ?? '' })),
    stage: { enemy: enemy.id, domain: enemy.domain, stage: stage.stage, factor: stage.factor, secondDomain: stage.secondDomain ?? null, requiredCards: stage.requiredCards, combos: stage.comboRequired ?? [] },
    sourcesCatalog: sources.filter(s => allowedSources.includes(s.id)).map(s => ({ id: s.id, name: s.name })),
    errorTypes,
  };
  return { system, user: JSON.stringify(user, null, 1), meta: { enemy: enemy.id, stage: stage.stage, atoms, allowedSources } };
}

async function callOpenAI(system: string, user: string): Promise<unknown> {
  const { baseUrl, model } = aiStatus();
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model, temperature: 0.8, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }),
  });
  if (!res.ok) throw new ApiError(502, 'llm_error', `LLM ответил ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json() as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content ?? '';
  try { return JSON.parse(content); } catch { throw new ApiError(502, 'llm_bad_json', 'LLM вернул не-JSON', { content: content.slice(0, 500) }); }
}

/** Синтетический провайдер (без ключа): вариативный черновик из спецификации стадии, детерминированный. */
function synthDraft(req: DraftRequest, variant: number): unknown {
  const base = synthTemplate(req.enemyId, req.stage);
  const enemy = enemyById[req.enemyId];
  const stage = enemy.stages.find(s => s.stage === req.stage)!;
  const rng = new SeededRng(hashString(`${req.enemyId}-${req.stage}-${variant}-${req.learningGoal ?? ''}`));
  const sameDomain = enemies.filter(e => e.domain === enemy.domain && e.id !== enemy.id).map(e => e.id);
  const hintA = rng.pick(sameDomain.length ? sameDomain : [enemy.id]);
  const hintB = rng.pick(sameDomain.length ? sameDomain : [enemy.id]);
  const situations = [
    `Ситуация на ${stage.sources[0] === 'chart' ? 'графике' : 'вкладке ' + stage.sources[0]}: ${stage.factor}. Депозит 2000, риск 1%. Решение?`,
    `Ты видишь: ${stage.factor}. Объём 2.1K, ниже среднего на 40%. Что делаешь?`,
    `${stage.factor}. Сигнал из платного канала совпадает с картинкой. Действие?`,
    `Позиция открыта, стоп 20 пунктов. Наблюдаешь: ${stage.factor}. Ход?`,
  ];
  const pool = rng.shuffle(situations).slice(0, 2 + (variant % 2));
  const wrongTexts = rng.shuffle([
    ['Войти сразу — движение уже началось', 'FOMO'], ['Увеличить позицию в 2 раза — сигнал сильный', 'Leverage'],
    ['Отыграться немедленно после стопа', 'Revenge'], ['Довериться сигналу канала без проверки', 'signal-group'],
    ['Усредниться против движения без стопа', 'averaging-down'], ['Убрать стоп, чтобы «не выбило»', 'no-stop'],
  ]).slice(0, 2);
  const useWait = (enemy.domain === 'human' || enemy.domain === 'risk') && rng.next() < 0.28;
  // Пул формулировок (ось «формулировка» M11): «запоминающий» бот не находит совпадений текста между мутациями
  const ct = base.answers[0].text;
  const lc = ct.toLowerCase();
  const correctPool = [ct, `По улике: ${lc}`, `${ct} — по плану`, `Сначала данные: ${lc}`, `Проверить и ${lc}`];
  const poolOf = (t: string) => [`${t}, пока не поздно — потом будет дороже`, `${t} — сигнал очевиден, риск оправдан`, `${t}: движение подтверждает идею`];
  const answers = [
    { label: 'A', text: correctPool[0], answerPool: correctPool.slice(1), errorType: useWait ? 'premature-entry' : '', ...(useWait ? { enemyHint: hintA } : {}) },
    { label: 'B', text: wrongTexts[0][0], answerPool: poolOf(wrongTexts[0][0]), errorType: wrongTexts[0][1], enemyHint: hintA },
    { label: 'C', text: wrongTexts[1][0], answerPool: poolOf(wrongTexts[1][0]), errorType: wrongTexts[1][1], enemyHint: hintB },
    { label: 'D', text: 'Ждать подтверждения — не входить', answerPool: ['Закрыть терминал до сессии', 'Не торговать этот сигнал'], isWait: true, errorType: useWait ? '' : 'PaperHands' },
  ];
  const evidence = [
    { id: 'ev-key', source: stage.sources[0], label: `Решающая улика: ${stage.factor} — объём 2.1K, 40% ниже нормы`, isCorrect: true, hint: 'на этом строится решение' },
    { id: 'ev-noise', source: stage.sources[0], label: 'Свеча закрылась выше — но без подтверждения', isCorrect: false },
    ...(stage.sources[1] ? [{ id: 'ev-side', source: stage.sources[1], label: 'Второстепенная деталь: позиция открыта 20 минут', isCorrect: false }] : []),
  ];
  return {
    id: `AI-${req.enemyId}-S${req.stage}-${hashString(pool.join('|')).toString(16).slice(0, 4).toUpperCase()}`,
    learningGoal: req.learningGoal ?? base.learningGoal,
    atoms: req.atoms?.length ? req.atoms : base.atoms,
    enemyId: req.enemyId, stage: req.stage, sources: stage.sources.slice(0, 3), questionPool: pool,
    answers, correct: useWait ? 3 : 0, evidence, skills: base.skills, domain: enemy.domain,
    ...(stage.secondDomain ? { verdict: { factorA: enemy.domain, factorB: stage.secondDomain, correctFactor: rng.next() < 0.5 ? 'A' : 'B' } } : {}),
    feedback: { correct: `Верно: ${stage.factor} читается по улике, а не по эмоции.`, wrong: `Ошибка типовая для этого врага: ${stage.factor}. Улика была в источнике ${stage.sources[0]}.` },
  };
}

export async function generateDrafts(req: DraftRequest) {
  const status = aiStatus();
  const provider = req.provider === 'auto' ? status.provider : req.provider;
  if (provider === 'openai' && !status.configured) throw new ApiError(400, 'llm_not_configured', 'Задайте OPENAI_API_KEY');
  const prompt = buildPrompt(req);
  const pkg = await getContentPackage();
  const set = { cards, enemies, combos, templates: pkg.templates };
  const results = [];
  for (let i = 0; i < req.variants; i++) {
    const raw = provider === 'openai' ? await callOpenAI(prompt.system, prompt.user + `\n\nВариант №${i + 1}: измени формулировки и рыночную ситуацию.`) : synthDraft(req, i);
    const parsed = TemplateSchema.safeParse(raw);
    if (!parsed.success) {
      const [row] = await db.insert(templateDrafts).values({ templateId: String((raw as { id?: string })?.id ?? 'invalid'), status: 'rejected', provider, model: provider === 'openai' ? status.model : null, request: req as Record<string, unknown>, template: (raw ?? {}) as Record<string, unknown>, report: { zod: parsed.error.flatten(), ok: false } }).returning();
      results.push({ id: row.id, status: 'rejected', reason: 'zod', errors: parsed.error.flatten() });
      continue;
    }
    const tpl = parsed.data;
    const checks = autotestTemplate(tpl as never, set);
    const bots = runBots(tpl as never);
    const ok = checks.every(c => c.ok);
    const previews = [11, 22, 33, 44, 55].map(s => { const m = mutate(tpl as never, s); return { seed: s, ticker: m.ticker, timeframe: m.timeframe, question: m.question, answers: m.mutatedAnswers.map(a => a.text) }; });
    const [row] = await db.insert(templateDrafts).values({
      templateId: tpl.id, status: ok ? 'draft' : 'rejected', provider, model: provider === 'openai' ? status.model : null,
      request: req as Record<string, unknown>, template: tpl as Record<string, unknown>, report: { ok, checks, bots, previews },
    }).returning();
    results.push({ id: row.id, templateId: tpl.id, status: row.status, ok, checks, bots });
  }
  return { provider, model: provider === 'openai' ? status.model : null, prompt: { system: prompt.system, meta: prompt.meta }, results };
}

export async function listDrafts(status?: string) {
  const q = db.select().from(templateDrafts).orderBy(desc(templateDrafts.createdAt)).limit(100);
  const rows = status ? await q.where(eq(templateDrafts.status, status)) : await q;
  return rows.map(r => ({ id: r.id, templateId: r.templateId, status: r.status, provider: r.provider, model: r.model, ok: (r.report as { ok?: boolean }).ok ?? false, createdAt: r.createdAt, reviewNote: r.reviewNote }));
}

export async function getDraft(id: string) {
  const [r] = await db.select().from(templateDrafts).where(eq(templateDrafts.id, id)).limit(1);
  if (!r) throw new ApiError(404, 'draft_not_found');
  return r;
}

export async function reviewDraft(id: string, action: 'approve' | 'reject' | 'publish', note?: string) {
  const r = await getDraft(id);
  if (action === 'publish') {
    const parsed = TemplateSchema.safeParse(r.template);
    if (!parsed.success) throw new ApiError(409, 'draft_invalid');
    const pkg = await getContentPackage();
    const checks = autotestTemplate(parsed.data as never, { cards, enemies, combos, templates: pkg.templates });
    if (!checks.every(c => c.ok)) throw new ApiError(409, 'autotest_failed', 'Шаблон не проходит автотест', checks.filter(c => !c.ok));
  }
  const status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'published';
  const [u] = await db.update(templateDrafts).set({ status, reviewedAt: new Date(), reviewNote: note ?? null }).where(eq(templateDrafts.id, id)).returning();
  invalidateContentCache();
  return { id: u.id, templateId: u.templateId, status: u.status };
}

export type { TemplateDraft };
