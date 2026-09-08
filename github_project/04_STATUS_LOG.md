# 04 · STATUS LOG — статус проекта

> Сгенерировано из `_meta/tasks.json`. Не редактировать вручную.

## Как изменить статус
```bash
python3 github_project/_meta/generate.py set-status T000 in_progress --agent <id> --note "начал работу"
python3 github_project/_meta/generate.py set-status T000 done --agent <id> --note "npm test: ok"
python3 github_project/_meta/generate.py check
```

Переходы: `todo → in_progress → done → review → approved`; `in_progress → blocked → in_progress`; `review → in_progress`.

## Фаза 0 — Фундамент и конвенции (Foundation)

_Репозиторий, монорепо-каркас, общие схемы, дизайн-токены, пайплайн ассетов, статус-система._

| ID | Задача | Трек | Статус | Исполнитель | Обновлено | Гейт |
|---|---|---|---|---|---|---|
| T000 | [Каркас репозитория и монорепо](./tasks/T000_repo-scaffold.md) | `foundation` | `done` | agent-arena-01 | 2026-09-08 |  |
| T001 | [Общие Zod-схемы домена](./tasks/T001_shared-schemas.md) | `shared` | `done` | agent-arena-01 | 2026-09-08 |  |
| T002 | [Модуль дизайн-токенов](./tasks/T002_design-tokens.md) | `frontend` | `done` | agent-arena-01 | 2026-09-08 |  |
| T003 | [Схема и валидатор asset-manifest](./tasks/T003_asset-manifest.md) | `shared` | `todo` | — | 2026-09-08 |  |
| T004 | [Пайплайн сборки ассетов](./tasks/T004_asset-pipeline.md) | `frontend` | `todo` | — | 2026-09-08 |  |
| T005 | [Финализация github_project (эта система)](./tasks/T005_agent-docs.md) | `qa` | `todo` | — | 2026-09-08 |  |

## Фаза 1 — Игровая оболочка (Game Shell) 🔴CEO

_Phaser 4 boot, единый Canvas, сцены, оболочка (top bar + bottom nav), rexUI-компоненты, Zustand, звук, PWA, системные состояния._

| ID | Задача | Трек | Статус | Исполнитель | Обновлено | Гейт |
|---|---|---|---|---|---|---|
| T010 | [Phaser 4 boot + Vite + Canvas](./tasks/T010_phaser-boot.md) | `frontend` | `in_progress` | agent-arena-01 | 2026-09-08 |  |
| T011 | [Архитектура сцен и роутер](./tasks/T011_scene-arch.md) | `frontend` | `in_progress` | agent-arena-01 | 2026-09-08 |  |
| T012 | [Top Bar (rexUI)](./tasks/T012_topbar.md) | `frontend` | `in_progress` | agent-arena-01 | 2026-09-08 | 🔴 |
| T013 | [Bottom navigation (5 слотов)](./tasks/T013_bottom-nav.md) | `frontend` | `in_progress` | agent-arena-01 | 2026-09-08 |  |
| T014 | [rexUI базовые компоненты](./tasks/T014_rexiu-base.md) | `frontend` | `in_progress` | agent-arena-01 | 2026-09-08 |  |
| T015 | [Zustand-store + персист](./tasks/T015_zustand-store.md) | `frontend` | `in_progress` | agent-arena-01 | 2026-09-08 |  |
| T016 | [Звук (Phaser Sound) + настройки](./tasks/T016_sound.md) | `frontend` | `in_progress` | agent-arena-01 | 2026-09-08 |  |
| T017 | [PWA (vite-plugin-pwa)](./tasks/T017_pwa.md) | `frontend` | `in_progress` | agent-arena-01 | 2026-09-08 |  |
| T018 | [Системные состояния (loading/offline/empty/error)](./tasks/T018_sys-states.md) | `frontend` | `in_progress` | agent-arena-01 | 2026-09-08 |  |

## Фаза 2 — Свечной график (CandleChart на Graphics) 🔴CEO

_Кастомный CandleChart: сетка, свечи из OHLCV, скейлинг, камера, анимация раскрытия скрытого будущего, оверлеи._

