// Магазин оформления. Монеты тратятся только на внешний вид —
// ничто здесь не влияет на данные, карты, ответы или запас риска.

import Phaser from 'phaser';
import { gameState } from '../state/GameState';
import { buildPalette, type Palette } from '../ui/palette';
import { CANVAS, CHROME, GUTTER, HIT, RADIUS, SP } from '../ui/tokens';
import * as TX from '../ui/text';
import { T } from '../ui/copy';
import { iconKey } from '../engine/assetKeys';
import { renderTopBar, renderBottomNav, navForEpoch, renderBackground, bottomNavHeight } from '../ui/shell';
import { sceneEnter, enterPanel, shakeNo } from '../ui/motion';
import { haptic, playSfx } from '../ui/feedbackFx';
import { Flow } from '../ui/layout';

interface StoreItem {
  name: string;
  kind: string;
  price: number;
  icon: string;
}

const ITEMS: StoreItem[] = [
  { name: 'Оформление «Неон»', kind: 'Интерфейс', price: 800, icon: 'nav-arena' },
  { name: 'Рубашка карт «Стекло»', kind: 'Карты', price: 500, icon: 'nav-collection' },
  { name: 'Витрина «Обсидиан»', kind: 'Трофеи', price: 1200, icon: 'nav-arena' },
  { name: 'Эффект «Искра»', kind: 'Отклик', price: 300, icon: 'nav-more' },
];

export class StoreScene extends Phaser.Scene {
  private P!: Palette;
  private toast?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'StoreScene' });
  }

  private itemsLayer?: Phaser.GameObjects.Container;

  create(): void {
    const prog = gameState.progress;
    this.P = buildPalette(prog.epoch);
    renderBackground(this, this.P);
    sceneEnter(this);
    renderTopBar(this, gameState);
    this.renderItems();
    renderBottomNav(this, 'MoreScene', navForEpoch(prog.level));
  }

  /** Перерисовывает витрину и счётчик монет без перезапуска сцены (аудит A2). */
  private renderItems(): void {
    const prog = gameState.progress;
    this.itemsLayer?.destroy();
    const layer = this.add.container(0, 0);
    this.itemsLayer = layer;

    const p = this.P;
    const w = CANVAS.w - GUTTER * 2;
    const flow = new Flow(CHROME.topBar + SP.md, SP.md);

    layer.add(
      this.add.text(GUTTER, flow.take(40), T.more.store, TX.title(p, { color: p.text })),
    );
    layer.add(
      this.add.text(GUTTER, flow.take(36), 'Только внешний вид. На игру не влияет.', {
        ...TX.caption(p, { color: p.warn, wrap: w }),
      }),
    );

    const rowH = 80;
    ITEMS.forEach((item, i) => {
      const y = flow.take(rowH, SP.sm);
      const owned = gameState.getFlag('store_' + item.name);
      const affordable = prog.coins >= item.price;

      const g = this.add.graphics();
      g.fillStyle(p.surfaceN, 1);
      g.fillRoundedRect(GUTTER, y, w, rowH, RADIUS.md);
      g.lineStyle(1, owned ? p.goodN : p.borderN, 1);
      g.strokeRoundedRect(GUTTER, y, w, rowH, RADIUS.md);
      const card = this.add.container(0, 0);
      layer.add(card);
      card.add(g);
      enterPanel(this, g as never, { delay: i * 40 });

      const k = iconKey(item.icon);
      if (this.textures.exists(k)) {
        card.add(
          this.add
            .image(GUTTER + SP.lg + 14, y + rowH / 2, k)
            .setDisplaySize(28, 28)
            .setTint(p.accentN),
        );
      }

      const tx = GUTTER + SP.lg + 40;
      card.add(
        this.add.text(tx, y + SP.md, item.name, {
          ...TX.body(p, { color: p.text, wrap: w - (tx - GUTTER) - 100 }),
        }),
      );
      card.add(this.add.text(tx, y + SP.md + 22, item.kind, TX.caption(p, { color: p.muted })));
      card.add(
        this.add
          .text(GUTTER + w - SP.lg, y + SP.md, String(item.price), {
            ...TX.num(p, { color: affordable ? p.accent : p.muted }),
          })
          .setOrigin(1, 0),
      );
      card.add(
        this.add
          .text(
            GUTTER + w - SP.lg,
            y + rowH - 28,
            owned ? 'Куплено' : affordable ? 'Купить' : 'Не хватает',
            TX.caption(p, { color: owned ? p.good : affordable ? p.sub : p.muted }),
          )
          .setOrigin(1, 0),
      );

      const zone = this.add
        .rectangle(GUTTER, y, w, Math.max(rowH, HIT.min), 0x000000, 0)
        .setOrigin(0)
        .setInteractive();
      card.add(zone);
      zone.on('pointerdown', () => {
        if (owned) return;
        if (!affordable) {
          haptic('warn');
          shakeNo(this, card);
          this.showToast('Не хватает монет — заработай на Арене', p.bad);
          return;
        }
        gameState.progress.coins -= item.price;
        gameState.setFlag('store_' + item.name);
        gameState.save();
        haptic('success');
        playSfx('reward');
        // Обновляем витрину и топбар на месте, экран не мигает.
        renderTopBar(this, gameState);
        this.renderItems();
        this.showToast('Куплено: ' + item.name, this.P.good);
      });
    });
  }

  private showToast(text: string, color: string): void {
    this.toast?.destroy();
    this.toast = this.add
      .text(CANVAS.w / 2, CANVAS.h - bottomNavHeight() - 50, text, {
        ...TX.body(this.P, { color, align: 'center', wrap: CANVAS.w - GUTTER * 2 }),
      })
      .setOrigin(0.5, 0)
      .setDepth(500);
    this.time.delayedCall(2000, () => this.toast?.destroy());
  }
}
