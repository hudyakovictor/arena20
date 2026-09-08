// T060/T061-минимум · Угрозы: grid сущностей → детальный экран (признак/контр-приём).
// Прототип 6.1–6.3. Thumb/hero — категорийные панели-заглушки (placeholder, T004/T062).
import Phaser from 'phaser';
import { ENTITY_CATEGORY_TINT, FONT_SIZES, LAYOUT, SPACING } from '@signal-arena/shared';
import { selectLang, useArenaStore } from '../../store.js';
import { t } from '../../copy.js';
import { t as sharedT } from '@signal-arena/shared';
import { playSound } from '../../sound.js';
import { content, getPublicScenario } from '../../content.js';
import { makeCta, makeLabel, makeText, tappable } from '../ui/kit.js';
import { iconImage } from '../ui/icons.js';
import { baseHeader, baseRoot, infoCard, INNER_W } from './_base.js';

export default class BestiaryScene extends Phaser.Scene {
  private selected: string | null = null;

  constructor() {
    super({ key: 'Bestiary' });
  }

  create(): void {
    this.selected = null;
    this.render();
  }

  private render(): void {
    this.children.removeAll(true);
    const root = baseRoot(this);
    const y = baseHeader(this, root, 'bestiary.title', 'bestiary.sub');
    if (this.selected) this.renderDetail(root, y);
    else this.renderGrid(root, y);
  }

  private masteredSet(): Set<string> {
    const completed = useArenaStore.getState().progress.completed;
    const set = new Set<string>();
    for (const id of completed) {
      try {
        for (const e of getPublicScenario(id).entityIds) set.add(e);
      } catch {
        // неизвестный сценарий прогресса — пропускаем
      }
    }
    return set;
  }

  private renderGrid(root: Phaser.GameObjects.Container, y0: number): void {
    const entities = content().entities;
    const mastered = this.masteredSet();
    const cellW = (INNER_W - SPACING.sm) / 2;
    entities.forEach((entity, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = LAYOUT.gutter + col * (cellW + SPACING.sm);
      const y = y0 + row * 118;
      const tint = ENTITY_CATEGORY_TINT[entity.category];
      const thumb = this.add.graphics();
      thumb.fillStyle(tint, 0.16);
      thumb.fillRoundedRect(x, y, cellW, 108, 10);
      thumb.lineStyle(1.5, tint, 0.8);
      thumb.strokeRoundedRect(x, y, cellW, 108, 10);
      root.add(thumb);
      const icon = iconImage(this, 'i-entity', 28, 'primary');
      (icon as unknown as { x: number; y: number }).x = x + 20;
      (icon as unknown as { y: number }).y = y + 26;
      root.add(icon);
      const name = makeText(this, x + 40, y + 12, entity.nameEn, {
        size: FONT_SIZES.body,
        mono: false,
      });
      name.setWordWrapWidth(cellW - 48);
      const state = makeText(
        this,
        x + 12,
        y + 66,
        mastered.has(entity.entityId) ? t('bestiary.mastered') : t('bestiary.seen'),
        {
          mono: true,
          size: FONT_SIZES.label,
          tone: mastered.has(entity.entityId) ? 'success' : 'muted',
        },
      );
      const cat = makeText(this, x + 12, y + 84, entity.category, {
        mono: true,
        size: FONT_SIZES.label - 1,
        tone: 'muted',
      });
      root.add([name, state, cat]);
      const zone = this.add.zone(x, y, cellW, 108).setOrigin(0, 0);
      zone.setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => {
        playSound(this, 'click');
        this.selected = entity.entityId;
        this.render();
      });
      root.add(zone);
    });
  }

  private renderDetail(root: Phaser.GameObjects.Container, y0: number): void {
    const entity = content().entities.find((e) => e.entityId === this.selected);
    if (!entity) {
      this.selected = null;
      this.render();
      return;
    }
    let y = y0;
    const hero = this.add.graphics();
    const tint = ENTITY_CATEGORY_TINT[entity.category];
    hero.fillStyle(tint, 0.2);
    hero.fillRoundedRect(LAYOUT.gutter, y, INNER_W, 150, 12);
    hero.lineStyle(2, tint, 0.9);
    hero.strokeRoundedRect(LAYOUT.gutter, y, INNER_W, 150, 12);
    root.add(hero);
    const name = makeText(this, LAYOUT.gutter + SPACING.md, y + SPACING.md, entity.nameEn, {
      size: 17,
    });
    const body = makeText(
      this,
      LAYOUT.gutter + SPACING.md,
      y + 44,
      sharedT(selectLang(), entity.bodyKey),
      {
        size: FONT_SIZES.body,
        tone: 'secondary',
        wrapWidth: INNER_W - SPACING.md * 2,
      },
    );
    root.add([name, body]);
    y += 162;
    const h = infoCard(this, root, LAYOUT.gutter, y, INNER_W, [
      { text: t('bestiary.tell'), mono: true, size: FONT_SIZES.caption, tone: 'warning' },
      { text: sharedT(selectLang(), entity.tellKey), size: FONT_SIZES.body, maxChars: 300 },
      { text: t('bestiary.counter'), mono: true, size: FONT_SIZES.caption, tone: 'success' },
      { text: sharedT(selectLang(), entity.counterKey), size: FONT_SIZES.body, maxChars: 300 },
    ]);
    y += h + SPACING.md;
    const huntScenario = content().scenarios.find((s) => s.entityIds.includes(entity.entityId));
    if (huntScenario) {
      const cta = makeCta(this, t('bestiary.train'), () => {
        playSound(this, 'click');
        useArenaStore.getState().startScenario(huntScenario.scenarioId);
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
