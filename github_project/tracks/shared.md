# Трек `shared`

_Общие схемы, токены-манифест, движок сценариев, оценка (фазы 0,3,4-shared). Без React._

> Сгенерировано из `_meta/tasks.json`. Не редактировать вручную.

| ID | Задача | Фаза | Зависимости | Статус | Исполнитель |
|---|---|---|---|---|---|
| T001 | [Общие Zod-схемы домена](../tasks/T001_shared-schemas.md) | 0 | T000 | `todo` | — |
| T003 | [Схема и валидатор asset-manifest](../tasks/T003_asset-manifest.md) | 0 | T000, T001 | `todo` | — |
| T030 | [Модель ситуации + content-pack](../tasks/T030_scenario-model.md) | 3 | T001, T003 | `todo` | — |
| T031 | [Обёртка seedrandom](../tasks/T031_prng.md) | 3 | T030 | `todo` | — |
| T032 | [scenario-gen (детерминизм + сложность 0–99)](../tasks/T032_scenario-gen.md) | 3 | T031 | `todo` | — |
| T033 | [Профиль ошибок + адаптивная выдача](../tasks/T033_error-profile.md) | 3 | T032 | `todo` | — |
| T034 | [Детерминизм турниров (server-fixed seed)](../tasks/T034_tournament-determinism.md) | 3 | T032, T100 | `todo` | — |
| T044 | [Движок оценки](../tasks/T044_scoring-engine.md) | 4 | T030 | `todo` | — |

Берите первую `todo`-задачу, чьи зависимости имеют статус `approved`. Статус меняйте только CLI-командой из `05_AGENT_PROTOCOL.md`.
