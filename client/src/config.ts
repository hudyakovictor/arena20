// T010 · Конфигурация Phaser 4: один WebGL-canvas, portrait Scale.FIT, rexUI scene plugin.
import Phaser from 'phaser';
import RexUIPlugin from 'phaser4-rex-plugins/templates/ui/ui-plugin.js';
import { LAYOUT, UI_BG, UI_BG_HEX } from '@signal-arena/shared';
import BootScene from './game/scenes/BootScene.js';
import PreloadScene from './game/scenes/PreloadScene.js';
import { ShellScene } from './game/scenes/ShellScene.js';

export function createGameConfig(parent: string): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.WEBGL,
    parent,
    width: LAYOUT.viewWidth,
    height: LAYOUT.viewHeight,
    backgroundColor: UI_BG_HEX.app,
    banner: false,
    disableContextMenu: true,
    render: {
      antialias: true,
      pixelArt: false,
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    fps: {
      target: 60,
    },
    plugins: {
      scene: [
        {
          key: 'rexUI',
          plugin: RexUIPlugin,
          mapping: 'rexUI',
        },
      ],
    },
    scene: [BootScene, PreloadScene, ShellScene],
  };
}

export const APP_BG = UI_BG.app;
