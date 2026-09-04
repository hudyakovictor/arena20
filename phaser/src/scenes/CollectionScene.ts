// Коллекция — карты навыков и трофеи противников.
// Две вкладки вместо одного перегруженного экрана; списки скроллятся.

import Phaser from 'phaser';
import { gameState } from '../state/GameState';
import { cards } from '../data/cards';
import { enemies } from '../data/enemies';
import type { Enemy, SkillCard } from '../types';
import { buildPalette, type Palette } from '../ui/palette';
import { CANVAS, CHROME, GUTTER, HIT, RADIUS, SP } from '../ui/tokens';
import * as TX from '../ui/text';
import { T } from '../ui/copy';
import { panel } from '../ui/widgets';
import { enemyAvatarKey, enemyRenderKey, cardKey } from '../engine/assetKeys';
import { renderTopBar, renderBottomNav, navForEpoch, renderBackground, bottomNavHeight } from '../ui/shell';
import { sceneEnter, fadeIn } from '../ui/motion';
import { haptic, playSfx } from '../ui/feedbackFx';
import { ScrollList } from '../ui/ScrollList';

type Tab = 'cards' | 'trophies';

const CARD_ROW_H = 92;
const TROPHY_ROW_H = 96;

export class CollectionScene extends Phaser.Scene {
  private P!: Palette;
  private tab: Tab = 'cards';
  private list?: ScrollList;
  private listLayer?: Phaser.GameObjects.Container;
  private tabsLayer?: Phaser.GameObjects.Container;
  private tabsY = 0;

  constructor() {
    super({ key: 'CollectionScene' });
  }

  create(): void {
    const p = gameState.progress;
    this.P = buildPalette(p.epoch);
    this.registry.set('epoch', p.epoch);
    renderBackground(this, this.P);
    sceneEnter(this);
    renderTopBar(this, gameState);

    const headY = CHROME.topBar + SP.md;
    this.add.text(GUTTER, headY, T.collection.title, TX.title(this.P, { color: this.P.text }));

    this.renderTabs(headY + 40);
    this.renderList();
    renderBottomNav(this, 'CollectionScene', navForEpoch(p.level));
  }

  private renderTabs(y: number): void {
    this.tabsY = y;
    this.tabsLayer?.destroy();
    const layer = this.add.container(0, 0);
    this.tabsLayer = layer;
    const p = this.P;
    const w = CANVAS.w - GUTTER * 2;
    const tabs: { id: Tab; label: string }[] = [
      { id: 'cards', label: T.collection.cards },
      { id: 'trophies', label: T.collection.trophies },
    ];
    const tw = (w - SP.sm) / 2;
    tabs.forEach((t, i) => {
      const x = GUTTER + i * (tw + SP.sm);
      const active = this.tab === t.id;
      const g = this.add.graphics();
      layer.add(g);
      g.fillStyle(active ? p.hoverN : p.surfaceN, 1);
      g.fillRoundedRect(x, y, tw, HIT.min, RADIUS.md);
      g.lineStyle(active ? 2 : 1, active ? p.accentN : p.borderN, 1);
      g.strokeRoundedRect(x, y, tw, HIT.min, RADIUS.md);
      const label = this.add
        .text(x + tw / 2, y + HIT.min / 2, t.label, {
          ...TX.body(p, { color: active ? p.text : p.muted }),
        })
        .setOrigin(0.5);
      layer.add(label);
      const zone = this.add
        .rectangle(x, y, tw, HIT.min, 0x000000, 0)
        .setOrigin(0)
        .setInteractive();
      layer.add(zone);
      zone.on('pointerdown', () => {
        if (this.tab === t.id) return;
        haptic('light');
        playSfx('tap');
        this.tab = t.id;
        // Меняем только вкладки и список — сцена не перезапускается (аудит A2).
        this.renderTabs(this.tabsY);
        this.renderList();
      });
    });
  }

  private renderList(): void {
    this.list?.destroy();
    this.listLayer?.destroy();
    const top = CHROME.topBar + SP.md + 40 + HIT.min + SP.md;
    const height = CANVAS.h - bottomNavHeight() - top - SP.md;

    if (this.tab === 'cards') {
      this.list = new ScrollList(this, {
        x: 0,
        y: top,
        width: CANVAS.w,
        height,
        itemHeight: CARD_ROW_H + SP.sm,
        itemCount: cards.length,
        renderItem: (i, c, y) => this.renderCardRow(cards[i], c, y),
      });
    } else {
      this.list = new ScrollList(this, {
        x: 0,
        y: top,
        width: CANVAS.w,
        height,
        itemHeight: TROPHY_ROW_H + SP.sm,
        itemCount: enemies.length,
        renderItem: (i, c, y) => this.renderTrophyRow(enemies[i], c, y),
      });
    }
  }

