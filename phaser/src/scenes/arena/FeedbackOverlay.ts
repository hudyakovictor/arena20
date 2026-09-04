// Итог встречи: проигрыш вперёд → вердикт → опознание → тень → награда.
// Всё живёт в одном контейнере и уничтожается целиком (аудит P1: без утечек).

import Phaser from 'phaser';
import type { EncounterInstance } from '../../types';
import type { Scenario } from '../../engine/scenarioGen';
import type { EpochStructure } from '../../config/epochStructure';
import type { Palette } from '../../ui/palette';
import type { Verdict } from '../../engine/scoring';
import { CANVAS, GUTTER, HIT, RADIUS, SP } from '../../ui/tokens';
import * as TX from '../../ui/text';
import { T } from '../../ui/copy';
import { button, panel } from '../../ui/widgets';
import { CandleChart } from '../../ui/CandleChart';
import { countTo, enterPanel, fadeIn } from '../../ui/motion';
import { haptic, playSfx } from '../../ui/feedbackFx';
import { enemies, enemyById } from '../../data/enemies';
import { Flow } from '../../ui/layout';

export interface FeedbackOpts {
  palette: Palette;
  structure: EpochStructure;
  encounter: EncounterInstance;
  scenario: Scenario;
  verdict: Verdict;
  isCorrect: boolean;
  isJustified: boolean;
  onIdentified: (correct: boolean, enemyId: string) => void;
  onNext: () => void;
}

export class FeedbackOverlay {
  private scene: Phaser.Scene;
  private opts: FeedbackOpts;
  private root: Phaser.GameObjects.Container;
  private chart?: CandleChart;
  private flow: Flow;
  private identified = false;

  constructor(scene: Phaser.Scene, opts: FeedbackOpts) {
    this.scene = scene;
    this.opts = opts;
    this.root = scene.add.container(0, 0).setDepth(1000);
    this.flow = new Flow(0);
    this.build();
  }

  private build(): void {
    const p = this.opts.palette;
    // затемнение — перехватывает касания под собой
    const shade = this.scene.add
      .rectangle(0, 0, CANVAS.w, CANVAS.h, p.bgN, 0.97)
      .setOrigin(0)
      .setInteractive();
    this.root.add(shade);
    fadeIn(this.scene, shade, { to: 0.97 });

    this.flow = new Flow(SP.xl, SP.md);
    const w = CANVAS.w - GUTTER * 2;

    // ── Заголовок результата ──
    const { isCorrect, isJustified } = this.opts;
    const title = !isCorrect
      ? T.feedback.wrong
      : !isJustified
        ? T.feedback.correctUnjustified
        : T.feedback.correct;
    const color = !isCorrect ? p.bad : !isJustified ? p.warn : p.good;
    const sub = !isCorrect
      ? T.feedback.wrongSub
      : !isJustified
        ? T.feedback.unjustifiedSub
        : T.feedback.correctSub;

    const ty = this.flow.take(36, SP.xs);
    const titleText = this.scene.add
      .text(CANVAS.w / 2, ty, title, TX.display(p, { color, align: 'center' }))
      .setOrigin(0.5, 0);
    this.root.add(titleText);
    enterPanel(this.scene, titleText as never);

    const sy = this.flow.take(40);
    this.root.add(
      this.scene.add
        .text(CANVAS.w / 2, sy, sub, {
          ...TX.body(p, { color: p.sub, align: 'center', wrap: w }),
        })
        .setOrigin(0.5, 0),
    );

    playSfx(isCorrect && isJustified ? 'correct' : 'wrong');
    haptic(isCorrect && isJustified ? 'success' : 'warn');

    // ── Проигрыш вперёд ──
    const chartY = this.flow.take(140);
    this.root.add(
      this.scene.add.text(GUTTER, chartY, T.feedback.playForward, TX.caption(p)),
    );
    const frame = panel(this.scene, GUTTER, chartY + 20, w, 116, p, { fill: p.insetN });
    this.root.add(frame);
    this.chart = new CandleChart(this.scene, {
      x: GUTTER + SP.sm,
      y: chartY + 20 + SP.sm,
      width: w - SP.sm * 2,
      height: 100,
      palette: p,
      highlightEvidence: false,
      showVolume: false,
      parent: this.root,
    });
    this.chart.setData(this.opts.scenario.candles, new Set());
    this.chart.playForward(this.opts.scenario.forward(isCorrect), () => {
      this.chart?.markOutcome(isCorrect);
      const capY = chartY + 20 + 116 + SP.xs;
      const cap = this.scene.add
        .text(
          CANVAS.w / 2,
          capY,
          isCorrect ? T.feedback.forwardCorrect : T.feedback.forwardWrong,
          { ...TX.caption(p, { color: p.sub, align: 'center', wrap: w }) },
        )
        .setOrigin(0.5, 0);
      this.root.add(cap);
      fadeIn(this.scene, cap);
      this.showIdentify();
    });
  }

