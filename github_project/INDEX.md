# INDEX — карта `github_project`

Навигационная страница. Если не знаешь, с чего начать — иди по порядку.

## 0. Старт
- [README.md](./README.md) — что это, кто главный, золотое правило.
- [00_CONVENTIONS.md](./00_CONVENTIONS.md) — репо, нейминг, PR, код-правила.
- [05_AGENT_PROTOCOL.md](./05_AGENT_PROTOCOL.md) — **как брать и закрывать задачу**.
- [04_STATUS_LOG.md](./04_STATUS_LOG.md) — **что сейчас в работе** (обновляется агентами).

## 0.5 Где информация по игре (исходники)
- [SOURCE_MATERIALS.md](./SOURCE_MATERIALS.md) — прототип, спецы, иконки, бренд лежат в **github_project/source/**; здесь карта.

## 1. Что строим
- [01_PRODUCT.md](./01_PRODUCT.md) — конспект продукта (границы, механика, режимы, монетизация, MVP).
- Канонические исходники в `github_project/source/`: `signal-arena-product-mechanics-spec.md`, `signal-arena-ui-graphics-spec-v1.1.md.md`, `signal-arena-assets-spec.md`, `crypto_competitors_analysis.md`, `style-tone.txt`, `readme.md` (бренд), `signal-arena-prototype(2).html` (UX-прототип), `signal_arena_skill_icons_svg.zip` (иконки), `brand_identity.zip`, `ideas-ui.zip`.

## 2. Как строим
- [02_TECH_STACK.md](./02_TECH_STACK.md) — обязательный стек + жёсткое правило (нет обходного пути).
- [03_MASTER_PLAN.md](./03_MASTER_PLAN.md) — фазы 0→13, milestones, критерий релиза.
- [07_TRACKS.md](./07_TRACKS.md) — как работа делится на треки.
  - `tracks/frontend.md`, `tracks/backend.md`, `tracks/shared.md`, `tracks/content.md`, `tracks/qa.md`, `tracks/admin.md`, `tracks/foundation.md`

## 3. Как сдаём
- [05_AGENT_PROTOCOL.md](./05_AGENT_PROTOCOL.md) — протокол исполнения.
- [06_REVIEW_WORKFLOW.md](./06_REVIEW_WORKFLOW.md) — кто проверяет, PR, доработки, слияние, CEO-гейты.

## 4. Ассеты
- [assets/ASSET_PIPELINE.md](./assets/ASSET_PIPELINE.md) — SVG→атлас, manifest, бюджеты.
- [assets/ICON_NOTES.md](./assets/ICON_NOTES.md) — **правка иконок: знак больше плашки → уменьшить**.

## 5. Админ/CRM и AI (план)
- [admin/ADMIN_ROADMAP.md](./admin/ADMIN_ROADMAP.md) — админ-панель, CRM, подключение AI-API (будущее).

## 6. Для CEO
- [ceo/INTERVENTION_POINTS.md](./ceo/INTERVENTION_POINTS.md) — когда гендиректор скачивает и смотрит глазами.
- [ceo/HANDOFF_TEMPLATE.md](./ceo/HANDOFF_TEMPLATE.md) — шаблон выдачи задач агенту («ссылка + твои задачи»).

## Задачи (по фазам)
| Фаза | Тема | Задачи |
|---|---|---|
| 0 | Фундамент | T000–T005 |
| 1 | Game Shell | T010–T018 |
| 2 | CandleChart | T020–T024 |
| 3 | scenario-gen | T030–T035 |
| 4 | Arena Loop | T040–T048 |
| 5 | Academy | T050–T051 |
| 6 | Bestiary | T060–T062 |
| 7 | Journal/Profile | T070–T072 |
| 8 | Tournaments | T080–T081 |
| 9 | Market | T090–T091 |
| 10 | Backend | T100–T107 |
| 11 | Content | T110–T113 |
| 12 | QA/Perf/i18n | T120–T124 |
| 13 | Release/Admin | T130–T132 |

Все файлы задач: [tasks/](./tasks/). Единый статус: [04_STATUS_LOG.md](./04_STATUS_LOG.md).
