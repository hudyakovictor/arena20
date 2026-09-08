// T018-минимум · Системные состояния: loading/offline/empty/error + saved.
// Формула: функциональный заголовок + атмосферная реплика (ui-graphics.md §12).
import type Phaser from 'phaser';
import { FONT_SIZES, LAYOUT, SPACING, UI_TINT } from '@signal-arena/shared';
import type { UiTone } from '@signal-arena/shared';
import { t } from '../../copy.js';
import { selectSettings } from '../../store.js';
import { makeCta, makeText } from './kit.js';
import { iconImage } from './icons.js';

export type SystemState = 'loading' | 'offline' | 'empty' | 'error' | 'saved' | 'locked';

const STATE_META: Record<
  SystemState,
  { icon: string; titleKey: string; subKey: string; tone: UiTone }
> = {
  loading: {
    icon: 'i-timer',
    titleKey: 'states.loading',
    subKey: 'states.loadingSub',
    tone: 'data',
  },
  offline: {
    icon: 'i-offline',
    titleKey: 'states.offline',
    subKey: 'states.offlineSub',
    tone: 'warning',
  },
  empty: { icon: 'i-empty', titleKey: 'states.empty', subKey: 'states.emptySub', tone: 'muted' },
  error: { icon: 'i-error', titleKey: 'states.error', subKey: 'states.errorSub', tone: 'danger' },
  saved: { icon: 'i-check', titleKey: 'states.saved', subKey: 'states.savedSub', tone: 'success' },
  locked: { icon: 'i-lock', titleKey: 'states.locked', subKey: 'states.lockedSub', tone: 'muted' },
};

export interface StateOpts {
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}

/** Центрированная панель состояния шириной контента. */
export function makeSystemState(
  scene: Phaser.Scene,
  state: SystemState,
  opts: StateOpts = {},
): Phaser.GameObjects.Container {
  const meta = STATE_META[state];
  const w = LAYOUT.viewWidth - LAYOUT.gutter * 2;
  const root = scene.add.container(LAYOUT.gutter, 0);
  const icon = iconImage(scene, meta.icon, opts.compact ? 32 : 48, meta.tone);
  const iconC = icon as unknown as { x: number; y: number };
  iconC.x = w / 2;
  iconC.y = 30;
  const title = makeText(scene, 0, 62, t(meta.titleKey), {
    mono: true,
    size: FONT_SIZES.title,
    tone: 'primary',
    align: 'center',
  });
  title.setOrigin(0.5, 0);
  title.setX(w / 2);
  title.setWordWrapWidth(w);
  const sub = makeText(scene, 0, 62 + title.height + SPACING.sm, t(meta.subKey), {
    size: FONT_SIZES.body,
    tone: 'secondary',
    align: 'center',
  });
  sub.setOrigin(0.5, 0);
  sub.setX(w / 2);
  sub.setWordWrapWidth(w);
  root.add([icon, title, sub]);
  let h = 62 + title.height + SPACING.sm + sub.height;

  if (state === 'loading' && !selectSettings().reduceMotion) {
    const ring = scene.add.graphics();
    ring.lineStyle(3, UI_TINT[meta.tone], 0.9);
    ring.beginPath();
    ring.arc(w / 2, 30, 30, 0, Math.PI * 1.4);
    ring.strokePath();
    root.add(ring);
    scene.tweens.add({ targets: ring, angle: 360, duration: 1100, repeat: -1 });
  }

  if (opts.actionLabel && opts.onAction) {
    const cta = makeCta(
      scene,
      opts.actionLabel,
      opts.onAction,
      meta.tone === 'muted' ? 'active' : meta.tone,
    );
    (cta as unknown as { x: number; y: number }).x = 0;
    (cta as unknown as { y: number }).y = h + SPACING.md;
    root.add(cta);
    h += SPACING.md + 52;
  }
  root.setSize(w, h);
  return root;
}
