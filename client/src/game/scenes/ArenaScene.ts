// T040–T042 · ArenaScene: брифинг → задание (браузер + карты + 4 решения + 2-й шаг) → reveal.
// Вердикт — отдельным оверлеем VerdictScene. Скрытое будущее запрашивается
// только после фиксации решения (revealScenario после lock).
import Phaser from 'phaser';
import type { Candle, ScenarioPublic } from '@signal-arena/shared';
import {
  FONT_SIZES,
  LAYOUT,
  SPACING,
  TAB_LABEL,
  UI_BG,
  UI_TINT,
  t as sharedT,
} from '@signal-arena/shared';
import type { ArenaSessionState } from '../../store.js';
import { selectArena, selectLang, useArenaStore } from '../../store.js';
import { t } from '../../copy.js';
import { playSound } from '../../sound.js';
import {
  computeVerdictStub,
  futureCandlesOf,
  getEntity,
  getProtocol,
  getPublicScenario,
  getSkill,
  listScenarioIds,
  revealScenario,
} from '../../content.js';
import { ensureVerdictScene } from '../router.js';
import { CandleChart } from '../ui/CandleChart.js';
import { iconImage } from '../ui/icons.js';
import {
  anchor,
  clearAnchors,
  ellipsis,
  makeButtons,
  makeCta,
  makeLabel,
  makeSection,
  makeSheet,
  makeText,
  paintButton,
  panelBg,
  tappable,
} from '../ui/kit.js';
import type { RexUIRoundRectangle } from 'phaser4-rex-plugins/templates/ui/ui-plugin.js';
import { CONTENT_RECT } from './ShellScene.js';

const INNER_W = LAYOUT.viewWidth - LAYOUT.gutter * 2;
const DECISION_KEYS = ['A', 'B', 'C', 'D'] as const;

