// SIGNAL ARENA — общий каркас: верхняя панель и нижняя навигация.
// Один компонент на все экраны: читаемый кегль, тач-зоны >= 44,
// safe-area внизу, человеческие подписи без внутренних меток.

import Phaser from 'phaser';
import type { GameState } from '../state/GameState';
import { epochOf } from '../config/epochConfig';
import { iconKey } from '../engine/assetKeys';
import { buildPalette, type Palette } from './palette';
import { CANVAS, CHROME, GUTTER, HIT, RADIUS, SP } from './tokens';
import * as TX from './text';
import { T } from './copy';
import { progressBar } from './widgets';
import { transitionTo } from './motion';
import { haptic, playSfx } from './feedbackFx';
import { safeAreaInsets } from './layout';

const NAV_ITEMS = [
  { key: 'AcademyScene', label: T.nav.academy, icon: 'nav-academy' },
  { key: 'ArenaScene', label: T.nav.arena, icon: 'nav-arena' },
  { key: 'CollectionScene', label: T.nav.collection, icon: 'nav-collection' },
  { key: 'MoreScene', label: T.nav.more, icon: 'nav-more' },
];

/** Верхняя панель: уровень, опыт, монеты, запас риска. */
export function renderTopBar(
  scene: Phaser.Scene,
  gs: GameState,
  opts: { compact?: boolean } = {},
): Phaser.GameObjects.Container {
  const p = gs.progress;
  const pal = buildPalette(p.epoch);
  const ep = epochOf(p.level);
  const c = scene.add.container(0, 0);
  const h = CHROME.topBar;

  const bg = scene.add.graphics();
  bg.fillStyle(pal.surfaceN, 0.96);
  bg.fillRect(0, 0, CANVAS.w, h);
  bg.lineStyle(1, pal.borderN, 1);
  bg.beginPath();
  bg.moveTo(0, h);
  bg.lineTo(CANVAS.w, h);
  bg.strokePath();
  c.add(bg);

  // Уровень
  const lvlBox = scene.add.graphics();
  lvlBox.fillStyle(pal.accentN, 1);
  lvlBox.fillRoundedRect(GUTTER, SP.md, 44, 40, RADIUS.sm);
  c.add(lvlBox);
  c.add(
    scene.add
      .text(GUTTER + 22, SP.md + 12, String(p.level), TX.numLg(pal, { color: pal.accentInk }))
      .setOrigin(0.5),
  );
  c.add(
    scene.add
      .text(GUTTER + 22, SP.md + 30, 'ур.', TX.caption(pal, { color: pal.accentInk }))
      .setOrigin(0.5),
  );

  // Опыт
  const xpX = GUTTER + 44 + SP.md;
  const xpW = 132;
  c.add(scene.add.text(xpX, SP.md, T.topBar.xp, TX.caption(pal)));
  c.add(progressBar(scene, xpX, SP.md + 18, xpW, 8, p.xp / p.xpMax, pal.accentN, pal));
  c.add(
    scene.add.text(xpX, SP.md + 30, `${p.xp} / ${p.xpMax}`, TX.code(pal, { color: pal.sub })),
  );

  // Запас риска — главный ресурс сессии
  const bx = xpX + xpW + SP.lg;
  const bw = CANVAS.w - bx - GUTTER;
  const ratio = p.riskBudget / p.maxBudget;
  const bCol = p.riskBudget <= 20 ? pal.badN : p.riskBudget <= 45 ? pal.warnN : pal.goodN;
  const bColS = p.riskBudget <= 20 ? pal.bad : p.riskBudget <= 45 ? pal.warn : pal.good;
  c.add(scene.add.text(bx, SP.md, T.topBar.budget, TX.caption(pal)));
  c.add(progressBar(scene, bx, SP.md + 18, bw, 8, ratio, bCol, pal));
  c.add(scene.add.text(bx, SP.md + 30, String(p.riskBudget), TX.code(pal, { color: bColS })));

  // Монеты справа от опыта — компактно, но читаемо
  if (!opts.compact) {
    c.add(
      scene.add
        .text(CANVAS.w - GUTTER, SP.md - 2, `${p.coins}`, TX.num(pal, { color: pal.sub }))
        .setOrigin(1, 0),
    );
  }
  void ep;
  return c;
}

