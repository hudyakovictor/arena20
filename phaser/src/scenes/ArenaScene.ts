// SIGNAL ARENA — экран встречи.
// Сцена только компонует блоки; вся отрисовка живёт в компонентах
// (SourceBrowser, CardRail, AnswerGrid, FeedbackOverlay) — аудит A1.
// Состояние обновляется точечно, без scene.restart() — аудит A2.

import Phaser from 'phaser';
import { gameState } from '../state/GameState';
import { balanceConfig } from '../config/balanceConfig';
import { epochOf, getEpochForLevel } from '../config/epochConfig';
import { structureForLevel, type EpochStructure } from '../config/epochStructure';
import { templateFor } from '../data/templates';
import { mutate } from '../engine/mutator';
import { scoreEncounter, type Verdict } from '../engine/scoring';
import { enemies, enemyById } from '../data/enemies';
import { encounterSeed, localUserId } from '../engine/seed';
import { buildScenario, type Scenario } from '../engine/scenarioGen';
import type { EncounterInstance, Confidence, SourceId, EpochId } from '../types';
import { buildPalette, type Palette } from '../ui/palette';
import { CANVAS, CHROME, DUR, GUTTER, HIT, RADIUS, SP } from '../ui/tokens';
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
import { sceneEnter, enterPanel, transitionTo } from '../ui/motion';
import { haptic, playSfx } from '../ui/feedbackFx';
import { SourceBrowser } from './arena/SourceBrowser';
import { AnswerGrid, CardRail, ConfidencePicker, VerdictRow, buildCardViews } from './arena/DecisionPanel';
import { FeedbackOverlay } from './arena/FeedbackOverlay';
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
  private cardStack: string[] = [];
  private backdrop: Phaser.GameObjects.GameObject[] = [];
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
  private get epoch() {
    return epochOf(this.progress.level);
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
    this.scenario = buildScenario(this.encounter);
  }

  private resetState(): void {
    this.selectedEvidence.clear();
    this.confidence = null;
    this.selectedAnswer = null;
    this.cardStack = [];
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
    this.renderWeather(flow);
    this.renderQuestion(flow);
    this.renderThreat(flow);

    const bottomLimit = CANVAS.h - bottomNavHeight() - SP.md;
    // Место под нижний блок действия
    const ctaH = HIT.comfortable + SP.md;
    const evidenceH = 34;

    if (this.step === 'investigate') {
      const browserH = Math.max(
        200,
        bottomLimit - flow.y - ctaH - evidenceH - SP.md * 2,
      );
      this.renderBrowser(flow, browserH);
      this.renderEvidenceStrip(flow);
      this.renderInvestigateCta(bottomLimit - ctaH);
    } else {
      this.renderEvidenceSummary(flow);
      this.renderDecision(flow, bottomLimit);
    }
  }

  private renderWeather(flow: Flow): void {
    const p = this.P;
    const y = flow.take(20, SP.sm);
    const label = `${T.weather.label}: ${weatherLabel(this.progress.weather)}`;
    this.add.text(GUTTER, y, label, TX.caption(p, { color: p.sub, wrap: CANVAS.w - GUTTER * 2 }));
  }

  private renderQuestion(flow: Flow): void {
    const p = this.P;
    const q = this.encounter;
    const w = CANVAS.w - GUTTER * 2;
    const style = TX.bodyLg(p, { color: p.text, wrap: w - SP.lg * 2 });
    const probe = this.add.text(0, 0, q.question, style).setVisible(false);
    const textH = probe.height;
    probe.destroy();

    const boxH = textH + SP.lg * 2 + 18;
    const y = flow.take(boxH);
    const box = panel(this, GUTTER, y, w, boxH, p, {
      fill: p.paperN,
      stroke: p.accentN,
      radius: RADIUS.md,
    });
    enterPanel(this, box as never);
    this.add.text(
      GUTTER + SP.lg,
      y + SP.md,
      `${T.arena.situation} · ${q.ticker} · ${q.timeframe}`,
      TX.code(p, { color: p.inkSub }),
    );
    this.add.text(GUTTER + SP.lg, y + SP.md + 20, q.question, {
      ...style,
      color: p.inkText,
    });
  }

  private renderThreat(flow: Flow): void {
    const p = this.P;
    const w = CANVAS.w - GUTTER * 2;
    const h = 52;
    const y = flow.take(h);
    const box = panel(this, GUTTER, y, w, h, p, { fill: p.surfaceN, stroke: p.strongN });
    enterPanel(this, box as never);
    const g = this.add.graphics();
    g.fillStyle(p.insetN, 1);
    g.fillCircle(GUTTER + SP.lg + 14, y + h / 2, 16);
    g.lineStyle(1, p.strongN, 1);
    g.strokeCircle(GUTTER + SP.lg + 14, y + h / 2, 16);
    this.add
      .text(GUTTER + SP.lg + 14, y + h / 2, '?', TX.title(p, { color: p.accent }))
      .setOrigin(0.5);
    this.add.text(GUTTER + SP.lg + 40, y + SP.sm, T.arena.unknownEnemy, TX.body(p, { color: p.text }));
    this.add.text(
      GUTTER + SP.lg + 40,
      y + SP.sm + 20,
      T.arena.unknownEnemyHint,
      TX.caption(p, { color: p.muted }),
    );
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
    const y = flow.take(34, SP.sm);
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
    g.fillStyle(p.surfaceN, 1);
    g.fillRoundedRect(GUTTER, 0, w, 30, RADIUS.sm);
    g.lineStyle(1, ok ? p.goodN : p.borderN, 1);
    g.strokeRoundedRect(GUTTER, 0, w, 30, RADIUS.sm);
    c.add(g);

    c.add(this.add.text(GUTTER + SP.md, 8, T.arena.evidenceTitle, TX.caption(p)));
    const status = have === 0 ? T.arena.evidenceNeed(need) : T.arena.evidencePicked(have);
    c.add(
      this.add
        .text(GUTTER + w - SP.md, 8, status, {
          ...TX.caption(p, { color: ok ? p.good : p.muted }),
        })
        .setOrigin(1, 0),
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
    const h = Math.max(44, probe.height + SP.md * 2);
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
    new CardRail(this, railY, p, this.structure, cards, (_active, stack) => {
      this.cardStack = stack;
      this.refreshSubmitState();
    });

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

    // Обычные варианты ответа
    const gridH = AnswerGrid.heightFor(this.encounter.mutatedAnswers.length);
    const gy = flow.take(gridH);
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
    let isCorrect = this.selectedAnswer === this.encounter.correctAnswer;
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
      this.showDrawdown();
      return;
    }
    this.showFeedback(v, isCorrect, isJustified);
  }

  private showFeedback(v: Verdict, isCorrect: boolean, isJustified: boolean): void {
    this.feedback = new FeedbackOverlay(this, {
      palette: this.P,
      structure: this.structure,
      encounter: this.encounter,
      scenario: this.scenario,
      verdict: v,
      isCorrect,
      isJustified,
      onIdentified: (ok, enemyId) => {
        if (!ok) return;
        const cur = this.progress.enemyStagesReached[enemyId] ?? 0;
        if (this.encounter.stage > cur) {
          this.progress.enemyStagesReached[enemyId] = this.encounter.stage;
          gameState.save();
        }
      },
      onNext: () => {
        const before = this.epoch.id;
        const after = getEpochForLevel(this.progress.level);
        if (before !== after) this.showEpochTransition(after);
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

  private showDrawdown(): void {
    const p = this.P;
    const layer = this.add.container(0, 0).setDepth(1200);
    const shade = this.add
      .rectangle(0, 0, CANVAS.w, CANVAS.h, p.bgN, 0.98)
      .setOrigin(0)
      .setInteractive();
    layer.add(shade);
    playSfx('wrong');
    haptic('heavy');

    const w = CANVAS.w - GUTTER * 2;
    const flow = new Flow(CANVAS.h / 2 - 160, SP.md);
    layer.add(
      this.add
        .text(CANVAS.w / 2, flow.take(40), T.drawdown.title, {
          ...TX.display(p, { color: p.bad, align: 'center', wrap: w }),
        })
        .setOrigin(0.5, 0),
    );
    layer.add(
      this.add
        .text(CANVAS.w / 2, flow.take(28), T.drawdown.sub, {
          ...TX.body(p, { color: p.sub, align: 'center', wrap: w }),
        })
        .setOrigin(0.5, 0),
    );
    layer.add(
      this.add
        .text(CANVAS.w / 2, flow.take(80), T.drawdown.body, {
          ...TX.body(p, { color: p.muted, align: 'center', wrap: w }),
        })
        .setOrigin(0.5, 0),
    );
    const restore = 40;
    layer.add(
      button(
        this,
        GUTTER,
        flow.take(HIT.comfortable),
        T.drawdown.cta(restore),
        p,
        () => {
          gameState.changeBudget(restore);
          layer.destroy();
          this.restartEncounter();
        },
        { width: w },
      ),
    );
  }

  private showEpochTransition(to: EpochId): void {
    const p = this.P;
    const nextPal = buildPalette(to);
    const layer = this.add.container(0, 0).setDepth(1200);
    const shade = this.add
      .rectangle(0, 0, CANVAS.w, CANVAS.h, nextPal.bgN, 0.99)
      .setOrigin(0)
      .setInteractive();
    layer.add(shade);
    playSfx('epoch');
    haptic('success');

    const w = CANVAS.w - GUTTER * 2;
    const flow = new Flow(CANVAS.h / 2 - 140, SP.md);
    layer.add(
      this.add
        .text(CANVAS.w / 2, flow.take(24), T.epoch.changed, {
          ...TX.caption(nextPal, { color: nextPal.sub, align: 'center' }),
        })
        .setOrigin(0.5, 0),
    );
    layer.add(
      this.add
        .text(CANVAS.w / 2, flow.take(40), epochOf(this.progress.level).name, {
          ...TX.display(nextPal, { color: nextPal.accent, align: 'center' }),
        })
        .setOrigin(0.5, 0),
    );
    layer.add(
      this.add
        .text(CANVAS.w / 2, flow.take(60), epochOf(this.progress.level).motto, {
          ...TX.body(nextPal, { color: nextPal.text, align: 'center', wrap: w }),
        })
        .setOrigin(0.5, 0),
    );
    layer.add(
      this.add
        .text(CANVAS.w / 2, flow.take(40), T.epoch.sub, {
          ...TX.caption(nextPal, { color: nextPal.muted, align: 'center', wrap: w }),
        })
        .setOrigin(0.5, 0),
    );
    layer.add(
      button(
        this,
        GUTTER,
        flow.take(HIT.comfortable),
        T.epoch.cta,
        nextPal,
        () => {
          layer.destroy();
          this.restartEncounter();
        },
        { width: w },
      ),
    );
    void p;
    void DUR;
    void transitionTo;
  }
}
