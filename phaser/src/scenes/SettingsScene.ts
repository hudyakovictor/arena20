import Phaser from 'phaser';
import { gameState } from '../state/GameState';
import { epochOf } from '../config/epochConfig';
import { renderTopBar, renderBottomNav, navForEpoch } from '../engine/shell';

const W = 390, H = 844;

// Настройки + сброс демо-прогресса (первый вход / реиграбельность).
export class SettingsScene extends Phaser.Scene {
  private soundOn = true;
  private reducedMotion = false;
  constructor(){ super({ key:'SettingsScene' }); }
  create(){
    const p = gameState.progress;
    const ep = epochOf(p.level);
    this.cameras.main.setBackgroundColor(ep.tokens.bg as any);
    renderTopBar(this, gameState);
    this.add.text(14, 68, 'НАСТРОЙКИ', { fontFamily:'Inter, system-ui, sans-serif', fontSize:'20px', color:'#E9F2FF' });

    const rows = [
      { label:'ЗВУК', get:()=>this.soundOn, toggle:()=>{ this.soundOn=!this.soundOn; this.scene.restart(); } },
      { label:'REDUCED MOTION (обяз. для UI)', get:()=>this.reducedMotion, toggle:()=>{ this.reducedMotion=!this.reducedMotion; this.scene.restart(); } },
    ];
    rows.forEach((r,i)=>{
      const y=120+i*56;
      this.add.rectangle(14,y,362,48, 0x0C1323).setStrokeStyle(1, 0x22304A).setOrigin(0).setInteractive().on('pointerdown', r.toggle);
      this.add.text(28,y+16, r.label, { fontFamily:'IBM Plex Mono, monospace', fontSize:'10px', color:'#E9F2FF' });
      const on=r.get();
      this.add.rectangle(300,y+14,60,20, on?0x31D6C4:0x22304A).setOrigin(0);
      this.add.circle(330, y+24, 9, on?0x070B14:0x46536A).setOrigin(0.5);
      this.add.text(372,y+24, on?'ВКЛ':'ВЫКЛ', { fontFamily:'IBM Plex Mono, monospace', fontSize:'7px', color: on?'#31D6C4':'#62708A' }).setOrigin(0.5);
    });

    // профиль-данные
    this.add.text(14, 250, 'ДАННЫЕ ПРОФИЛЯ (демо)', { fontFamily:'IBM Plex Mono, monospace', fontSize:'9px', color:'#93A3BC' });
    this.add.text(14, 272, `уровень ${p.level} · XP ${p.xp}/${p.xpMax} · SIG ${p.coins}`, { fontFamily:'IBM Plex Mono, monospace', fontSize:'9px', color:'#E9F2FF' });
    this.add.text(14, 292, `бюджет ${p.riskBudget}/${p.maxBudget} · стрик ×${p.streak} · эпоха ${p.epoch}`, { fontFamily:'IBM Plex Mono, monospace', fontSize:'9px', color:'#62708A' });

    // сброс
    this.add.rectangle(14, 340, 362, 48, 0x1A1226).setStrokeStyle(1, 0xFF596D).setOrigin(0).setInteractive().on('pointerdown', ()=>{
      gameState.resetAll();
      this.scene.start('OnboardingScene');
    });
    this.add.text(195, 364, 'СБРОСИТЬ ПРОГРЕСС + ПЕРВЫЙ ВХОД', { fontFamily:'IBM Plex Mono, monospace', fontSize:'10px', color:'#FF596D' }).setOrigin(0.5);
    this.add.text(14, 400, 'Сброс вернёт к первому входу и покажет полный юзерфлоу.', { fontFamily:'IBM Plex Mono, monospace', fontSize:'7px', color:'#62708A' });
    renderBottomNav(this, 'MoreScene', navForEpoch(p.level));
  }
}
