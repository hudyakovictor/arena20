// Прототип 12.1–12.4 · Ещё: настройки (звук/движение/язык), все разделы, правовое.
// T016/T122-минимум: настройки применяются сразу и персистятся в сторе.
import Phaser from 'phaser';
import { FONT_SIZES, LAYOUT, SPACING } from '@signal-arena/shared';
import type { RouteId } from '../../store.js';
import { selectSettings, useArenaStore } from '../../store.js';
import { t } from '../../copy.js';
import { playSound } from '../../sound.js';
import { makeSection } from '../ui/kit.js';
import { baseHeader, baseRoot, infoCard, INNER_W } from './_base.js';

const SECTIONS: { route: RouteId; labelKey: string }[] = [
  { route: 'journal', labelKey: 'journal.title' },
  { route: 'tournament', labelKey: 'tournament.title' },
  { route: 'market', labelKey: 'market.title' },
  { route: 'profile', labelKey: 'profile.title' },
  { route: 'academy', labelKey: 'nav.academy' },
  { route: 'bestiary', labelKey: 'nav.bestiary' },
];

function onOff(value: boolean): string {
  return value ? 'ON' : 'OFF';
}

export default class MoreScene extends Phaser.Scene {
  constructor() {
    super({ key: 'More' });
  }

  create(): void {
    this.render();
    const unsub = useArenaStore.subscribe((s, prev) => {
      if (s.settings !== prev.settings) {
        this.children.removeAll(true);
        this.render();
      }
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, unsub);
  }

  private render(): void {
    const root = baseRoot(this);
    let y = baseHeader(this, root, 'more.title', 'settings.title');
    const settings = selectSettings();
    const state = useArenaStore.getState();

    const sound = infoCard(
      this,
      root,
      LAYOUT.gutter,
      y,
      INNER_W,
      [
        {
          text: `${t('settings.sound')}: ${onOff(settings.sound)}`,
          mono: true,
          size: FONT_SIZES.body,
        },
      ],
      () => {
        state.updateSettings({ sound: !settings.sound });
        playSound(this, 'click');
      },
    );
    y += sound + SPACING.sm;
    const motion = infoCard(
      this,
      root,
      LAYOUT.gutter,
      y,
      INNER_W,
      [
        {
          text: `${t('settings.reduceMotion')}: ${onOff(settings.reduceMotion)}`,
          mono: true,
          size: FONT_SIZES.body,
        },
      ],
      () => {
        playSound(this, 'click');
        state.updateSettings({ reduceMotion: !settings.reduceMotion });
      },
    );
    y += motion + SPACING.sm;
    const lang = infoCard(
      this,
      root,
      LAYOUT.gutter,
      y,
      INNER_W,
      [
        {
          text: `${t('settings.language')}: ${settings.lang.toUpperCase()}`,
          mono: true,
          size: FONT_SIZES.body,
        },
      ],
      () => {
        playSound(this, 'click');
        state.updateSettings({ lang: settings.lang === 'ru' ? 'en' : 'ru' });
      },
    );
    y += lang + SPACING.md;

    const sec = makeSection(this, t('more.sections'), '');
    sec.setPosition(LAYOUT.gutter, y);
    root.add(sec);
    y += 28;
    for (const s of SECTIONS) {
      const h = infoCard(
        this,
        root,
        LAYOUT.gutter,
        y,
        INNER_W,
        [{ text: t(s.labelKey), mono: true, size: FONT_SIZES.body, maxChars: 40 }],
        () => {
          playSound(this, 'tab');
          useArenaStore.getState().setRoute(s.route);
        },
      );
      y += h + SPACING.sm;
    }
    const legal = infoCard(this, root, LAYOUT.gutter, y, INNER_W, [
      { text: t('more.legal'), mono: true, size: FONT_SIZES.caption, tone: 'muted' },
      { text: t('more.legalBody'), size: FONT_SIZES.caption, tone: 'secondary', maxChars: 300 },
    ]);
    void legal;
  }
}
