// Разминка дня: погода рынка + очередь задач из ошибок и кампании.

import Phaser from 'phaser';
import { gameState } from '../state/GameState';
import { enemyById } from '../data/enemies';
import { buildPalette, type Palette } from '../ui/palette';
import { CANVAS, CHROME, GUTTER, HIT, RADIUS, SP } from '../ui/tokens';
import * as TX from '../ui/text';
import { T, weatherLabel } from '../ui/copy';
import { button, panel } from '../ui/widgets';
import { renderTopBar, renderBottomNav, navForEpoch, renderBackground } from '../ui/shell';
import { sceneEnter, enterPanel, transitionTo } from '../ui/motion';
import { Flow } from '../ui/layout';

export class DailyWarmupScene extends Phaser.Scene {
  private P!: Palette;

  constructor() {
    super({ key: 'DailyWarmupScene' });
  }

  create(): void {
    const prog = gameState.progress;
    this.P = buildPalette(prog.epoch);
    this.registry.set('epoch', prog.epoch);
    renderBackground(this, this.P);
    sceneEnter(this);
    renderTopBar(this, gameState);

    const p = this.P;
    const w = CANVAS.w - GUTTER * 2;
    const flow = new Flow(CHROME.topBar + SP.md, SP.md);

    this.add.text(GUTTER, flow.take(40), T.warmup.title, TX.title(p, { color: p.text }));

    // Погода
    const wh = 76;
    const wy = flow.take(wh);
    const box = panel(this, GUTTER, wy, w, wh, p, { fill: p.surfaceN, stroke: p.accentN });
    enterPanel(this, box as never);
    this.add.text(GUTTER + SP.lg, wy + SP.md, T.weather.label, TX.caption(p));
    this.add.text(GUTTER + SP.lg, wy + SP.md + 22, weatherLabel(prog.weather), {
      ...TX.bodyLg(p, { color: p.text, wrap: w - SP.lg * 2 }),
    });

    // Очередь
    this.add.text(GUTTER, flow.take(24), T.warmup.queue, TX.caption(p, { color: p.warn }));

    const open = prog.errorScroll.filter((e) => !e.closed);
    const queue: { label: string; sub: string }[] = [];
    open.slice(0, 3).forEach((e) => {
      queue.push({
        label: enemyById[e.enemy]?.name ?? e.enemy,
        sub: T.warmup.fromMistakes,
      });
    });
    if (queue.length < 4) queue.push({ label: weatherLabel(prog.weather), sub: T.warmup.fromWeather });
    if (queue.length < 4) queue.push({ label: T.warmup.fromCampaign, sub: '+ новый фактор' });

    const rowH = 60;
    queue.slice(0, 4).forEach((q, i) => {
      const y = flow.take(rowH, SP.sm);
      const g = this.add.graphics();
      g.fillStyle(p.surfaceN, 1);
      g.fillRoundedRect(GUTTER, y, w, rowH, RADIUS.md);
      g.lineStyle(1, i === 0 ? p.warnN : p.borderN, 1);
      g.strokeRoundedRect(GUTTER, y, w, rowH, RADIUS.md);
      enterPanel(this, g as never, { delay: i * 50 });

      const numX = GUTTER + SP.md + 14;
      this.add
        .text(numX, y + rowH / 2, String(i + 1), {
          ...TX.numLg(p, { color: i === 0 ? p.warn : p.muted }),
        })
        .setOrigin(0.5);
      this.add.text(GUTTER + SP.md + 36, y + SP.md, q.label, {
        ...TX.body(p, { color: p.text, wrap: w - 80 }),
      });
      this.add.text(GUTTER + SP.md + 36, y + SP.md + 22, q.sub, TX.caption(p, { color: p.muted }));
    });

    flow.gap(SP.md);
    const by = flow.take(HIT.comfortable);
    button(this, GUTTER, by, T.warmup.start, p, () => transitionTo(this, 'ArenaScene'), {
      width: w,
    });

    this.add.text(GUTTER, flow.take(40), T.warmup.note, {
      ...TX.caption(p, { color: p.muted, wrap: w }),
    });

    renderBottomNav(this, 'MoreScene', navForEpoch(prog.level));
  }
}
