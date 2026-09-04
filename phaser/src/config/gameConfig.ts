import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { OnboardingScene } from '../scenes/OnboardingScene';
import { ArenaScene } from '../scenes/ArenaScene';
import { AcademyScene } from '../scenes/AcademyScene';
import { CollectionScene } from '../scenes/CollectionScene';
import { MoreScene } from '../scenes/MoreScene';
import { ErrorJournalScene } from '../scenes/ErrorJournalScene';
import { SettingsScene } from '../scenes/SettingsScene';
import { StoreScene } from '../scenes/StoreScene';
import { TournamentScene } from '../scenes/TournamentScene';
import { MasteryCheckScene } from '../scenes/MasteryCheckScene';
import { DailyWarmupScene } from '../scenes/DailyWarmupScene';

// Все «страницы» продукта зарегистрированы как сцены (ТЗ Часть 6 §4.1).
// Ни одна механика М1–М15 не создаёт свою сцену — только состояния Task/Feedback.
export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 390,
  height: 844,
  backgroundColor: '#070B14',
  // Phaser 4: parent и размеры дублируем внутри scale для совместимости
  scale: {
    parent: 'game',
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 390,
    height: 844,
    // чтобы canvas не был 0x0 если parent еще не отрендерился
    min: { width: 320, height: 600 },
    // zoom 1 — без дополнительного масштаба
    zoom: 1
  },
  render: {
    antialias: true,
    pixelArt: false,
    // Phaser 4: roundPixels теперь false по умолчанию, но явно укажем false для четкости текста
    antialiasGL: true,
  },
  // отключаем баннер в консоли для чистоты
  banner: false as any,
  // важно: dom нужен для возможных input, но не обязателен
  dom: { createContainer: false } as any,
  scene: [
    BootScene, OnboardingScene, ArenaScene, AcademyScene, CollectionScene,
    MoreScene, ErrorJournalScene, SettingsScene, StoreScene, TournamentScene,
    MasteryCheckScene, DailyWarmupScene
  ],
  physics: { default: 'arcade', arcade: { debug: false } }
};
