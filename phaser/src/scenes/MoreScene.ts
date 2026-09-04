import Phaser from 'phaser';
import { gameState } from '../state/GameState';
import { epochOf } from '../config/epochConfig';
import { renderTopBar, renderBottomNav, navForEpoch } from '../engine/shell';

const W = 390, H = 844;
const S = { bg:0x070B14, surface:0x0C1323, elevated:0x111B2E, border:0x22304A, cyan:0x31D6C4, muted:0x62708A, sub:0x93A3BC, text:0xE9F2FF };

// «Ещё» — профиль + сервисные разделы (растут с эпохой, ТЗ Часть 2 §2)
export class MoreScene extends Phaser.Scene {
  constructor(){ super({ key:'MoreScene' }); }
  create(){
    const p = gameState.progress;
    const ep = epochOf(p.level);
    this.cameras.main.setBackgroundColor(ep.tokens.bg as any);
    renderTopBar(this, gameState);
    this.add.text(14, 68, 'ЕЩЁ', { fontFamily:'Inter, system-ui, sans-serif', fontSize:'22px', color:'#E9F2FF' });

    // профиль-карточка
    this.add.rectangle(14, 104, 362, 74, S.surface).setStrokeStyle(1, S.border).setOrigin(0).setInteractive().on('pointerdown', ()=> this.openSheet('profile'));
    this.add.circle(46, 141, 24, 0x060A12).setStrokeStyle(2, S.cyan);
    const av = `enemy_${(Object.keys(p.enemyStagesReached)[0]||'E02').replace('E','')}_avatar`;
    if(this.textures.exists(av)) this.add.image(46,141,av).setDisplaySize(44,44).setAlpha(0.85);
    this.add.text(84, 118, `УРОВЕНЬ ${p.level} · ${ep.name}`, { fontFamily:'IBM Plex Mono, monospace', fontSize:'10px', color:'#E9F2FF' });
    this.add.text(84, 140, `${p.coins} SIG · ${p.streak} стрик · ${p.errorScroll.filter(e=>!e.closed).length} ошибок в свитке`, { fontFamily:'IBM Plex Mono, monospace', fontSize:'8px', color:'#62708A' });
    this.add.text(352, 141,'›', { fontFamily:'Inter, sans-serif', fontSize:'16px', color:'#62708A' }).setOrigin(0.5);

    // меню сервисных разделов
    const rows = [
      { label:'СВИТОК ОШИБОК', sub:`${p.errorScroll.filter(e=>!e.closed).length} открытых`,  scene:'ErrorJournalScene', badge: p.errorScroll.filter(e=>!e.closed).length? '#FFB341':'#62708A' },
      { label:'МАСТЕР-ЧЕК', sub:'готовность к экзамену главы', scene:'MasteryCheckScene', badge:'#31D6C4' },
      { label:'РАЗМИНКА ДНЯ', sub:`погода ${p.weather}`, scene:'DailyWarmupScene', badge:'#3BDE8A' },
      { label:'ТУРНИРЫ', sub:'асинхронные · тень', scene:'TournamentScene', badge:'#B783FF' },
      { label:'МАРКЕТ КОСМЕТИКИ', sub:'SIG только на косметику', scene:'StoreScene', badge:'#FFB341' },
      { label:'НАСТРОЙКИ', sub:'профиль, сброс демо', scene:'SettingsScene', badge:'#62708A' },
    ];
    rows.forEach((r,i)=>{
      const y = 190 + i*66;
      this.add.rectangle(14, y, 362, 58, S.surface).setStrokeStyle(1, S.border).setOrigin(0).setInteractive()
        .on('pointerdown', ()=> this.scene.start(r.scene));
      this.add.text(28, y+10, r.label, { fontFamily:'IBM Plex Mono, monospace', fontSize:'10px', color:'#E9F2FF' });
      this.add.text(28, y+34, r.sub, { fontFamily:'IBM Plex Mono, monospace', fontSize:'8px', color: r.badge });
      this.add.text(352, y+29,'›', { fontFamily:'Inter, sans-serif', fontSize:'16px', color:'#62708A' }).setOrigin(0.5);
    });

    renderBottomNav(this, 'MoreScene', navForEpoch(p.level));
  }
  private openSheet(kind:string){
    if(kind!=='profile') return;
    const p = gameState.progress;
    const ep = epochOf(p.level);
    // профиль — модалка целиком в контейнере
    const sheet = this.add.container(0,0);
    sheet.add(this.add.rectangle(0,0,W,H, 0x070B14, 0.94).setOrigin(0).setInteractive());
    sheet.add(this.add.text(195, 150, 'ПРОФИЛЬ', { fontFamily:'IBM Plex Mono, monospace', fontSize:'10px', color:'#93A3BC' }).setOrigin(0.5));
    sheet.add(this.add.text(195, 176, `УРОВЕНЬ ${p.level} · ${ep.name}`, { fontFamily:'Inter, sans-serif', fontSize:'18px', color:'#E9F2FF' }).setOrigin(0.5));
    // ключевые показатели
    const closedErrors = p.errorScroll.filter(e=>e.closed).length;
    const openErrors = p.errorScroll.filter(e=>!e.closed).length;
    const trophies = Object.keys(p.enemyStagesReached).length;
    const rows: [string,string][] = [
      ['XP', `${p.xp} / ${p.xpMax}`],
      ['SIG', String(p.coins)],
      ['БЮДЖЕТ РИСКА', `${p.riskBudget} / ${p.maxBudget}`],
      ['СТРИК', `×${p.streak}`],
      ['ТРОФЕИ', `${trophies} врагов`],
      ['СВИТОК ОШИБОК', `${openErrors} открыто · ${closedErrors} закрыто`],
      ['ПОГОДА РЫНКА', p.weather],
    ];
    rows.forEach((r,i)=>{
      const y = 210 + i*44;
      sheet.add(this.add.rectangle(20, y, 350, 38, S.surface).setStrokeStyle(1, S.border).setOrigin(0));
      sheet.add(this.add.text(32, y+13, r[0], { fontFamily:'IBM Plex Mono, monospace', fontSize:'8px', color:'#62708A' }));
      sheet.add(this.add.text(358, y+13, r[1], { fontFamily:'IBM Plex Mono, monospace', fontSize:'9px', color:'#E9F2FF' }).setOrigin(1,0));
    });
    // калибровка M3 — если есть данные
    if(p.calibration.length>2){
      const last = p.calibration.slice(-10);
      const avgPred = last.reduce((a,b)=>a+b.predicted,0)/last.length;
      const avgActual = last.reduce((a,b)=>a+b.actual,0)/last.length;
      const gap = avgPred-avgActual;
      sheet.add(this.add.text(195, 530, `M3 КАЛИБРОВКА: уверенность ${avgPred.toFixed(2)} · факт ${avgActual.toFixed(2)} · разрыв ${gap>0?'+':''}${gap.toFixed(2)}`, { fontFamily:'IBM Plex Mono, monospace', fontSize:'8px', color: gap>0.15?'#FF596D':'#93A3BC' }).setOrigin(0.5));
    }
    sheet.add(this.add.text(195, 600, '✕ закрыть', { fontFamily:'Inter, sans-serif', fontSize:'12px', color:'#93A3BC' }).setOrigin(0.5).setInteractive().on('pointerdown', ()=> sheet.destroy()));
  }
}
