// Copy-keys: RU/EN сгенерированы из shared/copy/keys.tsv (npm run build:copy).
// Тон: панк-таблоидная криптосатира (style-tone.txt). RU — первый язык MVP.
import type { BrowserTabId } from './schemas.js';
import { EN, RU } from './copy.keys.js';

export { COPY_TODO } from './copy.keys.js';

export type Lang = 'ru' | 'en';

export const TAB_LABEL: Record<BrowserTabId, { ru: string; en: string }> = {
  chart: { ru: 'ГРАФИК', en: 'CHART' },
  'higher-tf': { ru: 'СТАРШИЕ ТФ', en: 'HIGHER TF' },
  volume: { ru: 'ОБЪЁМ', en: 'VOLUME' },
  news: { ru: 'НОВОСТИ', en: 'NEWS' },
  social: { ru: 'СОЦФОН', en: 'SENTIMENT' },
  macro: { ru: 'МАКРО', en: 'MACRO' },
  tokenomics: { ru: 'ТОКЕНОМИКА', en: 'TOKENOMICS' },
  onchain: { ru: 'ОНЧЕЙН', en: 'ON-CHAIN' },
  position: { ru: 'ПОЗИЦИЯ', en: 'POSITION' },
  journal: { ru: 'ЖУРНАЛ', en: 'JOURNAL' },
};

export const COPY: Record<Lang, Record<string, string>> = { ru: RU, en: EN };

/** Безопасное чтение копи: запрошенный язык → RU (первый язык MVP) → ключ. */
export function t(lang: Lang, key: string): string {
  return COPY[lang]?.[key] ?? COPY.ru[key] ?? key;
}
