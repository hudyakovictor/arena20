// T011/T012/T013 · ShellScene: постоянная оболочка (top bar + bottom nav),
// переключение ленивых контент-сцен по маршруту из стора, FPS-метрика в dev.
import Phaser from 'phaser';
import { FONT_SIZES, LAYOUT, UI_BG, UI_TINT } from '@signal-arena/shared';
import type { RouteId } from '../../store.js';
import { selectArena, selectProgress, useArenaStore } from '../../store.js';
import { t } from '../../copy.js';
import { playSound } from '../../sound.js';
import { BOTTOM_NAV_ROUTES, ensureRouteScene } from '../router.js';
import { anchor, makeChip, makeProgressBar, makeText } from '../ui/kit.js';
import { makeSystemState } from '../ui/states.js';
import { iconImage } from '../ui/icons.js';

/** Прямоугольник контента между top bar и bottom nav. */
export const CONTENT_RECT = {
  x: 0,
  y: 84,
  w: LAYOUT.viewWidth,
  h: LAYOUT.viewHeight - 84 - 88,
} as const;

export const TOPBAR_H = 78;
export const BOTTOMNAV_H = 88;
/** Вертикальная ось шапки: весь контент центрируется по ней. */
const TOPBAR_MID = TOPBAR_H / 2;

const NAV_ICONS: Record<RouteId, string> = {
  home: 'i-home',
  academy: 'i-learn',
  arena: 'i-arena',
  bestiary: 'i-bestiary',
  journal: 'i-journal',
  tournament: 'i-tournament',
  market: 'i-market',
  profile: 'i-profile',
  more: 'i-more',
};

const NAV_LABEL_KEYS: Record<RouteId, string> = {
  home: 'nav.home',
  academy: 'nav.academy',
  arena: 'nav.arena',
  bestiary: 'nav.bestiary',
  journal: 'journal.title',
  tournament: 'tournament.title',
  market: 'market.title',
  profile: 'profile.title',
  more: 'nav.more',
};

/** Компактный формат кредитов для шапки: 120 → «120», 12345 → «12.3K». */
function fmtCredits(n: number): string {
  const v = Math.max(0, Math.floor(n));
  if (v < 10000) return String(v);
  if (v < 1000000) {
    const k = v / 1000;
    return `${k >= 100 ? String(Math.round(k)) : k.toFixed(1)}K`;
  }
  return `${(v / 1000000).toFixed(1)}M`;
}

export class ShellScene extends Phaser.Scene {
  private topbar: Phaser.GameObjects.Container | null = null;
  private bottomnav: Phaser.GameObjects.Container | null = null;
  private contentError: Phaser.GameObjects.Container | null = null;
  private currentContent: string | null = null;
  private unsubscribe: (() => void) | null = null;
  private fpsText: Phaser.GameObjects.Text | null = null;

  constructor() {
    super({ key: 'Shell' });
  }

