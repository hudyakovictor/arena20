// Прототип 3.1–3.3 · Главная: продолжение охоты, сценарии архива, шорткаты разделов.
import Phaser from 'phaser';
import { FONT_SIZES, LAYOUT, SPACING } from '@signal-arena/shared';
import type { RouteId } from '../../store.js';
import { selectArena, selectProgress, useArenaStore } from '../../store.js';
import { t } from '../../copy.js';
import { playSound } from '../../sound.js';
import { getPublicScenario, listScenarioIds } from '../../content.js';
import { t as sharedT } from '@signal-arena/shared';
import { selectLang } from '../../store.js';
import { anchor, clearAnchors, makeCta, makeSection } from '../ui/kit.js';
import { baseHeader, baseRoot, infoCard, INNER_W } from './_base.js';

const SHORTCUTS: { route: RouteId; labelKey: string }[] = [
  { route: 'academy', labelKey: 'nav.academy' },
  { route: 'bestiary', labelKey: 'nav.bestiary' },
  { route: 'journal', labelKey: 'journal.title' },
  { route: 'tournament', labelKey: 'tournament.title' },
  { route: 'market', labelKey: 'market.title' },
  { route: 'profile', labelKey: 'profile.title' },
];

export default class HomeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Home' });
  }

  create(): void {
    clearAnchors();
    const root = baseRoot(this);
    let y = baseHeader(this, root, 'home.title', 'home.greet');
    const arena = selectArena();
    const progress = selectProgress();

    const ctaLabel = arena ? t('home.resume') : t('home.start');
    const cta = makeCta(this, ctaLabel, () => {
      playSound(this, 'click');
      const state = useArenaStore.getState();
      if (state.arena) state.setRoute('arena');
      else {
        const done = new Set(state.progress.completed);
        const next = listScenarioIds().find((id) => !done.has(id)) ?? listScenarioIds()[0];
        if (next) state.startScenario(next);
      }
    });
    cta.setPosition(LAYOUT.gutter, y);
    anchor('home:cta', cta);
    root.add(cta);
    y += cta.height + SPACING.md;

    const sec = makeSection(this, t('home.scenarios'), '');
    sec.setPosition(LAYOUT.gutter, y);
    root.add(sec);
    y += 28;
    for (const id of listScenarioIds()) {
      const scenario = getPublicScenario(id);
      const best = progress.bestQuality[id];
      const h = infoCard(
        this,
        root,
        LAYOUT.gutter,
        y,
        INNER_W,
        [
          {
            text: `${t('shell.scenarioProgress')} ${id} · DIFF ${scenario.difficulty}`,
            mono: true,
            size: FONT_SIZES.caption,
            tone: 'data',
          },
          { text: sharedT(selectLang(), scenario.contextKey), size: FONT_SIZES.body, maxChars: 90 },
          {
            text:
              best === undefined
                ? t('journal.empty').slice(0, 0) + '—'
                : `${t('home.best')}: ${best}/100`,
            mono: true,
            size: FONT_SIZES.caption,
            tone: best === undefined ? 'muted' : 'active',
          },
        ],
        () => {
          playSound(this, 'click');
          useArenaStore.getState().startScenario(id);
        },
      );
      y += h + SPACING.sm;
    }

    const sec2 = makeSection(this, t('home.sections'), '');
    sec2.setPosition(LAYOUT.gutter, y);
    root.add(sec2);
    y += 28;
    const cellW = (INNER_W - SPACING.sm) / 3;
    SHORTCUTS.forEach((s, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      infoCard(
        this,
        root,
        LAYOUT.gutter + col * (cellW + SPACING.sm),
        y + row * 62,
        cellW,
        [
          {
            text: t(s.labelKey),
            mono: true,
            size: FONT_SIZES.caption,
            tone: 'primary',
            maxChars: 12,
          },
        ],
        () => {
          playSound(this, 'tab');
          useArenaStore.getState().setRoute(s.route);
        },
      );
    });
  }
}
