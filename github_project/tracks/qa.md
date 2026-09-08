# Трек `qa`

_Тесты, бюджеты, матрица UI, i18n-гейт, релиз (фазы 0,2,3,4,10,12,13)._

> Сгенерировано из `_meta/tasks.json`. Не редактировать вручную.

| ID | Задача | Фаза | Зависимости | Статус | Исполнитель |
|---|---|---|---|---|---|
| T005 | [Финализация github_project (эта система)](../tasks/T005_agent-docs.md) | 0 | T000 | `todo` | — |
| T024 | [Юнит-тесты CandleChart](../tasks/T024_chart-tests.md) | 2 | T020, T021, T022, T023 | `todo` | — |
| T035 | [Тесты scenario-gen](../tasks/T035_scenario-tests.md) | 3 | T032, T033, T034 | `todo` | — |
| T048 | [Playwright e2e Арены](../tasks/T048_arena-e2e.md) | 4 | T040, T041, T042, T043, T044, T045, T046, T047 | `todo` | — |
| T107 | [Тесты бэкенда (Vitest + Playwright live)](../tasks/T107_backend-tests.md) | 10 | T100, T101, T102, T103, T104, T105, T106 | `todo` | — |
| T120 | [Бюджеты перф. в CI](../tasks/T120_perf-budgets.md) | 12 | T004, T020, T060 | `todo` | — |
| T121 | [Матрица UI (устройства/a11y)](../tasks/T121_ui-matrix.md) | 12 | T012, T013, T018 | `todo` | — |
| T123 | [SVG/растр QA](../tasks/T123_asset-qa.md) | 12 | T004, T062 | `todo` | — |
| T124 | [Гейт покрытия Vitest + Playwright](../tasks/T124_coverage-gate.md) | 12 | T024, T035, T048, T107, T120, T121, T122, T123 | `todo` | — |
| T132 | [Фриз документации + чек-лист релиза](../tasks/T132_release-freeze.md) | 13 | T124, T131 | `todo` | — |

Берите первую `todo`-задачу, чьи зависимости имеют статус `approved`. Статус меняйте только CLI-командой из `05_AGENT_PROTOCOL.md`.
