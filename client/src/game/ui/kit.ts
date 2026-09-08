// T014 · UI-кит на rexUI-примитивах (sizer/label/buttons/roundRectangle) + Phaser Text/Graphics.
// Все компоненты: токены из shared, touch ≥44, смысл дублируется текстом (не только цветом).
import Phaser from 'phaser';
import type RexUIPlugin from 'phaser4-rex-plugins/templates/ui/ui-plugin.js';
import type {
  RexUIButtons,
  RexUILabel,
  RexUIRoundRectangle,
  RexUISizer,
  RexUISpace,
} from 'phaser4-rex-plugins/templates/ui/ui-plugin.js';
import {
  FONTS,
  FONT_SIZES,
  INK_ON_ACTIVE,
  LAYOUT,
  PURE,
  SPACING,
  UI_BG,
  UI_HEX,
  UI_TINT,
} from '@signal-arena/shared';
import type { UiTone } from '@signal-arena/shared';
import { selectSettings } from '../../store.js';

/** Доступ к rexUI scene plugin (зарегистрирован в config.ts). */
export function rex(scene: Phaser.Scene): RexUIPlugin {
  const plugin = (scene as unknown as Record<string, unknown>)['rexUI'];
  if (!plugin || typeof plugin !== 'object' || !('add' in plugin)) {
    throw new Error('kit: rexUI scene plugin не зарегистрирован');
  }
  return plugin as RexUIPlugin;
}

export interface TextOpts {
  size?: number | undefined;
  tone?: UiTone | undefined;
  mono?: boolean | undefined;
  bold?: boolean | undefined;
  align?: 'left' | 'center' | 'right' | undefined;
  wrapWidth?: number | undefined;
}

export function makeText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  opts: TextOpts = {},
): Phaser.GameObjects.Text {
  const t = scene.add.text(x, y, text, {
    fontFamily: opts.mono ? FONTS.mono : FONTS.ui,
    fontSize: `${opts.size ?? FONT_SIZES.body}px`,
    color: UI_HEX[opts.tone ?? 'primary'],
    align: opts.align ?? 'left',
    fontStyle: opts.bold ? '700' : '400',
    ...(opts.wrapWidth ? { wordWrap: { width: opts.wrapWidth } } : {}),
  });
  t.setLineSpacing(2);
  return t;
}

export function panelBg(
  scene: Phaser.Scene,
  w: number,
  h: number,
  fill: number = UI_BG.surface,
  radius: number = LAYOUT.radiusMd,
): RexUIRoundRectangle {
  // Top-left origin: фон кладётся в ручной контейнер точкой (x, y) без сдвига.
  const bg = rex(scene).add.roundRectangle(0, 0, w, h, radius, fill);
  bg.setOrigin(0, 0);
  bg.setStrokeStyle(1, UI_TINT.secondary, 0.22);
  return bg;
}

export interface LabelOpts {
  text: string;
  icon?: Phaser.GameObjects.GameObject | undefined;
  width?: number | undefined;
  size?: number | undefined;
  tone?: UiTone | undefined;
  mono?: boolean | undefined;
  bgFill?: number | undefined;
  bgAlpha?: number | undefined;
  pad?: Partial<RexUISpace> | undefined;
  align?: 'left' | 'center' | undefined;
}

/** rexUI label: фон + иконка + текст. */
export function makeLabel(scene: Phaser.Scene, opts: LabelOpts): RexUILabel {
  const padL = opts.pad?.left ?? SPACING.md;
  const padR = opts.pad?.right ?? SPACING.md;
  const text = makeText(scene, 0, 0, opts.text, {
    size: opts.size ?? FONT_SIZES.body,
    tone: opts.tone ?? 'primary',
    mono: opts.mono,
    ...(opts.width ? { wrapWidth: opts.width - padL - padR } : {}),
  });
  if (opts.align === 'center') text.setOrigin(0.5, 0.5);
  const bg = rex(scene).add.roundRectangle(
    0,
    0,
    2,
    2,
    LAYOUT.radiusSm,
    opts.bgFill ?? UI_BG.surface2,
    opts.bgAlpha ?? 1,
  );
  const space: RexUISpace = {
    left: padL,
    right: padR,
    top: opts.pad?.top ?? SPACING.sm,
    bottom: opts.pad?.bottom ?? SPACING.sm,
  };
  const label = rex(scene).add.label({
    width: opts.width,
    background: bg,
    icon: opts.icon,
    text,
    space,
  });
  // Top-left origin: setPosition(x, y) ставит левый верхний угол (как panelBg).
  label.setOrigin(0, 0);
  label.layout();
  return label;
}

