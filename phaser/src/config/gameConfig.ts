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
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [
    BootScene, OnboardingScene, ArenaScene, AcademyScene, CollectionScene,
    MoreScene, ErrorJournalScene, SettingsScene, StoreScene, TournamentScene,
    MasteryCheckScene, DailyWarmupScene
  ],
  physics: { default: 'arcade', arcade: { debug: false } }
};