  private renderCardRow(c: SkillCard, container: Phaser.GameObjects.Container, y: number): void {
    const p = this.P;
    const prog = gameState.progress;
    const unlocked = gameState.isCardUnlocked(c.id);
    const rank = prog.cardRanks[c.id] ?? 0;
    const w = CANVAS.w - GUTTER * 2;
    const accent = !unlocked ? p.borderN : rank >= 3 ? p.warnN : rank >= 2 ? p.goodN : p.accentN;
    const accentS = !unlocked ? p.muted : rank >= 3 ? p.warn : rank >= 2 ? p.good : p.accent;

    const g = this.add.graphics();
    g.fillStyle(unlocked ? p.surfaceN : p.insetN, 1);
    g.fillRoundedRect(GUTTER, y, w, CARD_ROW_H, RADIUS.md);
    // рамка = ранг карты
    g.lineStyle(rank >= 2 ? 2 : 1, unlocked ? accent : p.borderN, 1);
    g.strokeRoundedRect(GUTTER, y, w, CARD_ROW_H, RADIUS.md);
    container.add(g);

    const tex = cardKey(c.id);
    if (this.textures.exists(tex)) {
      const img = this.add.image(GUTTER + SP.md + 22, y + CARD_ROW_H / 2, tex).setDisplaySize(34, 48);
      if (!unlocked) img.setTint(p.mutedN);
      container.add(img);
    }

    const tx = GUTTER + SP.md + 44 + SP.md;
    const textW = w - (tx - GUTTER) - SP.md - 60;
    container.add(
      this.add.text(tx, y + SP.md, c.name, {
        ...TX.body(p, { color: unlocked ? p.text : p.muted, wrap: textW }),
      }),
    );
    container.add(
      this.add.text(
        tx,
        y + SP.md + 22,
        unlocked ? T.academy.rank(rank || 1) : T.academy.locked(c.unlockLevel),
        TX.caption(p, { color: accentS }),
      ),
    );
    container.add(
      this.add.text(tx, y + CARD_ROW_H - 26, c.atoms.map((a) => a.desc).join(' · '), {
        ...TX.caption(p, { color: p.muted, wrap: textW }),
      }),
    );

    const zone = this.add
      .rectangle(GUTTER, y, w, Math.max(CARD_ROW_H, HIT.min), 0x000000, 0)
      .setOrigin(0)
      .setInteractive();
    zone.on('pointerup', () => {
      if (this.list?.didDrag()) return;
      if (!unlocked) {
        haptic('warn');
        return;
      }
      haptic('light');
      this.openCardSheet(c, rank);
    });
    container.add(zone);
  }

  private renderTrophyRow(e: Enemy, container: Phaser.GameObjects.Container, y: number): void {
    const p = this.P;
    const stage = gameState.progress.enemyStagesReached[e.id] ?? 0;
    const met = stage > 0;
    const w = CANVAS.w - GUTTER * 2;
    const accent = !met ? p.borderN : stage >= 3 ? p.warnN : p.cryptoN;
    const accentS = !met ? p.muted : stage >= 3 ? p.warn : p.crypto;

    const g = this.add.graphics();
    g.fillStyle(met ? p.surfaceN : p.insetN, 1);
    g.fillRoundedRect(GUTTER, y, w, TROPHY_ROW_H, RADIUS.md);
    g.lineStyle(1, accent, 1);
    g.strokeRoundedRect(GUTTER, y, w, TROPHY_ROW_H, RADIUS.md);
    container.add(g);

    const av = enemyAvatarKey(e.id);
    if (this.textures.exists(av)) {
      const img = this.add
        .image(GUTTER + SP.md + 28, y + TROPHY_ROW_H / 2, av)
        .setDisplaySize(56, 56);
      // не встреченный противник — только силуэт
      if (!met) img.setTint(0x2a2f38).setAlpha(0.8);
      container.add(img);
    }

    const tx = GUTTER + SP.md + 56 + SP.md;
    const textW = w - (tx - GUTTER) - SP.md;
    container.add(
      this.add.text(tx, y + SP.md, met ? e.name : T.collection.silhouette, {
        ...TX.body(p, { color: met ? p.text : p.muted, wrap: textW }),
      }),
    );
    container.add(
      this.add.text(
        tx,
        y + SP.md + 24,
        met ? T.collection.stage(stage, e.stages.length) : '—',
        TX.caption(p, { color: accentS }),
      ),
    );
    if (met) {
      const done = stage / e.stages.length;
      const bar = this.add.graphics();
      bar.fillStyle(p.insetN, 1);
      bar.fillRoundedRect(tx, y + TROPHY_ROW_H - 24, textW, 6, 3);
      bar.fillStyle(accent, 1);
      bar.fillRoundedRect(tx, y + TROPHY_ROW_H - 24, textW * done, 6, 3);
      container.add(bar);
    }

    const zone = this.add
      .rectangle(GUTTER, y, w, Math.max(TROPHY_ROW_H, HIT.min), 0x000000, 0)
      .setOrigin(0)
      .setInteractive();
    zone.on('pointerup', () => {
      if (this.list?.didDrag()) return;
      haptic('light');
      this.openTrophySheet(e, stage);
    });
    container.add(zone);
  }

