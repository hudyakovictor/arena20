# Трек `backend`

_Fastify/SQLite/Drizzle/Zod/WS сервер (фаза 10)._

> Сгенерировано из `_meta/tasks.json`. Не редактировать вручную.

| ID | Задача | Фаза | Зависимости | Статус | Исполнитель |
|---|---|---|---|---|---|
| T081 | [WS realtime + асинхронная оценка](../tasks/T081_tournament-ws.md) | 8 | T080, T104 | `todo` | — |
| T100 | [Каркас сервера (Fastify)](../tasks/T100_server-scaffold.md) | 10 | T000, T001 | `approved` | agent-arena-01 |
| T101 | [Профили и персист прогресса](../tasks/T101_profiles.md) | 10 | T100 | `todo` | — |
| T102 | [Отдача сценариев/ассетов + версионность + хэш future](../tasks/T102_content-serving.md) | 10 | T100, T030, T003 | `todo` | — |
| T103 | [Персист журнала/результатов + профиль ошибок](../tasks/T103_journal-persist.md) | 10 | T101, T044 | `todo` | — |
| T104 | [Турнир-сервис + WS](../tasks/T104_tournament-service.md) | 10 | T102, T034 | `todo` | — |
| T105 | [Античит (server-fixed seeds, защита future)](../tasks/T105_anti-cheat.md) | 10 | T104, T102 | `todo` | — |
| T106 | [Zod-контракты API + OpenAPI](../tasks/T106_api-contracts.md) | 10 | T100, T001 | `todo` | — |

Берите первую `todo`-задачу, чьи зависимости имеют статус `approved`. Статус меняйте только CLI-командой из `05_AGENT_PROTOCOL.md`.
