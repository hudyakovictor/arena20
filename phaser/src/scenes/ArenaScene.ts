// SIGNAL ARENA — экран встречи.
// Сцена только компонует блоки; вся отрисовка живёт в компонентах
// (SourceBrowser, CardRail, AnswerGrid, FeedbackOverlay) — аудит A1.
// Состояние обновляется точечно, без scene.restart() — аудит A2.

import Phaser from 'phaser';
import { gameState } from '../state/GameState';
import { balanceConfig } from '../config/balanceConfig';
import { getEpochForLevel } from '../config/epochConfig';
import { structureForLevel, type EpochStructure } from '../config/epochStructure';
import { templateFor } from '../data/templates';
import { mutate } from '../engine/mutator';
import { scoreEncounter, type Verdict } from '../engine/scoring';
import { enemies, enemyById } from '../data/enemies';
import { encounterSeed, localUserId } from '../engine/seed';
import { buildScenario, type Scenario } from '../engine/scenarioGen';
import type { EncounterInstance, Confidence, SourceId, EpochId } from '../types';
import { buildPalette, type Palette } from '../ui/palette';
import { CANVAS, CHROME, GUTTER, HIT, RADIUS, SP } from '../ui/tokens';
import * as TX from '../ui/text';
import { T, weatherLabel } from '../ui/copy';
import { button, panel } from '../ui/widgets';
import { Flow } from '../ui/layout';
import {
  renderTopBar,
  renderBottomNav,
  navForEpoch,
  renderBackground,
  bottomNavHeight,
} from '../ui/shell';
import { sceneEnter, enterPanel } from '../ui/motion';
import { haptic } from '../ui/feedbackFx';
import { SourceBrowser } from './arena/SourceBrowser';
import {
  AnswerGrid,
  CardRail,
  ConfidencePicker,
  VerdictRow,
  buildCardViews,
} from './arena/DecisionPanel';
import { cardChoiceFits, effectiveStackSlots } from '../engine/arenaFlow';
import { FeedbackOverlay } from './arena/FeedbackOverlay';
import { showDrawdown, showEpochTransition } from './arena/StatusOverlays';
import { SOURCE_TITLES } from '../engine/scenarioGen';

/** Шаги встречи: сначала разбор источников, затем решение. */
type Step = 'investigate' | 'decide';

export class ArenaScene extends Phaser.Scene {
  private encounter!: EncounterInstance;
  private scenario!: Scenario;
  private structure!: EpochStructure;
  private P!: Palette;

  private selectedEvidence = new Set<string>();
  private confidence: Confidence = null;
  private selectedAnswer: number | null = null;
  private selectedCard: string | null = null;
  private cardStack: string[] = [];
  private backdrop: Phaser.GameObjects.GameObject[] = [];
  /** Эпоха до начисления награды — нужна, чтобы не потерять переход после level-up. */
  private epochBeforeReward: EpochId | null = null;
  private verdictFactor: 'A' | 'B' | null = null;
  private blindOpened = false;
  private step: Step = 'investigate';
  private submitted = false;

