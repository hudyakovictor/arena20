# T107 · Тесты бэкенда (Vitest + Playwright live)

> Сгенерировано из `_meta/tasks.json`. Не редактировать вручную.

- **Фаза:** 10 — Бэкенд (Fastify + SQLite + Drizzle + Zod + WS)
- **Трек:** `qa`
- **Статус:** `todo`
- **Исполнитель:** —
- **Зависимости:** T100, T101, T102, T103, T104, T105, T106
- **CEO-гейт:** нет
- **Обновлено:** 2026-09-08

## Цель
Покрытие сервисов Vitest + сквозные тесты против живого сервера Playwright.

## Критерии приёмки
- [ ] Vitest-покрытие сервисов ≥70%
- [ ] Playwright против живого сервера зелёный

## Тест-план
- vitest run server
- playwright run server

## Обязательные ограничения
- Следовать `github_project/02_TECH_STACK.md` и `github_project/00_CONVENTIONS.md`.
- Не подменять компонент стека молча. Сначала диагностировать и зафиксировать доказательство; затем пометить задачу `blocked`.
- Отсутствующий необязательный арт заменять manifest-заглушкой `placeholder: true`, не выдумывая финальный ассет.
- Не использовать React в игровом UI; не кодировать смысл только цветом.

## Лог статуса
| Дата | Агент | Статус | Заметка |
|---|---|---|---|
| 2026-09-08 | init | `todo` | задача импортирована в единый реестр |

## Команды статуса
```bash
python3 github_project/_meta/generate.py set-status T107 in_progress --agent <id> --note "что начато"
python3 github_project/_meta/generate.py set-status T107 done --agent <id> --note "тесты и результат"
```
