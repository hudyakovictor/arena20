// ─── SIGNAL ARENA · data registry (ТЗ Часть 1, 4) ─────────────────────────────

export type Domain = 'technical' | 'risk' | 'context' | 'crypto' | 'human' | 'cognitive';
export type EpochId = 'street' | 'cabinet' | 'terminal' | 'system';
export type SourceId = 'chart' | 'news' | 'position' | 'wallet' | 'tokenomics' | 'onchain' | 'orderbook' | 'sentiment';
export type Rank = 0 | 1 | 2 | 3;

export const DOMAIN: Record<Domain, { name: string; color: string; short: string }> = {
  technical: { name: 'Техника', color: '#50C8FF', short: 'ТЕХ' },
  risk: { name: 'Риск', color: '#FF5C70', short: 'РИСК' },
  context: { name: 'Контекст', color: '#F4B84B', short: 'КОНТ' },
  crypto: { name: 'Крипто', color: '#B783FF', short: 'КРИП' },
  human: { name: 'Человек', color: '#FF77BD', short: 'ЧЕЛ' },
  cognitive: { name: 'Когнитив', color: '#9CA8FF', short: 'КОГ' },
};

export interface Epoch {
  id: EpochId; name: string; num: string; levels: [number, number]; motto: string; description: string;
  accent: string; bg: string; surface: string; border: string; radius: number; texture: string;
  crutches: { labels: 'all' | 'partial' | 'none' | 'false'; evidenceHighlights: boolean; toActionButton: boolean };
  nav: NavKey[];
}
export type NavKey = 'academy' | 'arena' | 'collection' | 'more';

export const EPOCHS: Record<EpochId, Epoch> = {
  street: {
    id: 'street', name: 'УЛИЦА', num: 'I', levels: [1, 20],
    motto: 'ТЫ ЗДЕСЬ РАДИ ДЕНЕГ. ИМЕННО ПОЭТОМУ ТЫ УЖЕ В ОПАСНОСТИ.',
    description: 'Граффити, неон, толстые обводки. Все ярлыки на месте.',
    accent: '#31D6C4', bg: '#070B14', surface: '#0C1323', border: '#22304A', radius: 16, texture: 'tex-brick',
    crutches: { labels: 'all', evidenceHighlights: true, toActionButton: true }, nav: ['academy', 'arena'],
  },
  cabinet: {
    id: 'cabinet', name: 'КАБИНЕТ', num: 'II', levels: [21, 50],
    motto: 'РЫНОК — ЭТО НЕ ГРАФИК. ЭТО ЛЮДИ, КОТОРЫЕ РИСУЮТ ГРАФИК.',
    description: 'Скруглённые панели, пастель, тонкие иконки. Часть костылей снята.',
    accent: '#59A7FF', bg: '#080E1E', surface: '#0F1B32', border: '#2A3A55', radius: 12, texture: 'tex-paper',
    crutches: { labels: 'partial', evidenceHighlights: false, toActionButton: false }, nav: ['academy', 'arena', 'collection'],
  },
  terminal: {
    id: 'terminal', name: 'ТЕРМИНАЛ', num: 'III', levels: [51, 80],
    motto: 'ВОЛАТИЛЬНОСТЬ ВРЕМЕННА. ТВОЯ ОШИБКА — НАВСЕГДА.',
    description: 'Плотная сетка, монохром + один акцент, моноширинные данные.',
    accent: '#FFB341', bg: '#060A12', surface: '#0A1320', border: '#1E2E4A', radius: 8, texture: 'tex-grid',
    crutches: { labels: 'none', evidenceHighlights: false, toActionButton: false }, nav: ['academy', 'arena', 'collection', 'more'],
  },
  system: {
    id: 'system', name: 'СИСТЕМА', num: 'IV', levels: [81, 99],
    motto: 'СИСТЕМА РАБОТАЕТ. ПОКА ТЫ НЕ ВМЕШАЕШЬСЯ.',
    description: 'Минимализм, белое на тёмном, ложные ярлыки как норма.',
    accent: '#B783FF', bg: '#05070D', surface: '#0A0F1C', border: '#1A2740', radius: 8, texture: 'tex-none',
    crutches: { labels: 'false', evidenceHighlights: false, toActionButton: false }, nav: ['academy', 'arena', 'collection', 'more'],
  },
};