  private browser?: SourceBrowser;
  private answerGrid?: AnswerGrid;
  private feedback?: FeedbackOverlay;
  private evidenceStrip?: Phaser.GameObjects.Container;
  private ctaButton?: Phaser.GameObjects.Container;
  private expandLayer?: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'ArenaScene' });
  }

  private get progress() {
    return gameState.progress;
  }

  create(): void {
    this.loadEncounter();
    renderBackground(this, this.P);
    // Всё, что нарисовано до этого момента, — статичный фон.
    // Пересборка экрана снимает только объекты, добавленные после него.
    this.backdrop = this.children.list.slice();
    sceneEnter(this);

    this.buildLayout();
  }

  /** Удаляет содержимое экрана, оставляя фон нетронутым. */
  private clearContent(): void {
    for (const obj of this.children.list.slice()) {
      if (!this.backdrop.includes(obj)) obj.destroy();
    }
  }

  /**
   * Готовит следующую задачу: сбрасывает выбор игрока и собирает встречу
   * по детерминированному seed. Не трогает сцену — вызывается и при старте,
   * и при переходе к новой задаче без перезапуска (аудит A2).
   */
  private loadEncounter(): void {
    this.resetState();

    const p = this.progress;
    this.P = buildPalette(p.epoch);
    this.structure = structureForLevel(p.epoch as EpochId, p.level);

    // Детерминированный seed: та же задача воспроизводится по тем же аргументам.
    const seed = encounterSeed(localUserId(), p.level, gameState.taskIndex);
    this.encounter = mutate(this.pickTemplate(), seed);
    // Контент ранних стадий иногда содержит меньше карт, чем глобальная эпоха
    // требует от плана. Без ограничения такую встречу невозможно завершить.
    this.structure.stackSlots = effectiveStackSlots(
      this.structure.stackSlots,
      this.encounter.skills,
    );
    this.scenario = buildScenario(this.encounter);
  }

  private resetState(): void {
    this.selectedEvidence.clear();
    this.confidence = null;
    this.selectedAnswer = null;
    this.selectedCard = null;
    this.cardStack = [];
    this.epochBeforeReward = null;
    this.verdictFactor = null;
    this.blindOpened = false;
    this.step = 'investigate';
    this.submitted = false;
    this.browser = undefined;
    this.answerGrid = undefined;
    this.feedback = undefined;
    this.evidenceStrip = undefined;
    this.ctaButton = undefined;
    this.expandLayer = undefined;
  }

  /** Выбор шаблона: приоритет — незакрытая ошибка, затем ближайшая стадия. */
  private pickTemplate() {
    const open = this.progress.errorScroll.find((e) => !e.closed);
    if (open) {
      const enemy = enemyById[open.enemy];
      const stage =
        enemy?.stages.find((s) => s.level <= this.progress.level)?.stage ??
        enemy?.stages[0].stage ??
        1;
      return templateFor(open.enemy, stage);
    }
    const lvl = this.progress.level;
    let best: { enemyId: string; stageNum: number; dist: number } | null = null;
    for (const en of enemies) {
      for (const s of en.stages) {
        if (lvl >= s.level - 6 && lvl <= s.level + 6) {
          const dist = Math.abs(lvl - s.level);
          if (!best || dist < best.dist) best = { enemyId: en.id, stageNum: s.stage, dist };
        }
      }
    }
    if (best) return templateFor(best.enemyId, best.stageNum);
    const cand = enemies[lvl % enemies.length];
    const st = cand.stages.find((s) => s.level <= lvl)?.stage ?? cand.stages[0].stage;
    return templateFor(cand.id, st);
  }

  // ── Каркас экрана ────────────────────────────────────────────────────

  private buildLayout(): void {
    renderTopBar(this, gameState);
    renderBottomNav(this, 'ArenaScene', navForEpoch(this.progress.level));

    const flow = new Flow(CHROME.topBar + SP.md, SP.md);
    const bottomLimit = CANVAS.h - bottomNavHeight() - SP.md;
    // Место под нижний блок действия
    const ctaH = HIT.comfortable + SP.md;
    // Полоса улик — полноценная мобильная плашка, а не 30px-декорация.
    // Её визуальная высота совпадает с минимальной зоной касания.
    const evidenceH = HIT.min;

    if (this.step === 'investigate') {
      // Референсный принцип: один сильный бриф → одно рабочее окно → действие.
      // Погода, вопрос и скрытый противник больше не рассыпаны на три плашки.
      const briefingMax = bottomLimit - flow.y - 200 - ctaH - evidenceH - SP.md * 2;
      this.renderBriefing(flow, briefingMax, true);
      const browserH = Math.max(
        200,
        bottomLimit - flow.y - ctaH - evidenceH - SP.md * 2,
      );
      this.renderBrowser(flow, browserH);
      this.renderEvidenceStrip(flow);
      this.renderInvestigateCta(bottomLimit - ctaH);
    } else {
      // На втором шаге тот же бриф остаётся узнаваемым, но становится компактнее.
      this.renderBriefing(flow, 112, false);
      this.renderEvidenceSummary(flow);
      this.renderDecision(flow, bottomLimit);
    }
  }

  /**
   * Единый бриф встречи. Это сохраняет структуру исходного концепта:
   * крупная ситуация сверху, рабочий терминал в центре, действия снизу.
   */
  private renderBriefing(flow: Flow, maxH: number, showThreat: boolean): void {
    const p = this.P;
    const q = this.encounter;
    const w = CANVAS.w - GUTTER * 2;
    const textW = w - SP.lg * 2;
    let style = TX.bodyLg(p, { color: p.inkText, wrap: textW });
    let probe = this.add.text(0, 0, q.question, style).setVisible(false);
    let textH = probe.height;
    probe.destroy();

    const footerH = showThreat ? 30 : 0;
    const minH = showThreat ? 116 : 88;
    const limit = Math.max(minH, maxH);
    if (textH + 56 + footerH > limit) {
      style = TX.body(p, { color: p.inkText, wrap: textW });
      probe = this.add.text(0, 0, q.question, style).setVisible(false);
      textH = probe.height;
      probe.destroy();
    }

    const boxH = Math.min(limit, Math.max(minH, textH + 56 + footerH));
    const y = flow.take(boxH);
    const box = panel(this, GUTTER, y, w, boxH, p, {
      fill: p.paperN,
      stroke: p.accentN,
      radius: RADIUS.md,
    });
    enterPanel(this, box as never);

    const stepLabel = this.step === 'investigate' ? T.arena.investigateStep : T.arena.decideStep;
    this.add.text(
      GUTTER + SP.lg,
      y + SP.md,
      `${stepLabel}  ·  ${q.ticker}  ·  ${q.timeframe}`,
      TX.code(p, { color: p.accent }),
    );
    this.add.text(GUTTER + SP.lg, y + 34, q.question, style);

    if (showThreat) {
      const lineY = y + boxH - 30;
      const g = this.add.graphics();
      g.lineStyle(1, p.borderN, 1);
      g.lineBetween(GUTTER + SP.lg, lineY - SP.xs, GUTTER + w - SP.lg, lineY - SP.xs);
      g.fillStyle(p.insetN, 1);
      g.fillCircle(GUTTER + SP.lg + 10, lineY + 9, 10);
      this.add
        .text(GUTTER + SP.lg + 10, lineY + 9, '?', TX.caption(p, { color: p.accent }))
        .setOrigin(0.5);
      this.add.text(
        GUTTER + SP.lg + 28,
        lineY + 9,
        `${T.arena.unknownEnemy} · ${weatherLabel(this.progress.weather)}`,
        TX.caption(p, { color: p.inkSub }),
      ).setOrigin(0, 0.5);
    }
  }

  private renderBrowser(flow: Flow, height: number): void {
    const y = flow.take(height);
    this.browser = new SourceBrowser(this, {
      y,
      height,
      palette: this.P,
      structure: this.structure,
      encounter: this.encounter,
      scenario: this.scenario,
      blindCost: balanceConfig.riskBudget.blindSourceCost,
      canAffordBlind: this.progress.riskBudget >= balanceConfig.riskBudget.blindSourceCost,
      blindOpened: this.blindOpened,
      onEvidenceToggle: (id) => this.toggleEvidence(id),
      onBlindOpen: () => this.openBlindSource(),
      onExpand: (src) => this.openExpanded(src),
    });
  }

  /** Полоса найденных доказательств — обновляется на месте, без «стирания» поверх. */
  private renderEvidenceStrip(flow: Flow): void {
    const y = flow.take(HIT.min, SP.sm);
    this.evidenceStrip = this.add.container(0, y);
    this.refreshEvidenceStrip();
  }

  private refreshEvidenceStrip(): void {
    const c = this.evidenceStrip;
    if (!c) return;
    c.removeAll(true);
    const p = this.P;
    const w = CANVAS.w - GUTTER * 2;
    const need = this.structure.evidenceRequired;
    const have = this.selectedEvidence.size;
    const ok = have >= need;

    const g = this.add.graphics();
    g.fillStyle(ok ? p.hoverN : p.surfaceN, 1);
    g.fillRoundedRect(GUTTER, 0, w, HIT.min, RADIUS.sm);
    g.lineStyle(ok ? 2 : 1, ok ? p.goodN : p.borderN, 1);
    g.strokeRoundedRect(GUTTER, 0, w, HIT.min, RADIUS.sm);
    c.add(g);

    c.add(
      this.add
        .text(GUTTER + SP.md, HIT.min / 2, T.arena.evidenceTitle, TX.caption(p, { color: p.sub }))
        .setOrigin(0, 0.5),
    );
    const status = have === 0 ? T.arena.evidenceNeed(need) : T.arena.evidencePicked(have);
    c.add(
      this.add
        .text(GUTTER + w - SP.md, HIT.min / 2, status, {
          ...TX.caption(p, { color: ok ? p.good : p.muted }),
        })
        .setOrigin(1, 0.5),
    );
  }

  /** Нижняя кнопка на шаге разбора. */
  private renderInvestigateCta(y: number): void {
    const p = this.P;
    const w = CANVAS.w - GUTTER * 2;
    const ready = this.selectedEvidence.size >= this.structure.evidenceRequired;
    this.ctaButton?.destroy();
    this.ctaButton = button(
      this,
      GUTTER,
      y,
      ready ? T.arena.answerTitle : T.arena.needEvidenceFirst,
      p,
      () => {
        this.step = 'decide';
        this.rebuild();
      },
      {
        width: w,
        disabled: !ready,
        hint: ready ? undefined : this.structure.hintLine ? T.arena.evidenceEmpty : undefined,
      },
    );
  }

  /** На шаге решения показываем найденные улики компактной сводкой. */
  private renderEvidenceSummary(flow: Flow): void {
    const p = this.P;
    const w = CANVAS.w - GUTTER * 2;
    const labels = [...this.selectedEvidence]
      .map((id) => this.encounter.mutatedEvidence.find((z) => z.id === id)?.label ?? id)
      .join(' · ');
    const style = TX.caption(p, { color: p.sub, wrap: w - SP.md * 2 - 80 });
    const probe = this.add.text(0, 0, labels, style).setVisible(false);
    // Сводка — вспомогательный блок: максимум две строки, дальше многоточие.
    const h = Phaser.Math.Clamp(probe.height + SP.md * 2, 44, 62);
    probe.destroy();

    const y = flow.take(h);
    const g = this.add.graphics();
    g.fillStyle(p.surfaceN, 1);
    g.fillRoundedRect(GUTTER, y, w, h, RADIUS.sm);
    g.lineStyle(1, p.goodN, 1);
    g.strokeRoundedRect(GUTTER, y, w, h, RADIUS.sm);
    this.add.text(GUTTER + SP.md, y + SP.sm, labels, style);

    const back = this.add
      .text(GUTTER + w - SP.md, y + h / 2, T.common.back, {
        ...TX.caption(p, { color: p.accent }),
      })
      .setOrigin(1, 0.5);
    const zone = this.add
      .rectangle(GUTTER + w - 80, y, 80, Math.max(h, HIT.min), 0x000000, 0)
      .setOrigin(0)
      .setInteractive();
    zone.on('pointerdown', () => {
      haptic('light');
      this.step = 'investigate';
      this.rebuild();
    });
    void back;
  }

  /** Блок решения: карты → вердикт → ответы → ставка. */
  private renderDecision(flow: Flow, bottomLimit: number): void {
    const p = this.P;
    const cards = buildCardViews(
      this.encounter,
      this.structure,
      (id) => gameState.isCardUnlocked(id),
      (id) => this.progress.cardRanks[id] ?? 0,
    );
    const railH = CardRail.heightFor(this.structure);
    const railY = flow.take(railH);
    new CardRail(
      this,
      railY,
      p,
      this.structure,
      cards,
      (active, stack) => {
        this.selectedCard = active;
        this.cardStack = stack;
        this.refreshSubmitState();
      },
      { active: this.selectedCard, stack: this.cardStack },
    );

    // Вердикт конфликта — до выбора действия
    const needVerdict = this.structure.verdict && !!this.encounter.verdict;
    if (needVerdict && !this.verdictFactor) {
      const vy = flow.take(VerdictRow.height());
      new VerdictRow(this, vy, p, this.encounter, (v) => {
        this.verdictFactor = v;
        this.rebuild();
      });
      return;
    }
    if (needVerdict && this.verdictFactor) {
      const chosen =
        this.verdictFactor === 'A'
          ? this.encounter.verdict!.factorA
          : this.encounter.verdict!.factorB;
      const cy = flow.take(20, SP.sm);
      this.add.text(GUTTER, cy, T.arena.verdictChosen(chosen), {
        ...TX.caption(p, { color: p.good, wrap: CANVAS.w - GUTTER * 2 }),
      });
    }

    // План из карт вместо выбора одного ответа
    if (this.structure.stackSlots > 0) {
      const by = Math.min(flow.take(HIT.comfortable), bottomLimit - HIT.comfortable);
      const ready = this.cardStack.length >= this.structure.stackSlots;
      this.ctaButton = button(
        this,
        GUTTER,
        by,
        ready ? T.arena.submitPlan : T.arena.needPlan,
        p,
        () => this.submitPlan(),
        { width: CANVAS.w - GUTTER * 2, disabled: !ready },
      );
      return;
    }

    // Обычные варианты ответа. Прижимаем сетку к нижней границе, если
    // предыдущие блоки заняли слишком много: кнопки должны оставаться
    // доступными, а не уезжать под навигацию.
    const gridH = AnswerGrid.heightFor(this.encounter.mutatedAnswers.length);
    const wanted = flow.take(gridH);
    const gy = Math.min(wanted, bottomLimit - gridH);
    this.answerGrid = new AnswerGrid(this, gy, p, this.encounter, (i) => this.pickAnswer(i));
  }

  // ── Взаимодействие ───────────────────────────────────────────────────

  private toggleEvidence(id: string): void {
    const need = this.structure.evidenceRequired;
    if (this.selectedEvidence.has(id)) {
      this.selectedEvidence.delete(id);
    } else {
      // достигли лимита — вытесняем самую старую
      if (this.selectedEvidence.size >= need) {
        const first = [...this.selectedEvidence][0];
        this.selectedEvidence.delete(first);
      }
      this.selectedEvidence.add(id);
    }
    this.browser?.setSelected(new Set(this.selectedEvidence));
    this.refreshEvidenceStrip();
    // кнопка меняет состояние без полной пересборки экрана
    const ctaY = CANVAS.h - bottomNavHeight() - SP.md - HIT.comfortable - SP.md;
    if (this.step === 'investigate') this.renderInvestigateCta(ctaY);
  }

  private openBlindSource(): void {
    const cost = balanceConfig.riskBudget.blindSourceCost;
    if (this.progress.riskBudget < cost) {
      haptic('warn');
      return;
    }
    gameState.changeBudget(-cost);
    this.blindOpened = true;
    this.rebuild();
  }

  /** Источник на весь экран — фокус на одном действии (аудит T2). */
  private openExpanded(source: SourceId): void {
    const p = this.P;
    this.expandLayer?.destroy();
    const layer = this.add.container(0, 0).setDepth(900);
    this.expandLayer = layer;

    const shade = this.add
      .rectangle(0, 0, CANVAS.w, CANVAS.h, p.bgN, 0.99)
      .setOrigin(0)
      .setInteractive();
    layer.add(shade);

    const headY = SP.xl;
    layer.add(this.add.text(GUTTER, headY, SOURCE_TITLES[source], TX.title(p, { color: p.text })));

    const closeBtn = button(
      this,
      CANVAS.w - GUTTER - 120,
      headY - SP.sm,
      T.arena.collapse,
      p,
      () => {
        layer.destroy();
        this.expandLayer = undefined;
      },
      { width: 120, variant: 'secondary', height: HIT.min },
    );
    layer.add(closeBtn);

    const top = headY + 48;
    const full = new SourceBrowser(this, {
      y: top,
      height: CANVAS.h - top - SP.xl,
      palette: p,
      structure: { ...this.structure, tabs: this.encounter.sources.length },
      encounter: this.encounter,
      scenario: this.scenario,
      blindCost: balanceConfig.riskBudget.blindSourceCost,
      canAffordBlind: this.progress.riskBudget >= balanceConfig.riskBudget.blindSourceCost,
      blindOpened: this.blindOpened,
      onEvidenceToggle: (id) => {
        this.toggleEvidence(id);
        full.setSelected(new Set(this.selectedEvidence));
      },
      onBlindOpen: () => this.openBlindSource(),
      onExpand: () => {
        layer.destroy();
        this.expandLayer = undefined;
      },
    });
    full.setSelected(new Set(this.selectedEvidence));
    layer.add(full.container);
  }

  private pickAnswer(index: number): void {
    if (this.submitted) return;
    if (this.structure.stackSlots === 0 && !this.selectedCard) {
      haptic('warn');
      const notice = this.add
        .text(CANVAS.w / 2, CHROME.topBar + SP.sm, T.arena.pickCardFirst, {
          ...TX.body(this.P, { color: this.P.accent, align: 'center', wrap: CANVAS.w - GUTTER * 2 }),
        })
        .setOrigin(0.5, 0)
        .setDepth(550);
      this.tweens.add({ targets: notice, alpha: 0, delay: 700, duration: 220, onComplete: () => notice.destroy() });
      return;
    }
    // После серии ошибок — короткая пауза «остынь»
    const tilt =
      this.progress.errorScroll.filter((e) => !e.closed).length >=
      balanceConfig.coldHead.tiltThreshold;
    if (tilt && this.selectedAnswer === null) {
      this.selectedAnswer = index;
      this.answerGrid?.setSelected(index);
      this.showColdHead(() => this.afterAnswerPicked(index));
      return;
    }
    this.selectedAnswer = index;
    this.answerGrid?.setSelected(index);
    this.afterAnswerPicked(index);
  }

  private showColdHead(next: () => void): void {
    const p = this.P;
    const msg = this.add
      .text(CANVAS.w / 2, CANVAS.h - bottomNavHeight() - 40, T.arena.coldHead, {
        ...TX.body(p, { color: p.warn, align: 'center', wrap: CANVAS.w - GUTTER * 2 }),
      })
      .setOrigin(0.5, 0)
      .setDepth(500);
    enterPanel(this, msg as never);
    this.time.delayedCall(balanceConfig.coldHead.delayMs, () => {
      msg.destroy();
      next();
    });
  }

  private afterAnswerPicked(index: number): void {
    void index;
    if (this.structure.confidence && !this.confidence) {
      this.showConfidence(() => this.submitAnswer());
      return;
    }
    this.submitAnswer();
  }

  private showConfidence(next: () => void): void {
    const p = this.P;
    const layer = this.add.container(0, 0).setDepth(600);
    const shade = this.add
      .rectangle(0, 0, CANVAS.w, CANVAS.h, p.bgN, 0.9)
      .setOrigin(0)
      .setInteractive();
    layer.add(shade);
    const y = CANVAS.h / 2 - 60;
    const picker = new ConfidencePicker(this, y, p, (c) => {
      this.confidence = c;
      layer.destroy();
      next();
    });
    layer.add(picker.container);
  }

  private refreshSubmitState(): void {
    if (this.step !== 'decide' || this.structure.stackSlots === 0) return;
    // перерисовываем только кнопку подтверждения плана
    const ready = this.cardStack.length >= this.structure.stackSlots;
    const y = this.ctaButton?.y ?? CANVAS.h - bottomNavHeight() - SP.md - HIT.comfortable;
    this.ctaButton?.destroy();
    this.ctaButton = button(
      this,
      GUTTER,
      y,
      ready ? T.arena.submitPlan : T.arena.needPlan,
      this.P,
      () => this.submitPlan(),
      { width: CANVAS.w - GUTTER * 2, disabled: !ready },
    );
  }

  // ── Проверка ответа ──────────────────────────────────────────────────

  private evidenceJustified(): boolean {
    const need = this.structure.evidenceRequired;
    const correctPicked = [...this.selectedEvidence].filter((id) =>
      this.encounter.mutatedEvidence.find((z) => z.id === id && z.isCorrect),
    ).length;
    return correctPicked >= Math.min(need, 1) && this.selectedEvidence.size >= need;
  }

  private submitPlan(): void {
    if (this.submitted) return;
    const correctOrder = this.encounter.skills.slice(0, this.structure.stackSlots);
    const isCorrect =
      this.cardStack.length === correctOrder.length &&
      this.cardStack.every((v, i) => v === correctOrder[i]);
    if (this.structure.confidence && !this.confidence) {
      this.showConfidence(() => this.finish(isCorrect));
      return;
    }
    this.finish(isCorrect);
  }

  private submitAnswer(): void {
    if (this.selectedAnswer === null || this.submitted) return;
    // Карта — часть решения, а не декоративная полка: верное действие без
    // подходящего инструмента считается неполным разбором.
    const cardFits = cardChoiceFits(this.encounter, this.selectedAnswer, this.selectedCard);
    let isCorrect = this.selectedAnswer === this.encounter.correctAnswer && cardFits;
    // Ошибка в вердикте обнуляет верный выбор действия
    if (this.structure.verdict && this.encounter.verdict) {
      if (this.verdictFactor !== this.encounter.verdict.correctFactor) isCorrect = false;
    }
    this.finish(isCorrect);
  }

  private finish(isCorrect: boolean): void {
    if (this.submitted) return;
    this.submitted = true;
    const isJustified = this.evidenceJustified();
    const verdict = scoreEncounter({
      domain: this.encounter.domain,
      isCorrect,
      isJustified,
      confidence: this.confidence,
      level: this.progress.level,
      epoch: this.progress.epoch,
      streak: this.progress.streak,
    });
    this.applyResult(verdict, isCorrect, isJustified);
  }

  private applyResult(v: Verdict, isCorrect: boolean, isJustified: boolean): void {
    this.epochBeforeReward = getEpochForLevel(this.progress.level);
    const confVal = this.confidence === 'high' ? 0.9 : this.confidence === 'mid' ? 0.65 : 0.35;
    gameState.addCalibration(confVal, isCorrect ? 1 : 0);

    if (!isCorrect || !isJustified) {
      gameState.pushError(
        this.encounter.enemyId,
        this.encounter.atoms[0] ?? this.encounter.skills[0] ?? 'C1',
        [...this.selectedEvidence].join(', ') || 'доказательство не найдено',
      );
      gameState.resetStreak();
    } else {
      const open = this.progress.errorScroll.find(
        (e) => e.enemy === this.encounter.enemyId && !e.closed,
      );
      if (open) gameState.closeError(open.id);
      gameState.bumpStreak();
    }

    gameState.addXp(v.xp);
    gameState.addCoins(v.coins);
    gameState.advanceTask();
    const budget = gameState.changeBudget(v.budgetDelta);

    if (budget <= 0) {
      const restore = 40;
      showDrawdown(this, this.P, restore, () => {
        gameState.changeBudget(restore);
        this.restartEncounter();
      });
      return;
    }
    this.showFeedback(v, isCorrect, isJustified);
  }

  private recordEnemyStage(enemyId: string): void {
    const cur = this.progress.enemyStagesReached[enemyId] ?? 0;
    if (this.encounter.stage > cur) {
      this.progress.enemyStagesReached[enemyId] = this.encounter.stage;
      gameState.save();
    }
  }

  private showFeedback(v: Verdict, isCorrect: boolean, isJustified: boolean): void {
    // В «Системе» отдельного опознания уже нет, но победа всё равно должна
    // продвигать трофей кампании.
    if (this.structure.identifyOptions <= 0 && isCorrect && isJustified) {
      this.recordEnemyStage(this.encounter.enemyId);
    }
    this.feedback = new FeedbackOverlay(this, {
      palette: this.P,
      structure: this.structure,
      encounter: this.encounter,
      scenario: this.scenario,
      verdict: v,
      isCorrect,
      isJustified,
      onIdentified: (ok, enemyId) => {
        if (ok) this.recordEnemyStage(enemyId);
      },
      onNext: () => {
        const before = this.epochBeforeReward ?? getEpochForLevel(this.progress.level);
        const after = getEpochForLevel(this.progress.level);
        if (before !== after) showEpochTransition(this, after, () => this.restartEncounter());
        else this.restartEncounter();
      },
    });
  }

  /**
   * Пересборка содержимого экрана. Фон не трогаем: он статичен и его повторная
   * отрисовка давала заметное мигание при каждой смене шага и задачи.
   */
  private rebuild(): void {
    this.browser?.destroy();
    this.feedback?.destroy();
    this.expandLayer?.destroy();
    this.clearContent();
    this.tweens.killAll();
    this.time.removeAllEvents();
    this.buildLayout();
  }

  /** Следующая задача без перезапуска сцены: фон и камера остаются на месте. */
  private restartEncounter(): void {
    this.loadEncounter();
    this.rebuild();
  }

}
