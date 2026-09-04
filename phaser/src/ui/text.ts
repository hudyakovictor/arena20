// SIGNAL ARENA — фабрики текстовых стилей.
// Роли шрифтов (аудит R2):
//   Inter  — весь читаемый текст: заголовки, тело, кнопки, подписи.
//   Mono   — ТОЛЬКО цифры и коды: цены, проценты, тикеры, seed, уровни.
// Никаких инлайновых fontSize в сценах — только эти хелперы.

import { FS, LINE } from './tokens';
import type { Palette } from './palette';

type Style = Phaser.Types.GameObjects.Text.TextStyle;

interface Opts {
  /** Цвет текста (строка #rrggbb). По умолчанию — основной текст палитры. */
  color?: string;
  /** Ширина переноса строки. */
  wrap?: number;
  /** Выравнивание многострочного текста. */
  align?: 'left' | 'center' | 'right';
  /** Жирность. */
  bold?: boolean;
  /** Множитель межстрочного интервала. */
  line?: number;
}

function base(p: Palette, family: string, size: number, o: Opts = {}): Style {
  const style: Style = {
    fontFamily: family,
    fontSize: `${size}px`,
    color: o.color ?? p.text,
    align: o.align ?? 'left',
  };
  if (o.bold) style.fontStyle = 'bold';
  if (o.wrap) style.wordWrap = { width: o.wrap, useAdvancedWrap: true };
  // Phaser считает lineSpacing в пикселях сверх высоты строки.
  const mult = o.line ?? LINE.normal;
  style.lineSpacing = Math.round(size * (mult - 1));
  return style;
}

/** Крупный акцент — результат встречи, ключевая цифра. 28px. */
export const display = (p: Palette, o: Opts = {}): Style =>
  base(p, p.fontHead, FS.display, { bold: true, line: LINE.tight, ...o });

/** Заголовок экрана или блока. 20px. */
export const title = (p: Palette, o: Opts = {}): Style =>
  base(p, p.fontHead, FS.title, { bold: true, line: LINE.tight, ...o });

/** Основной текст: варианты ответа, пункты. 16px. */
export const bodyLg = (p: Palette, o: Opts = {}): Style =>
  base(p, p.fontUi, FS.bodyLg, o);

/** Вторичный текст: подсказки, описания. 14px. */
export const body = (p: Palette, o: Opts = {}): Style =>
  base(p, p.fontUi, FS.body, { color: p.sub, ...o });

/** Подпись/метка. 12px — минимум шкалы. */
export const caption = (p: Palette, o: Opts = {}): Style =>
  base(p, p.fontUi, FS.caption, { color: p.muted, ...o });

/** Текст кнопки. 16px, полужирный. */
export const button = (p: Palette, o: Opts = {}): Style =>
  base(p, p.fontUi, FS.bodyLg, { bold: true, ...o });

// ── Моноширинные: только числа, коды, тикеры ──────────────────────────

/** Числовое значение среднего размера. 14px mono. */
export const num = (p: Palette, o: Opts = {}): Style =>
  base(p, p.fontMono, FS.body, o);

/** Крупное числовое значение. 20px mono. */
export const numLg = (p: Palette, o: Opts = {}): Style =>
  base(p, p.fontMono, FS.title, { bold: true, ...o });

/** Мелкий код/тикер/seed. 12px mono — минимум шкалы. */
export const code = (p: Palette, o: Opts = {}): Style =>
  base(p, p.fontMono, FS.caption, { color: p.muted, ...o });
