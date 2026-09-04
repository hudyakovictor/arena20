// Начисление наград и списание запаса риска.
import { describe, it, expect } from 'vitest';
import { scoreEncounter } from '../scoring';
import { balanceConfig } from '../../config/balanceConfig';
import { structureForLevel } from '../../config/epochStructure';

const base = {
  domain: 'technical' as const,
  level: 10,
  epoch: 'street',
  streak: 0,
};

describe('scoreEncounter', () => {
  it('верно и обоснованно — полная награда и возврат запаса', () => {
    const v = scoreEncounter({ ...base, isCorrect: true, isJustified: true, confidence: 'mid' });
    expect(v.xp).toBe(balanceConfig.xp.perCorrect);
    expect(v.coins).toBe(balanceConfig.coins.perCorrect);
    expect(v.budgetDelta).toBeGreaterThan(0);
    expect(v.enemyDefeated).toBe(true);
  });

  it('верно, но без доказательства — урезанная награда, враг не побеждён', () => {
    const v = scoreEncounter({ ...base, isCorrect: true, isJustified: false, confidence: 'mid' });
    expect(v.xp).toBe(balanceConfig.xp.perCorrectUnjustified);
    expect(v.xp).toBeLessThan(balanceConfig.xp.perCorrect);
    expect(v.enemyDefeated).toBe(false);
  });

  it('ошибка не даёт наград и списывает запас', () => {
    const v = scoreEncounter({ ...base, isCorrect: false, isJustified: false, confidence: 'mid' });
    expect(v.xp).toBe(0);
    expect(v.coins).toBe(0);
    expect(v.budgetDelta).toBeLessThan(0);
  });

  it('высокая ставка делает ошибку дороже, низкая — дешевле', () => {
    const low = scoreEncounter({ ...base, isCorrect: false, isJustified: false, confidence: 'low' });
    const mid = scoreEncounter({ ...base, isCorrect: false, isJustified: false, confidence: 'mid' });
    const high = scoreEncounter({ ...base, isCorrect: false, isJustified: false, confidence: 'high' });
    expect(Math.abs(low.budgetDelta)).toBeLessThan(Math.abs(mid.budgetDelta));
    expect(Math.abs(high.budgetDelta)).toBeGreaterThan(Math.abs(mid.budgetDelta));
  });

  it('уверенность влияет на опыт при верном ответе', () => {
    const low = scoreEncounter({ ...base, isCorrect: true, isJustified: true, confidence: 'low' });
    const high = scoreEncounter({ ...base, isCorrect: true, isJustified: true, confidence: 'high' });
    expect(high.xp).toBeGreaterThan(low.xp);
  });

  it('домен риска списывает больше, чем технический', () => {
    const tech = scoreEncounter({ ...base, isCorrect: false, isJustified: false, confidence: 'mid' });
    const risk = scoreEncounter({
      ...base,
      domain: 'risk',
      isCorrect: false,
      isJustified: false,
      confidence: 'mid',
    });
    expect(Math.abs(risk.budgetDelta)).toBeGreaterThan(Math.abs(tech.budgetDelta));
  });

  it('награда никогда не отрицательна', () => {
    const combos = [true, false];
    for (const c of combos) {
      for (const j of combos) {
        for (const conf of ['low', 'mid', 'high'] as const) {
          const v = scoreEncounter({ ...base, isCorrect: c, isJustified: j, confidence: conf });
          expect(v.xp).toBeGreaterThanOrEqual(0);
          expect(v.coins).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });
});

describe('structureForLevel', () => {
  it('новичку не показываем ставку, опознание и план', () => {
    const s = structureForLevel('street', 1);
    expect(s.confidence).toBe(false);
    expect(s.identifyOptions).toBe(0);
    expect(s.stackSlots).toBe(0);
  });

  it('к концу «Улицы» опознание уже включено', () => {
    expect(structureForLevel('street', 12).identifyOptions).toBeGreaterThan(0);
  });

  it('эпохи повышают требования к доказательствам', () => {
    expect(structureForLevel('street', 10).evidenceRequired).toBe(1);
    expect(structureForLevel('terminal', 60).evidenceRequired).toBe(2);
  });

  it('подсветка улик снимается после первой эпохи', () => {
    expect(structureForLevel('street', 10).evidenceHighlight).toBe(true);
    expect(structureForLevel('cabinet', 35).evidenceHighlight).toBe(false);
    expect(structureForLevel('terminal', 60).evidenceHighlight).toBe(false);
  });

  it('поздние эпохи открывают больше источников', () => {
    expect(structureForLevel('street', 10).tabs).toBeLessThan(
      structureForLevel('terminal', 60).tabs,
    );
  });
});
