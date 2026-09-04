# SIGNAL ARENA — `aibackend`

Бэкенд по ТЗ **Часть 6 «Архитектура и контент-конвейер»** (`new.txt`). Весь серверный код живёт в этой папке;
Next.js используется только как HTTP-адаптер (`src/app/api/v1/[...path]/route.ts` → `aibackend/http/router.ts`).
Хранилище — PostgreSQL через Drizzle (в ТЗ — SQLite/Drizzle, путь миграции заложен: схемы идентичны).

```
aibackend/
├─ engine/        детерминированный движок, общий с клиентом (phaser/src/engine)
│  ├─ rng.ts          xorshift32 + FNV-хеш            — 1:1 копия клиента
│  ├─ mutator.ts      mutate(template, seed)          — 1:1 копия клиента (+ опц. ось answerPool)
│  ├─ scoring.ts      XP / SIG / бюджет риска         — 1:1 копия клиента
│  ├─ generator.ts    generate(template, seed, ctx) → TaskInstance; toPublic() убирает ответы
│  ├─ validator.ts    correct / correct_unfounded / wrong; улики, стек (M2), вердикт (M4), антифрод
│  ├─ progress.ts     уровни из XP, ранги карт из атомов, доступность стадий, комбо
│  ├─ scheduler.ts    очередь: свиток → стадии → новые карты; разминка дня; погода
│  └─ autotest.ts     автотест полноты (Часть 4 §8) + боты угадываемости (слепой/случайный/запоминающий/эвристический)
├─ content/       карты, атомы, враги, стадии, комбо, источники, шаблоны — копия phaser/src/data (контент = данные)
├─ config/        balanceConfig / epochConfig — копия phaser/src/config
├─ schemas/       Zod: TemplateSchema (контракт для LLM), контракты API
├─ db/schema.ts   Drizzle-схема (user, progress, card/combo/enemy_progress, mistake_scroll, session, attempt,
│                 calibration, schedule_queue, daily_seeds, answer_distribution, tournament, shadow_run,
│                 config, content_package, template_drafts, event_log, purchase, device)
├─ services/      auth · content · config · progress · scheduler(+seeds) · attempts · academy · social(sessions,
│                 shadow, tournaments, analytics, billing)
├─ ai/pipeline.ts LLM-генератор → Zod → автотест → боты → черновик → ревью → публикация
└─ http/          router.ts (маршруты), index.ts (JWT HS256, ошибки, rate limit, ETag)
```

## Три принципа (Часть 6 §2) — как реализованы

1. **Задание = f(шаблон, seed).** `GET /tasks/next` выдаёт публичный экземпляр без пометок верного варианта и верных
   улик. `POST /attempts` регенерирует экземпляр тем же `mutate()` и валидирует. Постусловие генерации: если после
   мутации эталон не совпал — seed отклоняется и берётся `nextSeed` (детерминированно).
2. **Контент — данные.** `/content` отдаёт пакет с версией (`c<sha1>`), ETag. Опубликованные ИИ-шаблоны
   (`template_drafts.status='published'`) входят в пакет без релиза клиента.
3. **Всё числовое — в конфиге.** `/config` — версионируемый JSON по сегменту A/B (`users.segment`); дефолт собирается
   из `balanceConfig`, переопределение — `POST /admin/config`.

## API v1 (`/api/v1`)

| Метод | Путь | Auth | Назначение |
|---|---|---|---|
| POST | `/auth/anonymous` | — | `{deviceId}` → JWT (90 дней), пользователь + progress |
| POST | `/auth/link-email` | user | привязка e-mail |
| GET | `/me` | user | краткий профиль |
| GET | `/content` · `/content/version` | — | пакет контента (ETag) |
| GET | `/config?segment=` | — | конфиг (ETag) |
| GET | `/seeds/daily` | user | seed + погода на 3 дня вперёд (офлайн-разминка) |
| GET | `/schedule` | user | серверная очередь (`schedule_queue` пересобирается) |
| GET | `/warmup` | user | разминка дня: погода (M13) + 3–5 элементов |
| GET | `/tasks/next` · `/tasks/:templateId?seed=` | user | публичный экземпляр |
| POST | `/attempts` · `/attempts/batch` | user | валидация, скоринг, прогресс; идемпотентно по `clientAttemptId` |
| GET | `/progress` | user | карты/ранги, враги/стадии/трофеи, комбо, свиток, калибровка |
| GET | `/academy/chapters` · `/academy/chapters/:cardId` | user | главы; урок с микро-проверками (seed) |
| POST | `/academy/microcheck` | user | ответ → атом освоен → карта выдана / ранг ↑ |
| POST | `/sessions` · `/sessions/:id/end` | user | сессия = бюджет риска (M15) |
| GET | `/shadow/:templateId` | user | распределение ответов (M14) |
| GET | `/tournaments` · POST `/tournaments/:id/join` · GET `/tournaments/:id/leaderboard` | —/user | асинхронные турниры: общий seed-набор, окно, одно устройство, тень выше по рейтингу |
| POST | `/analytics/events` | user | события (`user, session, epoch, level, content_version`) |
| POST | `/billing/purchase` | user | косметика/premium за SIG — **не касается engine** |
| GET | `/admin/status` · `/admin/autotest` · `/admin/preview/:templateId` · `/admin/analytics` | admin | статус, автотест пакета, 5 мутаций, витрины |
| POST | `/admin/config` · `/admin/tournaments` | admin | публикация конфига, создание турнира |
| POST/GET | `/admin/ai/drafts` · `/admin/ai/drafts/:id` · POST `/admin/ai/drafts/:id/review` | admin | ИИ-конвейер |