| ID | Задача | Трек | Статус | Исполнитель | Обновлено | Гейт |
|---|---|---|---|---|---|---|
| T020 | [CandleChart core (Graphics)](./tasks/T020_chart-core.md) | `frontend` | `in_progress` | agent-arena-01 | 2026-09-08 | 🔴 |
| T021 | [Reveal скрытого future](./tasks/T021_chart-reveal.md) | `frontend` | `in_progress` | agent-arena-01 | 2026-09-08 |  |
| T022 | [Оверлеи графика](./tasks/T022_chart-overlay.md) | `frontend` | `todo` | — | 2026-09-08 |  |
| T023 | [Производительность графика](./tasks/T023_chart-perf.md) | `frontend` | `todo` | — | 2026-09-08 |  |
| T024 | [Юнит-тесты CandleChart](./tasks/T024_chart-tests.md) | `qa` | `todo` | — | 2026-09-08 |  |

## Фаза 3 — Движок сценариев (scenario-gen + seedrandom)

_Детерминированный генератор задач: модель данных, seedrandom-PRNG, scenario-gen, адаптация к ошибкам, детерминизм турниров._

| ID | Задача | Трек | Статус | Исполнитель | Обновлено | Гейт |
|---|---|---|---|---|---|---|
| T030 | [Модель ситуации + content-pack](./tasks/T030_scenario-model.md) | `shared` | `done` | agent-arena-01 | 2026-09-08 |  |
| T031 | [Обёртка seedrandom](./tasks/T031_prng.md) | `shared` | `done` | agent-arena-01 | 2026-09-08 |  |
| T032 | [scenario-gen (детерминизм + сложность 0–99)](./tasks/T032_scenario-gen.md) | `shared` | `todo` | — | 2026-09-08 |  |
| T033 | [Профиль ошибок + адаптивная выдача](./tasks/T033_error-profile.md) | `shared` | `todo` | — | 2026-09-08 |  |
| T034 | [Детерминизм турниров (server-fixed seed)](./tasks/T034_tournament-determinism.md) | `shared` | `todo` | — | 2026-09-08 |  |
| T035 | [Тесты scenario-gen](./tasks/T035_scenario-tests.md) | `qa` | `todo` | — | 2026-09-08 |  |

## Фаза 4 — Игровой цикл Арены (Arena Loop) 🔴CEO

_Полный цикл задания: текст→браузер-вкладки→карты навыков→4 решения→опц. 2-й шаг→reveal→вердикт→оценка._

| ID | Задача | Трек | Статус | Исполнитель | Обновлено | Гейт |
|---|---|---|---|---|---|---|
| T040 | [ArenaScene (полный экран задания)](./tasks/T040_arena-scene.md) | `frontend` | `in_progress` | agent-arena-01 | 2026-09-08 | 🔴 |
| T041 | [Захват решения + доказательства + протокол](./tasks/T041_decision-capture.md) | `frontend` | `in_progress` | agent-arena-01 | 2026-09-08 |  |
| T042 | [Reveal-флоу (факт→последствие→качество)](./tasks/T042_reveal-flow.md) | `frontend` | `in_progress` | agent-arena-01 | 2026-09-08 |  |
| T043 | [Экран вердикта (панк-таблоид)](./tasks/T043_verdict.md) | `frontend` | `in_progress` | agent-arena-01 | 2026-09-08 |  |
| T044 | [Движок оценки](./tasks/T044_scoring-engine.md) | `shared` | `todo` | — | 2026-09-08 |  |
| T045 | [Интеграция сущностей](./tasks/T045_entity-integration.md) | `frontend` | `todo` | — | 2026-09-08 |  |
| T046 | [Интеграция протоколов](./tasks/T046_protocol-integration.md) | `frontend` | `todo` | — | 2026-09-08 |  |
| T047 | [Onboarding прогрессивного раскрытия](./tasks/T047_onboarding.md) | `frontend` | `todo` | — | 2026-09-08 |  |
| T048 | [Playwright e2e Арены](./tasks/T048_arena-e2e.md) | `qa` | `todo` | — | 2026-09-08 |  |

