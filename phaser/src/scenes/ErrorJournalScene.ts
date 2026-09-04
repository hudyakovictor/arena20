import Phaser from 'phaser';
import { gameState } from '../state/GameState';
import { epochOf } from '../config/epochConfig';
import { renderTopBar, renderBottomNav, navForEpoch } from '../engine/shell';
import { enemyById } from '../data/enemies';
import { cardById } from '../data/cards';

const W = 390, H = 844;

// Свиток ошибок (M7) — приоритет разминки, записи «враг + атом + упущенная улика».
export class ErrorJournalScene extends Phaser.Scene {
  constructor(){ super({ key:'ErrorJournalScene' }); }
  create(){
    const p = gameState.progress;
    const ep = epochOf(p.level);
    this.cameras.main.setBackgroundColor(ep.tokens.bg as any);
    renderTopBar(this, gameState);
    this.add.text(14, 68, 'СВИТОК ОШИБОК', { fontFamily:'Inter, system-ui, sans-serif', fontSize:'20px', color:'#E9F2FF' });
    this.add.text(14, 92, 'повторяем личные ошибки, а не всё подряд · M7', { fontFamily:'IBM Plex Mono, monospace', fontSize:'8px', color:'#FFB341' });

    if(p.errorScroll.length===0){
      this.add.text(W/2, 240, 'Пока пусто.', { fontFamily:'Inter, sans-serif', fontSize:'16px', color:'#E9F2FF' }).setOrigin(0.5);
      this.add.text(W/2, 270, 'Ошибайся в Арене — запись появится здесь\nи будет приоритетом в разминке (мутированной и сложнее).', { fontFamily:'IBM Plex Mono, monospace', fontSize:'9px', color:'#62708A', align:'center', wordWrap:{width:320} }).setOrigin(0.5,0);
    } else {
      p.errorScroll.slice(0, 12).forEach((e,i)=>{
        const y = 130 + i*46;
        if(y > 730) return;
        const enemy = enemyById[e.enemy];
        const card = e.atom.split('.')[0] ? cardById[e.atom.split('.')[0]] : undefined;
        const isOpen = !e.closed;
        this.add.rectangle(14, y, 362, 40, isOpen ? 0x0C1323 : 0x060A12).setStrokeStyle(1, isOpen ? 0xFF596D : 0x22304A).setOrigin(0).setInteractive()
          .on('pointerdown', ()=> this.openEntry(e.id, y));
        const stageNum = (enemy?.stages && enemy.stages.find(s=>s.level<=p.level)?.stage) as number|undefined;
        this.add.text(24, y+7, `${enemy?.name ?? e.enemy} · ${enemy?.id ?? ''} · ${card?.short ?? e.atom}`, { fontFamily:'IBM Plex Mono, monospace', fontSize:'9px', color: isOpen?'#E9F2FF':'#62708A', wordWrap:{width:250} });
        this.add.text(24, y+24, `улика: ${e.missedEvidence.slice(0,30)||'нет'} · S${stageNum!=null?stageNum:'?'}`, { fontFamily:'IBM Plex Mono, monospace', fontSize:'7px', color: isOpen?'#FF596D':'#62708A', wordWrap:{width:260} });
        this.add.text(344, y+14, isOpen?'OPEN':'CLOSED', { fontFamily:'IBM Plex Mono, monospace', fontSize:'7px', color: isOpen?'#FFB341':'#62708A' }).setOrigin(0.5);
      });
      this.add.text(14, 748, 'закрытые записи сгорают — повтор уже был', { fontFamily:'IBM Plex Mono, monospace', fontSize:'8px', color:'#62708A' });
    }
    renderBottomNav(this, 'MoreScene', navForEpoch(p.level));
  }
  private openEntry(id:string, y:number){
    const e = gameState.progress.errorScroll.find(x=>x.id===id);
    if(!e) return;
    const overlay=this.add.rectangle(0,0,W,H, 0x070B14, 0.94).setOrigin(0).setInteractive();
    this.add.text(20, 180, 'FIX MISSION', { fontFamily:'IBM Plex Mono, monospace', fontSize:'10px', color:'#FFB341' });
    this.add.rectangle(20, 200, 350, 44, 0x0C1323).setStrokeStyle(1, 0xFF596D).setOrigin(0);
    this.add.text(28, 212, `${enemyById[e.enemy]?.name ?? e.enemy}: ${e.missedEvidence||'нет улики'}`, { fontFamily:'Inter, sans-serif', fontSize:'11px', color:'#E9F2FF', wordWrap:{width:330} });
    const rootCard = cardById[e.atom.split('.')[0]];
    this.add.text(20, 260, 'КОРЕНЬ: ' + (rootCard ? rootCard.name : e.atom), { fontFamily:'IBM Plex Mono, monospace', fontSize:'9px', color:'#93A3BC' });
    this.add.text(20, 282, 'КОНТР-КАРТЫ: ' + (rootCard ? `${rootCard.id} + ${rootCard.short}` : '—'), { fontFamily:'IBM Plex Mono, monospace', fontSize:'9px', color:'#31D6C4' });
    this.add.text(20, 320, 'Разминка будет мутирована и на ступень сложнее.\nЗакрыть запись можно, только верно решив её в разминке.', { fontFamily:'IBM Plex Mono, monospace', fontSize:'9px', color:'#62708A', wordWrap:{width:340} });
    this.add.rectangle(20, 400, 350, 44, 0x31D6C4).setOrigin(0).setInteractive().on('pointerdown', ()=> overlay.destroy());
    this.add.text(195, 422, 'ЗАКРЫТЬ', { fontFamily:'Inter, sans-serif', fontSize:'12px', color:'#03110f' }).setOrigin(0.5);
  }
}
