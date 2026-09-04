import Phaser from 'phaser';
import { gameConfig } from './config/gameConfig';
import { resetSafeAreaCache } from './ui/layout';

const game = new Phaser.Game(gameConfig);

// Безопасные отступы кэшируются, но при повороте устройства меняются.
window.addEventListener('resize', resetSafeAreaCache);
window.addEventListener('orientationchange', resetSafeAreaCache);

export default game;
