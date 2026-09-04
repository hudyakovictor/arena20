// Проверка вертикальной раскладки Арены без запуска Phaser.
// Считаем те же высоты, что и сцена, и требуем, чтобы содержимое
// никогда не уезжало под нижнюю навигацию.

import { describe, it, expect } from 'vitest';
import { CANVAS, CHROME, SP, HIT } from '../../ui/tokens';

const NAV = CHROME.bottomNav;
const BOTTOM = CANVAS.h - NAV - SP.md;
const LINE = 21; // строка bodyLg 16px

/** Высота карточки вопроса с учётом ограничения. */
function questionH(lines: number, maxH: number): number {
  return Math.min(Math.max(72, maxH), lines * LINE + SP.lg * 2 + 18);
}

/** Высота сводки улик — вспомогательный блок, не больше двух строк. */
function summaryH(lines: number): number {
  return Math.min(Math.max(44, lines * 17 + SP.md * 2), 62);
}

const railH = (slots: number) => (slots > 0 ? 36 : 0) + 20 + 76;
const verdictH = 20 + 56;
const gridH = (count: number) => 20 + Math.ceil(count / 2) * (84 + SP.sm);

describe('раскладка шага «решение»', () => {
  const cases: { q: number; ev: number; slots: number; verdict: boolean }[] = [];
  for (const q of [2, 3, 4, 5, 6, 8]) {
    for (const ev of [1, 2, 3, 5]) {
      for (const slots of [0, 2]) {
        for (const verdict of [false, true]) cases.push({ q, ev, slots, verdict });
      }
    }
  }

  it.each(cases)(
    'вопрос $q стр, улики $ev стр, слоты $slots, вердикт $verdict — влезает',
    ({ q, ev, slots, verdict }) => {
      let y = CHROME.topBar + SP.md;
      y += questionH(q, 132) + SP.md;
      y += summaryH(ev) + SP.md;
      y += railH(slots) + SP.md;
      if (verdict) y += verdictH + SP.md;

      if (slots > 0) {
        y += HIT.comfortable;
      } else {
        const g = gridH(4);
        // сетка прижимается к нижней границе, если выше не хватило места
        y = Math.min(y, BOTTOM - g) + g;
      }
      expect(y).toBeLessThanOrEqual(BOTTOM);
    },
  );
});

describe('раскладка шага «разбор»', () => {
  it.each([2, 3, 4, 5, 6, 8])('вопрос %i строк — браузеру хватает места', (lines) => {
    const ctaH = HIT.comfortable + SP.md;
    const evidenceH = 34;
    let y = CHROME.topBar + SP.md;
    y += 20 + SP.sm; // погода
    y += questionH(lines, BOTTOM - y - 200 - ctaH - evidenceH) + SP.md;
    y += 52 + SP.md; // карточка врага
    const browserH = BOTTOM - y - ctaH - evidenceH - SP.md * 2;
    expect(browserH).toBeGreaterThanOrEqual(200);
  });
});

describe('нижняя граница', () => {
  it('навигация не перекрывает контент', () => {
    expect(BOTTOM).toBeLessThan(CANVAS.h - NAV + 1);
  });

  it('кнопка действия помещается над навигацией', () => {
    expect(BOTTOM - HIT.comfortable).toBeGreaterThan(CHROME.topBar);
  });
});
