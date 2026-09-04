// Работа над ошибками: каждая незакрытая запись вернётся задачей.

import Phaser from 'phaser';
import { gameState } from '../state/GameState';
import { enemyById } from '../data/enemies';
import { cardById } from '../data/cards';
import { buildPalette, type Palette } from '../ui/palette';
import { CANVAS, CHROME, GUTTER, HIT, RADIUS, SP } from '../ui/tokens';
import * as TX from '../ui/text';
import { T } from '../ui/copy';
import { button, panel } from '../ui/widgets';
import { renderTopBar, renderBottomNav, navForEpoch, renderBackground, bottomNavHeight } from '../ui/shell';
import { sceneEnter, fadeIn } from '../ui/motion';
import { haptic } from '../ui/feedbackFx';
import { ScrollList } from '../ui/ScrollList';

const ROW_H = 76;

export class ErrorJournalScene extends Phaser.Scene {
  private P!: Palette;
  private list?: ScrollList;

  constructor() {
    super({ key: 'ErrorJournalScene' });
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
    const headY = CHROME.topBar + SP.md;
    this.add.text(GUTTER, headY, T.journal.title, TX.title(p, { color: p.text }));
    this.add.text(GUTTER, headY + 32, T.journal.sub, {
      ...TX.caption(p, { color: p.muted, wrap: w }),
    });

    const top = headY + 64;
    const height = CANVAS.h - bottomNavHeight() - top - SP.md;
    const entries = prog.errorScroll;

    if (entries.length === 0) {
      this.add
        .text(CANVAS.w / 2, top + height / 2 - 20, T.journal.empty, {
          ...TX.body(p, { color: p.muted, align: 'center', wrap: w }),
        })
        .setOrigin(0.5, 0);
    } else {
      this.list = new ScrollList(this, {
        x: 0,
        y: top,
        width: CANVAS.w,
        height,
        itemHeight: ROW_H + SP.sm,
        itemCount: entries.length,
        renderItem: (i, c, y) => this.renderEntry(i, c, y),
      });
    }

    renderBottomNav(this, 'MoreScene', navForEpoch(prog.level));
  }

  private renderEntry(i: number, container: Phaser.GameObjects.Container, y: number): void {
    const p = this.P;
    const e = gameState.progress.errorScroll[i];
    const w = CANVAS.w - GUTTER * 2;
    const isOpen = !e.closed;
    const enemy = enemyById[e.enemy];

    const g = this.add.graphics();
    g.fillStyle(isOpen ? p.surfaceN : p.insetN, 1);
    g.fillRoundedRect(GUTTER, y, w, ROW_H, RADIUS.md);
    g.lineStyle(1, isOpen ? p.badN : p.borderN, 1);
    g.strokeRoundedRect(GUTTER, y, w, ROW_H, RADIUS.md);
    container.add(g);

    container.add(
      this.add.text(GUTTER + SP.md, y + SP.md, enemy?.name ?? e.enemy, {
        ...TX.body(p, { color: isOpen ? p.text : p.muted, wrap: w - SP.md * 2 - 80 }),
      }),
    );
    container.add(
      this.add.text(GUTTER + SP.md, y + SP.md + 24, `Пропущено: ${e.missedEvidence}`, {
        ...TX.caption(p, { color: isOpen ? p.bad : p.muted, wrap: w - SP.md * 2 - 80 }),
      }),
    );
    container.add(
      this.add
        .text(
          GUTTER + w - SP.md,
          y + SP.md,
          isOpen ? T.journal.open : T.journal.closed,
          TX.caption(p, { color: isOpen ? p.warn : p.muted }),
        )
        .setOrigin(1, 0),
    );

    const zone = this.add
      .rectangle(GUTTER, y, w, Math.max(ROW_H, HIT.min), 0x000000, 0)
      .setOrigin(0)
      .setInteractive();
    zone.on('pointerup', () => {
      if (this.list?.didDrag()) return;
      haptic('light');
      this.openEntry(i);
    });
    container.add(zone);
  }

  private openEntry(i: number): void {
    const p = this.P;
    const e = gameState.progress.errorScroll[i];
    if (!e) return;
    const layer = this.add.container(0, 0).setDepth(800);
    const shade = this.add
      .rectangle(0, 0, CANVAS.w, CANVAS.h, p.bgN, 0.97)
      .setOrigin(0)
      .setInteractive();
    layer.add(shade);
    fadeIn(this, shade, { to: 0.97 });

    const w = CANVAS.w - GUTTER * 2;
    let y = 160;
    const enemy = enemyById[e.enemy];
    const root = cardById[e.atom.split('.')[0]];

    layer.add(
      this.add.text(GUTTER, y, enemy?.name ?? e.enemy, TX.title(p, { color: p.text, wrap: w })),
    );
    y += 48;

    layer.add(this.add.text(GUTTER, y, T.journal.entryRoot, TX.caption(p)));
    y += 22;
    const b1 = panel(this, GUTTER, y, w, 52, p, { fill: p.surfaceN, stroke: p.badN });
    layer.add(b1);
    layer.add(
      this.add.text(GUTTER + SP.md, y + SP.md, e.missedEvidence, {
        ...TX.body(p, { color: p.text, wrap: w - SP.md * 2 }),
      }),
    );
    y += 52 + SP.lg;

    layer.add(this.add.text(GUTTER, y, T.journal.entryFix, TX.caption(p)));
    y += 22;
    const b2 = panel(this, GUTTER, y, w, 52, p, { fill: p.surfaceN, stroke: p.accentN });
    layer.add(b2);
    layer.add(
      this.add.text(GUTTER + SP.md, y + SP.md, root ? root.name : e.atom, {
        ...TX.body(p, { color: p.accent, wrap: w - SP.md * 2 }),
      }),
    );
    y += 52 + SP.lg;

    layer.add(
      this.add.text(GUTTER, y, T.journal.entryHint, {
        ...TX.caption(p, { color: p.muted, wrap: w }),
      }),
    );

    layer.add(
      button(
        this,
        GUTTER,
        CANVAS.h - bottomNavHeight() - HIT.comfortable - SP.md,
        T.journal.close,
        p,
        () => layer.destroy(),
        { width: w },
      ),
    );
  }
}
