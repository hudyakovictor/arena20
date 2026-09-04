import Phaser from 'phaser';
import { gameState } from '../state/GameState';
import { epochOf } from '../config/epochConfig';
import { enemies } from '../data/enemies';
import { cards } from '../data/cards';
import {
  enemyAvatarKey, enemyAvatarUrl, enemyIconKey, enemyIconUrl,
  enemyRenderKey, enemyRenderUrl, cardKey, cardUrl, iconKey, iconUrl,
  MENU_ICONS
} from '../engine/assetKeys';

export class BootScene extends Phaser.Scene {
  constructor(){ super({ key: 'BootScene' }); }

  preload(): void {
    // ── Заглушки-рендеры врагов (SVG как база → текстура Phaser) ──
    // Прототип грузит все 33 врага + стадии + аватары + иконки сразу (сущности всегда собраны).
    for (const e of enemies) {
      const n = e.id.replace('E', '');
      // мастер рендера по стадиям
      for (const s of e.stages) {
        this.load.svg(enemyRenderKey(e.id, s.stage), enemyRenderUrl(e.id, s.stage), { width: 512, height: 512 });
      }
      // аватар (круглый кроп 400) + icon (моно-силуэт 96)
      this.load.svg(enemyAvatarKey(e.id), enemyAvatarUrl(e.id), { width: 400, height: 400 });
      this.load.svg(enemyIconKey(e.id), enemyIconUrl(e.id), { width: 96, height: 96 });
    }
    // ── Карты навыков ──
    for (const c of cards) {
      this.load.svg(cardKey(c.id), cardUrl(c.id), { width: 220, height: 320 });
    }
    // карта ЖДАТЬ (M10)
    this.load.svg(cardKey('Cwait'), cardUrl('Cwait'), { width: 220, height: 320 });
    // ── Иконки меню / доменов ──
    for (const m of MENU_ICONS) {
      this.load.svg(iconKey(m.id), iconUrl(m.id), { width: 24, height: 24 });
    }
  }

  create(): void {
    const p = gameState.progress;
    // реестр в Phaser registry для совместимости со старым прототипом + новый стейт
    this.registry.set('level', p.level);
    this.registry.set('xp', p.xp);
    this.registry.set('xpMax', p.xpMax);
    this.registry.set('coins', p.coins);
    this.registry.set('riskBudget', p.riskBudget);
    this.registry.set('epoch', p.epoch);

    // короткая заставка эпохи — токены меняются без новой сцены (ТЗ Часть 2 §4)
    const ep = epochOf(p.level);
    this.cameras.main.setBackgroundColor(ep.tokens.bg);
    const title = this.add.text(195, 340, 'SIGNAL ARENA', { fontFamily:'Inter, system-ui, sans-serif', fontSize:'22px', color:'#E9F2FF', fontStyle:'italic' }).setOrigin(0.5);
    const sub = this.add.text(195, 372, `${ep.name} · УРОВЕНЬ ${p.level}`, { fontFamily:'IBM Plex Mono, monospace', fontSize:'10px', color:ep.tokens.accent }).setOrigin(0.5);
    const motto = this.add.text(195, 400, ep.motto, { fontFamily:'Inter, sans-serif', fontSize:'10px', color:'#93A3BC', align:'center', wordWrap:{width:300}}).setOrigin(0.5);
    this.add.text(195, 520, 'КОШЕЛЁК — НЕ ТЕРМИНАЛ. ТЕРМИНАЛ — НЕ КАЗИНО.', { fontFamily:'IBM Plex Mono, monospace', fontSize:'8px', color:'#62708A'}).setOrigin(0.5);

    // Первый вход → онбординг, иначе сразу Арена (полный юзерфлоу)
    const firstRun = gameState.getFlag('onboarding_done') ? false : true;
    this.time.delayedCall(900, ()=> this.scene.start(firstRun ? 'OnboardingScene' : 'ArenaScene'));
  }
}
