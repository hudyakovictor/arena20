// Загрузка ассетов и заставка.
// Грузим только то, что нужно для первых экранов; тяжёлые рендеры врагов
// подтягиваются по мере надобности (аудит P3).

import Phaser from 'phaser';
import { gameState } from '../state/GameState';
import { epochOf } from '../config/epochConfig';
import { enemies } from '../data/enemies';
import { cards } from '../data/cards';
import {
  enemyAvatarKey, enemyAvatarUrl, enemyIconKey, enemyIconUrl,
  enemyRenderKey, enemyRenderUrl, cardKey, cardUrl, iconKey, iconUrl,
  MENU_ICONS,
} from '../engine/assetKeys';
import { buildPalette } from '../ui/palette';
import { CANVAS, GUTTER, SP } from '../ui/tokens';
import * as TX from '../ui/text';
import { T } from '../ui/copy';
import { progressBar } from '../ui/widgets';
import { initFx } from '../ui/feedbackFx';
import { initMotion } from '../ui/motion';

export class BootScene extends Phaser.Scene {
  private barFill?: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    const p = buildPalette(gameState.progress.epoch);
    // Индикатор загрузки — вместо пустого экрана
    const w = CANVAS.w - GUTTER * 2;
    const barY = CANVAS.h / 2 + 60;
    progressBar(this, GUTTER, barY, w, 6, 0, p.accentN, p);
    this.barFill = this.add.graphics();
    this.load.on('progress', (v: number) => {
      this.barFill?.clear();
      this.barFill?.fillStyle(p.accentN, 1);
      this.barFill?.fillRoundedRect(GUTTER, barY, Math.max(6, w * v), 6, 3);
    });

    // Иконки интерфейса — нужны сразу
    for (const m of MENU_ICONS) {
      this.load.svg(iconKey(m.id), iconUrl(m.id), { width: 24, height: 24 });
    }
    // Карты навыков — используются в Академии, Коллекции и на Арене
    for (const c of cards) {
      this.load.svg(cardKey(c.id), cardUrl(c.id), { width: 220, height: 320 });
    }
    this.load.svg(cardKey('Cwait'), cardUrl('Cwait'), { width: 220, height: 320 });

    // Аватары и иконки врагов — лёгкие, нужны в Коллекции и опознании
    for (const e of enemies) {
      this.load.svg(enemyAvatarKey(e.id), enemyAvatarUrl(e.id), { width: 200, height: 200 });
      this.load.svg(enemyIconKey(e.id), enemyIconUrl(e.id), { width: 96, height: 96 });
    }

    // Крупные рендеры стадий — только для уже встреченных противников.
    const met = Object.keys(gameState.progress.enemyStagesReached);
    for (const id of met) {
      const enemy = enemies.find((e) => e.id === id);
      if (!enemy) continue;
      for (const s of enemy.stages) {
        this.load.svg(enemyRenderKey(id, s.stage), enemyRenderUrl(id, s.stage), {
          width: 512,
          height: 512,
        });
      }
    }

    this.load.image('bg-wall', 'assets/bg-wall.jpg');
  }

  create(): void {
    initFx();
    initMotion();

    const prog = gameState.progress;
    const p = buildPalette(prog.epoch);
    const ep = epochOf(prog.level);
    this.cameras.main.setBackgroundColor(p.bgN);
    if (this.textures.exists('bg-wall')) {
      this.add.image(0, 0, 'bg-wall').setOrigin(0).setDisplaySize(CANVAS.w, CANVAS.h).setAlpha(0.5);
      this.add.rectangle(0, 0, CANVAS.w, CANVAS.h, 0x000000, 0.6).setOrigin(0);
    }

    const w = CANVAS.w - GUTTER * 2;
    this.add
      .text(CANVAS.w / 2, CANVAS.h / 2 - 80, T.onboarding.brand, {
        ...TX.display(p, { color: p.accent, align: 'center' }),
      })
      .setOrigin(0.5);
    this.add
      .text(CANVAS.w / 2, CANVAS.h / 2 - 36, `${ep.name} · ${T.topBar.level(prog.level)}`, {
        ...TX.body(p, { color: p.sub, align: 'center', wrap: w }),
      })
      .setOrigin(0.5);
    this.add
      .text(CANVAS.w / 2, CANVAS.h / 2 + SP.md, ep.motto, {
        ...TX.caption(p, { color: p.muted, align: 'center', wrap: w }),
      })
      .setOrigin(0.5, 0);

    const firstRun = !gameState.getFlag('onboarding_done');
    this.time.delayedCall(700, () => {
      this.scene.start(firstRun ? 'OnboardingScene' : 'ArenaScene');
    });
  }
}
