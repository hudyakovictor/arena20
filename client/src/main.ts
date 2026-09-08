// Точка входа: ждём шрифты (с таймаутом), создаём Phaser.Game, чистим fallback.
// T002: 2 семейства woff2, subset latin+cyrillic (каждый файл ≤45KB).
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/cyrillic-400.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/inter/cyrillic-700.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/cyrillic-400.css';
import Phaser from 'phaser';
import { createGameConfig } from './config.js';
import { useArenaStore } from './store.js';

async function waitForFonts(): Promise<void> {
  try {
    await Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 1200))]);
  } catch {
    // системные шрифты — допустимый fallback
  }
}

async function boot(): Promise<void> {
  await waitForFonts();
  const fallback = document.getElementById('boot-fallback');
  if (fallback) fallback.remove();
  const game = new Phaser.Game(createGameConfig('game'));

  // Debug-хук для Playwright e2e и ручной диагностики (только состояние, не читы).
  (window as unknown as { __arena?: unknown }).__arena = {
    game,
    getState: () => {
      const s = useArenaStore.getState();
      return {
        route: s.route,
        arena: s.arena,
        progress: s.progress,
        settings: s.settings,
        activeScenes: game.scene.getScenes(true).map((scene) => scene.scene.key),
      };
    },
  };
}

void boot();