  /** Опознание противника — если эпоха его требует. */
  private showIdentify(): void {
    const p = this.opts.palette;
    const st = this.opts.structure;
    if (st.identifyOptions <= 0 || this.identified) {
      this.showShadowAndReward();
      return;
    }
    const w = CANVAS.w - GUTTER * 2;
    const y = this.flow.take(24, SP.xs);
    const head = this.scene.add.text(GUTTER, y, T.feedback.identifyTitle, TX.body(p, { color: p.text }));
    this.root.add(head);
    fadeIn(this.scene, head);

    const realId = this.opts.encounter.enemyId;
    const real = enemyById[realId];
    const pool = enemies.filter((e) => e.domain === real?.domain && e.id !== realId);
    const count = Math.min(st.identifyOptions, 4);
    const options = [real, ...pool.slice(0, count - 1)].filter(Boolean);
    // перемешиваем детерминированно по seed, чтобы верный не был всегда первым
    const shuffled = [...options].sort(
      (a, b) => ((this.opts.encounter.seed + a.id.charCodeAt(2)) % 7) - ((this.opts.encounter.seed + b.id.charCodeAt(2)) % 7),
    );

    const rowY = this.flow.take(56 + SP.md);
    const optW = (w - SP.sm * (shuffled.length - 1)) / shuffled.length;
    const cards: Phaser.GameObjects.GameObject[] = [];
    shuffled.forEach((e, i) => {
      const x = GUTTER + i * (optW + SP.sm);
      const g = this.scene.add.graphics();
      g.fillStyle(p.surfaceN, 1);
      g.fillRoundedRect(x, rowY, optW, 56, RADIUS.md);
      g.lineStyle(1, p.borderN, 1);
      g.strokeRoundedRect(x, rowY, optW, 56, RADIUS.md);
      this.root.add(g);
      cards.push(g);
      const label = this.scene.add
        .text(x + optW / 2, rowY + 28, e.name, {
          ...TX.caption(p, { color: p.text, align: 'center', wrap: optW - SP.sm }),
        })
        .setOrigin(0.5);
      this.root.add(label);
      cards.push(label);

      const zone = this.scene.add
        .rectangle(x, rowY, optW, Math.max(56, HIT.min), 0x000000, 0)
        .setOrigin(0)
        .setInteractive();
      zone.on('pointerdown', () => {
        if (this.identified) return;
        this.identified = true;
        const ok = e.id === realId;
        haptic(ok ? 'success' : 'warn');
        playSfx(ok ? 'correct' : 'wrong');
        const msg = ok
          ? T.feedback.identifyRight(real.name)
          : T.feedback.identifyWrong(e.name, real.name);
        const res = this.scene.add
          .text(CANVAS.w / 2, rowY + 56 + SP.sm, msg, {
            ...TX.caption(p, { color: ok ? p.good : p.bad, align: 'center', wrap: w }),
          })
          .setOrigin(0.5, 0);
        this.root.add(res);
        fadeIn(this.scene, res);
        this.opts.onIdentified(ok, realId);
        this.scene.time.delayedCall(700, () => this.showShadowAndReward());
      });
      this.root.add(zone);
      cards.push(zone);
    });
    void cards;
  }

  /** Как ответили другие + награда. */
  private showShadowAndReward(): void {
    const p = this.opts.palette;
    const w = CANVAS.w - GUTTER * 2;
    const enc = this.opts.encounter;

    // ── Тень арены ──
    const sy = this.flow.take(24, SP.xs);
    const head = this.scene.add.text(GUTTER, sy, T.feedback.shadowTitle, TX.body(p, { color: p.text }));
    this.root.add(head);
    fadeIn(this.scene, head);

    const barsY = this.flow.take(48);
    const dist = this.opts.scenario.shadow;
    const barW = (w - SP.sm * (dist.length - 1)) / dist.length;
    dist.forEach((pct, i) => {
      const x = GUTTER + i * (barW + SP.sm);
      const isRight = i === enc.correctAnswer;
      const g = this.scene.add.graphics();
      g.fillStyle(p.insetN, 1);
      g.fillRoundedRect(x, barsY, barW, 10, 5);
      g.fillStyle(isRight ? p.goodN : p.mutedN, 1);
      g.fillRoundedRect(x, barsY, Math.max(4, (barW * pct) / 100), 10, 5);
      this.root.add(g);
      this.root.add(
        this.scene.add
          .text(x + barW / 2, barsY + 16, `${pct}%`, TX.caption(p, { color: isRight ? p.good : p.muted }))
          .setOrigin(0.5, 0),
      );
    });

    // ── Награда ──
    const ry = this.flow.take(84);
    const box = panel(this.scene, GUTTER, ry, w, 76, p, { fill: p.surfaceN });
    this.root.add(box);
    enterPanel(this.scene, box as never);

    const v = this.opts.verdict;
    const items: [string, number, string][] = [
      [T.feedback.xp, v.xp, p.accent],
      [T.feedback.coins, v.coins, p.text],
      [T.feedback.budget, v.budgetDelta, v.budgetDelta >= 0 ? p.good : p.bad],
    ];
    const colW = w / 3;
    items.forEach(([label, value, color], i) => {
      const x = GUTTER + i * colW + colW / 2;
      this.root.add(
        this.scene.add.text(x, ry + SP.md, label, TX.caption(p)).setOrigin(0.5, 0),
      );
      const numText = this.scene.add
        .text(x, ry + SP.md + 20, '0', TX.numLg(p, { color }))
        .setOrigin(0.5, 0);
      this.root.add(numText);
      countTo(this.scene, numText, 0, value, (n) => (n > 0 ? `+${n}` : String(n)));
    });
    if (v.xp > 0) playSfx('reward');

    if (!this.opts.isJustified) {
      const ny = this.flow.take(20, SP.xs);
      this.root.add(
        this.scene.add
          .text(CANVAS.w / 2, ny, T.feedback.noReward, {
            ...TX.caption(p, { color: p.warn, align: 'center', wrap: w }),
          })
          .setOrigin(0.5, 0),
      );
    }

    // ── Дальше ──
    const by = Math.min(this.flow.take(HIT.comfortable), CANVAS.h - 120);
    const btn = button(this.scene, GUTTER, by, T.feedback.next, p, () => this.opts.onNext(), {
      width: w,
    });
    this.root.add(btn);
    enterPanel(this.scene, btn);
  }

  destroy(): void {
    this.chart?.destroy();
    this.root.destroy();
  }
}
