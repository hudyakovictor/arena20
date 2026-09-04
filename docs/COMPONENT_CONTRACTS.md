# Signal Arena — Component Contracts 1.0

## Status

Terminal Design System component coverage: 100%. Target integration: Phaser 4.2.1.

## Global rules

- Mobile-first reference width: 390 px.
- Every interactive hit area is at least 44×44 px.
- Raw colors and arbitrary spacing are forbidden outside tokens.
- All components support Russian strings and text wrapping.
- Color is never the only state signal: use border, icon, label, shape, or opacity.
- Every animated component has a reduced-motion fallback.
- Main screens are Phaser Scenes; temporary states are overlays.

## Foundations

### Surface

Variants: `base | elevated | paper | selected | locked | danger | completed`.

Contract: radius 12–16; semantic border; no heavy shadow; locked remains visible; paper always uses `paper/ink` pair.

### Typography

Roles: `display | h2 | h3 | body | label | mono`.

Contract: headings use UI family; system labels and source metadata may use mono; no decorative third font.

## Controls

### Button

Variants: `primary | secondary | ghost | danger`.
States: `default | pressed | disabled | loading`.

Contract: one primary CTA per region; minimum height 44; loading preserves width; danger is not used for a normal wrong answer.

### IconButton

Contract: 44×44 hit area, 24×24 icon, accessible label, optional notification dot. Icons use one stroke family.

### AnswerOption

Contract: exactly four per normal encounter; equal width and visual weight; labels A–D; states include selected/correct/incorrect/disabled; tap produces selected feedback in under 80 ms.

### Input / Toggle / Chip / Badge

Contract: inputs use visible focus; toggle labels remain readable; pills only represent compact status; badges never carry primary instructions.

## Persistent chrome

### TopBar

Contents: level seal, compact XP, Signal coins, Archivist indicator, Settings. No avatar, MMR, win rate, AP, or live market value.

### BottomNav

Items: `Academy | Arena | Collection | More`. Four equal zones. Active state uses cyan plus top indicator; no enlarged center item or octagon.

## Arena

### QuestionPaper

Dirty-white paper surface with short situation text. Maximum one headline and one supporting sentence before sources.

### UnknownThreat

Before answer: `?` and UNKNOWN THREAT only. No enemy name, domain-specific silhouette detail, or revealing item.

### BrowserShell

Largest object in Arena. Includes real window chrome, 1–7 relevant SourceTabs, panel viewport, and optional educational annotations.

### SourceTab

States: hidden/introduced/visible/active/locked. Locked tap gives one short pulse. Irrelevant tabs are not rendered.

### Source panels

MVP: `chart | news | order_book`. Future contracts: `on_chain | social_sentiment | funding_rates | economic_calendar`.

### CompactSkillCard

Maximum four visible. Frame + semantic 24px icon + 1–3-word name. No combat power, mana cost, rarity advantage, or paid strength.

### FeedbackPanel

Explains signal, consequence, and countermeasure. First miss gives a key signal; repeated miss may reveal full reasoning.

## Academy

### LessonNode

States: completed/current/available/locked. Locked node shows the nearest concrete unlock requirement.

### LessonView

Order: goal → 2–4 blocks → example → micro-check → card unlock → Arena CTA. Not a longread.

### ChapterGate / MasteryCheck

Shows readiness, missing practice, enemy exam preview, and Practice More CTA. Does not increase card strength.

## Collection and profile

### CollectionCard

States: locked/available/selected/mastered. Detail view uses a sheet. Large illustration is optional until production art exists.

### EnemyTrophy

Stores enemy stage, not duplicate objects. Uses shared master render across skins.

### PublicProfile

No avatar. Uses level seal, trophies, Plus frame, current skin, and learning progress.

## Error Journal

### ErrorRow

Fields: error, recurrence, trend, last seen, counter-skill, fix-mission status.

### FixMissionSheet

Shows root cause, linked enemy, counter-cards, and 2–3 corrective scenarios. Severity is educational priority, not punishment.

## Feedback and overlays

### RewardSummary

Normal answer: compact XP/+coins. Chapter exam: full reveal, trophy, stage and next step. No roulette, slot motion, fake P&L, or flashing punishment.

### EnemyReveal

Maximum dramatic duration 700 ms. Enemy exits the chart region, enlarges, then resolves into the result composition. Reduced motion uses a static reveal and `+N` HUD update.

### ArchivistSheet

Never covers the chart while the player is analyzing. Silent in Arena until tapped. Never reveals the answer.

## Enemy asset contract

- 1500×1500 transparent master.
- Approximately 15% safe field.
- Crops: circle, square, 4:5, 16:9.
- States: silhouette → revealed → defeated.
- Evolved uses frame/badge/trophy stage, not a replacement render.
- City/background remains a separate parallax layer.
- One render is shared by every chrome skin.

## Acceptance

A component is complete only when its states, long Russian text, touch size, keyboard focus, reduced motion, 390px layout, and empty/locked/error cases have been checked.
