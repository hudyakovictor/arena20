# T030 · Модель ситуации + content-pack

> Сгенерировано из `_meta/tasks.json`. Не редактировать вручную.

- **Фаза:** 3 — Движок сценариев (scenario-gen + seedrandom)
- **Трек:** `shared`
- **Статус:** `done`
- **Исполнитель:** agent-arena-01
- **Зависимости:** T001, T003
- **CEO-гейт:** нет
- **Обновлено:** 2026-09-08

## Цель
Тип исторической ситуации (контекст, вкладки-источники, скиллы, 4 решения, опц. 2-й шаг, сущность, протокол, скрытое future, правила оценки) + формат content-pack.

## Критерии приёмки
- [ ] Модель покрывает §4 product-mechanics-spec
- [ ] content-pack валидируется Zod (T1)
- [ ] Версия датасета + хэш скрытого future в модели

## Тест-план
- Vitest: валидация content-pack

## Обязательные ограничения
- Следовать `github_project/02_TECH_STACK.md` и `github_project/00_CONVENTIONS.md`.
- Не подменять компонент стека молча. Сначала диагностировать и зафиксировать доказательство; затем пометить задачу `blocked`.
- Отсутствующий необязательный арт заменять manifest-заглушкой `placeholder: true`, не выдумывая финальный ассет.
- Не использовать React в игровом UI; не кодировать смысл только цветом.

## Лог статуса
| Дата | Агент | Статус | Заметка |
|---|---|---|---|
| 2026-09-08 | init | `todo` | задача импортирована в единый реестр |
| 2026-09-08 | agent-arena-01 | `in_progress` | force: прямое назначение пользователя (vertical slice: shared+экраны phaser); deps approve позже |
| 2026-09-08 | agent-arena-01 | `done` | vitest: fixture content-pack v0.1.0 валидируется contentPackSchema (2 сценария/8 скиллов/6 сущностей/4 протокола) |

## Команды статуса
```bash
python3 github_project/_meta/generate.py set-status T030 in_progress --agent <id> --note "что начато"
python3 github_project/_meta/generate.py set-status T030 done --agent <id> --note "тесты и результат"
```
