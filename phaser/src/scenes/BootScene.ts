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

      // Фон — если текстура есть, показываем, если нет — просто цвет
      if (this.textures.exists('bg-wall')) {
        this.add.image(0, 0, 'bg-wall').setOrigin(0).setDisplaySize(390, 844).setAlpha(0.5);
        this.add.rectangle(0, 0, 390, 844, 0x000000, 0.55).setOrigin(0);
      } else {
        // fallback градиент из прямоугольников
        this.add.rectangle(0,0,390,844,0x0a0b0d).setOrigin(0);
        this.add.rectangle(0,0,390,400,0x16181d,0.5).setOrigin(0);
        console.warn('[Boot] bg-wall missing, using fallback');
      }

      // Заголовок — всегда виден, даже если ассеты не загрузились
      this.add.rectangle(20, 300, 350, 120, 0x16181d, 0.9).setStrokeStyle(1, 0xc8ff00).setOrigin(0);
      this.add.text(195, 330, 'SIGNAL ARENA', {
        fontFamily:'Oswald, Inter, sans-serif',
        fontSize:'28px',
        color:'#c8ff00',
        fontStyle:'normal'
      }).setOrigin(0.5);
      this.add.text(195, 360, `${ep.name} · УРОВЕНЬ ${p.level}`, {
        fontFamily:'IBM Plex Mono, monospace',
        fontSize:'10px',
        color: ep.tokens.accent
      }).setOrigin(0.5);
      this.add.text(195, 380, ep.motto, {
        fontFamily:'Inter, sans-serif',
        fontSize:'9px',
        color:'#93A3BC',
        align:'center',
        wordWrap:{width:300}
      }).setOrigin(0.5);
      this.add.text(195, 520, 'КОШЕЛЁК — НЕ ТЕРМИНАЛ. ТЕРМИНАЛ — НЕ КАЗИНО.', {
        fontFamily:'IBM Plex Mono, monospace',
        fontSize:'8px',
        color:'#62708A'
      }).setOrigin(0.5);

      // Инфо о загрузке
      const loadedCount = this.textures.list ? Object.keys(this.textures.list).length : 0;
      this.add.text(195, 470, `ассетов: ${loadedCount} · кликни чтобы продолжить`, {
        fontFamily:'IBM Plex Mono, monospace',
        fontSize:'8px',
        color:'#62708A'
      }).setOrigin(0.5);

      // Кнопка продолжить — на случай если автовход не сработает
      const btn = this.add.rectangle(45, 540, 300, 44, 0xc8ff00).setOrigin(0).setInteractive();
      this.add.text(195, 562, 'ВОЙТИ В АРЕНУ', {
        fontFamily:'Inter, sans-serif',
        fontSize:'14px',
        color:'#0a0b0d'
      }).setOrigin(0.5);

      const goNext = () => {
        try {
          const firstRun = gameState.getFlag('onboarding_done') ? false : true;
          console.log('[Boot] goNext firstRun=', firstRun);
          this.scene.start(firstRun ? 'OnboardingScene' : 'ArenaScene');
        } catch (e) {
          console.error('[Boot] scene start failed', e);
          this.add.text(195, 600, 'ОШИБКА: ' + (e as any)?.message, {
            fontFamily:'monospace',
            fontSize:'10px',
            color:'#ff4d5e',
            wordWrap:{width:320}
          }).setOrigin(0.5);
        }
      };

      btn.on('pointerdown', goNext);
      this.time.delayedCall(900, goNext);

      // Скрываем fallback из index.html
      const fb = document.getElementById('fallback');
      if (fb) fb.style.display='none';
      const dbg = document.getElementById('debug');
      if (dbg) dbg.textContent += '\n[Boot] create OK, textures=' + loadedCount;

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
      const dbg = document.getElementById('debug');
      if (dbg) {
        dbg.style.display='block';
        dbg.textContent += '\n[Boot] FATAL: ' + (e?.message||e) + '\n' + (e?.stack||'');
      }
    }
  }
}
