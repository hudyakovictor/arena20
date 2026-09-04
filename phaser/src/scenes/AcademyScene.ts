// Академия — теория и карты навыков. Без врагов и торговых решений.
// Список глав скроллится: раньше всё, что ниже 740px, просто не рисовалось.

import Phaser from 'phaser';
import { gameState } from '../state/GameState';
import { cards } from '../data/cards';
import type { SkillCard } from '../types';
import { buildPalette, type Palette } from '../ui/palette';
import { CANVAS, CHROME, GUTTER, HIT, RADIUS, SP } from '../ui/tokens';
import * as TX from '../ui/text';
import { T } from '../ui/copy';
import { button, panel, progressBar } from '../ui/widgets';
import { renderTopBar, renderBottomNav, navForEpoch, renderBackground, bottomNavHeight } from '../ui/shell';
import { sceneEnter, enterPanel, transitionTo, fadeIn } from '../ui/motion';
import { haptic, playSfx } from '../ui/feedbackFx';
import { ScrollList } from '../ui/ScrollList';

const ROW_H = 84;

export class AcademyScene extends Phaser.Scene {
  private P!: Palette;
  private list?: ScrollList;

  constructor() {
    super({ key: 'AcademyScene' });
  }

  create(): void {
    const p = gameState.progress;
    this.P = buildPalette(p.epoch);
    renderBackground(this, this.P);
    sceneEnter(this);
    renderTopBar(this, gameState);

    const headY = CHROME.topBar + SP.md;
    this.add.text(GUTTER, headY, T.academy.title, TX.title(this.P, { color: this.P.text }));
    this.add.text(
      GUTTER,
      headY + 28,
      T.academy.sub,
      TX.caption(this.P, { color: this.P.muted, wrap: CANVAS.w - GUTTER * 2 }),
    );

    const listTop = headY + 56;
    const ctaH = HIT.comfortable + SP.md;
    const listH = CANVAS.h - bottomNavHeight() - ctaH - listTop - SP.md;

    this.list = new ScrollList(this, {
      x: 0,
      y: listTop,
      width: CANVAS.w,
      height: listH,
      itemHeight: ROW_H + SP.sm,
      itemCount: cards.length,
      renderItem: (i, container, y) => this.renderChapter(cards[i], container, y),
    });

    const current = this.currentCard();
    button(
      this,
      GUTTER,
      CANVAS.h - bottomNavHeight() - ctaH,
      T.academy.continue,
      this.P,
      () => this.openLesson(current),
      { width: CANVAS.w - GUTTER * 2 },
    );

    renderBottomNav(this, 'AcademyScene', navForEpoch(p.level));
  }

  private currentCard(): SkillCard {
    return (
      cards.find((c) => gameState.isCardUnlocked(c.id) && (gameState.progress.cardRanks[c.id] ?? 0) < 3) ??
      cards[0]
    );
  }