## Фаза 5 — Академия (Academy)

_Теория, привязанная к картам навыков и сценариям; навигация skill→theory→scenarios._

| ID | Задача | Трек | Статус | Исполнитель | Обновлено | Гейт |
|---|---|---|---|---|---|---|
| T050 | [AcademyScene (теория)](./tasks/T050_academy-scene.md) | `frontend` | `todo` | — | 2026-09-08 |  |
| T051 | [Навигация Академии](./tasks/T051_academy-nav.md) | `frontend` | `todo` | — | 2026-09-08 |  |

## Фаза 6 — Бестиарий (Bestiary) 🔴CEO

_Коллекция сущностей: grid (lazy thumbs), состояния, детальный экран, интеграция SVG-иконок 24×24._

| ID | Задача | Трек | Статус | Исполнитель | Обновлено | Гейт |
|---|---|---|---|---|---|---|
| T060 | [Grid Бестиария (lazy)](./tasks/T060_bestiary-grid.md) | `frontend` | `todo` | — | 2026-09-08 | 🔴 |
| T061 | [Детальный экран сущности](./tasks/T061_entity-detail.md) | `frontend` | `todo` | — | 2026-09-08 |  |
| T062 | [Интеграция SVG-иконок сущностей 24×24](./tasks/T062_entity-icons.md) | `frontend` | `todo` | — | 2026-09-08 |  |

## Фаза 7 — Журнал решений и профиль (Journal & Profile)

_Персональная история решений, повторяющиеся паттерны, профиль (XP/ранг/стрик/ачивки/badge)._

| ID | Задача | Трек | Статус | Исполнитель | Обновлено | Гейт |
|---|---|---|---|---|---|---|
| T070 | [Журнал решений](./tasks/T070_journal.md) | `frontend` | `todo` | — | 2026-09-08 |  |
| T071 | [Профиль (XP/ранг/стрик/ачивки)](./tasks/T071_profile.md) | `frontend` | `todo` | — | 2026-09-08 |  |
| T072 | [Рекомендации по повтору](./tasks/T072_repeat-recs.md) | `frontend` | `todo` | — | 2026-09-08 |  |

## Фаза 8 — Турниры / PvP (async)

_Асинхронные турниры на зафиксированных сервером сценариях; лидерборд; WS._

| ID | Задача | Трек | Статус | Исполнитель | Обновлено | Гейт |
|---|---|---|---|---|---|---|
| T080 | [Турниры: список/вход/лидерборд](./tasks/T080_tournament-ui.md) | `frontend` | `todo` | — | 2026-09-08 |  |
| T081 | [WS realtime + асинхронная оценка](./tasks/T081_tournament-ws.md) | `backend` | `todo` | — | 2026-09-08 |  |

## Фаза 9 — Маркет (косметика)

_Внутренний маркетплейс косметики/тем/сезонов/авторского контента. Без pay-to-win._

| ID | Задача | Трек | Статус | Исполнитель | Обновлено | Гейт |
|---|---|---|---|---|---|---|
| T090 | [Маркетплейс (косметика)](./tasks/T090_market-ui.md) | `frontend` | `todo` | — | 2026-09-08 |  |
| T091 | [Заглушка покупки (без платежей)](./tasks/T091_purchase-stub.md) | `frontend` | `todo` | — | 2026-09-08 |  |

## Фаза 10 — Бэкенд (Fastify + SQLite + Drizzle + Zod + WS)

_Сервер: схема БД, профили/прогресс, отдача сценариев/ассетов, журнал, турниры, античит, контракты API._

