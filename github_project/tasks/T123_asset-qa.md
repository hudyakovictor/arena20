# T123 · SVG/растр QA

> Сгенерировано из `_meta/tasks.json`. Не редактировать вручную.

- **Фаза:** 12 — Полировка, QA, бюджеты, i18n, a11y
- **Трек:** `qa`
- **Статус:** `todo`
- **Исполнитель:** —
- **Зависимости:** T004, T062
- **CEO-гейт:** нет
- **Обновлено:** 2026-09-08

## Цель
SVG: 16/20/24/28px, tint (active/disabled/warning/danger/data/noise), тёмный/светлый фон, touch 44×44. Растр: decode, crop, lazy, placeholder, category color.

## Критерии приёмки
- [ ] SVG-иконки проходят QA-матрицу
- [ ] Растр: hero-art не в первом сценарии; crop/safe-area корректны

## Тест-план
- Playwright: QA-матрица иконок/растра

## Обязательные ограничения
- Следовать `github_project/02_TECH_STACK.md` и `github_project/00_CONVENTIONS.md`.
- Не подменять компонент стека молча. Сначала диагностировать и зафиксировать доказательство; затем пометить задачу `blocked`.
- Отсутствующий необязательный арт заменять manifest-заглушкой `placeholder: true`, не выдумывая финальный ассет.
- Не использовать React в игровом UI; не кодировать смысл только цветом.

> 📌 См. ICON_NOTES: знак больше плашки — уменьшить.

## Лог статуса
| Дата | Агент | Статус | Заметка |
|---|---|---|---|
| 2026-09-08 | init | `todo` | задача импортирована в единый реестр |

## Команды статуса
```bash
python3 github_project/_meta/generate.py set-status T123 in_progress --agent <id> --note "что начато"
python3 github_project/_meta/generate.py set-status T123 done --agent <id> --note "тесты и результат"
```
