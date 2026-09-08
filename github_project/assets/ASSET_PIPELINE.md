# assets/ASSET_PIPELINE — сборка и контроль ассетов

Источник правды по ассетам: `signal-arena-ui-graphics-spec-v1.1.md.md` §10 и `signal-arena-assets-spec.md`.
Задача-исполнитель: `T003` (manifest+валидатор), `T004` (пайплайн сборки), `T123` (QA).

## 1. Принцип
- Код рисует то, что меняется (свечи, рамки, шкалы, разделители, прогресс, risk/decision markers, график) — `Phaser Graphics` / `rexUI` / `Text`.
- SVG описывает то, что повторяется (иконки, лого, бейджи) — `currentColor` → `tint` в рантайме.
- Растр (webp) хранит то, что создаёт мир (сущности, фоны, косметика, splash) — лениво по pack.

## 2. Manifest (обязателен для每一го ассета)
Ни один ассет не подключается из конкретной Scene вручную. Все через manifest, валидируемый Zod в build:
```json
{ "id":"icon.arena", "kind":"svg", "src":"assets/icons/i-arena.svg", "pack":"core-ui",
  "lazy":false, "logicalSize":{"width":24,"height":24}, "tintable":true, "maxBytes":400 }
```
Поле `placeholder:true` разрешает отсутствие файла (placeholder-стратегия): агент рисует заглушку кодом/SVG, реальный арт подставляется позже.

## 3. Пайплайн сборки (T004)
```
SVG source → SVGO → asset manifest → Phaser SVG texture / build-generated atlas → tint по token → компонент
```
- SVGO: обязателен `viewBox`, без фиксированных `width/height`, без `<image>`/filter/gradient/blur/mask (кроме разрешённого).
- Атлас/текстуры собираются в build; tint по semantic token (`UI_TINT`).
- Растр (webp) лениво грузится по pack; hero-art сущностей **не попадает в первый сценарий** (бюджет раздела ≤600КБ дозагрузки).

## 4. Бюджеты (CI падает при превышении)
| Что | Лимит |
|---|---|
| Core UI icon source/atlas | ≤ 12 КБ |
| Critical HTML shell | ≤ 25 КБ |
| Critical CSS/metadata | ≤ 35 КБ |
| First scenario content/visual pack (без Phaser runtime) | цель ≤ 250 КБ |
| Один lazy-раздел | ≤ 600 КБ дозагрузки |
| Фон раздела | ≤ 120 КБ |
| Первая hero-иллюстрация | ≤ 90 КБ |
| До интерактива на среднем Android | ≤ 2.5 с |
| Шрифты | ≤ 2 семейства, woff2, subset RU+EN, ≤ 45 КБ каждый |
| Иконка (одна, после SVGO) | ≤ 400 Б |

Phaser bundle — отдельный budget, не смешивается с first content pack.

## 5. Иконки (инвентарь 57)
Навигация 9 · профиль/статус 12 · шеринг 8 · игровой цикл 18 · служебные 10.
Правила: сетка 24×24, safe 20×20, stroke 1.5px, `round`, `currentColor`, заливка опц. `opacity≤.18`.
Touch-зона всегда ≥44×44. В core-bundle только иконки первого маршрута (shell/arena/cards/verdict/system states); остальные — по content/UI packs.
См. [**ICON_NOTES.md**](./ICON_NOTES.md) про правку знака/плашки.

## 6. Сущности (33)
Каждая: `thumb`(232,≤25КБ) / `card`(236,≤30КБ) / `hero`(724×340,≤90КБ) / `locked`(≤6КБ) / `icon`(24×24 svg,≤400Б).
Нейминг: `assets/entities/{slug}/{file}`, slug — lower-case через дефис (`fake-breakout-phantom`).
Первая production-партия (8): Fake Breakout Phantom, FOMO Wraith, Leverage Goblin, Headline Titan, Anchor Golem, Stop-Hunt Kraken, Rug Pull Phantom, Wick Mimic.
Состояния (naming поддержать с начала): unseen/discovered/encountered/mastered/variant-{id}/seasonal-{id}.

## 7. Запреты
- PNG для обычного UI (иконки/рамки/шкалы/графики/текст) — только OS/сторы исключения.
- Emoji/icon-font как production-иконки (в прототипе — заглушки).
- Грузить все сущности/фоны/косметику до открытия раздела.
- Token/wallet/airdrop/листинг в alpha/MVP.
- Цвет как единственный носитель статуса.
- Внутриигровая валюта как внешняя финансовая ценность.
