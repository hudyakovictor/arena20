// Минимальные типы поверхности phaser4-rex-plugins, используемой kit.ts (T014).
// Полные типы пакет не поставляет; расширять по мере роста kit.
declare module 'phaser4-rex-plugins/templates/ui/ui-plugin.js' {
  import type Phaser from 'phaser';

  export interface RexUISpace {
    left?: number | undefined;
    right?: number | undefined;
    top?: number | undefined;
    bottom?: number | undefined;
    item?: number | undefined;
  }

  export interface RexUISizerConfig {
    x?: number | undefined;
    y?: number | undefined;
    width?: number | undefined;
    height?: number | undefined;
    orientation?: 'x' | 'y' | 'h' | 'v' | 'horizontal' | 'vertical' | undefined;
    space?: RexUISpace | undefined;
    align?: string | undefined;
  }

  export interface RexUIAddOptions {
    proportion?: number | undefined;
    align?: string | undefined;
    padding?: RexUISpace | number | undefined;
    expand?: boolean | { width?: boolean; height?: boolean } | undefined;
    key?: string | undefined;
  }

  export interface RexUISizer extends Phaser.GameObjects.Container {
    setOrigin(x?: number, y?: number): this;
    add(
      child: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[],
      options?: number | RexUIAddOptions,
    ): this;
    addBackground(child: Phaser.GameObjects.GameObject): this;
    layout(): this;
    getElement(key: string): Phaser.GameObjects.GameObject | null;
    setMinSize(width: number, height: number): this;
  }

  export interface RexUILabelConfig extends RexUISizerConfig {
    background?: Phaser.GameObjects.GameObject | undefined;
    icon?: Phaser.GameObjects.GameObject | undefined;
    text?: Phaser.GameObjects.GameObject | undefined;
    action?: Phaser.GameObjects.GameObject | undefined;
    space?: (RexUISpace & { icon?: number | undefined }) | undefined;
  }

  export interface RexUILabel extends RexUISizer {
    setText(text: string): this;
  }

  export interface RexUIButtonsConfig extends RexUISizerConfig {
    buttons: Phaser.GameObjects.GameObject[];
    click?: { mode?: string | undefined; clickInterval?: number | undefined } | undefined;
  }

  export interface RexUIButtons extends RexUISizer {
    on(event: 'button.click', fn: (button: RexUILabel, index: number) => void): this;
    getButton(index: number): RexUILabel;
    setButtonEnable(index: number, enabled: boolean): this;
    emitButtonClick(index: number): this;
  }

  export interface RexUIRoundRectangle extends Phaser.GameObjects.Shape {
    setFillStyle(color: number, alpha?: number): this;
    setStrokeStyle(lineWidth: number, color: number, alpha?: number): this;
    setRadius(radius: number | { tl?: number; tr?: number; bl?: number; br?: number }): this;
  }

  export interface RexUIFactory {
    sizer(config?: RexUISizerConfig): RexUISizer;
    label(config?: RexUILabelConfig): RexUILabel;
    buttons(config?: RexUIButtonsConfig): RexUIButtons;
    roundRectangle(
      x?: number,
      y?: number,
      width?: number,
      height?: number,
      radius?: number,
      color?: number,
      alpha?: number,
    ): RexUIRoundRectangle;
  }

  export default class RexUIPlugin extends Phaser.Plugins.ScenePlugin {
    add: RexUIFactory;
  }
}
