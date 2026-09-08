# Трек `frontend`

_Phaser 4 игра: shell, график, Арена, Академия, Бестиарий, Журнал, Турниры, Маркет, i18n (фазы 1,2,4–9,12)._

> Сгенерировано из `_meta/tasks.json`. Не редактировать вручную.

| ID | Задача | Фаза | Зависимости | Статус | Исполнитель |
|---|---|---|---|---|---|
| T002 | [Модуль дизайн-токенов](../tasks/T002_design-tokens.md) | 0 | T000 | `todo` | — |
| T004 | [Пайплайн сборки ассетов](../tasks/T004_asset-pipeline.md) | 0 | T000, T002, T003 | `todo` | — |
| T010 | [Phaser 4 boot + Vite + Canvas](../tasks/T010_phaser-boot.md) | 1 | T000, T002 | `todo` | — |
| T011 | [Архитектура сцен и роутер](../tasks/T011_scene-arch.md) | 1 | T010 | `todo` | — |
| T012 | [Top Bar (rexUI)](../tasks/T012_topbar.md) | 1 | T011, T002 | `todo` | — |
| T013 | [Bottom navigation (5 слотов)](../tasks/T013_bottom-nav.md) | 1 | T011, T002 | `todo` | — |
| T014 | [rexUI базовые компоненты](../tasks/T014_rexiu-base.md) | 1 | T011 | `todo` | — |
| T015 | [Zustand-store + персист](../tasks/T015_zustand-store.md) | 1 | T011, T001 | `todo` | — |
| T016 | [Звук (Phaser Sound) + настройки](../tasks/T016_sound.md) | 1 | T011, T015 | `todo` | — |
| T017 | [PWA (vite-plugin-pwa)](../tasks/T017_pwa.md) | 1 | T010 | `todo` | — |
| T018 | [Системные состояния (loading/offline/empty/error)](../tasks/T018_sys-states.md) | 1 | T014, T017 | `todo` | — |
| T020 | [CandleChart core (Graphics)](../tasks/T020_chart-core.md) | 2 | T014, T001 | `todo` | — |
| T021 | [Reveal скрытого future](../tasks/T021_chart-reveal.md) | 2 | T020 | `todo` | — |
| T022 | [Оверлеи графика](../tasks/T022_chart-overlay.md) | 2 | T020 | `todo` | — |
| T023 | [Производительность графика](../tasks/T023_chart-perf.md) | 2 | T020, T021, T022 | `todo` | — |
| T040 | [ArenaScene (полный экран задания)](../tasks/T040_arena-scene.md) | 4 | T014, T020, T030 | `todo` | — |
| T041 | [Захват решения + доказательства + протокол](../tasks/T041_decision-capture.md) | 4 | T040 | `todo` | — |
| T042 | [Reveal-флоу (факт→последствие→качество)](../tasks/T042_reveal-flow.md) | 4 | T041, T021 | `todo` | — |
| T043 | [Экран вердикта (панк-таблоид)](../tasks/T043_verdict.md) | 4 | T042 | `todo` | — |
| T045 | [Интеграция сущностей](../tasks/T045_entity-integration.md) | 4 | T040, T060 | `todo` | — |
| T046 | [Интеграция протоколов](../tasks/T046_protocol-integration.md) | 4 | T040, T044 | `todo` | — |
| T047 | [Onboarding прогрессивного раскрытия](../tasks/T047_onboarding.md) | 4 | T040, T045, T046 | `todo` | — |
| T050 | [AcademyScene (теория)](../tasks/T050_academy-scene.md) | 5 | T014, T030 | `todo` | — |
| T051 | [Навигация Академии](../tasks/T051_academy-nav.md) | 5 | T050, T040 | `todo` | — |
| T060 | [Grid Бестиария (lazy)](../tasks/T060_bestiary-grid.md) | 6 | T014, T004 | `todo` | — |
| T061 | [Детальный экран сущности](../tasks/T061_entity-detail.md) | 6 | T060 | `todo` | — |
| T062 | [Интеграция SVG-иконок сущностей 24×24](../tasks/T062_entity-icons.md) | 6 | T004, T060 | `todo` | — |
| T070 | [Журнал решений](../tasks/T070_journal.md) | 7 | T048, T044 | `todo` | — |
| T071 | [Профиль (XP/ранг/стрик/ачивки)](../tasks/T071_profile.md) | 7 | T015, T070 | `todo` | — |
| T072 | [Рекомендации по повтору](../tasks/T072_repeat-recs.md) | 7 | T070, T033 | `todo` | — |
| T080 | [Турниры: список/вход/лидерборд](../tasks/T080_tournament-ui.md) | 8 | T034, T042 | `todo` | — |
| T090 | [Маркетплейс (косметика)](../tasks/T090_market-ui.md) | 9 | T014 | `todo` | — |
| T091 | [Заглушка покупки (без платежей)](../tasks/T091_purchase-stub.md) | 9 | T090 | `todo` | — |
| T122 | [i18n (RU + EN)](../tasks/T122_i18n.md) | 12 | T113 | `todo` | — |

Берите первую `todo`-задачу, чьи зависимости имеют статус `approved`. Статус меняйте только CLI-командой из `05_AGENT_PROTOCOL.md`.
