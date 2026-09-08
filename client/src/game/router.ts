// T011 · Декларативный роутер: RouteId (Zustand) → Scene key.
// Контентные сцены подгружаются лениво через dynamic import (Vite code-split)
// и регистрируются через scene.add; ShellScene постоянна.
import type Phaser from 'phaser';
import type { RouteId } from '../store.js';

export const ROUTE_SCENE: Record<RouteId, string> = {
  home: 'Home',
  academy: 'Academy',
  arena: 'Arena',
  bestiary: 'Bestiary',
  journal: 'Journal',
  tournament: 'Tournament',
  market: 'Market',
  profile: 'Profile',
  more: 'More',
};

export const BOTTOM_NAV_ROUTES: RouteId[] = ['home', 'academy', 'arena', 'bestiary', 'more'];

type SceneCtor = new () => Phaser.Scene;

const loaders: Record<RouteId, () => Promise<{ default: SceneCtor }>> = {
  home: () => import('./scenes/HomeScene.js'),
  academy: () => import('./scenes/AcademyScene.js'),
  arena: () => import('./scenes/ArenaScene.js'),
  bestiary: () => import('./scenes/BestiaryScene.js'),
  journal: () => import('./scenes/JournalScene.js'),
  tournament: () => import('./scenes/TournamentScene.js'),
  market: () => import('./scenes/MarketScene.js'),
  profile: () => import('./scenes/ProfileScene.js'),
  more: () => import('./scenes/MoreScene.js'),
};

const pendingAdds = new Set<string>();

/** Гарантирует регистрацию сцены маршрута; возвращает scene key. */
export async function ensureRouteScene(shell: Phaser.Scene, route: RouteId): Promise<string> {
  const key = ROUTE_SCENE[route];
  if (shell.scene.get(key)) return key;
  if (!pendingAdds.has(key)) {
    pendingAdds.add(key);
    try {
      const mod = await loaders[route]();
      if (!shell.scene.get(key)) shell.scene.add(key, mod.default, false);
    } finally {
      pendingAdds.delete(key);
    }
  } else {
    while (!shell.scene.get(key)) {
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
  }
  return key;
}

/** Ленивая сцена вердикта (оверлей поверх Shell). */
export async function ensureVerdictScene(shell: Phaser.Scene): Promise<string> {
  const key = 'Verdict';
  if (!shell.scene.get(key)) {
    const mod = await import('./scenes/VerdictScene.js');
    shell.scene.add(key, mod.default, false);
  }
  return key;
}
