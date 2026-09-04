// SIGNAL ARENA — вертикальный поток вместо магических координат (аудит R3).
// Блок не знает свою Y — он спрашивает её у потока и сообщает свою высоту.
// Добавили блок выше — всё нижнее сдвинулось само.

import { SP } from './tokens';

export class Flow {
  private cursor: number;
  private readonly gapDefault: number;

  constructor(startY: number, gap: number = SP.md) {
    this.cursor = startY;
    this.gapDefault = gap;
  }

  /** Текущая позиция без изменения курсора. */
  get y(): number {
    return this.cursor;
  }

  /** Занять высоту h и вернуть Y, с которой блок начинается. */
  take(h: number, gap?: number): number {
    const y = this.cursor;
    this.cursor += h + (gap ?? this.gapDefault);
    return y;
  }

  /** Добавить пустое пространство. */
  gap(h: number): void {
    this.cursor += h;
  }

  /** Принудительно поставить курсор. */
  moveTo(y: number): void {
    this.cursor = y;
  }

  /** Остаток по высоте до нижней границы. */
  remaining(bottom: number): number {
    return Math.max(0, bottom - this.cursor);
  }
}

/** Безопасные отступы устройства (вырез, home-indicator). */
export function safeAreaInsets(): { top: number; bottom: number } {
  if (typeof window === 'undefined' || typeof getComputedStyle !== 'function') {
    return { top: 0, bottom: 0 };
  }
  const probe = document.createElement('div');
  probe.style.cssText =
    'position:fixed;top:0;left:0;width:0;height:0;' +
    'padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom);';
  document.body.appendChild(probe);
  const cs = getComputedStyle(probe);
  const top = parseFloat(cs.paddingTop) || 0;
  const bottom = parseFloat(cs.paddingBottom) || 0;
  probe.remove();
  return { top, bottom };
}
