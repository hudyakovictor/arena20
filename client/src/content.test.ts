// Чистая логика контент-слоя среза «Арена по прототипу 4.1–4.13».
import { describe, expect, it } from 'vitest';
import {
  avgQualityOf,
  breakVolumeDelta,
  chapterTitleKeyFor,
  getPublicScenario,
  masteryOf,
  orderBookOf,
  pressureOf,
  tabCatalog,
} from './content.js';

describe('content: каталог вкладок (прототип 4.5)', () => {
  it('mvp-001: 4 открытые вкладки + macro/tokenomics/onchain/positionLocked', () => {
    const rows = tabCatalog(getPublicScenario('mvp-001'));
    expect(rows.filter((r) => r.lock === null)).toHaveLength(4);
    const byId = new Map(rows.map((r) => [r.tabId, r]));
    expect(byId.get('macro')).toMatchObject({ scenarioIndex: null, lock: { kind: 'coins' } });
    expect(byId.get('onchain')).toMatchObject({ scenarioIndex: null, lock: { kind: 'level' } });
    expect(byId.get('position')).toMatchObject({ scenarioIndex: null, lock: { kind: 'phase' } });
    expect(byId.get('chart')?.scenarioIndex).toBe(0);
  });

  it('mvp-002 (внутри позиции): вкладка позиции открыта, фазового лока нет', () => {
    const rows = tabCatalog(getPublicScenario('mvp-002'));
    const position = rows.find((r) => r.tabId === 'position');
    expect(position?.lock).toBeNull();
    expect(position?.scenarioIndex).toBe(1);
  });
});

describe('content: стакан и метрики (прототип 4.4)', () => {
  it('стакан детерминирован от scenarioId + contentVersion', () => {
    expect(orderBookOf('mvp-001', '0.1.0')).toEqual(orderBookOf('mvp-001', '0.1.0'));
    expect(orderBookOf('mvp-001', '0.1.0')).not.toEqual(orderBookOf('mvp-002', '0.1.0'));
  });

  it('стакан: 4 asks + 4 bids, спред в разумных пределах', () => {
    const book = orderBookOf('mvp-001', '0.1.0');
    expect(book.asks).toHaveLength(4);
    expect(book.bids).toHaveLength(4);
    expect(book.spreadPct).toBeGreaterThan(0);
    expect(book.spreadPct).toBeLessThan(0.1);
    for (const level of book.asks) expect(level.offsetPct).toBeGreaterThan(0);
    for (const level of book.bids) expect(level.offsetPct).toBeLessThan(0);
  });

  it('дельта объёма пробоя считается от среднего видимых свечей', () => {
    const candles = Array.from({ length: 10 }, (_, i) => ({
      t: i,
      o: 100,
      h: 101,
      l: 99,
      c: 100,
      v: i >= 7 ? 50 : 100,
    }));
    expect(breakVolumeDelta(candles)).toBe(-41);
    expect(breakVolumeDelta(candles.slice(0, 5))).toBeNull();
  });
});

describe('content: мета навыков и сценариев', () => {
  it('мастерство: 0/1–2/3–7/8+ применений → 0/1/2/3', () => {
    expect([0, 1, 2, 3, 7, 8, 40].map(masteryOf)).toEqual([0, 1, 1, 2, 2, 3, 3]);
  });

  it('среднее качество: null без применений, иначе округление', () => {
    expect(avgQualityOf(undefined)).toBeNull();
    expect(avgQualityOf({ used: 0, qualitySum: 0 })).toBeNull();
    expect(avgQualityOf({ used: 2, qualitySum: 141 })).toBe(71);
  });

  it('theoryKey навыка ведёт к заголовку главы академии', () => {
    expect(chapterTitleKeyFor('academy.risk')).toBe('academy.ch.risk.title');
    expect(chapterTitleKeyFor('academy.timeframes')).toBe('academy.ch.timeframes.title');
  });

  it('давление равно сложности сценария', () => {
    expect(pressureOf(getPublicScenario('mvp-001'))).toBe(getPublicScenario('mvp-001').difficulty);
  });
});
