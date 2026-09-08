// T090/T091-минимум · Маркет: косметика за кредиты, заглушка покупки без платежей.
// Прототип 10.1–10.5 (без кошелька/подписок: только внутренняя валюта, без pay-to-win).
import Phaser from 'phaser';
import { FONT_SIZES, LAYOUT, SPACING } from '@signal-arena/shared';
import { selectProgress, useArenaStore } from '../../store.js';
import { t } from '../../copy.js';
import { playSound } from '../../sound.js';
import { toast } from '../ui/kit.js';
import { baseHeader, baseRoot, infoCard, INNER_W } from './_base.js';

const ITEMS = [
  {
    id: 'theme-neon',
    titleKey: 'market.i.theme-neon.title',
    bodyKey: 'market.i.theme-neon.body',
    price: 60,
  },
  {
    id: 'avatar-golem',
    titleKey: 'market.i.avatar-golem.title',
    bodyKey: 'market.i.avatar-golem.body',
    price: 40,
  },
  {
    id: 'season1',
    titleKey: 'market.i.season1.title',
    bodyKey: 'market.i.season1.body',
    price: 100,
  },
] as const;

export default class MarketScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Market' });
  }

  create(): void {
    this.render();
    const unsub = useArenaStore.subscribe((s, prev) => {
      if (
        s.progress.credits !== prev.progress.credits ||
        s.progress.ownedItems.join() !== prev.progress.ownedItems.join()
      ) {
        this.children.removeAll(true);
        this.render();
      }
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, unsub);
  }

  private render(): void {
    const root = baseRoot(this);
    let y = baseHeader(this, root, 'market.title', 'market.sub');
    const progress = selectProgress();
    const bal = infoCard(this, root, LAYOUT.gutter, y, INNER_W, [
      {
        text: `${t('market.balance')}: ${progress.credits}`,
        mono: true,
        size: FONT_SIZES.body,
        tone: 'warning',
      },
    ]);
    y += bal + SPACING.sm;
    for (const item of ITEMS) {
      const owned = progress.ownedItems.includes(item.id);
      const h = infoCard(
        this,
        root,
        LAYOUT.gutter,
        y,
        INNER_W,
        [
          {
            text: `${t(item.titleKey)} · ${item.price}`,
            mono: true,
            size: FONT_SIZES.caption,
            tone: 'narrative',
          },
          { text: t(item.bodyKey), size: FONT_SIZES.body, maxChars: 140 },
          {
            text: owned ? t('market.owned') : `${t('market.buy')} →`,
            mono: true,
            size: FONT_SIZES.caption,
            tone: owned ? 'success' : 'active',
          },
        ],
        owned
          ? undefined
          : () => {
              const ok = useArenaStore.getState().buyItem(item.id, item.price);
              playSound(this, ok ? 'success' : 'error');
              toast(this, ok ? t('market.bought') : t('market.noFunds'));
            },
      );
      y += h + SPACING.sm;
    }
  }
}
