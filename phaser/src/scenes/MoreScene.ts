// «Ещё» — профиль и сервисные разделы.

import Phaser from 'phaser';
import { gameState } from '../state/GameState';
import { epochOf } from '../config/epochConfig';
import { buildPalette, type Palette } from '../ui/palette';
import { CANVAS, CHROME, GUTTER, HIT, RADIUS, SP } from '../ui/tokens';
import * as TX from '../ui/text';
import { T } from '../ui/copy';
import { renderTopBar, renderBottomNav, navForEpoch, renderBackground, bottomNavHeight } from '../ui/shell';
import { sceneEnter, enterPanel, transitionTo } from '../ui/motion';
import { haptic, playSfx } from '../ui/feedbackFx';
import { Flow } from '../ui/layout';

export class MoreScene extends Phaser.Scene {
  private P!: Palette;

  constructor() {
    super({ key: 'MoreScene' });
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

    this.add.text(GUTTER, flow.take(36), T.more.title, TX.title(p, { color: p.text }));

    // Профиль
    const ph = 80;
    const py = flow.take(ph);
    const pg = this.add.graphics();
    pg.fillStyle(p.surfaceN, 1);
    pg.fillRoundedRect(GUTTER, py, w, ph, RADIUS.md);
    pg.lineStyle(1, p.borderN, 1);
    pg.strokeRoundedRect(GUTTER, py, w, ph, RADIUS.md);
    enterPanel(this, pg as never);

    const ep = epochOf(prog.level);
    this.add.text(GUTTER + SP.lg, py + SP.md, T.topBar.level(prog.level), TX.body(p, { color: p.text }));
    this.add.text(GUTTER + SP.lg, py + SP.md + 24, ep.name, TX.caption(p, { color: p.accent }));
    this.add
      .text(GUTTER + w - SP.lg, py + SP.md, String(prog.coins), TX.numLg(p, { color: p.text }))
      .setOrigin(1, 0);
    this.add
      .text(GUTTER + w - SP.lg, py + SP.md + 28, T.topBar.coins, TX.caption(p))
      .setOrigin(1, 0);

    // Разделы
    const openMistakes = prog.errorScroll.filter((e) => !e.closed).length;
    const rows: { label: string; sub: string; scene: string; color: string }[] = [
      {
        label: T.more.journal,
        sub: T.more.openCount(openMistakes),
        scene: 'ErrorJournalScene',
        color: openMistakes ? p.warn : p.muted,
      },
      { label: T.more.warmup, sub: T.weather[prog.weather] ?? '', scene: 'DailyWarmupScene', color: p.good },
      { label: T.more.mastery, sub: 'Проверь, что усвоил', scene: 'MasteryCheckScene', color: p.accent },
      { label: T.more.tournaments, sub: 'Сравни себя с другими', scene: 'TournamentScene', color: p.crypto },
      { label: T.more.store, sub: 'Оформление за монеты', scene: 'StoreScene', color: p.warn },
      { label: T.more.settings, sub: 'Звук, вибрация, сброс', scene: 'SettingsScene', color: p.muted },
    ];

    const rowH = 64;
    rows.forEach((r, i) => {
      const y = flow.take(rowH, SP.sm);
      if (y + rowH > CANVAS.h - bottomNavHeight() - SP.md) return;
      const g = this.add.graphics();
      g.fillStyle(p.surfaceN, 1);
      g.fillRoundedRect(GUTTER, y, w, rowH, RADIUS.md);
      g.lineStyle(1, p.borderN, 1);
      g.strokeRoundedRect(GUTTER, y, w, rowH, RADIUS.md);
      enterPanel(this, g as never, { delay: i * 40 });

      this.add.text(GUTTER + SP.lg, y + SP.md, r.label, TX.body(p, { color: p.text }));
      this.add.text(GUTTER + SP.lg, y + SP.md + 22, r.sub, {
        ...TX.caption(p, { color: r.color, wrap: w - SP.lg * 2 - 30 }),
      });
      this.add
        .text(GUTTER + w - SP.lg, y + rowH / 2, '›', TX.title(p, { color: p.muted }))
        .setOrigin(1, 0.5);

      const zone = this.add
        .rectangle(GUTTER, y, w, Math.max(rowH, HIT.min), 0x000000, 0)
        .setOrigin(0)
        .setInteractive();
      zone.on('pointerdown', () => {
        haptic('light');
        playSfx('tap');
        transitionTo(this, r.scene);
      });
    });

    renderBottomNav(this, 'MoreScene', navForEpoch(prog.level));
  }
}
