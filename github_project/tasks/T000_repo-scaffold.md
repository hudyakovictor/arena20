# T000 · Каркас репозитория и монорепо

> Сгенерировано из `_meta/tasks.json`. Не редактировать вручную.

- **Фаза:** 0 — Фундамент и конвенции (Foundation)
- **Трек:** `foundation`
- **Статус:** `todo`
- **Исполнитель:** —
- **Зависимости:** —
- **CEO-гейт:** нет
- **Обновлено:** 2026-09-08

## Цель
Создать структуру client/shared/admin, workspace, tsconfig base, eslint, prettier, .gitignore, скелет CI, корневой README.

## Критерии приёмки
- [ ] Папки client/shared/admin существуют с README, ссылающимся на github_project
- [ ] pnpm/npm workspace настроен; базовый tsconfig (strict) общий
- [ ] eslint+prettier с правилами (no-react-in-game, запрет emoji/icon-font как prod-иконок)
- [ ] CI: lint + typecheck + генерация статус-лога проходит на пустом каркасе
- [ ] Корневой README отсылает в github_project/README.md

## Тест-план
- CI зелёный на пустом каркасе
- npm run typecheck без ошибок

## Обязательные ограничения
- Следовать `github_project/02_TECH_STACK.md` и `github_project/00_CONVENTIONS.md`.
- Не подменять компонент стека молча. Сначала диагностировать и зафиксировать доказательство; затем пометить задачу `blocked`.
- Отсутствующий необязательный арт заменять manifest-заглушкой `placeholder: true`, не выдумывая финальный ассет.
- Не использовать React в игровом UI; не кодировать смысл только цветом.

> 📌 Не реализовывать игру здесь — только каркас и конвенции.

## Лог статуса
| Дата | Агент | Статус | Заметка |
|---|---|---|---|
| 2026-09-08 | init | `todo` | задача импортирована в единый реестр |

## Команды статуса
```bash
python3 github_project/_meta/generate.py set-status T000 in_progress --agent <id> --note "что начато"
python3 github_project/_meta/generate.py set-status T000 done --agent <id> --note "тесты и результат"
```
