# Signal Arena — Реестр сторонних ассетов (лицензии)

> Все визуальные ассеты, добавленные в прототип, обязаны фиксироваться здесь по строгой схеме.
> Текущий прототип использует **только собственные сгенерированные SVG-заглушки** (нарушений лицензий нет).
> Ниже — таблица **потенциальных** источников из ТЗ (брать на этапе продакшена) + как вносить записи.

## Схема записи (для каждого скачанного файла)

```text
asset_id:
source_url:
author:
license:
attribution_required:
download_date:
used_in:
modified:
```

## Собственные сгенерированные ассеты (используются сейчас)

| asset_id | source_url | author | license | attribution_required | download_date | used_in | modified |
|---|---|---|---|---|---|---|---|
| `render/enemies/E01_s1.svg … E33_s4.svg` | `scripts/gen-placeholders.mjs` (генератор, собств.) | Signal Arena | proprietary (project) | нет | 2026-09-03 | Arena / Collection / Identification | нет |
| `render/enemies/E##_avatar.svg`, `_icon.svg` | `scripts/gen-placeholders.mjs` | Signal Arena | proprietary | нет | 2026-09-03 | Трофеи, опознание | нет |
| `render/cards/C1.svg … C17.svg`, `Cwait.svg` | `scripts/gen-placeholders.mjs` | Signal Arena | proprietary | нет | 2026-09-03 | Карты навыков | нет |
| `render/icons/*.svg` | `scripts/gen-placeholders.mjs` | Signal Arena | proprietary | нет | 2026-09-03 | Навигация, домены | нет |
| `assets/icons.svg` | репо | Signal Arena | proprietary | нет | 2026-09-03 | Справочник иконок | нет |
| `assets/skill-cards.svg` | репо | Signal Arena | proprietary | нет | 2026-09-03 | Метафоры карт | нет |

## Запланированные бесплатные источники (прод)

| Назначение | Источник | Лицензия | Атрибуция | Примечание |
|---|---|---|---|---|
| Иконки-метафоры (враги, действия, статусы, события) | https://game-icons.net/ | CC BY 3.0 | **да** (автор) | SVG, перекрашиваемые; не использовать целиком фэнтези-стиль |
| GUI-панelи/рамки/кнопки (прототип) | https://kenney.nl/assets/ui-pack | CC0 | нет | идеально для MVP, не финальный тёмный стиль |
| Доп. UI (sci-fi, pixel, adventure) | https://kenney.nl/assets/tag:interface | CC0 | нет | только если не хватает элемента |
| Текстуры-шум (3–8% opacity) | https://kenney.nl/assets/retro-textures-1 | CC0 | нет | как noise/scanline/panel grain |
| CC0 иллюстрации/текстуры | https://opengameart.org/ | CC0 / PubDom / CC-BY | зависит | лицензия на странице ассета |
| Доп. GUI-паки | https://itch.io/game-assets/free/tag-cc0/tag-gui | varies | зависит | «Free» ≠ коммерч. — проверять |

### Конкретные иконки «где искать» (заполняется по мере загрузки)

| Элемент | Где начать | Ключевые слова |
|---|---|---|
| Academy icon | Game-icons | `book`, `graduate`, `scroll`, `skills` |
| Arena icon | Game-icons | `sword`, `target`, `crosshair`, `battle` |
| Collection icon | Game-icons | `trophy`, `cards`, `inventory`, `collection` |
| Profile icon | Game-icons | `user`, `helmet`, `avatar` |
| Settings | Game-icons | `settings`, `gear`, `cog` |
| Notifications | Game-icons | `bell`, `notification`, `mail` |
| Chart tab | Game-icons | `chart`, `chart-up`, `candle` |
| News tab | Game-icons | `newspaper`, `news`, `megaphone` |
| On-chain tab | Game-icons | `chain`, `network`, `nodes` |
| Social sentiment | Game-icons | `message`, `chat`, `community` |
| Order book | Game-icons | `list`, `stack`, `layers`, `book` |
| Funding | Game-icons | `percentage`, `arrows`, `exchange` |
| Calendar | Game-icons | `calendar`, `event`, `clock` |
| Risk / warning | Game-icons | `warning`, `hazard`, `shield` |
| Lock/unlock | Game-icons | `lock`, `unlock`, `key` |
| Correct/incorrect | Game-icons | `checkmark`, `cross`, `cancel` |
| Wait/no-trade | Game-icons | `pause`, `hourglass`, `hand`, `eye` |
| Leverage Goblin | Game-icons | `goblin`, `imp`, `axe`, `coins` |
| Fake Breakout Phantom | Game-icons | `ghost`, `spectre`, `phantom` |
| FOMO Wraith | Game-icons | `skull`, `wraith`, `fire`, `eye` |
