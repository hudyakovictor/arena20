# T100 · Каркас сервера (Fastify)

> Сгенерировано из `_meta/tasks.json`. Не редактировать вручную.

- **Фаза:** 10 — Бэкенд (Fastify + SQLite + Drizzle + Zod + WS)
- **Трек:** `backend`
- **Статус:** `approved`
- **Исполнитель:** agent-arena-01
- **Зависимости:** T000, T001
- **CEO-гейт:** нет
- **Обновлено:** 2026-09-08

## Цель
Fastify + Drizzle + SQLite: конфиг, миграции, seed, структура роутов/сервисов.

## Критерии приёмки
- [ ] Сервер стартует; SQLite через Drizzle; миграции применяются
- [ ] Zod на всех входах; структура роутов/сервисов

## Тест-план
- Vitest: boot сервера
- миграции применяются

## Обязательные ограничения
- Следовать `github_project/02_TECH_STACK.md` и `github_project/00_CONVENTIONS.md`.
- Не подменять компонент стека молча. Сначала диагностировать и зафиксировать доказательство; затем пометить задачу `blocked`.
- Отсутствующий необязательный арт заменять manifest-заглушкой `placeholder: true`, не выдумывая финальный ассет.
- Не использовать React в игровом UI; не кодировать смысл только цветом.

> 📌 Fastify+SQLite+Drizzle+Zod+WS обязательны (оставляем).

## Лог статуса
| Дата | Агент | Статус | Заметка |
|---|---|---|---|
| 2026-09-08 | init | `todo` | задача импортирована в единый реестр |
| 2026-09-08 | agent-arena-01 | `in_progress` | force: прямое назначение пользователя (vertical slice: shared+экраны phaser); deps approve позже |
| 2026-09-08 | agent-arena-01 | `done` | vitest server 3/3: /health, /api/content/version, миграции на :memory: + smoke tsx curl /health |
| 2026-09-08 | agent-arena-01 | `review` | PR #1 открыт |
| 2026-09-08 | agent-arena-01 | `approved` | PR #1 merged в main; принято CEO |

## Команды статуса
```bash
python3 github_project/_meta/generate.py set-status T100 in_progress --agent <id> --note "что начато"
python3 github_project/_meta/generate.py set-status T100 done --agent <id> --note "тесты и результат"
```
