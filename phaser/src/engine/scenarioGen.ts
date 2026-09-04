// SIGNAL ARENA — генератор содержимого источников (аудит A4).
// Было: новости, стакан, позиция и распределение «тени» — константы внутри
// методов отрисовки, одинаковые для любого врага и seed.
// Стало: всё строится из шаблона встречи и seed, как и улики.

import { SeededRng, hashString } from './rng';
import type { EncounterInstance, SourceId } from '../types';

export interface Candle {
  /** Индекс свечи слева направо. */
  i: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  /** Свеча несёт улику — на ней есть интерактивная зона. */
  evidenceId?: string;
}

export interface NewsItem {
  headline: string;
  source: string;
  time: string;
  /** Заслуживает ли источник доверия. */
  credible: boolean;
  evidenceId?: string;
}

export interface PositionData {
  deposit: number;
  riskPct: number;
  riskAmount: number;
  stopPct: number;
  leverage: number;
  liquidationPct: number;
  rr: string;
  recentSeries: string;
  journalNote: string;
}

export interface OrderbookData {
  bids: { price: string; size: string }[];
  asks: { price: string; size: string }[];
  wall: string;
  funding: string;
  openInterest: string;
  liquidationCluster: string;
}

export interface Scenario {
  candles: Candle[];
  news: NewsItem[];
  position: PositionData;
  orderbook: OrderbookData;
  /** Распределение ответов других игроков, в процентах. */
  shadow: number[];
  /** Свечи «после» — проигрыш вперёд. */
  forward: (correct: boolean) => Candle[];
}

const NEWS_TRUSTED = [
  'Биржевые данные',
  'Отчёт аналитического деска',
  'Официальный блог проекта',
  'Ончейн-обозреватель',
];
const NEWS_SHADY = [
  'Анонимный телеграм-канал',
  'Инфлюенсер с 40к подписчиков',
  'Форум трейдеров',
  'Скриншот без ссылки',
];

/** Генерирует правдоподобную серию свечей от seed. */
function buildCandles(rng: SeededRng, base: number, count: number, evidenceIdx: number, evidenceId?: string): Candle[] {
  const out: Candle[] = [];
  let price = base;
  // общий уклон серии, чтобы график имел структуру, а не был шумом
  const drift = (rng.next() - 0.45) * base * 0.004;
  const vol = base * (0.004 + rng.next() * 0.006);
  const avgVolume = 800 + rng.int(0, 1400);
  for (let i = 0; i < count; i++) {
    const open = price;
    const move = drift + (rng.next() - 0.5) * vol * 2;
    const close = Math.max(base * 0.5, open + move);
    const wick = vol * (0.3 + rng.next() * 0.9);
    const high = Math.max(open, close) + wick * rng.next();
    const low = Math.min(open, close) - wick * rng.next();
    // на свече-улике объём аномально низкий — это и есть предмет разговора
    const isEvidence = i === evidenceIdx;
    const volume = isEvidence
      ? Math.round(avgVolume * (0.35 + rng.next() * 0.25))
      : Math.round(avgVolume * (0.75 + rng.next() * 0.6));
    out.push({
      i,
      open,
      high,
      low,
      close,
      volume,
      evidenceId: isEvidence ? evidenceId : undefined,
    });
    price = close;
  }
  return out;
}

const BASE_PRICE: Record<string, number> = {
  'BTC/USDT': 68000,
  'ETH/USDT': 3200,
  'SOL/USDT': 145,
  'AVAX/USDT': 32,
  'ARB/USDT': 1.1,
};

