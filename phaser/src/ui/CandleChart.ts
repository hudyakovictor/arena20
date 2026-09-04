// SIGNAL ARENA — свечной график одним Graphics (аудит P2).
// Было: 2–4 Rectangle на свечу плюс отдельные hit-зоны — десятки объектов.
// Стало: один Graphics с перерисовкой по dirty-флагу и hit-тестом по индексу
// свечи из координаты X. Плюс анимация «проигрыша вперёд» (аудит AN2).

import Phaser from 'phaser';
import type { Candle } from '../engine/scenarioGen';
import type { Palette } from './palette';
import * as TX from './text';
import { SP } from './tokens';
import { DUR, EASE } from './tokens';
import { isReducedMotion } from './motion';

export interface CandleChartOpts {
  x: number;
  y: number;
  width: number;
  height: number;
  palette: Palette;
  /** Подсвечивать свечу-улику рамкой. */
  highlightEvidence: boolean;
  /** Показывать полосу объёма под свечами. */
  showVolume?: boolean;
  /**
   * Контейнер-владелец. Если задан, координаты x/y трактуются как локальные
   * для него, а объекты графика живут внутри контейнера — вместе с ним
   * позиционируются, скрываются и уничтожаются.
   */
  parent?: Phaser.GameObjects.Container;
  onEvidenceTap?: (id: string) => void;
}

export class CandleChart {
  private scene: Phaser.Scene;
  private g: Phaser.GameObjects.Graphics;
  private overlay: Phaser.GameObjects.Graphics;
  private hit: Phaser.GameObjects.Rectangle;
  private labels: Phaser.GameObjects.Text[] = [];
  private opts: CandleChartOpts;
  private candles: Candle[] = [];
  private forwardCandles: Candle[] = [];
  private forwardShown = 0;
  private selected = new Set<string>();
  private priceRange: { min: number; max: number } = { min: 0, max: 1 };

  constructor(scene: Phaser.Scene, opts: CandleChartOpts) {
    this.scene = scene;
    this.opts = opts;
    this.g = scene.add.graphics({ x: opts.x, y: opts.y });
    this.overlay = scene.add.graphics({ x: opts.x, y: opts.y });
    // Единая зона касания на весь график: индекс свечи считаем из X.
    this.hit = scene.add
      .rectangle(opts.x, opts.y, opts.width, opts.height, 0x000000, 0)
      .setOrigin(0)
      .setInteractive();
    this.hit.on('pointerdown', (p: Phaser.Input.Pointer) => this.handleTap(p));
    opts.parent?.add([this.g, this.overlay, this.hit]);
  }

  /** Задать данные и перерисовать. */
  setData(candles: Candle[], selected: Set<string>): void {
    this.candles = candles;
    this.selected = selected;
    this.forwardCandles = [];
    this.forwardShown = 0;
    this.computeRange();
    this.redraw();
  }

  /** Обновить только выделение — без пересчёта геометрии. */
  setSelected(selected: Set<string>): void {
    this.selected = selected;
    this.redraw();
  }

  private computeRange(): void {
    const all = [...this.candles, ...this.forwardCandles];
    if (!all.length) return;
    let min = Infinity;
    let max = -Infinity;
    for (const c of all) {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
    }
    const pad = (max - min) * 0.08 || 1;
    this.priceRange = { min: min - pad, max: max + pad };
  }

  /** Общее число слотов по оси X (история + место под проигрыш вперёд). */
  private get slots(): number {
    return this.candles.length + this.forwardCandles.length;
  }

  private get plotH(): number {
    return this.opts.showVolume === false
      ? this.opts.height - SP.lg
      : this.opts.height - SP.lg - 26;
  }

  private priceToY(price: number): number {
    const { min, max } = this.priceRange;
    const t = (price - min) / (max - min || 1);
    return SP.sm + (1 - t) * (this.plotH - SP.sm);
  }

  private slotW(): number {
    return this.opts.width / Math.max(1, this.slots);
  }

