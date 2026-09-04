// Браузер источников: вкладки + панель активного источника.
// Данные берутся из сценария (seed), а не из констант в рендере (аудит A4).
// Есть режим «развернуть на весь экран» — по требованию ТЗ и аудита T2.

import Phaser from 'phaser';
import type { EncounterInstance, SourceId } from '../../types';
import type { Scenario } from '../../engine/scenarioGen';
import { SOURCE_TITLES } from '../../engine/scenarioGen';
import type { EpochStructure } from '../../config/epochStructure';
import type { Palette } from '../../ui/palette';
import { CANVAS, GUTTER, HIT, RADIUS, SP } from '../../ui/tokens';
import * as TX from '../../ui/text';
import { T } from '../../ui/copy';
import { panel, selectableRow } from '../../ui/widgets';
import { CandleChart } from '../../ui/CandleChart';
import { enterPanel } from '../../ui/motion';
import { haptic, playSfx } from '../../ui/feedbackFx';
import { visibleSourceTabs } from '../../engine/arenaFlow';

export interface SourceBrowserOpts {
  y: number;
  height: number;
  palette: Palette;
  structure: EpochStructure;
  encounter: EncounterInstance;
  scenario: Scenario;
  blindCost: number;
  canAffordBlind: boolean;
  /** Закрытая вкладка уже оплачена и открыта. */
  blindOpened?: boolean;
  onEvidenceToggle: (id: string) => void;
  onBlindOpen: () => void;
  onExpand: (source: SourceId) => void;
}

export class SourceBrowser {
  private scene: Phaser.Scene;
  private opts: SourceBrowserOpts;
  private root: Phaser.GameObjects.Container;
  private body: Phaser.GameObjects.Container;
  private chart?: CandleChart;
  private active: SourceId;
  private selected: Set<string> = new Set();
  private blindOpened = false;

  constructor(scene: Phaser.Scene, opts: SourceBrowserOpts) {
    this.scene = scene;
    this.opts = opts;
    this.blindOpened = !!opts.blindOpened;
    const openedIndex = Math.min(opts.structure.tabs, opts.encounter.sources.length) - 1;
    this.active = (this.blindOpened
      ? opts.encounter.sources[Math.max(0, openedIndex)]
      : opts.encounter.sources[0]) as SourceId;
    this.root = scene.add.container(0, opts.y);
    this.body = scene.add.container(0, 0);
    this.root.add(this.body);
    this.build();
    enterPanel(scene, this.root);
  }

  get container(): Phaser.GameObjects.Container {
    return this.root;
  }

  /** Обновить выделение улик, не перестраивая весь блок. */
  setSelected(sel: Set<string>): void {
    this.selected = sel;
    this.chart?.setSelected(sel);
    this.renderBody();
  }

  setBlindOpened(v: boolean): void {
    this.blindOpened = v;
    this.build();
  }

  private tabsList(): SourceId[] {
    // Закрытая вкладка занимает последний слот. После оплаты в этом же слоте
    // появляется реальный источник; раньше плата лишь удаляла кнопку-пустышку.
    return visibleSourceTabs(
      this.opts.encounter.sources as SourceId[],
      this.opts.structure.tabs,
      this.opts.structure.blindTab,
      this.blindOpened,
    );
  }

