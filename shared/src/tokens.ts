// T002 · Дизайн-токены — единственный источник цветов/размеров.
// Источник: github_project/source/ui-graphics.md §5, §8 assets.md.
// Ни одна сцена не задаёт HEX напрямую — только через эти токены.

export const UI_HEX = {
  primary: '#F1F3F4',
  secondary: '#989EA4',
  muted: '#666C72',
  active: '#C8F135',
  success: '#5FCB8B',
  warning: '#F2B33D',
  danger: '#E9605A',
  data: '#57D2E6',
  noise: '#FF4D8D',
  narrative: '#A98BE8',
} as const;

export type UiTone = keyof typeof UI_HEX;

export const UI_TINT = {
  primary: 0xf1f3f4,
  secondary: 0x989ea4,
  muted: 0x666c72,
  active: 0xc8f135,
  success: 0x5fcb8b,
  warning: 0xf2b33d,
  danger: 0xe9605a,
  data: 0x57d2e6,
  noise: 0xff4d8d,
  narrative: 0xa98be8,
} as const;

export const UI_BG = {
  app: 0x0b0c0d,
  panel: 0x111315,
  surface: 0x181b1e,
  surface2: 0x212528,
  surface3: 0x2b3034,
} as const;

export const UI_BG_HEX = {
  app: '#0B0C0D',
  panel: '#111315',
  surface: '#181B1E',
  surface2: '#212528',
  surface3: '#2B3034',
} as const;

/** Чернила поверх кислотного CTA + технические чёрный/белый (маски, дим). */
export const INK_ON_ACTIVE = '#12140A';
export const PURE = {
  black: 0x000000,
  white: 0xffffff,
} as const;

/** Цвета категорий сущностей (ui-graphics.md §7.4). */
export const ENTITY_CATEGORY_TINT = {
  'market-structure': 0x57d2e6,
  'emotions-behaviour': 0xff4d8d,
  'narratives-info': 0xa98be8,
  'risk-exposure': 0xf2b33d,
  'web3-infra': 0x5fcb8b,
} as const;

export type EntityCategory = keyof typeof ENTITY_CATEGORY_TINT;

/** Мобильный вьюпорт прототипа: 390×844, Scale.FIT. */
export const LAYOUT = {
  viewWidth: 390,
  viewHeight: 844,
  safeTop: 54,
  safeBottom: 34,
  gutter: 18,
  topBarHeight: 64,
  bottomNavHeight: 76,
  touchMin: 44,
  radiusSm: 6,
  radiusMd: 10,
  radiusLg: 14,
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 18,
  xl: 26,
} as const;

/** Шрифты: 2 семейства woff2 (Fontsource, subset latin+cyrillic) + системный fallback. */
export const FONTS = {
  ui: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  mono: "'JetBrains Mono', 'SFMono-Regular', Menlo, Consolas, monospace",
} as const;

export const FONT_SIZES = {
  label: 10,
  caption: 11,
  body: 13,
  title: 17,
  big: 24,
} as const;