  private redraw(): void {
    const { palette: p } = this.opts;
    this.g.clear();
    this.overlay.clear();
    for (const l of this.labels) l.destroy();
    this.labels = [];

    const sw = this.slotW();
    const bodyW = Math.max(3, sw * 0.62);
    const volTop = this.plotH + SP.sm;
    const volH = this.opts.showVolume === false ? 0 : 18;
    const maxVol = Math.max(...this.candles.map((c) => c.volume), 1);

    const drawCandle = (c: Candle, idx: number, ghost: boolean) => {
      const cx = idx * sw + sw / 2;
      const up = c.close >= c.open;
      const col = up ? p.goodN : p.badN;
      const alpha = ghost ? 0.55 : 1;

      // фитиль
      this.g.lineStyle(1, col, alpha * 0.8);
      this.g.beginPath();
      this.g.moveTo(cx, this.priceToY(c.high));
      this.g.lineTo(cx, this.priceToY(c.low));
      this.g.strokePath();

      // тело
      const yO = this.priceToY(c.open);
      const yC = this.priceToY(c.close);
      const top = Math.min(yO, yC);
      const bh = Math.max(1.5, Math.abs(yC - yO));
      this.g.fillStyle(col, alpha);
      this.g.fillRect(cx - bodyW / 2, top, bodyW, bh);

      // объём
      if (volH) {
        const vh = Math.max(1, (c.volume / maxVol) * volH);
        this.g.fillStyle(col, alpha * 0.35);
        this.g.fillRect(cx - bodyW / 2, volTop + volH - vh, bodyW, vh);
      }
    };

    this.candles.forEach((c, i) => drawCandle(c, i, false));
    this.forwardCandles.slice(0, this.forwardShown).forEach((c, i) => {
      drawCandle(c, this.candles.length + i, true);
    });

    // разделитель «здесь ты принял решение»
    if (this.forwardCandles.length) {
      const dx = this.candles.length * sw;
      this.overlay.lineStyle(1, p.accentN, 0.5);
      this.overlay.beginPath();
      this.overlay.moveTo(dx, 0);
      this.overlay.lineTo(dx, this.plotH);
      this.overlay.strokePath();
    }

    // зона улики
    for (const c of this.candles) {
      if (!c.evidenceId) continue;
      const idx = this.candles.indexOf(c);
      const cx = idx * sw + sw / 2;
      const picked = this.selected.has(c.evidenceId);
      const showHint = this.opts.highlightEvidence || picked;
      if (!showHint) continue;
      const col = picked ? p.goodN : p.accentN;
      this.overlay.lineStyle(picked ? 2 : 1, col, picked ? 1 : 0.7);
      this.overlay.strokeRoundedRect(cx - sw / 2, 0, sw, this.plotH + (volH ? volH + SP.sm : 0), 4);
      this.overlay.fillStyle(col, 0.1);
      this.overlay.fillRoundedRect(cx - sw / 2, 0, sw, this.plotH + (volH ? volH + SP.sm : 0), 4);
      if (picked) {
        const t = this.scene.add
          .text(this.opts.x + cx, this.opts.y + this.plotH + volH + SP.sm + 2, '✓', {
            ...TX.caption(p, { color: p.good }),
          })
          .setOrigin(0.5, 0);
        this.opts.parent?.add(t);
        this.labels.push(t);
      }
    }
  }

  private handleTap(pointer: Phaser.Input.Pointer): void {
    // при наличии родителя учитываем его смещение
    const originX = this.opts.x + (this.opts.parent?.x ?? 0);
    const localX = pointer.x - originX;
    const sw = this.slotW();
    const idx = Math.floor(localX / sw);
    const c = this.candles[idx];
    if (c?.evidenceId) this.opts.onEvidenceTap?.(c.evidenceId);
  }

  /**
   * Проигрыш вперёд: свечи появляются одна за другой, чтобы игрок увидел,
   * чем закончилось его решение (аудит AN2).
   */
  playForward(forward: Candle[], onDone?: () => void): void {
    this.forwardCandles = forward;
    this.forwardShown = 0;
    this.computeRange();
    this.redraw();
    if (isReducedMotion()) {
      this.forwardShown = forward.length;
      this.redraw();
      onDone?.();
      return;
    }
    const step = (n: number) => {
      if (n > forward.length) {
        onDone?.();
        return;
      }
      this.forwardShown = n;
      this.redraw();
      this.scene.time.delayedCall(DUR.candle, () => step(n + 1));
    };
    step(1);
  }

  /** Подсветить итог: зелёная или красная заливка зоны «после». */
  markOutcome(correct: boolean): void {
    const p = this.opts.palette;
    const sw = this.slotW();
    const x0 = this.candles.length * sw;
    const w = this.forwardCandles.length * sw;
    this.overlay.fillStyle(correct ? p.goodN : p.badN, 0.12);
    this.overlay.fillRect(x0, 0, w, this.plotH);
    if (!isReducedMotion()) {
      this.overlay.setAlpha(0);
      this.scene.tweens.add({
        targets: this.overlay,
        alpha: 1,
        duration: DUR.panel,
        ease: EASE.out,
      });
    }
  }

  destroy(): void {
    this.g.destroy();
    this.overlay.destroy();
    this.hit.destroy();
    for (const l of this.labels) l.destroy();
    this.labels = [];
  }
}
