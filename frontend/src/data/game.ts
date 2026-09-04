export type Chapter = {
  n: number;
  title: string;
  level: number;
  atoms: number;
  done: number;
  card: string;
  enemy: string;
  quip: string;
};

export const chapters: Chapter[] = [
  { n: 1, title: "Основы рынка и свечей", level: 1, atoms: 6, done: 6, card: "Свеча", enemy: "Призрак Хайпа", quip: "Свеча не врёт. Врёт тот, кто её комментирует." },
  { n: 2, title: "Уровни, объёмы и структура рынка", level: 4, atoms: 7, done: 7, card: "Объём", enemy: "Ложный Пробой", quip: "Пробой без объёма — приглашение на ужин. Ты — блюдо." },
  { n: 3, title: "Индикаторы", level: 8, atoms: 6, done: 5, card: "Тренд", enemy: "Шум", quip: "Индикатор показывает прошлое. Уверенно." },
  { n: 4, title: "Риск-менеджмент", level: 12, atoms: 6, done: 3, card: "Риск", enemy: "Гоблин Плеча", quip: "Стоп ставят до входа. После — уже поздно и дорого." },
  { n: 5, title: "Психология трейдинга", level: 16, atoms: 6, done: 0, card: "Разум", enemy: "FOMO-Культ", quip: "Ты не спешишь. Просто все уже купили." },
  { n: 8, title: "Безопасность", level: 21, atoms: 5, done: 0, card: "Ключ", enemy: "Дрейнер", quip: "Апрув — это доверенность. Ты выдал её незнакомцу." },
  { n: 7, title: "Токеномика", level: 26, atoms: 6, done: 0, card: "Эмиссия", enemy: "Анлок", quip: "Команда получит токены через год. Ты — опыт сейчас." },
  { n: 6, title: "Новости и макро", level: 31, atoms: 6, done: 0, card: "Факт", enemy: "Голем Паники", quip: "Регуляторы обеспокоены. Рынок делает вид, что удивлён." },
  { n: 9, title: "Ончейн-анализ", level: 36, atoms: 6, done: 0, card: "Ончейн", enemy: "Кит", quip: "Кит проснулся. Завтрак подан." },
  { n: 10, title: "Производные инструменты", level: 41, atoms: 6, done: 0, card: "Фандинг", enemy: "Ликвидатор", quip: "Фандинг — это налог на уверенность." },
  { n: 11, title: "Нарративы, сентимент и гигиена сигналов", level: 46, atoms: 7, done: 0, card: "Нарратив", enemy: "Инфлюенсер", quip: "Платный сигнал бесплатен для того, кто его продал." },
  { n: 12, title: "Дисциплина и рутина", level: 51, atoms: 5, done: 0, card: "Журнал", enemy: "Тильт", quip: "Чек-лист скучный. Ликвидация — нет." },
  { n: 13, title: "Исполнение и ведение сделки", level: 56, atoms: 6, done: 0, card: "Трейлинг", enemy: "Ранняя Фиксация", quip: "Ты закрыл в плюс. Рынок пошёл дальше без тебя." },
  { n: 14, title: "Математика трейдера", level: 61, atoms: 6, done: 0, card: "Матожидание", enemy: "Серия", quip: "Винрейт 80% — и всё равно банкрот. Спроси у R:R." },
  { n: 15, title: "DeFi", level: 66, atoms: 6, done: 0, card: "Протокол", enemy: "Депег", quip: "Стейблкоин стабилен. Это подозрительно." },
  { n: 16, title: "Портфель, циклы и режимы рынка", level: 72, atoms: 6, done: 0, card: "Цикл", enemy: "Медведь", quip: "На этот раз всё иначе. Эксперты — те же." },
  { n: 17, title: "Торговая система", level: 78, atoms: 6, done: 0, card: "Система", enemy: "Переобучение", quip: "Бэктест идеален. Он видел будущее." },
];

export type Enemy = {
  id: string;
  name: string;
  domain: string;
  domainColor: string;
  img?: string;
  stage: 0 | 1 | 2 | 3;
  met: number;
  beaten: number;
  counter: string;
  headline: string;
  truth: string;
  hit: string;
};

