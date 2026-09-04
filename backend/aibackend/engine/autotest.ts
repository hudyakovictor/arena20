// Автотест полноты и качества контента (ТЗ Часть 4 §8) + боты угадываемости (Часть 6 §7.1)
import type { EncounterTemplate, Enemy, SkillCard, ComboDef } from '../types';
import { mutate } from './mutator';
import { SeededRng, hashString } from './rng';

export interface Check { name: string; ok: boolean; details: string[]; }
export interface BotReport { blind: number; random: number; memorizing: number; heuristic: number; thresholds: typeof botThresholds; ok: boolean; }

// Пороги — конфиг. heuristic оценивается на уровне пакета: «ждать» обязан быть верен регулярно (M10), но не всегда.
export const botThresholds = { blind: 0.45, random: 0.35, memorizing: 0.55, heuristic: 0.5, memorizingWindow: 1 }; // Часть 3 §5: «запоминающий» видел прошлую мутацию

const WAIT_WORDS = ['ждать', 'подождать', 'не входить', 'не торговать', 'закрыть терминал', 'не взаимодействовать'];
export const isWaitText = (t: string) => WAIT_WORDS.some(w => t.toLowerCase().includes(w));
// Слова-маркеры «глупого» варианта для слепого бота; граница слова — не-буква (в JS \b не работает с кириллицей)
const GREEDY = /(^|[^а-яёa-z])(сразу|удвоить|удвою|удваиваю|плечо|плечом|плечи|инсайд|инсайду|верить|верю|отыграться|немедленно)/i;

/** Боты играют 50 мутаций шаблона; экземпляр отдаётся без пометок — как клиенту. */
export function runBots(tpl: EncounterTemplate, runs = 50): BotReport {
  let blind = 0, random = 0, memo = 0, heur = 0;
  const rng = new SeededRng(hashString('bots:' + tpl.id));
  const memory: string[] = []; // «запоминающий» видел N прошлых мутаций и их разбор (N — конфиг)
  for (let i = 0; i < runs; i++) {
    const inst = mutate(tpl, rng.int(1, 1 << 30));
    const opts = inst.mutatedAnswers.map(a => a.text);
    // «слепой»: не открывает источники, отвечает по тексту — самый длинный «разумный» вариант
    const scored = opts.map((t, idx) => ({ idx, s: t.length - (GREEDY.test(t) ? 40 : 0) }));
    scored.sort((a, b) => b.s - a.s);
    if (scored[0].idx === inst.correctAnswer) blind++;
    // «случайный»
    if (rng.int(0, opts.length - 1) === inst.correctAnswer) random++;
    // «запоминающий»: ищет в текущих вариантах текст, который уже видел как верный
    if (i > 0) {
      const hit = opts.findIndex(o => memory.includes(o));
      if ((hit >= 0 ? hit : rng.int(0, opts.length - 1)) === inst.correctAnswer) memo++;
    }
    memory.push(opts[inst.correctAnswer]);
    if (memory.length > botThresholds.memorizingWindow) memory.shift();
    // «эвристический»: всегда «ждать»/самый консервативный
    const waitIdx = opts.findIndex(isWaitText);
    if ((waitIdx >= 0 ? waitIdx : scored[0].idx) === inst.correctAnswer) heur++;
  }
  const r = { blind: blind / runs, random: random / runs, memorizing: memo / (runs - 1), heuristic: heur / runs };
  const ok = r.blind <= botThresholds.blind && r.random <= botThresholds.random && r.memorizing <= botThresholds.memorizing;
  return { ...r, thresholds: botThresholds, ok };
}

export interface ContentSet { cards: SkillCard[]; enemies: Enemy[]; combos: ComboDef[]; templates: EncounterTemplate[]; }

