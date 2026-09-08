// T043 · Вердикт: панк-таблоидный разбор в 3 шага (прототип 4.11–4.13).
// Шаг 0 — качество 0–100 + 5 измерений; шаг 1 — разбор «факт → логика → правило»;
// шаг 2 — источники и методика. Оверлей поверх Shell; закрытие — через РАЗБОР
// (назад к reveal) или СЛЕДУЮЩАЯ ОХОТА.
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
import type { Verdict } from '@signal-arena/shared';
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
import type { RevealPayload } from '../../content.js';
import {
  anchor,
  clearAnchors,
  makeCta,
  makeLabel,
  makePager,
  makeProgressBar,
  makeText,
} from '../ui/kit.js';

const DIM_ORDER = ['context', 'evidence', 'action', 'risk', 'discipline'] as const;

const PANEL_H = 700;
const PANEL_Y = 72;

export default class VerdictScene extends Phaser.Scene {
  private step = 0;

  constructor() {
    super({ key: 'Verdict' });
  }

  create(): void {
    clearAnchors();
    this.step = 0;
    this.render();
  }

  private render(): void {
    this.children.removeAll(true);
    clearAnchors();
    const session = selectArena();
    if (!session?.decisionId) {
      this.scene.stop('Verdict');
      return;
    }
    const scenario = getPublicScenario(session.scenarioId);
    const revealed = revealScenario(session.scenarioId);
    const verdict = computeVerdictStub(scenario, session.decisionId, session.step2Id);

    this.add.rectangle(
      LAYOUT.viewWidth / 2,
      LAYOUT.viewHeight / 2,
      LAYOUT.viewWidth,
      LAYOUT.viewHeight,
      PURE.black,
      0.72,
    );

    const panelW = LAYOUT.viewWidth - SPACING.lg;
    const px = (LAYOUT.viewWidth - panelW) / 2;
    const bg = this.add.graphics();
    bg.fillStyle(UI_BG.panel, 1);
    bg.fillRoundedRect(px, PANEL_Y, panelW, PANEL_H, 14);
    bg.lineStyle(2, UI_TINT.active, 0.8);
    bg.strokeRoundedRect(px, PANEL_Y, panelW, PANEL_H, 14);

    const innerX = px + SPACING.lg;
    const innerW = panelW - SPACING.lg * 2;
    const stepLabel = makeText(
      this,
      innerX,
      PANEL_Y + SPACING.md,
      `${t('verdict.step')} ${this.step + 1} / 3`,
      { mono: true, size: FONT_SIZES.caption, tone: 'muted' },
    );
    const pager = makePager(this, 3, this.step);
    pager.container.setPosition(innerX + innerW - pager.container.width, PANEL_Y + SPACING.md + 2);

    const bodyY = PANEL_Y + SPACING.md + 26;
    if (this.step === 0) this.renderQuality(innerX, bodyY, innerW, verdict);
    else if (this.step === 1) this.renderBreakdown(innerX, bodyY, innerW, verdict, revealed);
    else this.renderSources(innerX, bodyY, innerW, scenario.scenarioId, revealed);

    const nextId = listScenarioIds().find((id) => id !== session.scenarioId) ?? session.scenarioId;
    if (this.step < 2) {
      const next = makeCta(
        this,
        t('verdict.nextStep'),
        () => {
          playSound(this, 'click');
          this.step += 1;
          this.render();
        },
        'active',
        innerW,
      );
      next.setPosition(innerX, PANEL_Y + PANEL_H - 118);
      anchor('verdict:next-step', next);
    } else {
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
      next.setPosition(innerX, PANEL_Y + PANEL_H - 118);
      anchor('verdict:next', next);
    }
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
    reviewGhost.setPosition(LAYOUT.viewWidth / 2, PANEL_Y + PANEL_H - 58);
    const zone = this.add.zone(0, 0, innerW, LAYOUT.touchMin).setOrigin(0.5, 0);
    zone.setPosition(LAYOUT.viewWidth / 2, PANEL_Y + PANEL_H - 66);
    zone.setInteractive({ useHandCursor: true });
    zone.on('pointerdown', close);
    anchor('verdict:review', zone);
    void stepLabel;
  }

