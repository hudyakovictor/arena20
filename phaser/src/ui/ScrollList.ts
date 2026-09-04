// SIGNAL ARENA — вертикальный скролл-список с маской.
// Раньше длинные списки просто обрезались условием `if (y > 740) return`:
// главы Академии ниже седьмой и трофеи было невозможно увидеть.
// Здесь список прокручивается перетаскиванием и колесом, с инерцией.

import Phaser from 'phaser';
import { CANVAS } from './tokens';
import { isReducedMotion } from './motion';

export interface ScrollListOpts {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Высота одного элемента вместе с отступом. */
  itemHeight: number;
  itemCount: number;
  /** Отрисовать элемент i в контейнер на локальной координате y. */
  renderItem: (i: number, container: Phaser.GameObjects.Container, y: number) => void;
}

export class ScrollList {
  private scene: Phaser.Scene;
  private opts: ScrollListOpts;
  private content: Phaser.GameObjects.Container;
  private maskShape: Phaser.GameObjects.Graphics;
  private zone: Phaser.GameObjects.Rectangle;
  private scrollY = 0;
  private maxScroll = 0;
  private dragging = false;
  private dragged = false;
  private dragStartY = 0;
  private scrollStart = 0;
  private velocity = 0;
  private lastPointerY = 0;
  private scrollbar: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, opts: ScrollListOpts) {
    this.scene = scene;
    this.opts = opts;

    this.content = scene.add.container(opts.x, opts.y);
    const contentH = opts.itemCount * opts.itemHeight;
    this.maxScroll = Math.max(0, contentH - opts.height);

    for (let i = 0; i < opts.itemCount; i++) {
      opts.renderItem(i, this.content, i * opts.itemHeight);
    }

    // маска — показываем только окно списка
    this.maskShape = scene.make.graphics({});
    this.maskShape.fillStyle(0xffffff);
    this.maskShape.fillRect(opts.x, opts.y, opts.width, opts.height);
    this.content.setMask(this.maskShape.createGeometryMask());

    this.scrollbar = scene.add.graphics();

    this.zone = scene.add
      .rectangle(opts.x, opts.y, opts.width, opts.height, 0x000000, 0)
      .setOrigin(0)
      .setInteractive();

    this.zone.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.dragging = true;
      this.dragged = false;
      this.dragStartY = p.y;
      this.lastPointerY = p.y;
      this.scrollStart = this.scrollY;
      this.velocity = 0;
    });
    scene.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.dragging) return;
      const dy = p.y - this.dragStartY;
      if (Math.abs(dy) > 6) this.dragged = true;
      this.velocity = p.y - this.lastPointerY;
      this.lastPointerY = p.y;
      this.setScroll(this.scrollStart - dy);
    });
    scene.input.on('pointerup', () => {
      this.dragging = false;
    });
    scene.input.on(
      'wheel',
      (_p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => {
        this.setScroll(this.scrollY + dy * 0.5);
      },
    );

    scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
    this.drawScrollbar();
  }

  /** Был ли жест перетаскиванием — чтобы не срабатывал тап по элементу. */
  didDrag(): boolean {
    return this.dragged;
  }

  private setScroll(v: number): void {
    this.scrollY = Phaser.Math.Clamp(v, 0, this.maxScroll);
    this.content.y = this.opts.y - this.scrollY;
    this.drawScrollbar();
  }

  private update(): void {
    // инерция после отпускания
    if (this.dragging || Math.abs(this.velocity) < 0.4 || isReducedMotion()) return;
    this.velocity *= 0.92;
    this.setScroll(this.scrollY - this.velocity);
  }

  private drawScrollbar(): void {
    this.scrollbar.clear();
    if (this.maxScroll <= 0) return;
    const { x, y, width, height } = this.opts;
    const trackX = x + width - 4;
    const thumbH = Math.max(24, (height / (height + this.maxScroll)) * height);
    const t = this.scrollY / this.maxScroll;
    const thumbY = y + t * (height - thumbH);
    this.scrollbar.fillStyle(0xffffff, 0.16);
    this.scrollbar.fillRoundedRect(trackX, thumbY, 3, thumbH, 2);
  }

  destroy(): void {
    this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
    this.content.destroy();
    this.maskShape.destroy();
    this.zone.destroy();
    this.scrollbar.destroy();
  }
}

export const SCROLL_VIEWPORT = CANVAS;
