// T040–T042 · ArenaScene: menu (4.1) → brief (4.2) → task (4.3–4.9) → reveal (4.10).
// Вердикт — отдельным оверлеем VerdictScene (4.11–4.13). Скрытое будущее
// запрашивается только после фиксации решения (revealScenario после lock).
// Все фазы компактно умещаются в CONTENT_RECT без скролла: критичные для
// решения контролы всегда видимы (игровая адаптация скролл-прототипа).
import Phaser from 'phaser';
import type { Candle, ScenarioPublic, SkillCard } from '@signal-arena/shared';
import {
  ENTITY_CATEGORY_TINT,
  FONT_SIZES,
  LAYOUT,
  SPACING,
  TAB_LABEL,
  UI_BG,
  UI_TINT,
  t as sharedT,
} from '@signal-arena/shared';
import type { ArenaFocus, ArenaFormat, ArenaSessionState } from '../../store.js';
import { selectArena, selectLang, selectProgress, useArenaStore } from '../../store.js';
import { t } from '../../copy.js';
import { playSound } from '../../sound.js';
import {
  avgQualityOf,
  breakVolumeDelta,
  chapterTitleKeyFor,
  computeVerdictStub,
  content,
  decisionOf,
  futureCandlesOf,
  getEntity,
  getProtocol,
  getPublicScenario,
  getSkill,
  listScenarioIds,
  masteryOf,
  orderBookOf,
  pressureOf,
  revealScenario,
  tabCatalog,
} from '../../content.js';
import { ensureVerdictScene } from '../router.js';
import { CandleChart } from '../ui/CandleChart.js';
import { iconImage } from '../ui/icons.js';
import {
  anchor,
  clearAnchors,
  ellipsis,
  makeButtons,
  makeChip,
  makeCta,
  makeKvGrid,
  makeLabel,
  makeSection,
  makeSheet,
  makeText,
  paintButton,
  panelBg,
  tappable,
  toast,
} from '../ui/kit.js';
import type { RexUIRoundRectangle } from 'phaser4-rex-plugins/templates/ui/ui-plugin.js';
import { CONTENT_RECT } from './ShellScene.js';

const INNER_W = LAYOUT.viewWidth - LAYOUT.gutter * 2;
const DECISION_KEYS = ['A', 'B', 'C', 'D'] as const;
/** Прототип 4.3: одновременно применено не больше 2 карт. */
const MAX_SKILLS = 2;
const FORMATS: ArenaFormat[] = ['free', 'series', 'fix'];
const FOCUSES: ArenaFocus[] = ['all', 'structure', 'noise', 'risk', 'psycho', 'web3'];
/** Высота области данных браузерного виджета в задании (бюджет 672px). */
const BROWSER_VIEW_H = 158;

export default class ArenaScene extends Phaser.Scene {
  private root: Phaser.GameObjects.Container | null = null;
  private chart: CandleChart | null = null;
  private unsubscribe: (() => void) | null = null;
  private revealPlayedFor: string | null = null;
  private verdictAppliedFor: string | null = null;
  /** Локальный выбор сетапа (4.1) — в стор пишется только по «Начать». */
  private menuForScenario: string | null = null;
  private menuFormat: ArenaFormat = 'free';
  private menuFocus: ArenaFocus = 'all';
  private menuRule: string | null = null;
  /** Скорость play-forward (4.10): 90мс ×1 / 45мс ×2. */
  private revealStepMs = 90;

  constructor() {
    super({ key: 'Arena' });
  }

