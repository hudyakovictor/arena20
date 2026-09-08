# server/ — бэкенд SIGNAL ARENA (Fastify + SQLite + Drizzle + Zod + WS)

Папка для сервера. Координацию/статус/ТЗ веди через [`github_project/`](../github_project/README.md):
- Трек: [`github_project/tracks/backend.md`](../github_project/tracks/backend.md)
- Протокол: [`github_project/05_AGENT_PROTOCOL.md`](../github_project/05_AGENT_PROTOCOL.md)
- Стек и жёсткое правило: [`github_project/02_TECH_STACK.md`](../github_project/02_TECH_STACK.md)

## Обязательный стек (не подменять)
Fastify · SQLite (через Drizzle ORM) · Zod (валидация всех контрактов + OpenAPI) · WebSocket (WS, realtime для турниров).
Оставляем как есть — не заменять на Express/Sequelize/Postgres-без-Drizzle/опрос.

## Предлагаемая структура
```
server/
  src/
    index.ts           # Fastify bootstrap (T100)
    db/                # Drizzle schema, migrations, seed
    routes/            # profiles, content, journal, tournaments
    services/          # scenario serving, tournament, anti-cheat
    ws/                # websocket канал
    validation/        # Zod-схемы (re-export из shared)
```

## Правила
- Все входы/ответы валидируются Zod (схемы из `shared/`).
- Исторические данные: server-fixed сценарии турниров, хэш скрытого future, защита от утечки до решения (T102/T105).
- Мутации контента только через API (админка позже пишет сюда же, не в обход).
- Тесты: Vitest (сервисы) + Playwright против живого сервера (T107).
