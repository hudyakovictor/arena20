// SIGNAL ARENA — BalanceConfig — ЧАСТЬ 6 §9
// Конфиг — единственное место с числами механик M1-M15
export const balanceConfig = {
  xp: {
    perCorrect: 24,
    perCorrectUnjustified: 8, // M1 без верной улики
    perChapterExam: 50,
    perDailyWarmup: 8,
    perCombo: 12,
    levelThresholds: [0,100,250,500,1000,1800,3000,4800,7200,10000,15000,22000,31000,42000,56000]
  },
  coins: { perCorrect: 6, perCorrectUnjustified: 2, perChapterExam: 15, perDailyWarmup: 2 },
  // M15 Бюджет риска — единственное ограничение сессии
  riskBudget: {
    initial: 100,
    max: 100,
    // списание = base * confidenceMultiplier * domainMultiplier
    baseLoss: { technical: 8, risk: 14, context: 10, crypto: 10, human: 12, cognitive: 12 },
    // M3 ставка уверенности
    confidenceMul: { low: 0.6, mid: 1.0, high: 1.6 },
    blindSourceCost: 6, // M9
    restoreOnCorrect: 6,
    restoreOnUnjustified: 0,
    zeroTrigger: 'DrawdownLeviathan' // событийная встреча
  },
  // M1 Улика
  evidence: {
    requiredInEpoch: { street: 1, cabinet: 1, terminal: 2, system: 2 } as const,
    highlightInEpoch: { street: true, cabinet: false, terminal: false, system: false },
    needButton: { street: true, cabinet: false, terminal: false, system: false },
    partialRewardRatio: 0.35
  },
  // M2 Стек решений
  sequence: {
    introducedAt: 14,
    slotsByEpoch: { street: 2, cabinet: 3, terminal: 4, system: 4 } as const,
    hasDecoyInSystem: true
  },
  // M3 Ставка уверенности
  confidence: {
    introducedAt: 3,
    noPenaltyUntil: 3,
    multipliers: { low: 0.6, mid: 1, high: 1.6 },
    hubrisThreshold: 4 // подряд high+ошибка -> Dragon
  },
  // M4 Вердикт конфликта
  verdict: { introducedAt: 21 },
  // M5 Опознание врага
  identify: {
    introducedAt: 8,
    optionsByEpoch: { street: 2, cabinet: 4, terminal: 4, system: 0 } as const // 0 = по журналу
  },
  // M6 Проигрыш вперёд
  playForward: { durationMs: 3200, candleCount: 6 },
  // M7 Свиток ошибок
  errorScroll: { maxEntries: 12, priorityBoost: 2 },
  // M8 Комбо
  combo: { requiredCorrect: 3, needRank: 2 },
  // M9 Слепой источник
  blind: { introducedAt: 30, cost: 6 },
  // M10 Холодная голова
  coldHead: {
    waitCorrectRatio: 0.28,
    delayMs: 1400,
    tiltThreshold: 2 // серия ошибок
  },
  // M12 Кампания врага — интервалы между стадиями
  campaign: { minLevelGap: 6 },
  // M13 Погода
  weather: { modes: ['TREND','FLAT','VOLATILE','NEWS','LATE_CYCLE'] as const },
  // M14 Тень арены
  shadow: { showFrom: 1 },
  // уровни эпох
  epochBorders: { street: [1,20], cabinet: [21,50], terminal: [51,80], system: [81,99] } as const
};
