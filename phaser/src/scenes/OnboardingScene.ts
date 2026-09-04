// Первый вход — три коротких экрана о сути игры. Без внутренних терминов.

import Phaser from 'phaser';
import { gameState } from '../state/GameState';
import { buildPalette, type Palette } from '../ui/palette';
import { CANVAS, GUTTER, HIT, RADIUS, SP } from '../ui/tokens';
import * as TX from '../ui/text';
import { T } from '../ui/copy';
import { button, progressBar } from '../ui/widgets';
import { iconKey } from '../engine/assetKeys';
import { renderBackground } from '../ui/shell';
import { sceneEnter, enterPanel, transitionTo } from '../ui/motion';

interface Step {
  title: string;
  body: string;
  render: (p: Palette, y: number, layer: Phaser.GameObjects.Container) => void;
}

export class OnboardingScene extends Phaser.Scene {
  private step = 0;
  private P!: Palette;
  private layer?: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'OnboardingScene' });
  }

  create(): void {
    this.step = 0;
    this.P = buildPalette('street');
    renderBackground(this, this.P);
    sceneEnter(this);
    this.render();
  }

  private steps(): Step[] {
    return [
      {
        title: T.onboarding.step1Title,
        body: T.onboarding.step1Body,
        render: (p, y, layer) => this.renderPillars(p, y, layer),
      },
      {
        title: T.onboarding.step2Title,
        body: T.onboarding.step2Body,
        render: (p, y, layer) => this.renderEnemies(p, y, layer),
      },
      {
        title: T.onboarding.step3Title,
        body: T.onboarding.step3Body,
        render: (p, y, layer) => this.renderBudget(p, y, layer),
      },
    ];
  }

  private render(): void {
    this.layer?.destroy();
    const layer = this.add.container(0, 0);
    this.layer = layer;
    const p = this.P;
    const w = CANVAS.w - GUTTER * 2;
    const steps = this.steps();
    const s = steps[this.step];

    layer.add(
      this.add
        .text(CANVAS.w / 2, 64, T.onboarding.brand, TX.display(p, { color: p.accent }))
        .setOrigin(0.5, 0),
    );

    const titleT = this.add
      .text(CANVAS.w / 2, 150, s.title, {
        ...TX.title(p, { color: p.text, align: 'center', wrap: w }),
      })
      .setOrigin(0.5, 0);
    layer.add(titleT);
    enterPanel(this, titleT as never);

    const bodyT = this.add
      .text(CANVAS.w / 2, 150 + titleT.height + SP.md, s.body, {
        ...TX.body(p, { color: p.sub, align: 'center', wrap: w }),
      })
      .setOrigin(0.5, 0);
    layer.add(bodyT);

    s.render(p, 320, layer);

    // Индикатор шага
    const dotY = CANVAS.h - 170;
    steps.forEach((_, i) => {
      const g = this.add.graphics();
      const active = i === this.step;
      g.fillStyle(active ? p.accentN : p.borderN, 1);
      g.fillRoundedRect(CANVAS.w / 2 - 30 + i * 22, dotY, active ? 20 : 8, 6, 3);
      layer.add(g);
    });

    const last = this.step === steps.length - 1;
    layer.add(
      button(
        this,
        GUTTER,
        CANVAS.h - 130,
        last ? T.onboarding.start : T.onboarding.next,
        p,
        () => {
          if (last) {
            gameState.setFlag('onboarding_done');
            transitionTo(this, 'AcademyScene');
          } else {
            this.step++;
            this.render();
          }
        },
        { width: w },
      ),
    );

    const skip = this.add
      .text(CANVAS.w / 2, CANVAS.h - 64, T.onboarding.skip, TX.body(p, { color: p.muted }))
      .setOrigin(0.5);
    const skipZone = this.add
      .rectangle(CANVAS.w / 2 - 80, CANVAS.h - 64 - HIT.min / 2, 160, HIT.min, 0x000000, 0)
      .setOrigin(0)
      .setInteractive();
    skipZone.on('pointerdown', () => {
      gameState.setFlag('onboarding_done');
      transitionTo(this, 'AcademyScene');
    });
    layer.add(skip);
    layer.add(skipZone);
  }

  private renderPillars(p: Palette, y: number, layer: Phaser.GameObjects.Container): void {
    const tiles = [
      { label: 'Терминал', icon: 'nav-arena' },
      { label: 'Карты', icon: 'nav-collection' },
      { label: 'Уроки', icon: 'nav-academy' },
    ];
    const w = CANVAS.w - GUTTER * 2;
    const tw = (w - SP.md * 2) / 3;
    tiles.forEach((t, i) => {
      const x = GUTTER + i * (tw + SP.md);
      const g = this.add.graphics();
      g.fillStyle(p.surfaceN, 1);
      g.fillRoundedRect(x, y, tw, 100, RADIUS.md);
      g.lineStyle(1, p.borderN, 1);
      g.strokeRoundedRect(x, y, tw, 100, RADIUS.md);
      layer.add(g);
      const k = iconKey(t.icon);
      if (this.textures.exists(k)) {
        layer.add(this.add.image(x + tw / 2, y + 38, k).setDisplaySize(30, 30).setTint(p.accentN));
      }
      layer.add(
        this.add
          .text(x + tw / 2, y + 66, t.label, {
            ...TX.body(p, { color: p.text, align: 'center', wrap: tw - SP.sm }),
          })
          .setOrigin(0.5, 0),
      );
      enterPanel(this, g as never, { delay: i * 80 });
    });
  }

  private renderEnemies(p: Palette, y: number, layer: Phaser.GameObjects.Container): void {
    const ids = ['E04', 'E05', 'E18'];
    ids.forEach((id, i) => {
      const cx = CANVAS.w / 2 + (i - 1) * 110;
      const g = this.add.graphics();
      g.fillStyle(p.surfaceN, 1);
      g.fillCircle(cx, y + 50, 44);
      g.lineStyle(2, p.borderN, 1);
      g.strokeCircle(cx, y + 50, 44);
      layer.add(g);
      const k = `enemy_${id.replace('E', '')}_avatar`;
      if (this.textures.exists(k)) {
        layer.add(this.add.image(cx, y + 50, k).setDisplaySize(76, 76).setAlpha(0.9));
      }
      enterPanel(this, g as never, { delay: i * 90 });
    });
  }

  private renderBudget(p: Palette, y: number, layer: Phaser.GameObjects.Container): void {
    const w = CANVAS.w - GUTTER * 2;
    layer.add(
      this.add
        .text(CANVAS.w / 2, y, '100', TX.display(p, { color: p.good }))
        .setOrigin(0.5, 0),
    );
    layer.add(
      this.add
        .text(CANVAS.w / 2, y + 40, T.topBar.budget, TX.caption(p, { color: p.sub }))
        .setOrigin(0.5, 0),
    );
    const bar = progressBar(this, GUTTER, y + 70, w, 10, 1, p.goodN, p);
    layer.add(bar);
    enterPanel(this, bar as never);
    layer.add(
      this.add
        .text(CANVAS.w / 2, y + 96, T.topBar.budgetHint, {
          ...TX.caption(p, { color: p.muted, align: 'center', wrap: w }),
        })
        .setOrigin(0.5, 0),
    );
  }
}