  private build(): void {
    this.root.removeAll(true);
    this.body = this.scene.add.container(0, 0);

    const { palette: p } = this.opts;
    const w = CANVAS.w - GUTTER * 2;
    const tabH = HIT.min;

    const frame = panel(this.scene, GUTTER, 0, w, this.opts.height, p, {
      fill: p.insetN,
      stroke: p.strongN,
      radius: RADIUS.md,
    });
    this.root.add(frame);

    // ── Вкладки источников ──
    const tabs = this.tabsList();
    const showBlind =
      this.opts.structure.blindTab &&
      !this.blindOpened &&
      this.opts.encounter.sources.length > tabs.length;
    const total = tabs.length + (showBlind ? 1 : 0);
    const tabW = w / total;

    tabs.forEach((sid, i) => {
      const isActive = sid === this.active;
      const tx = GUTTER + i * tabW;
      const g = this.scene.add.graphics();
      g.fillStyle(isActive ? p.hoverN : p.surfaceN, 1);
      g.fillRoundedRect(tx, 0, tabW, tabH, RADIUS.sm);
      if (isActive) {
        g.fillStyle(p.accentN, 1);
        g.fillRoundedRect(tx + SP.sm, tabH - 3, tabW - SP.sm * 2, 3, 2);
      }
      this.root.add(g);
      const label = this.scene.add
        .text(tx + tabW / 2, tabH / 2, SOURCE_TITLES[sid], {
          ...TX.body(p, { color: isActive ? p.text : p.muted }),
        })
        .setOrigin(0.5);
      this.root.add(label);
      const tabZone = this.scene.add
        .rectangle(tx, 0, tabW, Math.max(tabH, HIT.min), 0x000000, 0)
        .setOrigin(0)
        .setInteractive();
      tabZone.on('pointerdown', () => {
        if (this.active === sid) return;
        haptic('light');
        playSfx('tap');
        this.active = sid;
        this.build();
      });
      this.root.add(tabZone);
    });

    // ── Закрытая вкладка: платный источник ──
    if (showBlind) {
      const tx = GUTTER + tabs.length * tabW;
      const g = this.scene.add.graphics();
      g.fillStyle(p.surfaceN, 1);
      g.fillRoundedRect(tx, 0, tabW, tabH, RADIUS.sm);
      g.lineStyle(1, p.warnN, 0.8);
      g.strokeRoundedRect(tx, 0, tabW, tabH, RADIUS.sm);
      this.root.add(g);
      const l1 = this.scene.add
        .text(tx + tabW / 2, tabH / 2 - 7, T.arena.blindTab, TX.caption(p, { color: p.warn }))
        .setOrigin(0.5);
      const l2 = this.scene.add
        .text(
          tx + tabW / 2,
          tabH / 2 + 8,
          T.arena.blindCost(this.opts.blindCost),
          TX.caption(p, { color: p.muted }),
        )
        .setOrigin(0.5);
      this.root.add(l1);
      this.root.add(l2);
      const blindZone = this.scene.add
        .rectangle(tx, 0, tabW, Math.max(tabH, HIT.min), 0x000000, 0)
        .setOrigin(0)
        .setInteractive();
      blindZone.on('pointerdown', () => {
        if (!this.opts.canAffordBlind) {
          haptic('warn');
          return;
        }
        haptic('light');
        this.opts.onBlindOpen();
      });
      this.root.add(blindZone);
    }

    // ── Кнопка «развернуть» ──
    const expandY = this.opts.height - HIT.min + SP.xs;
    const expandLabel = this.scene.add
      .text(GUTTER + w - SP.md, expandY + HIT.min / 2 - SP.xs, T.arena.expand, {
        ...TX.caption(p, { color: p.accent }),
      })
      .setOrigin(1, 0.5);
    this.root.add(expandLabel);
    const expandZone = this.scene.add
      .rectangle(GUTTER + w - 110, expandY, 110, HIT.min, 0x000000, 0)
      .setOrigin(0)
      .setInteractive();
    expandZone.on('pointerdown', () => {
      haptic('light');
      playSfx('tap');
      this.opts.onExpand(this.active);
    });
    this.root.add(expandZone);

    this.root.add(this.body);
    this.renderBody();
  }

  private renderBody(): void {
    this.body.removeAll(true);
    this.chart?.destroy();
    this.chart = undefined;

    const { palette: p } = this.opts;
    const w = CANVAS.w - GUTTER * 2;
    const top = HIT.min + SP.sm;
    const availH = this.opts.height - top - HIT.min;

    switch (this.active) {
      case 'chart':
        this.renderChart(GUTTER + SP.md, top, w - SP.md * 2, availH);
        break;
      case 'news':
        this.renderNews(GUTTER + SP.md, top, w - SP.md * 2, availH);
        break;
      case 'position':
        this.renderPosition(GUTTER + SP.md, top, w - SP.md * 2, availH);
        break;
      case 'orderbook':
        this.renderOrderbook(GUTTER + SP.md, top, w - SP.md * 2, availH);
        break;
      default:
        this.renderGeneric(GUTTER + SP.md, top, w - SP.md * 2, availH);
    }
    void p;
  }

  private zonesFor(source: SourceId) {
    return this.opts.encounter.mutatedEvidence.filter((z) => z.source === source);
  }

