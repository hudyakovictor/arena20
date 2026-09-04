// Блок решения: карты навыков, вердикт конфликта, варианты ответа, ставка.
// Каждый подблок обновляется точечно — без scene.restart() (аудит A2).

import Phaser from 'phaser';
import type { EncounterInstance, Confidence } from '../../types';
import type { EpochStructure } from '../../config/epochStructure';
import type { Palette } from '../../ui/palette';
import { CANVAS, GUTTER, HIT, RADIUS, SP } from '../../ui/tokens';
import * as TX from '../../ui/text';
import { T } from '../../ui/copy';
import { cardById } from '../../data/cards';
import { cardKey } from '../../engine/assetKeys';
import { enterPanel, tapFeedback } from '../../ui/motion';
import { haptic, playSfx } from '../../ui/feedbackFx';

export interface CardView {
  id: string;
  name: string;
  hint: string;
  unlocked: boolean;
  rank: number;
  required: boolean;
  isWait: boolean;
}

/** Лента карт навыков. В поздних эпохах — сбор плана по слотам. */
export class CardRail {
  private scene: Phaser.Scene;
  private root: Phaser.GameObjects.Container;
  private p: Palette;
  private st: EpochStructure;
  private cards: CardView[];
  private stack: string[] = [];
  private active: string | null = null;
  private onChange: (active: string | null, stack: string[]) => void;

  constructor(
    scene: Phaser.Scene,
    y: number,
    p: Palette,
    st: EpochStructure,
    cards: CardView[],
    onChange: (active: string | null, stack: string[]) => void,
    initial: { active?: string | null; stack?: string[] } = {},
  ) {
    this.scene = scene;
    this.p = p;
    this.st = st;
    this.cards = cards;
    this.onChange = onChange;
    this.active = initial.active ?? null;
    this.stack = [...(initial.stack ?? [])];
    this.root = scene.add.container(0, y);
    this.render();
    enterPanel(scene, this.root);
  }

  static heightFor(st: EpochStructure): number {
    return (st.stackSlots > 0 ? 36 : 0) + 20 + 76;
  }

  get container(): Phaser.GameObjects.Container {
    return this.root;
  }

  getStack(): string[] {
    return [...this.stack];
  }

  getActive(): string | null {
    return this.active;
  }

