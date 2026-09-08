// Общие хелперы контент-сцен: корень в CONTENT_RECT, заголовок, инфо-карточки, строки.
import type Phaser from 'phaser';
import { FONT_SIZES, LAYOUT, SPACING } from '@signal-arena/shared';
import type { UiTone } from '@signal-arena/shared';
import { t } from '../../copy.js';
import { ellipsis, makeSection, makeText, panelBg } from '../ui/kit.js';
import { CONTENT_RECT } from './ShellScene.js';

export const INNER_W = LAYOUT.viewWidth - LAYOUT.gutter * 2;

export function baseRoot(scene: Phaser.Scene): Phaser.GameObjects.Container {
  return scene.add.container(CONTENT_RECT.x, CONTENT_RECT.y);
}

/** Заголовок раздела + подзаголовок. Возвращает y конца. */
export function baseHeader(
  scene: Phaser.Scene,
  root: Phaser.GameObjects.Container,
  titleKey: string,
  subKey: string,
): number {
  const header = makeSection(scene, t(titleKey), '');
  header.setPosition(LAYOUT.gutter, SPACING.sm);
  const sub = makeText(scene, 0, 0, t(subKey), {
    size: FONT_SIZES.caption,
    tone: 'secondary',
    wrapWidth: INNER_W,
  });
  sub.setPosition(LAYOUT.gutter, SPACING.sm + 26);
  root.add([header, sub]);
  return SPACING.sm + 26 + sub.height + SPACING.sm;
}

export interface CardLine {
  text: string;
  size?: number;
  tone?: UiTone;
  mono?: boolean;
  maxChars?: number;
}

/** Инфо-карточка с авто-высотой. Возвращает высоту. */
export function infoCard(
  scene: Phaser.Scene,
  root: Phaser.GameObjects.Container,
  x: number,
  y: number,
  w: number,
  lines: CardLine[],
  onTap?: () => void,
): number {
  const texts = lines.map((line, i) => {
    const text = makeText(scene, SPACING.md, 0, ellipsis(line.text, line.maxChars ?? 160), {
      size: line.size ?? FONT_SIZES.body,
      tone: line.tone ?? 'primary',
      mono: line.mono,
      wrapWidth: w - SPACING.md * 2,
    });
    if (i === 0) text.setY(SPACING.md);
    else {
      const prev = texts[i - 1];
      text.setY((prev?.y ?? 0) + (prev?.height ?? 0) + (i === 1 ? SPACING.xs : SPACING.sm));
    }
    return text;
  });
  const last = texts[texts.length - 1];
  const h = (last?.y ?? 0) + (last?.height ?? 0) + SPACING.md;
  const card = scene.add.container(x, y, [panelBg(scene, w, h), ...texts]);
  card.setSize(w, h);
  if (onTap) {
    const zone = scene.add.zone(0, 0, w, Math.max(h, LAYOUT.touchMin)).setOrigin(0, 0);
    zone.setInteractive({ useHandCursor: true });
    zone.on('pointerdown', onTap);
    card.add(zone);
  }
  root.add(card);
  return h;
}
