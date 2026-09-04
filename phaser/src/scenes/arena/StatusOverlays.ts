// Полноэкранные сообщения Арены: просадка бюджета риска и смена эпохи.
// Вынесены из ArenaScene — это самостоятельные экраны, не связанные
// с логикой встречи, и держать их в сцене незачем.

import Phaser from 'phaser';
import type { EpochId } from '../../types';
import { epochs } from '../../config/epochConfig';
import { buildPalette, type Palette } from '../../ui/palette';
import { CANVAS, GUTTER, HIT, SP } from '../../ui/tokens';
import * as TX from '../../ui/text';
import { T } from '../../ui/copy';
import { button } from '../../ui/widgets';
import { Flow } from '../../ui/layout';
import { playSfx, haptic } from '../../ui/feedbackFx';

/** Затемняющая подложка, перехватывающая касания. */
function shade(
  scene: Phaser.Scene,
  pal: Palette,
  alpha: number,
): { layer: Phaser.GameObjects.Container; w: number } {
  const layer = scene.add.container(0, 0).setDepth(1200);
  layer.add(
    scene.add.rectangle(0, 0, CANVAS.w, CANVAS.h, pal.bgN, alpha).setOrigin(0).setInteractive(),
  );
  return { layer, w: CANVAS.w - GUTTER * 2 };
}

/** Центрированная строка текста. */
function line(
  scene: Phaser.Scene,
  flow: Flow,
  h: number,
  text: string,
  style: Phaser.Types.GameObjects.Text.TextStyle,
): Phaser.GameObjects.Text {
  return scene.add.text(CANVAS.w / 2, flow.take(h), text, style).setOrigin(0.5, 0);
}

/** Бюджет риска исчерпан. */
export function showDrawdown(
  scene: Phaser.Scene,
  pal: Palette,
  restore: number,
  onContinue: () => void,
): void {
  const { layer, w } = shade(scene, pal, 0.98);
  playSfx('wrong');
  haptic('heavy');

  const flow = new Flow(CANVAS.h / 2 - 160, SP.md);
  layer.add(
    line(scene, flow, 40, T.drawdown.title, {
      ...TX.display(pal, { color: pal.bad, align: 'center', wrap: w }),
    }),
  );
  layer.add(
    line(scene, flow, 28, T.drawdown.sub, {
      ...TX.body(pal, { color: pal.sub, align: 'center', wrap: w }),
    }),
  );
  layer.add(
    line(scene, flow, 80, T.drawdown.body, {
      ...TX.body(pal, { color: pal.muted, align: 'center', wrap: w }),
    }),
  );
  layer.add(
    button(
      scene,
      GUTTER,
      flow.take(HIT.comfortable),
      T.drawdown.cta(restore),
      pal,
      () => {
        layer.destroy();
        onContinue();
      },
      { width: w },
    ),
  );
}

/** Переход в новую эпоху. Текст и цвета берутся от эпохи, в которую входим. */
export function showEpochTransition(
  scene: Phaser.Scene,
  to: EpochId,
  onContinue: () => void,
): void {
  const pal = buildPalette(to);
  const def = epochs[to];
  const { layer, w } = shade(scene, pal, 0.99);
  playSfx('epoch');
  haptic('success');

  const flow = new Flow(CANVAS.h / 2 - 140, SP.md);
  layer.add(
    line(scene, flow, 24, T.epoch.changed, {
      ...TX.caption(pal, { color: pal.sub, align: 'center' }),
    }),
  );
  layer.add(
    line(scene, flow, 40, def.name, {
      ...TX.display(pal, { color: pal.accent, align: 'center' }),
    }),
  );
  layer.add(
    line(scene, flow, 60, def.motto, {
      ...TX.body(pal, { color: pal.text, align: 'center', wrap: w }),
    }),
  );
  layer.add(
    line(scene, flow, 40, T.epoch.sub, {
      ...TX.caption(pal, { color: pal.muted, align: 'center', wrap: w }),
    }),
  );
  layer.add(
    button(
      scene,
      GUTTER,
      flow.take(HIT.comfortable),
      T.epoch.cta,
      pal,
      () => {
        layer.destroy();
        onContinue();
      },
      { width: w },
    ),
  );
}