/** Делает компонент нажимаемым с явной hit-зоной (не зависит от layout-багов). */
export function tappable<T extends RexUISizer>(
  item: T,
  onTap: () => void,
  opts: { cursor?: boolean } = {},
): T {
  const w = Math.max(item.width, LAYOUT.touchMin);
  const h = Math.max(item.height, LAYOUT.touchMin);
  const hitArea = new Phaser.Geom.Rectangle(0, 0, w, h);
  item.setInteractive(hitArea, (area, x, y) => {
    const rect = area as Phaser.Geom.Rectangle;
    return Phaser.Geom.Rectangle.Contains(rect, x, y);
  });
  if (opts.cursor !== false && item.input) item.input.cursor = 'pointer';
  item.on('pointerdown', () => onTap());
  return item;
}

export interface ButtonsOpts {
  orientation?: 'x' | 'y';
  labels: LabelOpts[];
  spaceItem?: number;
  onClick: (index: number) => void;
}

/** rexUI buttons: ряд/колонка labels с событием button.click. */
export function makeButtons(scene: Phaser.Scene, opts: ButtonsOpts): RexUIButtons {
  const children = opts.labels.map((l) => makeLabel(scene, l));
  const buttons = rex(scene).add.buttons({
    orientation: opts.orientation ?? 'x',
    buttons: children,
    space: { item: opts.spaceItem ?? SPACING.sm },
  });
  buttons.on('button.click', (_btn, index) => opts.onClick(index));
  buttons.setOrigin(0, 0);
  buttons.layout();
  return buttons;
}

/** Перекрасить кнопку (фон + текст) — активное/неактивное состояние. */
export function paintButton(
  buttons: RexUIButtons,
  index: number,
  active: boolean,
  activeTone: UiTone = 'active',
): void {
  const btn = buttons.getButton(index);
  const bg = btn.getElement('background') as RexUIRoundRectangle | null;
  const text = btn.getElement('text') as Phaser.GameObjects.Text | null;
  if (bg) {
    if (active) {
      bg.setFillStyle(UI_TINT[activeTone], 1);
      bg.setStrokeStyle(1, UI_TINT[activeTone], 1);
    } else {
      bg.setFillStyle(UI_BG.surface2, 1);
      bg.setStrokeStyle(1, UI_TINT.secondary, 0.22);
    }
  }
  if (text) text.setColor(active ? INK_ON_ACTIVE : UI_HEX.primary);
}

export interface TabsResult {
  buttons: RexUIButtons;
  setTab: (index: number) => void;
  selected: () => number;
}

/** Вкладки: rexUI buttons + программное выбранное состояние. */
export function makeTabs(
  scene: Phaser.Scene,
  labels: string[],
  onChange: (index: number) => void,
  initial = 0,
): TabsResult {
  let selected = initial;
  const buttons = makeButtons(scene, {
    orientation: 'x',
    labels: labels.map((text) => ({
      text,
      size: FONT_SIZES.caption,
      mono: true,
      pad: { left: SPACING.sm, right: SPACING.sm, top: 10, bottom: 10 },
    })),
    spaceItem: SPACING.xs,
    onClick: (index) => {
      if (index === selected) return;
      paintButton(buttons, selected, false);
      selected = index;
      paintButton(buttons, selected, true);
      onChange(index);
    },
  });
  labels.forEach((_, i) => paintButton(buttons, i, i === selected));
  return {
    buttons,
    selected: () => selected,
    setTab: (index) => {
      if (index === selected) return;
      paintButton(buttons, selected, false);
      selected = index;
      paintButton(buttons, selected, true);
      onChange(index);
    },
  };
}

export interface ProgressBar {
  container: Phaser.GameObjects.Container;
  setRatio: (ratio: number) => void;
}

