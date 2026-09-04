import Phaser from 'phaser';
import { gameState } from '../state/GameState';
import { epochOf } from '../config/epochConfig';
import { renderTopBar, renderBottomNav, navForEpoch } from '../engine/shell';

const W = 390, H = 844;
const WMODES: Record<string,string> = { TREND:'ТРЕНД — следуй структуре', FLAT:'ФЛЭТ — жди границ', VOLATILE:'ВОЛАТИЛЬНОСТЬ — размер от ATR', NEWS:'ДЕНЬ НОВОСТЕЙ — факт vs шум', LATE_CYCLE:'ПОЗДНИЙ ЦИКЛ — жадность на пике' };

// Разминка дня (M13 погода + M7 свиток приоритем) — короткая сессия, всегда в новой мутации.
export class DailyWarmupScene extends Phaser.Scene {
  constructor(){ super({ key:'DailyWarmupScene' }); }
  create(){
    const p = gameState.progress;
    const ep = epochOf(p.level);
    this.cameras.main.setBackgroundColor(ep.tokens.bg as any);
    renderTopBar(this, gameState);
    this.add.text(14, 68, 'РАЗМИНКА ДНЯ', { fontFamily:'Inter, system-ui, sans-serif', fontSize:'20px', color:'#E9F2FF' });

    // погода M13
    this.add.rectangle(14, 104, 362, 58, 0x0C1323).setStrokeStyle(1, 0x31D6C4).setOrigin(0);
    this.add.text(24, 116, 'ПОГОДА СЕГОДНЯ', { fontFamily:'IBM Plex Mono, monospace', fontSize:'8px', color:'#62708A' });
    this.add.text(24, 134, WMODES[p.weather] ?? WMODES.TREND, { fontFamily:'Inter, sans-serif', fontSize:'12px', color:'#E9F2FF' });

    // очередь из свитка + стадий (упрощённо)
    this.add.text(14, 180, 'ОЧЕРЕДЬ РАЗМИНКИ', { fontFamily:'IBM Plex Mono, monospace', fontSize:'9px', color:'#FFB341' });
    const open = p.errorScroll.filter(e=>!e.closed);
    const queue: {label:string, sub:string, src:string}[] = [];
    open.slice(0,3).forEach(e=> queue.push({ label:`M7 · ${e.enemy} · ${e.atom}`, sub:'мутированная · сложнее', src:'error-scroll' }));
    if(queue.length<4) queue.push({ label:'M13 · назови режим', sub:'первая задача', src:'weather' });
    if(queue.length<4) queue.push({ label:'M12 · следующая стадия кампании', sub:'+новый фактор', src:'campaign' });
    queue.slice(0,4).forEach((q,i)=>{
      const y=200+i*44;
      this.add.rectangle(14, y, 362, 38, 0x0C1323).setStrokeStyle(1, i===0? 0xFFB341:0x22304A).setOrigin(0);
      this.add.text(24, y+8, q.label, { fontFamily:'IBM Plex Mono, monospace', fontSize:'9px', color:'#E9F2FF' });
      this.add.text(24, y+24, q.sub, { fontFamily:'IBM Plex Mono, monospace', fontSize:'8px', color:'#62708A' });
      this.add.text(344, y+19, String(i+1), { fontFamily:'IBM Plex Mono, monospace', fontSize:'12px', color:i===0?'#FFB341':'#62708A' }).setOrigin(0.5);
    });

    this.add.rectangle(14, 390, 362, 44, 0x31D6C4).setOrigin(0).setInteractive().on('pointerdown', ()=>{
      this.scene.start('ArenaScene');
    });
    this.add.text(195, 412, 'НАЧАТЬ РАЗМИНКУ →', { fontFamily:'Inter, sans-serif', fontSize:'12px', color:'#03110f' }).setOrigin(0.5);
    this.add.text(14, 448, 'От простого к сложному, всегда в новых сценариях.\nРазминка не копирует прошлые задания.', { fontFamily:'IBM Plex Mono, monospace', fontSize:'8px', color:'#62708A', wordWrap:{width:340} });
    renderBottomNav(this, 'MoreScene', navForEpoch(p.level));
  }
}