export function autotestTemplate(tpl: EncounterTemplate, set: ContentSet): Check[] {
  const checks: Check[] = [];
  const enemy = set.enemies.find(e => e.id === tpl.enemyId);
  const stage = enemy?.stages.find(s => s.stage === tpl.stage);
  const cardsOf = tpl.skills.map(id => set.cards.find(c => c.id === id)).filter(Boolean) as SkillCard[];

  // Источники: входят в обязательные+допустимые карт; не более трёх
  const allowed = new Set(cardsOf.flatMap(c => [...c.mandatorySources, ...c.optionalSources]));
  const badSrc = tpl.sources.filter(s => !allowed.has(s));
  checks.push({ name: 'sources', ok: tpl.sources.length <= 3 && badSrc.length === 0, details: [...(tpl.sources.length > 3 ? ['>3 вкладок'] : []), ...badSrc.map(s => `источник ${s} не разрешён картами`)] });

  // Дистракторы: каждый неверный вариант имеет тип ошибки (враг — желателен)
  const dis = tpl.answers.map((a, i) => ({ a, i })).filter(x => x.i !== tpl.correct && !x.a.isWait);
  const noType = dis.filter(x => !x.a.errorType);
  checks.push({ name: 'distractors', ok: noType.length === 0, details: noType.map(x => `вариант ${x.a.label} без типа ошибки`) });

  // Улики: у верного варианта хотя бы одна зона; зоны — только в источниках шаблона
  const correctEv = tpl.evidence.filter(e => e.isCorrect);
  const badEvSrc = tpl.evidence.filter(e => !tpl.sources.includes(e.source));
  checks.push({ name: 'evidence', ok: correctEv.length >= 1 && badEvSrc.length === 0, details: [...(correctEv.length === 0 ? ['нет верной улики'] : []), ...badEvSrc.map(e => `улика ${e.id} в отсутствующем источнике ${e.source}`)] });

  // Нераскрытие: вопрос не содержит слов названия врага
  const enemyWords = (enemy?.name ?? '').toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const leaks = tpl.questionPool.filter(q => enemyWords.some(w => q.toLowerCase().includes(w)));
  checks.push({ name: 'no_reveal', ok: leaks.length === 0, details: leaks.map(q => `вопрос раскрывает врага: «${q}»`) });

  // Атомы ссылаются на карты шаблона
  const atomCards = new Set(cardsOf.flatMap(c => c.atoms.map(a => a.id)));
  const badAtoms = tpl.atoms.filter(a => !atomCards.has(a));
  checks.push({ name: 'atoms', ok: tpl.atoms.length > 0 && badAtoms.length === 0, details: badAtoms.map(a => `атом ${a} не принадлежит картам шаблона`) });

  // Стадия существует и карты стадии ⊆ карт шаблона
  const stageCards = stage?.requiredCards.map(r => r.cardId) ?? [];
  const missing = stageCards.filter(c => !tpl.skills.includes(c));
  checks.push({ name: 'stage', ok: !!stage && missing.length === 0, details: [...(!stage ? [`нет стадии ${tpl.enemyId} S${tpl.stage}`] : []), ...missing.map(c => `карта стадии ${c} не в skills`)] });

  // Мутация: две мутации с разными seed не совпадают по активу, числам и порядку одновременно
  const a = mutate(tpl, 12345), b = mutate(tpl, 987654);
  const same = a.ticker === b.ticker && a.mutatedAnswers.map(x => x.text).join('|') === b.mutatedAnswers.map(x => x.text).join('|') && a.mutatedEvidence.map(e => e.label).join('|') === b.mutatedEvidence.map(e => e.label).join('|');
  checks.push({ name: 'mutation', ok: !same, details: same ? ['мутации идентичны'] : [] });

  // Угадываемость
  const bots = runBots(tpl);
  checks.push({ name: 'bots', ok: bots.ok, details: bots.ok ? [] : [`blind=${bots.blind} random=${bots.random} memo=${bots.memorizing} heur=${bots.heuristic}`] });

  // M10 — в доменах human/risk обязан быть вариант «ждать»
  if (tpl.domain === 'human' || tpl.domain === 'risk') {
    const hasWait = tpl.answers.some(x => x.isWait || isWaitText(x.text));
    checks.push({ name: 'cold_head', ok: hasWait, details: hasWait ? [] : ['нет варианта «ждать»'] });
  }
  return checks;
}