/** Прогресс-бар: фон + заливка-пилюля. Начало координат — левый край по центру высоты. */
export function makeProgressBar(
  scene: Phaser.Scene,
  w: number,
  h: number,
  tone: UiTone = 'active',
): ProgressBar {
  const container = scene.add.container(0, 0);
  const g = scene.add.graphics();
  container.add(g);
  const setRatio = (ratio: number): void => {
    const clamped = Math.max(0, Math.min(1, ratio));
    g.clear();
    g.fillStyle(UI_BG.surface3, 1);
    g.fillRoundedRect(0, -h / 2, w, h, h / 2);
    if (clamped > 0) {
      // Пилюля вместо маски: круглые оба конца, читается на любом ratio.
      const fw = Math.max(0.5, w * clamped);
      g.fillStyle(UI_TINT[tone], 1);
      g.fillRoundedRect(0, -h / 2, fw, h, Math.min(h / 2, fw / 2));
    }
  };
  setRatio(0);
  container.setSize(w, h);
  return { container, setRatio };
}

/** Секция-заголовок: label + линия + опциональный правый label. */
export function makeSection(
  scene: Phaser.Scene,
  title: string,
  right?: string,
): Phaser.GameObjects.Container {
  const c = scene.add.container(0, 0);
  const left = makeText(scene, 0, 0, title, { mono: true, size: FONT_SIZES.label, tone: 'muted' });
  c.add(left);
  if (right) {
    const r = makeText(scene, 0, 0, right, { mono: true, size: FONT_SIZES.label, tone: 'muted' });
    r.setOrigin(1, 0);
    r.setX(LAYOUT.viewWidth - LAYOUT.gutter * 2);
    c.add(r);
  }
  const line = scene.add.graphics();
  line.fillStyle(UI_TINT.secondary, 0.25);
  const y = 16;
  const rightW = right ? 120 : 0;
  line.fillRect(
    left.width + 8,
    y,
    LAYOUT.viewWidth - LAYOUT.gutter * 2 - left.width - 8 - rightW,
    1,
  );
  c.add(line);
  c.setSize(LAYOUT.viewWidth - LAYOUT.gutter * 2, 22);
  return c;
}

/** Чип: короткий статус с точкой-индикатором (форма + текст, не только цвет). */
export function makeChip(
  scene: Phaser.Scene,
  text: string,
  tone: UiTone = 'secondary',
): Phaser.GameObjects.Container {
  const c = scene.add.container(0, 0);
  const dot = scene.add.graphics();
  dot.fillStyle(UI_TINT[tone], 1);
  dot.fillCircle(6, 11, 4);
  const label = makeText(scene, 15, 0, text, { mono: true, size: FONT_SIZES.caption, tone });
  label.setY(Math.max(0, 11 - label.height / 2));
  const bg = rex(scene).add.roundRectangle(0, 0, label.width + 24, 22, 11, UI_BG.surface2);
  bg.setOrigin(0, 0.5);
  bg.setPosition(0, 11);
  c.add([bg, dot, label]);
  c.setSize(label.width + 24, 22);
  return c;
}

/** Нижняя шторка: дим + панель. Возвращает show/hide. */
export function makeSheet(
  scene: Phaser.Scene,
  height: number,
  build: (panel: Phaser.GameObjects.Container, innerWidth: number) => number,
): { root: Phaser.GameObjects.Container; show: () => void; hide: () => void } {
  const reduceMotion = selectSettings().reduceMotion;
  const dim = scene.add.rectangle(
    LAYOUT.viewWidth / 2,
    LAYOUT.viewHeight / 2,
    LAYOUT.viewWidth,
    LAYOUT.viewHeight,
    PURE.black,
    0.6,
  );
  dim.setInteractive();
  const panelW = LAYOUT.viewWidth - SPACING.lg * 2;
  const bg = rex(scene)
    .add.roundRectangle(0, 0, panelW, height, LAYOUT.radiusLg, UI_BG.panel)
    .setStrokeStyle(1, UI_TINT.secondary, 0.3);
  const panel = scene.add.container(LAYOUT.viewWidth / 2, LAYOUT.viewHeight - height / 2 - 90, [
    bg,
  ]);
  const usedH = build(panel, panelW - SPACING.lg * 2);
  void usedH;
  const root = scene.add.container(0, 0, [dim, panel]);
  root.setVisible(false);
  root.setAlpha(0);
  dim.on('pointerdown', () => hide());
  function show(): void {
    root.setVisible(true);
    if (reduceMotion) {
      root.setAlpha(1);
      return;
    }
    scene.tweens.add({ targets: root, alpha: 1, duration: 180 });
    panel.y += 24;
    scene.tweens.add({ targets: panel, y: panel.y - 24, duration: 220, ease: 'Cubic.Out' });
  }
  function hide(): void {
    if (reduceMotion) {
      root.setVisible(false);
      return;
    }
    scene.tweens.add({
      targets: root,
      alpha: 0,
      duration: 160,
      onComplete: () => root.setVisible(false),
    });
  }
  return { root, show, hide };
}