  create(): void {
    this.events.on('arena:help', () => this.showHelp());
    this.events.on('arena:pause', () => this.showPause());
    this.unsubscribe = useArenaStore.subscribe((s, prev) => {
      const a = s.arena;
      const b = prev.arena;
      if (
        a?.scenarioId !== b?.scenarioId ||
        a?.phase !== b?.phase ||
        a?.decisionId !== b?.decisionId ||
        a?.step2Id !== b?.step2Id ||
        a?.tabIndex !== b?.tabIndex ||
        a?.skillIds.join(',') !== b?.skillIds.join(',') ||
        s.settings.lang !== prev.settings.lang
      ) {
        this.render();
      }
    });
    this.render();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribe?.();
      this.unsubscribe = null;
      this.root = null;
      this.chart = null;
    });
  }

  private render(): void {
    clearAnchors();
    this.root?.destroy(true);
    this.chart = null;
    const session = selectArena();
    this.root = this.add.container(CONTENT_RECT.x, CONTENT_RECT.y);
    if (!session) {
      this.renderNoSession();
      return;
    }
    const scenario = getPublicScenario(session.scenarioId);
    if (session.phase === 'menu') this.renderMenu(session, scenario);
    else if (session.phase === 'brief') this.renderBrief(session, scenario);
    else if (session.phase === 'task') this.renderTask(session, scenario);
    else this.renderReveal(session, scenario);
  }

  // ---------- menu (прототип 4.1): формат + правило + фокус + старт ----------

  private menuState(scenario: ScenarioPublic): void {
    if (this.menuForScenario !== scenario.scenarioId) {
      this.menuForScenario = scenario.scenarioId;
      this.menuFormat = 'free';
      this.menuFocus = 'all';
      this.menuRule = scenario.protocolId;
    }
  }

  private renderMenu(_session: ArenaSessionState, scenario: ScenarioPublic): void {
    if (!this.root) return;
    // _session зарезервирован: форматы series/fix будут фильтровать сценарии (T032).
    this.menuState(scenario);
    let y = SPACING.sm;

    const hero = makeLabel(this, {
      text: t('arena.mode.hero'),
      width: INNER_W,
      size: FONT_SIZES.body,
      pad: { top: 12, bottom: 12 },
    });
    hero.setPosition(LAYOUT.gutter, y);
    this.root.add(hero);
    y += hero.height + SPACING.sm;

    const secF = makeSection(this, t('arena.mode.formats'), '');
    secF.setPosition(LAYOUT.gutter, y);
    this.root.add(secF);
    y += 24;
    for (const format of FORMATS) {
      const row = this.formatRow(format, this.menuFormat === format);
      row.setPosition(LAYOUT.gutter, y);
      this.root.add(row);
      y += row.height + SPACING.xs;
    }
    y += SPACING.xs;

    const secR = makeSection(this, t('arena.mode.rule'), t('arena.mode.ruleHint'));
    secR.setPosition(LAYOUT.gutter, y);
    this.root.add(secR);
    y += 24;
    y += this.renderMenuChips(
      content().protocols.map((p) => sharedT(selectLang(), p.titleKey)),
      content().protocols.findIndex((p) => p.protocolId === this.menuRule),
      (index) => {
        const protocol = content().protocols[index];
        if (!protocol) return;
        playSound(this, 'click');
        this.menuRule = protocol.protocolId;
        this.render();
      },
      y,
      'rule',
    );
    y += SPACING.xs;

    const secFo = makeSection(this, t('arena.mode.focus'), '');
    secFo.setPosition(LAYOUT.gutter, y);
    this.root.add(secFo);
    y += 24;
    y += this.renderMenuChips(
      FOCUSES.map((f) => t(`arena.mode.focus.${f}`)),
      FOCUSES.indexOf(this.menuFocus),
      (index) => {
        const focus = FOCUSES[index];
        if (!focus) return;
        playSound(this, 'click');
        this.menuFocus = focus;
        this.render();
      },
      y,
      'focus',
    );
    y += SPACING.sm;

    const foot = makeText(
      this,
      0,
      0,
      `${scenario.datasetVersion} · ${t('shell.scenarioProgress')} × ${content().scenarios.length}`,
      { mono: true, size: FONT_SIZES.caption, tone: 'muted' },
    );
    foot.setPosition(LAYOUT.gutter, y);
    const hash = makeChip(this, t('arena.mode.hashOk'), 'success');
    hash.setPosition(LAYOUT.gutter + INNER_W - hash.width, y - 4);
    this.root.add([foot, hash]);
    y += 26;

    const cta = makeCta(this, t('arena.mode.start'), () => {
      playSound(this, 'click');
      useArenaStore
        .getState()
        .setSessionSetup(this.menuFormat, this.menuRule ?? scenario.protocolId, this.menuFocus);
    });
    cta.setPosition(LAYOUT.gutter, y);
    anchor('arena:menu-start', cta);
    this.root.add(cta);
  }

  /** Строка формата тренировки: название + описание + кнопка выбора. */
  private formatRow(format: ArenaFormat, selected: boolean): Phaser.GameObjects.Container {
    const root = this.add.container(0, 0);
    const bg = panelBg(this, INNER_W, 56, selected ? UI_BG.surface3 : UI_BG.surface2);
    bg.setOrigin(0, 0);
    if (selected) bg.setStrokeStyle(2, UI_TINT.active, 1);
    const title = makeText(this, SPACING.md, 7, t(`arena.mode.format.${format}`), {
      size: FONT_SIZES.body,
    });
    const body = makeText(this, SPACING.md, 27, t(`arena.mode.format.${format}Body`), {
      size: FONT_SIZES.caption,
      tone: 'secondary',
    });
    const btn = makeLabel(this, {
      text: t('arena.mode.choose'),
      size: FONT_SIZES.caption,
      mono: true,
      tone: selected ? 'active' : 'primary',
      pad: { left: SPACING.sm, right: SPACING.sm, top: 10, bottom: 10 },
    });
    btn.setPosition(INNER_W - btn.width - SPACING.sm, 8);
    root.add([bg, title, body, btn]);
    root.setSize(INNER_W, 56);
    const zone = this.add.zone(0, 0, INNER_W, 56).setOrigin(0, 0);
    zone.setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => {
      if (this.menuFormat === format) return;
      playSound(this, 'click');
      this.menuFormat = format;
      this.render();
    });
    anchor(`arena:menu-format:${format}`, zone);
    root.add(zone);
    return root;
  }

  /** Переносимые чипсы с одиночным выбором. Возвращает высоту. */
  private renderMenuChips(
    labels: string[],
    selected: number,
    onSelect: (index: number) => void,
    y: number,
    anchorPrefix: string,
  ): number {
    if (!this.root) return 0;
    const root = this.add.container(LAYOUT.gutter, y);
    let cx = 0;
    let cy = 0;
    const rowH = 34;
    labels.forEach((text, i) => {
      const chip = makeLabel(this, {
        text: ellipsis(text, 24),
        size: FONT_SIZES.caption,
        mono: true,
        tone: i === selected ? 'active' : 'primary',
        pad: { left: SPACING.sm, right: SPACING.sm, top: 7, bottom: 7 },
      });
      if (i === selected) {
        const bg = chip.getElement('background') as RexUIRoundRectangle | null;
        bg?.setStrokeStyle(2, UI_TINT.active, 1);
      }
      if (cx + chip.width > INNER_W && cx > 0) {
        cx = 0;
        cy += rowH;
      }
      chip.setPosition(cx, cy);
      anchor(`${anchorPrefix}:${i}`, chip);
      root.add(
        tappable(chip, () => {
          if (i !== selected) onSelect(i);
        }),
      );
      cx += chip.width + SPACING.xs;
    });
    const h = cy + rowH;
    root.setSize(INNER_W, h);
    this.root.add(root);
    return h;
  }

  // ---------- brief (прототип 4.2) ----------

  private renderBrief(session: ArenaSessionState, scenario: ScenarioPublic): void {
    if (!this.root) return;
    let y = SPACING.sm;
    const card = this.situationCard(scenario, t('arena.brief.situation'));
    card.setPosition(LAYOUT.gutter, y);
    this.root.add(card);
    y += card.height + SPACING.sm;

    const ruleId = session.sessionRuleId ?? scenario.protocolId;
    const grid = makeKvGrid(
      this,
      [
        {
          label: t('arena.brief.phase'),
          value: t(
            scenario.kind === 'pre-entry' ? 'arena.brief.preEntry' : 'arena.brief.inPosition',
          ),
          valueTone: 'data',
        },
        {
          label: t('arena.brief.timeframe'),
          value: sharedT(selectLang(), scenario.timeframeKey),
          valueTone: 'primary',
        },
        {
          label: t('arena.brief.rule'),
          value: sharedT(selectLang(), getProtocol(ruleId).titleKey),
          valueTone: 'narrative',
        },
        {
          label: t('arena.brief.difficulty'),
          value: `${scenario.difficulty}/99`,
          valueTone: 'warning',
        },
      ],
      { width: INNER_W },
    );
    grid.setPosition(LAYOUT.gutter, y);
    this.root.add(grid);
    y += grid.height + SPACING.sm;

    for (const entityId of scenario.entityIds.slice(0, 2)) {
      const row = this.threatRow(entityId);
      row.setPosition(LAYOUT.gutter, y);
      this.root.add(row);
      y += row.height + SPACING.xs;
    }
    y += SPACING.xs;

    const tabsLine = scenario.tabs.map((tab) => TAB_LABEL[tab.id][selectLang()]).join(' · ');
    const tabsCard = makeLabel(this, {
      text: `${t('arena.brief.tabs')}: ${tabsLine}`,
      size: FONT_SIZES.caption,
      tone: 'secondary',
      width: INNER_W,
    });
    tabsCard.setPosition(LAYOUT.gutter, y);
    this.root.add(tabsCard);
    y += tabsCard.height + SPACING.sm;

    const foot = makeText(
      this,
      0,
      0,
      `${t('verdict.hash')}: ${scenario.futureHash.slice(0, 12)}…`,
      {
        mono: true,
        size: FONT_SIZES.caption,
        tone: 'muted',
      },
    );
    foot.setPosition(LAYOUT.gutter, y);
    const hash = makeChip(this, t('arena.mode.hashOk'), 'success');
    hash.setPosition(LAYOUT.gutter + INNER_W - hash.width, y - 4);
    this.root.add([foot, hash]);
    y += 28;

    const cta = makeCta(this, t('arena.brief.start'), () => {
      playSound(this, 'click');
      useArenaStore.getState().setArenaPhase('task');
    });
    cta.setPosition(LAYOUT.gutter, y);
    anchor('arena:brief-cta', cta);
    this.root.add(cta);
  }

  /** Карточка ситуации: рубрика + заголовок-контекст + цель. */
  private situationCard(scenario: ScenarioPublic, kicker: string): Phaser.GameObjects.Container {
    const root = this.add.container(0, 0);
    const head = makeText(this, SPACING.md, 26, sharedT(selectLang(), scenario.contextKey), {
      size: 15,
      wrapWidth: INNER_W - SPACING.md * 2,
    });
    const maxHeadH = 44;
    if (head.height > maxHeadH) {
      head.setText(ellipsis(sharedT(selectLang(), scenario.contextKey), 88));
    }
    const goal = makeText(
      this,
      SPACING.md,
      26 + head.height + 4,
      sharedT(selectLang(), scenario.goalKey),
      {
        size: FONT_SIZES.caption,
        tone: 'secondary',
        wrapWidth: INNER_W - SPACING.md * 2,
      },
    );
    if (goal.height > 20) goal.setText(ellipsis(sharedT(selectLang(), scenario.goalKey), 72));
    const h = 26 + head.height + 4 + goal.height + SPACING.sm;
    const bg = panelBg(this, INNER_W, h);
    bg.setOrigin(0, 0);
    const kick = makeText(this, SPACING.md, SPACING.sm, kicker, {
      mono: true,
      size: FONT_SIZES.label,
      tone: 'muted',
    });
    root.add([bg, kick, head, goal]);
    root.setSize(INNER_W, h);
    return root;
  }

  /** Строка активной угрозы: арт-плашка + имя + признак. */
  private threatRow(entityId: string): Phaser.GameObjects.Container {
    const entity = getEntity(entityId);
    const tint = ENTITY_CATEGORY_TINT[entity.category];
    const root = this.add.container(0, 0);
    const h = 56;
    const bg = panelBg(this, INNER_W, h, UI_BG.surface2);
    bg.setOrigin(0, 0);
    bg.setStrokeStyle(1.5, tint, 0.55);
    const art = this.add.graphics();
    art.fillStyle(tint, 0.22);
    art.fillRoundedRect(SPACING.sm, SPACING.sm, 40, 40, 6);
    art.lineStyle(1, tint, 0.9);
    art.strokeRoundedRect(SPACING.sm, SPACING.sm, 40, 40, 6);
    const icon = iconImage(this, 'i-entity', 22, 'primary');
    (icon as unknown as { x: number; y: number }).x = SPACING.sm + 20;
    (icon as unknown as { y: number }).y = SPACING.sm + 20;
    const name = makeText(this, SPACING.sm + 50, 8, `◉ ${entity.nameEn}`, {
      mono: true,
      size: FONT_SIZES.caption,
      tone: 'noise',
    });
    const tell = makeText(
      this,
      SPACING.sm + 50,
      26,
      ellipsis(sharedT(selectLang(), entity.tellKey), 46),
      { size: FONT_SIZES.caption, tone: 'secondary' },
    );
    root.add([bg, art, icon, name, tell]);
    root.setSize(INNER_W, h);
    return root;
  }

  private renderNoSession(): void {
    if (!this.root) return;
    const ids = listScenarioIds();
    const header = makeSection(this, t('arena.task'), '');
    header.setPosition(LAYOUT.gutter, SPACING.sm);
    this.root.add(header);
    let y = 44;
    for (const id of ids) {
      const label = makeLabel(this, {
        text: `${t('shell.scenarioProgress')} ${id}`,
        width: INNER_W,
        mono: true,
        pad: { top: 14, bottom: 14 },
      });
      label.setPosition(LAYOUT.gutter, y);
      this.root.add(
        tappable(label, () => {
          playSound(this, 'click');
          useArenaStore.getState().startScenario(id);
        }),
      );
      y += label.height + SPACING.sm;
    }
  }

  // ---------- task (прототип 4.3–4.9) ----------

  private renderTask(session: ArenaSessionState, scenario: ScenarioPublic): void {
    if (!this.root) return;
    const context = makeText(this, 0, 0, ellipsis(sharedT(selectLang(), scenario.contextKey), 92), {
      size: 15,
      wrapWidth: INNER_W,
    });
    if (context.height > 44) context.setText(ellipsis(context.text, 64));
    const goal = makeText(this, 0, 0, ellipsis(sharedT(selectLang(), scenario.goalKey), 72), {
      size: FONT_SIZES.caption,
      tone: 'secondary',
      wrapWidth: INNER_W,
    });
    const cardH = 16 + context.height + 4 + goal.height + 10;
    const cardBg = panelBg(this, INNER_W, cardH);
    cardBg.setOrigin(0, 0);
    context.setPosition(SPACING.md, 8);
    goal.setPosition(SPACING.md, 8 + context.height + 4);
    const card = this.add.container(LAYOUT.gutter, SPACING.sm, [cardBg, context, goal]);
    card.setSize(INNER_W, cardH);
    this.root.add(card);
    let y = SPACING.sm + cardH + SPACING.sm;

    y += this.renderThreatChips(scenario, y);
    y += this.renderBrowser(session, scenario, y);
    y += this.renderSkills(session, scenario, y);
    y += this.renderDecisions(session, scenario, y);
    this.renderConfirmBar(session, scenario, y);
  }

  /** Строка активных угроз + давление (прототип 4.3, зона 3). Возвращает высоту. */
  private renderThreatChips(scenario: ScenarioPublic, y: number): number {
    if (!this.root) return 0;
    const row = this.add.container(LAYOUT.gutter, y);
    let cx = 0;
    for (const entityId of scenario.entityIds.slice(0, 2)) {
      const chip = makeChip(this, `◉ ${ellipsis(getEntity(entityId).nameEn, 12)}`, 'noise');
      chip.setPosition(cx, 0);
      row.add(chip);
      cx += chip.width + SPACING.xs;
    }
    const pressure = makeChip(this, `${t('arena.pressure')} ${pressureOf(scenario)}`, 'warning');
    pressure.setPosition(cx, 0);
    row.add(pressure);
    this.root.add(row);
    return 26 + SPACING.sm;
  }

  /** Браузерный виджет: chrome (точки + вкладки + каталог) + url + view. Возвращает высоту. */
  private renderBrowser(session: ArenaSessionState, scenario: ScenarioPublic, y: number): number {
    if (!this.root) return 0;
    const labels = scenario.tabs.map((tab) => TAB_LABEL[tab.id][selectLang()]);
    const tabs = makeButtons(this, {
      orientation: 'x',
      labels: [
        ...labels.map((text) => ({
          text: ellipsis(text, 9),
          size: FONT_SIZES.label,
          mono: true,
          pad: { left: SPACING.sm, right: SPACING.sm, top: 9, bottom: 9 },
        })),
        {
          text: '+',
          size: FONT_SIZES.body,
          mono: true,
          pad: { left: SPACING.sm, right: SPACING.sm, top: 7, bottom: 7 },
        },
      ],
      spaceItem: SPACING.xs,
      onClick: (index) => {
        if (index >= labels.length) {
          playSound(this, 'click');
          this.showCatalog(scenario);
          return;
        }
        playSound(this, 'tab');
        useArenaStore.getState().setArenaTab(index);
      },
    });
    labels.forEach((_, i) => paintButton(tabs, i, i === session.tabIndex));
    paintButton(tabs, labels.length, false);
    tabs.setPosition(LAYOUT.gutter + 44, y);
    anchor('arena:catalog-tab', tabs.getButton(labels.length));
    const dots = this.add.graphics();
    for (let i = 0; i < 3; i += 1) {
      dots.fillStyle(UI_TINT.muted, 1);
      dots.fillCircle(LAYOUT.gutter + 8 + i * 12, y + 16, 3);
    }
    this.root.add([dots, tabs]);
    const chromeH = tabs.height + SPACING.xs;

    const url = makeText(
      this,
      0,
      0,
      `arena://${scenario.scenarioId} · АРХИВ · ${scenario.datasetVersion}`,
      {
        mono: true,
        size: FONT_SIZES.label,
        tone: 'muted',
      },
    );
    url.setPosition(LAYOUT.gutter, y + chromeH);
    this.root.add(url);

    const viewY = y + chromeH + 18;
    const tab = scenario.tabs[session.tabIndex] ?? scenario.tabs[0];
    if (!tab) return chromeH + 18 + BROWSER_VIEW_H;
    if (tab.id === 'chart') {
      this.chart = new CandleChart(this, 0, 0, INNER_W, BROWSER_VIEW_H);
      this.chart.setData(scenario.visibleCandles, scenario.t0Index, []);
      this.chart.container.setPosition(LAYOUT.gutter, viewY);
      this.root.add(this.chart.container);
    } else if (tab.id === 'volume') {
      this.renderVolumeView(scenario, viewY);
    } else {
      const body = sharedT(selectLang(), tab.bodyKey);
      const panel = this.add.container(LAYOUT.gutter, viewY, [
        panelBg(this, INNER_W, BROWSER_VIEW_H),
      ]);
      const text = makeText(this, SPACING.md, SPACING.md, body, {
        size: FONT_SIZES.body,
        wrapWidth: INNER_W - SPACING.md * 2,
      });
      panel.add(text);
      this.root.add(panel);
    }
    return chromeH + 18 + BROWSER_VIEW_H + SPACING.sm;
  }

  /** Вкладка объёма (прототип 4.4): бары + стакан + метрики. */
  private renderVolumeView(scenario: ScenarioPublic, viewY: number): void {
    if (!this.root) return;
    const candles = scenario.visibleCandles;
    const barsH = 56;
    const g = this.add.graphics();
    const maxV = Math.max(...candles.map((c) => c.v), 1);
    const slot = INNER_W / candles.length;
    candles.forEach((c, i) => {
      const bh = Math.max(2, (c.v / maxV) * (barsH - 8));
      const up = c.c >= c.o;
      g.fillStyle(up ? UI_TINT.success : UI_TINT.danger, 0.85);
      g.fillRect(LAYOUT.gutter + i * slot + 1, viewY + barsH - bh, Math.max(1, slot - 2), bh);
    });
    const t0x = LAYOUT.gutter + (scenario.t0Index + 0.5) * slot;
    g.lineStyle(1.5, UI_TINT.data, 0.9);
    g.lineBetween(t0x, viewY, t0x, viewY + barsH);

    const bookY = viewY + barsH + 4;
    const bookH = BROWSER_VIEW_H - barsH - 4;
    const frame = this.add.graphics();
    frame.fillStyle(UI_BG.surface, 1);
    frame.fillRoundedRect(LAYOUT.gutter, bookY, INNER_W, bookH, 8);
    frame.lineStyle(1, UI_TINT.secondary, 0.25);
    frame.strokeRoundedRect(LAYOUT.gutter, bookY, INNER_W, bookH, 8);
    this.root.add([g, frame]);

    const book = orderBookOf(scenario.scenarioId, scenario.contentVersion);
    const midX = LAYOUT.gutter + INNER_W / 2;
    const asksLabel = makeText(
      this,
      LAYOUT.gutter + SPACING.sm,
      bookY + 4,
      t('arena.volume.asks'),
      {
        mono: true,
        size: FONT_SIZES.label - 1,
        tone: 'danger',
      },
    );
    const bidsLabel = makeText(this, midX + SPACING.xs, bookY + 4, t('arena.volume.bids'), {
      mono: true,
      size: FONT_SIZES.label - 1,
      tone: 'success',
    });
    this.root.add([asksLabel, bidsLabel]);
    const rowsG = this.add.graphics();
    const rowY0 = bookY + 18;
    book.asks.forEach((ask, i) => {
      const bid = book.bids[i];
      const ry = rowY0 + i * 13;
      const askW = Math.max(4, (ask.vol / 38) * (INNER_W / 2 - 52));
      rowsG.fillStyle(UI_TINT.danger, 0.7);
      rowsG.fillRect(midX - SPACING.xs - askW, ry, askW, 9);
      if (bid) {
        const bidW = Math.max(4, (bid.vol / 38) * (INNER_W / 2 - 52));
        rowsG.fillStyle(UI_TINT.success, 0.7);
        rowsG.fillRect(midX + SPACING.xs, ry, bidW, 9);
      }
    });
    rowsG.lineStyle(1, UI_TINT.secondary, 0.3);
    rowsG.lineBetween(midX, bookY + 4, midX, rowY0 + 52);
    this.root.add(rowsG);

    const delta = breakVolumeDelta(candles);
    const deltaText = delta === null ? '—' : `${delta > 0 ? '+' : ''}${delta}%`;
    const metrics = makeText(
      this,
      0,
      0,
      `${t('arena.volume.spread')} ${book.spreadPct}% · ${t('arena.volume.breakVol')} ${deltaText} ${t('arena.volume.toAvg')}`,
      { mono: true, size: FONT_SIZES.label - 1, tone: 'secondary' },
    );
    metrics.setPosition(LAYOUT.gutter + SPACING.sm, rowY0 + 54);
    const wall = makeText(this, 0, 0, `${t('arena.volume.wall')} · ${t('arena.volume.wallBody')}`, {
      mono: true,
      size: FONT_SIZES.label - 1,
      tone: 'narrative',
    });
    wall.setPosition(LAYOUT.gutter + SPACING.sm, rowY0 + 68);
    this.root.add([metrics, wall]);
  }

  /** Карты навыков: ровно 4 слота (прототип 4.3, зона 5). Возвращает высоту. */
  private renderSkills(session: ArenaSessionState, scenario: ScenarioPublic, y: number): number {
    if (!this.root) return 0;
    const header = makeSection(
      this,
      t('arena.skills'),
      `${t('arena.skillsApplied')} ${session.skillIds.length} ${t('arena.of')} ${MAX_SKILLS}`,
    );
    header.setPosition(LAYOUT.gutter, y);
    this.root.add(header);
    const rowY = y + 26;
    const gap = 7;
    const slotW = (INNER_W - gap * 3) / 4;
    const slotH = 60;
    const skills = scenario.skillIds.map((id) => getSkill(id));
    for (let i = 0; i < 4; i += 1) {
      const skill = skills[i];
      const x = LAYOUT.gutter + i * (slotW + gap);
      if (skill) {
        this.root.add(this.skillSlot(session, skill, x, rowY, slotW, slotH, i));
      } else {
        this.root.add(this.skillTeaser(x, rowY, slotW, slotH));
      }
    }
    return 26 + slotH + SPACING.sm;
  }

  /** Слот карты: глиф + короткое имя + тип. */
  private skillSlot(
    session: ArenaSessionState,
    skill: SkillCard,
    x: number,
    y: number,
    w: number,
    h: number,
    index: number,
  ): Phaser.GameObjects.Container {
    const selected = session.skillIds.includes(skill.skillId);
    const root = this.add.container(x, y);
    const bg = panelBg(this, w, h, selected ? UI_BG.surface3 : UI_BG.surface2, LAYOUT.radiusSm);
    bg.setOrigin(0, 0);
    if (selected) bg.setStrokeStyle(2, UI_TINT.active, 1);
    const icon = iconImage(this, 'i-card', 16, selected ? 'active' : 'secondary');
    (icon as unknown as { x: number; y: number }).x = w / 2;
    (icon as unknown as { y: number }).y = 13;
    const name = makeText(
      this,
      0,
      22,
      sharedT(selectLang(), `${skill.titleKey.replace('.title', '.short')}`),
      {
        size: FONT_SIZES.label,
        tone: selected ? 'active' : 'primary',
        align: 'center',
      },
    );
    name.setOrigin(0.5, 0);
    name.setX(w / 2);
    name.setWordWrapWidth(w - 6);
    if (name.height > 24) name.setText(ellipsis(name.text, 12));
    const kind = makeText(this, 0, 22 + name.height + 1, t(`arena.skill.kindName.${skill.kind}`), {
      mono: true,
      size: FONT_SIZES.label - 2,
      tone: 'muted',
      align: 'center',
    });
    kind.setOrigin(0.5, 0);
    kind.setX(w / 2);
    root.add([bg, icon, name, kind]);
    root.setSize(w, h);
    anchor(`arena:skill:${index}`, root);
    const zone = this.add.zone(0, 0, w, Math.max(h, LAYOUT.touchMin)).setOrigin(0, 0);
    zone.setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => {
      playSound(this, 'click');
      if (useArenaStore.getState().arena?.skillIds.includes(skill.skillId)) {
        this.showSkill(skill.skillId);
      } else if ((useArenaStore.getState().arena?.skillIds.length ?? 0) >= MAX_SKILLS) {
        this.showSkill(skill.skillId);
      } else {
        useArenaStore.getState().toggleSkill(skill.skillId);
      }
    });
    root.add(zone);
    return root;
  }

  /** Заглушка 4-го слота: ведёт в Академию (честный тизер, не декор). */
  private skillTeaser(x: number, y: number, w: number, h: number): Phaser.GameObjects.Container {
    const root = this.add.container(x, y);
    const bg = panelBg(this, w, h, UI_BG.surface, LAYOUT.radiusSm);
    bg.setOrigin(0, 0);
    bg.setStrokeStyle(1, UI_TINT.secondary, 0.35);
    const icon = iconImage(this, 'i-lock', 16, 'muted');
    (icon as unknown as { x: number; y: number }).x = w / 2;
    (icon as unknown as { y: number }).y = 20;
    const more = makeText(this, 0, 32, '···', {
      mono: true,
      size: FONT_SIZES.body,
      tone: 'muted',
      align: 'center',
    });
    more.setOrigin(0.5, 0);
    more.setX(w / 2);
    root.add([bg, icon, more]);
    root.setSize(w, h);
    const zone = this.add.zone(0, 0, w, Math.max(h, LAYOUT.touchMin)).setOrigin(0, 0);
    zone.setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => {
      playSound(this, 'click');
      toast(this, t('arena.moreSkills'));
    });
    root.add(zone);
    return root;
  }

  /** 4 решения 2×2 (A/B/C/D). Возвращает высоту. */
  private renderDecisions(session: ArenaSessionState, scenario: ScenarioPublic, y: number): number {
    if (!this.root) return 0;
    const header = makeSection(this, t('arena.decisions'), '');
    header.setPosition(LAYOUT.gutter, y);
    this.root.add(header);
    const cellW = (INNER_W - SPACING.sm) / 2;
    const cellH = 44;
    scenario.decisions.forEach((decision, i) => {
      const key = DECISION_KEYS[i] ?? '?';
      const selected = session.decisionId === decision.id;
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = LAYOUT.gutter + col * (cellW + SPACING.sm);
      const dy = y + 22 + row * (cellH + SPACING.sm);
      const bg = panelBg(this, cellW, cellH, selected ? UI_BG.surface3 : UI_BG.surface2);
      bg.setOrigin(0, 0);
      if (selected) {
        bg.setFillStyle(UI_TINT.active, 0.16);
        bg.setStrokeStyle(2, UI_TINT.active, 1);
      }
      const keyText = makeText(this, SPACING.sm, 12, key, {
        mono: true,
        size: 13,
        tone: selected ? 'active' : 'data',
      });
      const label = makeText(
        this,
        SPACING.sm + 22,
        6,
        ellipsis(sharedT(selectLang(), decision.labelKey), 20),
        { size: FONT_SIZES.caption },
      );
      label.setWordWrapWidth(cellW - SPACING.sm - 26);
      const cell = this.add.container(x, dy, [bg, keyText, label]);
      cell.setSize(cellW, cellH);
      anchor(`arena:dec:${i}`, cell);
      const zone = this.add.zone(0, 0, cellW, Math.max(cellH, LAYOUT.touchMin)).setOrigin(0, 0);
      zone.setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => {
        playSound(this, 'click');
        useArenaStore.getState().selectDecision(decision.id);
      });
      cell.add(zone);
      this.root?.add(cell);
    });
    return 22 + cellH * 2 + SPACING.sm + SPACING.sm;
  }

  /** Нижняя док-панель подтверждения (прототип 4.7, игровая адаптация в фикс-зону). */
  private renderConfirmBar(session: ArenaSessionState, scenario: ScenarioPublic, y: number): void {
    if (!this.root) return;
    if (!session.decisionId) {
      const hint = makeText(this, 0, 0, t('arena.confirmHint'), {
        mono: true,
        size: FONT_SIZES.label,
        tone: 'muted',
        align: 'center',
      });
      hint.setOrigin(0.5, 0);
      hint.setPosition(LAYOUT.viewWidth / 2, y + SPACING.xs);
      this.root.add(hint);
      const disc = makeText(this, 0, 0, t('arena.disclaimer'), {
        mono: true,
        size: FONT_SIZES.label - 2,
        tone: 'muted',
        align: 'center',
      });
      disc.setOrigin(0.5, 0);
      disc.setPosition(LAYOUT.viewWidth / 2, y + SPACING.xs + 20);
      disc.setWordWrapWidth(INNER_W);
      this.root.add(disc);
      return;
    }
    const index = scenario.decisions.findIndex((d) => d.id === session.decisionId);
    const key = DECISION_KEYS[index] ?? '?';
    const sel = makeText(this, 0, 0, `${t('arena.confirm.selected')} · ${key}`, {
      mono: true,
      size: FONT_SIZES.label,
      tone: 'active',
    });
    sel.setPosition(LAYOUT.gutter, y);
    const changeable = makeText(this, 0, 0, t('arena.confirm.changeable'), {
      size: FONT_SIZES.label,
      tone: 'muted',
    });
    changeable.setOrigin(1, 0);
    changeable.setPosition(LAYOUT.gutter + INNER_W, y);
    const decision = decisionOf(scenario, session.decisionId);
    const text = makeText(this, 0, 0, ellipsis(sharedT(selectLang(), decision.labelKey), 44), {
      size: FONT_SIZES.body,
    });
    text.setPosition(LAYOUT.gutter, y + 18);
    this.root.add([sel, changeable, text]);

    const by = y + 18 + text.height + SPACING.xs;
    const change = makeLabel(this, {
      text: t('arena.confirm.change'),
      size: FONT_SIZES.caption,
      mono: true,
      pad: { left: SPACING.md, right: SPACING.md, top: 13, bottom: 13 },
    });
    change.setPosition(LAYOUT.gutter, by);
    const fix = makeCta(
      this,
      t('arena.confirm'),
      () => {
        if (!useArenaStore.getState().arena?.decisionId) return;
        playSound(this, 'decision');
        if (scenario.step2 && !useArenaStore.getState().arena?.step2Id) this.showStep2(scenario);
        else this.lockDecision();
      },
      'active',
      INNER_W - change.width - SPACING.sm,
    );
    fix.setPosition(LAYOUT.gutter + change.width + SPACING.sm, by);
    anchor('arena:confirm', fix);
    anchor('arena:change', change);
    this.root.add([
      tappable(change, () => {
        playSound(this, 'click');
        useArenaStore.getState().selectDecision(null);
      }),
      fix,
    ]);

    const note = makeText(this, 0, 0, t('arena.confirm.lockNote'), {
      size: FONT_SIZES.label - 1,
      tone: 'muted',
      align: 'center',
    });
    note.setOrigin(0.5, 0);
    note.setPosition(LAYOUT.viewWidth / 2, by + fix.height + 3);
    note.setWordWrapWidth(INNER_W);
    this.root.add(note);
  }

  // ---------- lock + reveal (прототип 4.10) ----------

  private lockDecision(): void {
    const session = useArenaStore.getState().arena;
    if (!session?.decisionId) return;
    useArenaStore.getState().setArenaPhase('reveal');
  }

  private renderReveal(session: ArenaSessionState, scenario: ScenarioPublic): void {
    if (!this.root) return;
    const header = makeSection(this, t('reveal.title'), scenario.futureHash.slice(0, 8));
    header.setPosition(LAYOUT.gutter, SPACING.sm);
    this.root.add(header);

    const factCard = makeLabel(this, {
      text: `${t('arena.reveal.layerFact')}: ${sharedT(selectLang(), revealScenario(session.scenarioId).factKey)}`,
      size: FONT_SIZES.body,
      width: INNER_W,
    });
    factCard.setPosition(LAYOUT.gutter, 36);
    this.root.add(factCard);
    const chartY = 36 + factCard.height + SPACING.sm;

    // Скрытое будущее запрашивается только здесь — после фиксации решения.
    const revealed = revealScenario(session.scenarioId);
    this.chart = new CandleChart(this, 0, 0, INNER_W, 236);
    this.chart.setData(scenario.visibleCandles, scenario.t0Index, futureCandlesOf(revealed));
    const decIndex = scenario.decisions.findIndex((d) => d.id === session.decisionId);
    this.chart.setDecisionMarker(
      scenario.t0Index,
      `${t('arena.confirm.selected')} · ${DECISION_KEYS[decIndex] ?? '?'}`,
    );
    this.chart.container.setPosition(LAYOUT.gutter, chartY);
    this.root.add(this.chart.container);

    const controlsY = chartY + 236 + SPACING.sm;
    const speed = makeLabel(this, {
      text: `${t('arena.reveal.speed')} ×${this.revealStepMs === 90 ? '1' : '2'}`,
      size: FONT_SIZES.caption,
      mono: true,
      pad: { left: SPACING.sm, right: SPACING.sm, top: 12, bottom: 12 },
    });
    speed.setPosition(LAYOUT.gutter, controlsY);
    const replay = makeLabel(this, {
      text: t('arena.reveal.replay'),
      size: FONT_SIZES.caption,
      mono: true,
      pad: { left: SPACING.sm, right: SPACING.sm, top: 12, bottom: 12 },
    });
    replay.setPosition(LAYOUT.gutter + speed.width + SPACING.sm, controlsY);
    const frame = makeText(this, 0, 0, '', {
      mono: true,
      size: FONT_SIZES.caption,
      tone: 'data',
    });
    frame.setOrigin(1, 0);
    frame.setPosition(LAYOUT.gutter + INNER_W, controlsY + 12);
    const paintFrame = (): void => {
      if (!this.chart) return;
      frame.setText(
        `${t('arena.reveal.frame')} ${this.chart.revealedCount}/${this.chart.futureCount}`,
      );
    };
    paintFrame();
    anchor('arena:speed', speed);
    anchor('arena:replay', replay);
    this.root.add([
      tappable(speed, () => {
        playSound(this, 'click');
        this.revealStepMs = this.revealStepMs === 90 ? 45 : 90;
        const tx = speed.getElement('text') as Phaser.GameObjects.Text | null;
        tx?.setText(`${t('arena.reveal.speed')} ×${this.revealStepMs === 90 ? '1' : '2'}`);
        // reveal продолжается с текущего кадра — анимация не прерывается
        this.chart?.reveal({
          animated: true,
          stepMs: this.revealStepMs,
          onFrame: () => paintFrame(),
        });
      }),
      tappable(replay, () => {
        playSound(this, 'reveal');
        this.chart?.resetReveal();
        paintFrame();
        this.chart?.reveal({
          animated: true,
          stepMs: this.revealStepMs,
          onFrame: () => paintFrame(),
        });
      }),
      frame,
    ]);

    const decision = session.decisionId ? decisionOf(scenario, session.decisionId) : null;
    const consCard = makeLabel(this, {
      text: `${t('arena.reveal.layerConsequence')}: ${decision ? sharedT(selectLang(), decision.rationaleKey) : '—'}`,
      size: FONT_SIZES.caption,
      tone: 'secondary',
      width: INNER_W,
    });
    consCard.setPosition(LAYOUT.gutter, controlsY + speed.height + SPACING.sm);
    this.root.add(consCard);

    const ctaY = controlsY + speed.height + SPACING.sm + consCard.height + SPACING.sm;
    const label = session.quality === null ? t('reveal.play') : t('reveal.quality');
    const cta = makeCta(this, label, () => void this.openVerdict());
    cta.setPosition(LAYOUT.gutter, ctaY);
    anchor('arena:reveal-cta', cta);
    this.root.add(cta);
    const src = makeText(this, 0, 0, sharedT(selectLang(), revealed.sourceRef), {
      mono: true,
      size: FONT_SIZES.label,
      tone: 'muted',
      align: 'center',
    });
    src.setOrigin(0.5, 0);
    src.setPosition(LAYOUT.viewWidth / 2, ctaY + cta.height + 4);
    this.root.add(src);

    if (this.revealPlayedFor !== session.scenarioId) {
      this.revealPlayedFor = session.scenarioId;
      playSound(this, 'reveal');
      this.chart.reveal({ animated: true, stepMs: this.revealStepMs, onFrame: () => paintFrame() });
    } else {
      this.chart.reveal({ animated: false, onFrame: () => paintFrame() });
    }
  }

  private async openVerdict(): Promise<void> {
    const session = useArenaStore.getState().arena;
    if (!session?.decisionId) return;
    playSound(this, 'success');
    if (this.verdictAppliedFor !== session.scenarioId || session.quality === null) {
      const scenario = getPublicScenario(session.scenarioId);
      const verdict = computeVerdictStub(scenario, session.decisionId, session.step2Id);
      useArenaStore
        .getState()
        .applyVerdict(session.scenarioId, verdict.quality, verdict.xpAwarded, session.skillIds);
      useArenaStore.getState().setArenaPhase('verdict', verdict.quality);
      this.verdictAppliedFor = session.scenarioId;
    }
    const key = await ensureVerdictScene(this);
    this.scene.launch(key);
    this.scene.bringToTop(key);
  }

  // ---------- sheets: catalog / skill / step2 / help / pause ----------

  /** Каталог источников (прототип 4.5): открытые + платные/уровневые/фазовые. */
  private showCatalog(scenario: ScenarioPublic): void {
    const rows = tabCatalog(scenario);
    const rowH = 52;
    const sheetH = Math.min(660, 150 + rows.length * (rowH + 4) + 78);
    const sheet = makeSheet(this, sheetH, (panel, innerW) => {
      const x = -innerW / 2 + SPACING.md;
      let cy = -sheetH / 2 + SPACING.md;
      const title = makeText(this, x, cy, t('arena.catalog.title'), {
        mono: true,
        size: FONT_SIZES.label,
        tone: 'muted',
      });
      cy += title.height + 4;
      const sub = makeText(this, x, cy, t('arena.catalog.sub'), {
        size: FONT_SIZES.caption,
        tone: 'secondary',
        wrapWidth: innerW - SPACING.md * 2,
      });
      cy += sub.height + SPACING.sm;
      panel.add([title, sub]);
      rows.forEach((row, i) => {
        const isOpen = row.lock === null;
        const bg = panelBg(this, innerW - SPACING.md * 2, rowH, UI_BG.surface2, LAYOUT.radiusSm);
        bg.setOrigin(0, 0);
        bg.setPosition(x, cy);
        const name = makeText(this, x + SPACING.sm, cy + 6, TAB_LABEL[row.tabId][selectLang()], {
          mono: true,
          size: FONT_SIZES.caption,
        });
        const state = makeText(
          this,
          x + SPACING.sm,
          cy + 24,
          isOpen
            ? t('arena.catalog.open')
            : row.lock?.kind === 'coins'
              ? `${row.lock.cost} ${t('arena.catalog.coins')}`
              : row.lock?.kind === 'level'
                ? `${t('arena.catalog.level')} ${row.lock.level}`
                : t('arena.catalog.phaseOnly'),
          {
            size: FONT_SIZES.label,
            tone: isOpen ? 'success' : row.lock?.kind === 'coins' ? 'warning' : 'muted',
          },
        );
        // Метка состояния кодовой графикой (эмодзи запрещены конвенциями):
        // открыто — галочка, монеты — залитый круг, уровень/фаза — пустой квадрат.
        const mark = this.add.graphics();
        const mx = x + innerW - SPACING.md * 2 - SPACING.sm;
        const my = cy + rowH / 2;
        if (isOpen) {
          mark.lineStyle(2.5, UI_TINT.success, 1);
          mark.lineBetween(mx - 14, my, mx - 8, my + 6);
          mark.lineBetween(mx - 8, my + 6, mx, my - 6);
        } else if (row.lock?.kind === 'coins') {
          mark.fillStyle(UI_TINT.warning, 1);
          mark.fillCircle(mx - 7, my, 6);
        } else {
          mark.lineStyle(2, UI_TINT.muted, 1);
          mark.strokeRect(mx - 14, my - 6, 12, 12);
        }
        panel.add([bg, name, state, mark]);
        const zone = this.add.zone(x, cy, innerW - SPACING.md * 2, rowH).setOrigin(0, 0);
        zone.setInteractive({ useHandCursor: true });
        zone.on('pointerdown', () => {
          if (row.scenarioIndex !== null) {
            playSound(this, 'tab');
            useArenaStore.getState().setArenaTab(row.scenarioIndex);
            sheet.hide();
          } else {
            playSound(this, 'error');
            toast(this, t('arena.catalog.note'));
          }
        });
        anchor(`arena:catalog:${i}`, zone);
        panel.add(zone);
        cy += rowH + 4;
      });
      const note = makeText(this, x, cy + 4, t('arena.catalog.note'), {
        size: FONT_SIZES.label,
        tone: 'muted',
        wrapWidth: innerW - SPACING.md * 2,
      });
      panel.add(note);
      return sheetH - 40;
    });
    sheet.show();
  }

  /** Карта навыка (прототип 4.6): тип + арт + принцип + мета 2×2 + Академия + действие. */
  private showSkill(skillId: string): void {
    const skill = getSkill(skillId);
    const stats = selectProgress().skillStats ?? {};
    const stat = stats[skillId];
    const used = stat?.used ?? 0;
    const avg = avgQualityOf(stat);
    const applied = useArenaStore.getState().arena?.skillIds.includes(skillId) ?? false;
    const sheetH = 560;
    const sheet = makeSheet(this, sheetH, (panel, innerW) => {
      const x = -innerW / 2 + SPACING.md;
      const w = innerW - SPACING.md * 2;
      let cy = -sheetH / 2 + SPACING.md;
      const tag = makeChip(this, t(`arena.skill.cardOf.${skill.kind}`), 'data');
      tag.setPosition(x, cy);
      panel.add(tag);
      cy += 28;
      const art = this.add.graphics();
      art.fillStyle(UI_TINT.data, 0.12);
      art.fillRoundedRect(x, cy, w, 84, 8);
      art.lineStyle(1, UI_TINT.data, 0.5);
      art.strokeRoundedRect(x, cy, w, 84, 8);
      const artIcon = iconImage(this, 'i-card', 34, 'data');
      (artIcon as unknown as { x: number; y: number }).x = x + w / 2;
      (artIcon as unknown as { y: number }).y = cy + 42;
      panel.add([art, artIcon]);
      cy += 92;
      const title = makeText(this, x, cy, sharedT(selectLang(), skill.titleKey), {
        size: 15,
        wrapWidth: w,
      });
      cy += title.height + 2;
      const body = makeText(this, x, cy, sharedT(selectLang(), skill.bodyKey), {
        size: FONT_SIZES.body,
        tone: 'secondary',
        wrapWidth: w,
      });
      cy += body.height + SPACING.sm;
      panel.add([title, body]);
      const grid = makeKvGrid(
        this,
        [
          { label: t('arena.skill.type'), value: t(`arena.skill.kindName.${skill.kind}`) },
          { label: t('arena.skill.mastery'), value: `${masteryOf(used)} / 3`, valueTone: 'data' },
          {
            label: t('arena.skill.used'),
            value: used === 0 ? '—' : `${used} ${t('arena.skill.times')}`,
          },
          {
            label: t('arena.skill.avgQuality'),
            value: avg === null ? '—' : `${avg}`,
            valueTone: avg === null ? 'muted' : avg >= 60 ? 'success' : 'warning',
          },
        ],
        { width: w, cellH: 48 },
      );
      grid.setPosition(x, cy);
      panel.add(grid);
      cy += grid.height + SPACING.sm;
      const study = makeLabel(this, {
        text: `${t('arena.skill.studyIn')}: ${sharedT(selectLang(), chapterTitleKeyFor(skill.theoryKey))}`,
        size: FONT_SIZES.caption,
        tone: 'secondary',
        width: w,
      });
      study.setPosition(x, cy);
      panel.add(study);
      cy += study.height + SPACING.sm;
      const toAcademy = makeLabel(this, {
        text: t('arena.skill.toAcademy'),
        size: FONT_SIZES.caption,
        mono: true,
        pad: { left: SPACING.sm, right: SPACING.sm, top: 12, bottom: 12 },
      });
      toAcademy.setPosition(x, cy);
      const apply = makeCta(
        this,
        applied ? t('arena.unskill') : t('arena.skill.apply'),
        () => {
          playSound(this, 'click');
          useArenaStore.getState().toggleSkill(skillId);
          sheet.hide();
        },
        applied ? 'warning' : 'active',
        w - toAcademy.width - SPACING.sm,
      );
      apply.setPosition(x + toAcademy.width + SPACING.sm, cy);
      panel.add([
        tappable(toAcademy, () => {
          playSound(this, 'click');
          sheet.hide();
          useArenaStore.getState().setRoute('academy');
        }),
        apply,
      ]);
      return sheetH - 40;
    });
    sheet.show();
  }

  private showStep2(scenario: ScenarioPublic): void {
    const step2 = scenario.step2;
    if (!step2) {
      this.lockDecision();
      return;
    }
    const options = step2.options;
    const buttons = makeButtons(this, {
      orientation: 'y',
      labels: options.map((o) => ({
        text: ellipsis(sharedT(selectLang(), o.labelKey), 30),
        width: INNER_W - 60,
        pad: { top: 12, bottom: 12 },
      })),
      onClick: (index) => {
        const opt = options[index];
        if (!opt) return;
        playSound(this, 'decision');
        useArenaStore.getState().selectStep2(opt.id);
        sheet.hide();
        this.lockDecision();
      },
    });
    const sheet = makeSheet(this, 430, (panel, innerW) => {
      const title = makeText(this, 0, 0, t('arena.step2'), {
        mono: true,
        size: FONT_SIZES.label,
        tone: 'muted',
      });
      title.setPosition(-innerW / 2 + SPACING.md, -195);
      const prompt = makeText(this, 0, 0, sharedT(selectLang(), step2.promptKey), {
        size: 15,
        wrapWidth: innerW - SPACING.md * 2,
      });
      prompt.setPosition(-innerW / 2 + SPACING.md, -195 + 24);
      buttons.setPosition(-buttons.width / 2, -195 + 24 + prompt.height + SPACING.md);
      options.forEach((_, i) => anchor(`arena:step2:${i}`, buttons.getButton(i)));
      panel.add([title, prompt, buttons]);
      return 300;
    });
    sheet.show();
  }

  private showHelp(): void {
    const session = selectArena();
    if (!session) return;
    const scenario = getPublicScenario(session.scenarioId);
    const protocol = getProtocol(session.sessionRuleId ?? scenario.protocolId);
    const sheet = makeSheet(this, 430, (panel, innerW) => {
      const x = -innerW / 2 + SPACING.md;
      let y = -195;
      const title = makeText(
        this,
        x,
        y,
        `${t('shell.protocol')}: ${sharedT(selectLang(), protocol.titleKey)}`,
        {
          size: 15,
          wrapWidth: innerW - SPACING.md * 2,
        },
      );
      y += title.height + SPACING.sm;
      const rule = makeText(this, x, y, sharedT(selectLang(), protocol.ruleKey), {
        size: FONT_SIZES.body,
        tone: 'secondary',
        wrapWidth: innerW - SPACING.md * 2,
      });
      y += rule.height + SPACING.md;
      const tells: string[] = [];
      for (const id of scenario.entityIds) {
        const e = getEntity(id);
        tells.push(`${e.nameEn}: ${sharedT(selectLang(), e.tellKey)}`);
      }
      const tell = makeText(this, x, y, tells.join('\n\n'), {
        size: FONT_SIZES.caption,
        tone: 'noise',
        wrapWidth: innerW - SPACING.md * 2,
      });
      panel.add([title, rule, tell]);
      return 300;
    });
    sheet.show();
  }

  private showPause(): void {
    const sheet = makeSheet(this, 400, (panel, innerW) => {
      const x = -innerW / 2 + SPACING.md;
      const title = makeText(this, x, -180, t('arena.pause'), {
        mono: true,
        size: FONT_SIZES.title,
      });
      const hint = makeText(this, x, -180 + 34, t('arena.exitHint'), {
        size: FONT_SIZES.body,
        tone: 'secondary',
        wrapWidth: innerW - SPACING.md * 2,
      });
      const exitCta = makeCta(this, t('arena.exit'), () => {
        sheet.hide();
        useArenaStore.getState().setRoute('home');
      });
      exitCta.setPosition(x, 60);
      panel.add([title, hint, exitCta]);
      return 260;
    });
    sheet.show();
  }
}

// Re-export для тестов обратной совместимости селекторов.
export type { Candle };
