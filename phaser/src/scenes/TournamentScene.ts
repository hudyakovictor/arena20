// Турниры — асинхронные, на одинаковых наборах задач.

import Phaser from 'phaser';
import { gameState } from '../state/GameState';
import { epochOf } from '../config/epochConfig';
import { buildPalette, type Palette } from '../ui/palette';
import { CANVAS, CHROME, GUTTER, HIT, SP } from '../ui/tokens';
import * as TX from '../ui/text';
import { T } from '../ui/copy';
import { button, panel } from '../ui/widgets';
import { renderTopBar, renderBottomNav, navForEpoch, renderBackground, bottomNavHeight } from '../ui/shell';
import { sceneEnter, enterPanel } from '../ui/motion';
import { Flow } from '../ui/layout';

export class TournamentScene extends Phaser.Scene {
  private P!: Palette;

  constructor() {
    super({ key: 'TournamentScene' });
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

    this.add.text(GUTTER, flow.take(40), T.more.tournaments, TX.title(p, { color: p.text }));
    this.add.text(GUTTER, flow.take(36), 'Одинаковые задачи для всех. Покупки ни на что не влияют.', {
      ...TX.caption(p, { color: p.crypto, wrap: w }),
    });

    // Ближайшее окно
    const h1 = 96;
    const y1 = flow.take(h1);
    const box = panel(this, GUTTER, y1, w, h1, p, { fill: p.surfaceN, stroke: p.cryptoN });
    enterPanel(this, box as never);
    this.add.text(GUTTER + SP.lg, y1 + SP.md, 'Ближайший турнир', TX.caption(p));
    this.add.text(GUTTER + SP.lg, y1 + SP.md + 22, 'Неделя трейдера', {
      ...TX.bodyLg(p, { color: p.text, wrap: w - SP.lg * 2 }),
    });
    this.add.text(GUTTER + SP.lg, y1 + h1 - 28, '5 задач · старт через 2 дня', {
      ...TX.caption(p, { color: p.sub }),
    });

    // Как это работает
    this.add.text(GUTTER, flow.take(24), 'Как это работает', TX.caption(p, { color: p.accent }));
    const h2 = 84;
    const y2 = flow.take(h2);
    const box2 = panel(this, GUTTER, y2, w, h2, p, { fill: p.surfaceN });
    enterPanel(this, box2 as never);
    this.add.text(GUTTER + SP.md, y2 + SP.md, T.feedback.shadowTitle, TX.body(p, { color: p.text }));
    this.add.text(
      GUTTER + SP.md,
      y2 + SP.md + 24,
      'После своего ответа увидишь, как ту же задачу решил игрок выше по рейтингу. До ответа — ничего не показываем.',
      { ...TX.caption(p, { color: p.muted, wrap: w - SP.md * 2 }) },
    );

    const locked = epochOf(prog.level).id === 'street';
    const by = Math.min(flow.take(HIT.comfortable) + SP.md, CANVAS.h - bottomNavHeight() - HIT.comfortable - SP.md);
    button(
      this,
      GUTTER,
      by,
      locked ? T.nav.locked : 'Записаться',
      p,
      () => {
        /* регистрация появится вместе с серверной частью */
      },
      {
        width: w,
        disabled: locked,
        hint: locked ? 'Турниры открываются во второй эпохе' : undefined,
      },
    );

    renderBottomNav(this, 'MoreScene', navForEpoch(prog.level));
  }
}
