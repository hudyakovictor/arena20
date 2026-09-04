// SIGNAL ARENA — переиспользуемые виджеты.
// Главное правило (аудит T1): всё интерактивное имеет hit-area >= 44x44,
// даже если визуально элемент ниже. Это обеспечивает tappable().

import Phaser from 'phaser';
import { FS, HIT, RADIUS, SP } from './tokens';
import type { Palette } from './palette';
import * as TX from './text';
import { tapFeedback, shakeNo } from './motion';
import { haptic, playSfx } from './feedbackFx';

/**
 * Делает объект интерактивным с гарантированной тач-зоной >= 44x44.
 * Визуальный размер передаётся в w/h; hit-area расширяется вокруг центра.
 */
export function tappable(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.GameObject,
  w: number,
  h: number,
  onTap: () => void,
  opts: { animate?: boolean; sound?: boolean } = {},
): void {
  const hitW = Math.max(w, HIT.min);
  const hitH = Math.max(h, HIT.min);
  // Локальные координаты Phaser отсчитываются от левого-верхнего угла
  // собственных границ объекта, поэтому расширяем зону вокруг них.
  const own = target as unknown as { width?: number; height?: number };
  const ownW = own.width ?? w;
  const ownH = own.height ?? h;
  const rect = new Phaser.Geom.Rectangle(
    (ownW - hitW) / 2,
    (ownH - hitH) / 2,
    hitW,
    hitH,
  );
  target.setInteractive(rect, Phaser.Geom.Rectangle.Contains);
  target.on('pointerdown', () => {
    if (opts.animate !== false) tapFeedback(scene, target as never);
    if (opts.sound !== false) {
      haptic('light');
      playSfx('tap');
    }
    onTap();
  });
}

/** Панель со скруглением и рамкой в токенах эпохи. */
export function panel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  p: Palette,
  opts: { fill?: number; stroke?: number; radius?: number; alpha?: number } = {},
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics({ x, y });
  const r = opts.radius ?? RADIUS.md;
  g.fillStyle(opts.fill ?? p.surfaceN, opts.alpha ?? 1);
  g.fillRoundedRect(0, 0, w, h, r);
  if (opts.stroke !== undefined) {
    g.lineStyle(1, opts.stroke, 1);
    g.strokeRoundedRect(0, 0, w, h, r);
  } else {
    g.lineStyle(1, p.borderN, 1);
    g.strokeRoundedRect(0, 0, w, h, r);
  }
  return g;
}

export interface ButtonOpts {
  /** Основная (залитая акцентом) или второстепенная кнопка. */
  variant?: 'primary' | 'secondary' | 'ghost';
  /** Неактивная кнопка: показывает причину и не вызывает onTap. */
  disabled?: boolean;
  /** Подпись под основным текстом (например, причина блокировки). */
  hint?: string;
  width?: number;
  height?: number;
}

/**
 * Кнопка с гарантированной высотой >= 48 и корректным контрастом текста.
 * Возвращает контейнер, чтобы вызывающий код мог его анимировать/удалять.
 */
export function button(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  p: Palette,
  onTap: () => void,
  opts: ButtonOpts = {},
): Phaser.GameObjects.Container {
  const w = opts.width ?? 200;
  const h = Math.max(opts.height ?? HIT.comfortable, HIT.min);
  const variant = opts.variant ?? 'primary';
  const disabled = !!opts.disabled;

  const c = scene.add.container(x, y);
  const g = scene.add.graphics();

  let fill: number;
  let stroke: number;
  let textColor: string;
  if (disabled) {
    fill = p.elevatedN;
    stroke = p.borderN;
    textColor = p.muted;
  } else if (variant === 'primary') {
    fill = p.accentN;
    stroke = p.accentN;
    textColor = p.accentInk;
  } else if (variant === 'secondary') {
    fill = p.surfaceN;
    stroke = p.accentN;
    textColor = p.accent;
  } else {
    fill = p.surfaceN;
    stroke = p.borderN;
    textColor = p.text;
  }

  g.fillStyle(fill, variant === 'ghost' ? 0.6 : 1);
  g.fillRoundedRect(0, 0, w, h, RADIUS.md);
  g.lineStyle(1, stroke, 1);
  g.strokeRoundedRect(0, 0, w, h, RADIUS.md);
  c.add(g);

  const hasHint = !!opts.hint;
  // Длинные русские CTA не должны вылезать из плашки на узком холсте.
  // Уменьшаем только конкретную подпись, сохраняя нижний предел 12px.
  const labelStyle = fitFontSize(
    scene,
    label,
    TX.button(p, { color: textColor }),
    w - SP.xl * 2,
    FS.caption,
  );
  const label1 = scene.add
    .text(w / 2, hasHint ? h / 2 - 8 : h / 2, label, labelStyle)
    .setOrigin(0.5);
  c.add(label1);
  if (hasHint) {
    const l2 = scene.add
      .text(w / 2, h / 2 + 10, opts.hint!, TX.caption(p, { color: disabled ? p.muted : textColor }))
      .setOrigin(0.5);
    c.add(l2);
  }

  c.setSize(w, h);
  const hitH = Math.max(h, HIT.min);
  c.setInteractive(
    new Phaser.Geom.Rectangle(0, -(hitH - h) / 2, w, hitH),
    Phaser.Geom.Rectangle.Contains,
  );
  c.on('pointerdown', () => {
    if (disabled) {
      haptic('warn');
      shakeNo(scene, c);
      return;
    }
    tapFeedback(scene, c as never);
    haptic('light');
    playSfx('tap');
    onTap();
  });
  return c;
}

