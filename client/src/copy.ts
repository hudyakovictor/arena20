// Локализация сцен: t(key) читает язык из стора (T015), строки — из shared (T122-минимум).
import { t as translate } from '@signal-arena/shared';
import { selectLang } from './store.js';

export function t(key: string): string {
  return translate(selectLang(), key);
}
