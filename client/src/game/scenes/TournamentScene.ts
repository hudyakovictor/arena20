// T080-минимум · Турниры: список, вход, лидерборд (асинхронный формат, fixture-данные).
// Прототип 9.1–9.4. WS realtime — T081; здесь вход ведёт в арену на fixed-сценарии.
import Phaser from 'phaser';
import { FONT_SIZES, LAYOUT, SPACING } from '@signal-arena/shared';
import { selectProgress, useArenaStore } from '../../store.js';
import { t } from '../../copy.js';
import { playSound } from '../../sound.js';
import { makeSection } from '../ui/kit.js';
import { baseHeader, baseRoot, infoCard, INNER_W } from './_base.js';

const TOURNAMENTS = [
  {
    id: 'rookie',
    titleKey: 'tourn.rookie.title',
    bodyKey: 'tourn.rookie.body',
    scenarioId: 'mvp-001',
    prize: '+60 XP',
  },
  {
    id: 'risk-cup',
    titleKey: 'tourn.risk.title',
    bodyKey: 'tourn.risk.body',
    scenarioId: 'mvp-002',
    prize: '+120 XP',
  },
] as const;

// Fixture-лидерборд до серверного WS (T081/T104).
const BOARD = [
  { name: 'ColdHead_77', quality: 94 },
  { name: 'NoFomoNina', quality: 88 },
  { name: 'StopHunter', quality: 81 },
] as const;

export default class TournamentScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Tournament' });
  }

  create(): void {
    const root = baseRoot(this);
    let y = baseHeader(this, root, 'tournament.title', 'tournament.sub');
    const progress = selectProgress();
    for (const tourn of TOURNAMENTS) {
      const best = progress.bestQuality[tourn.scenarioId];
      const h = infoCard(
        this,
        root,
        LAYOUT.gutter,
        y,
        INNER_W,
        [
          {
            text: `${t(tourn.titleKey)} · ${tourn.prize}`,
            mono: true,
            size: FONT_SIZES.caption,
            tone: 'narrative',
          },
          { text: t(tourn.bodyKey), size: FONT_SIZES.body, maxChars: 120 },
          {
            text:
              best === undefined
                ? `${t('tourn.join')} →`
                : `${t('tourn.joined')} · ${t('home.best')}: ${best}`,
            mono: true,
            size: FONT_SIZES.caption,
            tone: best === undefined ? 'active' : 'success',
          },
        ],
        () => {
          playSound(this, 'click');
          useArenaStore.getState().startScenario(tourn.scenarioId);
        },
      );
      y += h + SPACING.sm;
    }
    const sec = makeSection(this, t('tourn.board'), '');
    sec.setPosition(LAYOUT.gutter, y);
    root.add(sec);
    y += 28;
    const rows = [
      ...BOARD.map((r) => `${r.name} — ${r.quality}`),
      `${t('tourn.you')} — ${progress.xp} XP`,
    ].join('\n');
    const bh = infoCard(this, root, LAYOUT.gutter, y, INNER_W, [
      { text: rows, mono: true, size: FONT_SIZES.caption, tone: 'secondary', maxChars: 200 },
      { text: t('tourn.note'), size: FONT_SIZES.caption, tone: 'muted', maxChars: 200 },
    ]);
    void bh;
  }
}