  private render(): void {
    this.root.removeAll(true);
    const p = this.p;
    const w = CANVAS.w - GUTTER * 2;
    let y = 0;

    const label =
      this.st.stackSlots > 0
        ? T.arena.planTitle(this.st.stackSlots)
        : T.arena.cardsTitle;
    this.root.add(this.scene.add.text(GUTTER, y, label, TX.caption(p, { color: p.muted })));
    y += 20;

    // Слоты плана
    if (this.st.stackSlots > 0) {
      const slotW = (w - SP.sm * (this.st.stackSlots - 1)) / this.st.stackSlots;
      for (let i = 0; i < this.st.stackSlots; i++) {
        const id = this.stack[i];
        const card = this.cards.find((c) => c.id === id);
        const sx = GUTTER + i * (slotW + SP.sm);
        const g = this.scene.add.graphics();
        g.fillStyle(card ? p.elevatedN : p.insetN, 1);
        g.fillRoundedRect(sx, y, slotW, 28, RADIUS.sm);
        g.lineStyle(1, card ? p.accentN : p.borderN, 1);
        g.strokeRoundedRect(sx, y, slotW, 28, RADIUS.sm);
        this.root.add(g);
        this.root.add(
          this.scene.add
            .text(
              sx + slotW / 2,
              y + 14,
              card ? `${i + 1}. ${card.name}` : String(i + 1),
              TX.caption(p, { color: card ? p.text : p.muted }),
            )
            .setOrigin(0.5),
        );
      }
      y += 36;
    }

    // Карты
    // В «Системе» нужны четыре шага и легитимная карта «Ждать».
    // Ограничение в четыре карточки делало пятую механику невидимой.
    const perRow = Math.min(this.cards.length, 5);
    const cardW = (w - SP.sm * (perRow - 1)) / perRow;
    const cardH = 76;
    this.cards.slice(0, perRow).forEach((c, i) => {
      const cx = GUTTER + i * (cardW + SP.sm);
      const inStack = this.stack.includes(c.id);
      const sel = this.active === c.id || inStack;

      const g = this.scene.add.graphics();
      g.fillStyle(!c.unlocked ? p.insetN : sel ? p.hoverN : p.surfaceN, 1);
      g.fillRoundedRect(cx, y, cardW, cardH, RADIUS.md);
      g.lineStyle(sel ? 2 : 1, !c.unlocked ? p.borderN : sel ? p.accentN : p.borderN, 1);
      g.strokeRoundedRect(cx, y, cardW, cardH, RADIUS.md);
      this.root.add(g);

      // Отметка «нужна для победы» — только в обучающих эпохах
      if (this.st.cardMode === 'guided' && c.required && c.unlocked) {
        const m = this.scene.add.graphics();
        m.fillStyle(p.accentN, 1);
        m.fillRoundedRect(cx + SP.sm, y + SP.sm, 3, 18, 2);
        this.root.add(m);
      }

      const tex = cardKey(c.id);
      if (this.scene.textures.exists(tex)) {
        const img = this.scene.add.image(cx + cardW / 2, y + 22, tex).setDisplaySize(18, 26);
        img.setTint(!c.unlocked ? p.mutedN : c.rank >= 2 ? p.goodN : p.accentN);
        this.root.add(img);
      }

      this.root.add(
        this.scene.add
          .text(cx + cardW / 2, y + 44, c.name, {
            ...TX.caption(p, {
              color: c.unlocked ? p.text : p.muted,
              align: 'center',
              wrap: cardW - SP.sm,
            }),
          })
          .setOrigin(0.5, 0),
      );

      if (this.st.cardMode !== 'silent' && c.unlocked) {
        this.root.add(
          this.scene.add
            .text(cx + cardW / 2, y + cardH - 16, c.isWait ? 'пауза' : `ранг ${c.rank || 1}`, {
              ...TX.caption(p, { color: c.isWait ? p.warn : p.muted }),
            })
            .setOrigin(0.5, 0),
        );
      }

      if (inStack) {
        const badge = this.scene.add.graphics();
        badge.fillStyle(p.accentN, 1);
        badge.fillCircle(cx + cardW - 12, y + 12, 9);
        this.root.add(badge);
        this.root.add(
          this.scene.add
            .text(cx + cardW - 12, y + 12, String(this.stack.indexOf(c.id) + 1), {
              ...TX.caption(p, { color: p.accentInk }),
            })
            .setOrigin(0.5),
        );
      }

      const zone = this.scene.add
        .rectangle(cx, y, cardW, Math.max(cardH, HIT.min), 0x000000, 0)
        .setOrigin(0)
        .setInteractive();
      zone.on('pointerdown', () => {
        if (!c.unlocked) {
          haptic('warn');
          return;
        }
        haptic('light');
        playSfx('tap');
        tapFeedback(this.scene, zone as never);
        this.pick(c);
      });
      this.root.add(zone);
    });
  }

  private pick(c: CardView): void {
    if (this.st.stackSlots > 0) {
      if (this.stack.includes(c.id)) {
        this.stack = this.stack.filter((x) => x !== c.id);
      } else if (this.stack.length < this.st.stackSlots) {
        this.stack.push(c.id);
      }
    } else {
      this.active = this.active === c.id ? null : c.id;
    }
    this.render();
    this.onChange(this.active, this.getStack());
  }
}

/** Вердикт конфликта: что здесь главное. */
export class VerdictRow {
  private root: Phaser.GameObjects.Container;
  private value: 'A' | 'B' | null = null;

  constructor(
    private scene: Phaser.Scene,
    y: number,
    private p: Palette,
    private enc: EncounterInstance,
    private onPick: (v: 'A' | 'B') => void,
  ) {
    this.root = scene.add.container(0, y);
    this.render();
    enterPanel(scene, this.root);
  }

  static height(): number {
    return 20 + 56;
  }

