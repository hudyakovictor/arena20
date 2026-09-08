// T070/T072-минимум · Журнал: паттерны, история решений, рекомендации по повтору.
// Прототип 8.1–8.3. Данные — из стора прогресса; пустое состояние — по §12.
import Phaser from 'phaser';
import { FONT_SIZES, LAYOUT, SPACING } from '@signal-arena/shared';
import { selectLang, selectProgress, useArenaStore } from '../../store.js';
import { t } from '../../copy.js';
import { t as sharedT } from '@signal-arena/shared';
import { playSound } from '../../sound.js';
import { getPublicScenario } from '../../content.js';
import { makeSection } from '../ui/kit.js';
import { makeSystemState } from '../ui/states.js';
import { baseHeader, baseRoot, infoCard, INNER_W } from './_base.js';

export default class JournalScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Journal' });
  }

  create(): void {
    const root = baseRoot(this);
    const y0 = baseHeader(this, root, 'journal.title', 'journal.sub');
    const progress = selectProgress();
    if (progress.completed.length === 0) {
      const empty = makeSystemState(this, 'empty', {
        actionLabel: t('home.start'),
        onAction: () => {
          playSound(this, 'click');
          useArenaStore.getState().setRoute('arena');
        },
      });
      empty.setPosition(0, y0 + 20);
      root.add(empty);
      const hint = infoCard(this, root, LAYOUT.gutter, y0 + 220, INNER_W, [
        { text: t('journal.empty'), size: FONT_SIZES.body, tone: 'secondary', maxChars: 300 },
      ]);
      void hint;
      return;
    }
    let y = y0;
    const repeat = progress.completed.filter((id) => (progress.bestQuality[id] ?? 100) < 70);
    if (repeat.length > 0) {
      const sec = makeSection(this, t('journal.repeat'), '');
      sec.setPosition(LAYOUT.gutter, y);
      root.add(sec);
      y += 28;
      for (const id of repeat) {
        const h = infoCard(
          this,
          root,
          LAYOUT.gutter,
          y,
          INNER_W,
          [
            {
              text: `${t('shell.scenarioProgress')} ${id}`,
              mono: true,
              size: FONT_SIZES.caption,
              tone: 'warning',
            },
            {
              text: `${t('journal.best')}: ${progress.bestQuality[id] ?? 0}/100 — ${t('journal.fix')}`,
              size: FONT_SIZES.body,
              maxChars: 120,
            },
          ],
          () => {
            playSound(this, 'click');
            useArenaStore.getState().startScenario(id);
          },
        );
        y += h + SPACING.sm;
      }
      y += SPACING.xs;
    }
    const sec2 = makeSection(this, t('journal.history'), '');
    sec2.setPosition(LAYOUT.gutter, y);
    root.add(sec2);
    y += 28;
    for (const id of progress.completed) {
      let context = id;
      try {
        context = sharedT(selectLang(), getPublicScenario(id).contextKey);
      } catch {
        context = id;
      }
      const h = infoCard(
        this,
        root,
        LAYOUT.gutter,
        y,
        INNER_W,
        [
          {
            text: `${t('shell.scenarioProgress')} ${id} · ${progress.bestQuality[id] ?? 0}/100`,
            mono: true,
            size: FONT_SIZES.caption,
            tone: 'data',
          },
          { text: context, size: FONT_SIZES.body, maxChars: 110 },
        ],
        () => {
          playSound(this, 'click');
          useArenaStore.getState().startScenario(id);
        },
      );
      y += h + SPACING.sm;
    }
  }
}
