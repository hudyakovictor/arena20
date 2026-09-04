import Phaser from 'phaser';
import { gameState } from '../state/GameState';
import { epochOf } from '../config/epochConfig';
import { renderTopBar, renderBottomNav, navForEpoch } from '../engine/shell';
import { iconKey } from '../engine/assetKeys';

const W = 390, H = 844;

// Маркет косметики — SIG только на косметику, никакого влияния на данные/карты/ответы (ТЗ Часть 3 §4).
export class StoreScene extends Phaser.Scene {
  constructor(){ super({ key:'StoreScene' }); }
  create(){
    const p = gameState.progress;
    const ep = epochOf(p.level);
    this.cameras.main.setBackgroundColor(ep.tokens.bg as any);
    renderTopBar(this, gameState);
    this.add.text(14, 68, 'МАРКЕТ КОСМЕТИКИ', { fontFamily:'Inter, system-ui, sans-serif', fontSize:'20px', color:'#E9F2FF' });
    this.add.text(14, 92, 'SIG тратится только на скины интерфейса, карт, трофеев и эффектов', { fontFamily:'IBM Plex Mono, monospace', fontSize:'8px', color:'#FFB341' });

    const items = [
      { name:'Скин «Циан-неон»', kind:'интерфейс', price:800, icon:'nav-arena' },
      { name:'Карта «Стеклянный тренд»', kind:'карта', price:500, icon:'nav-collection' },
      { name:'Трофей «Обсидиан»', kind:'трофей', price:1200, icon:'nav-arena' },
      { name:'Эффект «Эмбер»', kind:'обратная связь', price:300, icon:'nav-more' },
    ];
    items.forEach((it,i)=>{
      const y = 120 + i*86;
      this.add.rectangle(14, y, 362, 78, 0x0C1323).setStrokeStyle(1, 0x22304A).setOrigin(0).setInteractive()
        .on('pointerdown', ()=> this.buy(it.name));
      const k = iconKey(it.icon);
      if(this.textures.exists(k)) this.add.image(44, y+39, k).setTint(0x31D6C4).setScale(2);
      this.add.text(78, y+12, it.name, { fontFamily:'Inter, sans-serif', fontSize:'12px', color:'#E9F2FF' });
      this.add.text(78, y+36, it.kind, { fontFamily:'IBM Plex Mono, monospace', fontSize:'8px', color:'#62708A' });
      this.add.text(78, y+52, `${it.price} SIG`, { fontFamily:'IBM Plex Mono, monospace', fontSize:'9px', color:'#31D6C4' });
      this.add.text(344, y+39, 'КУПИТЬ', { fontFamily:'IBM Plex Mono, monospace', fontSize:'8px', color:'#3BDE8A' }).setOrigin(0.5);
    });
    this.add.text(14, 476, 'Только косметика. Ничто из магазина не меняет данные, карты, ответы или бюджет.', { fontFamily:'IBM Plex Mono, monospace', fontSize:'7px', color:'#62708A', wordWrap:{width:340} });
    renderBottomNav(this, 'MoreScene', navForEpoch(p.level));
  }
  private buy(name:string){
    const p = gameState.progress;
    if(p.coins < 100){ this.cameras.main.flash(100,255,89,109); this.add.text(195, 520, 'недостаточно SIG — заработай в Арене', { fontFamily:'IBM Plex Mono, monospace', fontSize:'9px', color:'#FF596D' }).setOrigin(0.5); return; }
    p.coins -= 100; gameState.save();
    this.add.text(195, 520, `✓ «${name}» — применено (демо-списание 100 SIG)`, { fontFamily:'IBM Plex Mono, monospace', fontSize:'9px', color:'#3BDE8A' }).setOrigin(0.5);
  }
}