  /** Шаг 0 (4.11): заголовок + качество + 5 измерений + XP. */
  private renderQuality(x: number, y0: number, w: number, verdict: Verdict): void {
    let y = y0;
    const good = verdict.quality >= 60;
    const headline = this.add.text(x, y, good ? t('verdict.agree') : t('verdict.disagree'), {
      fontFamily: FONTS.ui,
      fontSize: '15px',
      fontStyle: '700',
      color: good ? UI_HEX.active : UI_HEX.warning,
      wordWrap: { width: w },
    });
    y += headline.height + SPACING.sm;
    makeText(this, x, y, `${t('reveal.quality')}: ${verdict.quality}/100`, {
      mono: true,
      size: FONT_SIZES.title,
      tone: 'active',
    });
    y += 34;
    const bar = makeProgressBar(this, w, 10, good ? 'success' : 'warning');
    bar.container.setPosition(x, y);
    bar.setRatio(verdict.quality / 100);
    y += 28;

    for (const dimKey of DIM_ORDER) {
      const value = verdict.dimensions[dimKey];
      makeText(this, x, y, `${t(`verdict.dim.${dimKey}`)} · ${value}`, {
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
      mini.container.setPosition(x + w - 120, y + 8);
      mini.setRatio(value / 100);
      y += 24;
    }
    y += SPACING.sm;
    const progress = selectProgress();
    makeText(
      this,
      x,
      y,
      `+${verdict.xpAwarded} XP · LVL ${progress.rank} · CREDITS ${progress.credits}`,
      {
        mono: true,
        size: FONT_SIZES.caption,
        tone: 'warning',
      },
    );
  }

  /** Шаг 1 (4.12): разбор «факт → логика → переносимое правило». */
  private renderBreakdown(
    x: number,
    y0: number,
    w: number,
    verdict: Verdict,
    revealed: RevealPayload,
  ): void {
    let y = y0;
    const title = makeText(this, x, y, t('verdict.breakdown'), {
      mono: true,
      size: FONT_SIZES.caption,
      tone: 'muted',
    });
    y += title.height + SPACING.sm;
    const cards: { label: string; text: string; tone: 'primary' | 'secondary' | 'data' }[] = [
      { label: t('reveal.fact'), text: sharedT(selectLang(), revealed.factKey), tone: 'primary' },
      {
        label: t('verdict.logic'),
        text: sharedT(selectLang(), verdict.consequenceKey),
        tone: 'secondary',
      },
      { label: t('reveal.rule'), text: sharedT(selectLang(), verdict.ruleKey), tone: 'data' },
    ];
    for (const card of cards) {
      const label = makeLabel(this, {
        text: `${card.label}: ${card.text}`,
        size: FONT_SIZES.body,
        tone: card.tone,
        width: w,
      });
      label.setPosition(x, y);
      y += label.height + SPACING.sm;
    }
  }

  /** Шаг 2 (4.13): источники и методика — проверяемость архива (§15). */
  private renderSources(
    x: number,
    y0: number,
    w: number,
    scenarioId: string,
    revealed: RevealPayload,
  ): void {
    let y = y0;
    const title = makeText(this, x, y, t('verdict.sources'), {
      mono: true,
      size: FONT_SIZES.caption,
      tone: 'muted',
    });
    y += title.height + SPACING.sm;
    const scenario = getPublicScenario(scenarioId);
    const rows: [string, string][] = [
      [`${t('shell.scenarioProgress')} ${scenarioId}`, sharedT(selectLang(), revealed.sourceRef)],
      [t('verdict.dataset'), scenario.datasetVersion],
      [t('verdict.content'), scenario.contentVersion],
      [t('verdict.hash'), `${revealed.futureHash.slice(0, 16)}…`],
    ];
    for (const [label, value] of rows) {
      const card = makeLabel(this, {
        text: `${label}: ${value}`,
        size: FONT_SIZES.caption,
        mono: true,
        tone: 'secondary',
        width: w,
      });
      card.setPosition(x, y);
      y += card.height + SPACING.xs;
    }
    y += SPACING.xs;
    const method = makeLabel(this, {
      text: `${t('verdict.method')}: ${t('verdict.methodBody')}`,
      size: FONT_SIZES.caption,
      tone: 'primary',
      width: w,
    });
    method.setPosition(x, y);
  }
}
