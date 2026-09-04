// SIGNAL ARENA — токены оформления по эпохам (ТЗ Часть 2 «Эпохи»).
// Один скелет UI во всех эпохах; различаются только токены.
// Эпоха I «Улица» — согласованный визуал: граффити, кислотный неон, кирпич (ui/prototype_style_*.png).
export interface Palette {
  bgN: number; insetN: number; surfaceN: number; elevatedN: number; hoverN: number;
  borderN: number; strongN: number;
  accent: string; accentN: number; accentInk: string;
  good: string; goodN: number; bad: string; badN: number; warn: string; warnN: number;
  text: string; sub: string; muted: string; info: string; crypto: string;
  textN: number; subN: number; mutedN: number; cryptoN: number;
  // «бумажный» блок вопроса: в Улице — тёмная плашка, в Кабинете — бумага
  paperN: number; inkText: string; inkSub: string;
  fontHead: string; fontUi: string; fontMono: string;
  brick: boolean;
}

const MONO = 'IBM Plex Mono, Consolas, monospace';
const UI = 'Inter, system-ui, sans-serif';
const HEAD = 'Oswald, Inter, system-ui, sans-serif';

export const palettes: Record<string, Palette> = {
  // Эпоха I «УЛИЦА» L1–20: граффити, неон, эмоция (согласованный стиль)
  street: {
    bgN: 0x0a0b0d, insetN: 0x0a0b0d, surfaceN: 0x16181d, elevatedN: 0x1e2126, hoverN: 0x262a31,
    borderN: 0x33383f, strongN: 0x454b55,
    accent: '#c8ff00', accentN: 0xc8ff00, accentInk: '#0a0b0d',
    good: '#4ade80', goodN: 0x4ade80, bad: '#ff4d5e', badN: 0xff4d5e, warn: '#ffb341', warnN: 0xffb341,
    text: '#f2f3f5', sub: '#b8bcc4', muted: '#7d838d',
    textN: 0xf2f3f5, subN: 0xb8bcc4, mutedN: 0x7d838d, cryptoN: 0xa855f7, info: '#45e0d0', crypto: '#a855f7',
    paperN: 0x16181d, inkText: '#f2f3f5', inkSub: 'rgba(242,243,245,0.55)',
    fontHead: HEAD, fontUi: UI, fontMono: MONO,
    brick: true,
  },
  // Эпоха II «КАБИНЕТ» L21–50: чистые панели, пастель
  cabinet: {
    bgN: 0x080e1e, insetN: 0x060a12, surfaceN: 0x0f1b32, elevatedN: 0x14233f, hoverN: 0x1a2c4c,
    borderN: 0x2a3a55, strongN: 0x3d527a,
    accent: '#59a7ff', accentN: 0x59a7ff, accentInk: '#04101f',
    good: '#3bde8a', goodN: 0x3bde8a, bad: '#ff596d', badN: 0xff596d, warn: '#ffb341', warnN: 0xffb341,
    text: '#e9f2ff', sub: '#93a3bc', muted: '#62708a',
    textN: 0xe9f2ff, subN: 0x93a3bc, mutedN: 0x62708a, cryptoN: 0xb783ff, info: '#59a7ff', crypto: '#b783ff',
    paperN: 0xe7dfd0, inkText: '#1c1916', inkSub: 'rgba(28,25,22,0.55)',
    fontHead: UI, fontUi: UI, fontMono: MONO,
    brick: false,
  },
  // Эпоха III «ТЕРМИНАЛ» L51–80: плотный монохром, данные
  terminal: {
    bgN: 0x060a12, insetN: 0x060a12, surfaceN: 0x0c1323, elevatedN: 0x111b2e, hoverN: 0x14223a,
    borderN: 0x22304a, strongN: 0x344563,
    accent: '#ffb341', accentN: 0xffb341, accentInk: '#170f02',
    good: '#3bde8a', goodN: 0x3bde8a, bad: '#ff596d', badN: 0xff596d, warn: '#ffb341', warnN: 0xffb341,
    text: '#e9f2ff', sub: '#93a3bc', muted: '#62708a',
    textN: 0xe9f2ff, subN: 0x93a3bc, mutedN: 0x62708a, cryptoN: 0xb783ff, info: '#31d6c4', crypto: '#b783ff',
    paperN: 0x0c1323, inkText: '#e9f2ff', inkSub: 'rgba(147,163,188,0.7)',
    fontHead: MONO, fontUi: UI, fontMono: MONO,
    brick: false,
  },
  // Эпоха IV «СИСТЕМА» L81–99: минимализм, белое на тёмном
  system: {
    bgN: 0x05070d, insetN: 0x05070d, surfaceN: 0x0a0f1c, elevatedN: 0x0e1526, hoverN: 0x121a2e,
    borderN: 0x1a2740, strongN: 0x27395c,
    accent: '#b783ff', accentN: 0xb783ff, accentInk: '#0b0616',
    good: '#3bde8a', goodN: 0x3bde8a, bad: '#ff596d', badN: 0xff596d, warn: '#ffb341', warnN: 0xffb341,
    text: '#f4f6fb', sub: '#9aa7c0', muted: '#5d6a85',
    textN: 0xf4f6fb, subN: 0x9aa7c0, mutedN: 0x5d6a85, cryptoN: 0xb783ff, info: '#59a7ff', crypto: '#b783ff',
    paperN: 0x0a0f1c, inkText: '#f4f6fb', inkSub: 'rgba(154,167,192,0.7)',
    fontHead: UI, fontUi: UI, fontMono: MONO,
    brick: false,
  },
};

export function buildPalette(epochId: string): Palette {
  return palettes[epochId] ?? palettes.street;
}
