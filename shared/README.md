# shared/ — общие схемы, типы, токены, движок сценариев

Код, который используют и `client/`, и `server/` без дублирования. Единый контракт между треками.
- Трек: [`github_project/tracks/shared.md`](../github_project/tracks/shared.md)

## Что здесь
```
shared/
  src/
    schemas/   # Zod: scenario, skill, entity, verdict, profile, protocol, copy, assetManifest (T001, T003)
    types/     # z.infer типы (генерятся из схем)
    tokens/    # дизайн-токены UI_TINT + layout (T002) — импорт и клиентом, и (для справки) сервером
    scenario/  # seedrandom wrapper (T031), scenario-gen (T032), error-profile (T033), scoring engine (T044)
```

## Правила
- **TypeScript strict**, запрет `any` в доменных схемах.
- Любое изменение схем/токенов/движка = смена версии контента; остальные треки адаптируются.
- Детерминизм: seed = scenarioId + contentVersion (seedrandom, НЕ Math.random).
- Никакого React. Zustand-стор живёт в `client/`, здесь только чистые модули состояния/логики.
