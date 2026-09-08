# T020 · CandleChart core (Graphics)

> Сгенерировано из `_meta/tasks.json`. Не редактировать вручную.

- **Фаза:** 2 — Свечной график (CandleChart на Graphics)
- **Трек:** `frontend`
- **Статус:** `in_progress`
- **Исполнитель:** agent-arena-01
- **Зависимости:** T014, T001
- **CEO-гейт:** да — требуется визуальная приёмка CEO перед `approved`
- **Обновлено:** 2026-09-08

## Цель
Рисовка свечей из OHLCV на Phaser Graphics: сетка, свечи, скейлинг, камера, видимый набор 40–120.

## Критерии приёмки
- [ ] Слои: gridGraphics/candleGraphics/overlayGraphics/markerGraphics/interactionZone
- [ ] Свечи из массива OHLCV; скейлинг по min/max; камера по t0
- [ ] Без Text на каждую свечу; без tween на каждую свечу
- [ ] Видимый набор 40–120 на mobile

## Тест-план
- Vitest: scaling/OHLCV→geometry
- Playwright: визуал

## Обязательные ограничения
- Следовать `github_project/02_TECH_STACK.md` и `github_project/00_CONVENTIONS.md`.
- Не подменять компонент стека молча. Сначала диагностировать и зафиксировать доказательство; затем пометить задачу `blocked`.
- Отсутствующий необязательный арт заменять manifest-заглушкой `placeholder: true`, не выдумывая финальный ассет.
- Не использовать React в игровом UI; не кодировать смысл только цветом.

> 📌 CEO-гейт: график — визуальная проверка. Кастомный CandleChart обязателен (НЕ lightweight-charts).

## Лог статуса
| Дата | Агент | Статус | Заметка |
|---|---|---|---|
| 2026-09-08 | init | `todo` | задача импортирована в единый реестр |
| 2026-09-08 | agent-arena-01 | `in_progress` | force: прямое назначение пользователя; реализовано + unit/typecheck/build green, playwright-часть плана ждёт CI (в песочнице нет браузеров: CDN заблокированы) |

## Команды статуса
```bash
python3 github_project/_meta/generate.py set-status T020 in_progress --agent <id> --note "что начато"
python3 github_project/_meta/generate.py set-status T020 done --agent <id> --note "тесты и результат"
```