/** Строка списка с чекбоксом — высота не ниже 44 (аудит T1). */
export function selectableRow(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  label: string,
  p: Palette,
  selected: boolean,
  onTap: () => void,
  opts: { badge?: string; badgeColor?: string; height?: number } = {},
): Phaser.GameObjects.Container {
  const h = Math.max(opts.height ?? HIT.min, HIT.min);
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  g.fillStyle(selected ? p.hoverN : p.surfaceN, 1);
  g.fillRoundedRect(0, 0, w, h, RADIUS.sm);
  g.lineStyle(selected ? 2 : 1, selected ? p.accentN : p.borderN, 1);
  g.strokeRoundedRect(0, 0, w, h, RADIUS.sm);
  c.add(g);

  // маркер выбора
  const box = scene.add.graphics();
  box.lineStyle(1.5, selected ? p.accentN : p.strongN, 1);
  box.strokeRoundedRect(SP.md, h / 2 - 9, 18, 18, 4);
  if (selected) {
    box.fillStyle(p.accentN, 1);
    box.fillRoundedRect(SP.md + 4, h / 2 - 5, 10, 10, 2);
  }
  c.add(box);

  const textW = w - SP.md - 18 - SP.md - (opts.badge ? 64 : SP.md);
  const t = scene.add
    .text(SP.md + 18 + SP.md, h / 2, label, {
      ...TX.body(p, { color: selected ? p.text : p.sub, wrap: textW }),
    })
    .setOrigin(0, 0.5);
  c.add(t);

  if (opts.badge) {
    const b = scene.add
      .text(w - SP.md, h / 2, opts.badge, TX.caption(p, { color: opts.badgeColor ?? p.warn }))
      .setOrigin(1, 0.5);
    c.add(b);
  }

  c.setSize(w, h);
  c.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);
  c.on('pointerdown', () => {
    tapFeedback(scene, c as never);
    haptic('light');
    playSfx('tap');
    onTap();
  });
  return c;
}

/** Полоса прогресса (опыт, запас риска). */
export function progressBar(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  ratio: number,
  color: number,
  p: Palette,
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics({ x, y });
  const r = Math.min(h / 2, RADIUS.pill);
  g.fillStyle(p.insetN, 1);
  g.fillRoundedRect(0, 0, w, h, r);
  const fillW = Math.max(0, Math.min(1, ratio)) * w;
  if (fillW > 1) {
    g.fillStyle(color, 1);
    g.fillRoundedRect(0, 0, Math.max(fillW, h), h, r);
  }
  return g;
}

/** Небольшой чип-ярлык (статус, метка источника). */
export function chip(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  p: Palette,
  opts: { color?: string; fill?: number; border?: number } = {},
): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const t = scene.add.text(0, 0, label, TX.caption(p, { color: opts.color ?? p.sub }));
  const w = t.width + SP.md * 2;
  const h = 24;
  const g = scene.add.graphics();
  g.fillStyle(opts.fill ?? p.elevatedN, 1);
  g.fillRoundedRect(0, 0, w, h, RADIUS.pill);
  if (opts.border !== undefined) {
    g.lineStyle(1, opts.border, 1);
    g.strokeRoundedRect(0, 0, w, h, RADIUS.pill);
  }
  c.add(g);
  t.setPosition(SP.md, h / 2).setOrigin(0, 0.5);
  c.add(t);
  c.setSize(w, h);
  return c;
}

/** Заголовок секции — единый вид на всех экранах. */
export function sectionLabel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  p: Palette,
  opts: { color?: string } = {},
): Phaser.GameObjects.Text {
  return scene.add.text(x, y, text, TX.caption(p, { color: opts.color ?? p.muted }));
}

/** Экранный заголовок. */
export function screenTitle(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  p: Palette,
): Phaser.GameObjects.Text {
  return scene.add.text(x, y, text, TX.title(p, { color: p.text }));
}

/** Размер шрифта под доступную ширину — чтобы длинный текст не вылезал. */
export function fitFontSize(
  scene: Phaser.Scene,
  text: string,
  style: Phaser.Types.GameObjects.Text.TextStyle,
  maxW: number,
  minSize = FS.caption,
): Phaser.Types.GameObjects.Text.TextStyle {
  const probe = scene.add.text(0, 0, text, style).setVisible(false);
  let size = parseInt(String(style.fontSize ?? FS.body), 10);
  while (probe.width > maxW && size > minSize) {
    size -= 1;
    probe.setFontSize(size);
  }
  probe.destroy();
  return { ...style, fontSize: `${size}px` };
}