export function epochOf(level: number): Epoch {
  if (level <= 20) return EPOCHS.street;
  if (level <= 50) return EPOCHS.cabinet;
  if (level <= 80) return EPOCHS.terminal;
  return EPOCHS.system;
}

// ─── 17 карт-глав (ТЗ §4.4) ────────────────────────────────────────────────────
export interface Card {
  id: string; num: number; title: string; short: string; unlock: number; domain: Domain;
  glyph: string; atoms: string[]; enemyTeaser: string; sources: SourceId[];
}

export const CARDS: Card[] = [
  { id: 'C1', num: 1, title: 'Основы рынка и свечей', short: 'Свечи', unlock: 1, domain: 'technical', glyph: 'candle', enemyTeaser: 'Тень Сигнальной Группы', sources: ['chart'],
    atoms: ['Прочитать свечу: тело, тени, закрытие', 'Отличить тренд от флэта по структуре', 'Определить таймфрейм графика', 'Распознать «сигнал» из чата как шум', 'Найти точку, где стоп был бы обязателен'] },
  { id: 'C2', num: 2, title: 'Уровни, объёмы и структура рынка', short: 'Уровни', unlock: 4, domain: 'technical', glyph: 'levels', enemyTeaser: 'Ложный Пробой', sources: ['chart', 'orderbook'],
    atoms: ['Отличить пробой с объёмом от пробоя без объёма', 'Определить старший таймфрейм как контекст', 'Найти уровень по касаниям, а не по желанию', 'Прочитать смену структуры HH/HL → LH/LL', 'Различить ретест и разворот', 'Увидеть ловушку ликвидности за уровнем'] },
  { id: 'C3', num: 3, title: 'Индикаторы', short: 'Индикаторы', unlock: 8, domain: 'technical', glyph: 'indicator', enemyTeaser: 'Культ Осциллятора', sources: ['chart'],
    atoms: ['RSI — перекупленность не равна развороту', 'Скользящие как контекст, не как сигнал', 'Дивергенция: подтверждать структурой', 'Отличить запаздывающий индикатор от опережающего', 'Не складывать 5 индикаторов в один шум'] },
  { id: 'C4', num: 4, title: 'Риск-менеджмент', short: 'Риск', unlock: 12, domain: 'risk', glyph: 'shield', enemyTeaser: 'Гоблин Плеча', sources: ['chart', 'position'],
    atoms: ['Стоп определяется до входа', 'Рассчитать размер позиции от заданного стопа', 'Не более X% на сделку — считать, не чувствовать', 'Волатильность как основа размера позиции', 'Плечо не увеличивает прибыль. Оно ускоряет исход', 'Серия убытков — норма, не сигнал удвоиться'] },
  { id: 'C5', num: 5, title: 'Психология трейдинга', short: 'Психология', unlock: 16, domain: 'cognitive', glyph: 'brain', enemyTeaser: 'FOMO-Демон', sources: ['chart', 'sentiment'],
    atoms: ['Распознать FOMO в момент решения', 'Отличить месть рынку от плана', 'Тильт: признаки за 10 секунд до входа', 'Якорь на цене входа — не уровень', 'Подтверждающее искажение в ленте', 'Страх упустить против страха потерять'] },
  { id: 'C8', num: 8, title: 'Безопасность', short: 'Безопасность', unlock: 21, domain: 'crypto', glyph: 'lock', enemyTeaser: 'Дрейнер', sources: ['wallet', 'news'],
    atoms: ['Апрув — это доверенность, а не кнопка', 'Отличить фишинг-домен от настоящего', 'Кастодия: чьи ключи, того и монеты', 'Риск биржи как контрагента', 'Отозвать апрув до того, как это сделают за тебя'] },
  { id: 'C7', num: 7, title: 'Токеномика', short: 'Токеномика', unlock: 26, domain: 'crypto', glyph: 'token', enemyTeaser: 'Разлок-Кит', sources: ['tokenomics', 'chart'],
    atoms: ['FDV против капитализации', 'Расписание разлоков как календарь давления', 'Инфляция эмиссии против спроса', 'Кому принадлежит саплай', 'Утилита токена: реальная или в roadmap'] },
  { id: 'C6', num: 6, title: 'Новости и макро', short: 'Новости', unlock: 31, domain: 'context', glyph: 'news', enemyTeaser: 'Фейковый Заголовок', sources: ['news', 'chart'],
    atoms: ['Buy the rumor — sell the news', 'Отличить фейковую новость по источнику', 'Макро-вес события: ставка, CPI, ликвидность', 'Уже в цене или нет', 'Корреляция с традиционными рынками'] },
  { id: 'C9', num: 9, title: 'Ончейн-анализ', short: 'Ончейн', unlock: 36, domain: 'crypto', glyph: 'chain', enemyTeaser: 'Спящий Кит', sources: ['onchain', 'chart'],
    atoms: ['Приток на биржи — давление продаж', 'Кошельки китов: движение ≠ намерение', 'Активные адреса против цены', 'Отличить перекладку от продажи', 'Смарт-мани: как их подделывают'] },
  { id: 'C10', num: 10, title: 'Производные инструменты', short: 'Деривативы', unlock: 41, domain: 'risk', glyph: 'derivative', enemyTeaser: 'Каскад Ликвидаций', sources: ['position', 'orderbook', 'chart'],
    atoms: ['Фандинг как температура толпы', 'Открытый интерес: топливо для сквиза', 'Ликвидационные кластеры — магнит цены', 'Кросс против изолированной маржи', 'Опционы: экспирация двигает спот'] },
  { id: 'C11', num: 11, title: 'Нарративы, сентимент и гигиена сигналов', short: 'Нарративы', unlock: 46, domain: 'human', glyph: 'megaphone', enemyTeaser: 'Инфлюенсер-Пророк', sources: ['sentiment', 'news', 'chart'],
    atoms: ['Кто зарабатывает на этом сигнале', 'Платный канал — продукт, а не альфа', 'Индекс страха и жадности как контр-сигнал', 'Нарратив: рождение, пик, похороны', '«Инсайд» в паблике = маркетинг', 'Отличить органический хайп от оплаченного'] },
  { id: 'C12', num: 12, title: 'Дисциплина и рутина', short: 'Дисциплина', unlock: 51, domain: 'cognitive', glyph: 'checklist', enemyTeaser: 'Ночная Сессия', sources: ['position', 'chart'],
    atoms: ['Чек-лист до входа', 'Журнал после выхода', 'Сессии: когда ты торгуешь, а когда тебя', 'Отдых как часть системы', 'Лимит сделок в день'] },
  { id: 'C13', num: 13, title: 'Исполнение и ведение сделки', short: 'Исполнение', unlock: 56, domain: 'technical', glyph: 'execution', enemyTeaser: 'Проскальзывание', sources: ['position', 'orderbook', 'chart'],
    atoms: ['Частичная фиксация по плану', 'Перенос стопа в безубыток: когда рано', 'Добор против усреднения убытка', 'Трейлинг-стоп по структуре', 'Лимит против маркета в тонком стакане'] },
  { id: 'C14', num: 14, title: 'Математика трейдера', short: 'Математика', unlock: 61, domain: 'risk', glyph: 'math', enemyTeaser: 'Сирена Винрейта', sources: ['position', 'chart'],
    atoms: ['Матожидание: винрейт × R:R', 'Просадка и восстановление — асимметрия', 'Серии убытков при честной монете', 'Hindsight bias на бэктесте', 'Survivorship bias в «успешных» стратегиях'] },
  { id: 'C15', num: 15, title: 'DeFi', short: 'DeFi', unlock: 66, domain: 'crypto', glyph: 'defi', enemyTeaser: 'Депег', sources: ['wallet', 'tokenomics', 'onchain'],
    atoms: ['Непостоянные потери — постоянные', 'APY: откуда деньги', 'Депег стейблкоина: первые признаки', 'Мостовой риск', 'Смарт-контрактный риск и аудит'] },
  { id: 'C16', num: 16, title: 'Портфель, циклы и режимы рынка', short: 'Циклы', unlock: 72, domain: 'context', glyph: 'cycle', enemyTeaser: 'Вечный Бык', sources: ['chart', 'onchain', 'news'],
    atoms: ['Режим рынка: тренд / флэт / хаос', 'Волатильность как режим', 'Корреляция портфеля в кризис → 1', 'Ребалансировка против веры', 'Цикл: где ты по индикаторам, а не по ощущениям'] },
  { id: 'C17', num: 17, title: 'Торговая система', short: 'Система', unlock: 78, domain: 'cognitive', glyph: 'system', enemyTeaser: 'Переобученная Модель', sources: ['chart', 'position', 'news'],
    atoms: ['Правила входа/выхода/размера — письменно', 'Переобучение системы', 'Форвард-тест против бэктеста', 'Когда система сломалась, а когда просадка', 'Перенос навыка на незнакомый актив'] },
];