/** Тост: короткое подтверждение действия. */
export function toast(scene: Phaser.Scene, text: string): void {
  const label = makeLabel(scene, {
    text,
    width: LAYOUT.viewWidth - LAYOUT.gutter * 2,
    size: FONT_SIZES.caption,
    mono: true,
    tone: 'primary',
    align: 'center',
  });
  label.setPosition(LAYOUT.gutter, LAYOUT.viewHeight - 170);
  scene.tweens.add({
    targets: label,
    alpha: 0,
    delay: 1400,
    duration: 400,
    onComplete: () => label.destroy(),
  });
}

/** Кнопка CTA (по умолчанию во всю ширину контента). */
export function makeCta(
  scene: Phaser.Scene,
  text: string,
  onTap: () => void,
  tone: UiTone = 'active',
  width: number = LAYOUT.viewWidth - LAYOUT.gutter * 2,
): RexUILabel {
  const label = makeLabel(scene, {
    text,
    width,
    size: FONT_SIZES.body,
    mono: true,
    align: 'center',
    pad: { top: 14, bottom: 14 },
  });
  const bg = label.getElement('background') as RexUIRoundRectangle | null;
  if (bg) {
    bg.setFillStyle(UI_TINT[tone], 1);
    bg.setStrokeStyle(1, UI_TINT[tone], 1);
  }
  const tx = label.getElement('text') as Phaser.GameObjects.Text | null;
  if (tx) tx.setColor(INK_ON_ACTIVE);
  label.setOrigin(0, 0);
  return tappable(label, onTap);
}

interface TransformLike {
  x: number;
  y: number;
  width?: number;
  height?: number;
  originX?: number;
  originY?: number;
  parentContainer?: TransformLike | null;
}

function anchorCenter(obj: Phaser.GameObjects.GameObject): { x: number; y: number } {
  // Точный путь: мировые границы объекта (камера статична — мир равен канвасу).
  const withBounds = obj as unknown as {
    getBounds?: (out?: { x: number; y: number; width: number; height: number }) => {
      centerX: number;
      centerY: number;
    };
  };
  if (typeof withBounds.getBounds === 'function') {
    try {
      const bounds = withBounds.getBounds();
      if (Number.isFinite(bounds.centerX) && Number.isFinite(bounds.centerY)) {
        return { x: bounds.centerX, y: bounds.centerY };
      }
    } catch {
      // ниже — ручной фолбэк
    }
  }
  const node = obj as unknown as TransformLike;
  let x = node.x;
  let y = node.y;
  let parent = node.parentContainer;
  while (parent) {
    x += parent.x;
    y += parent.y;
    parent = parent.parentContainer;
  }
  const w = node.width ?? 0;
  const h = node.height ?? 0;
  const ox = node.originX ?? 0;
  const oy = node.originY ?? 0;
  return { x: x + (0.5 - ox) * w, y: y + (0.5 - oy) * h };
}

/**
 * E2E-контракт: запоминает логические координаты контрола для Playwright.
 * Невидим, игру не меняет; при любой ошибке молча пропускается.
 */