export function autotestPackage(set: ContentSet) {
  const global: Check[] = [];
  // Покрытие атомов: каждый атом — минимум в одном шаблоне
  const usedAtoms = new Set(set.templates.flatMap(t => t.atoms));
  const unusedAtoms = set.cards.flatMap(c => c.atoms.map(a => a.id)).filter(a => !usedAtoms.has(a));
  global.push({ name: 'atom_coverage', ok: unusedAtoms.length === 0, details: unusedAtoms.map(a => `атом ${a} декоративный — нет шаблона`) });
  // Покрытие карт: каждая карта — минимум два врага
  const cardEnemies: Record<string, Set<string>> = {};
  for (const e of set.enemies) for (const s of e.stages) for (const rc of s.requiredCards) (cardEnemies[rc.cardId] ??= new Set()).add(e.id);
  const weak = set.cards.filter(c => (cardEnemies[c.id]?.size ?? 0) < 2).map(c => c.id);
  global.push({ name: 'card_coverage', ok: weak.length === 0, details: weak.map(c => `карта ${c} — меньше двух врагов`) });
  // Уникальность стадий
  const dup: string[] = [];
  for (const e of set.enemies) {
    const seen = new Set<string>();
    for (const s of e.stages) { const k = s.requiredCards.map(r => r.cardId).sort().join(',') + '|' + [...s.sources].sort().join(',') + '|' + s.factor; if (seen.has(k)) dup.push(`${e.id} S${s.stage}`); seen.add(k); }
  }
  global.push({ name: 'stage_unique', ok: dup.length === 0, details: dup });
  // Домен на S3: второй домен / источник / конфликт
  const s3bad = set.enemies.flatMap(e => e.stages.filter(s => s.stage === 3 && !s.secondDomain && !(s.comboRequired?.length)).map(s => `${e.id} S3`));
  global.push({ name: 's3_second_domain', ok: s3bad.length === 0, details: s3bad });
  // Комбо: каждое требуется минимум одной стадией; каждая S4 требует комбо
  const requiredCombos = new Set(set.enemies.flatMap(e => e.stages.flatMap(s => s.comboRequired ?? [])));
  const orphanCombos = set.combos.filter(k => !requiredCombos.has(k.id)).map(k => k.id);
  const s4NoCombo = set.enemies.flatMap(e => e.stages.filter(s => s.stage === 4 && !(s.comboRequired?.length)).map(s => `${e.id} S4`));
  global.push({ name: 'combos', ok: orphanCombos.length === 0 && s4NoCombo.length === 0, details: [...orphanCombos.map(k => `комбо ${k} никем не требуется`), ...s4NoCombo] });

  // Эвристический бот «всегда ждать»: доля шаблонов, где он выигрывает, не выше порога (M10: «ждать» верен регулярно, не всегда)
  const heurWins = set.templates.filter(t => runBots(t, 10).heuristic > 0.5).length;
  const heurShare = set.templates.length ? heurWins / set.templates.length : 0;
  global.push({ name: 'heuristic_bot', ok: heurShare <= botThresholds.heuristic, details: heurShare > botThresholds.heuristic ? [`«всегда ждать» выигрывает в ${Math.round(heurShare * 100)}% шаблонов`] : [] });

  const perTemplate = set.templates.map(t => ({ templateId: t.id, checks: autotestTemplate(t, set) }));
  const templateFailures = perTemplate.filter(p => p.checks.some(c => !c.ok)).length;
  return {
    ok: global.every(c => c.ok) && templateFailures === 0,
    global, perTemplate,
    summary: { templates: set.templates.length, templateFailures, globalFailures: global.filter(c => !c.ok).length },
  };
}