export const enemies: Enemy[] = [
  {
    id: "ghost",
    name: "Призрак Хайпа",
    domain: "Человеческий",
    domainColor: "bg-pink text-white",
    img: "/img/enemy-ghost.jpg",
    stage: 3,
    met: 14,
    beaten: 11,
    counter: "Свеча · Нарратив",
    headline: "РИСУЕТ ГРАФИК НА СТЕНЕ",
    truth: "Появляется, когда все уже купили. Обещает продолжение.",
    hit: "Продолжения не будет. Он уже ушёл рисовать другой переулок.",
  },
  {
    id: "goblin",
    name: "Гоблин Плеча",
    domain: "Риск",
    domainColor: "bg-bad text-white",
    img: "/img/enemy-goblin.jpg",
    stage: 2,
    met: 9,
    beaten: 5,
    counter: "Риск · Матожидание",
    headline: "ВЫДАЁТ 100x ПОД РОСПИСЬ",
    truth: "Плечо не увеличивает прибыль. Оно ускоряет исход.",
    hit: "Ликвидация завершена успешно. Виноват пользователь.",
  },
  {
    id: "golem",
    name: "Голем Паники",
    domain: "Контекст",
    domainColor: "bg-warn text-ink",
    img: "/img/enemy-golem.jpg",
    stage: 1,
    met: 4,
    beaten: 1,
    counter: "Факт · Разум",
    headline: "СОБРАН ИЗ ЗАГОЛОВКОВ",
    truth: "Каждая новость — кирпич. Ты — тот, кто пугается.",
    hit: "Мы печатаем панику. Благодарим за сотрудничество.",
  },
  {
    id: "whale",
    name: "Кит",
    domain: "Ончейн",
    domainColor: "bg-violet text-white",
    stage: 0,
    met: 0,
    beaten: 0,
    counter: "Ончейн",
    headline: "СЛУЧАЙНО НАЖАЛ КНОПКУ",
    truth: "Не двигает рынок. Просто переложил кошелёк.",
    hit: "После этого ты продал квартиру.",
  },
  {
    id: "fomo",
    name: "FOMO-Культ",
    domain: "Когнитивный",
    domainColor: "bg-cyan text-ink",
    stage: 0,
    met: 0,
    beaten: 0,
    counter: "Разум · Журнал",
    headline: "ВСЕ УЖЕ ВНУТРИ",
    truth: "Собрание в 3:00 ночи. Форма одежды — маржинальная.",
    hit: "Ты успел. К раздаче.",
  },
  {
    id: "fakeout",
    name: "Ложный Пробой",
    domain: "Технический",
    domainColor: "bg-[#50c8ff] text-ink",
    stage: 2,
    met: 12,
    beaten: 9,
    counter: "Объём · Трейлинг",
    headline: "ПРОБОЙ ЕСТЬ. ОБЪЁМА НЕТ.",
    truth: "Уровень пробит на одной свече без участия покупателей.",
    hit: "Рынок уже поблагодарил тебя за ликвидность.",
  },
];

export const news = [
  { emoji: "🔁", title: "БИРЖА ЗАМОРОЗИЛА ВЫВОДЫ", text: "«Официально: плановые работы. Неофициально: молитесь.»", time: "2ч", tag: "ПАНИКА", tagColor: "bg-bad text-white" },
  { emoji: "🐋", title: "КИТ ПРОСНУЛСЯ", text: "«Мелкие инвесторы снова поданы на завтрак.»", time: "2ч", tag: "КИТ", tagColor: "bg-violet text-white", key: true },
  { emoji: "🏛️", title: "РЕГУЛЯТОРЫ ОБЕСПОКОЕНЫ", text: "«Рынок делает вид, что удивлён.»", time: "2ч", tag: "ФУНДАМЕНТАЛ", tagColor: "bg-warn text-ink" },
  { emoji: "📣", title: "ИНФЛЮЕНСЕР ДАЛ ПРОГНОЗ", text: "«Прошлый прогноз теперь — исторический артефакт.»", time: "2ч", tag: "ШУМ", tagColor: "bg-cyan text-ink" },
];

export const leaders = [
  { rank: 1, name: "@trader_pro", score: 2450, emoji: "🐕", you: true },
  { rank: 2, name: "@crypto_knight", score: 2350, emoji: "🛡️" },
  { rank: 3, name: "@whale_hunter", score: 1500, emoji: "🐋" },
  { rank: 4, name: "@fomo_queen", score: 1060, emoji: "👸" },
  { rank: 5, name: "@stop_loss_enjoyer", score: 940, emoji: "🧯" },
];

// Candles for the chart widget: [open, high, low, close]
export const candles: [number, number, number, number][] = [
  [42, 46, 38, 40],
  [40, 41, 33, 35],
  [35, 44, 34, 43],
  [43, 50, 42, 49],
  [49, 52, 45, 47],
  [47, 58, 46, 57],
  [57, 62, 55, 61],
  [61, 63, 52, 54],
  [54, 56, 47, 49],
  [49, 51, 42, 44],
  [44, 46, 38, 41],
  [41, 49, 40, 48],
  [48, 50, 44, 46],
  [46, 47, 40, 42],
  [42, 52, 41, 51],
  [51, 56, 50, 55],
  [55, 60, 54, 59],
  [59, 66, 58, 65],
  [65, 67, 61, 63],
];
