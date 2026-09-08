import { describe, expect, it } from 'vitest';
import { BOTTOM_NAV_ROUTES, ROUTE_SCENE } from './router.js';

describe('T011 router map', () => {
  it('все 9 маршрутов ведут на сцены', () => {
    expect(Object.keys(ROUTE_SCENE)).toHaveLength(9);
    for (const key of Object.values(ROUTE_SCENE)) {
      expect(key).toMatch(/^[A-Z][A-Za-z]+$/);
    }
  });

  it('bottom nav — ровно 5 слотов из карты маршрутов', () => {
    expect(BOTTOM_NAV_ROUTES).toHaveLength(5);
    for (const route of BOTTOM_NAV_ROUTES) {
      expect(ROUTE_SCENE[route]).toBeTruthy();
    }
  });
});
