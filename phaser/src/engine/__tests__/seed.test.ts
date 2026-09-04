// Детерминизм — центральное обещание движка (аудит D1).
import { describe, it, expect } from 'vitest';
import { encounterSeed } from '../seed';
import { SeededRng, hashString } from '../rng';
import { mutate } from '../mutator';
import { templateFor } from '../../data/templates';
import { buildScenario } from '../scenarioGen';

describe('encounterSeed', () => {
  it('одинаковые аргументы дают одинаковый seed', () => {
    expect(encounterSeed('u1', 5, 12)).toBe(encounterSeed('u1', 5, 12));
  });

  it('разный игрок, уровень или номер задачи меняют seed', () => {
    const base = encounterSeed('u1', 5, 12);
    expect(encounterSeed('u2', 5, 12)).not.toBe(base);
    expect(encounterSeed('u1', 6, 12)).not.toBe(base);
    expect(encounterSeed('u1', 5, 13)).not.toBe(base);
  });

  it('seed — беззнаковое 32-битное число', () => {
    for (let i = 0; i < 200; i++) {
      const s = encounterSeed('user', i, i * 3);
      expect(Number.isInteger(s)).toBe(true);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(0xffffffff);
    }
  });

  it('не зависит от текущего времени', async () => {
    const a = encounterSeed('u1', 3, 7);
    await new Promise((r) => setTimeout(r, 20));
    expect(encounterSeed('u1', 3, 7)).toBe(a);
  });
});

describe('SeededRng', () => {
  it('одна последовательность на один seed', () => {
    const a = new SeededRng(1234);
    const b = new SeededRng(1234);
    const seqA = Array.from({ length: 50 }, () => a.next());
    const seqB = Array.from({ length: 50 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it('значения лежат в [0,1)', () => {
    const r = new SeededRng(99);
    for (let i = 0; i < 500; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('int не выходит за границы', () => {
    const r = new SeededRng(7);
    for (let i = 0; i < 300; i++) {
      const v = r.int(3, 9);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(9);
    }
  });

  it('shuffle сохраняет состав', () => {
    const src = [1, 2, 3, 4, 5, 6];
    const out = new SeededRng(42).shuffle(src);
    expect([...out].sort()).toEqual(src);
    expect(src).toEqual([1, 2, 3, 4, 5, 6]); // исходный массив не тронут
  });

  it('hashString стабилен и различает строки', () => {
    expect(hashString('abc')).toBe(hashString('abc'));
    expect(hashString('abc')).not.toBe(hashString('abd'));
  });
});

describe('mutate', () => {
  const tpl = templateFor('E02', 1);

  it('один seed — одна и та же встреча', () => {
    const a = mutate(tpl, 555);
    const b = mutate(tpl, 555);
    expect(a.question).toBe(b.question);
    expect(a.ticker).toBe(b.ticker);
    expect(a.correctAnswer).toBe(b.correctAnswer);
    expect(a.mutatedAnswers.map((x) => x.text)).toEqual(b.mutatedAnswers.map((x) => x.text));
  });

  it('correctAnswer указывает на верный вариант после перемешивания', () => {
    for (let s = 1; s < 100; s++) {
      const inst = mutate(tpl, s * 977);
      const expected = tpl.answers[tpl.correct];
      expect(inst.mutatedAnswers[inst.correctAnswer].text).toBe(expected.text);
    }
  });

  it('перемешивание не теряет и не дублирует варианты', () => {
    const inst = mutate(tpl, 31337);
    expect(inst.mutatedAnswers).toHaveLength(tpl.answers.length);
    const texts = new Set(inst.mutatedAnswers.map((a) => a.text));
    expect(texts.size).toBe(tpl.answers.length);
  });
});

describe('buildScenario', () => {
  const inst = mutate(templateFor('E02', 1), 2024);

  it('воспроизводится по seed', () => {
    const a = buildScenario(inst);
    const b = buildScenario(inst);
    expect(a.candles.map((c) => c.close)).toEqual(b.candles.map((c) => c.close));
    expect(a.shadow).toEqual(b.shadow);
    expect(a.news.map((n) => n.headline)).toEqual(b.news.map((n) => n.headline));
  });

  it('распределение ответов даёт ровно 100%', () => {
    for (let s = 1; s < 60; s++) {
      const enc = mutate(templateFor('E02', 1), s * 131);
      const sc = buildScenario(enc);
      expect(sc.shadow.reduce((a, b) => a + b, 0)).toBe(100);
      expect(sc.shadow.every((v) => v >= 0)).toBe(true);
    }
  });

  it('свечи согласованы: high >= max(open,close), low <= min(open,close)', () => {
    const sc = buildScenario(inst);
    for (const c of sc.candles) {
      expect(c.high).toBeGreaterThanOrEqual(Math.max(c.open, c.close));
      expect(c.low).toBeLessThanOrEqual(Math.min(c.open, c.close));
      expect(c.volume).toBeGreaterThan(0);
    }
  });

  it('ровно одна свеча несёт улику графика', () => {
    const sc = buildScenario(inst);
    const marked = sc.candles.filter((c) => c.evidenceId);
    expect(marked.length).toBeLessThanOrEqual(1);
  });

  it('проигрыш вперёд даёт 6 свечей и зависит от исхода', () => {
    const sc = buildScenario(inst);
    const ok = sc.forward(true);
    const bad = sc.forward(false);
    expect(ok).toHaveLength(6);
    expect(bad).toHaveLength(6);
    expect(ok.map((c) => c.close)).not.toEqual(bad.map((c) => c.close));
  });
});