  create(): void {
    useArenaStore.getState().setBooted();
    this.buildChrome();
    const route = useArenaStore.getState().route;
    void this.showRoute(route);
    this.unsubscribe = useArenaStore.subscribe((s, prev) => {
      if (s.route !== prev.route) void this.showRoute(s.route);
      if (
        s.progress.xp !== prev.progress.xp ||
        s.arena?.phase !== prev.arena?.phase ||
        s.arena?.scenarioId !== prev.arena?.scenarioId
      ) {
        this.refreshTopbar();
      }
    });
    if (import.meta.env.DEV) {
      this.fpsText = makeText(this, 8, LAYOUT.viewHeight - 22, '', {
        mono: true,
        size: FONT_SIZES.label - 1,
        tone: 'muted',
      });
      this.fpsText.setDepth(9999);
    }
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unsubscribe?.());
  }

  override update(): void {
    if (this.fpsText) {
      const fps = Math.round(this.game.loop.actualFps);
      const route = useArenaStore.getState().route;
      this.fpsText.setText(`${fps} FPS · ${route} · [Shell,${this.currentContent ?? '—'}]`);
    }
  }

  private buildChrome(): void {
    this.refreshTopbar();
    this.buildBottomNav();
  }

  private refreshTopbar(): void {
    this.topbar?.destroy(true);
    const route = useArenaStore.getState().route;
    this.topbar = route === 'arena' && selectArena() ? this.buildTaskbar() : this.buildTopbar();
  }

  /** T012 · Обычный top bar: аватар/ранг + XP + кредиты + уведомления + настройки. */
  private buildTopbar(): Phaser.GameObjects.Container {
    const progress = selectProgress();
    const root = this.add.container(0, 0);
    const bg = this.add.graphics();
    bg.fillStyle(UI_BG.panel, 1);
    bg.fillRect(0, 0, LAYOUT.viewWidth, TOPBAR_H);
    bg.lineStyle(1, UI_TINT.secondary, 0.18);
    bg.lineBetween(0, TOPBAR_H, LAYOUT.viewWidth, TOPBAR_H);
    root.add(bg);

    const avatar = this.add.graphics();
    avatar.fillStyle(UI_BG.surface3, 1);
    avatar.fillCircle(30, TOPBAR_MID, 17);
    avatar.lineStyle(1.5, UI_TINT.active, 0.9);
    avatar.strokeCircle(30, TOPBAR_MID, 17);
    root.add(avatar);
    const rank = makeText(this, 0, 0, String(progress.rank), {
      mono: true,
      size: 13,
      tone: 'active',
    });
    rank.setOrigin(0.5, 0.5);
    rank.setPosition(30, TOPBAR_MID);
    root.add(rank);

    // Левая группа: подпись LVL/XP + значение + бар строго одной ширины (54…214).
    const lvl = makeText(this, 54, 16, `LVL ${progress.rank} · XP`, {
      mono: true,
      size: 10,
      tone: 'muted',
    });
    const xpText = makeText(this, 0, 16, `${progress.xp}`, {
      mono: true,
      size: 10,
      tone: 'secondary',
    });
    xpText.setOrigin(1, 0);
    xpText.setX(214);
    const bar = makeProgressBar(this, 160, 8, 'active');
    bar.container.setPosition(54, 50);
    bar.setRatio((progress.xp % 500) / 500);
    root.add([lvl, xpText, bar.container]);

    const credits = makeChip(this, fmtCredits(progress.credits), 'warning');
    credits.setPosition(224, TOPBAR_MID - 11);
    root.add(credits);

    const notif = this.navIcon(296, 'i-info', () => {
      playSound(this, 'click');
      useArenaStore.getState().setRoute('home');
    });
    const settings = this.navIcon(344, 'i-settings', () => {
      playSound(this, 'click');
      useArenaStore.getState().setRoute('more');
    });
    root.add([notif, settings]);
    return root;
  }

  /** T012 · Taskbar арены: назад + прогресс сценария + кредиты + помощь + настройки. */
  private buildTaskbar(): Phaser.GameObjects.Container {
    const arena = selectArena();
    const progress = selectProgress();
    const root = this.add.container(0, 0);
    const bg = this.add.graphics();
    bg.fillStyle(UI_BG.panel, 1);
    bg.fillRect(0, 0, LAYOUT.viewWidth, TOPBAR_H);
    bg.lineStyle(1, UI_TINT.data, 0.35);
    bg.lineBetween(0, TOPBAR_H, LAYOUT.viewWidth, TOPBAR_H);
    root.add(bg);

    const back = this.navIcon(8, 'i-back', () => {
      playSound(this, 'click');
      useArenaStore.getState().setRoute('home');
    });
    root.add(back);

    // Прогресс сценария: подпись + фаза + бар строго одной ширины (56…234).
    const label = makeText(
      this,
      56,
      16,
      `${t('shell.scenarioProgress')} · ${arena?.scenarioId ?? '—'}`,
      {
        mono: true,
        size: 10,
        tone: 'muted',
      },
    );
    const phaseLabel =
      arena?.phase === 'menu'
        ? t('arena.mode.title')
        : arena?.phase === 'brief'
          ? t('arena.brief')
          : arena?.phase === 'task'
            ? t('arena.task')
            : arena?.phase === 'reveal'
              ? t('reveal.title')
              : t('reveal.quality');
    const right = makeText(this, 0, 16, phaseLabel, { mono: true, size: 10, tone: 'data' });
    right.setOrigin(1, 0);
    right.setX(234);
    const bar = makeProgressBar(this, 178, 8, 'data');
    bar.container.setPosition(56, 50);
    const phaseFrac =
      arena?.phase === 'menu'
        ? 0.05
        : arena?.phase === 'brief'
          ? 0.15
          : arena?.phase === 'task'
            ? 0.45
            : arena?.phase === 'reveal'
              ? 0.8
              : 1;
    bar.setRatio(phaseFrac);
    root.add([label, right, bar.container]);

    const credits = makeChip(this, fmtCredits(progress.credits), 'warning');
    credits.setPosition(242, TOPBAR_MID - 11);
    const help = this.navIcon(300, 'i-help', () => {
      playSound(this, 'click');
      this.scene.get('Arena')?.events.emit('arena:help');
    });
    const pause = this.navIcon(344, 'i-settings', () => {
      playSound(this, 'click');
      this.scene.get('Arena')?.events.emit('arena:pause');
    });
    root.add([credits, help, pause]);
    return root;
  }

  private navIcon(x: number, icon: string, onTap: () => void): Phaser.GameObjects.Container {
    // Hit-зона 44×44 центрирована по оси шапки; визуал 24px по её центру.
    const c = this.add.container(x, TOPBAR_MID - LAYOUT.touchMin / 2);
    const img = iconImage(this, icon, 24, 'secondary');
    (img as unknown as { x: number; y: number }).x = LAYOUT.touchMin / 2;
    (img as unknown as { y: number }).y = LAYOUT.touchMin / 2;
    const zone = this.add.zone(0, 0, LAYOUT.touchMin, LAYOUT.touchMin).setOrigin(0, 0);
    zone.setInteractive({ useHandCursor: true });
    zone.on('pointerdown', onTap);
    c.add([img, zone]);
    return c;
  }

  /** T013 · Нижняя навигация: 5 слотов, активный — кислотой + подписью. */
  private buildBottomNav(): void {
    const root = this.add.container(0, LAYOUT.viewHeight - BOTTOMNAV_H);
    const bg = this.add.graphics();
    bg.fillStyle(UI_BG.panel, 1);
    bg.fillRect(0, 0, LAYOUT.viewWidth, BOTTOMNAV_H);
    bg.lineStyle(1, UI_TINT.secondary, 0.18);
    bg.lineBetween(0, 0, LAYOUT.viewWidth, 0);
    root.add(bg);
    const slotW = LAYOUT.viewWidth / BOTTOM_NAV_ROUTES.length;
    const active = useArenaStore.getState().route;
    BOTTOM_NAV_ROUTES.forEach((route, i) => {
      const isActive = route === active;
      const slot = this.add.container(i * slotW, 0);
      if (isActive) {
        const ind = this.add.graphics();
        ind.fillStyle(UI_TINT.active, 1);
        ind.fillRect(slotW / 2 - 14, 6, 28, 3);
        slot.add(ind);
      }
      // Ритм слота (H=88): индикатор 6–9, иконка 24–48, подпись 54–67, низ 21.
      const icon = iconImage(this, NAV_ICONS[route] ?? 'i-more', 26, isActive ? 'active' : 'muted');
      (icon as unknown as { x: number; y: number }).x = slotW / 2;
      (icon as unknown as { y: number }).y = 36;
      const label = makeText(this, 0, 0, t(NAV_LABEL_KEYS[route] ?? 'nav.more'), {
        mono: true,
        size: 10,
        tone: isActive ? 'active' : 'muted',
        align: 'center',
      });
      label.setOrigin(0.5, 0);
      label.setX(slotW / 2);
      label.setY(54);
      const zone = this.add.zone(0, 0, slotW, BOTTOMNAV_H - 8).setOrigin(0, 0);
      zone.setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => {
        if (useArenaStore.getState().route === route) return;
        playSound(this, 'tab');
        if (route === 'arena' && !selectArena()) {
          // Вход в арену без сессии — прототип 4.1: стартуем первый незакрытый сценарий.
          const state = useArenaStore.getState();
          const done = new Set(state.progress.completed);
          const next = ['mvp-001', 'mvp-002'].find((id) => !done.has(id)) ?? 'mvp-001';
          state.startScenario(next);
          return;
        }
        useArenaStore.getState().setRoute(route);
      });
      slot.add([icon, label, zone]);
      anchor(`nav:${route}`, zone);
      root.add(slot);
    });
    this.bottomnav?.destroy(true);
    this.bottomnav = root;
  }

  private async showRoute(route: RouteId): Promise<void> {
    this.clearContentError();
    let key: string;
    try {
      key = await ensureRouteScene(this, route);
    } catch (err) {
      // Ленивый чанк не загрузился (сеть/HMR): ошибка с повтором вместо чёрного экрана.
      console.error(`shell: не удалось загрузить сцену маршрута ${route}`, err);
      this.showContentError(route);
      return;
    }
    // Стейл-навигация: пока грузился чанк, маршрут мог смениться.
    if (useArenaStore.getState().route !== route) return;
    if (this.currentContent && this.currentContent !== key) {
      this.scene.stop(this.currentContent);
    }
    this.currentContent = key;
    // ВАЖНО: launch, а не start — ScenePlugin.start() останавливает вызывающую сцену,
    // т.е. убил бы саму оболочку (топбар/навигация/подписка стора) при первой навигации.
    if (!this.scene.isActive(key)) this.scene.launch(key);
    this.scene.bringToTop('Shell');
    this.buildBottomNav();
    this.refreshTopbar();
  }

  private clearContentError(): void {
    this.contentError?.destroy(true);
    this.contentError = null;
  }

  private showContentError(route: RouteId): void {
    this.clearContentError();
    const panel = makeSystemState(this, 'error', {
      actionLabel: t('states.retry'),
      onAction: () => {
        playSound(this, 'click');
        void this.showRoute(route);
      },
    });
    this.contentError = this.add.container(CONTENT_RECT.x, CONTENT_RECT.y + 120, [panel]);
  }
}
