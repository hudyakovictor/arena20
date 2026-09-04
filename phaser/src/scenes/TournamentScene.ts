import Phaser from 'phaser';
import { gameState } from '../state/GameState';
import { epochOf } from '../config/epochConfig';
import { renderTopBar, renderBottomNav, navForEpoch } from '../engine/shell';

const W = 390, H = 844;

// Турниры — асинхронные, тень игрока выше по рейтингу на тех же seed (M14).
export class TournamentScene extends Phaser.Scene {
  constructor(){ super({ key:'TournamentScene' }); }
  create(){
    const p = gameState.progress;
    const ep = epochOf(p.level);
    this.cameras.main.setBackgroundColor(ep.tokens.bg as any);
    renderTopBar(this, gameState);
    this.add.text(14, 68, 'ТУРНИРЫ', { fontFamily:'Inter, system-ui, sans-serif', fontSize:'20px', color:'#E9F2FF' });
    this.add.text(14, 92, 'асинхронные · одинаковый seed-набор · без влияния покупок', { fontFamily:'IBM Plex Mono, monospace', fontSize:'8px', color:'#B783FF' });

    this.add.rectangle(14, 116, 362, 84, 0x0C1323).setStrokeStyle(1, 0xB783FF).setOrigin(0);
    this.add.text(24, 128, 'БЛИЖАЙШЕЕ ОКНО', { fontFamily:'IBM Plex Mono, monospace', fontSize:'8px', color:'#62708A' });
    this.add.text(24, 148, 'НЕДЕЛЯ ТРЕЙДЕРА · 5 задач на 5 картах', { fontFamily:'Inter, sans-serif', fontSize:'13px', color:'#E9F2FF' });
    this.add.text(24, 172, 'старт через 2 дня · ранняя регистрация', { fontFamily:'IBM Plex Mono, monospace', fontSize:'8px', color:'#93A3BC' });

    // тень
    this.add.text(14, 220, 'ТЕНЬ АРЕНЫ (M14)', { fontFamily:'IBM Plex Mono, monospace', fontSize:'9px', color:'#31D6C4' });
    this.add.rectangle(14, 240, 362, 70, 0x0C1323).setStrokeStyle(1, 0x22304A).setOrigin(0);
    this.add.text(24, 252, 'На тех же seed-ах, что и предыдущий этап,\nсравнишь ход с «тенью» игрока выше по рейтингу.', { fontFamily:'IBM Plex Mono, monospace', fontSize:'9px', color:'#93A3BC', wordWrap:{width:330} });
    this.add.text(24, 288, 'Показывается только после ответа — не раскрывает решение.', { fontFamily:'IBM Plex Mono, monospace', fontSize:'8px', color:'#62708A' });

    this.add.rectangle(14, 340, 362, 44, 0x31D6C4).setOrigin(0).setInteractive().on('pointerdown', ()=>{
      this.add.text(195, 400, 'Турниры открываются с эпохи II (Кабинет).\nСейчас — практика ядра.', { fontFamily:'IBM Plex Mono, monospace', fontSize:'10px', color:'#FFB341', align:'center', wordWrap:{width:320} }).setOrigin(0.5,0);
    });
    this.add.text(195, 362, 'РЕГИСТРАЦИЯ (ДЕМО)', { fontFamily:'Inter, sans-serif', fontSize:'12px', color:'#03110f' }).setOrigin(0.5);
    renderBottomNav(this, 'MoreScene', navForEpoch(p.level));
  }
}
