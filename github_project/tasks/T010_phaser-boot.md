# T010 · Phaser 4 boot + Vite + Canvas

> Сгенерировано из `_meta/tasks.json`. Не редактировать вручную.

- **Фаза:** 1 — Игровая оболочка (Game Shell)
- **Трек:** `frontend`
- **Статус:** `in_progress`
- **Исполнитель:** agent-arena-01
- **Зависимости:** T000, T002
- **CEO-гейт:** нет
- **Обновлено:** 2026-09-08

## Цель
Старт Phaser 4 (^4.2.1, WebGL), Vite, один canvas, portrait Scale.FIT, game loop, базовый preload.

## Критерии приёмки
- [ ] Один WebGL-canvas на весь экран; Scale менеджер portrait
- [ ] Game loop работает; FPS метрика видна в dev
- [ ] Phaser 4 (не 3); Canvas deprecated — используем WebGL

## Тест-план
- Playwright: canvas присутствует, игра boot'ится
- Vitest: конфиг валиден

## Обязательные ограничения
- Следовать `github_project/02_TECH_STACK.md` и `github_project/00_CONVENTIONS.md`.
- Не подменять компонент стека молча. Сначала диагностировать и зафиксировать доказательство; затем пометить задачу `blocked`.
- Отсутствующий необязательный арт заменять manifest-заглушкой `placeholder: true`, не выдумывая финальный ассет.
- Не использовать React в игровом UI; не кодировать смысл только цветом.

> 📌 Стек Phaser 4 обязателен. Если Phaser 4 недоступен в реестре — задача BLOCKED, не заменять на Phaser 3.

## Лог статуса
| Дата | Агент | Статус | Заметка |
|---|---|---|---|
| 2026-09-08 | init | `todo` | задача импортирована в единый реестр |
| 2026-09-08 | agent-arena-01 | `in_progress` | force: прямое назначение пользователя; реализовано + unit/typecheck/build green, playwright-часть плана ждёт CI (в песочнице нет браузеров: CDN заблокированы) |

## Команды статуса
```bash
python3 github_project/_meta/generate.py set-status T010 in_progress --agent <id> --note "что начато"
python3 github_project/_meta/generate.py set-status T010 done --agent <id> --note "тесты и результат"
```