  get container(): Phaser.GameObjects.Container {
    return this.root;
  }

  private render(): void {
    this.root.removeAll(true);
    const p = this.p;
    const v = this.enc.verdict;
    if (!v) return;
    const w = CANVAS.w - GUTTER * 2;
    this.root.add(this.scene.add.text(GUTTER, 0, T.arena.verdictTitle, TX.caption(p)));

    const optW = (w - SP.sm) / 2;
    ([
      ['A', v.factorA],
      ['B', v.factorB],
    ] as const).forEach(([k, text], i) => {
      const x = GUTTER + i * (optW + SP.sm);
      const sel = this.value === k;
      const g = this.scene.add.graphics();
      g.fillStyle(sel ? p.hoverN : p.surfaceN, 1);
      g.fillRoundedRect(x, 20, optW, 56, RADIUS.md);
      g.lineStyle(sel ? 2 : 1, sel ? p.accentN : p.borderN, 1);
      g.strokeRoundedRect(x, 20, optW, 56, RADIUS.md);
      this.root.add(g);
      this.root.add(
        this.scene.add
          .text(x + optW / 2, 20 + 28, text, {
            ...TX.body(p, { color: sel ? p.text : p.sub, align: 'center', wrap: optW - SP.md }),
          })
          .setOrigin(0.5),
      );
      const zone = this.scene.add
        .rectangle(x, 20, optW, Math.max(56, HIT.min), 0x000000, 0)
        .setOrigin(0)
        .setInteractive();
      zone.on('pointerdown', () => {
        haptic('light');
        playSfx('tap');
        this.value = k;
        this.render();
        this.onPick(k);
      });
      this.root.add(zone);
    });
  }
}

/** Сетка вариантов ответа. */
export class AnswerGrid {
  private root: Phaser.GameObjects.Container;
  private selected: number | null = null;

  constructor(
    private scene: Phaser.Scene,
    y: number,
    private p: Palette,
    private enc: EncounterInstance,
    private onPick: (i: number) => void,
  ) {
    this.root = scene.add.container(0, y);
    this.render();
    enterPanel(scene, this.root);
  }

  static heightFor(count: number): number {
    const rows = Math.ceil(count / 2);
    return 20 + rows * (84 + SP.sm);
  }

  get container(): Phaser.GameObjects.Container {
    return this.root;
  }

  setSelected(i: number | null): void {
    this.selected = i;
    this.render();
  }

  private render(): void {
    this.root.removeAll(true);
    const p = this.p;
    const w = CANVAS.w - GUTTER * 2;
    const answers = this.enc.mutatedAnswers;
    this.root.add(this.scene.add.text(GUTTER, 0, T.arena.answerTitle, TX.caption(p)));

    const colW = (w - SP.sm) / 2;
    const rowH = 84;
    answers.forEach((a, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = GUTTER + col * (colW + SP.sm);
      const y = 20 + row * (rowH + SP.sm);
      const sel = this.selected === i;

      const g = this.scene.add.graphics();
      g.fillStyle(sel ? p.accentN : p.surfaceN, sel ? 1 : 0.96);
      g.fillRoundedRect(x, y, colW, rowH, RADIUS.md);
      g.lineStyle(sel ? 2 : 1, sel ? p.accentN : p.borderN, 1);
      g.strokeRoundedRect(x, y, colW, rowH, RADIUS.md);
      this.root.add(g);

      this.root.add(
        this.scene.add.text(x + SP.md, y + SP.sm, a.text, {
          ...TX.body(p, {
            color: sel ? p.accentInk : p.text,
            wrap: colW - SP.md * 2,
          }),
        }),
      );

      if (a.isWait) {
        this.root.add(
          this.scene.add
            .text(x + colW - SP.sm, y + rowH - 18, 'без сделки', {
              ...TX.caption(p, { color: sel ? p.accentInk : p.warn }),
            })
            .setOrigin(1, 0),
        );
      }

      const zone = this.scene.add
        .rectangle(x, y, colW, Math.max(rowH, HIT.min), 0x000000, 0)
        .setOrigin(0)
        .setInteractive();
      zone.on('pointerdown', () => {
        haptic('light');
        playSfx('tap');
        this.onPick(i);
      });
      this.root.add(zone);
    });
  }
}

