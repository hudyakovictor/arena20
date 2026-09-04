import Phaser from 'phaser';
import { gameState } from '../state/GameState';
import { cards } from '../data/cards';
import { enemies, enemyById } from '../data/enemies';
import { epochOf } from '../config/epochConfig';
import { enemyAvatarKey, enemyRenderKey } from '../engine/assetKeys';

const COLORS={ bg:0x070B14, surface:0x0C1323, elevated:0x111B2E, border:0x22304A, cyan:0x31D6C4, good:0x3BDE8A, bad:0xFF596D, muted:0x62708A, strong:0x344563, text:0xE9F2FF };

// Коллекция — трофеи-стадии, а не дубликаты (ТЗ Часть 6 §4.2 EnemyTrophy)
// Master рендер один на врага, стадии — слои, пресеты собираются скриптом
export class CollectionScene extends Phaser.Scene {
  constructor(){ super({ key:'CollectionScene'}); }
  create(): void {
    const p=gameState.progress;
    const ep=epochOf(p.level);
    this.cameras.main.setBackgroundColor(ep.tokens.bg as any);
    this.add.text(14,14,'Коллекция', { fontFamily:'Inter, sans-serif', fontSize:'22px', color:'#E9F2FF'});
    this.add.text(14,40, `${cards.filter(c=> gameState.isCardUnlocked(c.id)).length} КАРТ · ${Object.keys(p.enemyStagesReached).length} ТРОФЕЕВ · КОМБО ${p.combosUnlocked.length}`, { fontFamily:'IBM Plex Mono, monospace', fontSize:'9px', color:'#62708A'});
    this.add.text(14,52,'трофей эволюционирует слоями S1→S4, дубликатов нет', { fontFamily:'IBM Plex Mono, monospace', fontSize:'7px', color:'#62708A'});

    // карты 3×N
    this.add.text(14,66,'КАРТЫ НАВЫКОВ — рамка = ранг (ТЗ §5.2)', { fontFamily:'IBM Plex Mono, monospace', fontSize:'7px', color:'#93A3BC'});
    cards.slice(0,9).forEach((c,i)=>{
      const cx=14+(i%3)*122, cy=80+Math.floor(i/3)*74;
      const unlocked=gameState.isCardUnlocked(c.id);
      const rank=p.cardRanks[c.id]??0;
      const col = !unlocked? 0x22304A : rank>=3? 0xFFB341 : rank>=2? 0x3BDE8A : 0x31D6C4;
      const bg = !unlocked? 0x060A12 : 0x0C1323;
      this.add.rectangle(cx,cy,114,68, bg).setStrokeStyle(unlocked && rank>=2?2:1, col).setOrigin(0).setInteractive().on('pointerdown', ()=>{
        if(!unlocked){ this.cameras.main.flash(60,255,89,109); return; }
        const sheet=this.add.rectangle(0,0,390,844, 0x070B14, 0.92).setOrigin(0).setInteractive();
        this.add.text(195, 260, c.name, { fontFamily:'Inter, sans-serif', fontSize:'16px', color:'#E9F2FF'}).setOrigin(0.5);
        this.add.text(195, 280, `РАНГ ${rank||1}/3 · пороги ${c.rankThresholds.join('/') } атомов`, { fontFamily:'IBM Plex Mono, monospace', fontSize:'8px', color: toHex(col)}).setOrigin(0.5);
        this.add.text(195, 310, c.atoms.map(a=>a.desc).join(' · '), { fontFamily:'IBM Plex Mono, monospace', fontSize:'7px', color:'#93A3BC', wordWrap:{width:340}, align:'center'}).setOrigin(0.5);
        this.add.text(195, 360, 'ОБЯЗАТЕЛЬНЫЕ ИСТОЧНИКИ: '+c.mandatorySources.join(', '), { fontFamily:'IBM Plex Mono, monospace', fontSize:'7px', color:'#62708A'}).setOrigin(0.5);
        this.add.text(195, 380, 'ATOM ОБЯЗАН ИСПОЛЬЗОВАТЬСЯ В АРЕНЕ — иначе декоративный и удаляется', { fontFamily:'IBM Plex Mono, monospace', fontSize:'7px', color:'#FF596D', wordWrap:{width:340}, align:'center'}).setOrigin(0.5);
        this.add.text(195, 520,'✕ закрыть', { fontFamily:'Inter, sans-serif', fontSize:'12px', color:'#93A3BC'}).setOrigin(0.5).setInteractive().on('pointerdown', ()=> sheet.destroy());
        // clickable atoms close
        this.input.once('pointerdown', ()=> sheet.destroy());
      });
      this.add.text(cx+57, cy+22, c.icon, { fontSize:'16px', color: toHex(col)}).setOrigin(0.5);
      this.add.text(cx+57, cy+38, unlocked? c.short:'?', { fontFamily:'IBM Plex Mono, monospace', fontSize:'8px', color: unlocked?'#93A3BC':'#62708A'}).setOrigin(0.5);
      this.add.text(cx+57, cy+52, `r${rank|| (unlocked?1:0)}/3`, { fontFamily:'IBM Plex Mono, monospace', fontSize:'7px', color: toHex(col)}).setOrigin(0.5);
    });

    // трофеи врагов — эволюция
    this.add.text(14, 322,'ТРОФЕИ — враг 3–4 стадии, S3 обязательно второй домен (ТЗ §4.8)', { fontFamily:'IBM Plex Mono, monospace', fontSize:'7px', color:'#93A3BC'});
    const toShow = enemies.slice(0,8);
    toShow.forEach((e,i)=>{
      const cx=14+(i%4)*94, cy=338+Math.floor(i/4)*96;
      const stage=p.enemyStagesReached[e.id]??0;
      const mastered = stage>=3;
      const col = stage===0? 0x22304A : mastered? 0xFFB341 : 0xB783FF;
      this.add.rectangle(cx,cy,86,86, 0x0C1323).setStrokeStyle(1, col).setOrigin(0).setInteractive().on('pointerdown', ()=>{
        const sheet=this.add.rectangle(0,0,390,844, 0x070B14, 0.94).setOrigin(0).setInteractive();
        this.add.text(195, 248, e.name, { fontFamily:'Inter, sans-serif', fontSize:'16px', color:'#E9F2FF'}).setOrigin(0.5);
        this.add.text(195, 266, `${e.domain} · ранг ${e.rankDanger} · ${e.mode}`, { fontFamily:'IBM Plex Mono, monospace', fontSize:'8px', color:'#93A3BC'}).setOrigin(0.5);
        // заглушка-рендер достигнутой стадии (SVG → текстура)
        const reachedStage = e.stages.find(s=> stage>=s.stage) ?? e.stages[0];
        const renderKey = enemyRenderKey(e.id, reachedStage.stage);
        if(this.textures.exists(renderKey)){
          this.add.rectangle(195, 288, 92, 92, 0x060A12).setStrokeStyle(1, col).setOrigin(0.5,0);
          this.add.image(195, 334, renderKey).setDisplaySize(80,80);
        }
        e.stages.forEach((s,j)=>{
          const yy=388+j*36;
          const reached = stage>=s.stage;
          this.add.rectangle(20,yy,350,34, reached? 0x0C1323:0x060A12).setStrokeStyle(1, reached? 0x344563:0x22304A).setOrigin(0);
          this.add.text(28, yy+6, `S${s.stage} · L${s.level} · ${s.requiredCards.map(c=>c.cardId+'r'+c.rank).join(' + ')}`, { fontFamily:'IBM Plex Mono, monospace', fontSize:'7px', color: reached?'#E9F2FF':'#62708A'}).setOrigin(0);
          this.add.text(28, yy+18, s.factor, { fontFamily:'Inter, sans-serif', fontSize:'8px', color: reached?'#93A3BC':'#62708A', wordWrap:{width:334}}).setOrigin(0);
          if(s.secondDomain) this.add.text(322, yy+6, s.secondDomain.slice(0,3), { fontFamily:'IBM Plex Mono, monospace', fontSize:'7px', color:'#FFB341'}).setOrigin(0);
        });
        this.add.text(195, 560, 'Слои S2–S4 — одна поза мастера + альфа-слои. Пресеты собираются скриптом.', { fontFamily:'IBM Plex Mono, monospace', fontSize:'7px', color:'#62708A', wordWrap:{width:340}}).setOrigin(0.5);
        this.add.text(195, 606,'✕ закрыть', { fontFamily:'Inter, sans-serif', fontSize:'12px', color:'#93A3BC'}).setOrigin(0.5).setInteractive().on('pointerdown', ()=> sheet.destroy());
      });
      // аватар — тизер 5-8% rim до раскрытия (SVG-заглушка)
      this.add.circle(cx+43, cy+28, 20, 0x060A12).setStrokeStyle(1, col);
      const avKey = enemyAvatarKey(e.id);
      if(this.textures.exists(avKey)){
        this.add.image(cx+43, cy+28, avKey).setDisplaySize(34,34).setAlpha(stage? 1:0.7);
      } else {
        this.add.text(cx+43, cy+28, stage? '◉':'?', { fontFamily:'IBM Plex Mono, monospace', fontSize:'12px', color: toHex(col)}).setOrigin(0.5);
      }
      this.add.text(cx+43, cy+54, e.name.split(' ')[0].slice(0,8), { fontFamily:'IBM Plex Mono, monospace', fontSize:'7px', color:'#93A3BC'}).setOrigin(0.5);
      this.add.text(cx+43, cy+66, stage? `S${stage}/4`:'SILHOUETTE', { fontFamily:'IBM Plex Mono, monospace', fontSize:'7px', color: stage?'#3BDE8A':'#62708A'}).setOrigin(0.5);
      if(stage) this.add.rectangle(cx, cy+78, 86, 4, col).setOrigin(0);
    });

    // ошибки — свиток (M7)
    this.add.text(14, 540,'СВИТОК ОШИБОК — приоритет разминки (M7)', { fontFamily:'IBM Plex Mono, monospace', fontSize:'7px', color:'#FFB341'});
    if(p.errorScroll.length===0){
      this.add.text(14,556,'пока пусто — ошибайся, чтобы учиться', { fontFamily:'IBM Plex Mono, monospace', fontSize:'8px', color:'#62708A'});
    } else {
      p.errorScroll.slice(0,3).forEach((e,i)=>{
        const ey=556+i*36;
        this.add.rectangle(14,ey,362,32, e.closed? 0x060A12:0x0C1323).setStrokeStyle(1, e.closed? COLORS.border: COLORS.bad).setOrigin(0);
        this.add.text(22,ey+6, `${e.enemy} · ${e.atom} · улика: ${e.missedEvidence.slice(0,22)||'нет'}`, { fontFamily:'IBM Plex Mono, monospace', fontSize:'7px', color: e.closed?'#62708A':'#FF596D', wordWrap:{width:340}}).setOrigin(0);
        this.add.text(22,ey+18, e.closed?'CLOSED — сгорела':'OPEN — будет в разминке мутированной и сложнее', { fontFamily:'IBM Plex Mono, monospace', fontSize:'7px', color:'#62708A'}).setOrigin(0);
      });
    }

    // калибровка M3
    if(p.calibration.length>2){
      const last5=p.calibration.slice(-10);
      const avgPred = last5.reduce((a,b)=>a+b.predicted,0)/last5.length;
      const avgActual = last5.reduce((a,b)=>a+b.actual,0)/last5.length;
      const gap = avgPred - avgActual;
      this.add.text(14, 680, `M3 КАЛИБРОВКА: предсказано ${avgPred.toFixed(2)} · факт ${avgActual.toFixed(2)} · разрыв ${gap>0?'+':''}${gap.toFixed(2)} ${gap>0.15?'→ риск Hubris Dragon':''}`, { fontFamily:'IBM Plex Mono, monospace', fontSize:'7px', color: gap>0.15?'#FF596D':'#93A3BC', wordWrap:{width:362}}).setOrigin(0);
    }

    // комбо
    this.add.text(14, 708,'КОМБО КАРТ (M8): двойки с L28, тройки с L51 — требуются на S3–S4', { fontFamily:'IBM Plex Mono, monospace', fontSize:'7px', color:'#31D6C4'});
    const combos=['K01 C1+C2 Подтв. свеча','K07 C6+C2 Новость у уровня','K03 C2+C4 Стоп по структуре','T02 C4+C10+C14 Выживание'];
    combos.forEach((c,i)=>{
      this.add.rectangle(14,722+i*16,362,14, 0x0C1323).setStrokeStyle(1, COLORS.border).setOrigin(0);
      this.add.text(20,722+i*16+3,c, { fontFamily:'IBM Plex Mono, monospace', fontSize:'7px', color:'#93A3BC'}).setOrigin(0);
    });

    this.createBottomNav();
  }
  private createBottomNav(){
    const items=[
      {label:'ACADEMY', go:'AcademyScene'},
      {label:'ARENA', go:'ArenaScene'},
      {label:'COLLECTION', active:true},
      {label:'MORE', go:'MoreScene'},
    ] as any[];
    items.forEach((it,i)=>{
      const nx=i*(390/4);
      this.add.rectangle(nx,784,390/4,60, COLORS.elevated).setStrokeStyle(1, COLORS.border).setOrigin(0).setInteractive().on('pointerdown', ()=>{ if(it.go) this.scene.start(it.go); });
      this.add.text(nx+390/8,814,it.label, { fontFamily:'IBM Plex Mono, monospace', fontSize:'8px', color: it.active?'#31D6C4':'#62708A'}).setOrigin(0.5);
    });
  }
}
function toHex(n:number){ return '#'+n.toString(16).padStart(6,'0'); }
