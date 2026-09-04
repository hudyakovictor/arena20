// Совместимость: каркас переехал в ui/shell.ts (читаемый кегль, тач-зоны >= 44,
// safe-area, человеческие подписи). Этот модуль остаётся точкой импорта
// для сцен, которые ещё не переписаны.
export {
  renderTopBar,
  renderBottomNav,
  navForEpoch,
  renderBackground,
  bottomNavHeight,
} from '../ui/shell';