// ─── источники (8 виджетов) ────────────────────────────────────────────────────
export const SOURCES: Record<SourceId, { name: string; short: string; glyph: string }> = {
  chart: { name: 'График', short: 'Г', glyph: 'chart' },
  news: { name: 'Новости', short: 'Н', glyph: 'news' },
  position: { name: 'Позиция', short: 'П', glyph: 'position' },
  wallet: { name: 'Кошелёк', short: 'К', glyph: 'wallet' },
  tokenomics: { name: 'Токеномика', short: 'Т', glyph: 'token' },
  onchain: { name: 'Ончейн', short: 'О', glyph: 'chain' },
  orderbook: { name: 'Стакан', short: 'С', glyph: 'orderbook' },
  sentiment: { name: 'Сентимент', short: 'Сн', glyph: 'sentiment' },
};

// ─── враги (подмножество из 33, ТЗ Часть 4 §5) ─────────────────────────────────
export interface Enemy {
  id: string; name: string; domain: Domain; second?: Domain; title: string; quote: string; card: string; stages: number;
}
export const ENEMIES: Enemy[] = [
  { id: 'E01', name: 'Гоблин Плеча', domain: 'risk', second: 'cognitive', title: 'Служба ускоренной ликвидации', quote: 'Плечо не увеличивает прибыль. Оно ускоряет исход.', card: 'C4', stages: 4 },
  { id: 'E02', name: 'Ложный Пробой', domain: 'technical', second: 'human', title: 'Департамент ловли стопов', quote: 'Уровень пробит. Ненадолго. Специально для тебя.', card: 'C2', stages: 3 },
  { id: 'E03', name: 'FOMO-Демон', domain: 'cognitive', second: 'human', title: 'Комитет по упущенным возможностям', quote: 'Все уже купили. Ты — последний. Как всегда.', card: 'C5', stages: 4 },
  { id: 'E04', name: 'Инфлюенсер-Пророк', domain: 'human', second: 'context', title: 'Публичный оракул на комиссии', quote: 'Мой прошлый прогноз — исторический артефакт.', card: 'C11', stages: 3 },
  { id: 'E05', name: 'Дрейнер', domain: 'crypto', second: 'human', title: 'Служба перераспределения чужих денег', quote: 'Ты подписал. Мы благодарим за сотрудничество.', card: 'C8', stages: 3 },
  { id: 'E06', name: 'Фейковый Заголовок', domain: 'context', second: 'human', title: 'Агентство срочных слухов', quote: 'СРОЧНО. Опровержение через 40 минут.', card: 'C6', stages: 3 },
  { id: 'E07', name: 'Каскад Ликвидаций', domain: 'risk', second: 'technical', title: 'Протокол коллективного отрицания', quote: 'Первая ликвидация — случайность. Тысячная — статистика.', card: 'C10', stages: 4 },
  { id: 'E08', name: 'Разлок-Кит', domain: 'crypto', second: 'context', title: 'Ранний инвестор. Очень ранний', quote: 'Мой вход — 0.002. Твой — «по рынку».', card: 'C7', stages: 3 },
  { id: 'E09', name: 'Культ Осциллятора', domain: 'technical', second: 'cognitive', title: 'Индекс веры в график', quote: 'RSI 80. Значит, будет 95.', card: 'C3', stages: 3 },
  { id: 'E10', name: 'Тень Сигнальной Группы', domain: 'human', second: 'cognitive', title: 'Налог на надежду', quote: 'VIP-сигнал: 100% точность на прошлой неделе. Скриншоты потеряны.', card: 'C1', stages: 3 },
  { id: 'E11', name: 'Депег', domain: 'crypto', second: 'risk', title: 'Стабильность как обещание', quote: '$0.998. Всё под контролем. $0.94.', card: 'C15', stages: 4 },
  { id: 'E12', name: 'Сирена Винрейта', domain: 'risk', second: 'cognitive', title: '92% прибыльных сделок', quote: 'Восьмая сделка стоила семь предыдущих.', card: 'C14', stages: 3 },
];