/** Нижняя навигация. Пункты, недоступные в эпохе, показаны приглушённо. */
export function renderBottomNav(
  scene: Phaser.Scene,
  current: string,
  unlocked: string[],
): Phaser.GameObjects.Container {
  const pal = buildPalette(currentEpochId(scene));
  const insets = safeAreaInsets();
  const navH = CHROME.bottomNav + insets.bottom;
  const y = CANVAS.h - navH;
  const c = scene.add.container(0, y);

  const bg = scene.add.graphics();
  bg.fillStyle(pal.bgN, 0.98);
  bg.fillRect(0, 0, CANVAS.w, navH);
  bg.lineStyle(1, pal.borderN, 1);
  bg.beginPath();
  bg.moveTo(0, 0);
  bg.lineTo(CANVAS.w, 0);
  bg.strokePath();
  c.add(bg);

  const cell = CANVAS.w / NAV_ITEMS.length;
  NAV_ITEMS.forEach((item, i) => {
    const isActive = item.key === current;
    const isUnlocked = unlocked.includes(item.key);
    const cx = i * cell + cell / 2;

    const zone = scene.add
      .rectangle(i * cell, 0, cell, Math.max(CHROME.bottomNav, HIT.min), 0x000000, 0)
      .setOrigin(0)
      .setInteractive();
    zone.on('pointerdown', () => {
      if (!isUnlocked) {
        haptic('warn');
        return;
      }
      if (isActive) return;
      haptic('light');
      playSfx('tap');
      transitionTo(scene, item.key);
    });
    c.add(zone);

    const tint = isActive ? pal.accentN : isUnlocked ? pal.subN : pal.mutedN;
    const tex = iconKey(item.icon);
    if (scene.textures.exists(tex)) {
      const img = scene.add.image(cx, 22, tex).setDisplaySize(24, 24).setTint(tint);
      img.setAlpha(isUnlocked ? 1 : 0.45);
      c.add(img);
    }
    const colorS = isActive ? pal.accent : isUnlocked ? pal.sub : pal.muted;
    c.add(scene.add.text(cx, 40, item.label, TX.caption(pal, { color: colorS })).setOrigin(0.5, 0));

    if (isActive) {
      const ind = scene.add.graphics();
      ind.fillStyle(pal.accentN, 1);
      ind.fillRoundedRect(i * cell + cell / 2 - 16, 0, 32, 3, 2);
      c.add(ind);
    }
  });
  return c;
}

/** Высота нижней навигации с учётом safe-area — чтобы контент не уезжал под неё. */
export function bottomNavHeight(): number {
  return CHROME.bottomNav + safeAreaInsets().bottom;
}

/** Разделы, доступные в текущей эпохе (ось взросления). */
export function navForEpoch(level: number): string[] {
  const ep = epochOf(level).id;
  if (ep === 'street') return ['AcademyScene', 'ArenaScene'];
  if (ep === 'cabinet') return ['AcademyScene', 'ArenaScene', 'CollectionScene'];
  return ['AcademyScene', 'ArenaScene', 'CollectionScene', 'MoreScene'];
}

function currentEpochId(scene: Phaser.Scene): string {
  const fromRegistry = scene.registry.get('epoch') as string | undefined;
  return fromRegistry ?? 'street';
}

/** Фон экрана в токенах эпохи, включая кирпич «Улицы». */
export function renderBackground(scene: Phaser.Scene, pal: Palette): void {
  scene.cameras.main.setBackgroundColor(pal.bgN);
  if (pal.brick && scene.textures.exists('bg-wall')) {
    scene.add.image(0, 0, 'bg-wall').setOrigin(0).setDisplaySize(CANVAS.w, CANVAS.h).setAlpha(0.7);
    scene.add.rectangle(0, 0, CANVAS.w, CANVAS.h, 0x000000, 0.55).setOrigin(0);
  }
}
