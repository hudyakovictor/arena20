# T011 · Архитектура сцен и роутер

> Сгенерировано из `_meta/tasks.json`. Не редактировать вручную.

- **Фаза:** 1 — Игровая оболочка (Game Shell)
- **Трек:** `frontend`
- **Статус:** `in_progress`
- **Исполнитель:** agent-arena-01
- **Зависимости:** T010
- **CEO-гейт:** нет
- **Обновлено:** 2026-09-08

## Цель
BootScene/PreloadScene/ShellScene + router между экранами (Arena/Academy/Threats/Journal/More) без React.

## Критерии приёмки
- [ ] Сцены загружаются лениво; ShellScene постоянна (top bar + bottom nav)
- [ ] Роутинг декларативный, на Zustand-сторе, без React
- [ ] Переходы между заглушками-сценами работают

## Тест-план
- Playwright: навигация Boot→Shell→заглушка сцены

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
python3 github_project/_meta/generate.py set-status T011 in_progress --agent <id> --note "что начато"
python3 github_project/_meta/generate.py set-status T011 done --agent <id> --note "тесты и результат"
```
