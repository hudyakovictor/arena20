# client/ — игра SIGNAL ARENA (Phaser 4 + TypeScript + Vite)

Папка для игрового клиента. Всю координацию/статус/ТЗ веди через [`github_project/`](../github_project/README.md):

- Трек: [`github_project/tracks/frontend.md`](../github_project/tracks/frontend.md)
- Протокол: [`github_project/05_AGENT_PROTOCOL.md`](../github_project/05_AGENT_PROTOCOL.md)
- Стек и жёсткое правило: [`github_project/02_TECH_STACK.md`](../github_project/02_TECH_STACK.md)

## Обязательный стек (не подменять)

Phaser 4 (`^4.2.1`, WebGL) · TypeScript (strict) · Vite · rexUI (игровой UI внутри сцены) ·
свой кастомный **CandleChart на Graphics** (НЕ lightweight-charts) · Zustand (без React) ·
Phaser Sound · vite-plugin-pwa · Vitest + Playwright.

## Предлагаемая структура (агент может уточнять в PR)

```
client/
  index.html
  vite.config.ts
  src/
    main.ts            # Phaser.Game bootstrap (T010)
    scenes/            # Boot, Preload, Shell, Arena, Academy, Bestiary, Journal, Tournament, Market
    ui/                # rexUI-компоненты: panel, button, tabs, list, slider, checklist, modal, toast (T014)
    systems/           # store (zustand), sound, pwa, assets, scenario runtime
    game/              # CandleChart (T020), client runtime scenario-gen
    data/              # copy-keys (i18n, T122), загрузка content-pack
    config/            # дизайн-токены (T002), env
  public/assets/       # svg-иконки, webp сущностей/фонов (через manifest, см. github_project/assets/)
```

## Правила

- Игровой UI — только Phaser/rexUI/Graphics. Никакого React. Zustand без React-биндингов.
- Цвет — не единственный носитель статуса; строки/HEX только через copy-keys/токены.
- Ассеты через manifest (`shared/`), растр лениво; hero-art не в первом сценарии.
- Нет хардкода — всё через `shared/` (схемы/токены/движок).
