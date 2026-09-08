// Паритет копи и цепочка фолбэков (RU — первый язык MVP, T122 расширит EN).
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { COPY, COPY_TODO, t } from './copy.js';

/** Ключи среза «Арена по прототипу 4.1–4.13»: EN обязан присутствовать. */
const ARENA_SLICE_KEYS = [
  'arena.mode.title',
  'arena.mode.hero',
  'arena.mode.formats',
  'arena.mode.format.free',
  'arena.mode.format.freeBody',
  'arena.mode.format.series',
  'arena.mode.format.seriesBody',
  'arena.mode.format.fix',
  'arena.mode.format.fixBody',
  'arena.mode.choose',
  'arena.mode.rule',
  'arena.mode.ruleHint',
  'arena.mode.focus',
  'arena.mode.focus.all',
  'arena.mode.focus.structure',
  'arena.mode.focus.noise',
  'arena.mode.focus.risk',
  'arena.mode.focus.psycho',
  'arena.mode.focus.web3',
  'arena.mode.start',
  'arena.mode.hashOk',
  'arena.brief.phase',
  'arena.brief.timeframe',
  'arena.brief.rule',
  'arena.brief.difficulty',
  'arena.brief.preEntry',
  'arena.brief.inPosition',
  'arena.brief.situation',
  'arena.brief.tabs',
  'arena.brief.start',
  'arena.pressure',
  'arena.disclaimer',
  'arena.skillsApplied',
  'arena.of',
  'arena.moreSkills',
  'arena.catalog.title',
  'arena.catalog.sub',
  'arena.catalog.open',
  'arena.catalog.coins',
  'arena.catalog.level',
  'arena.catalog.phaseOnly',
  'arena.catalog.note',
  'arena.skill.type',
  'arena.skill.mastery',
  'arena.skill.used',
  'arena.skill.times',
  'arena.skill.avgQuality',
  'arena.skill.studyIn',
  'arena.skill.toAcademy',
  'arena.skill.apply',
  'arena.skill.kindName.reading',
  'arena.skill.kindName.decision',
  'arena.skill.kindName.protection',
  'arena.skill.cardOf.reading',
  'arena.skill.cardOf.decision',
  'arena.skill.cardOf.protection',
  'arena.confirm.selected',
  'arena.confirm.changeable',
  'arena.confirm.change',
  'arena.confirm.lockNote',
  'arena.reveal.layerFact',
  'arena.reveal.layerConsequence',
  'arena.reveal.speed',
  'arena.reveal.replay',
  'arena.reveal.frame',
  'arena.volume.book',
  'arena.volume.asks',
  'arena.volume.bids',
  'arena.volume.wall',
  'arena.volume.wallBody',
  'arena.volume.spread',
  'arena.volume.breakVol',
  'arena.volume.toAvg',
  'verdict.step',
  'verdict.nextStep',
  'verdict.breakdown',
  'verdict.logic',
  'verdict.sources',
  'verdict.dataset',
  'verdict.content',
  'verdict.method',
  'verdict.methodBody',
  'verdict.hash',
  'verdict.dim.context',
  'verdict.dim.evidence',
  'verdict.dim.action',
  'verdict.dim.risk',
  'verdict.dim.discipline',
  'scen.mvp-001.tf',
  'scen.mvp-002.tf',
  'skill.risk-first.short',
  'skill.no-confirm.short',
  'skill.htf.short',
  'skill.news-noise.short',
  'skill.no-average.short',
  'skill.flat-ok.short',
  'skill.invalidate.short',
  'skill.plan-profit.short',
  'protocol.save-system.title',
  'protocol.save-system.rule',
  'protocol.after-loss.title',
  'protocol.after-loss.rule',
  'protocol.confidence.title',
  'protocol.confidence.rule',
] as const;

describe('copy: фолбэки и паритет среза арены', () => {
  it('RU возвращает строку, неизвестный ключ — сам ключ', () => {
    expect(t('ru', 'arena.mode.title')).toBe('ПРАКТИКА');
    expect(t('ru', 'no.such.key')).toBe('no.such.key');
  });

  it('EN падает back на RU, а не на сырой ключ', () => {
    // ключ без EN-перевода (теория академии) — игрок видит RU, а не ключ
    expect(t('en', 'academy.ch.risk.title')).toBe(COPY.ru['academy.ch.risk.title']);
    expect(t('en', 'no.such.key')).toBe('no.such.key');
  });

  it('все ключи среза арены есть в RU и EN', () => {
    for (const key of ARENA_SLICE_KEYS) {
      expect(COPY.ru[key], `RU: ${key}`).toBeTruthy();
      expect(COPY.en[key], `EN: ${key}`).toBeTruthy();
    }
  });

  it('короткие названия навыков компактны для ряда из 4 слотов', () => {
    for (const key of ARENA_SLICE_KEYS) {
      if (!key.endsWith('.short')) continue;
      expect(COPY.ru[key]?.length ?? 99, key).toBeLessThanOrEqual(16);
      expect(COPY.en[key]?.length ?? 99, key).toBeLessThanOrEqual(16);
    }
  });
});

describe('copy: синхронизация с keys.tsv', () => {
  it('copy.keys.ts актуален (node scripts/build-copy.mjs --check)', () => {
    const script = fileURLToPath(new URL('../../scripts/build-copy.mjs', import.meta.url));
    expect(() =>
      execFileSync(process.execPath, [script, '--check'], { stdio: 'pipe' }),
    ).not.toThrow();
  });

  it('todo-ключи отсутствуют в RU/EN до появления текста', () => {
    expect(COPY_TODO.length).toBeGreaterThan(0);
    for (const key of COPY_TODO) {
      expect(COPY.ru[key], `RU has todo: ${key}`).toBeUndefined();
      expect(COPY.en[key], `EN has todo: ${key}`).toBeUndefined();
      expect(t('ru', key), `fallback: ${key}`).toBe(key);
    }
  });
});