  private renderChapter(c: SkillCard, container: Phaser.GameObjects.Container, y: number): void {
    const p = this.P;
    const prog = gameState.progress;
    const unlocked = gameState.isCardUnlocked(c.id);
    const rank = prog.cardRanks[c.id] ?? 0;
    const isCurrent = unlocked && rank < 3 && c.id === this.currentCard().id;
    const w = CANVAS.w - GUTTER * 2;

    const accent = !unlocked ? p.borderN : rank >= 3 ? p.warnN : rank >= 2 ? p.goodN : p.accentN;
    const accentS = !unlocked ? p.muted : rank >= 3 ? p.warn : rank >= 2 ? p.good : p.accent;

    const g = this.add.graphics();
    g.fillStyle(unlocked ? (isCurrent ? p.hoverN : p.surfaceN) : p.insetN, 1);
    g.fillRoundedRect(GUTTER, y, w, ROW_H, RADIUS.md);
    g.lineStyle(isCurrent ? 2 : 1, unlocked ? accent : p.borderN, 1);
    g.strokeRoundedRect(GUTTER, y, w, ROW_H, RADIUS.md);
    container.add(g);

    // Номер главы
    const badge = this.add.graphics();
    badge.fillStyle(p.insetN, 1);
    badge.fillRoundedRect(GUTTER + SP.md, y + SP.md, 40, 40, RADIUS.sm);
    badge.lineStyle(1, accent, 1);
    badge.strokeRoundedRect(GUTTER + SP.md, y + SP.md, 40, 40, RADIUS.sm);
    container.add(badge);
    container.add(
      this.add
        .text(GUTTER + SP.md + 20, y + SP.md + 20, String(c.cid), TX.numLg(p, { color: accentS }))
        .setOrigin(0.5),
    );

    // Название и статус
    const tx = GUTTER + SP.md + 40 + SP.md;
    const textW = w - (tx - GUTTER) - SP.md - 70;
    container.add(
      this.add.text(tx, y + SP.md, c.name, {
        ...TX.body(p, { color: unlocked ? p.text : p.muted, wrap: textW }),
      }),
    );

    const total = c.atoms.length;
    const done = rank === 0 ? 0 : Math.min(total, rank * 2);
    container.add(
      this.add.text(
        tx,
        y + SP.md + 22,
        unlocked ? T.academy.progress(done, total) : T.academy.locked(c.unlockLevel),
        TX.caption(p, { color: p.muted }),
      ),
    );
    if (unlocked) {
      container.add(progressBar(this, tx, y + ROW_H - 22, textW, 6, done / total, accent, p));
    }

    // Статус справа
    const status = !unlocked
      ? T.academy.status.locked
      : rank >= 3
        ? T.academy.status.mastered
        : isCurrent
          ? T.academy.status.current
          : T.academy.status.available;
    container.add(
      this.add
        .text(GUTTER + w - SP.md, y + SP.md, status, TX.caption(p, { color: accentS }))
        .setOrigin(1, 0),
    );

    const zone = this.add
      .rectangle(GUTTER, y, w, Math.max(ROW_H, HIT.min), 0x000000, 0)
      .setOrigin(0)
      .setInteractive();
    zone.on('pointerup', () => {
      if (this.list?.didDrag()) return;
      if (!unlocked) {
        haptic('warn');
        return;
      }
      haptic('light');
      playSfx('tap');
      this.openLesson(c);
    });
    container.add(zone);
  }

