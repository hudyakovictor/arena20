# SIGNAL ARENA

Игровой тренажёр качества торговых решений на исторических ситуациях крипторынка.

## Старт для AI-агента

Агенту достаточно ссылки на репозиторий. GitHub-совместимые агенты автоматически прочитают [`AGENTS.md`](./AGENTS.md); для остальных явная точка входа — [`github_project/05_AGENT_PROTOCOL.md`](./github_project/05_AGENT_PROTOCOL.md).

```bash
python3 github_project/_meta/generate.py check
```

После проверки агент берёт назначенную задачу или первую доступную `todo` из [`github_project/04_STATUS_LOG.md`](./github_project/04_STATUS_LOG.md).

## Структура

| Путь | Назначение |
|---|---|
| `client/` | Phaser-клиент |
| `server/` | Fastify API, БД и WebSocket |
| `shared/` | Общие Zod-схемы, типы, токены и чистая доменная логика |
| `admin/` | Будущая админ-панель/CRM |
| `github_project/source/` | Канонические продуктовые материалы и визуальные референсы |
| `github_project/tasks/` | Сгенерированные карточки задач |
| `github_project/_meta/tasks.json` | Единственный источник статусов и модели плана |

## Команды управления планом

```bash
# проверить модель и отсутствие ручных изменений в generated-документах
python3 github_project/_meta/generate.py check

# пересобрать generated-документы
python3 github_project/_meta/generate.py

# изменить статус с проверкой переходов и зависимостей
python3 github_project/_meta/generate.py set-status T000 in_progress \
  --agent agent-foundation-01 --note "начал scaffold"
```

Реализация ещё не начата: текущий архив содержит ТЗ, исходные материалы и систему оркестрации. Первая кодовая задача — `T000`.
