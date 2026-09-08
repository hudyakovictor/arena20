// T010/T011 · Preload: иконки + звук + прогресс (прототип 1.1: лого, версия датасета, дисклеймер).
import Phaser from 'phaser';
import { CONTENT_VERSION, DATASET_VERSION, FONT_SIZES, LAYOUT, UI_BG } from '@signal-arena/shared';
import { t } from '../../copy.js';
import { makeProgressBar, makeText, panelBg } from '../ui/kit.js';
import { queueIcons } from '../ui/icons.js';
import { SOUND_FILES } from '../../sound.js';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Preload' });
  }

  preload(): void {
    const cx = LAYOUT.viewWidth / 2;
    const logo = this.add.container(cx - 120, 220, [panelBg(this, 240, 120, UI_BG.panel, 14)]);
    const logoText = makeText(this, 0, 44, 'SIGNAL ARENA', {
      mono: true,
      size: FONT_SIZES.title,
      tone: 'active',
      align: 'center',
    });
    logoText.setOrigin(0.5, 0);
    logoText.setX(120);
    logo.add(logoText);
    const tagline = makeText(this, 0, 380, t('app.tagline'), {
      mono: true,
      size: FONT_SIZES.label,
      tone: 'muted',
      align: 'center',
    });
    tagline.setOrigin(0.5, 0);
    tagline.setX(cx);

    const bar = makeProgressBar(this, 300, 8, 'active');
    bar.container.setPosition(cx - 150, 470);
    const status = makeText(this, 0, 490, t('app.loading'), {
      size: FONT_SIZES.caption,
      tone: 'secondary',
      align: 'center',
    });
    status.setOrigin(0.5, 0);
    status.setX(cx);
    const version = makeText(this, 0, 512, `content v${CONTENT_VERSION} · ${DATASET_VERSION}`, {
      mono: true,
      size: FONT_SIZES.label,
      tone: 'muted',
      align: 'center',
    });
    version.setOrigin(0.5, 0);
    version.setX(cx);

    this.load.on('progress', (p: number) => bar.setRatio(p));
    const disclaimer = makeText(this, 0, 740, t('app.disclaimer'), {
      size: FONT_SIZES.caption,
      tone: 'muted',
      align: 'center',
      wrapWidth: 330,
    });
    disclaimer.setOrigin(0.5, 0);
    disclaimer.setX(cx);

    queueIcons(this.load);
    for (const [key, file] of Object.entries(SOUND_FILES)) {
      this.load.audio(key, [file]);
    }
  }

  create(): void {
    this.scene.start('Shell');
  }
}
