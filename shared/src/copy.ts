// Copy-keys (минимум для vertical slice; полный i18n — T122).
// Тон: панк-таблоидная криптосатира (style-tone.txt). RU — первый язык MVP.
import type { BrowserTabId } from './schemas.js';

export type Lang = 'ru' | 'en';

export const TAB_LABEL: Record<BrowserTabId, { ru: string; en: string }> = {
  chart: { ru: 'ГРАФИК', en: 'CHART' },
  'higher-tf': { ru: 'СТАРШИЕ ТФ', en: 'HIGHER TF' },
  volume: { ru: 'ОБЪЁМ', en: 'VOLUME' },
  news: { ru: 'НОВОСТИ', en: 'NEWS' },
  social: { ru: 'СОЦФОН', en: 'SENTIMENT' },
  macro: { ru: 'МАКРО', en: 'MACRO' },
  tokenomics: { ru: 'ТОКЕНОМИКА', en: 'TOKENOMICS' },
  onchain: { ru: 'ОНЧЕЙН', en: 'ON-CHAIN' },
  position: { ru: 'ПОЗИЦИЯ', en: 'POSITION' },
  journal: { ru: 'ЖУРНАЛ', en: 'JOURNAL' },
};

const RU: Record<string, string> = {
  'app.tagline': 'ТРЕНАЖЁР РЕШЕНИЙ · НЕ БИРЖА',
  'app.disclaimer':
    'Игра не даёт торговых сигналов и не обещает дохода. Внутриигровые ресурсы не выводятся.',
  'app.loading': 'Загрузка архива рыночных катастроф…',
  'nav.home': 'ГЛАВНАЯ',
  'nav.academy': 'ОБУЧЕНИЕ',
  'nav.arena': 'ПРАКТИКА',
  'nav.bestiary': 'УГРОЗЫ',
  'nav.more': 'ЕЩЁ',
  'shell.scenarioProgress': 'СЦЕНАРИЙ',
  'shell.protocol': 'ПРАВИЛО',
  'arena.brief': 'БРИФИНГ',
  'arena.task': 'ЗАДАЧА',
  'arena.skills': 'КАРТЫ НАВЫКОВ',
  'arena.decisions': 'РЕШЕНИЕ',
  'arena.confirm': 'ЗАФИКСИРОВАТЬ РЕШЕНИЕ',
  'arena.confirmHint': 'Будущее скрыто. После фиксации — раскроем архив.',
  'arena.step2': 'ВТОРОЙ ШАГ',
  'arena.futureHidden': 'БУДУЩЕЕ СКРЫТО',
  'arena.t0': 't0 · ТОЧКА РЕШЕНИЯ',
  'arena.unskill': 'СНЯТЬ КАРТУ',
  'arena.pause': 'ПАУЗА',
  'arena.exit': 'ПОКИНУТЬ СЦЕНАРИЙ',
  'arena.exitHint': 'Рынок подождёт. Он вообще никуда не торопится.',
  'reveal.title': 'АРХИВ РАСКРЫТ',
  'reveal.play': 'ПРОКРУТИТЬ ПОСЛЕДСТВИЯ',
  'reveal.fact': 'РЫНОЧНЫЙ ФАКТ',
  'reveal.consequence': 'ПОСЛЕДСТВИЕ ДЕЙСТВИЯ',
  'reveal.quality': 'КАЧЕСТВО РЕШЕНИЯ',
  'reveal.next': 'СЛЕДУЮЩАЯ ОХОТА',
  'reveal.review': 'РАЗБОР',
  'reveal.rule': 'ПЕРЕНОСИМОЕ ПРАВИЛО',
  'verdict.agree': 'РЫНОК СОГЛАСИЛСЯ. ЭТО НЕ ЗНАЧИТ, ЧТО ТЫ БЫЛ ПРАВ.',
  'verdict.disagree': 'РЫНОК НЕ СОГЛАСИЛСЯ. ЭТО НЕ ЗНАЧИТ, ЧТО ТЫ ОШИБСЯ.',
  'states.loading': 'ЗАГРУЗКА ДАННЫХ',
  'states.loadingSub': 'Рынок ищет оправдание. Подожди.',
  'states.offline': 'СВЯЗИ НЕТ',
  'states.offlineSub': 'Хорошая новость: рынок тоже никуда не убежал.',
  'states.locked': 'ЗАПЕРТО',
  'states.lockedSub': 'Сущность пока считает тебя недостаточно удобной жертвой.',
  'states.error': 'ДАННЫЕ НЕ ЗАГРУЖЕНЫ',
  'states.errorSub': 'Даже сервер иногда делает вид, что всё под контролем.',
  'states.empty': 'ЗДЕСЬ ПОКА ПУСТО',
  'states.emptySub': 'Даже паника начинается с чистого листа.',
  'states.saved': 'РЕЗУЛЬТАТ СОХРАНЁН',
  'states.savedSub': 'Теперь ошибка официально принадлежит истории.',
  'states.noTrade': 'ВНЕ РЫНКА',
  'states.noTradeSub': 'Сделка не открыта. Паника тоже.',
  'academy.title': 'АКАДЕМИЯ',
  'academy.chapters': 'ГЛАВЫ',
  'academy.sub': 'Теория объясняет принцип. Практика проверяет, применил ли ты его в шуме.',
  'bestiary.title': 'УГРОЗЫ',
  'bestiary.sub':
    'Сущность — не враг, которого убивают. Это давление, которое не пускают в решение.',
  'journal.title': 'ЖУРНАЛ РЕШЕНИЙ',
  'journal.sub': 'Не свиток ошибок, а история: паттерны, сильные навыки, слабые зоны.',
  'tournament.title': 'ТУРНИРЫ',
  'tournament.sub': 'Один набор данных на всех. Победа — по качеству, скорость — только tie-break.',
  'market.title': 'МАРКЕТ',
  'market.sub': 'Косметика и контент. Ответы, оценки и риск-лимиты не продаются.',
  'profile.title': 'ПРОФИЛЬ',
  'more.title': 'ЕЩЁ',
  'settings.title': 'НАСТРОЙКИ',
  'settings.sound': 'ЗВУК',
  'settings.reduceMotion': 'МЕНЬШЕ ДВИЖЕНИЯ',
  'settings.language': 'ЯЗЫК',
  'home.title': 'ГЛАВНАЯ',
  'home.continue': 'ПРОДОЛЖИТЬ ОХОТУ',
  'home.daily': 'СЕГОДНЯ В АРХИВЕ',
  'common.back': 'НАЗАД',
  'common.close': 'ЗАКРЫТЬ',
  'common.retry': 'ПОВТОРИТЬ',
  // --- home ---
  'home.greet': 'Архив катастроф открыт. Выбирай, где сегодня ошибаться со вкусом.',
  'home.resume': 'ПРОДОЛЖИТЬ СЦЕНАРИЙ',
  'home.start': 'НАЧАТЬ ОХОТУ',
  'home.scenarios': 'СЦЕНАРИИ',
  'home.sections': 'РАЗДЕЛЫ',
  'home.best': 'ЛУЧШЕЕ',
  // --- academy ---
  'academy.topic': 'ТЕМА',
  'academy.train': 'ТРЕНИРОВАТЬ В АРЕНЕ',
  'academy.linked': 'СВЯЗАННЫЕ НАВЫКИ',
  'academy.ch.risk.title': 'Риск: размер имеет значение',
  'academy.ch.risk.body':
    'Риск определяется до входа: доля депозита, стоп, условие отмены. Рынок платит тем, кто переживает ошибки, а не тем, кто их избегает.',
  'academy.ch.structure.title': 'Структура: читай следы, а не свечи',
  'academy.ch.structure.body':
    'Уровень, пробой, ретест, объём. Отдельная свеча врёт; структура из трёх событий врёт реже. Подтверждение обязательно.',
  'academy.ch.tf.title': 'Таймфреймы: старшие решают',
  'academy.ch.tf.body':
    'Младший таймфрейм показывает шум красиво. Направление и уровни бери со старшего, точку входа — с младшего.',
  'academy.ch.noise.title': 'Шум: карантин для новостей',
  'academy.ch.noise.body':
    'Заголовок — это эмоция с дедлайном. Новость уходит в карантин на сессию; решение — только по структуре и объёму.',
  'academy.ch.discipline.title': 'Дисциплина: система больше сделки',
  'academy.ch.discipline.body':
    'Зелёная сделка мимо плана — красный флаг. Пауза после убытка, журнал, запрет на revenge: скучно, прибыльно, обязательно.',
  'academy.ch.plan.title': 'План: отмена пишется заранее',
  'academy.ch.plan.body':
    'У каждой идеи есть условие «я неправ»: цена, время, событие. Нет условия отмены — нет идеи, есть надежда.',
  // --- bestiary ---
  'bestiary.tell': 'ПРИЗНАК',
  'bestiary.counter': 'КОНТР-ПРИЁМ',
  'bestiary.train': 'ОХОТИТЬСЯ В АРЕНЕ',
  'bestiary.mastered': 'ОСВОЕНА',
  'bestiary.seen': 'ЗАМЕЧЕНА',
  // --- journal ---
  'journal.patterns': 'ПОВТОРЯЮЩИЕСЯ ПАТТЕРНЫ',
  'journal.history': 'ИСТОРИЯ РЕШЕНИЙ',
  'journal.repeat': 'РЕКОМЕНДАЦИИ ПО ПОВТОРУ',
  'journal.best': 'ЛУЧШЕЕ КАЧЕСТВО',
  'journal.fix': 'ИСПРАВЛЕНИЕ',
  'journal.empty':
    'Пока пусто: пройди первый сценарий, и журнал начнёт коллекционировать твои паттерны.',
  // --- tournament ---
  'tourn.join': 'ВОЙТИ',
  'tourn.joined': 'ТЫ ВНУТРИ',
  'tourn.board': 'ЛИДЕРБОРД',
  'tourn.you': 'ТЫ',
  'tourn.note':
    'Асинхронно: один набор данных на всех, победа по качеству. Скорость — только tie-break.',
  'tourn.rookie.title': 'ПЕСОЧНИЦА: ПЕРВАЯ КРОВЬ',
  'tourn.rookie.body': 'Два архивных сценария. Идеально для калибровки прицела.',
  'tourn.risk.title': 'КУБОК ХОЛОДНОЙ ГОЛОВЫ',
  'tourn.risk.body': 'Протокол «Сначала риск». Гоблины плеча не допускаются.',
  // --- market ---
  'market.buy': 'КУПИТЬ',
  'market.owned': 'КУПЛЕНО',
  'market.balance': 'БАЛАНС',
  'market.noFunds': 'Не хватает кредитов. Арена платит за качество, а не за надежду.',
  'market.bought': 'Куплено. Косметика не влияет на качество решений — только на стиль поражения.',
  'market.i.theme-neon.title': 'Тема «Неоновая свалка»',
  'market.i.theme-neon.body': 'Косметическая тема интерфейса. Кислоты станет больше, ошибок — нет.',
  'market.i.avatar-golem.title': 'Аватар «Голем-якорь»',
  'market.i.avatar-golem.body': 'Тяжёлый силуэт для профиля. К старой цене больше не приковывает.',
  'market.i.season1.title': 'Сезонный набор «Паника-99»',
  'market.i.season1.body': 'Рамки и фоны сезона. Паника коллекционная, убытки — нет.',
  // --- profile ---
  'profile.stats': 'СТАТИСТИКА',
  'profile.ach': 'ДОСТИЖЕНИЯ',
  'profile.completed': 'СЦЕНАРИЕВ ЗАКРЫТО',
  'ach.first.title': 'Первая кровь',
  'ach.first.body': 'Закрой первый сценарий — с любым качеством.',
  'ach.clean70.title': 'Холодная голова',
  'ach.clean70.body': 'Качество 70+ в любом сценарии.',
  'ach.hunter.title': 'Охотник',
  'ach.hunter.body': 'Закрой оба архивных сценария.',
  'ach.scholar.title': 'Архивариус',
  'ach.scholar.body': 'Открой три темы Академии.',
  // --- more ---
  'more.sections': 'ВСЕ РАЗДЕЛЫ',
  'more.about': 'О ТРЕНАЖЁРЕ',
  'more.aboutBody':
    'SIGNAL ARENA — тренажёр качества решений на исторических ситуациях. Не биржа, не сигналы, не обещание дохода.',
  'more.legal': 'ПРАВОЕ И ДИСКЛЕЙМЕРЫ',
  'more.legalBody':
    'Обучающий тренажёр на исторических данных, а не инвестиционная рекомендация. Внутриигровые ресурсы не выводятся.',
  // --- fixture: scenario mvp-001 (fake breakout) ---
  'scen.mvp-001.context':
    'Актив три дня рос на новостях. Толпа празднует пробой. Объём на пробое — мертворождённый.',
  'scen.mvp-001.goal': 'Реши до раскрытия архива: здесь есть сигнал — или только шум с фанфарами?',
  'scen.mvp-001.fact':
    'Пробой не удержался: цена вернулась под уровень за 6 часов, объём покупок иссяк.',
  'scen.mvp-001.source': 'Архив · спот · 15m · датасет v0.1.0',
  'scen.mvp-001.d0': 'Войти на пробое',
  'scen.mvp-001.d0r':
    'Вход в шум без подтверждения: пробой без объёма — классическая жертва толпе.',
  'scen.mvp-001.d1': 'Ждать ретест',
  'scen.mvp-001.d1r': 'Терпеливое решение: подтверждение ретестом отделяет сигнал от фанфар.',
  'scen.mvp-001.d2': 'Сократить риск',
  'scen.mvp-001.d2r': 'Осторожно, но без позиции сокращать нечего: действие мимо контекста.',
  'scen.mvp-001.d3': 'Остаться вне рынка',
  'scen.mvp-001.d3r': 'Вне рынка — тоже решение: нет подтверждения — нет сделки.',
  'scen.mvp-001.tab.chart':
    'Структура: три дня роста, пробой уровня. Объём на пробое ниже среднего.',
  'scen.mvp-001.tab.volume':
    'Объём покупок затухает три сессии подряд. Пробой случился на самом тонком баре.',
  'scen.mvp-001.tab.news': 'Заголовки трубят о «новой эре». Новость — не сигнал, а well-timed шум.',
  'scen.mvp-001.tab.social':
    'Соцфон: эйфория. Индекс веры в график зашкаливает — толпа уже внутри.',
  'scen.mvp-001.step2q': 'Какой риск допустим, если входишь?',
  'scen.mvp-001.s0': '0.5% — пережить ошибку',
  'scen.mvp-001.s0r': 'Риск, с которым можно жить, даже если рынок идёт не туда.',
  'scen.mvp-001.s1': '2% — стандартная ставка',
  'scen.mvp-001.s1r': 'Терпимо, но для неподтверждённого пробоя — щедрость за счёт депозита.',
  'scen.mvp-001.s2': '10% — пан или пропал',
  'scen.mvp-001.s2r': 'Это не риск-менеджмент, а жертвоприношение с красивым названием.',
  // --- fixture: scenario mvp-002 (in position) ---
  'scen.mvp-002.context':
    'Ты в лонге от ретеста. Цена топчется у входа четвёртый час. Стоп близко, эго — ближе.',
  'scen.mvp-002.goal': 'Позиция открыта. Реши: план жив — или ты уже усредняешь надежду?',
  'scen.mvp-002.fact':
    'Уровень удержали ещё 2 часа, затем — импульсный слив к стопам. План требовал выхода раньше.',
  'scen.mvp-002.source': 'Архив · perp · 5m · датасет v0.1.0',
  'scen.mvp-002.d0': 'Держать по плану',
  'scen.mvp-002.d0r': 'Дисциплина: условия отмены не сработали — система важнее страха.',
  'scen.mvp-002.d1': 'Сократить половину',
  'scen.mvp-002.d1r': 'Сначала риск: фиксация части снимает давление и сохраняет голову.',
  'scen.mvp-002.d2': 'Усреднить вход',
  'scen.mvp-002.d2r': 'Усреднение ошибки без плана: надежда — самая дорогая валюта.',
  'scen.mvp-002.d3': 'Выйти полностью',
  'scen.mvp-002.d3r': 'Панический выход до отмены идеи: страх тоже умеет маскироваться под риск.',
  'scen.mvp-002.tab.chart':
    'Консолидация у точки входа. Структура пока цела, но импульс покупателя угас.',
  'scen.mvp-002.tab.position':
    'Позиция: лонг от ретеста, +0.4%. Стоп — за локальным минимумом, риск 1%.',
  'scen.mvp-002.tab.social': 'Толпа требует «держать до луны». Стадо редко платит за твои стопы.',
  // --- fixture skills ---
  'skill.risk-first.title': 'Сначала риск, потом вход',
  'skill.risk-first.body': 'Определи, сколько готов потерять, до того как мечтаешь о прибыли.',
  'skill.no-confirm.title': 'Нет подтверждения — нет сделки',
  'skill.no-confirm.body': 'Пробой без объёма и ретеста — это фанфары, а не сигнал.',
  'skill.htf.title': 'Проверь старший таймфрейм',
  'skill.htf.body': 'Младший ТФ врёт убедительно. Старший — реже и дороже.',
  'skill.news-noise.title': 'Новость — не сигнал',
  'skill.news-noise.body': 'Заголовок продаёт эмоции. Сигнал продаёт только цена с объёмом.',
  'skill.no-average.title': 'Не усредняй ошибку',
  'skill.no-average.body': 'Доливка к убытку без плана превращает ошибку в образ жизни.',
  'skill.flat-ok.title': 'Вне рынка — тоже решение',
  'skill.flat-ok.body': 'Пропуск сделки стоит ноль. Плохая сделка — всегда дороже.',
  'skill.invalidate.title': 'Отмена идеи — заранее',
  'skill.invalidate.body':
    'Условие «я был неправ» пишется до входа, а не придумывается в просадке.',
  'skill.plan-profit.title': 'Прибыль не оправдывает нарушение',
  'skill.plan-profit.body': 'Зелёная сделка мимо системы — всё равно красный флаг.',
  // --- fixture entities ---
  'entity.fake-breakout-phantom.body': 'Рисует пробой, заманивает толпу, исчезает до ретеста.',
  'entity.fake-breakout-phantom.tell': 'Пробой уровня на затухающем объёме + эйфория в заголовках.',
  'entity.fake-breakout-phantom.counter': 'Жди ретест. Нет подтверждения — нет сделки.',
  'entity.fomo-wraith.body': 'Шепчет, что поезд уходит. Поезд обычно едет в депо.',
  'entity.fomo-wraith.tell': 'Зуд «войти сейчас», хотя план требовал ждать.',
  'entity.fomo-wraith.counter': 'Пауза 10 минут. Сигнал подождёт, призрак — нет.',
  'entity.leverage-goblin.body':
    'Предлагает плечо как shortcut к богатству. Путь ведёт к ликвидации.',
  'entity.leverage-goblin.tell': 'Желание «ускориться» после серии хороших решений.',
  'entity.leverage-goblin.counter': 'Фиксированный риск 0.5–1%. Гоблин голодает на диете.',
  'entity.headline-titan.body': 'Метает заголовки-молнии. Каждая бьёт точно в дисциплину.',
  'entity.headline-titan.tell': 'Решение хочется принять сразу после новости.',
  'entity.headline-titan.counter': 'Новость — в карантин на одну сессию. Сначала график.',
  'entity.anchor-golem.body': 'Приковывает к старой цене. «А ведь было по…» — его заклинание.',
  'entity.anchor-golem.tell': 'Оценка сделки от прошлого экстремума, а не от текущего контекста.',
  'entity.anchor-golem.counter': 'Переоцени позицию от текущей цены, как будто входишь сейчас.',
  'entity.revenge-wraith.body':
    'После убытка предлагает отыграться немедленно. Принимает только депозиты.',
  'entity.revenge-wraith.tell': 'Злость после стопа и тяга «вернуть прямо сейчас».',
  'entity.revenge-wraith.counter': 'Протокол «После убытка»: пауза, журнал, разбор. Потом — рынок.',
  // --- fixture protocols ---
  'protocol.risk-first.title': 'Сначала риск',
  'protocol.risk-first.rule': 'Оценивается управление риском: размер, стоп, отмена идеи.',
  'protocol.evidence-only.title': 'Только доказательства',
  'protocol.evidence-only.rule': 'Решение должно опираться на факты вкладок, а не на шум.',
  'protocol.noise-quarantine.title': 'Шумовой карантин',
  'protocol.noise-quarantine.rule':
    'Новости и соцфон игнорируются: только структура, объём и план.',
  'protocol.flat-ok.title': 'Не входить — тоже решение',
  'protocol.flat-ok.rule': 'Воздержание при слабом сигнале оценивается наравне со сделкой.',
};

const EN: Record<string, string> = {
  'app.tagline': 'DECISION TRAINER · NOT AN EXCHANGE',
  'nav.home': 'HOME',
  'nav.academy': 'LEARN',
  'nav.arena': 'PRACTICE',
  'nav.bestiary': 'THREATS',
  'nav.more': 'MORE',
  'arena.confirm': 'LOCK DECISION',
  'arena.futureHidden': 'FUTURE HIDDEN',
  'reveal.quality': 'DECISION QUALITY',
};

export const COPY: Record<Lang, Record<string, string>> = { ru: RU, en: EN };

/** Безопасное чтение копи: fallback EN → ключ. */
export function t(lang: Lang, key: string): string {
  return COPY[lang]?.[key] ?? COPY.en[key] ?? key;
}