  private renderChart(x: number, y: number, w: number, h: number): void {
    const { palette: p, scenario, structure } = this.opts;
    const enc = this.opts.encounter;
    const head = this.scene.add.text(
      x,
      y,
      `${enc.ticker} · ${enc.timeframe}`,
      TX.num(p, { color: p.sub }),
    );
    this.body.add(head);

    const zones = this.zonesFor('chart');
    const listH = zones.length * (HIT.min + SP.sm);
    const hintText = this.crutchText();
    // При длинном вопросе окно становится ниже. Сначала сохраняем график и
    // интерактивные улики; поясняющую строку убираем, если она начнёт
    // пересекаться с нижней кнопкой «Развернуть».
    const hintH = hintText && h >= listH + SP.xl + 90 + SP.xs + SP.xl ? SP.xl : 0;
    const chartH = Math.max(64, h - listH - SP.xl - SP.xs - hintH);

    this.chart = new CandleChart(this.scene, {
      x,
      y: y + SP.xl,
      width: w,
      height: chartH,
      palette: p,
      highlightEvidence: structure.evidenceHighlight,
      parent: this.body,
      onEvidenceTap: (id) => this.opts.onEvidenceToggle(id),
    });
    this.chart.setData(scenario.candles, this.selected);

    // Ярлык-костыль эпохи
    const labelY = y + SP.xl + chartH + SP.xs;
    if (hintText && hintH > 0) {
      this.body.add(
        this.scene.add.text(x, labelY, hintText.text, TX.caption(p, { color: hintText.color, wrap: w })),
      );
    }

    this.renderZoneList(x, labelY + hintH, w, zones);
  }

  private crutchText(): { text: string; color: string } | null {
    const { palette: p, structure } = this.opts;
    switch (structure.labels) {
      case 'all':
        return { text: 'Подсказка: объём на выделенной свече заметно ниже обычного', color: p.warn };
      case 'partial':
        return { text: 'Сравни объём выделенной свечи с соседними', color: p.muted };
      case 'false':
        return { text: 'Метка источника: «объём подтверждён» — проверь сам', color: p.bad };
      default:
        return { text: T.arena.rawData, color: p.muted };
    }
  }

  private renderZoneList(x: number, y: number, w: number, zones: { id: string; label: string; isCorrect: boolean }[]): void {
    const { palette: p, structure } = this.opts;
    zones.forEach((z, i) => {
      const zy = y + i * (HIT.min + SP.sm);
      const row = selectableRow(
        this.scene,
        x,
        zy,
        w,
        z.label,
        p,
        this.selected.has(z.id),
        () => this.opts.onEvidenceToggle(z.id),
        structure.evidenceHighlight && z.isCorrect
          ? { badge: 'важно', badgeColor: p.warn }
          : {},
      );
      this.body.add(row);
    });
  }

  private renderNews(x: number, y: number, w: number, h: number): void {
    const { palette: p, scenario, structure } = this.opts;
    this.body.add(
      this.scene.add.text(x, y, 'Проверяй, кто это написал', TX.caption(p, { color: p.sub })),
    );
    const itemH = 64;
    scenario.news.forEach((n, i) => {
      const ny = y + SP.xl + i * (itemH + SP.sm);
      const evId = n.evidenceId;
      const picked = evId ? this.selected.has(evId) : false;
      const g = this.scene.add.graphics();
      g.fillStyle(picked ? p.hoverN : p.surfaceN, 1);
      g.fillRoundedRect(x, ny, w, itemH, RADIUS.sm);
      g.lineStyle(picked ? 2 : 1, picked ? p.accentN : p.borderN, 1);
      g.strokeRoundedRect(x, ny, w, itemH, RADIUS.sm);
      this.body.add(g);

      const title = this.scene.add.text(
        x + SP.md,
        ny + SP.sm,
        n.headline,
        TX.body(p, { color: p.text, wrap: w - SP.md * 2 - 60 }),
      );
      this.body.add(title);
      this.body.add(
        this.scene.add.text(
          x + SP.md,
          ny + itemH - 22,
          `${n.source} · ${n.time}`,
          TX.caption(p, { color: p.muted }),
        ),
      );

      // Ярлык достоверности — костыль ранних эпох
      if (structure.labels === 'all') {
        this.body.add(
          this.scene.add
            .text(
              x + w - SP.md,
              ny + SP.sm,
              n.credible ? 'проверено' : 'слухи',
              TX.caption(p, { color: n.credible ? p.good : p.bad }),
            )
            .setOrigin(1, 0),
        );
      } else if (structure.labels === 'false' && !n.credible) {
        this.body.add(
          this.scene.add
            .text(x + w - SP.md, ny + SP.sm, 'проверено', TX.caption(p, { color: p.good }))
            .setOrigin(1, 0),
        );
      }

      if (evId) {
        // Graphics не имеет своей hit-области — касание ловит прозрачная зона
        const zone = this.scene.add.rectangle(x, ny, w, itemH, 0x000000, 0).setOrigin(0).setInteractive();
        zone.on('pointerdown', () => {
          haptic('light');
          playSfx('tap');
          this.opts.onEvidenceToggle(evId);
        });
        this.body.add(zone);
      }
    });
    void h;
  }