  /** Короткий урок: чему учит карта + одна проверка. */
  private openLesson(card: SkillCard): void {
    const p = this.P;
    const layer = this.add.container(0, 0).setDepth(800);
    const shade = this.add
      .rectangle(0, 0, CANVAS.w, CANVAS.h, p.bgN, 0.97)
      .setOrigin(0)
      .setInteractive();
    layer.add(shade);
    fadeIn(this, shade, { to: 0.97 });

    const w = CANVAS.w - GUTTER * 2;
    let y = 90;

    layer.add(
      this.add.text(GUTTER, y, T.academy.chapter(card.cid), TX.caption(p, { color: p.accent })),
    );
    y += 22;
    layer.add(this.add.text(GUTTER, y, card.name, TX.title(p, { color: p.text, wrap: w })));
    y += 44;

    layer.add(this.add.text(GUTTER, y, T.academy.lessonSkill, TX.caption(p)));
    y += 20;
    const atom = card.atoms[0];
    const box = panel(this, GUTTER, y, w, 64, p, { fill: p.surfaceN, stroke: p.accentN });
    layer.add(box);
    enterPanel(this, box as never);
    layer.add(
      this.add.text(GUTTER + SP.md, y + SP.md, atom.desc, {
        ...TX.bodyLg(p, { color: p.text, wrap: w - SP.md * 2 }),
      }),
    );
    y += 64 + SP.xl;

    layer.add(this.add.text(GUTTER, y, T.academy.lessonCheck, TX.caption(p)));
    y += 22;
    const question = this.lessonQuestion(card);
    layer.add(
      this.add.text(GUTTER, y, question.q, {
        ...TX.bodyLg(p, { color: p.text, wrap: w }),
      }),
    );
    y += Math.max(44, question.q.length > 40 ? 48 : 28);

    let answered = false;
    const resultY = y + question.options.length * (56 + SP.sm) + SP.sm;
    question.options.forEach((o, i) => {
      const oy = y + i * (56 + SP.sm);
      const g = this.add.graphics();
      g.fillStyle(p.surfaceN, 1);
      g.fillRoundedRect(GUTTER, oy, w, 56, RADIUS.md);
      g.lineStyle(1, p.borderN, 1);
      g.strokeRoundedRect(GUTTER, oy, w, 56, RADIUS.md);
      layer.add(g);
      const label = this.add.text(GUTTER + SP.md, oy + SP.md, o.text, {
        ...TX.body(p, { color: p.text, wrap: w - SP.md * 2 }),
      });
      layer.add(label);

      const zone = this.add
        .rectangle(GUTTER, oy, w, Math.max(56, HIT.min), 0x000000, 0)
        .setOrigin(0)
        .setInteractive();
      zone.on('pointerdown', () => {
        if (answered) return;
        haptic(o.ok ? 'success' : 'warn');
        playSfx(o.ok ? 'correct' : 'wrong');
        g.clear();
        g.fillStyle(o.ok ? p.goodN : p.badN, 0.18);
        g.fillRoundedRect(GUTTER, oy, w, 56, RADIUS.md);
        g.lineStyle(2, o.ok ? p.goodN : p.badN, 1);
        g.strokeRoundedRect(GUTTER, oy, w, 56, RADIUS.md);
        if (!o.ok) {
          layer.add(
            this.add
              .text(CANVAS.w / 2, resultY, T.academy.lessonWrong, {
                ...TX.body(p, { color: p.bad, align: 'center', wrap: w }),
              })
              .setOrigin(0.5, 0),
          );
          return;
        }
        answered = true;
        const cur = gameState.progress.cardRanks[card.id] ?? 1;
        gameState.progress.cardRanks[card.id] = Math.min(3, cur + 1);
        gameState.save();
        const msg = this.add
          .text(CANVAS.w / 2, resultY, T.academy.lessonRight, {
            ...TX.body(p, { color: p.good, align: 'center', wrap: w }),
          })
          .setOrigin(0.5, 0);
        layer.add(msg);
        fadeIn(this, msg);
        this.time.delayedCall(900, () => transitionTo(this, 'ArenaScene'));
      });
      layer.add(zone);
    });

    const closeBtn = button(
      this,
      GUTTER,
      CANVAS.h - bottomNavHeight() - HIT.comfortable - SP.md,
      T.academy.close,
      p,
      () => layer.destroy(),
      { width: w, variant: 'ghost' },
    );
    layer.add(closeBtn);
  }

  /** Проверка строится из атомов карты, а не захардкожена одним вопросом. */
  private lessonQuestion(card: SkillCard): { q: string; options: { text: string; ok: boolean }[] } {
    const right = card.atoms[0]?.desc ?? 'Применить навык осознанно';
    const wrongPool = [
      'Действовать по первому впечатлению',
      'Ориентироваться на мнение из чата',
      'Увеличить размер, чтобы отыграться',
    ];
    const options = [
      { text: right, ok: true },
      { text: wrongPool[card.cid % wrongPool.length], ok: false },
      { text: wrongPool[(card.cid + 1) % wrongPool.length], ok: false },
    ];
    // детерминированно перемешиваем, чтобы верный не был всегда первым
    if (card.cid % 2 === 0) options.reverse();
    return { q: `Что относится к навыку «${card.short}»?`, options };
  }
}