export const enemyById = (id: string) => ENEMIES.find(e => e.id === id)!;
export const cardById = (id: string) => CARDS.find(c => c.id === id)!;

// ─── шаблон задания Арены (ТЗ §6.2) ────────────────────────────────────────────
export interface AnswerOption { id: string; text: string; correct?: boolean; wait?: boolean; errorType?: string; enemy?: string }
export interface Encounter {
  id: string; seed: string; goal: string; situation: string; question: string; asset: string; tf: string;
  cards: string[]; sources: SourceId[]; enemy: string; stage: number;
  evidence: { source: SourceId; label: string; key: string }[]; requiredEvidence: string;
  options: AnswerOption[]; feedback: { decisive: string; consequence: string; wrong: string };
  candles: number[][]; forward: number[][];
}

const mk = (o: number, h: number, l: number, c: number) => [o, h, l, c];
export const ENCOUNTER: Encounter = {
  id: 'T-0412', seed: '0x7A3F', asset: 'ETH/USDT', tf: '4H',
  goal: 'Отличить пробой с объёмом от пробоя без объёма',
  situation: 'Цена третий раз подходит к уровню 3 420. В чате «Альфа-Сигналы VIP» пишут: «ПРОБОЙ! ЗАХОДИМ х20». Свеча закрылась над уровнем на 0.4%.',
  question: 'Что делаешь?',
  cards: ['C2', 'C1'], sources: ['chart', 'orderbook', 'sentiment'], enemy: 'E02', stage: 2,
  evidence: [
    { source: 'chart', label: 'Объём на пробойной свече — 0.6× среднего', key: 'vol-low' },
    { source: 'chart', label: 'Три касания уровня 3 420 за 9 дней', key: 'touch-3' },
    { source: 'orderbook', label: 'Плотность продаж 3 425–3 440', key: 'ask-wall' },
    { source: 'sentiment', label: 'Упоминания «пробой» +340% за час', key: 'hype' },
  ],
  requiredEvidence: 'vol-low',
  options: [
    { id: 'a', text: 'Войти в лонг по рынку — пробой подтверждён закрытием', errorType: 'Вход без подтверждения объёмом', enemy: 'E02' },
    { id: 'b', text: 'Ждать ретест уровня с объёмом, стоп под уровень', correct: true },
    { id: 'c', text: 'Открыть лонг х20 — сигнал из VIP-группы', errorType: 'Доверие чужому сигналу + плечо', enemy: 'E10' },
    { id: 'd', text: 'ЖДАТЬ — не входить, ситуация не даёт преимущества', wait: true },
  ],
  feedback: {
    decisive: 'Решающим был объём: пробой на 0.6× среднего — это не пробой, это приглашение. Три касания сформировали ликвидность над уровнем; стакан показал стену продаж прямо там, куда тебя звали.',
    consequence: 'Через 3 свечи цена вернулась под 3 420 и сняла стопы тех, кто вошёл «по закрытию». VIP-группа удалила сообщение.',
    wrong: 'РЫНОК ПРИНЯЛ ТВОЁ РЕШЕНИЕ. Стоп сработал на четвёртой свече. Департамент ловли стопов благодарит за ликвидность.',
  },
  candles: [
    mk(3290, 3340, 3270, 3325), mk(3325, 3410, 3310, 3395), mk(3395, 3422, 3350, 3360), mk(3360, 3380, 3300, 3315),
    mk(3315, 3345, 3280, 3335), mk(3335, 3418, 3330, 3405), mk(3405, 3421, 3372, 3380), mk(3380, 3392, 3340, 3352),
    mk(3352, 3375, 3336, 3368), mk(3368, 3400, 3355, 3392), mk(3392, 3419, 3384, 3408), mk(3408, 3436, 3402, 3434),
  ],
  forward: [
    mk(3434, 3441, 3412, 3418), mk(3418, 3427, 3396, 3402), mk(3402, 3411, 3372, 3379), mk(3379, 3388, 3338, 3346),
    mk(3346, 3361, 3328, 3355), mk(3355, 3374, 3347, 3369),
  ],
};