| ID | Задача | Трек | Статус | Исполнитель | Обновлено | Гейт |
|---|---|---|---|---|---|---|
| T100 | [Каркас сервера (Fastify)](./tasks/T100_server-scaffold.md) | `backend` | `done` | agent-arena-01 | 2026-09-08 |  |
| T101 | [Профили и персист прогресса](./tasks/T101_profiles.md) | `backend` | `todo` | — | 2026-09-08 |  |
| T102 | [Отдача сценариев/ассетов + версионность + хэш future](./tasks/T102_content-serving.md) | `backend` | `todo` | — | 2026-09-08 |  |
| T103 | [Персист журнала/результатов + профиль ошибок](./tasks/T103_journal-persist.md) | `backend` | `todo` | — | 2026-09-08 |  |
| T104 | [Турнир-сервис + WS](./tasks/T104_tournament-service.md) | `backend` | `todo` | — | 2026-09-08 |  |
| T105 | [Античит (server-fixed seeds, защита future)](./tasks/T105_anti-cheat.md) | `backend` | `todo` | — | 2026-09-08 |  |
| T106 | [Zod-контракты API + OpenAPI](./tasks/T106_api-contracts.md) | `backend` | `todo` | — | 2026-09-08 |  |
| T107 | [Тесты бэкенда (Vitest + Playwright live)](./tasks/T107_backend-tests.md) | `qa` | `todo` | — | 2026-09-08 |  |

## Фаза 11 — Авторство контента (Content) 🔴CEO

_25–40 исторических ситуаций (MVP), 8–12 карт навыков, 6–8 сущностей, протоколы, теория Академии, панк-таблоид copy._

| ID | Задача | Трек | Статус | Исполнитель | Обновлено | Гейт |
|---|---|---|---|---|---|---|
| T110 | [Авторство: 25–40 исторических ситуаций](./tasks/T110_content-scenarios.md) | `content` | `todo` | — | 2026-09-08 |  |
| T111 | [Авторство: скиллы, сущности, протоколы](./tasks/T111_content-skills-entities.md) | `content` | `todo` | — | 2026-09-08 |  |
| T112 | [Авторство: теория Академии](./tasks/T112_content-academy.md) | `content` | `todo` | — | 2026-09-08 |  |
| T113 | [Прогон copy (панк-таблоид)](./tasks/T113_copy-voice.md) | `content` | `todo` | — | 2026-09-08 | 🔴 |

## Фаза 12 — Полировка, QA, бюджеты, i18n, a11y

_Бюджеты производительности в CI, матрица UI, i18n (RU+EN), SVG/растр QA, покрытие Vitest+Playwright._

| ID | Задача | Трек | Статус | Исполнитель | Обновлено | Гейт |
|---|---|---|---|---|---|---|
| T120 | [Бюджеты перф. в CI](./tasks/T120_perf-budgets.md) | `qa` | `todo` | — | 2026-09-08 |  |
| T121 | [Матрица UI (устройства/a11y)](./tasks/T121_ui-matrix.md) | `qa` | `todo` | — | 2026-09-08 |  |
| T122 | [i18n (RU + EN)](./tasks/T122_i18n.md) | `frontend` | `todo` | — | 2026-09-08 |  |
| T123 | [SVG/растр QA](./tasks/T123_asset-qa.md) | `qa` | `todo` | — | 2026-09-08 |  |
| T124 | [Гейт покрытия Vitest + Playwright](./tasks/T124_coverage-gate.md) | `qa` | `todo` | — | 2026-09-08 |  |

## Фаза 13 — Релиз и передача в Admin/CRM 🔴CEO

_Каркас админ-панели и CRM (план+сборка позже), подключение AI-API (план), фриз документации, чек-лист релиза._

| ID | Задача | Трек | Статус | Исполнитель | Обновлено | Гейт |
|---|---|---|---|---|---|---|
| T130 | [Каркас админ-панели и CRM (план+сборка позже)](./tasks/T130_admin-scaffold.md) | `admin` | `todo` | — | 2026-09-08 |  |
| T131 | [Подключение AI-API в админке (план)](./tasks/T131_admin-ai-api.md) | `admin` | `todo` | — | 2026-09-08 |  |
| T132 | [Фриз документации + чек-лист релиза](./tasks/T132_release-freeze.md) | `qa` | `todo` | — | 2026-09-08 | 🔴 |

## Итого
- Задач: 67. Принято: 0 (0%).
- В работе: 15. На ревью: 0. Заблокировано: 0.
