// E2E: boot canvas → навигация shell → полный цикл арены → персист после релоада.
// Клики — настоящей мышью по e2e-якорям сцен (kit.anchor), состояние — через __arena.
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

interface ArenaDebug {
  route: string;
  arena: {
    scenarioId: string;
    decisionId: string | null;
    step2Id: string | null;
    phase: string;
    quality: number | null;
  } | null;
  progress: { completed: string[]; bestQuality: Record<string, number> };
  activeScenes: string[];
}

async function debugState(page: Page): Promise<ArenaDebug> {
  return page.evaluate(() => {
    const w = window as unknown as { __arena: { getState: () => ArenaDebug } };
    return w.__arena.getState();
  });
}

/** Клик по логическим координатам якоря (390×844 → реальный бокс canvas). */
async function tapAnchor(page: Page, id: string): Promise<void> {
  const point = await page.evaluate((anchorId: string) => {
    const w = window as unknown as { __arenaAnchors?: Record<string, { x: number; y: number }> };
    const p = w.__arenaAnchors?.[anchorId];
    if (!p) throw new Error(`нет якоря ${anchorId}`);
    return p;
  }, id);
  const box = await page.locator('#game canvas').boundingBox();
  if (!box) throw new Error('canvas не найден');
  const x = box.x + (point.x / 390) * box.width;
  const y = box.y + (point.y / 844) * box.height;
  await page.mouse.click(x, y);
}

async function waitFor(page: Page, predicate: (s: ArenaDebug) => boolean): Promise<ArenaDebug> {
  let last: ArenaDebug | null = null;
  await expect
    .poll(
      async () => {
        last = await debugState(page);
        return predicate(last) ? 'ok' : `wait:${JSON.stringify(last?.arena ?? last?.route)}`;
      },
      { timeout: 15_000 },
    )
    .toBe('ok');
  return last as unknown as ArenaDebug;
}

test.beforeEach(async ({ page }) => {
  // Детерминированное окружение: без звука/анимаций, чистый прогресс.
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem(
      'signal-arena:v1',
      JSON.stringify({
        state: {
          route: 'home',
          arena: null,
          settings: { sound: false, reduceMotion: true, lang: 'ru' },
          progress: {
            xp: 0,
            rank: 0,
            credits: 120,
            streakDays: 1,
            completed: [],
            bestQuality: {},
            ownedItems: [],
            openTopics: [],
          },
        },
        version: 1,
      }),
    );
  });
  await page.goto('/');
  await expect(page.locator('#game canvas')).toBeVisible({ timeout: 30_000 });
  await waitFor(page, (s) => s.activeScenes.includes('Shell') && s.activeScenes.includes('Home'));
});

test('shell: нижняя навигация переключает ленивые сцены', async ({ page }) => {
  for (const [anchorId, scene] of [
    ['nav:academy', 'Academy'],
    ['nav:bestiary', 'Bestiary'],
    ['nav:more', 'More'],
    ['nav:home', 'Home'],
  ] as const) {
    await tapAnchor(page, anchorId);
    await waitFor(page, (s) => s.activeScenes.includes(scene));
  }
  const state = await debugState(page);
  expect(state.route).toBe('home');
});

test('arena: брифинг → решение → 2-й шаг → reveal → вердикт → следующая охота', async ({
  page,
}) => {
  await tapAnchor(page, 'nav:arena');
  await waitFor(page, (s) => s.route === 'arena' && s.arena?.phase === 'brief');

  await tapAnchor(page, 'arena:brief-cta');
  await waitFor(page, (s) => s.arena?.phase === 'task');

  await tapAnchor(page, 'arena:dec:1');
  await waitFor(page, (s) => s.arena?.decisionId === 'b');

  await tapAnchor(page, 'arena:confirm');
  // mvp-001 — со вторым шагом: выбираем первую опцию риска
  await page.waitForFunction(
    () => {
      const w = window as unknown as { __arenaAnchors?: Record<string, unknown> };
      return Boolean(w.__arenaAnchors?.['arena:step2:0']);
    },
    { timeout: 5_000 },
  );
  await tapAnchor(page, 'arena:step2:0');
  await waitFor(page, (s) => s.arena?.phase === 'reveal');

  await tapAnchor(page, 'arena:reveal-cta');
  const verdict = await waitFor(
    page,
    (s) => s.arena?.phase === 'verdict' && s.activeScenes.includes('Verdict'),
  );
  expect(verdict.arena?.quality).toBeGreaterThan(0);
  expect(verdict.progress.completed).toContain('mvp-001');

  await tapAnchor(page, 'verdict:next');
  await waitFor(page, (s) => s.arena?.scenarioId === 'mvp-002' && s.arena?.phase === 'brief');
});

test('perсист: сессия и прогресс переживают релоад', async ({ page }) => {
  await tapAnchor(page, 'nav:arena');
  await waitFor(page, (s) => s.route === 'arena' && s.arena?.phase === 'brief');
  await page.reload();
  await expect(page.locator('#game canvas')).toBeVisible({ timeout: 30_000 });
  const state = await waitFor(page, (s) => s.route === 'arena' && s.arena !== null);
  expect(state.arena?.scenarioId).toBe('mvp-001');
});
