# T022 · Оверлеи графика

> Сгенерировано из `_meta/tasks.json`. Не редактировать вручную.

- **Фаза:** 2 — Свечной график (CandleChart на Graphics)
- **Трек:** `frontend`
- **Статус:** `todo`
- **Исполнитель:** —
- **Зависимости:** T020
- **CEO-гейт:** нет
- **Обновлено:** 2026-09-08

## Цель
Оверлеи: risk-маркеры, decision-marker, уровни, interaction zone.

## Критерии приёмки
- [ ] markerGraphics рисует decision-marker и risk-маркеры
- [ ] Уровни (линии) рисуются Graphics, не растром
- [ ] interactionZone корректно бьёт по свечам

## Тест-план
- Vitest: geometry оверлеев
- Playwright: маркеры видны

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
python3 github_project/_meta/generate.py set-status T022 in_progress --agent <id> --note "что начато"
python3 github_project/_meta/generate.py set-status T022 done --agent <id> --note "тесты и результат"
```
