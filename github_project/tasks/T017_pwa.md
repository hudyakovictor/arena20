# T017 · PWA (vite-plugin-pwa)

> Сгенерировано из `_meta/tasks.json`. Не редактировать вручную.

- **Фаза:** 1 — Игровая оболочка (Game Shell)
- **Трек:** `frontend`
- **Статус:** `todo`
- **Исполнитель:** —
- **Зависимости:** T010
- **CEO-гейт:** нет
- **Обновлено:** 2026-09-08

## Цель
vite-plugin-pwa: offline-shell, manifest, иконки 192/512, service worker.

## Критерии приёмки
- [ ] manifest валиден; SW регистрируется
- [ ] Offline-shell даёт системные состояния (T18) без сети
- [ ] Иконки 192/512 сгенерированы

## Тест-план
- Playwright: Lighthouse PWA, офлайн-старт

## Обязательные ограничения
- Следовать `github_project/02_TECH_STACK.md` и `github_project/00_CONVENTIONS.md`.
- Не подменять компонент стека молча. Сначала диагностировать и зафиксировать доказательство; затем пометить задачу `blocked`.
- Отсутствующий необязательный арт заменять manifest-заглушкой `placeholder: true`, не выдумывая финальный ассет.
- Не использовать React в игровом UI; не кодировать смысл только цветом.

> 📌 vite-plugin-pwa обязателен.

## Лог статуса
| Дата | Агент | Статус | Заметка |
|---|---|---|---|
| 2026-09-08 | init | `todo` | задача импортирована в единый реестр |

## Команды статуса
```bash
python3 github_project/_meta/generate.py set-status T017 in_progress --agent <id> --note "что начато"
python3 github_project/_meta/generate.py set-status T017 done --agent <id> --note "тесты и результат"
```
