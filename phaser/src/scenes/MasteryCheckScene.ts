import Phaser from 'phaser';
import { gameState } from '../state/GameState';
import { epochOf } from '../config/epochConfig';
import { renderTopBar, renderBottomNav, navForEpoch } from '../engine/shell';
import { cards, cardById } from '../data/cards';
import { enemies } from '../data/enemies';

const W = 390, H = 844;

// Мастер-чек — готовность к экзамену главы (ТЗ Component Contract: ChapterGate/MasteryCheck)
export class MasteryCheckScene extends Phaser.Scene {
  constructor(){ super({ key:'MasteryCheckScene' }); }
  create(){
    const p = gameState.progress;
    const ep = epochOf(p.level);
    this.cameras.main.setBackgroundColor(ep.tokens.bg as any);
    renderTopBar(this, gameState);
    this.add.text(14, 68, 'МАСТЕР-ЧЕК', { fontFamily:'Inter, system-ui, sans-serif', fontSize:'20px', color:'#E9F2FF' });
    this.add.text(14, 92, 'готовность к экзамену текущей главы', { fontFamily:'IBM Plex Mono, monospace', fontSize:'8px', color:'#93A3BC' });

    // текущая глава
    const cur = cards.find(c=> gameState.isCardUnlocked(c.id) && (p.cardRanks[c.id]??0)<3) ?? cards[0];
    this.add.rectangle(14, 120, 362, 66, 0x0C1323).setStrokeStyle(1, 0x31D6C4).setOrigin(0);
    this.add.text(28, 132, `ГЛАВА ${cur.cid} · ${cur.name}`, { fontFamily:'Inter, sans-serif', fontSize:'13px', color:'#E9F2FF' });
    this.add.text(28, 156, `карта ${cur.id} · ранг ${p.cardRanks[cur.id]??1}/3 · пороги ${cur.rankThresholds.join('/')} атомов`, { fontFamily:'IBM Plex Mono, monospace', fontSize:'8px', color:'#31D6C4' });

    // чего не хватает — карты против врагов
    this.add.text(14, 204, 'ЧЕГО НЕ ХВАТАЕТ', { fontFamily:'IBM Plex Mono, monospace', fontSize:'9px', color:'#FFB341' });
    const reqCards = new Set<string>();
    for(const e of enemies) for(const s of e.stages) for(const r of s.requiredCards) reqCards.add(r.cardId);
    const pending = cards.filter(c=> !gameState.isCardUnlocked(c.id));
    pending.slice(0,6).forEach((c,i)=>{
      const y=220+i*40;
      this.add.rectangle(14, y, 362, 34, 0x060A12).setStrokeStyle(1, 0x22304A).setOrigin(0);
      this.add.text(24, y+11, `${c.id} · ${c.name} · откроется L${c.unlockLevel}`, { fontFamily:'IBM Plex Mono, monospace', fontSize:'9px', color:'#62708A' });
    });
    if(pending.length===0){
      this.add.text(24, 220, 'все карты открыты — проверяй комбинации', { fontFamily:'IBM Plex Mono, monospace', fontSize:'10px', color:'#3BDE8A' });
    }

    // экзамен-превью врага
    this.add.text(14, 470, 'ЭКЗАМЕН-ПРЕВЬЮ (тизер-силуэт)', { fontFamily:'IBM Plex Mono, monospace', fontSize:'9px', color:'#93A3BC' });
    const exam = enemies.find(e=> e.domain===cur.domain) ?? enemies[0];
    const av = `enemy_${exam.id.replace('E','')}_avatar`;
    if(this.textures.exists(av)) this.add.image(48, 520, av).setDisplaySize(56,56);
    this.add.text(84, 496, 'ТРЕБУЕТСЯ КАРТА: '+cur.id, { fontFamily:'IBM Plex Mono, monospace', fontSize:'9px', color:'#E9F2FF' });
    this.add.text(84, 516, 'Враг раскроется только после победы.', { fontFamily:'IBM Plex Mono, monospace', fontSize:'8px', color:'#62708A' });

    this.add.rectangle(14, 560, 362, 44, 0x31D6C4).setOrigin(0).setInteractive().on('pointerdown', ()=>{
      this.add.text(195, 620, 'Экзамен — это задание Арены с полным раскрытием.\nПрактика → Мастер-чек.', { fontFamily:'IBM Plex Mono, monospace', fontSize:'10px', color:'#FFB341', align:'center', wordWrap:{width:320} }).setOrigin(0.5,0);
    });
    this.add.text(195, 582, 'К ЭКЗАМЕНУ → ПРАКТИКА', { fontFamily:'Inter, sans-serif', fontSize:'12px', color:'#03110f' }).setOrigin(0.5);
    renderBottomNav(this, 'MoreScene', navForEpoch(p.level));
  }
}
