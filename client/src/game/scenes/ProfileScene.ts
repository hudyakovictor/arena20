// T071-минимум · Профиль: XP/ранг/стрик/кредиты, достижения, лучшие качества.
// Прототип 11.1–11.2, 15.1 (без Founder/токена: их нет в MVP).
import Phaser from 'phaser';
import { FONT_SIZES, LAYOUT, SPACING } from '@signal-arena/shared';
import { selectProgress } from '../../store.js';
import { t } from '../../copy.js';
import { makeSection } from '../ui/kit.js';
import { baseHeader, baseRoot, infoCard, INNER_W } from './_base.js';

const ACHIEVEMENTS = [
  { id: 'first', titleKey: 'ach.first.title', bodyKey: 'ach.first.body' },
  { id: 'clean70', titleKey: 'ach.clean70.title', bodyKey: 'ach.clean70.body' },
  { id: 'hunter', titleKey: 'ach.hunter.title', bodyKey: 'ach.hunter.body' },
  { id: 'scholar', titleKey: 'ach.scholar.title', bodyKey: 'ach.scholar.body' },
] as const;

function unlocked(id: string): boolean {
  const p = selectProgress();
  if (id === 'first') return p.completed.length >= 1;
  if (id === 'clean70') return Object.values(p.bestQuality).some((q) => q >= 70);
  if (id === 'hunter') return p.completed.length >= 2;
  if (id === 'scholar') return p.openTopics.length >= 3;
  return false;
}

export default class ProfileScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Profile' });
  }

  create(): void {
    const root = baseRoot(this);
    let y = baseHeader(this, root, 'profile.title', 'app.tagline');
    const p = selectProgress();
    const stats = infoCard(this, root, LAYOUT.gutter, y, INNER_W, [
      { text: t('profile.stats'), mono: true, size: FONT_SIZES.caption, tone: 'muted' },
      {
        text: `LVL ${p.rank} · ${p.xp} XP · STREAK ${p.streakDays} · CREDITS ${p.credits}`,
        mono: true,
        size: FONT_SIZES.body,
        tone: 'primary',
        maxChars: 120,
      },
      {
        text: `${t('profile.completed')}: ${p.completed.length}`,
        size: FONT_SIZES.caption,
        tone: 'secondary',
      },
    ]);
    y += stats + SPACING.md;
    const sec = makeSection(this, t('profile.ach'), '');
    sec.setPosition(LAYOUT.gutter, y);
    root.add(sec);
    y += 28;
    for (const ach of ACHIEVEMENTS) {
      const isOpen = unlocked(ach.id);
      const h = infoCard(this, root, LAYOUT.gutter, y, INNER_W, [
        {
          text: `${isOpen ? '[+]' : '[ ]'} ${t(ach.titleKey)}`,
          size: FONT_SIZES.body,
          tone: isOpen ? 'primary' : 'muted',
          maxChars: 80,
        },
        { text: t(ach.bodyKey), size: FONT_SIZES.caption, tone: 'secondary', maxChars: 140 },
      ]);
      y += h + SPACING.sm;
    }
  }
}
