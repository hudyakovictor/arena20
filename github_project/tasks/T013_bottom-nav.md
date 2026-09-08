# T013 · Bottom navigation (5 слотов)

> Сгенерировано из `_meta/tasks.json`. Не редактировать вручную.

- **Фаза:** 1 — Игровая оболочка (Game Shell)
- **Трек:** `frontend`
- **Статус:** `in_progress`
- **Исполнитель:** agent-arena-01
- **Зависимости:** T011, T002
- **CEO-гейт:** нет
- **Обновлено:** 2026-09-08

## Цель
Нижняя навигация 5 слотов (Arena/Academy/Bestiary/Journal/More) на rexUI/SVG.

## Критерии приёмки
- [ ] 5 слотов, active-состояние по токену active (#C8F135)
- [ ] Средний слот — акцентный (Arena); touch 44×44
- [ ] Переключает сцены через роутер

## Тест-план
- Playwright: переключение слотов

## Обязательные ограничения
- Следовать `github_project/02_TECH_STACK.md` и `github_project/00_CONVENTIONS.md`.
- Не подменять компонент стека молча. Сначала диагностировать и зафиксировать доказательство; затем пометить задачу `blocked`.
- Отсутствующий необязательный арт заменять manifest-заглушкой `placeholder: true`, не выдумывая финальный ассет.
- Не использовать React в игровом UI; не кодировать смысл только цветом.

## Лог статуса
| Дата | Агент | Статус | Заметка |
|---|---|---|---|
| 2026-09-08 | init | `todo` | задача импортирована в единый реестр |
| 2026-09-08 | agent-arena-01 | `in_progress` | force: прямое назначение пользователя; реализовано + unit/typecheck/build green, playwright-часть плана ждёт CI (в песочнице нет браузеров: CDN заблокированы) |

## Команды статуса
```bash
python3 github_project/_meta/generate.py set-status T013 in_progress --agent <id> --note "что начато"
python3 github_project/_meta/generate.py set-status T013 done --agent <id> --note "тесты и результат"
```
