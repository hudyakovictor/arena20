// T020/T021 · CandleChart на Phaser Graphics (без web-виджетов).
// Слои: grid / candles / overlay(t0) / markers / mask(hidden future).
// Направление свечи кодируется ФОРМОЙ (рост — контур, падение — заливка) + цветом.
// Шкала фиксируется по visible+future сразу, чтобы reveal не прыгал.
// T022 (старт): decision-маркер + горизонтальные уровни поверх свечей.
import type Phaser from 'phaser';
import type { Candle, UiTone } from '@signal-arena/shared';
import { FONT_SIZES, FONTS, UI_BG, UI_HEX, UI_TINT } from '@signal-arena/shared';
import { t } from '../../copy.js';
import { selectSettings } from '../../store.js';
import { chartGeom, priceRange } from './chartMath.js';

export interface RevealOpts {
  animated: boolean;
  stepMs?: number;
  onDone?: () => void;
  /** Живой счётчик кадров (прототип 4.10: КАДР n/m). */
  onFrame?: (revealed: number, total: number) => void;
}

/** Горизонтальный уровень поверх графика (T022: инвалидация, риск-зоны). */
export interface ChartLevel {
  price: number;
  tone: UiTone;
  label: string;
}

export class CandleChart {
  readonly container: Phaser.GameObjects.Container;
  private readonly scene: Phaser.Scene;
  private readonly w: number;
  private readonly h: number;
  private readonly gridG: Phaser.GameObjects.Graphics;
  private readonly candleG: Phaser.GameObjects.Graphics;
  private readonly overlayG: Phaser.GameObjects.Graphics;
  private readonly maskG: Phaser.GameObjects.Graphics;
  private readonly priceLabels: Phaser.GameObjects.Text[] = [];
  private readonly overlayTags: Phaser.GameObjects.Text[] = [];
  private visible: Candle[] = [];
  private future: Candle[] = [];
  private t0 = 0;
  private revealed = 0;
  /** T022: маркер решения + уровни поверх свечей (форма/текст дублируют цвет). */
  private decisionIndex: number | null = null;
  private decisionLabel = '';
  private levels: ChartLevel[] = [];
  private revealTimer: Phaser.Time.TimerEvent | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, w: number, h: number) {
    this.scene = scene;
    this.w = w;
    this.h = h;
    const bg = scene.add.graphics();
    bg.fillStyle(UI_BG.app, 1);
    bg.fillRoundedRect(0, 0, w, h, 8);
    bg.lineStyle(1, UI_TINT.secondary, 0.25);
    bg.strokeRoundedRect(0, 0, w, h, 8);
    this.gridG = scene.add.graphics();
    this.candleG = scene.add.graphics();
    this.overlayG = scene.add.graphics();
    this.maskG = scene.add.graphics();
    this.container = scene.add.container(x, y, [
      bg,
      this.gridG,
      this.candleG,
      this.overlayG,
      this.maskG,
    ]);
  }

  /** Данные: видимые свечи + индекс t0 + скрытое будущее (рисуется только маска). */
  setData(visible: Candle[], t0Index: number, future: Candle[]): void {
    this.stopReveal();
    this.visible = visible;
    this.future = future;
    this.t0 = t0Index;
    this.revealed = 0;
    this.decisionIndex = null;
    this.decisionLabel = '';
    this.levels = [];
    this.drawAll();
  }

  /** T022 · Маркер принятого решения: треугольник + подпись (не только цвет). */
  setDecisionMarker(index: number, label: string): void {
    this.decisionIndex = index;
    this.decisionLabel = label;
    this.drawT0();
  }

  /** T022 · Горизонтальные уровни (инвалидация, риск-зоны): линия + подпись. */
  setLevels(levels: ChartLevel[]): void {
    this.levels = levels;
    this.drawT0();
  }

  /** Сколько свечей будущего уже раскрыто (для тестов/хука). */
  get revealedCount(): number {
    return this.revealed;
  }

  get futureCount(): number {
    return this.future.length;
  }

  private geom(): ReturnType<typeof chartGeom> {
    const range = priceRange([...this.visible, ...this.future]);
    return chartGeom(this.visible.length + this.future.length, range, this.w - 44, this.h - 8);
  }

  private drawAll(): void {
    this.drawGrid();
    this.drawCandles(0, this.visible.length, this.visible, 0);
    this.drawT0();
    this.drawMask();
  }

  private drawGrid(): void {
    const g = this.gridG;
    g.clear();
    const geom = this.geom();
    g.lineStyle(1, UI_TINT.secondary, 0.14);
    const rows = 4;
    for (let i = 0; i <= rows; i += 1) {
      const price = geom.range.min + (geom.range.span * i) / rows;
      const y = 4 + geom.y(price);
      g.lineBetween(4, y, this.w - 44, y);
    }
    for (const label of this.priceLabels) label.destroy();
    this.priceLabels.length = 0;
    for (const frac of [0, 0.5, 1]) {
      const price = geom.range.min + geom.range.span * frac;
      const label = this.scene.add.text(this.w - 40, 4 + geom.y(price) - 7, price.toFixed(1), {
        fontFamily: FONTS.mono,
        fontSize: `${FONT_SIZES.label - 1}px`,
        color: UI_HEX.muted,
      });
      this.container.add(label);
      this.priceLabels.push(label);
    }
  }

  /** Отрисовка диапазона свечей одним проходом (без твинов на свечу). */
  private drawCandles(start: number, end: number, source: Candle[], offset: number): void {
    const geom = this.geom();
    const g = this.candleG;
    for (let i = start; i < end; i += 1) {
      const c = source[i];
      if (!c) continue;
      const cx = 4 + geom.x(offset + i);
      const up = c.c >= c.o;
      const color = up ? UI_TINT.success : UI_TINT.danger;
      // фитиль — тонкий rect (без line API)
      const wickTop = 4 + geom.y(c.h);
      const wickH = Math.max(1, 4 + geom.y(c.l) - wickTop);
      g.fillStyle(color, 0.9);
      g.fillRect(cx - 1, wickTop, 2, wickH);
      // тело: рост — контур, падение — заливка (форма + цвет)
      const top = 4 + geom.y(Math.max(c.o, c.c));
      const bodyH = Math.max(2, 4 + geom.y(Math.min(c.o, c.c)) - top);
      const left = cx - geom.body / 2;
      if (up) {
        g.lineStyle(1.5, color, 1);
        g.strokeRect(left, top, geom.body, bodyH);
      } else {
        g.fillStyle(color, 1);
        g.fillRect(left, top, geom.body, bodyH);
      }
    }
  }

  private drawT0(): void {
    const g = this.overlayG;
    g.clear();
    for (const tag of this.overlayTags) tag.destroy();
    this.overlayTags.length = 0;
    const geom = this.geom();
    const x = 4 + geom.x(this.t0) + geom.slot / 2;
    g.lineStyle(1.5, UI_TINT.data, 0.9);
    g.lineBetween(x, 4, x, this.h - 4);
    this.overlayTag(x + 3, 6, t('arena.t0'), 'data');
    for (const level of this.levels) {
      const y = 4 + geom.y(level.price);
      g.lineStyle(1.5, UI_TINT[level.tone], 0.85);
      g.lineBetween(4, y, this.w - 44, y);
      // штрих начала линии — форма дублирует цвет уровня
      g.fillStyle(UI_TINT[level.tone], 1);
      g.fillTriangle(4, y - 4, 4, y + 4, 10, y);
      this.overlayTag(13, y - 16, level.label, level.tone);
    }
    if (this.decisionIndex !== null) {
      const dx = 4 + geom.x(this.decisionIndex);
      const dy = this.h - 14;
      g.fillStyle(UI_TINT.active, 1);
      g.fillTriangle(dx - 6, dy, dx + 6, dy, dx, dy - 9);
      g.lineStyle(1.5, UI_TINT.active, 1);
      g.strokeTriangle(dx - 6, dy, dx + 6, dy, dx, dy - 9);
      this.overlayTag(dx + 8, dy - 18, this.decisionLabel, 'active');
    }
  }

  /** Подпись оверлея: создаётся заново при каждой перерисовке слоя. */
  private overlayTag(x: number, y: number, text: string, tone: UiTone): void {
    const tag = this.scene.add.text(x, y, text, {
      fontFamily: FONTS.mono,
      fontSize: `${FONT_SIZES.label - 1}px`,
      color: UI_HEX[tone],
    });
    tag.setOrigin(0, 0);
    this.container.add(tag);
    this.overlayTags.push(tag);
  }

  private drawMask(): void {
    const g = this.maskG;
    g.clear();
    const geom = this.geom();
    const startX = 4 + geom.x(this.visible.length) - geom.slot / 2;
    const maskW = Math.max(0, this.w - 44 - startX);
    if (maskW <= 0 || this.future.length === 0) return;
    g.fillStyle(UI_BG.app, 0.82);
    g.fillRect(startX, 0, maskW, this.h);
    // штриховка скрытой зоны
    g.lineStyle(1, UI_TINT.muted, 0.5);
    for (let x = startX + 4; x < startX + maskW; x += 9) {
      g.lineBetween(x, this.h - 6, x + 10, 6);
    }
    const label = this.scene.add.text(startX + maskW / 2, this.h / 2, t('arena.futureHidden'), {
      fontFamily: FONTS.mono,
      fontSize: `${FONT_SIZES.label}px`,
      color: UI_HEX.warning,
      align: 'center',
    });
    label.setOrigin(0.5, 0.5);
    label.setAngle(-90);
    if (maskW < 46) label.setVisible(false);
    this.container.add(label);
    this.priceLabels.push(label);
  }

  /** Остановить активную анимацию раскрытия (перед replay / сменой данных). */
  private stopReveal(): void {
    this.revealTimer?.remove(false);
    this.revealTimer = null;
  }

  /** Сбросить раскрытие для повторного проигрывания (прототип 4.10: ▶ ПОВТОРИТЬ). */
  resetReveal(): void {
    this.stopReveal();
    this.candleG.clear();
    this.drawCandles(0, this.visible.length, this.visible, 0);
    this.revealed = 0;
    this.drawMask();
  }

  /** T021 · Раскрытие будущего: прогрессивная дорисовка свечей + снятие маски. */
  reveal(opts: RevealOpts): void {
    this.stopReveal();
    const reduceMotion = selectSettings().reduceMotion;
    const animated = opts.animated && !reduceMotion && this.future.length > 0;
    if (!animated) {
      this.drawCandles(0, this.future.length, this.future, this.visible.length);
      this.revealed = this.future.length;
      this.maskG.clear();
      opts.onFrame?.(this.revealed, this.future.length);
      opts.onDone?.();
      return;
    }
    // докачка с текущего кадра: уже раскрытые свечи не перерисовываем
    let i = this.revealed;
    if (i === 0) this.maskG.clear();
    else {
      // маска уже снята при старте первой анимации — чистим на всякий случай
      this.maskG.clear();
    }
    const step = opts.stepMs ?? 90;
    const tick = (): void => {
      if (i >= this.future.length) {
        this.revealTimer = null;
        opts.onDone?.();
        return;
      }
      this.drawCandles(i, i + 1, this.future, this.visible.length);
      this.revealed = i + 1;
      i += 1;
      opts.onFrame?.(this.revealed, this.future.length);
      this.revealTimer = this.scene.time.delayedCall(step, tick);
    };
    tick();
  }

  destroy(): void {
    this.stopReveal();
    this.container.destroy(true);
  }
}
