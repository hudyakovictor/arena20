// Проверка мастерства: что уже освоено и что откроется дальше.

import Phaser from 'phaser';
import { gameState } from '../state/GameState';
import { cards } from '../data/cards';
import { enemies } from '../data/enemies';
import { buildPalette, type Palette } from '../ui/palette';
import { CANVAS, CHROME, GUTTER, HIT, RADIUS, SP } from '../ui/tokens';
import * as TX from '../ui/text';
import { T } from '../ui/copy';
import { button, panel, progressBar } from '../ui/widgets';
import { enemyAvatarKey } from '../engine/assetKeys';
import { renderTopBar, renderBottomNav, navForEpoch, renderBackground, bottomNavHeight } from '../ui/shell';
import { sceneEnter, enterPanel, transitionTo } from '../ui/motion';
import { Flow } from '../ui/layout';

export class MasteryCheckScene extends Phaser.Scene {
  private P!: Palette;

  constructor() {
    super({ key: 'MasteryCheckScene' });
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

    this.add.text(GUTTER, flow.take(40), T.more.mastery, TX.title(p, { color: p.text }));

    // Текущая глава
    const cur =
      cards.find((c) => gameState.isCardUnlocked(c.id) && (prog.cardRanks[c.id] ?? 0) < 3) ??
      cards[0];
    const ch = 86;
    const cy = flow.take(ch);
    const box = panel(this, GUTTER, cy, w, ch, p, { fill: p.surfaceN, stroke: p.accentN });
    enterPanel(this, box as never);
    this.add.text(GUTTER + SP.lg, cy + SP.md, T.academy.chapter(cur.cid), TX.caption(p, { color: p.accent }));
    this.add.text(GUTTER + SP.lg, cy + SP.md + 20, cur.name, {
      ...TX.bodyLg(p, { color: p.text, wrap: w - SP.lg * 2 }),
    });
    const rank = prog.cardRanks[cur.id] ?? 1;
    this.add.text(GUTTER + SP.lg, cy + ch - 30, T.academy.rank(rank), TX.caption(p, { color: p.sub }));
    progressBar(this, GUTTER + SP.lg, cy + ch - 12, w - SP.lg * 2, 6, rank / 3, p.accentN, p);

    // Общий прогресс
    const unlocked = cards.filter((c) => gameState.isCardUnlocked(c.id)).length;
    const mastered = cards.filter((c) => (prog.cardRanks[c.id] ?? 0) >= 3).length;
    const trophies = Object.keys(prog.enemyStagesReached).length;

    const sy = flow.take(70);
    const stats: [string, string][] = [
      ['Открыто карт', `${unlocked} / ${cards.length}`],
      ['Освоено', `${mastered}`],
      ['Трофеев', `${trophies} / ${enemies.length}`],
    ];
    const colW = w / 3;
    stats.forEach(([label, value], i) => {
      const x = GUTTER + i * colW + colW / 2;
      this.add.text(x, sy, value, TX.numLg(p, { color: p.text })).setOrigin(0.5, 0);
      this.add
        .text(x, sy + 28, label, { ...TX.caption(p, { align: 'center', wrap: colW - SP.sm }) })
        .setOrigin(0.5, 0);
    });

    // Что дальше
    this.add.text(GUTTER, flow.take(24), 'Что откроется дальше', TX.caption(p, { color: p.warn }));
    const pending = cards.filter((c) => !gameState.isCardUnlocked(c.id)).slice(0, 3);
    if (pending.length === 0) {
      this.add.text(GUTTER, flow.take(40), 'Все карты открыты — проверяй связки', {
        ...TX.body(p, { color: p.good, wrap: w }),
      });
    } else {
      pending.forEach((c) => {
        const y = flow.take(52, SP.sm);
        const g = this.add.graphics();
        g.fillStyle(p.insetN, 1);
        g.fillRoundedRect(GUTTER, y, w, 52, RADIUS.sm);
        g.lineStyle(1, p.borderN, 1);
        g.strokeRoundedRect(GUTTER, y, w, 52, RADIUS.sm);
        this.add.text(GUTTER + SP.md, y + SP.sm, c.name, {
          ...TX.body(p, { color: p.muted, wrap: w - SP.md * 2 }),
        });
        this.add.text(
          GUTTER + SP.md,
          y + SP.sm + 22,
          T.academy.locked(c.unlockLevel),
          TX.caption(p, { color: p.muted }),
        );
      });
    }

    // Экзамен
    const exam = enemies.find((e) => e.domain === cur.domain) ?? enemies[0];
    const ey = flow.take(72);
    if (ey + 72 < CANVAS.h - bottomNavHeight() - HIT.comfortable - SP.xl) {
      const av = enemyAvatarKey(exam.id);
      if (this.textures.exists(av)) {
        this.add.image(GUTTER + 28, ey + 30, av).setDisplaySize(52, 52).setTint(0x33383f);
      }
      this.add.text(GUTTER + 70, ey + SP.sm, T.arena.unknownEnemy, TX.body(p, { color: p.text }));
      this.add.text(GUTTER + 70, ey + SP.sm + 22, T.arena.unknownEnemyHint, {
        ...TX.caption(p, { color: p.muted, wrap: w - 80 }),
      });
    }

    button(
      this,
      GUTTER,
      CANVAS.h - bottomNavHeight() - HIT.comfortable - SP.md,
      T.academy.continue,
      p,
      () => transitionTo(this, 'ArenaScene'),
      { width: w },
    );

    renderBottomNav(this, 'MoreScene', navForEpoch(prog.level));
  }
}
