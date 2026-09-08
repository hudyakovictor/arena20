# T003 · Схема и валидатор asset-manifest

> Сгенерировано из `_meta/tasks.json`. Не редактировать вручную.

- **Фаза:** 0 — Фундамент и конвенции (Foundation)
- **Трек:** `shared`
- **Статус:** `todo`
- **Исполнитель:** —
- **Зависимости:** T000, T001
- **CEO-гейт:** нет
- **Обновлено:** 2026-09-08

## Цель
Zod-схема asset-manifest (id, kind, src, pack, lazy, logicalSize, sourceSize, maxBytes, category, tintable) + CI-валидатор веса/нейминга.

## Критерии приёмки
- [ ] Manifest валидируется Zod в build-пайплайне
- [ ] CI падает при превышении maxBytes, отсутствии файла, некорректном размере или нейминге
- [ ] Поле placeholder:true разрешает отсутствие растра (placeholder-стратегия)

## Тест-план
- Vitest: валидный/невалидный manifest
- CI падает на перегрузе

## Обязательные ограничения
- Следовать `github_project/02_TECH_STACK.md` и `github_project/00_CONVENTIONS.md`.
- Не подменять компонент стека молча. Сначала диагностировать и зафиксировать доказательство; затем пометить задачу `blocked`.
- Отсутствующий необязательный арт заменять manifest-заглушкой `placeholder: true`, не выдумывая финальный ассет.
- Не использовать React в игровом UI; не кодировать смысл только цветом.

> 📌 Бюджеты: core UI icon source ≤12КБ, first scenario pack ≤250КБ (без Phaser runtime).

## Лог статуса
| Дата | Агент | Статус | Заметка |
|---|---|---|---|
| 2026-09-08 | init | `todo` | задача импортирована в единый реестр |

## Команды статуса
```bash
python3 github_project/_meta/generate.py set-status T003 in_progress --agent <id> --note "что начато"
python3 github_project/_meta/generate.py set-status T003 done --agent <id> --note "тесты и результат"
```