  private sheet(): { layer: Phaser.GameObjects.Container; close: () => void } {
    const p = this.P;
    const layer = this.add.container(0, 0).setDepth(700);
    const shade = this.add
      .rectangle(0, 0, CANVAS.w, CANVAS.h, p.bgN, 0.97)
      .setOrigin(0)
      .setInteractive();
    layer.add(shade);
    fadeIn(this, shade, { to: 0.97 });
    const close = () => layer.destroy();
    shade.on('pointerdown', close);
    return { layer, close };
  }

  private openCardSheet(c: SkillCard, rank: number): void {
    const p = this.P;
    const { layer, close } = this.sheet();
    const w = CANVAS.w - GUTTER * 2;
    let y = 140;

    layer.add(this.add.text(GUTTER, y, c.name, TX.title(p, { color: p.text, wrap: w })));
    y += 44;
    layer.add(this.add.text(GUTTER, y, T.academy.rank(rank || 1), TX.body(p, { color: p.accent })));
    y += 36;

    layer.add(this.add.text(GUTTER, y, 'Чему учит', TX.caption(p)));
    y += 22;
    c.atoms.forEach((a) => {
      const box = panel(this, GUTTER, y, w, 44, p, { fill: p.surfaceN });
      layer.add(box);
      layer.add(
        this.add.text(GUTTER + SP.md, y + 13, a.desc, {
          ...TX.body(p, { color: p.text, wrap: w - SP.md * 2 }),
        }),
      );
      y += 44 + SP.sm;
    });

    layer.add(
      this.add
        .text(CANVAS.w / 2, CANVAS.h - 120, T.common.close, TX.body(p, { color: p.muted }))
        .setOrigin(0.5),
    );
    const z = this.add
      .rectangle(CANVAS.w / 2 - 80, CANVAS.h - 120 - HIT.min / 2, 160, HIT.min, 0x000000, 0)
      .setOrigin(0)
      .setInteractive();
    z.on('pointerdown', close);
    layer.add(z);
  }

  private openTrophySheet(e: Enemy, stage: number): void {
    const p = this.P;
    const { layer, close } = this.sheet();
    const w = CANVAS.w - GUTTER * 2;
    const met = stage > 0;
    let y = 110;

    if (met) {
      const reached = e.stages.find((s) => stage >= s.stage) ?? e.stages[0];
      const key = enemyRenderKey(e.id, reached.stage);
      if (this.textures.exists(key)) {
        layer.add(this.add.image(CANVAS.w / 2, y + 60, key).setDisplaySize(120, 120));
      }
      y += 130;
    }

    layer.add(
      this.add
        .text(CANVAS.w / 2, y, met ? e.name : T.collection.silhouette, {
          ...TX.title(p, { color: p.text, align: 'center', wrap: w }),
        })
        .setOrigin(0.5, 0),
    );
    y += 44;
    layer.add(
      this.add
        .text(CANVAS.w / 2, y, T.collection.trophiesHint, {
          ...TX.caption(p, { color: p.muted, align: 'center', wrap: w }),
        })
        .setOrigin(0.5, 0),
    );
    y += 40;

    e.stages.forEach((s) => {
      const reached = stage >= s.stage;
      const g = this.add.graphics();
      g.fillStyle(reached ? p.surfaceN : p.insetN, 1);
      g.fillRoundedRect(GUTTER, y, w, 56, RADIUS.sm);
      g.lineStyle(1, reached ? p.strongN : p.borderN, 1);
      g.strokeRoundedRect(GUTTER, y, w, 56, RADIUS.sm);
      layer.add(g);
      layer.add(
        this.add.text(
          GUTTER + SP.md,
          y + SP.sm,
          T.collection.stage(s.stage, e.stages.length),
          TX.caption(p, { color: reached ? p.accent : p.muted }),
        ),
      );
      layer.add(
        this.add.text(GUTTER + SP.md, y + SP.sm + 20, reached ? s.factor : '—', {
          ...TX.body(p, { color: reached ? p.sub : p.muted, wrap: w - SP.md * 2 }),
        }),
      );
      y += 56 + SP.sm;
    });

    const cy = Math.min(y + SP.md, CANVAS.h - 90);
    layer.add(
      this.add.text(CANVAS.w / 2, cy, T.common.close, TX.body(p, { color: p.muted })).setOrigin(0.5),
    );
    const z = this.add
      .rectangle(CANVAS.w / 2 - 80, cy - HIT.min / 2, 160, HIT.min, 0x000000, 0)
      .setOrigin(0)
      .setInteractive();
    z.on('pointerdown', close);
    layer.add(z);
  }
}