export function anchor(id: string, obj: Phaser.GameObjects.GameObject): void {
  try {
    const w = window as unknown as { __arenaAnchors?: Record<string, { x: number; y: number }> };
    if (!w.__arenaAnchors) w.__arenaAnchors = {};
    w.__arenaAnchors[id] = anchorCenter(obj);
  } catch {
    // e2e-якоря никогда не ломают игру
  }
}

/** Сброс e2e-якорей (сцена вызывает при каждом перерендере). */
export function clearAnchors(): void {
  try {
    (window as unknown as { __arenaAnchors?: unknown }).__arenaAnchors = {};
  } catch {
    // noop
  }
}

/** Обрезка строки с многоточием (для компактных карточек). */
export function ellipsis(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

export interface KvCell {
  label: string;
  value: string;
  valueTone?: UiTone | undefined;
  maxChars?: number | undefined;
}

/**
 * Сетка «метка → значение» (прототип 4.2: ФАЗА/ТАЙМФРЕЙМ/ПРАВИЛО/СЛОЖНОСТЬ;
 * 4.6: мета карты). Возвращает контейнер с выставленным размером.
 */
export function makeKvGrid(
  scene: Phaser.Scene,
  cells: KvCell[],
  opts: { width?: number; cols?: number; cellH?: number } = {},
): Phaser.GameObjects.Container {
  const width = opts.width ?? LAYOUT.viewWidth - LAYOUT.gutter * 2;
  const cols = opts.cols ?? 2;
  const cellH = opts.cellH ?? 52;
  const gap = SPACING.sm;
  const cellW = (width - gap * (cols - 1)) / cols;
  const root = scene.add.container(0, 0);
  cells.forEach((cell, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = col * (cellW + gap);
    const y = row * (cellH + gap);
    const bg = panelBg(scene, cellW, cellH, UI_BG.surface2, LAYOUT.radiusSm);
    bg.setPosition(x, y);
    bg.setOrigin(0, 0);
    const label = makeText(scene, x + SPACING.sm, y + 7, cell.label, {
      mono: true,
      size: FONT_SIZES.label,
      tone: 'muted',
    });
    const value = makeText(
      scene,
      x + SPACING.sm,
      y + 23,
      ellipsis(cell.value, cell.maxChars ?? 22),
      {
        size: FONT_SIZES.body,
        tone: cell.valueTone ?? 'primary',
      },
    );
    root.add([bg, label, value]);
  });
  const rows = Math.max(1, Math.ceil(cells.length / cols));
  root.setSize(width, rows * cellH + (rows - 1) * gap);
  return root;
}

export interface Pager {
  container: Phaser.GameObjects.Container;
  setStep: (index: number) => void;
}

/**
 * Пейджер точек для многошаговых экранов (прототип 4.11–4.13).
 * Точки — индикаторы; управление — крупной CTA-кнопкой (touch ≥44).
 */
export function makePager(scene: Phaser.Scene, steps: number, initial = 0): Pager {
  const root = scene.add.container(0, 0);
  const dots: Phaser.GameObjects.Graphics[] = [];
  for (let i = 0; i < steps; i += 1) {
    const g = scene.add.graphics();
    root.add(g);
    dots.push(g);
  }
  const paint = (active: number): void => {
    let x = 0;
    dots.forEach((g, i) => {
      g.clear();
      g.setPosition(x, 0);
      const on = i === active;
      g.fillStyle(on ? UI_TINT.active : UI_TINT.muted, on ? 1 : 0.5);
      if (on) {
        g.fillRoundedRect(0, 2, 26, 6, 3);
        x += 34;
      } else {
        g.fillCircle(4, 5, 3);
        x += 16;
      }
    });
    root.setSize(Math.max(0, x - 8), 10);
  };
  paint(initial);
  return { container: root, setStep: paint };
}

/** Вертикальный стек: раскладывает детей с шагом. Возвращает высоту. */
export function stack(
  container: Phaser.GameObjects.Container,
  children: Phaser.GameObjects.GameObject[],
  gap = SPACING.sm,
): number {
  let y = 0;
  for (const child of children) {
    const c = child as unknown as { x: number; y: number; height: number };
    c.x = 0;
    c.y = y;
    container.add(child);
    y += (c.height || 0) + gap;
  }
  return y - gap;
}