export default class ArenaScene extends Phaser.Scene {
  private root: Phaser.GameObjects.Container | null = null;
  private chart: CandleChart | null = null;
  private unsubscribe: (() => void) | null = null;
  private revealPlayedFor: string | null = null;
  private verdictAppliedFor: string | null = null;

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
    if (session.phase === 'brief') this.renderBrief(scenario);
    else if (session.phase === 'task') this.renderTask(session, scenario);
    else this.renderReveal(session, scenario);
  }

  // ---------- brief (прототип 4.2) ----------
  private renderBrief(scenario: ScenarioPublic): void {
    if (!this.root) return;
    let y = SPACING.sm;
    const header = makeSection(
      this,
      t('arena.brief'),
      `${t('shell.scenarioProgress')} ${scenario.scenarioId}`,
    );
    header.setPosition(LAYOUT.gutter, y);
    this.root.add(header);
    y += 30;

    const context = makeText(
      this,
      SPACING.md,
      SPACING.md,
      sharedT(selectLang(), scenario.contextKey),
      {
        size: 15,
        wrapWidth: INNER_W - SPACING.md * 2,
      },
    );
    const goal = makeText(this, SPACING.md, 0, sharedT(selectLang(), scenario.goalKey), {
      size: FONT_SIZES.body,
      tone: 'secondary',
      wrapWidth: INNER_W - SPACING.md * 2,
    });
    goal.setY(SPACING.md + context.height + SPACING.sm);
    const protocol = getProtocol(scenario.protocolId);
    const rule = makeText(
      this,
      SPACING.md,
      0,
      `${t('shell.protocol')}: ${sharedT(selectLang(), protocol.titleKey)} — ${sharedT(selectLang(), protocol.ruleKey)}`,
      { mono: true, size: FONT_SIZES.caption, tone: 'data', wrapWidth: INNER_W - SPACING.md * 2 },
    );
    rule.setY(goal.y + goal.height + SPACING.md);
    const entities = scenario.entityIds.map((id) => getEntity(id).nameEn).join(' · ');
    const entityLine = makeText(this, SPACING.md, 0, `ENTITY: ${entities || '—'}`, {
      mono: true,
      size: FONT_SIZES.caption,
      tone: 'noise',
    });
    entityLine.setY(rule.y + rule.height + SPACING.sm);
    const diff = makeText(
      this,
      SPACING.md,
      0,
      `DIFFICULTY ${scenario.difficulty}/99 · ${scenario.kind}`,
      {
        mono: true,
        size: FONT_SIZES.caption,
        tone: 'muted',
      },
    );
    diff.setY(entityLine.y + entityLine.height + SPACING.xs);
    const cardH = diff.y + diff.height + SPACING.md;
    const card = this.add.container(LAYOUT.gutter, y, [
      panelBg(this, INNER_W, cardH),
      context,
      goal,
      rule,
      entityLine,
      diff,
    ]);
    card.setSize(INNER_W, cardH);
    this.root.add(card);
    y += cardH + SPACING.lg;

    const cta = makeCta(this, t('arena.task'), () => {
      playSound(this, 'click');
      useArenaStore.getState().setArenaPhase('task');
    });
    cta.setPosition(LAYOUT.gutter, y);
    anchor('arena:brief-cta', cta);
    this.root.add(cta);
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
    const context = makeText(this, 0, 0, ellipsis(sharedT(selectLang(), scenario.contextKey), 96), {
      size: FONT_SIZES.body,
      wrapWidth: INNER_W,
    });
    context.setPosition(LAYOUT.gutter, SPACING.sm);
    this.root.add(context);
    let y = SPACING.sm + context.height + SPACING.sm;

    y += this.renderBrowser(session, scenario, y);
    y += this.renderSkills(session, scenario, y);
    y += this.renderDecisions(session, scenario, y);

    const hasDecision = session.decisionId !== null;
    const cta = makeCta(
      this,
      t('arena.confirm'),
      () => {
        if (!useArenaStore.getState().arena?.decisionId) return;
        playSound(this, 'decision');
        if (scenario.step2 && !useArenaStore.getState().arena?.step2Id) this.showStep2(scenario);
        else this.lockDecision();
      },
      hasDecision ? 'active' : 'muted',
    );
    cta.setPosition(LAYOUT.gutter, y + SPACING.xs);
    anchor('arena:confirm', cta);
    this.root.add(cta);
    const hint = makeText(this, 0, 0, t('arena.confirmHint'), {
      mono: true,
      size: FONT_SIZES.label,
      tone: 'muted',
      align: 'center',
    });
    hint.setOrigin(0.5, 0);
    hint.setPosition(LAYOUT.viewWidth / 2, y + SPACING.xs + cta.height + 2);
    this.root.add(hint);
  }

  /** Браузерный виджет: chrome (точки + вкладки) + url + view. Возвращает высоту. */
  private renderBrowser(session: ArenaSessionState, scenario: ScenarioPublic, y: number): number {
    if (!this.root) return 0;
    const labels = scenario.tabs.map((tab) => TAB_LABEL[tab.id][selectLang()]);
    const tabs = makeButtons(this, {
      orientation: 'x',
      labels: labels.map((text) => ({
        text: ellipsis(text, 10),
        size: FONT_SIZES.label,
        mono: true,
        pad: { left: SPACING.sm, right: SPACING.sm, top: 9, bottom: 9 },
      })),
      spaceItem: SPACING.xs,
      onClick: (index) => {
        playSound(this, 'tab');
        useArenaStore.getState().setArenaTab(index);
      },
    });
    labels.forEach((_, i) => paintButton(tabs, i, i === session.tabIndex));
    tabs.setPosition(LAYOUT.gutter + 44, y);
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

    const viewY = y + chromeH + 20;
    const viewH = 196;
    const tab = scenario.tabs[session.tabIndex] ?? scenario.tabs[0];
    if (!tab) return chromeH + 20 + viewH;
    if (tab.id === 'chart') {
      this.chart = new CandleChart(this, 0, 0, INNER_W, viewH);
      this.chart.setData(scenario.visibleCandles, scenario.t0Index, []);
      this.chart.container.setPosition(LAYOUT.gutter, viewY);
      this.root.add(this.chart.container);
    } else if (tab.id === 'volume') {
      this.renderVolumeView(scenario.visibleCandles, scenario.t0Index, viewY, viewH);
    } else {
      const body = sharedT(selectLang(), tab.bodyKey);
      const panel = this.add.container(LAYOUT.gutter, viewY, [panelBg(this, INNER_W, viewH)]);
      const text = makeText(this, SPACING.md, SPACING.md, body, {
        size: FONT_SIZES.body,
        wrapWidth: INNER_W - SPACING.md * 2,
      });
      panel.add(text);
      this.root.add(panel);
    }
    return chromeH + 20 + viewH + SPACING.sm;
  }

  /** Вкладка объёма: бары из реальных свечей + линия t0. */
  private renderVolumeView(candles: Candle[], t0: number, y: number, h: number): void {
    if (!this.root) return;
    const g = this.add.graphics();
    const maxV = Math.max(...candles.map((c) => c.v), 1);
    const slot = INNER_W / candles.length;
    candles.forEach((c, i) => {
      const bh = Math.max(2, (c.v / maxV) * (h - 16));
      const up = c.c >= c.o;
      g.fillStyle(up ? UI_TINT.success : UI_TINT.danger, 0.85);
      g.fillRect(LAYOUT.gutter + i * slot + 1, y + h - 8 - bh, Math.max(1, slot - 2), bh);
    });
    const t0x = LAYOUT.gutter + (t0 + 0.5) * slot;
    g.lineStyle(1.5, UI_TINT.data, 0.9);
    g.lineBetween(t0x, y + 4, t0x, y + h - 4);
    const frame = this.add.graphics();
    frame.fillStyle(UI_BG.app, 0);
    frame.lineStyle(1, UI_TINT.secondary, 0.25);
    frame.strokeRoundedRect(LAYOUT.gutter, y, INNER_W, h, 8);
    this.root.add([g, frame]);
  }

  /** Карты навыков 2×N. Возвращает высоту. */
  private renderSkills(session: ArenaSessionState, scenario: ScenarioPublic, y: number): number {
    if (!this.root) return 0;
    const header = makeSection(this, t('arena.skills'), `${session.skillIds.length}/3`);
    header.setPosition(LAYOUT.gutter, y);
    this.root.add(header);
    const cellW = (INNER_W - SPACING.sm) / 2;
    const cols = 2;
    let rowY = y + 28;
    let bottom = rowY;
    scenario.skillIds.forEach((skillId, i) => {
      const skill = getSkill(skillId);
      const selected = session.skillIds.includes(skillId);
      const icon = iconImage(this, 'i-card', 18, selected ? 'active' : 'secondary');
      const label = makeLabel(this, {
        text: ellipsis(sharedT(selectLang(), skill.titleKey), 15),
        icon,
        width: cellW,
        size: FONT_SIZES.caption,
        tone: selected ? 'active' : 'primary',
        pad: { top: 12, bottom: 12 },
      });
      const bg = label.getElement('background') as RexUIRoundRectangle | null;
      if (bg && selected) bg.setStrokeStyle(2, UI_TINT.active, 1);
      const col = i % cols;
      if (col === 0 && i > 0) rowY = bottom + SPACING.sm;
      label.setPosition(LAYOUT.gutter + col * (cellW + SPACING.sm), rowY);
      bottom = Math.max(bottom, rowY + label.height);
      this.root?.add(
        tappable(label, () => {
          playSound(this, 'click');
          if (useArenaStore.getState().arena?.skillIds.includes(skillId)) this.showSkill(skillId);
          else useArenaStore.getState().toggleSkill(skillId);
        }),
      );
    });
    return bottom - y + SPACING.sm;
  }

  /** 4 решения 2×2 (A/B/C/D). Возвращает высоту. */
  private renderDecisions(session: ArenaSessionState, scenario: ScenarioPublic, y: number): number {
    if (!this.root) return 0;
    const header = makeSection(this, t('arena.decisions'), '');
    header.setPosition(LAYOUT.gutter, y);
    this.root.add(header);
    const cellW = (INNER_W - SPACING.sm) / 2;
    let rowY = y + 28;
    let bottom = rowY;
    scenario.decisions.forEach((decision, i) => {
      const key = DECISION_KEYS[i] ?? '?';
      const selected = session.decisionId === decision.id;
      const keyText = makeText(this, 0, 0, key, {
        mono: true,
        size: 13,
        tone: selected ? 'active' : 'data',
      });
      const label = makeLabel(this, {
        text: ellipsis(sharedT(selectLang(), decision.labelKey), 18),
        icon: keyText,
        width: cellW,
        size: FONT_SIZES.caption,
        pad: { top: 13, bottom: 13 },
      });
      const bg = label.getElement('background') as RexUIRoundRectangle | null;
      if (bg) {
        if (selected) {
          bg.setFillStyle(UI_TINT.active, 0.16);
          bg.setStrokeStyle(2, UI_TINT.active, 1);
        } else {
          bg.setStrokeStyle(1, UI_TINT.secondary, 0.3);
        }
      }
      const col = i % 2;
      if (col === 0 && i > 0) rowY = bottom + SPACING.sm;
      label.setPosition(LAYOUT.gutter + col * (cellW + SPACING.sm), rowY);
      bottom = Math.max(bottom, rowY + label.height);
      anchor(`arena:dec:${i}`, label);
      this.root?.add(
        tappable(label, () => {
          playSound(this, 'click');
          useArenaStore.getState().selectDecision(decision.id);
        }),
      );
    });
    return bottom - y + SPACING.sm;
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
    // Скрытое будущее запрашивается только здесь — после фиксации решения.
    const revealed = revealScenario(session.scenarioId);
    this.chart = new CandleChart(this, 0, 0, INNER_W, 300);
    this.chart.setData(scenario.visibleCandles, scenario.t0Index, futureCandlesOf(revealed));
    this.chart.container.setPosition(LAYOUT.gutter, 44);
    this.root.add(this.chart.container);

    const fact = makeText(
      this,
      0,
      0,
      `${t('reveal.fact')}: ${sharedT(selectLang(), revealed.factKey)}`,
      {
        size: FONT_SIZES.body,
        wrapWidth: INNER_W,
      },
    );
    fact.setPosition(LAYOUT.gutter, 360);
    this.root.add(fact);
    const src = makeText(this, 0, 0, sharedT(selectLang(), revealed.sourceRef), {
      mono: true,
      size: FONT_SIZES.label,
      tone: 'muted',
    });
    src.setPosition(LAYOUT.gutter, 360 + fact.height + SPACING.sm);
    this.root.add(src);

    const y = 360 + fact.height + 60;
    const label = session.quality === null ? t('reveal.play') : t('reveal.quality');
    const cta = makeCta(this, label, () => void this.openVerdict());
    cta.setPosition(LAYOUT.gutter, y);
    anchor('arena:reveal-cta', cta);
    this.root.add(cta);

    if (this.revealPlayedFor !== session.scenarioId) {
      this.revealPlayedFor = session.scenarioId;
      playSound(this, 'reveal');
      this.chart.reveal({ animated: true });
    } else {
      this.chart.reveal({ animated: false });
    }
  }

  private async openVerdict(): Promise<void> {
    const session = useArenaStore.getState().arena;
    if (!session?.decisionId) return;
    playSound(this, 'success');
    if (this.verdictAppliedFor !== session.scenarioId || session.quality === null) {
      const scenario = getPublicScenario(session.scenarioId);
      const verdict = computeVerdictStub(scenario, session.decisionId, session.step2Id);
      useArenaStore.getState().applyVerdict(session.scenarioId, verdict.quality, verdict.xpAwarded);
      useArenaStore.getState().setArenaPhase('verdict', verdict.quality);
      this.verdictAppliedFor = session.scenarioId;
    }
    const key = await ensureVerdictScene(this);
    this.scene.launch(key);
    this.scene.bringToTop(key);
  }

  // ---------- sheets: skill / step2 / help / pause ----------
  private showSkill(skillId: string): void {
    const skill = getSkill(skillId);
    const sheet = makeSheet(this, 360, (panel, innerW) => {
      const title = makeText(this, 0, 0, sharedT(selectLang(), skill.titleKey), { size: 15 });
      title.setPosition(-innerW / 2 + SPACING.md, -160);
      const kind = makeText(this, 0, 0, `SKILL · ${skill.kind}`, {
        mono: true,
        size: FONT_SIZES.label,
        tone: 'data',
      });
      kind.setPosition(-innerW / 2 + SPACING.md, -160 + title.height + 4);
      const body = makeText(this, 0, 0, sharedT(selectLang(), skill.bodyKey), {
        size: FONT_SIZES.body,
        tone: 'secondary',
        wrapWidth: innerW - SPACING.md * 2,
      });
      body.setPosition(-innerW / 2 + SPACING.md, kind.y + 24);
      const remove = makeCta(
        this,
        t('arena.unskill'),
        () => {
          useArenaStore.getState().toggleSkill(skillId);
          sheet.hide();
        },
        'warning',
        innerW - SPACING.md * 2,
      );
      remove.setPosition(-innerW / 2 + SPACING.md, body.y + body.height + SPACING.md);
      panel.add([title, kind, body, remove]);
      return 200;
    });
    void sheet.root;
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
    const protocol = getProtocol(scenario.protocolId);
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