  private renderPosition(x: number, y: number, w: number, h: number): void {
    const { palette: p, scenario } = this.opts;
    const d = scenario.position;
    const box = panel(this.scene, x, y, w, 96, p, { fill: p.surfaceN });
    this.body.add(box);

    const rows: [string, string, string?][] = [
      ['Депозит', `${d.deposit}`, p.text],
      ['Риск на сделку', `${d.riskAmount} (${d.riskPct}%)`, p.text],
      ['Стоп', `${d.stopPct}%`, p.text],
      ['Плечо', `${d.leverage}x`, d.leverage >= 5 ? p.warn : p.text],
    ];
    rows.forEach((r, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const rx = x + SP.md + col * (w / 2 - SP.sm);
      const ry = y + SP.md + row * 40;
      this.body.add(this.scene.add.text(rx, ry, r[0], TX.caption(p)));
      this.body.add(this.scene.add.text(rx, ry + 16, r[1], TX.num(p, { color: r[2] })));
    });

    const noteY = y + 96 + SP.sm;
    this.body.add(
      this.scene.add.text(
        x,
        noteY,
        `Журнал: ${d.journalNote}`,
        TX.caption(p, { color: p.bad, wrap: w }),
      ),
    );
    this.renderZoneList(x, noteY + SP.xl, w, this.zonesFor('position'));
    void h;
  }

  private renderOrderbook(x: number, y: number, w: number, h: number): void {
    const { palette: p, scenario } = this.opts;
    const d = scenario.orderbook;
    const colW = (w - SP.md) / 2;

    this.body.add(this.scene.add.text(x, y, 'Покупка', TX.caption(p, { color: p.good })));
    d.bids.forEach((b, i) => {
      this.body.add(
        this.scene.add.text(x, y + SP.xl + i * 20, `${b.price}   ${b.size}`, TX.num(p, { color: p.sub })),
      );
    });
    this.body.add(
      this.scene.add.text(x + colW + SP.md, y, 'Продажа', TX.caption(p, { color: p.bad })),
    );
    d.asks.forEach((a, i) => {
      this.body.add(
        this.scene.add.text(
          x + colW + SP.md,
          y + SP.xl + i * 20,
          `${a.price}   ${a.size}`,
          TX.num(p, { color: p.sub }),
        ),
      );
    });

    const infoY = y + SP.xl + 3 * 20 + SP.md;
    this.body.add(this.scene.add.text(x, infoY, d.wall, TX.caption(p, { color: p.warn, wrap: w })));
    this.body.add(
      this.scene.add.text(
        x,
        infoY + 18,
        `Фандинг ${d.funding} · открытый интерес ${d.openInterest}`,
        TX.caption(p, { color: p.muted, wrap: w }),
      ),
    );
    this.renderZoneList(x, infoY + 44, w, this.zonesFor('orderbook'));
    void h;
  }

  private renderGeneric(x: number, y: number, w: number, h: number): void {
    const { palette: p } = this.opts;
    this.body.add(
      this.scene.add.text(x, y, SOURCE_TITLES[this.active], TX.body(p, { color: p.sub })),
    );
    this.body.add(
      this.scene.add.text(x, y + SP.xl, T.arena.rawData, TX.caption(p, { wrap: w })),
    );
    this.renderZoneList(x, y + SP.xl + 24, w, this.zonesFor(this.active));
    void h;
  }

  destroy(): void {
    this.chart?.destroy();
    this.root.destroy();
  }
}
