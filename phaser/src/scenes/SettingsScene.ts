// Настройки: звук, вибрация, анимации, сброс прогресса.

import Phaser from 'phaser';
import { gameState } from '../state/GameState';
import { buildPalette, type Palette } from '../ui/palette';
import { CANVAS, CHROME, GUTTER, HIT, RADIUS, SP } from '../ui/tokens';
import * as TX from '../ui/text';
import { T } from '../ui/copy';
import { button } from '../ui/widgets';
import { renderTopBar, renderBottomNav, navForEpoch, renderBackground } from '../ui/shell';
import { sceneEnter, transitionTo, setReducedMotion, isReducedMotion } from '../ui/motion';
import { getFxPrefs, setFxPref, haptic, playSfx } from '../ui/feedbackFx';
import { Flow } from '../ui/layout';

export class SettingsScene extends Phaser.Scene {
  private P!: Palette;

  constructor() {
    super({ key: 'SettingsScene' });
  }

  create(): void {
    const prog = gameState.progress;
    this.P = buildPalette(prog.epoch);
    this.registry.set('epoch', prog.epoch);
    renderBackground(this, this.P);
    sceneEnter(this);
    renderTopBar(this, gameState);

    const p = this.P;
    const w = CANVAS.w - GUTTER * 2;
    const flow = new Flow(CHROME.topBar + SP.md, SP.md);
    this.add.text(GUTTER, flow.take(40), T.settings.title, TX.title(p, { color: p.text }));

    const fx = getFxPrefs();
    const toggles: { label: string; value: boolean; onToggle: (v: boolean) => void }[] = [
      { label: T.settings.sound, value: fx.sound, onToggle: (v) => setFxPref('sound', v) },
      { label: T.settings.haptics, value: fx.haptics, onToggle: (v) => setFxPref('haptics', v) },
      {
        label: T.settings.motion,
        value: !isReducedMotion(),
        onToggle: (v) => setReducedMotion(!v),
      },
    ];

    toggles.forEach((t) => {
      const y = flow.take(64, SP.sm);
      this.renderToggle(y, w, t.label, t.value, t.onToggle);
    });

    flow.gap(SP.xl);
    const resetY = flow.take(HIT.comfortable);
    button(
      this,
      GUTTER,
      resetY,
      T.settings.reset,
      p,
      () => this.confirmReset(),
      { width: w, variant: 'secondary', hint: T.settings.resetHint },
    );

    renderBottomNav(this, 'MoreScene', navForEpoch(prog.level));
  }

  private renderToggle(
    y: number,
    w: number,
    label: string,
    initial: boolean,
    onToggle: (v: boolean) => void,
  ): void {
    const p = this.P;
    let value = initial;

    const g = this.add.graphics();
    const knob = this.add.graphics();
    const stateText = this.add
      .text(GUTTER + w - SP.lg - 56, y + 32, '', TX.caption(p))
      .setOrigin(1, 0.5);

    const draw = () => {
      g.clear();
      g.fillStyle(p.surfaceN, 1);
      g.fillRoundedRect(GUTTER, y, w, 64, RADIUS.md);
      g.lineStyle(1, p.borderN, 1);
      g.strokeRoundedRect(GUTTER, y, w, 64, RADIUS.md);

      const tx = GUTTER + w - SP.lg - 48;
      knob.clear();
      knob.fillStyle(value ? p.accentN : p.insetN, 1);
      knob.fillRoundedRect(tx, y + 20, 48, 26, 13);
      knob.lineStyle(1, value ? p.accentN : p.strongN, 1);
      knob.strokeRoundedRect(tx, y + 20, 48, 26, 13);
      knob.fillStyle(value ? p.accentInk === '#0a0b0d' ? 0x0a0b0d : 0xffffff : p.mutedN, 1);
      knob.fillCircle(value ? tx + 34 : tx + 14, y + 33, 9);

      stateText.setText(value ? T.settings.on : T.settings.off);
      stateText.setColor(value ? p.accent : p.muted);
    };

    this.add.text(GUTTER + SP.lg, y + 22, label, TX.body(p, { color: p.text }));
    draw();

    const zone = this.add
      .rectangle(GUTTER, y, w, Math.max(64, HIT.min), 0x000000, 0)
      .setOrigin(0)
      .setInteractive();
    zone.on('pointerdown', () => {
      value = !value;
      onToggle(value);
      draw();
      haptic('light');
      if (value) playSfx('tap');
    });
  }

  private confirmReset(): void {
    const p = this.P;
    const layer = this.add.container(0, 0).setDepth(900);
    const shade = this.add
      .rectangle(0, 0, CANVAS.w, CANVAS.h, p.bgN, 0.96)
      .setOrigin(0)
      .setInteractive();
    layer.add(shade);

    const w = CANVAS.w - GUTTER * 2;
    layer.add(
      this.add
        .text(CANVAS.w / 2, CANVAS.h / 2 - 80, T.settings.reset, {
          ...TX.title(p, { color: p.text, align: 'center', wrap: w }),
        })
        .setOrigin(0.5, 0),
    );
    layer.add(
      this.add
        .text(CANVAS.w / 2, CANVAS.h / 2 - 40, T.settings.resetHint, {
          ...TX.body(p, { color: p.sub, align: 'center', wrap: w }),
        })
        .setOrigin(0.5, 0),
    );
    layer.add(
      button(
        this,
        GUTTER,
        CANVAS.h / 2 + 10,
        T.settings.reset,
        p,
        () => {
          gameState.resetAll();
          transitionTo(this, 'OnboardingScene');
        },
        { width: w },
      ),
    );
    layer.add(
      button(
        this,
        GUTTER,
        CANVAS.h / 2 + 10 + HIT.comfortable + SP.sm,
        T.common.close,
        p,
        () => layer.destroy(),
        { width: w, variant: 'ghost' },
      ),
    );
  }
}