Admin — заголовок `X-Admin-Token` (`ADMIN_TOKEN`, dev: `admin-dev-token`). Ошибки — `{error, message, details}`.

### Контракт попытки
```json
{ "clientAttemptId":"c-…", "sessionId":"uuid", "templateId":"T-E02-S1", "contentVersion":"c…", "seed":491140481,
  "answer":2, "evidence":["ev-vol"], "confidence":"mid", "openedSources":["chart"], "sequence":["C2","C1"],
  "verdict":"A", "blindOpened":false, "identifyGuess":"E02", "durationMs":9000, "clientTs":1700000000000 }
```
Ответ: `result`, `reveal` (верный вариант, улики, враг для M5, play-forward M6), `reward`, `shadow` (M14),
`progress` (level/epoch/бюджет, `scrollAdded`, `combosUnlocked`, `stageWon`, `leviathan`, `hubrisDragon`), `flags`
(антифрод: `too_fast`, `evidence_unknown_zone`, `blind_source_bypass`, `content_version_mismatch`).

## Механики на сервере
M1 улика → `correct_unfounded`, враг не побеждён · M2 стек → режим `sequence` · M3 ставка → множитель списания,
калибровка · M4 вердикт → частичный балл за верный фактор · M5 опознание → `identifyOptions` одного домена ·
M7 свиток → запись/закрытие, приоритет планировщика, повтор на ступень сложнее · M8 комбо → N совместных верных
применений карт ранга ≥2 · M9 слепой источник → стоимость из бюджета · M10 холодная голова → `coldDelayMs` после
серии ошибок · M11 мутация → `mutate` + постусловие · M12 кампания → стадии, cooldown, требуемые комбо ·
M13 погода → seed дня · M14 тень → `answer_distribution`, `shadow_runs` · M15 бюджет → сессия, Leviathan при нуле.

## ИИ-конвейер (Часть 6 §7)
`POST /admin/ai/drafts {enemyId, stage, atoms?, learningGoal?, epoch?, variants, provider}`.
Провайдер `openai` — любой OpenAI-совместимый endpoint (`OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL`),
`response_format: json_object`. Без ключа — `synthetic` (детерминированный черновик из спецификации стадии).
Каждый черновик: Zod (`TemplateSchema`) → `autotestTemplate` → 50 мутаций для ботов → 5 превью → `template_drafts`.
Невалидный вывод отклоняется автоматически. `review: approve | reject | publish`; publish повторяет автотест и
инвалидирует кэш контента (новая версия пакета). ИИ не меняет атомы, стадии, конфиг.

## Детерминизм клиент/сервер
`engine/rng.ts`, `engine/mutator.ts`, `engine/scoring.ts` обязаны быть идентичны `phaser/src/engine/*`.
Добавлена обратно совместимая ось **`answerPool`** (пул формулировок ответа): для шаблонов без пула вывод байт-в-байт
совпадает с клиентом; при переносе в клиент скопируйте `mutator.ts` и тип `AnswerOption`.

**Вывод автотеста по контенту прототипа:** рукописные шаблоны `phaser/src/data/templates.ts` не проходят бота
«запоминающий» (тексты ответов не мутируют) и частично «слепого» (верный вариант — самый длинный); у `T-E18-S1`
атом `C3.6` отсутствует в карте C3, у `T-E08-S2/T-E18-S1/T-VERDICT` skills не покрывают карты стадии; 35 атомов
не используются ни одним шаблоном; 8 комбо никем не требуются. Это задачи контент-конвейера, а не бэкенда.

## Переменные окружения
`DATABASE_URL`, `JWT_SECRET`, `ADMIN_TOKEN`, `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL`.
Схема: `npx drizzle-kit push`.