/** Строит полный набор данных источников для встречи. */
export function buildScenario(enc: EncounterInstance): Scenario {
  const rng = new SeededRng(enc.seed ^ hashString('scenario'));
  const base = BASE_PRICE[enc.ticker] ?? 100;

  // улика на графике — та, что помечена isCorrect и относится к графику
  const chartEvidence = enc.mutatedEvidence.find((z) => z.source === 'chart' && z.isCorrect);
  const count = 14;
  const evIdx = 6 + rng.int(0, 4);
  const candles = buildCandles(rng, base, count, evIdx, chartEvidence?.id);

  // ── Новости: одна достоверная (она же улика), остальные — шум ──
  const newsEvidence = enc.mutatedEvidence.find((z) => z.source === 'news' && z.isCorrect);
  const hour = 9 + rng.int(0, 9);
  const mkTime = (off: number) =>
    `${String(hour).padStart(2, '0')}:${String((rng.int(0, 5) * 10 + off) % 60).padStart(2, '0')}`;
  const shortTicker = enc.ticker.split('/')[0];
  const news: NewsItem[] = [
    {
      headline: `Кит перевёл ${rng.int(3, 18)} 000 ${shortTicker} на биржу`,
      source: rng.pick(NEWS_SHADY),
      time: mkTime(4),
      credible: false,
    },
    {
      headline: newsEvidence
        ? newsEvidence.label
        : `Объём спота ниже среднего на ${rng.int(22, 48)}%`,
      source: rng.pick(NEWS_TRUSTED),
      time: mkTime(2),
      credible: true,
      evidenceId: newsEvidence?.id,
    },
    {
      headline: rng.pick([
        'Аналитик обещает новый максимум на этой неделе',
        'Канал публикует «инсайд» о листинге',
        'Прогноз: цель по монете удвоится за месяц',
      ]),
      source: rng.pick(NEWS_SHADY),
      time: mkTime(0),
      credible: false,
    },
  ];

  // ── Позиция и риск ──
  const deposit = [1200, 2000, 2400, 3500, 5000][rng.int(0, 4)];
  const riskPct = 1;
  const stopPct = Number((1.2 + rng.next() * 2).toFixed(1));
  const leverage = [1, 2, 3, 5, 10][rng.int(0, 4)];
  const position: PositionData = {
    deposit,
    riskPct,
    riskAmount: Math.round((deposit * riskPct) / 100),
    stopPct,
    leverage,
    liquidationPct: Number((100 / leverage - stopPct).toFixed(1)),
    rr: `1 : ${(1.4 + rng.next() * 1.6).toFixed(1)}`,
    recentSeries: rng.pick(['проигрыш · проигрыш · выигрыш', 'выигрыш · проигрыш', 'три проигрыша подряд']),
    journalNote: rng.pick([
      'Дважды заходил без стопа',
      'Средний размер выше плана на 40%',
      'Три входа подряд без сигнала',
    ]),
  };

  // ── Стакан ──
  const mid = candles[candles.length - 1].close;
  const fmt = (v: number) => (mid > 100 ? v.toFixed(0) : v.toFixed(3));
  const orderbook: OrderbookData = {
    bids: [0, 1, 2].map((k) => ({
      price: fmt(mid * (1 - 0.001 * (k + 1))),
      size: (rng.next() * 2 + 0.2).toFixed(2),
    })),
    asks: [0, 1, 2].map((k) => ({
      price: fmt(mid * (1 + 0.001 * (k + 1))),
      size: (rng.next() * 2 + 0.2).toFixed(2),
    })),
    wall: rng.next() > 0.5 ? 'Стенок нет — стакан тонкий' : `Стена на покупку ${fmt(mid * 0.985)}`,
    funding: `${rng.next() > 0.4 ? '+' : '-'}0.0${rng.int(1, 9)}%`,
    openInterest: rng.next() > 0.5 ? 'растёт' : 'падает',
    liquidationCluster: `Скопление стопов ${rng.int(2, 6)}% ниже`,
  };

  // ── Тень арены: как ответили другие ──
  const answerCount = enc.mutatedAnswers.length || 4;
  const shadow = buildShadow(rng, answerCount, enc.correctAnswer);

  // ── Проигрыш вперёд: продолжение серии ──
  const forward = (correct: boolean): Candle[] => {
    const frng = new SeededRng(enc.seed ^ hashString(correct ? 'fwd-ok' : 'fwd-bad'));
    const last = candles[candles.length - 1];
    const out: Candle[] = [];
    let price = last.close;
    // если игрок прав — цена подтверждает его решение, иначе идёт против
    const dir = correct ? 1 : -1;
    const step = base * 0.004;
    for (let i = 0; i < 6; i++) {
      const open = price;
      const close = open + dir * step * (0.4 + frng.next()) * (enc.isMirrored ? -1 : 1);
      const wick = step * frng.next();
      out.push({
        i: count + i,
        open,
        high: Math.max(open, close) + wick,
        low: Math.min(open, close) - wick,
        close,
        volume: Math.round(700 + frng.next() * 900),
      });
      price = close;
    }
    return out;
  };

  return { candles, news, position, orderbook, shadow, forward };
}

/**
 * Распределение ответов «толпы»: верный вариант получает заметную долю,
 * но ловушка почти всегда собирает сопоставимую — в этом и урок.
 */
function buildShadow(rng: SeededRng, count: number, correctIdx: number): number[] {
  const raw: number[] = [];
  for (let i = 0; i < count; i++) {
    raw.push(i === correctIdx ? 25 + rng.next() * 25 : 5 + rng.next() * 30);
  }
  const sum = raw.reduce((a, b) => a + b, 0);
  const pct = raw.map((v) => Math.round((v / sum) * 100));
  // добираем до ровных 100%
  const diff = 100 - pct.reduce((a, b) => a + b, 0);
  pct[correctIdx] += diff;
  return pct;
}

/** Человекочитаемое имя источника для заголовка панели. */
export const SOURCE_TITLES: Record<SourceId, string> = {
  chart: 'График',
  news: 'Новости',
  position: 'Позиция и риск',
  wallet: 'Кошелёк',
  tokenomics: 'Токеномика',
  onchain: 'Ончейн',
  orderbook: 'Стакан',
  sentiment: 'Настроения',
};
