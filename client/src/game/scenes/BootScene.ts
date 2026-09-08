// T011 · Boot: мгновенная инициализация, затем Preload.
import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  create(): void {
    this.scene.start('Preload');
  }
}