// ─── трофеи ────────────────────────────────────────────────────────────────────
export interface Trophy { enemy: string; stage: number; total: number }
export const TROPHIES: Trophy[] = [
  { enemy: 'E10', stage: 3, total: 3 }, { enemy: 'E02', stage: 2, total: 3 }, { enemy: 'E01', stage: 1, total: 4 },
  { enemy: 'E03', stage: 1, total: 4 }, { enemy: 'E09', stage: 0, total: 3 }, { enemy: 'E06', stage: 0, total: 3 },
  { enemy: 'E04', stage: 0, total: 3 }, { enemy: 'E07', stage: 0, total: 4 },
];

export const WEATHER = [
  { id: 'fog', name: 'ТУМАН НАРРАТИВА', note: 'Сентимент шумит. Новости весят вдвое меньше.', color: '#9CA8FF' },
  { id: 'storm', name: 'ШТОРМ ЛИКВИДАЦИЙ', note: 'Волатильность ×1.6. Бюджет риска сгорает быстрее.', color: '#FF596D' },
  { id: 'calm', name: 'ПОДОЗРИТЕЛЬНЫЙ ШТИЛЬ', note: 'Рынок стабилен. Это подозрительно.', color: '#3BDE8A' },
];

export const HEADLINES = [
  'КИТ ПРОСНУЛСЯ. Мелкие инвесторы снова стали завтраком.',
  'РЕГУЛЯТОРЫ ОБЕСПОКОЕНЫ. Рынок снова делает вид, что удивлён.',
  'НОВЫЙ БЫЧИЙ ЦИКЛ. Эксперты уверены: на этот раз всё иначе. Эксперты — те же.',
  'ЛИКВИДАЦИЯ ЗАВЕРШЕНА УСПЕШНО. Активы уничтожены, урок усвоен, виноват пользователь.',
  'ИНФЛЮЕНСЕР ОПУБЛИКОВАЛ ПРОГНОЗ. Предыдущий признан историческим артефактом.',
];
