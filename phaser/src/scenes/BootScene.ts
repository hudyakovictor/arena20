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
  private loadingText!: Phaser.GameObjects.Text;
  constructor(){ super({ key: 'BootScene' }); }

  preload(): void {
    // Показываем прогресс загрузки — чтобы не было ощущения "внутри ничего нет"
    this.cameras.main.setBackgroundColor('#070B14');
    this.loadingText = this.add.text(195, 420, 'ЗАГРУЗКА 0%', {
      fontFamily: 'IBM Plex Mono, monospace',
      fontSize: '12px',
      color: '#c8ff00'
    }).setOrigin(0.5);

    const barBg = this.add.rectangle(45, 440, 300, 6, 0x16181d).setOrigin(0,0.5).setStrokeStyle(1, 0x33383f);
    const bar = this.add.rectangle(45, 440, 1, 6, 0xc8ff00).setOrigin(0,0.5);

    this.load.on('progress', (p:number)=>{
      const pct = Math.round(p*100);
      if (this.loadingText) this.loadingText.setText(`ЗАГРУЗКА ${pct}%`);
      bar.width = 300 * p;
    });
    this.load.on('loaderror', (file:any)=>{
      console.warn('[Boot] load error', file?.key, file?.src);
    });
    this.load.on('complete', ()=>{
      console.log('[Boot] preload complete');
    });

    // ── Заглушки-рендеры врагов (SVG как база → текстура Phaser) ──
    try {
      for (const e of enemies) {
        for (const s of e.stages) {
          this.load.svg(enemyRenderKey(e.id, s.stage), enemyRenderUrl(e.id, s.stage), { width: 512, height: 512 });
        }
        this.load.svg(enemyAvatarKey(e.id), enemyAvatarUrl(e.id), { width: 400, height: 400 });
        this.load.svg(enemyIconKey(e.id), enemyIconUrl(e.id), { width: 96, height: 96 });
      }
      for (const c of cards) {
        this.load.svg(cardKey(c.id), cardUrl(c.id), { width: 220, height: 320 });
      }
      this.load.svg(cardKey('Cwait'), cardUrl('Cwait'), { width: 220, height: 320 });
      for (const m of MENU_ICONS) {
        this.load.svg(iconKey(m.id), iconUrl(m.id), { width: 24, height: 24 });
      }
      this.load.image('bg-wall', 'assets/bg-wall.jpg');
    } catch (e) {
      console.error('[Boot] preload setup failed', e);
    }
  }

  create(): void {
    try {
      const p = gameState.progress;
      this.registry.set('level', p.level);
      this.registry.set('xp', p.xp);
      this.registry.set('xpMax', p.xpMax);
      this.registry.set('coins', p.coins);
      this.registry.set('riskBudget', p.riskBudget);
      this.registry.set('epoch', p.epoch);

      const ep = epochOf(p.level);
      this.cameras.main.setBackgroundColor(ep.tokens.bg as any);

      // Скрываем fallback из index.html сразу
      const fb = document.getElementById('fallback');
      if (fb) fb.style.display='none';

      // Никаких промежуточных экранов — сразу в Арену (юзер: "его не должно было быть")
      try { gameState.setFlag('onboarding_done', true); } catch {}
      console.log('[Boot] instant -> ArenaScene');
      this.scene.start('ArenaScene');

    } catch (e:any) {
      console.error('[Boot] create failed', e);
      this.cameras.main.setBackgroundColor('#330000');
      this.add.text(195, 400, 'BOOT ERROR: ' + (e?.message||e), {
        fontFamily:'monospace',
        fontSize:'12px',
        color:'#ffffff',
        wordWrap:{width:340},
        align:'center'
      }).setOrigin(0.5);
    }
  }
}
