// T050/T051-минимум · Академия: главы → тема (теория + связанные навыки + CTA в арену).
// Прототип 5.1–5.5. Навигация skill→theory→scenarios: тема ссылается на карты и сценарии.
import Phaser from 'phaser';
import { FONT_SIZES, LAYOUT, SPACING } from '@signal-arena/shared';
import { selectLang, useArenaStore } from '../../store.js';
import { t } from '../../copy.js';
import { t as sharedT } from '@signal-arena/shared';
import { playSound } from '../../sound.js';
import { content, getPublicScenario } from '../../content.js';
import { makeCta, makeLabel, tappable } from '../ui/kit.js';
import { baseHeader, baseRoot, infoCard, INNER_W } from './_base.js';

const CHAPTERS = [
  { id: 'risk', titleKey: 'academy.ch.risk.title', bodyKey: 'academy.ch.risk.body' },
  { id: 'structure', titleKey: 'academy.ch.structure.title', bodyKey: 'academy.ch.structure.body' },
  { id: 'timeframes', titleKey: 'academy.ch.tf.title', bodyKey: 'academy.ch.tf.body' },
  { id: 'noise', titleKey: 'academy.ch.noise.title', bodyKey: 'academy.ch.noise.body' },
  {
    id: 'discipline',
    titleKey: 'academy.ch.discipline.title',
    bodyKey: 'academy.ch.discipline.body',
  },
  { id: 'plan', titleKey: 'academy.ch.plan.title', bodyKey: 'academy.ch.plan.body' },
] as const;

export default class AcademyScene extends Phaser.Scene {
  private selected: string | null = null;

  constructor() {
    super({ key: 'Academy' });
  }

  create(): void {
    this.selected = null;
    this.render();
  }

  private render(): void {
    this.children.removeAll(true);
    const root = baseRoot(this);
    const y = baseHeader(this, root, 'academy.title', 'academy.sub');
    if (this.selected) this.renderTopic(root, y);
    else this.renderChapters(root, y);
  }

  private renderChapters(root: Phaser.GameObjects.Container, y0: number): void {
    let y = y0;
    const open = new Set(useArenaStore.getState().progress.openTopics);
    for (const ch of CHAPTERS) {
      const h = infoCard(
        this,
        root,
        LAYOUT.gutter,
        y,
        INNER_W,
        [
          {
            text: `${open.has(ch.id) ? '[+]' : '[ ]'} ${sharedT(selectLang(), ch.titleKey)}`,
            size: FONT_SIZES.body,
            maxChars: 60,
          },
        ],
        () => {
          playSound(this, 'click');
          useArenaStore.getState().openTopic(ch.id);
          this.selected = ch.id;
          this.render();
        },
      );
      y += h + SPACING.sm;
    }
  }

  private renderTopic(root: Phaser.GameObjects.Container, y0: number): void {
    const ch = CHAPTERS.find((c) => c.id === this.selected);
    if (!ch) {
      this.selected = null;
      this.render();
      return;
    }
    let y = y0;
    const h = infoCard(this, root, LAYOUT.gutter, y, INNER_W, [
      { text: sharedT(selectLang(), ch.titleKey), size: 15, maxChars: 120 },
      {
        text: sharedT(selectLang(), ch.bodyKey),
        size: FONT_SIZES.body,
        tone: 'secondary',
        maxChars: 600,
      },
    ]);
    y += h + SPACING.md;

    const linked = content().skills.filter((s) => s.theoryKey === `academy.${ch.id}`);
    if (linked.length > 0) {
      const names = linked.map((s) => sharedT(selectLang(), s.titleKey)).join(' · ');
      const lh = infoCard(this, root, LAYOUT.gutter, y, INNER_W, [
        { text: t('academy.linked'), mono: true, size: FONT_SIZES.caption, tone: 'data' },
        { text: names, size: FONT_SIZES.caption, maxChars: 200 },
      ]);
      y += lh + SPACING.md;
    }

    const firstScenario = content().scenarios[0];
    if (firstScenario) {
      const scenario = getPublicScenario(firstScenario.scenarioId);
      void scenario;
      const cta = makeCta(this, t('academy.train'), () => {
        playSound(this, 'click');
        if (firstScenario) useArenaStore.getState().startScenario(firstScenario.scenarioId);
      });
      cta.setPosition(LAYOUT.gutter, y);
      root.add(cta);
      y += cta.height + SPACING.sm;
    }
    const back = makeLabel(this, { text: t('common.back'), width: INNER_W, mono: true });
    back.setPosition(LAYOUT.gutter, y);
    root.add(
      tappable(back, () => {
        playSound(this, 'click');
        this.selected = null;
        this.render();
      }),
    );
  }
}
