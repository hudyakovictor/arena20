// T043-минимум · Вердикт: панк-таблоидный разбор (факт → последствие → качество → правило).
// Оверлей поверх Shell; закрытие — через РАЗБОР (назад к reveal) или СЛЕДУЮЩАЯ ОХОТА.
import Phaser from 'phaser';
import {
  FONTS,
  FONT_SIZES,
  LAYOUT,
  PURE,
  SPACING,
  UI_BG,
  UI_HEX,
  UI_TINT,
} from '@signal-arena/shared';
import { selectArena, selectLang, selectProgress, useArenaStore } from '../../store.js';
import { t } from '../../copy.js';
import { t as sharedT } from '@signal-arena/shared';
import { playSound } from '../../sound.js';
import {
  computeVerdictStub,
  getPublicScenario,
  listScenarioIds,
  revealScenario,
} from '../../content.js';
import { anchor, clearAnchors, makeCta, makeProgressBar, makeText } from '../ui/kit.js';

const DIM_ORDER = ['context', 'evidence', 'action', 'risk', 'discipline'] as const;
const DIM_RU: Record<(typeof DIM_ORDER)[number], string> = {
  context: 'КОНТЕКСТ',
  evidence: 'ДОКАЗАТЕЛЬСТВА',
  action: 'ДЕЙСТВИЕ',
  risk: 'РИСК',
  discipline: 'ДИСЦИПЛИНА',
};

export default class VerdictScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Verdict' });
  }

  create(): void {
    clearAnchors();
    const session = selectArena();
    if (!session?.decisionId) {
      this.scene.stop('Verdict');
      return;
    }
    const scenario = getPublicScenario(session.scenarioId);
    const revealed = revealScenario(session.scenarioId);
    const verdict = computeVerdictStub(scenario, session.decisionId, session.step2Id);
    const progress = selectProgress();

    this.add.rectangle(
      LAYOUT.viewWidth / 2,
      LAYOUT.viewHeight / 2,
      LAYOUT.viewWidth,
      LAYOUT.viewHeight,
      PURE.black,
      0.72,
    );

    const panelW = LAYOUT.viewWidth - SPACING.lg;
    const panelH = 700;
    const px = (LAYOUT.viewWidth - panelW) / 2;
    const py = 72;
    const bg = this.add.graphics();
    bg.fillStyle(UI_BG.panel, 1);
    bg.fillRoundedRect(px, py, panelW, panelH, 14);
    bg.lineStyle(2, UI_TINT.active, 0.8);
    bg.strokeRoundedRect(px, py, panelW, panelH, 14);

    const innerX = px + SPACING.lg;
    const innerW = panelW - SPACING.lg * 2;
    let y = py + SPACING.md;
    const good = verdict.quality >= 60;
    const headline = this.add.text(innerX, y, good ? t('verdict.agree') : t('verdict.disagree'), {
      fontFamily: FONTS.ui,
      fontSize: '15px',
      fontStyle: '700',
      color: good ? UI_HEX.active : UI_HEX.warning,
      wordWrap: { width: innerW },
    });
    y += headline.height + SPACING.sm;
    makeText(this, innerX, y, `${t('reveal.quality')}: ${verdict.quality}/100`, {
      mono: true,
      size: FONT_SIZES.title,
      tone: 'active',
    });
    y += 34;
    const bar = makeProgressBar(this, innerW, 10, good ? 'success' : 'warning');
    bar.container.setPosition(innerX, y);
    bar.setRatio(verdict.quality / 100);
    y += 26;

    for (const dimKey of DIM_ORDER) {
      const value = verdict.dimensions[dimKey];
      makeText(this, innerX, y, `${DIM_RU[dimKey]} · ${value}`, {
        mono: true,
        size: FONT_SIZES.caption,
        tone: 'secondary',
      });
      const mini = makeProgressBar(
        this,
        120,
        6,
        value >= 60 ? 'success' : value >= 40 ? 'warning' : 'danger',
      );
      mini.container.setPosition(innerX + innerW - 120, y + 8);
      mini.setRatio(value / 100);
      y += 22;
    }
    y += SPACING.sm;
    const fact = makeText(
      this,
      innerX,
      y,
      `${t('reveal.fact')}: ${sharedT(selectLang(), revealed.factKey)}`,
      {
        size: FONT_SIZES.body,
        wrapWidth: innerW,
      },
    );
    y += fact.height + SPACING.sm;
    const consequence = makeText(
      this,
      innerX,
      y,
      `${t('reveal.consequence')}: ${sharedT(selectLang(), verdict.consequenceKey)}`,
      { size: FONT_SIZES.body, tone: 'secondary', wrapWidth: innerW },
    );
    y += consequence.height + SPACING.sm;
    const rule = makeText(
      this,
      innerX,
      y,
      `${t('reveal.rule')}: ${sharedT(selectLang(), verdict.ruleKey)}`,
      {
        size: FONT_SIZES.body,
        tone: 'data',
        wrapWidth: innerW,
      },
    );
    y += rule.height + SPACING.md;
    makeText(
      this,
      innerX,
      y,
      `+${verdict.xpAwarded} XP · LVL ${progress.rank} · CREDITS ${progress.credits}`,
      {
        mono: true,
        size: FONT_SIZES.caption,
        tone: 'warning',
      },
    );

    const nextId = listScenarioIds().find((id) => id !== session.scenarioId) ?? session.scenarioId;
    const next = makeCta(
      this,
      t('reveal.next'),
      () => {
        playSound(this, 'click');
        this.scene.stop('Verdict');
        useArenaStore.getState().startScenario(nextId);
        this.scene.bringToTop('Shell');
      },
      'active',
      innerW,
    );
    next.setPosition(innerX, py + panelH - 128);
    anchor('verdict:next', next);
    const close = (): void => {
      playSound(this, 'click');
      this.scene.stop('Verdict');
      this.scene.bringToTop('Shell');
    };
    const reviewGhost = makeText(this, 0, 0, t('reveal.review'), {
      mono: true,
      size: FONT_SIZES.body,
      tone: 'secondary',
      align: 'center',
    });
    reviewGhost.setOrigin(0.5, 0);
    reviewGhost.setPosition(LAYOUT.viewWidth / 2, py + panelH - 62);
    const zone = this.add.zone(0, 0, innerW, LAYOUT.touchMin).setOrigin(0.5, 0);
    zone.setPosition(LAYOUT.viewWidth / 2, py + panelH - 70);
    zone.setInteractive({ useHandCursor: true });
    zone.on('pointerdown', close);
    anchor('verdict:review', zone);
  }
}
