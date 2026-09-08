import { describe, expect, it } from 'vitest';
import { LAYOUT, UI_HEX, UI_TINT } from './tokens.js';

describe('T002 design tokens', () => {
  it('содержит все 10 UI-токенов из UI-спека §5', () => {
    expect(Object.keys(UI_TINT).sort()).toEqual(
      [
        'active',
        'danger',
        'data',
        'muted',
        'narrative',
        'noise',
        'primary',
        'secondary',
        'success',
        'warning',
      ].sort(),
    );
  });

  it('HEX и TINT согласованы', () => {
    for (const [key, hex] of Object.entries(UI_HEX)) {
      const tint = UI_TINT[key as keyof typeof UI_TINT];
      expect(tint.toString(16).padStart(6, '0')).toBe(hex.replace('#', '').toLowerCase());
    }
  });

  it('touch target ≥ 44×44', () => {
    expect(LAYOUT.touchMin).toBeGreaterThanOrEqual(44);
  });

  it('вьюпорт прототипа 390×844', () => {
    expect(LAYOUT.viewWidth).toBe(390);
    expect(LAYOUT.viewHeight).toBe(844);
  });
});