/** Ставка уверенности. */
export class ConfidencePicker {
  private root: Phaser.GameObjects.Container;

  constructor(
    private scene: Phaser.Scene,
    y: number,
    private p: Palette,
    private onPick: (c: Confidence) => void,
  ) {
    this.root = scene.add.container(0, y);
    this.render();
    enterPanel(scene, this.root);
  }

  static height(): number {
    return 20 + 60;
  }

  get container(): Phaser.GameObjects.Container {
    return this.root;
  }

  private render(): void {
    const p = this.p;
    const w = CANVAS.w - GUTTER * 2;
    this.root.add(this.scene.add.text(GUTTER, 0, T.arena.confidenceTitle, TX.caption(p)));
    const opts: { k: Confidence; label: string; hint: string; color: string }[] = [
      { k: 'low', label: T.arena.confidence.low, hint: T.arena.confidence.lowHint, color: p.sub },
      { k: 'mid', label: T.arena.confidence.mid, hint: T.arena.confidence.midHint, color: p.text },
      { k: 'high', label: T.arena.confidence.high, hint: T.arena.confidence.highHint, color: p.warn },
    ];
    const bw = (w - SP.sm * 2) / 3;
    opts.forEach((o, i) => {
      const x = GUTTER + i * (bw + SP.sm);
      const g = this.scene.add.graphics();
      g.fillStyle(p.surfaceN, 1);
      g.fillRoundedRect(x, 20, bw, 60, RADIUS.md);
      g.lineStyle(1, p.borderN, 1);
      g.strokeRoundedRect(x, 20, bw, 60, RADIUS.md);
      this.root.add(g);
      this.root.add(
        this.scene.add
          .text(x + bw / 2, 20 + 18, o.label, TX.body(p, { color: o.color }))
          .setOrigin(0.5),
      );
      this.root.add(
        this.scene.add
          .text(x + bw / 2, 20 + 40, o.hint, {
            ...TX.caption(p, { color: p.muted, align: 'center', wrap: bw - SP.sm }),
          })
          .setOrigin(0.5),
      );
      const zone = this.scene.add
        .rectangle(x, 20, bw, Math.max(60, HIT.min), 0x000000, 0)
        .setOrigin(0)
        .setInteractive();
      zone.on('pointerdown', () => {
        haptic('light');
        playSfx('tap');
        this.onPick(o.k);
      });
      this.root.add(zone);
    });
  }
}

/** Собирает список карт для ленты из шаблона встречи. */
export function buildCardViews(
  enc: EncounterInstance,
  st: EpochStructure,
  isUnlocked: (id: string) => boolean,
  rankOf: (id: string) => number,
): CardView[] {
  const required = new Set(enc.skills);
  const targetSkillCards = Math.max(1, st.cards - 1);
  const ids = enc.skills.slice(0, targetSkillCards);
  // Если в шаблоне меньше правильных карт, добираем доступные отвлекающие.
  // Так поздняя эпоха действительно показывает «лишнюю карту», но длина
  // правильного плана остаётся достижимой.
  const decoys = Object.values(cardById)
    .filter((c) => !ids.includes(c.id) && isUnlocked(c.id))
    .map((c) => c.id);
  while (ids.length < targetSkillCards && decoys.length > 0) ids.push(decoys.shift()!);

  const views: CardView[] = ids.map((id) => {
    const c = cardById[id];
    return {
      id,
      name: c?.short ?? id,
      hint: c?.atoms[0]?.desc ?? '',
      unlocked: isUnlocked(id),
      rank: rankOf(id),
      required: required.has(id),
      isWait: false,
    };
  });
  // «Ждать» — всегда легитимный вариант
  views.push({
    id: 'Cwait',
    name: 'Ждать',
    hint: 'Не входить — тоже решение',
    unlocked: true,
    rank: 0,
    required: false,
    isWait: true,
  });
  return views;
}
