# T031 · Обёртка seedrandom

> Сгенерировано из `_meta/tasks.json`. Не редактировать вручную.

- **Фаза:** 3 — Движок сценариев (scenario-gen + seedrandom)
- **Трек:** `shared`
- **Статус:** `approved`
- **Исполнитель:** agent-arena-01
- **Зависимости:** T030
- **CEO-гейт:** нет
- **Обновлено:** 2026-09-08

## Цель
Детерминированный PRNG: seed = scenarioId + contentVersion; воспроизводимость.

## Критерии приёмки
- [ ] Один seed → один поток чисел
- [ ] seedrandom использован (НЕ Math.random)
- [ ] Пересев при смене версии контента

## Тест-план
- Vitest: воспроизводимость по 1000 seed

## Обязательные ограничения
- Следовать `github_project/02_TECH_STACK.md` и `github_project/00_CONVENTIONS.md`.
- Не подменять компонент стека молча. Сначала диагностировать и зафиксировать доказательство; затем пометить задачу `blocked`.
- Отсутствующий необязательный арт заменять manifest-заглушкой `placeholder: true`, не выдумывая финальный ассет.
- Не использовать React в игровом UI; не кодировать смысл только цветом.

> 📌 seedrandom обязателен.

## Лог статуса
| Дата | Агент | Статус | Заметка |
|---|---|---|---|
| 2026-09-08 | init | `todo` | задача импортирована в единый реестр |
| 2026-09-08 | agent-arena-01 | `in_progress` | force: прямое назначение пользователя (vertical slice: shared+экраны phaser); deps approve позже |
| 2026-09-08 | agent-arena-01 | `done` | vitest prng 5/5 incl. воспроизводимость по 1000 seed |
| 2026-09-08 | agent-arena-01 | `review` | PR #1 открыт |
| 2026-09-08 | agent-arena-01 | `approved` | PR #1 merged в main; принято CEO |

## Команды статуса
```bash
python3 github_project/_meta/generate.py set-status T031 in_progress --agent <id> --note "что начато"
python3 github_project/_meta/generate.py set-status T031 done --agent <id> --note "тесты и результат"
```
