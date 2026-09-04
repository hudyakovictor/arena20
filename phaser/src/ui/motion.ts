// SIGNAL ARENA — микро-анимации интерфейса (аудит AN1).
// Один модуль на все движения: отклик касания, появление панелей, счётчики,
// переходы сцен. Уважает системную настройку «уменьшить движение».

import Phaser from 'phaser';
import { DUR, EASE } from './tokens';

let reducedMotion = false;

/** Читает системную настройку и пользовательский тумблер. */
export function initMotion(userPref?: boolean): void {
  const system =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;
  reducedMotion = userPref === false ? true : system;
}

export function isReducedMotion(): boolean {
  return reducedMotion;
}

export function setReducedMotion(v: boolean): void {
  reducedMotion = v;
}

type Obj = Phaser.GameObjects.GameObject & {
  setScale?: (x: number, y?: number) => unknown;
  setAlpha?: (v: number) => unknown;
  x?: number;
  y?: number;
};

/** Отклик на касание: короткое «вдавливание». */
export function tapFeedback(scene: Phaser.Scene, target: Obj): void {
  if (reducedMotion || !('setScale' in target)) return;
  scene.tweens.killTweensOf(target);
  scene.tweens.chain({
    targets: target,
    tweens: [
      { scaleX: 0.96, scaleY: 0.96, duration: DUR.tap / 2, ease: EASE.out },
      { scaleX: 1, scaleY: 1, duration: DUR.tap / 2, ease: EASE.out },
    ],
  });
}

/** Появление панели: лёгкий подъём + проявление. */
export function enterPanel(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.Container | Phaser.GameObjects.GameObject,
  opts: { delay?: number; from?: number } = {},
): void {
  const t = target as Phaser.GameObjects.Container;
  if (reducedMotion) {
    t.setAlpha?.(1);
    return;
  }
  const dy = opts.from ?? 12;
  const baseY = t.y ?? 0;
  t.setAlpha?.(0);
  t.y = baseY + dy;
  scene.tweens.add({
    targets: t,
    y: baseY,
    alpha: 1,
    duration: DUR.panel,
    delay: opts.delay ?? 0,
    ease: EASE.out,
  });
}

/** Плавное проявление без сдвига. */
export function fadeIn(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.GameObject,
  opts: { delay?: number; duration?: number; to?: number } = {},
): void {
  const t = target as Phaser.GameObjects.Container;
  const to = opts.to ?? 1;
  if (reducedMotion) {
    t.setAlpha?.(to);
    return;
  }
  t.setAlpha?.(0);
  scene.tweens.add({
    targets: t,
    alpha: to,
    duration: opts.duration ?? DUR.panel,
    delay: opts.delay ?? 0,
    ease: EASE.out,
  });
}

/** Плавное исчезновение с колбэком. */
export function fadeOut(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.GameObject,
  onDone?: () => void,
): void {
  if (reducedMotion) {
    onDone?.();
    return;
  }
  scene.tweens.add({
    targets: target,
    alpha: 0,
    duration: DUR.panel,
    ease: EASE.out,
    onComplete: () => onDone?.(),
  });
}

/** Анимированный счётчик: число «докручивается» до нового значения. */
export function countTo(
  scene: Phaser.Scene,
  text: Phaser.GameObjects.Text,
  from: number,
  to: number,
  format: (v: number) => string,
): void {
  if (reducedMotion || from === to) {
    text.setText(format(to));
    return;
  }
  const holder = { v: from };
  scene.tweens.add({
    targets: holder,
    v: to,
    duration: DUR.counter,
    ease: EASE.out,
    onUpdate: () => text.setText(format(Math.round(holder.v))),
    onComplete: () => text.setText(format(to)),
  });
}

/** Пульс внимания — например, на нехватку запаса риска. */
export function pulse(scene: Phaser.Scene, target: Obj, tint?: number): void {
  if (reducedMotion) return;
  scene.tweens.add({
    targets: target,
    scaleX: 1.04,
    scaleY: 1.04,
    duration: DUR.tap,
    yoyo: true,
    repeat: 1,
    ease: EASE.inOut,
  });
  void tint;
}

/** Отказ: короткое горизонтальное дрожание вместо тряски всей камеры. */
export function shakeNo(scene: Phaser.Scene, target: Phaser.GameObjects.Container): void {
  if (reducedMotion) return;
  const x0 = target.x;
  scene.tweens.add({
    targets: target,
    x: x0 - 6,
    duration: 60,
    yoyo: true,
    repeat: 2,
    ease: EASE.inOut,
    onComplete: () => {
      target.x = x0;
    },
  });
}

/** Переход между сценами общим затемнением. */
export function transitionTo(scene: Phaser.Scene, key: string, data?: object): void {
  if (reducedMotion) {
    scene.scene.start(key, data);
    return;
  }
  scene.cameras.main.fadeOut(DUR.scene, 0, 0, 0);
  scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
    scene.scene.start(key, data);
  });
}

/** Проявление камеры при входе в сцену. */
export function sceneEnter(scene: Phaser.Scene): void {
  if (reducedMotion) return;
  scene.cameras.main.fadeIn(DUR.scene, 0, 0, 0);
}
