// Иконки: SVG-исходники (currentColor) → build-icons.mjs → белые рантайм-копии → tint.
// Загрузка через Phaser SVG loader; tint по семантическому тону (ui-graphics.md §3).
import type Phaser from 'phaser';
import { UI_TINT } from '@signal-arena/shared';
import type { UiTone } from '@signal-arena/shared';

/** Core-набор первого маршрута (placeholder-арт, см. assets/icons/MANIFEST.md). */
export const CORE_ICONS = [
  'i-home',
  'i-learn',
  'i-arena',
  'i-bestiary',
  'i-more',
  'i-back',
  'i-close',
  'i-settings',
  'i-help',
  'i-xp',
  'i-risk',
  'i-decision',
  'i-check',
  'i-lock',
  'i-journal',
  'i-tournament',
  'i-market',
  'i-profile',
  'i-card',
  'i-entity',
  'i-protocol',
  'i-reveal',
  'i-warning',
  'i-info',
  'i-error',
  'i-offline',
  'i-empty',
  'i-no-trade',
  'i-evidence',
  'i-sound',
  'i-timer',
] as const;

export type CoreIconId = (typeof CORE_ICONS)[number];

export function iconKey(id: string): string {
  return `icon/${id}`;
}

/** Поставить иконки в очередь загрузки (вызывать в PreloadScene). */
export function queueIcons(load: Phaser.Loader.LoaderPlugin): void {
  for (const id of CORE_ICONS) {
    load.svg(iconKey(id), `assets/icons/${id}.svg`, { width: 48, height: 48 });
  }
}

/** Картинка-иконка с тинтом. При отсутствии текстуры — векторный фолбэк. */
export function iconImage(
  scene: Phaser.Scene,
  id: string,
  size: number,
  tone: UiTone = 'primary',
): Phaser.GameObjects.GameObject {
  const key = iconKey(id);
  if (scene.textures.exists(key)) {
    const img = scene.add.image(0, 0, key);
    img.setDisplaySize(size, size);
    img.setTint(UI_TINT[tone]);
    return img;
  }
  // Фолбэк: никогда не ломаем layout из-за отсутствующего арта.
  const g = scene.add.graphics();
  g.lineStyle(2, UI_TINT[tone], 1);
  g.strokeCircle(size / 2, size / 2, size / 2 - 2);
  g.fillStyle(UI_TINT[tone], 1);
  g.fillCircle(size / 2, size / 2, 2);
  const c = scene.add.container(0, 0, [g]);
  c.setSize(size, size);
  return c;
}
