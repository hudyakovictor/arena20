// CandleChart — кастомный свечной график на Phaser.Graphics (ТЗ: часть игрового кадра, не веб-виджет).
// Данные серии — чистый модуль engine/candleSeries (тестируется без Phaser/DOM).
// Умеет: OHLC-свечи + фитили, объём, сетку, аномалию-улику («памп без объёма»),
// зеркалирование (анти-запоминание M11) и M6 «проигрыш вперёд» — доигрывание N свечей с анимацией.
import Phaser from 'phaser';
import { SeededRng } from '../engine/rng';
import { generateSeries, type Candle } from '../engine/candleSeries';

export type { Candle };

export interface CandleChartColors {
  up: number; down: number; grid: number; frame: number;
  volUp: number; volDown: number; anomaly: number;
}

export interface CandleChartOpts {
  x: number; y: number; w: number; h: number;
  seed: number;
  count?: number;            // свечей на экране (по умолчанию 18)
  mirrored?: boolean;        // отражение серии по горизонтали (M11)
  evidenceIndex?: number;    // позиция свечи-аномалии с конца (по умолчанию 4)
  colors: CandleChartColors;
}

export class CandleChart {
  readonly candles: Candle[];
  readonly evidenceIndex: number;
  private g: Phaser.GameObjects.Graphics;
  private opts: Required<Pick<CandleChartOpts, 'x' | 'y' | 'w' | 'h' | 'count'>> & CandleChartOpts;
  private playTimer?: Phaser.Time.TimerEvent;

  constructor(private scene: Phaser.Scene, opts: CandleChartOpts) {
    this.opts = { count: 18, ...opts } as CandleChart['opts'];
    const gen = generateSeries(opts.seed, this.opts.count, opts.evidenceIndex ?? 4, !!opts.mirrored);
    this.candles = gen.candles;
    this.evidenceIndex = gen.evidenceIndex;
    this.g = scene.add.graphics();
    this.draw();
  }

  /** Пиксельный прямоугольник свечи i — для интерактивной зоны улики (M1). */
  candleRect(i: number): Phaser.Geom.Rectangle {
    const { x, y, w } = this.opts;
    const plotH = this.plotHeight();
    const cw = w / this.candles.length;
    return new Phaser.Geom.Rectangle(x + i * cw, y, cw, plotH + this.volHeight());
  }

  private plotHeight(): number { return Math.round(this.opts.h * 0.74); }
  private volHeight(): number { return this.opts.h - this.plotHeight() - 4; }

  destroy(): void { this.playTimer?.remove(); this.g.destroy(); }

  /** M6 «проигрыш вперёд»: доигрывает n свечей в сторону direction с общим ходом outcomePct. */
  playForward(n: number, direction: 'up' | 'down', outcomePct: number, stepMs = 260, onDone?: () => void): void {
    const rng = new SeededRng((this.opts.seed ^ 0xf00d) >>> 0);
    const last = this.candles[this.candles.length - 1];
    const total = Math.abs(outcomePct) / 100 * last.c * (direction === 'up' ? 1 : -1);
    const step = total / n;
    let added = 0;
    this.playTimer = this.scene.time.addEvent({
      delay: stepMs, repeat: n - 1,
      callback: () => {
        const prev = this.candles[this.candles.length - 1];
        const o = prev.c;
        const c = o + step + (rng.next() - 0.5) * Math.abs(step) * 0.8;
        const hi = Math.max(o, c) + rng.next() * Math.abs(step) * 0.4;
        const lo = Math.min(o, c) - rng.next() * Math.abs(step) * 0.4;
        this.candles.push({ o, h: hi, l: lo, c, v: 0.4 + rng.next() * 0.5 });
        this.candles.shift(); // окно едет вперёд, как на живом графике
        this.draw(this.candles.length - 1);
        added++;
        if (added >= n) onDone?.();
      }
    });
  }

  draw(highlightLast = -1): void {
    const { x, y, w, colors } = this.opts;
    const plotH = this.plotHeight();
    const volH = this.volHeight();
    const g = this.g;
    g.clear();

    let min = Infinity, max = -Infinity, vMax = 0;
    for (const c of this.candles) { if (c.l < min) min = c.l; if (c.h > max) max = c.h; if (c.v > vMax) vMax = c.v; }
    const pad = (max - min) * 0.06 || 1;
    min -= pad; max += pad;
    const py = (p: number) => y + plotH - ((p - min) / (max - min)) * plotH;

    // сетка: 4 горизонтали + вертикаль каждые 6 свечей
    g.lineStyle(1, colors.grid, 0.5);
    for (let i = 1; i <= 3; i++) { const gy = Math.round(y + (plotH / 4) * i) + 0.5; g.lineBetween(x, gy, x + w, gy); }
    const cw = w / this.candles.length;
    for (let i = 6; i < this.candles.length; i += 6) { const gx = Math.round(x + i * cw) + 0.5; g.lineBetween(gx, y, gx, y + plotH); }

    // свечи
    const bodyW = Math.max(3, Math.floor(cw * 0.55));
    this.candles.forEach((c, i) => {
      const cx = x + i * cw + cw / 2;
      const isUp = c.c >= c.o;
      const isAnomaly = i === this.evidenceIndex;
      const col = isAnomaly ? colors.anomaly : (isUp ? colors.up : colors.down);
      const alpha = highlightLast === i ? 1 : 0.92;
      // фитиль
      g.lineStyle(1, col, alpha * 0.75);
      g.lineBetween(cx, py(c.h), cx, py(c.l));
      // тело (минимум 1px чтобы дожи был виден)
      const top = py(Math.max(c.o, c.c));
      const bh = Math.max(1, Math.abs(py(c.o) - py(c.c)));
      g.fillStyle(col, alpha);
      g.fillRect(cx - bodyW / 2, top, bodyW, bh);
      // объём
      const vh = Math.max(1, (c.v / vMax) * volH);
      g.fillStyle(isAnomaly ? colors.anomaly : (isUp ? colors.volUp : colors.volDown), isAnomaly ? 0.95 : 0.55);
      g.fillRect(cx - bodyW / 2, y + plotH + 4 + (volH - vh), bodyW, vh);
    });

    // рамка области
    g.lineStyle(1, colors.frame, 0.8);
    g.strokeRect(x - 0.5, y - 0.5, w + 1, plotH + volH + 5);
  }
}
